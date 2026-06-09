import { Repository } from '../models/Repository.js';
import { User } from '../models/User.js';
import { PullRequest } from '../models/PullRequest.js';
import { WebhookLog } from '../models/WebhookLog.js';
import { AuditLog } from '../models/AuditLog.js';
import { addReviewJob } from '../services/queue/queue.js';

export const handleGithubWebhook = async (req, res) => {
  const eventType = req.headers['x-github-event'] || 'unknown';
  const payload = req.body;

  console.log(`[Webhook Controller] Received event: ${eventType}`);

  // Create WebhookLog record
  let logRecord = await WebhookLog.create({
    eventType,
    payload,
    status: 'pending'
  });

  try {
    if (eventType === 'ping') {
      await WebhookLog.updateOne({ _id: logRecord._id }, { $set: { status: 'success' } });
      return res.status(200).send('pong');
    }

    if (eventType === 'pull_request') {
      const { action, pull_request, repository } = payload;
      const prNumber = pull_request.number;
      const repoId = repository.id.toString();

      console.log(`[Webhook Controller] PR #${prNumber} action: ${action} on repo ${repoId}`);

      // We only care about opened, reopened, and synchronize (code updates)
      if (['opened', 'reopened', 'synchronize'].includes(action)) {
        // Find if repo is linked in our database
        const dbRepo = await Repository.findOne({ repoId });
        if (!dbRepo) {
          console.warn(`[Webhook Controller] Webhook received for unlinked repository ID: ${repoId}`);
          await WebhookLog.updateOne(
            { _id: logRecord._id },
            { $set: { status: 'failed', error: 'Repository not linked in database.' } }
          );
          return res.status(200).json({ message: 'Repository is not connected, ignoring.' });
        }

        // Get token of the user who connected the repo
        const user = await User.findOne({ githubId: dbRepo.userId });
        if (!user) {
          console.warn(`[Webhook] Connector user ${dbRepo.userId} not found.`);
          await WebhookLog.updateOne(
            { _id: logRecord._id },
            { $set: { status: 'failed', error: 'Repository owner credentials missing.' } }
          );
          return res.status(200).json({ message: 'User credentials not found, ignoring.' });
        }

        // Create or update PullRequest record
        const pr = await PullRequest.updateOne(
          { repositoryId: dbRepo._id, prNumber },
          {
            $set: {
              title: pull_request.title,
              author: pull_request.user.login,
              branch: pull_request.head.ref,
              status: pull_request.state // open, closed
            }
          },
          { upsert: true }
        );

        // Fetch PR record to get the database id
        const dbPr = await PullRequest.findOne({ repositoryId: dbRepo._id, prNumber });

        // Queue Review Job
        await addReviewJob({
          prId: dbPr._id,
          prNumber,
          repoId,
          repoName: dbRepo.repoName,
          owner: dbRepo.owner,
          author: pull_request.user.login,
          accessToken: user.accessToken,
          commitId: pull_request.head.sha
        });

        // Audit & Log Webhook
        await AuditLog.create({
          action: 'WEBHOOK_EVENT',
          user: 'GitHub Webhook',
          details: `Queued PR Review for ${dbRepo.owner}/${dbRepo.repoName} PR #${prNumber}`
        });

        await WebhookLog.updateOne({ _id: logRecord._id }, { $set: { status: 'success' } });
        return res.status(200).json({ message: 'Review job enqueued successfully.' });
      }

      // Handle close event to update status
      if (action === 'closed') {
        const dbRepo = await Repository.findOne({ repoId });
        if (dbRepo) {
          await PullRequest.updateOne(
            { repositoryId: dbRepo._id, prNumber },
            { $set: { status: pull_request.merged ? 'merged' : 'closed' } }
          );
        }
        await WebhookLog.updateOne({ _id: logRecord._id }, { $set: { status: 'success' } });
        return res.status(200).json({ message: 'PR status updated to closed.' });
      }
    }

    // Default response for ignored webhook actions
    await WebhookLog.updateOne({ _id: logRecord._id }, { $set: { status: 'success' } });
    res.status(200).json({ message: 'Webhook event received and logged.' });
  } catch (err) {
    console.error('[Webhook Controller] Handler failed:', err.message);
    await WebhookLog.updateOne(
      { _id: logRecord._id },
      { $set: { status: 'failed', error: err.message } }
    );
    res.status(500).json({ error: 'Webhook processing failed.' });
  }
};
