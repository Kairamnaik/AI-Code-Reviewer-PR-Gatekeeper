import express from 'express';
import { requireAuth } from '../middleware/auth.js';
import { verifyWebhookSignature } from '../middleware/webhookAuth.js';
import { redirectToGithub, githubCallback, getProfile } from '../controllers/AuthController.js';
import { getRepositories, linkRepository, unlinkRepository } from '../controllers/RepoController.js';
import { handleGithubWebhook } from '../controllers/WebhookController.js';
import { getReviews, getReviewById, getPullRequestsWithReviews } from '../controllers/ReviewController.js';
import { getStats, getChartData, getSecurityScoreDetails, getNotifications, getAuditLogs } from '../controllers/DashboardController.js';

const router = express.Router();

// Auth Routes
router.get('/auth/github', redirectToGithub);
router.get('/auth/github/callback', githubCallback);
router.get('/auth/profile', requireAuth, getProfile);

// Repository Routes
router.get('/repos', requireAuth, getRepositories);
router.post('/repos/link', requireAuth, linkRepository);
router.delete('/repos/:id', requireAuth, unlinkRepository);

// Webhook Route (verified by GitHub payload signatures)
router.post('/webhooks/github', verifyWebhookSignature, handleGithubWebhook);

// Reviews Routes
router.get('/reviews', requireAuth, getReviews);
router.get('/reviews/prs', requireAuth, getPullRequestsWithReviews);
router.get('/reviews/:id', requireAuth, getReviewById);

// Dashboard Routes
router.get('/dashboard/stats', requireAuth, getStats);
router.get('/dashboard/charts', requireAuth, getChartData);
router.get('/security-score', requireAuth, getSecurityScoreDetails);
router.get('/notifications', requireAuth, getNotifications);
router.get('/audit-logs', requireAuth, getAuditLogs);

export default router;
