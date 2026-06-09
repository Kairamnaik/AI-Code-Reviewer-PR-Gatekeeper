import mongoose from 'mongoose';
import { createModel } from '../config/db.js';

const WebhookLogSchema = new mongoose.Schema({
  eventType: { type: String, required: true },
  payload: { type: mongoose.Schema.Types.Mixed, default: {} },
  status: { type: String, default: 'pending' },
  error: { type: String, default: '' },
  timestamp: { type: Date, default: Date.now }
});

export const WebhookLog = createModel('WebhookLog', WebhookLogSchema);
