import jwt from 'jsonwebtoken';
import { User } from '../models/User.js';

export const requireAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Authorization header missing or invalid format.' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'super_secret_jwt_sign_key_change_me');

    const user = await User.findOne({ githubId: decoded.githubId });
    if (!user) {
      return res.status(401).json({ error: 'User associated with this token not found.' });
    }

    req.user = user;
    next();
  } catch (err) {
    console.error('[Auth Middleware] JWT verification failed:', err.message);
    return res.status(401).json({ error: 'Token is invalid or has expired.' });
  }
};
