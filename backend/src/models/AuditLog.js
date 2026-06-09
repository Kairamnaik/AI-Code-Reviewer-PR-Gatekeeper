import mongoose from 'mongoose';
import { createModel } from '../config/db.js';

const AuditLogSchema = new mongoose.Schema({
  action: { type: String, required: true },
  user: { type: String, default: 'System' },
  details: { type: String, default: '' },
  timestamp: { type: Date, default: Date.now }
});

export const AuditLog = createModel('AuditLog', AuditLogSchema);
export default AuditLog;
