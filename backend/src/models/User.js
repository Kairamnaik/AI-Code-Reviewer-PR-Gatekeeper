import mongoose from 'mongoose';
import { createModel } from '../config/db.js';

const UserSchema = new mongoose.Schema({
  githubId: { type: String, required: true, unique: true },
  username: { type: String, required: true },
  email: { type: String, default: '' },
  avatar: { type: String, default: '' },
  accessToken: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});

export const User = createModel('User', UserSchema);
