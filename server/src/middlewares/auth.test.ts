import request from 'supertest';
import express from 'express';
import cookieParser from 'cookie-parser';
import jwt from 'jsonwebtoken';
import { protect } from './auth';

const userId = '507f1f77bcf86cd799439011';

describe('protect middleware', () => {
  beforeEach(() => {
    process.env.JWT_SECRET = 'test-secret';
    process.env.NODE_ENV = 'test';
  });

  it('accepts an access token from cookies when no bearer header is present', async () => {
    const app = express();
    app.use(cookieParser());
    app.get('/protected', protect, (_req, res) => res.status(200).json({ ok: true }));

    const token = jwt.sign(
      { userId, email: 'user@example.com', role: 'user' },
      'test-secret',
      { expiresIn: '15m', issuer: 'ai-code-review-platform' }
    );

    const res = await request(app)
      .get('/protected')
      .set('Cookie', [`accessToken=${token}`]);

    expect(res.status).toBe(200);
  });

  it('rejects tokens with malformed payloads', async () => {
    const app = express();
    app.use(cookieParser());
    app.get('/protected', protect, (_req, res) => res.status(200).json({ ok: true }));

    const token = jwt.sign(
      { userId: 'not-an-object-id', email: 'user@example.com', role: 'user' },
      'test-secret',
      { expiresIn: '15m', issuer: 'ai-code-review-platform' }
    );

    const res = await request(app)
      .get('/protected')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(401);
  });

  it('rejects requests with no token', async () => {
    const app = express();
    app.use(cookieParser());
    app.get('/protected', protect, (_req, res) => res.status(200).json({ ok: true }));

    const res = await request(app).get('/protected');

    expect(res.status).toBe(401);
  });
});
