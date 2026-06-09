import mongoose from 'mongoose';
import { createModel } from '../config/db.js';

const RepositorySchema = new mongoose.Schema({
  userId: { type: String, required: true },
  repoId: { type: String, required: true },
  repoName: { type: String, required: true },
  owner: { type: String, required: true },
  visibility: { type: String, default: 'public' },
  defaultBranch: { type: String, default: 'main' },
  webhookId: { type: String, default: null },
  webhookStatus: { type: String, default: 'inactive' }, // active, inactive, failed
  securityScore: { type: Number, default: 100 },
  linkedAt: { type: Date, default: Date.now }
});

export const Repository = createModel('Repository', RepositorySchema);
