import mongoose from 'mongoose';
import { createModel } from '../config/db.js';

const ReviewSchema = new mongoose.Schema({
  prId: { type: String, required: true },
  file: { type: String, required: true },
  severity: { type: String, required: true }, // Critical, High, Medium, Low, Info
  issue: { type: String, required: true },
  explanation: { type: String, required: true },
  fix: { type: String, default: '' },
  lineNumber: { type: Number, required: true },
  commentId: { type: String, default: null },
  createdAt: { type: Date, default: Date.now }
});

export const Review = createModel('Review', ReviewSchema);
