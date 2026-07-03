const sentEmails: Array<{ subject: string; html: string }> = [];

jest.mock('../../services/email.service', () => ({
  __esModule: true,
  default: {
    sendMail: jest.fn().mockImplementation(async (options: { subject: string; html: string }) => {
      sentEmails.push({ subject: options.subject, html: options.html });
    })
  }
}));

jest.mock('../../config/logger', () => ({
  __esModule: true,
  default: { info: jest.fn(), warn: jest.fn(), error: jest.fn() }
}));

import request from 'supertest';
import { app } from '../../server';
import { connectTestDB, clearTestDB, disconnectTestDB } from '../helpers/testDb';

const extractToken = (html: string): string => {
  const match = html.match(/<span class="token">([^<]+)<\/span>/);
  return match?.[1] || '';
};

describe('Auth integration', () => {
  beforeAll(async () => {
    process.env.NODE_ENV = 'test';
    await connectTestDB();
  });

  beforeEach(async () => {
    sentEmails.length = 0;
    await clearTestDB();
  });

  afterAll(async () => {
    await disconnectTestDB();
  });

  it('registers, verifies email, logs in, and accesses profile', async () => {
    const agent = request.agent(app);

    const registerRes = await agent.post('/api/v1/auth/register').send({
      name: 'Integration User',
      email: 'integration@example.com',
      password: 'SecurePass123!'
    });

    expect(registerRes.status).toBe(201);
    expect(sentEmails.length).toBeGreaterThanOrEqual(2);

    const verificationEmail = sentEmails.find((email) => email.subject.includes('Verify'));
    expect(verificationEmail).toBeDefined();

    const token = extractToken(verificationEmail!.html);
    expect(token.length).toBeGreaterThan(0);

    const verifyRes = await agent.post('/api/v1/auth/verify-email').send({ token });
    expect(verifyRes.status).toBe(200);

    const loginRes = await agent.post('/api/v1/auth/login').send({
      email: 'integration@example.com',
      password: 'SecurePass123!'
    });

    expect(loginRes.status).toBe(200);
    expect(loginRes.body.data.user.email).toBe('integration@example.com');

    const profileRes = await agent.get('/api/v1/users/me');
    expect(profileRes.status).toBe(200);
    expect(profileRes.body.data.email).toBe('integration@example.com');
  });
});
