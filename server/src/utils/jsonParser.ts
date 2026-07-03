import logger from '../config/logger';

/**
 * Strips markdown code fences from the input string if present.
 */
function stripMarkdownFences(str: string): string {
  let val = str.trim();
  const regex = /^```(?:json)?\s*([\s\S]*?)\s*```$/i;
  let match = val.match(regex);
  while (match) {
    val = match[1].trim();
    match = val.match(regex);
  }
  return val;
}

/**
 * Attempts to repair common JSON syntax issues defensively.
 * Strips BOM, converts smart quotes, and removes trailing commas ONLY outside of quoted string values.
 */
function repairJSON(str: string): string {
  let repaired = str.trim();

  // 1. Remove BOM
  if (repaired.charCodeAt(0) === 0xFEFF) {
    repaired = repaired.slice(1);
  }

  // 2. Replace smart/curly quotes with standard quotes
  repaired = repaired
    .replace(/[\u201C\u201D\u201E\u201F\u2033\u2036]/g, '"')
    .replace(/[\u2018\u2019\u201A\u201B\u2032\u2039\u203A]/g, "'");

  // 3. Remove trailing commas safely without affecting strings (like code snippets)
  let cleaned = '';
  let inString = false;
  let escape = false;

  for (let i = 0; i < repaired.length; i++) {
    const char = repaired[i];

    if (escape) {
      cleaned += char;
      escape = false;
      continue;
    }

    if (char === '\\') {
      cleaned += char;
      escape = true;
      continue;
    }

    if (char === '"') {
      inString = !inString;
      cleaned += char;
      continue;
    }

    if (!inString) {
      if (char === ',') {
        // Look ahead to see if the next non-whitespace character closes the container
        let nextNonWs = '';
        for (let j = i + 1; j < repaired.length; j++) {
          if (!/\s/.test(repaired[j])) {
            nextNonWs = repaired[j];
            break;
          }
        }
        if (nextNonWs === '}' || nextNonWs === ']') {
          // Skip this trailing comma
          continue;
        }
      }
    }

    cleaned += char;
  }

  return cleaned;
}

/**
 * Extracts the error position from a JSON.parse error message.
 */
function extractErrorPosition(message: string): number {
  const posMatch = message.match(/position\s+(\d+)/i);
  if (posMatch) {
    return parseInt(posMatch[1], 10);
  }
  const colMatch = message.match(/column\s+(\d+)/i);
  if (colMatch) {
    return parseInt(colMatch[1], 10);
  }
  return -1;
}

/**
 * Generates snippet-based diagnostics around the failure offset.
 */
function getDiagnostics(str: string, pos: number, err: Error): string {
  if (pos === -1 || pos > str.length) {
    return `JSON Parse Error: ${err.message}`;
  }
  const start = Math.max(0, pos - 40);
  const end = Math.min(str.length, pos + 40);
  const before = str.slice(start, pos);
  const atChar = str[pos] || '';
  const after = str.slice(pos + 1, end);

  return `JSON Parse Error around position ${pos}:
... ${before} ==> ${atChar || '[EOF]'} <== ${after} ...
Details: ${err.message}`;
}

/**
 * Reusable utility to robustly extract and parse a JSON object from an LLM response.
 * Uses a state-machine brace counting parser that safely ignores delimiters and comments inside strings.
 */
export function extractJSON(response: string): any {
  if (typeof response !== 'string') {
    throw new Error('Input must be a string');
  }

  let cleaned = response.trim();

  // Strip top-level code fences if present
  cleaned = stripMarkdownFences(cleaned);

  // Find first opening brace
  const firstBrace = cleaned.indexOf('{');
  if (firstBrace === -1) {
    throw new Error('No JSON object structure found (missing opening "{")');
  }

  let braceDepth = 0;
  let inString = false;
  let escape = false;
  let endBrace = -1;

  for (let i = firstBrace; i < cleaned.length; i++) {
    const char = cleaned[i];

    if (escape) {
      escape = false;
      continue;
    }

    if (char === '\\') {
      escape = true;
      continue;
    }

    if (char === '"') {
      inString = !inString;
      continue;
    }

    if (!inString) {
      if (char === '{') {
        braceDepth++;
      } else if (char === '}') {
        braceDepth--;
        if (braceDepth === 0) {
          endBrace = i;
          break;
        }
      }
    }
  }

  if (braceDepth > 0 || endBrace === -1) {
    throw new Error(`Unbalanced braces. Depth remaining: ${braceDepth}, start position: ${firstBrace}`);
  }

  const jsonCandidate = cleaned.slice(firstBrace, endBrace + 1);

  // Try direct parse first
  try {
    return JSON.parse(jsonCandidate);
  } catch (parseError: any) {
    // If direct parse fails, try auto-repair (trailing commas, smart quotes, etc.)
    try {
      const repaired = repairJSON(jsonCandidate);
      return JSON.parse(repaired);
    } catch (repairError: any) {
      const errMsg = parseError.message || 'JSON parse error';
      const pos = extractErrorPosition(errMsg);
      const diagnostics = getDiagnostics(jsonCandidate, pos, parseError);

      logger.error(`extractJSON completely failed. Response length: ${response.length}, candidate length: ${jsonCandidate.length}`);
      logger.error(diagnostics);
      logger.error(`First 500 characters of candidate:\n${jsonCandidate.slice(0, 500)}`);
      logger.error(`Last 500 characters of candidate:\n${jsonCandidate.slice(Math.max(0, jsonCandidate.length - 500))}`);

      throw new Error(`Could not extract valid JSON from AI response: ${errMsg}\n${diagnostics}`);
    }
  }
}

export default extractJSON;
