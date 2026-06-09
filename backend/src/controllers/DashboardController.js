import { Repository } from '../models/Repository.js';
import { PullRequest } from '../models/PullRequest.js';
import { Review } from '../models/Review.js';
import { AuditLog } from '../models/AuditLog.js';
import { Notification } from '../models/Notification.js';

export const getStats = async (req, res) => {
  try {
    const totalRepos = await Repository.countDocuments();
    const totalPRs = await PullRequest.countDocuments();
    const totalReviews = await Review.countDocuments();

    // Average security score
    const repos = await Repository.find();
    let securityScore = 100;
    if (repos.length > 0) {
      const sum = repos.reduce((acc, r) => acc + (r.securityScore || 100), 0);
      securityScore = Math.round(sum / repos.length);
    }

    res.json({
      totalRepositories: totalRepos,
      totalPullRequests: totalPRs,
      totalReviews,
      issuesFound: totalReviews,
      securityScore
    });
  } catch (err) {
    console.error('[DashboardController] Fetch stats failed:', err.message);
    res.status(500).json({ error: 'Failed to retrieve dashboard stats.' });
  }
};

export const getChartData = async (req, res) => {
  try {
    // 1. Reviews per day (last 7 days)
    const reviewsPerDay = [];
    const reviews = await Review.find();
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const count = reviews.filter(r => {
        const rDate = new Date(r.createdAt).toISOString().split('T')[0];
        return rDate === dateStr;
      }).length;
      reviewsPerDay.push({
        date: new Date(dateStr).toLocaleDateString('en-US', { weekday: 'short', month: 'numeric', day: 'numeric' }),
        reviews: count
      });
    }

    // 2. Issues by severity
    const severities = ['Critical', 'High', 'Medium', 'Low', 'Info'];
    const issuesBySeverity = severities.map(sev => {
      const count = reviews.filter(r => r.severity === sev).length;
      return { name: sev, value: count };
    });

    // 3. Repository activity (PRs per repository)
    const repoActivity = [];
    const repos = await Repository.find();
    for (const repo of repos) {
      const count = await PullRequest.countDocuments({ repositoryId: repo._id });
      repoActivity.push({
        name: repo.repoName,
        prCount: count
      });
    }

    // 4. Security Trend (Mock trend points for smooth visualization)
    const securityTrend = [];
    const baseScore = repos.length > 0 
      ? Math.round(repos.reduce((acc, r) => acc + (r.securityScore || 100), 0) / repos.length)
      : 100;
    for (let i = 4; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i * 2);
      // Generate realistic slight fluctuations ending at current score
      const fluctuation = i === 0 ? 0 : Math.floor(Math.sin(i) * 5);
      securityTrend.push({
        date: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        score: Math.min(100, Math.max(0, baseScore + fluctuation))
      });
    }

    res.json({
      reviewsPerDay,
      issuesBySeverity,
      repoActivity,
      securityTrend
    });
  } catch (err) {
    console.error('[DashboardController] Fetch charts failed:', err.message);
    res.status(500).json({ error: 'Failed to retrieve chart data.' });
  }
};

export const getSecurityScoreDetails = async (req, res) => {
  try {
    const repos = await Repository.find();
    const prs = await PullRequest.find();
    const reviews = await Review.find();

    let repositoryScore = 100;
    if (repos.length > 0) {
      repositoryScore = Math.round(repos.reduce((acc, r) => acc + (r.securityScore || 100), 0) / repos.length);
    }

    let prScore = 100;
    if (prs.length > 0) {
      // average PR scores
      let totalPrPenalties = 0;
      for (const pr of prs) {
        const prReviews = reviews.filter(r => r.prId === pr._id);
        let penalties = 0;
        prReviews.forEach(r => {
          if (r.severity === 'Critical') penalties += 30;
          else if (r.severity === 'High') penalties += 15;
          else if (r.severity === 'Medium') penalties += 8;
          else if (r.severity === 'Low') penalties += 3;
        });
        totalPrPenalties += Math.max(0, 100 - penalties);
      }
      prScore = Math.round(totalPrPenalties / prs.length);
    }

    res.json({
      repositoryScore,
      prScore,
      trendScore: repositoryScore // Uses base score as current baseline
    });
  } catch (err) {
    console.error('[DashboardController] Fetch security details failed:', err.message);
    res.status(500).json({ error: 'Failed to fetch security score data.' });
  }
};

export const getNotifications = async (req, res) => {
  try {
    // Get notifications sorted by newest
    const notifications = await Notification.find().sort({ createdAt: -1 }).limit(20);
    res.json(notifications);
  } catch (err) {
    console.error('[DashboardController] Fetch notifications failed:', err.message);
    res.status(500).json({ error: 'Failed to retrieve notifications.' });
  }
};

export const getAuditLogs = async (req, res) => {
  try {
    const logs = await AuditLog.find().sort({ timestamp: -1 }).limit(50);
    res.json(logs);
  } catch (err) {
    console.error('[DashboardController] Fetch audit logs failed:', err.message);
    res.status(500).json({ error: 'Failed to retrieve audit logs.' });
  }
};
