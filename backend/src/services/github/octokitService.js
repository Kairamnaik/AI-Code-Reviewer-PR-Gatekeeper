import { Octokit } from '@octokit/rest';

// Check if token is mock
const isMock = (token) => {
  return !token || token.startsWith('mock_') || process.env.GITHUB_CLIENT_ID === 'mock_client_id';
};

export const getUserRepositories = async (accessToken) => {
  if (isMock(accessToken)) {
    console.log('[Octokit] Running in Mock Mode - fetching repositories.');
    return [
      {
        id: '101',
        name: 'e-commerce-backend',
        owner: 'mock-user',
        visibility: 'public',
        defaultBranch: 'main',
        html_url: 'https://github.com/mock-user/e-commerce-backend'
      },
      {
        id: '102',
        name: 'react-dashboard-frontend',
        owner: 'mock-user',
        visibility: 'private',
        defaultBranch: 'develop',
        html_url: 'https://github.com/mock-user/react-dashboard-frontend'
      },
      {
        id: '103',
        name: 'serverless-auth-service',
        owner: 'mock-user',
        visibility: 'public',
        defaultBranch: 'master',
        html_url: 'https://github.com/mock-user/serverless-auth-service'
      }
    ];
  }

  const octokit = new Octokit({ auth: accessToken });
  const { data } = await octokit.rest.repos.listForAuthenticatedUser({
    per_page: 100,
    sort: 'updated'
  });
  return data.map(repo => ({
    id: repo.id.toString(),
    name: repo.name,
    owner: repo.owner.login,
    visibility: repo.private ? 'private' : 'public',
    defaultBranch: repo.default_branch,
    html_url: repo.html_url
  }));
};

export const createWebhook = async (accessToken, owner, repo, webhookUrl) => {
  if (isMock(accessToken)) {
    console.log(`[Octokit] Mock Mode - Creating webhook for ${owner}/${repo} at ${webhookUrl}`);
    return {
      id: Math.floor(Math.random() * 1000000).toString(),
      status: 'active'
    };
  }

  const octokit = new Octokit({ auth: accessToken });
  const secret = process.env.GITHUB_WEBHOOK_SECRET || 'fallback_secret';

  const { data } = await octokit.rest.repos.createWebhook({
    owner,
    repo,
    config: {
      url: webhookUrl,
      content_type: 'json',
      secret,
      insecure_ssl: '1' // Allow local testing tools (e.g. ngrok)
    },
    events: ['pull_request', 'push', 'repository'],
    active: true
  });

  return {
    id: data.id.toString(),
    status: data.active ? 'active' : 'inactive'
  };
};

export const deleteWebhook = async (accessToken, owner, repo, webhookId) => {
  if (isMock(accessToken)) {
    console.log(`[Octokit] Mock Mode - Deleting webhook ${webhookId} for ${owner}/${repo}`);
    return true;
  }

  const octokit = new Octokit({ auth: accessToken });
  try {
    await octokit.rest.repos.deleteWebhook({
      owner,
      repo,
      hook_id: parseInt(webhookId, 10)
    });
    return true;
  } catch (err) {
    console.error(`[Octokit] Failed to delete webhook ${webhookId}:`, err.message);
    return false;
  }
};

export const getPullRequestFiles = async (accessToken, owner, repo, prNumber) => {
  if (isMock(accessToken)) {
    console.log(`[Octokit] Mock Mode - Fetching PR files for PR #${prNumber}`);
    return [
      {
        filename: 'src/routes/auth.js',
        additions: 12,
        deletions: 2,
        patch: '@@ -10,6 +10,12 @@\n const express = require("express");\n const router = express.Router();\n+const jwt = require("jsonwebtoken");\n \n router.post("/login", (req, res) => {\n-  const { username, password } = req.body;\n+  const { username, password } = req.body;\n+  // Vulnerability: No SQL validation, potential injection\n+  const query = "SELECT * FROM users WHERE username = \'" + username + "\'";\n+  const user = db.query(query);\n+  const token = jwt.sign({ id: user.id }, "secret-key-123");\n+  res.json({ token });\n });'
      },
      {
        filename: 'src/config/db.js',
        additions: 8,
        deletions: 0,
        patch: '@@ -1,3 +1,8 @@\n const mongoose = require("mongoose");\n+const connectDB = async () => {\n+  // Performance bottleneck: No connection pool pooling limit\n+  await mongoose.connect("mongodb://localhost:27017/test");\n+};\n+module.exports = connectDB;'
      }
    ];
  }

  const octokit = new Octokit({ auth: accessToken });
  const { data } = await octokit.rest.pulls.listFiles({
    owner,
    repo,
    pull_number: parseInt(prNumber, 10)
  });
  return data.map(file => ({
    filename: file.filename,
    additions: file.additions,
    deletions: file.deletions,
    patch: file.patch || ''
  }));
};

export const createReviewComment = async (accessToken, owner, repo, prNumber, commitId, path, line, body) => {
  if (isMock(accessToken)) {
    console.log(`[Octokit] Mock Mode - Posting comment to ${owner}/${repo} PR #${prNumber} on ${path}:${line}\nComment: ${body}`);
    return {
      id: Math.floor(Math.random() * 1000000).toString()
    };
  }

  const octokit = new Octokit({ auth: accessToken });
  
  try {
    // If no commitId is supplied, retrieve the latest commit from the PR
    let commitSha = commitId;
    if (!commitSha) {
      const { data: pr } = await octokit.rest.pulls.get({
        owner,
        repo,
        pull_number: parseInt(prNumber, 10)
      });
      commitSha = pr.head.sha;
    }

    const { data } = await octokit.rest.pulls.createReviewComment({
      owner,
      repo,
      pull_number: parseInt(prNumber, 10),
      body,
      commit_id: commitSha,
      path,
      line: parseInt(line, 10),
      side: 'RIGHT'
    });

    return {
      id: data.id.toString()
    };
  } catch (err) {
    console.error(`[Octokit] Failed to post comment on PR #${prNumber} for ${path}:${line}. Error:`, err.message);
    throw err;
  }
};

export const getFileContent = async (accessToken, owner, repo, path, ref) => {
  if (isMock(accessToken)) {
    console.log(`[Octokit] Mock Mode - Fetching file content for ${path}`);
    if (path === 'src/routes/auth.js') {
      return `const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");

router.post("/login", (req, res) => {
  const { username, password } = req.body;
  // Vulnerability: No SQL validation, potential injection
  const query = "SELECT * FROM users WHERE username = '" + username + "'";
  const user = db.query(query);
  const token = jwt.sign({ id: user.id }, "secret-key-123");
  res.json({ token });
});`;
    }
    if (path === 'src/config/db.js') {
      return `const mongoose = require("mongoose");
const connectDB = async () => {
  // Performance bottleneck: No connection pool pooling limit
  await mongoose.connect("mongodb://localhost:27017/test");
};
module.exports = connectDB;`;
    }
    return '';
  }

  const octokit = new Octokit({ auth: accessToken });
  try {
    const { data } = await octokit.rest.repos.getContent({
      owner,
      repo,
      path,
      ref
    });

    if (data && data.content && data.encoding === 'base64') {
      return Buffer.from(data.content, 'base64').toString('utf-8');
    }
    return '';
  } catch (err) {
    console.error(`[Octokit] Failed to fetch file content for ${path} at ref ${ref}:`, err.message);
    return '';
  }
};
