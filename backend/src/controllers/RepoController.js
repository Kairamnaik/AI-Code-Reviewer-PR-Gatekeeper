import { Repository } from '../models/Repository.js';
import { AuditLog } from '../models/AuditLog.js';
import { getUserRepositories, createWebhook, deleteWebhook } from '../services/github/octokitService.js';

export const getRepositories = async (req, res) => {
  try {
    const gitHubRepos = await getUserRepositories(req.user.accessToken);
    const linkedRepos = await Repository.find({ userId: req.user.githubId });

    // Map linked status and db properties
    const mapped = gitHubRepos.map(ghRepo => {
      const linked = linkedRepos.find(r => r.repoId === ghRepo.id);
      return {
        ...ghRepo,
        linked: !!linked,
        dbId: linked ? linked._id : null,
        webhookStatus: linked ? linked.webhookStatus : 'inactive',
        securityScore: linked ? linked.securityScore : 100
      };
    });

    res.json(mapped);
  } catch (err) {
    console.error('[RepoController] Fetch failed:', err.message);
    res.status(500).json({ error: 'Failed to retrieve repositories from GitHub.' });
  }
};

export const linkRepository = async (req, res) => {
  const { repoId, name, owner, visibility, defaultBranch } = req.body;

  if (!repoId || !name || !owner) {
    return res.status(400).json({ error: 'Repository information (repoId, name, owner) is required.' });
  }

  try {
    // Check if already linked
    let linked = await Repository.findOne({ repoId });
    if (linked) {
      return res.status(400).json({ error: 'Repository is already connected.' });
    }

    // Determine payload webhook url (use dynamic host or ngrok)
    const host = req.get('host');
    const protocol = req.protocol;
    // For local dev, webhookUrl can be configured in settings or dynamic, fallback to mock domain
    const webhookUrl = host.includes('localhost')
      ? `https://smee.io/mock-webhook-reviewer-dev-unique` // Placeholder or local helper
      : `${protocol}://${host}/api/webhooks/github`;
    
    // Register Webhook on GitHub
    const webhook = await createWebhook(req.user.accessToken, owner, name, webhookUrl);

    // Save Repository
    const newRepo = await Repository.create({
      userId: req.user.githubId,
      repoId,
      repoName: name,
      owner,
      visibility: visibility || 'public',
      defaultBranch: defaultBranch || 'main',
      webhookId: webhook.id,
      webhookStatus: webhook.status
    });

    // Audit Log
    await AuditLog.create({
      action: 'LINK_REPO',
      user: req.user.username,
      details: `Connected repository ${owner}/${name}`
    });

    res.status(201).json(newRepo);
  } catch (err) {
    console.error('[RepoController] Link failed:', err.message);
    res.status(500).json({ error: 'Failed to connect repository.' });
  }
};

export const unlinkRepository = async (req, res) => {
  const { id } = req.params;

  try {
    const repo = await Repository.findById(id);
    if (!repo) {
      return res.status(404).json({ error: 'Connected repository record not found.' });
    }

    // Delete webhook on GitHub
    await deleteWebhook(req.user.accessToken, repo.owner, repo.repoName, repo.webhookId);

    // Remove from DB
    await Repository.deleteOne({ _id: id });

    // Audit Log
    await AuditLog.create({
      action: 'UNLINK_REPO',
      user: req.user.username,
      details: `Disconnected repository ${repo.owner}/${repo.repoName}`
    });

    res.json({ message: 'Repository disconnected successfully.' });
  } catch (err) {
    console.error('[RepoController] Unlink failed:', err.message);
    res.status(500).json({ error: 'Failed to disconnect repository.' });
  }
};
