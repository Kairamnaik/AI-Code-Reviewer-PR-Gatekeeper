import { Repository } from '../models/Repository.js';
import { Review } from '../models/Review.js';
import { PullRequest } from '../models/PullRequest.js';

const PENALTIES = {
  Critical: 30,
  High: 15,
  Medium: 8,
  Low: 3,
  Info: 0
};

/**
 * Calculates security score for a given list of findings
 * @param {Array<Object>} reviews 
 * @returns {number} score from 0 to 100
 */
export const calculateScore = (reviews) => {
  let penalties = 0;
  for (const review of reviews) {
    const severity = review.severity || 'Info';
    penalties += PENALTIES[severity] || 0;
  }
  return Math.max(0, 100 - penalties);
};

/**
 * Re-calculates and updates the security score for a connected repository
 * @param {string} repositoryDbId Database ID of the repository
 */
export const updateRepositoryScore = async (repositoryDbId) => {
  try {
    // Get all PRs of this repository
    const prs = await PullRequest.find({ repositoryId: repositoryDbId });
    const prIds = prs.map(pr => pr._id);

    if (prIds.length === 0) {
      // If no PRs yet, score is default 100
      await Repository.updateOne(
        { _id: repositoryDbId },
        { $set: { securityScore: 100 } }
      );
      return 100;
    }

    // Get all reviews for all PRs of this repo
    const reviews = await Review.find({ prId: { $in: prIds } });

    // Compute repo-wide score
    // Option A: Average of all PR scores
    const prScores = [];
    for (const prId of prIds) {
      const prReviews = reviews.filter(r => r.prId === prId);
      const score = calculateScore(prReviews);
      prScores.push(score);
    }

    const averageScore = Math.round(prScores.reduce((a, b) => a + b, 0) / prScores.length);

    await Repository.updateOne(
      { _id: repositoryDbId },
      { $set: { securityScore: averageScore } }
    );

    return averageScore;
  } catch (err) {
    console.error(`[Scoring Engine] Failed to update repository ${repositoryDbId} score:`, err.message);
    return 100;
  }
};
