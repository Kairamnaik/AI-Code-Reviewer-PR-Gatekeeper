import { GoogleGenerativeAI } from '@google/generative-ai';

const isMock = () => {
  const key = process.env.GEMINI_API_KEY;
  return !key || key === 'mock_gemini_key';
};

/**
 * Fallback static analysis engine mimicking Gemini findings when running without key
 * @param {string} filename 
 * @param {Array<{line: number, content: string}>} addedLines 
 */
const runMockStaticAnalysis = (filename, addedLines) => {
  const findings = [];

  for (const item of addedLines) {
    const { line, content } = item;

    // 1. Check for SQL Injection patterns
    if (content.includes('SELECT *') && (content.includes('\' +') || content.includes('"${') || content.includes('` +'))) {
      findings.push({
        severity: 'High',
        issue: 'Potential SQL Injection',
        line,
        explanation: 'User inputs are concatenated directly into a SQL query string. This allows malicious users to manipulate the SQL statement and query or mutate unauthorized database records.',
        fix: '// Use parameterized queries or database placeholders\nconst query = "SELECT * FROM users WHERE username = ?";\nconst user = await db.query(query, [username]);'
      });
    }

    // 2. Check for hardcoded secrets
    if ((content.includes('secret') || content.includes('password') || content.includes('token') || content.includes('key')) && 
        content.match(/(["'`])(?!process\.env)[a-zA-Z0-9_\-+=/]{12,}\1/)) {
      findings.push({
        severity: 'Critical',
        issue: 'Hardcoded Secret / Credential Exposure',
        line,
        explanation: 'A secret key or token appears to be hardcoded in the codebase. Hardcoded credentials can easily be leaked in version control systems.',
        fix: '// Store credentials in environment variables and access via process.env\nconst token = jwt.sign({ id: user.id }, process.env.JWT_SECRET);'
      });
    }

    // 3. Check for insecure connection strings
    if (content.includes('mongodb://') && !content.includes('process.env')) {
      findings.push({
        severity: 'High',
        issue: 'Exposed Database Connection String',
        line,
        explanation: 'The MongoDB connection string containing host credentials is hardcoded directly. This is a severe security exposure.',
        fix: '// Retrieve connection URI from environment configuration\nawait mongoose.connect(process.env.MONGODB_URI);'
      });
    }

    // 4. Inefficient DB calls
    if (content.includes('await mongoose.connect') && (filename.includes('routes') || filename.includes('controllers'))) {
      findings.push({
        severity: 'Medium',
        issue: 'Inefficient Connection Management',
        line,
        explanation: 'Re-initializing the database connection inside a route controller creates severe database connection exhaustion and latency.',
        fix: '// Initialize the connection once during server startup\n// In controller, rely on the global active mongoose instance'
      });
    }

    // 5. Weak console error log
    if (content.includes('console.log') && content.includes('err')) {
      findings.push({
        severity: 'Low',
        issue: 'Console Logging Sensitive Errors',
        line,
        explanation: 'Logging errors with raw debug information to console.log is a minor security and code quality concern. Implement production-grade structured logging.',
        fix: '// Use a logging utility\nlogger.error("Failed user login attempt", { error: err.message });'
      });
    }
  }

  return findings;
};

/**
 * Run AI Code Review on a specific file's changes
 * @param {string} filename 
 * @param {string} patch 
 * @param {Array<{line: number, content: string}>} addedLines 
 * @returns {Promise<Array<Object>>} List of code review findings
 */
export const reviewCode = async (filename, patch, addedLines, astContext = null) => {
  if (addedLines.length === 0) return [];

  if (isMock()) {
    console.log(`[AI Engine] Mock Mode - analyzing ${filename}`);
    return runMockStaticAnalysis(filename, addedLines);
  }

  console.log(`[AI Engine] Invoking Gemini API for file: ${filename}`);
  try {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({
      model: 'gemini-flash-latest',
      generationConfig: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: 'ARRAY',
          description: 'List of code issues identified in the modified lines',
          items: {
            type: 'OBJECT',
            properties: {
              severity: {
                type: 'STRING',
                enum: ['Critical', 'High', 'Medium', 'Low', 'Info'],
                description: 'The severity of the issue'
              },
              issue: {
                type: 'STRING',
                description: 'Brief, clear title identifying the issue'
              },
              line: {
                type: 'INTEGER',
                description: 'The exact line number in the final file where the issue occurs'
              },
              explanation: {
                type: 'STRING',
                description: 'Detailed explanation of why this code pattern is problematic'
              },
              fix: {
                type: 'STRING',
                description: 'A corrected code snippet showing how to resolve the issue'
              }
            },
            required: ['severity', 'issue', 'line', 'explanation', 'fix']
          }
        }
      }
    });

    const linesContent = addedLines.map(al => `Line ${al.line}: ${al.content}`).join('\n');

    let astPrompt = '';
    if (astContext) {
      astPrompt = `
AST (Abstract Syntax Tree) Structural Context of the whole file (for understanding structural context, classes, and database usage):
- Functions: ${JSON.stringify(astContext.functions)}
- Classes: ${JSON.stringify(astContext.classes)}
- Imported Modules: ${JSON.stringify(astContext.imports)}
- DB Queries: ${JSON.stringify(astContext.dbQueries)}
- API Calls: ${JSON.stringify(astContext.apiCalls)}
- Static AST Vulnerabilities: ${JSON.stringify(astContext.vulnerabilities)}
- Potential Secrets: ${JSON.stringify(astContext.potentialSecrets)}
- AST Parsing Errors (if any): ${astContext.error || 'None'}
`;
    }

    const prompt = `You are a senior Staff Software Engineer and Security Auditor.
Analyze the following added/modified lines in file "${filename}".
Evaluate security vulnerabilities, performance issues, code quality, and style violations.
${astPrompt}

IMPORTANT: You MUST ONLY review and flag findings for the lines of code listed below (the added lines). Do not post reviews for unchanged lines outside these lines.
Each line is prefixed with its actual final line number in the file. Ensure the "line" property of your findings matches one of these line numbers exactly.

For every issue provide:
1. Severity (Low/Medium/High/Critical)
2. Issue description
3. Explanation
4. Recommended Fix / Suggested Code Example

Added lines:
${linesContent}

Original Git Patch Context:
${patch}
`;

    const generatePromise = (async () => {
      const result = await model.generateContent(prompt);
      const response = await result.response;
      return response.text();
    })();

    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Gemini API call timed out after 10 seconds')), 10000)
    );

    const jsonText = await Promise.race([generatePromise, timeoutPromise]);

    try {
      const parsed = JSON.parse(jsonText);
      console.log(`[AI Engine] Gemini returned ${parsed.length} findings for ${filename}`);
      return parsed;
    } catch (parseError) {
      console.error('[AI Engine] Failed to parse Gemini response JSON:', jsonText);
      return [];
    }
  } catch (err) {
    console.error('[AI Engine] Gemini API error:', err.message);
    // Graceful fallback to static scan to avoid crashing the worker
    console.warn('[AI Engine] Falling back to mock static analysis due to API error.');
    return runMockStaticAnalysis(filename, addedLines);
  }
};
