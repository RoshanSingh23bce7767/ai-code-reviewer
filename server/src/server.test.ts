import request from 'supertest';
import jwt from 'jsonwebtoken';
import { app } from './server';
import { getJwtSecret } from './config/env';

const signAccessToken = () => jwt.sign(
  {
    userId: '507f1f77bcf86cd799439011',
    email: 'user@example.com',
    role: 'user'
  },
  getJwtSecret(),
  {
    expiresIn: '15m',
    issuer: 'ai-code-review-platform'
  }
);

describe('admin backup endpoint', () => {
  it('rejects unauthenticated requests', async () => {
    const res = await request(app).post('/admin/backup');

    expect(res.status).toBe(401);
  });
});

describe('API security guards', () => {
  it('returns API version metadata', async () => {
    const res = await request(app).get('/api');

    expect(res.status).toBe(200);
    expect(res.body.version).toBe('v1');
    expect(res.body.endpoints.v1).toBe('/api/v1');
  });

  it('exposes OpenAPI documentation', async () => {
    const res = await request(app).get('/api/docs/openapi.json');

    expect(res.status).toBe(200);
    expect(res.body.info.title).toBe('AI Code Review API');
  });

  it('adds X-Request-ID to responses', async () => {
    const res = await request(app).get('/health');

    expect(res.headers['x-request-id']).toBeDefined();
  });

  it('sets security headers via helmet', async () => {
    const res = await request(app).get('/health');

    expect(res.headers['x-content-type-options']).toBe('nosniff');
    expect(res.headers['content-security-policy']).toBeDefined();
  });

  it('rejects login requests with invalid email', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: 'not-an-email',
        password: 'Password123!'
      });

    expect(res.status).toBe(400);
    expect(res.body.errorCode).toBe('VALIDATION_001');
  });

  it('rejects review title updates with empty title', async () => {
    const res = await request(app)
      .patch('/api/v1/reviews/507f1f77bcf86cd799439011/title')
      .set('Authorization', `Bearer ${signAccessToken()}`)
      .send({ title: '' });

    expect(res.status).toBe(400);
    expect(res.body.errorCode).toBe('VALIDATION_001');
  });

  it('rejects profile updates without any fields', async () => {
    const res = await request(app)
      .patch('/api/v1/users/me')
      .set('Authorization', `Bearer ${signAccessToken()}`)
      .send({});

    expect(res.status).toBe(400);
    expect(res.body.errorCode).toBe('VALIDATION_001');
  });

  it('rejects unsafe NoSQL-style request keys', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: { $ne: null },
        password: 'Password123!'
      });

    expect(res.status).toBe(400);
    expect(res.body.errorCode).toBe('VALIDATION_001');
  });

  it('rejects malformed review IDs before hitting data access', async () => {
    const res = await request(app)
      .get('/api/v1/reviews/not-an-object-id')
      .set('Authorization', `Bearer ${signAccessToken()}`);

    expect(res.status).toBe(400);
    expect(res.body.errorCode).toBe('VALIDATION_001');
  });
});
