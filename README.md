# Automated AI Code Reviewer & PR Gatekeeper.

An enterprise-grade, developer-first tool built on an **Event-Driven Architecture** that integrates directly with GitHub repositories to automatically review Pull Requests using Artificial Intelligence before code is merged. 

This application functions as a robust **PR Gatekeeper**—scanning incoming changes for security vulnerabilities, performance bottlenecks, hardcoded secrets, and code smells, and posting inline comments directly back to the pull request.

---


## 🚀 Key Features & Architectural Flow

* **Secure Authentication:** SSO integration using **GitHub OAuth 2.0**.
* **Repository Monitoring & Automation:** Automates registering **GitHub Webhooks** for seamless **Pull Request Automation**.
* **Abstract Syntax Tree (AST) Analysis:** Parses JavaScript/JSX code into a syntax tree via `@babel/parser` to locate structural patterns (functions, imports, db queries, dynamic expressions, insecure `eval`).
* **AI-Powered Code Review:** Uses the **Google Generative AI SDK** (Gemini) to evaluate code safety, SQL injection risks, XSS, and memory leaks.
* **Resilient Fallback Design:** Features complete offline/mock modes. Falls back to a local JSON file database and a robust in-memory worker queue when MongoDB or Redis are unavailable.
* **Analytics Dashboard:** Visual charts illustrating repository safety scores, review history, and issue breakdowns.

---

## 🛠 Skills & Core Competencies Demonstrated

This project showcases a full-stack, DevOps-integrated skill set, making it highly valuable for resumes and portfolios:

### Core Engineering Skills
* **Event-Driven Architecture:** Asynchronous webhook capturing and decoupled background job queue processing.
* **Static Code Analysis & Compiler Design:** Constructing and traversing **AST (Abstract Syntax Tree)** representations to extract code structures and detect insecure patterns.
* **Secure Authentication & Middleware:** Designing secure login states using **GitHub OAuth 2.0** and verifying cryptographic webhook signatures using HMAC-SHA256 headers.
* **REST API Development:** Implementing modular Express controllers, routes, and error handlers with production-grade reliability.
* **NoSQL Database Management:** Designing schema definitions, relational proxies, and **MongoDB Aggregations** to fetch real-time repository analytics.
* **Asynchronous Task Processing:** Architecting background tasks using **Redis** and **BullMQ** for exponential-backoff retries.

### DevOps & Integration Skills
* **CI/CD & Developer Tools:** Building integrations directly with **GitHub Webhooks** and the **Octokit SDK** to automate code quality gates.
* **AI Prompt Engineering:** Setting up strict JSON schema validations (`responseSchema`) with Google's LLM endpoints.

---

## 📊 Technical Stack

| Category | Technologies |
| :--- | :--- |
| **Frontend** | React, Vite, Tailwind CSS, Recharts (Data Visualization), React Router DOM |
| **Backend** | Node.js, Express, @babel/parser (AST Analysis), Mongoose |
| **Integrations** | GitHub API, Octokit SDK, Google Generative AI (Gemini 1.5/2.5/3.5) |
| **Infrastructure** | Redis, BullMQ, Nginx |

---

## 🗺 Directory Architecture

```text
├── backend/
│   ├── src/
│   │   ├── config/         # Database connections and Local Fallback DB Drivers
│   │   ├── controllers/    # Webhook and Auth routes logic
│   │   ├── middleware/     # GitHub signature check and token validators
│   │   ├── models/         # Mongoose Schemas (User, Repo, Review, AuditLog, Notifications)
│   │   ├── routes/         # REST API Route Declarations
│   │   ├── services/       
│   │   │   ├── ai/         # Gemini AI code reviewer and prompt configurations
│   │   │   ├── github/     # Octokit wrapper for repos, hooks, and comments
│   │   │   ├── queue/      # BullMQ initialization and in-memory queue fallback
│   │   │   └── workers/    # Queue processor tasks
│   │   ├── utils/          
│   │   │   ├── astAnalyzer.js  # AST Analysis parsing engine
│   │   │   ├── diffParser.js   # Git diff and patch lines parser
│   │   │   └── scoringEngine.js# Weighted scoring model for repos
│   │   └── server.js       # Entry point Express Server
│   └── test-review.js      # Integration sandbox test runner
│
├── frontend/
│   ├── src/
│   │   ├── contexts/       # Authentication Contexts
│   │   ├── layouts/        # Dashboard layout wrapper
│   │   ├── pages/          # Pages (Dashboard, Repositories, PRReviews, AuditLogs)
│   │   └── services/       # Axios API client wrapper
│   └── index.html
```

---

## ⚙️ Configuration (Environment Variables)

Create a `.env` file in the `backend/` directory:
```ini
PORT=5001
JWT_SECRET=your_jwt_secret_key
FRONTEND_URL=http://localhost:5173

# Databases (Leave blank to use local fallback file DB and in-memory queue)
MONGODB_URI=
REDIS_URL=

# GitHub Settings
GITHUB_CLIENT_ID=your_github_client_id
GITHUB_CLIENT_SECRET=your_github_client_secret
GITHUB_WEBHOOK_SECRET=your_webhook_secret

# Gemini Settings
GEMINI_API_KEY=your_gemini_api_key
```

---


## 💻 Manual Local Development

### 1. Backend Service
```bash
cd backend
npm install
npm run dev
```

### 2. Frontend React Application
```bash
cd frontend
npm install
npm run dev
```
Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## 🧪 Integration Sandbox Testing

To verify the core engine, AST parser, queue routing, and Gemini AI reviewer without setting up an actual live webhook from GitHub, run the integrated test runner:
```bash
cd backend
node test-review.js
```
This script will:
1. Seed mock database profiles.
2. Generate an incoming webhook payload.
3. Enqueue the task, extract code patches, and compile the **AST Structural Context**.
4. Query the **Gemini API** for safety reviews.
5. Save comments, calculate the updated security score, and complete the check successfully.
# Automated-AI-Code-Reviewer-PR-Gatekeeper
