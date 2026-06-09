import { Review } from '../models/Review.js';
import { PullRequest } from '../models/PullRequest.js';
import { Repository } from '../models/Repository.js';

export const getReviews = async (req, res) => {
  const { repositoryId, severity, status, search } = req.query;

  try {
    const query = {};

    if (severity) {
      query.severity = severity;
    }

    let prQuery = {};
    if (repositoryId) {
      prQuery.repositoryId = repositoryId;
    }
    if (status) {
      prQuery.status = status;
    }

    // Filter by PRs first if repositoryId or status filters are applied
    let matchingPrIds = [];
    if (repositoryId || status) {
      const prs = await PullRequest.find(prQuery);
      matchingPrIds = prs.map(p => p._id);
      query.prId = { $in: matchingPrIds };
    }

    let reviews = await Review.find(query).sort({ createdAt: -1 });

    // Populate PR and Repository info manually (works for both Mongoose and local file fallback)
    const populatedReviews = [];
    for (const review of reviews) {
      const pr = await PullRequest.findById(review.prId);
      if (!pr) continue;

      const repo = await Repository.findById(pr.repositoryId);
      if (!repo) continue;

      // Search filter check
      if (search) {
        const searchRegex = new RegExp(search, 'i');
        const matchesSearch = 
          searchRegex.test(review.issue) || 
          searchRegex.test(review.file) || 
          searchRegex.test(repo.repoName);
        if (!matchesSearch) continue;
      }

      populatedReviews.push({
        ...review,
        prNumber: pr.prNumber,
        prTitle: pr.title,
        prAuthor: pr.author,
        prStatus: pr.status,
        repoName: repo.repoName,
        repoOwner: repo.owner
      });
    }

    res.json(populatedReviews);
  } catch (err) {
    console.error('[ReviewController] Fetch reviews failed:', err.message);
    res.status(500).json({ error: 'Failed to retrieve review records.' });
  }
};

export const getReviewById = async (req, res) => {
  const { id } = req.params;

  try {
    const review = await Review.findById(id);
    if (!review) {
      return res.status(404).json({ error: 'Review record not found.' });
    }

    const pr = await PullRequest.findById(review.prId);
    const repo = pr ? await Repository.findById(pr.repositoryId) : null;

    res.json({
      ...review,
      prNumber: pr ? pr.prNumber : null,
      prTitle: pr ? pr.title : '',
      repoName: repo ? repo.repoName : '',
      repoOwner: repo ? repo.owner : ''
    });
  } catch (err) {
    console.error('[ReviewController] Fetch review by ID failed:', err.message);
    res.status(500).json({ error: 'Failed to retrieve review record.' });
  }
};

export const getPullRequestsWithReviews = async (req, res) => {
  try {
    const prs = await PullRequest.find().sort({ createdAt: -1 });
    const result = [];

    for (const pr of prs) {
      const repo = await Repository.findById(pr.repositoryId);
      if (!repo) continue;

      const reviews = await Review.find({ prId: pr._id });

      const severityCounts = {
        Critical: 0,
        High: 0,
        Medium: 0,
        Low: 0,
        Info: 0
      };

      reviews.forEach(r => {
        if (severityCounts[r.severity] !== undefined) {
          severityCounts[r.severity]++;
        }
      });

      let penalties = 0;
      reviews.forEach(r => {
        if (r.severity === 'Critical') penalties += 30;
        else if (r.severity === 'High') penalties += 15;
        else if (r.severity === 'Medium') penalties += 8;
        else if (r.severity === 'Low') penalties += 3;
      });
      const securityScore = Math.max(0, 100 - penalties);

      result.push({
        _id: pr._id,
        prNumber: pr.prNumber,
        title: pr.title,
        author: pr.author,
        branch: pr.branch,
        status: pr.status,
        createdAt: pr.createdAt,
        repoName: repo.repoName,
        repoOwner: repo.owner,
        totalIssues: reviews.length,
        severityCounts,
        securityScore
      });
    }

    res.json(result);
  } catch (err) {
    console.error('[ReviewController] Fetch PRs with reviews failed:', err.message);
    res.status(500).json({ error: 'Failed to retrieve Pull Requests.' });
  }
};
