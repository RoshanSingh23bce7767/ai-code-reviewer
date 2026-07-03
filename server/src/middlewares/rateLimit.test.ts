import {
  authRouteLimiter,
  globalApiLimiter,
  loginLimiter,
  reviewApiLimiter,
  reviewCreateLimiter
} from './rateLimit';

describe('rate limit middleware', () => {
  it('exports configured limiters for global, auth, login, and review routes', () => {
    expect(typeof globalApiLimiter).toBe('function');
    expect(typeof authRouteLimiter).toBe('function');
    expect(typeof loginLimiter).toBe('function');
    expect(typeof reviewApiLimiter).toBe('function');
    expect(typeof reviewCreateLimiter).toBe('function');
  });
});
