import request from 'supertest';
import express from 'express';
import { requestIdMiddleware } from './requestId';

describe('requestId middleware', () => {
  const app = express();
  app.use(requestIdMiddleware);
  app.get('/ping', (_req, res) => {
    res.status(200).json({ ok: true });
  });

  it('generates an X-Request-ID when one is not provided', async () => {
    const res = await request(app).get('/ping');

    expect(res.headers['x-request-id']).toBeDefined();
    expect(String(res.headers['x-request-id']).length).toBeGreaterThan(0);
  });

  it('preserves a valid incoming X-Request-ID', async () => {
    const res = await request(app)
      .get('/ping')
      .set('X-Request-ID', 'test-request-123');

    expect(res.headers['x-request-id']).toBe('test-request-123');
  });
});
