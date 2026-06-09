import { parse } from '@babel/parser';

/**
 * Basic AST traversal helper
 * @param {Object} node Babel AST node
 * @param {Object} visitors Visitor functions mapped by node type
 */
const traverse = (node, visitors) => {
  if (!node) return;

  const type = node.type;
  if (visitors[type]) {
    visitors[type](node);
  }

  // Traverse all child properties of the node
  for (const key in node) {
    if (Object.prototype.hasOwnProperty.call(node, key)) {
      const child = node[key];
      if (child && typeof child === 'object') {
        if (Array.isArray(child)) {
          child.forEach(item => traverse(item, visitors));
        } else if (child.type) {
          traverse(child, visitors);
        }
      }
    }
  }
};

/**
 * Performs AST analysis on JS/JSX code to identify key structures and potential issues
 * @param {string} code JS/JSX source code
 * @param {string} filename Filename for reporting
 * @returns {Object} Extracted code structures
 */
export const analyzeAST = (code, filename) => {
  const result = {
    functions: [],
    classes: [],
    imports: [],
    apiCalls: [],
    dbQueries: [],
    potentialSecrets: [],
    vulnerabilities: [],
    error: null
  };

  try {
    // Parse using babel/parser with modern configurations and JSX support
    const ast = parse(code, {
      sourceType: 'module',
      plugins: [
        'jsx',
        'dynamicImport',
        'objectRestSpread',
        'classProperties',
        'optionalChaining',
        'nullishCoalescingOperator'
      ]
    });

    const visitors = {
      // 1. Function Declarations & Methods
      FunctionDeclaration(node) {
        const name = node.id ? node.id.name : 'anonymous';
        const params = node.params.map(p => p.type === 'Identifier' ? p.name : p.type);
        result.functions.push({
          name,
          type: 'FunctionDeclaration',
          params,
          line: node.loc ? node.loc.start.line : null
        });
      },

      FunctionExpression(node) {
        // Only capture named ones or those assigned to variables/properties
        const name = node.id ? node.id.name : 'anonymous';
        const params = node.params.map(p => p.type === 'Identifier' ? p.name : p.type);
        result.functions.push({
          name,
          type: 'FunctionExpression',
          params,
          line: node.loc ? node.loc.start.line : null
        });
      },

      ArrowFunctionExpression(node) {
        const params = node.params.map(p => p.type === 'Identifier' ? p.name : p.type);
        result.functions.push({
          name: 'anonymous (arrow)',
          type: 'ArrowFunctionExpression',
          params,
          line: node.loc ? node.loc.start.line : null
        });
      },

      ClassMethod(node) {
        const name = node.key ? (node.key.name || node.key.value) : 'method';
        const params = node.params.map(p => p.type === 'Identifier' ? p.name : p.type);
        result.functions.push({
          name,
          type: 'ClassMethod',
          params,
          line: node.loc ? node.loc.start.line : null
        });
      },

      // 2. Class Declarations
      ClassDeclaration(node) {
        const name = node.id ? node.id.name : 'anonymous';
        result.classes.push({
          name,
          line: node.loc ? node.loc.start.line : null
        });
      },

      // 3. Imports (ES Module style)
      ImportDeclaration(node) {
        const source = node.source ? node.source.value : '';
        const specifiers = node.specifiers.map(s => {
          if (s.type === 'ImportSpecifier') return s.imported.name;
          if (s.type === 'ImportDefaultSpecifier') return 'default';
          if (s.type === 'ImportNamespaceSpecifier') return '*';
          return s.type;
        });
        result.imports.push({
          source,
          specifiers,
          line: node.loc ? node.loc.start.line : null
        });
      },

      // 4. API Calls & Database Queries (CallExpression)
      CallExpression(node) {
        const { callee } = node;
        const line = node.loc ? node.loc.start.line : null;

        // Check for CommonJS require
        if (callee.type === 'Identifier' && callee.name === 'require') {
          const arg = node.arguments[0];
          if (arg && arg.type === 'StringLiteral') {
            result.imports.push({
              source: arg.value,
              specifiers: ['require'],
              line
            });
          }
        }

        // Check for API calls (fetch, axios, ajax)
        let callName = '';
        if (callee.type === 'Identifier') {
          callName = callee.name;
        } else if (callee.type === 'MemberExpression') {
          const obj = callee.object.name || (callee.object.callee ? 'nested' : '');
          const prop = callee.property.name || callee.property.value || '';
          callName = `${obj}.${prop}`;
        }

        const lowerCall = callName.toLowerCase();

        // API Call detections
        if (['fetch', 'axios', 'axios.get', 'axios.post', 'axios.put', 'axios.delete', 'superagent'].some(kw => lowerCall.includes(kw))) {
          result.apiCalls.push({
            name: callName,
            line
          });
        }

        // Database queries / connection detections
        if (['connect', 'mongoose.connect', 'db.query', 'db.execute', 'client.query', 'find', 'findOne', 'create', 'update', 'insert'].some(kw => lowerCall.includes(kw))) {
          result.dbQueries.push({
            name: callName,
            line
          });
        }

        // Check for eval() usage
        if (callee.type === 'Identifier' && callee.name === 'eval') {
          result.vulnerabilities.push({
            type: 'Insecure Eval Usage',
            explanation: 'Use of eval() allows executing arbitrary strings as code. This poses extreme security risks and performance issues.',
            line
          });
        }
      },

      // 5. String literals (for potential hardcoded credentials / connection strings)
      StringLiteral(node) {
        const val = node.value;
        const line = node.loc ? node.loc.start.line : null;

        // DB connection string detection
        if (val.startsWith('mongodb://') || val.startsWith('mongodb+srv://') || val.startsWith('postgres://') || val.startsWith('mysql://')) {
          result.vulnerabilities.push({
            type: 'Hardcoded Connection URI',
            explanation: `Exposed connection string detected: "${val.replace(/:([^:@]+)@/, ':****@')}"`,
            line
          });
        }

        // High entropy / secret token detection heuristics
        const parent = node.parent; // Note: babel AST nodes don't have .parent by default, but we can check assignment/property context.
      },

      // 6. Assignment & Variable declarations (check for hardcoded keys)
      VariableDeclarator(node) {
        const line = node.loc ? node.loc.start.line : null;
        if (node.id && node.id.type === 'Identifier') {
          const varName = node.id.name.toLowerCase();
          const isSecretKeyword = ['secret', 'password', 'token', 'apikey', 'jwt_secret', 'privatekey'].some(kw => varName.includes(kw));

          if (isSecretKeyword && node.init && node.init.type === 'StringLiteral') {
            const val = node.init.value;
            // Ignore small dummy strings or placeholders
            if (val.length > 8 && val !== 'mock_secret' && val !== 'secret-key-123') {
              result.potentialSecrets.push({
                variable: node.id.name,
                explanation: 'Variable name suggests a secret key, and it is assigned a hardcoded string value.',
                line
              });
            }
          }
        }
      },

      ObjectProperty(node) {
        const line = node.loc ? node.loc.start.line : null;
        if (node.key && node.key.type === 'Identifier') {
          const propName = node.key.name.toLowerCase();
          const isSecretKeyword = ['secret', 'password', 'token', 'apikey', 'jwt_secret'].some(kw => propName.includes(kw));

          if (isSecretKeyword && node.value && node.value.type === 'StringLiteral') {
            const val = node.value.value;
            if (val.length > 8 && val !== 'mock_secret') {
              result.potentialSecrets.push({
                variable: node.key.name,
                explanation: 'Object property suggests a credential/secret, and it is initialized with a hardcoded string.',
                line
              });
            }
          }
        }
      },

      // 7. Binary expressions (checks for potential SQL Injections)
      BinaryExpression(node) {
        const line = node.loc ? node.loc.start.line : null;
        if (node.operator === '+') {
          // Look for direct string concat with SQL words
          const findSqlConcat = (n) => {
            if (n.type === 'StringLiteral') {
              const u = n.value.toUpperCase();
              return u.includes('SELECT ') || u.includes('INSERT INTO') || u.includes('UPDATE ') || u.includes('DELETE FROM');
            }
            if (n.type === 'BinaryExpression' && n.operator === '+') {
              return findSqlConcat(n.left) || findSqlConcat(n.right);
            }
            return false;
          };

          if (findSqlConcat(node)) {
            result.vulnerabilities.push({
              type: 'Potential SQL Injection',
              explanation: 'SQL query string built via concatenation. Use parameterized queries instead.',
              line
            });
          }
        }
      }
    };

    // Traverse the parsed AST
    traverse(ast, visitors);

  } catch (err) {
    result.error = err.message;
  }

  return result;
};
