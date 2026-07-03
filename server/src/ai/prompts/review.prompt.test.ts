import { getReviewPrompt } from './review.prompt';

describe('review prompt builder', () => {
  it('redacts sensitive values and keeps the prompt bounded', () => {
    const longCode = `${'const token = "abc123";\n'.repeat(3000)}\nconsole.log('hello');`;
    const prompt = getReviewPrompt('typescript', longCode);

    expect(prompt).toContain('[REDACTED]');
    expect(prompt).not.toContain('abc123');
    expect(prompt.length).toBeLessThanOrEqual(25000);
  });
});
