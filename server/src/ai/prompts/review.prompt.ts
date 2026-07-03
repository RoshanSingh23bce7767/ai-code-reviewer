const MAX_PROMPT_LENGTH = 24500;
const HEADER_PREFIX = 'Language: ';
const SENSITIVE_VALUE_PATTERN = /(api[_-]?key|token|secret|password|authorization|bearer)\s*[:=]\s*['\"']?([^'\"\s]+)/gi;

export const SYSTEM_PROMPT = `You are a senior software engineer. Analyze code for bugs, security, performance, and maintainability.
Return ONLY valid JSON.
Do NOT wrap it in markdown.
Do NOT use \`\`\`json.
Do NOT include explanations before or after the JSON.
The first character of your response must be '{'.
The last character of your response must be '}'.
The response MUST be parseable by JSON.parse() without any preprocessing.`;

export const DEVELOPER_INSTRUCTIONS = `Analyze the code. Return ONLY a raw JSON object matching this exact schema:
{
  "score": 85,
  "summary": "Brief summary of the review",
  "complexity": {"time": "O(N)", "space": "O(1)"},
  "bugs": [{"title": "Bug name", "severity": "medium", "line": 1, "description": "Details", "recommendation": "Fix"}],
  "securityIssues": [{"title": "Issue", "severity": "high", "description": "Details", "recommendation": "Fix"}],
  "performanceIssues": [{"title": "Issue", "impact": "medium", "description": "Details", "recommendation": "Fix"}],
  "codeSmells": [{"title": "Smell", "description": "Details", "recommendation": "Fix"}],
  "bestPractices": [{"title": "Practice", "description": "Details", "recommendation": "Fix"}],
  "optimizedCode": "improved source code here",
  "documentation": "markdown documentation here",
  "unitTests": "test code here"
}

Rules:
1. score is a number 0-100.
2. severity is one of critical/high/medium/low.
3. impact is one of high/medium/low.
4. Use empty arrays [] when no issues found.
5. All string values must be valid JSON strings with escaped special characters.
6. When including source code in string fields like 'optimizedCode' or 'unitTests', escape it completely as a valid JSON string. Never output raw markdown code fences (\`\`\`js) inside string values.`;

export const getReviewPrompt = (language: string, sourceCode: string): string => {
  const sanitizedCode = String(sourceCode || '')
    .replace(SENSITIVE_VALUE_PATTERN, (_match, key: string) => `${key}= [REDACTED]`)
    .replace(/\b(?:sk|ghp|gho|github_pat)_[A-Za-z0-9_]+\b/gi, '[REDACTED]');

  const prefix = `${HEADER_PREFIX}${language}\n\nSource code:\n`;
  const remainingBudget = MAX_PROMPT_LENGTH - prefix.length;

  const boundedCode = sanitizedCode.length > remainingBudget
    ? `${sanitizedCode.slice(0, remainingBudget)}\n... [truncated for review]`
    : sanitizedCode;

  return `${prefix}${boundedCode}`;
};
