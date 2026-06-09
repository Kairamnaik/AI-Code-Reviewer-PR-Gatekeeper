import mongoose from 'mongoose';
import { createModel } from '../config/db.js';

const NotificationSchema = new mongoose.Schema({
  type: { type: String, required: true }, // INFO, WARNING, ERROR, SUCCESS
  title: { type: String, required: true },
  message: { type: String, required: true },
  read: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});

export const Notification = createModel('Notification', NotificationSchema);
