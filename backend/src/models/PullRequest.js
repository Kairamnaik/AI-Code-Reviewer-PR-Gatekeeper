import mongoose from 'mongoose';
import { createModel } from '../config/db.js';

const PullRequestSchema = new mongoose.Schema({
  repositoryId: { type: String, required: true },
  prNumber: { type: Number, required: true },
  title: { type: String, default: '' },
  author: { type: String, required: true },
  branch: { type: String, default: 'main' },
  status: { type: String, default: 'open' },
  createdAt: { type: Date, default: Date.now }
});

export const PullRequest = createModel('PullRequest', PullRequestSchema);
