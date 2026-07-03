import { extractJSON } from '../../utils/jsonParser';

describe('extractJSON Parser Utility', () => {
  it('should parse pure valid JSON', () => {
    const input = '{"score": 90, "summary": "Perfect code review", "bugs": []}';
    const result = extractJSON(input);
    expect(result).toEqual({
      score: 90,
      summary: 'Perfect code review',
      bugs: []
    });
  });

  it('should parse markdown-wrapped JSON with fences', () => {
    const input = `
\`\`\`json
{
  "score": 85,
  "summary": "Some markdown fencing tests",
  "securityIssues": []
}
\`\`\`
    `;
    const result = extractJSON(input);
    expect(result.score).toBe(85);
    expect(result.summary).toBe('Some markdown fencing tests');
    expect(result.securityIssues).toEqual([]);
  });

  it('should extract JSON with prefix and suffix text', () => {
    const input = `
Here is the requested code review output in JSON format:

{
  "score": 95,
  "summary": "Extract me please"
}

Hope this helps with your coding task!
    `;
    const result = extractJSON(input);
    expect(result).toEqual({
      score: 95,
      summary: 'Extract me please'
    });
  });

  it('should handle complex nested objects and arrays', () => {
    const input = `
    {
      "score": 70,
      "nested": {
        "depth": 2,
        "arr": [1, 2, {"three": 3}]
      }
    }
    `;
    const result = extractJSON(input);
    expect(result.nested.depth).toBe(2);
    expect(result.nested.arr[2]).toEqual({ three: 3 });
  });

  it('should parse javascript code containing braces and backticks inside JSON strings', () => {
    const input = `{
      "score": 90,
      "improvedCode": "class Edge {\\n  constructor(u, v, w) {\\n    this.u = u;\\n    this.v = v;\\n    this.w = w;\\n  }\\n}",
      "templateLiteralCode": "const msg = \`Shortest path is \${dist[v]}\`;\\nconsole.log(msg);",
      "documentation": "### Bellman-Ford Info\\nUses dynamic programming."
    }`;
    const result = extractJSON(input);
    expect(result.score).toBe(90);
    expect(result.improvedCode).toContain('class Edge');
    expect(result.improvedCode).toContain('this.u = u;');
    expect(result.templateLiteralCode).toContain('`Shortest path is ${dist[v]}`');
  });

  it('should handle escaped double quotes correctly within string values', () => {
    const input = `{
      "score": 80,
      "recommendation": "Use \\"Integer.MAX_VALUE\\" for infinity values."
    }`;
    const result = extractJSON(input);
    expect(result.recommendation).toBe('Use "Integer.MAX_VALUE" for infinity values.');
  });

  it('should repair trailing commas inside arrays and objects', () => {
    const input = `{
      "score": 75,
      "bugs": [
        "Bug 1",
        "Bug 2",
      ],
      "complexity": {
        "time": "O(V*E)",
        "space": "O(V)",
      },
    }`;
    const result = extractJSON(input);
    expect(result.bugs).toEqual(['Bug 1', 'Bug 2']);
    expect(result.complexity).toEqual({ time: 'O(V*E)', space: 'O(V)' });
    expect(result.score).toBe(75);
  });

  it('should repair smart/curly double and single quotes', () => {
    const input = `{
      \u201Cscore\u201D: 88,
      \u201Csummary\u201D: \u201CHello from smart quotes\u201D
    }`;
    const result = extractJSON(input);
    expect(result).toEqual({
      score: 88,
      summary: 'Hello from smart quotes'
    });
  });

  it('should parse huge JSON payloads (approx 100KB) quickly and correctly', () => {
    const largeCode = 'const array = [];\n' + 'array.push("very long line of code here");\n'.repeat(2000); // ~100KB
    const json = {
      score: 99,
      summary: 'Stress test of large payload parser',
      optimizedCode: largeCode,
      unitTests: 'describe("test", () => {});'
    };
    const input = JSON.stringify(json);
    const start = Date.now();
    const result = extractJSON(input);
    const duration = Date.now() - start;

    expect(result.score).toBe(99);
    expect(result.optimizedCode.length).toBeGreaterThan(60000);
    expect(duration).toBeLessThan(150); // Should be very fast
  });

  it('should throw an error for completely invalid JSON containing unbalanced braces', () => {
    const input = '{"score": 90, "summary": "Unbalanced braces';
    expect(() => extractJSON(input)).toThrow('Unbalanced braces');
  });

  it('should throw an error if no opening brace is found', () => {
    const input = 'This contains no json at all';
    expect(() => extractJSON(input)).toThrow('No JSON object structure found');
  });
});
