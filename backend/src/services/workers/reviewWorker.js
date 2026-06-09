import { getPullRequestFiles, createReviewComment, getFileContent } from '../github/octokitService.js';
import { parsePatch } from '../../utils/diffParser.js';
import { analyzeAST } from '../../utils/astAnalyzer.js';
import { reviewCode } from '../ai/reviewEngine.js';
import { Review } from '../../models/Review.js';
import { PullRequest } from '../../models/PullRequest.js';
import { Repository } from '../../models/Repository.js';
import { AuditLog } from '../../models/AuditLog.js';
import { Notification } from '../../models/Notification.js';
import { updateRepositoryScore } from '../../utils/scoringEngine.js';

const IGNORED_EXTENSIONS = ['.png', '.jpg', '.jpeg', '.gif', '.svg', '.ico', '.webp', '.pdf', '.zip', '.tar.gz', '.mp3', '.wav', '.mp4'];
const IGNORED_PATHS = ['node_modules/', 'build/', 'dist/', '.next/', 'out/', 'package-lock.json', 'yarn.lock', 'pnpm-lock.yaml'];

const isIgnoredFile = (filename) => {
  const lowercase = filename.toLowerCase();
  // Check path matches
  if (IGNORED_PATHS.some(p => lowercase.includes(p))) {
    return true;
  }
  // Check extension matches
  if (IGNORED_EXTENSIONS.some(ext => lowercase.endsWith(ext))) {
    return true;
  }
  return false;
};

/**
 * Generates formatting for a GitHub review comment
 * @param {string} severity 
 * @param {string} issue 
 * @param {string} explanation 
 * @param {string} fix 
 */
const formatComment = (severity, issue, explanation, fix) => {
  let emoji = 'ℹ️';
  if (severity === 'Critical') emoji = '🚨 **CRITICAL**';
  else if (severity === 'High') emoji = '⚠️ **HIGH**';
  else if (severity === 'Medium') emoji = '💡 **MEDIUM**';
  else if (severity === 'Low') emoji = '🔍 **LOW**';

  return `### AI Review Finding - ${emoji}

**Issue:** ${issue}

**Explanation:** ${explanation}

${fix ? `**Suggested Fix:**
\`\`\`javascript
${fix}
\`\`\`` : ''}`;
};

/**
 * Background worker task processor
 * @param {Object} job 
 */
export const processReviewJob = async (job) => {
  const { prId, prNumber, repoId, repoName, owner, author, accessToken, commitId } = job.data;

  console.log(`[Review Worker] Starting review for job: ${job.id} (${owner}/${repoName} PR #${prNumber})`);

  try {
    // 1. Fetch files from GitHub
    const files = await getPullRequestFiles(accessToken, owner, repoName, prNumber);
    console.log(`[Review Worker] Fetched ${files.length} files for review.`);

    let totalFindings = 0;
    let criticalFindings = 0;

    // 2. Iterate and review modified files
    for (const file of files) {
      if (isIgnoredFile(file.filename)) {
        console.log(`[Review Worker] Ignoring file: ${file.filename}`);
        continue;
      }

      // Parse patch to get modified lines
      const addedLines = parsePatch(file.patch);
      if (addedLines.length === 0) {
        console.log(`[Review Worker] No added lines in patch for: ${file.filename}`);
        continue;
      }

      // Fetch full file content and perform AST analysis
      let astContext = null;
      if (file.filename.endsWith('.js') || file.filename.endsWith('.jsx') || file.filename.endsWith('.ts') || file.filename.endsWith('.tsx')) {
        try {
          console.log(`[Review Worker] Running AST static analysis for: ${file.filename}`);
          const fullContent = await getFileContent(accessToken, owner, repoName, file.filename, commitId);
          if (fullContent) {
            astContext = analyzeAST(fullContent, file.filename);
            console.log(`[Review Worker] AST analysis complete. Functions: ${astContext.functions.length}, Classes: ${astContext.classes.length}`);
          }
        } catch (astErr) {
          console.error(`[Review Worker] Failed AST static analysis:`, astErr.message);
        }
      }

      // Review code changes via Gemini AI / local fallback
      const findings = await reviewCode(file.filename, file.patch, addedLines, astContext);

      for (const finding of findings) {
        const { severity, issue, line, explanation, fix } = finding;

        // Check if exact same finding was already posted on this line/file/pr to prevent duplication
        const duplicate = await Review.findOne({
          prId,
          file: file.filename,
          lineNumber: line,
          issue
        });

        if (duplicate) {
          console.log(`[Review Worker] Skipping duplicate finding in ${file.filename}:${line}`);
          continue;
        }

        // Format GitHub comment
        const commentBody = formatComment(severity, issue, explanation, fix);

        // Post comment on GitHub Pull Request
        let commentId = null;
        try {
          const ghComment = await createReviewComment(
            accessToken,
            owner,
            repoName,
            prNumber,
            commitId,
            file.filename,
            line,
            commentBody
          );
          commentId = ghComment.id;
        } catch (commentErr) {
          console.error(`[Review Worker] Failed to post comment on GitHub:`, commentErr.message);
        }

        // Save finding in DB
        await Review.create({
          prId,
          file: file.filename,
          severity,
          issue,
          explanation,
          fix,
          lineNumber: line,
          commentId
        });

        totalFindings++;
        if (severity === 'Critical') criticalFindings++;
      }
    }

    // 3. Re-calculate repository security score
    const dbPr = await PullRequest.findById(prId);
    if (dbPr) {
      const repo = await Repository.findById(dbPr.repositoryId);
      if (repo) {
        const newScore = await updateRepositoryScore(repo._id);
        console.log(`[Review Worker] Repostory ${repo.repoName} security score updated to: ${newScore}`);
      }
    }

    // 4. Create Notification
    let notificationType = 'SUCCESS';
    let notificationTitle = 'Review Completed';
    if (criticalFindings > 0) {
      notificationType = 'ERROR';
      notificationTitle = 'Critical Vulnerability Detected';
    } else if (totalFindings > 0) {
      notificationType = 'WARNING';
      notificationTitle = 'Review Completed with Warnings';
    }

    await Notification.create({
      type: notificationType,
      title: notificationTitle,
      message: `Completed AI code review for ${owner}/${repoName} PR #${prNumber}. Identified ${totalFindings} issues (${criticalFindings} critical).`
    });

    // 5. Audit Log
    await AuditLog.create({
      action: 'AI_REVIEW',
      user: 'Review Worker',
      details: `Completed AI review for ${owner}/${repoName} PR #${prNumber}. Found ${totalFindings} issues.`
    });

    console.log(`[Review Worker] Successfully completed PR #${prNumber} review. Found ${totalFindings} issues.`);
  } catch (err) {
    console.error(`[Review Worker] Job failed:`, err.message);
    
    // Log failure notification
    await Notification.create({
      type: 'ERROR',
      title: 'Review Job Failed',
      message: `Failed to complete review for ${owner}/${repoName} PR #${prNumber}. Error: ${err.message}`
    });

    await AuditLog.create({
      action: 'AI_REVIEW_FAILED',
      user: 'Review Worker',
      details: `Failed review for ${owner}/${repoName} PR #${prNumber}: ${err.message}`
    });

    throw err;
  }
};
