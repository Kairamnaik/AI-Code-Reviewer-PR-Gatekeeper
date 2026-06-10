import jwt from 'jsonwebtoken';
import axios from 'axios';
import { User } from '../models/User.js';
import { AuditLog } from '../models/AuditLog.js';

const CLIENT_ID = process.env.GITHUB_CLIENT_ID;
const CLIENT_SECRET = process.env.GITHUB_CLIENT_SECRET;
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

export const redirectToGithub = (req, res) => {
  if (CLIENT_ID === 'mock_client_id') {
    // Local mock redirect
    return res.redirect(`/api/auth/github/callback?code=mock_oauth_code`);
  }

  const redirectUri = process.env.GITHUB_CALLBACK_URL || `${req.protocol}://${req.get('host')}/api/auth/github/callback`;
  const githubUrl = `https://github.com/login/oauth/authorize?client_id=${CLIENT_ID}&redirect_uri=${redirectUri}&scope=repo,user`;
  res.redirect(githubUrl);
};

export const githubCallback = async (req, res) => {
  const { code } = req.query;
  if (!code) {
    return res.status(400).json({ error: 'Authorization code is missing.' });
  }

  let accessToken = '';
  let githubUser = null;

  if (CLIENT_ID === 'mock_client_id') {
    accessToken = 'mock_github_access_token';
    githubUser = {
      id: 583231,
      login: 'sandbox-developer',
      email: 'sandbox@example.com',
      avatar_url: 'https://avatars.githubusercontent.com/u/583231?v=4'
    };
  } else {
    try {
      const tokenResponse = await axios.post(
        'https://github.com/login/oauth/access_token',
        {
          client_id: CLIENT_ID,
          client_secret: CLIENT_SECRET,
          code
        },
        { headers: { Accept: 'application/json' } }
      );

      accessToken = tokenResponse.data.access_token;
      if (!accessToken) {
        throw new Error('No access token returned from GitHub.');
      }

      const userResponse = await axios.get('https://api.github.com/user', {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      githubUser = userResponse.data;
    } catch (err) {
      console.error('[Auth Callback] GitHub exchange failed:', err.message);
      return res.redirect(`${FRONTEND_URL}/login?error=oauth_failed`);
    }
  }

  try {
    let user = await User.findOne({ githubId: githubUser.id.toString() });
    if (!user) {
      user = await User.create({
        githubId: githubUser.id.toString(),
        username: githubUser.login,
        email: githubUser.email || '',
        avatar: githubUser.avatar_url || '',
        accessToken
      });
    } else {
      await User.updateOne(
        { githubId: githubUser.id.toString() },
        { $set: { accessToken, username: githubUser.login, avatar: githubUser.avatar_url || '', email: githubUser.email || '' } }
      );
    }

    await AuditLog.create({
      action: 'LOGIN',
      user: githubUser.login,
      details: 'User logged in via GitHub OAuth'
    });

    const jwtToken = jwt.sign(
      { githubId: githubUser.id.toString(), username: githubUser.login },
      process.env.JWT_SECRET || 'super_secret_jwt_sign_key_change_me',
      { expiresIn: '7d' }
    );

    res.redirect(`${FRONTEND_URL}?token=${jwtToken}`);
  } catch (err) {
    console.error('[Auth Callback] Database upsert failed:', err.message);
    res.redirect(`${FRONTEND_URL}/login?error=server_error`);
  }
};

export const getProfile = async (req, res) => {
  res.json({ user: req.user });
};
