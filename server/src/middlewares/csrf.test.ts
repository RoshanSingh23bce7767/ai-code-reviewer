import request from 'supertest';
import express from 'express';
import cookieParser from 'cookie-parser';
import { csrfProtection, setCsrfToken } from './csrf';

describe('CSRF protection', () => {
  afterEach(() => {
    delete process.env.CSRF_ENABLED;
    process.env.NODE_ENV = 'test';
  });

  it('blocks state-changing requests without a valid token in production', async () => {
    process.env.NODE_ENV = 'production';

    const app = express();
    app.use(cookieParser());
    app.use(setCsrfToken);
    app.post('/secure', csrfProtection, (_req, res) => res.status(200).json({ ok: true }));

    const res = await request(app)
      .post('/secure')
      .send({});

    expect(res.status).toBe(403);
  });

  it('allows state-changing requests with a matching token', async () => {
    process.env.NODE_ENV = 'production';

    const app = express();
    app.use(cookieParser());
    app.use(express.json());
    app.use(setCsrfToken);
    app.get('/csrf', (req, res) => {
      const csrfRequest = req as typeof req & { csrfToken?: string };
      res.status(200).json({ token: csrfRequest.csrfToken });
    });
    app.post('/secure', csrfProtection, (_req, res) => res.status(200).json({ ok: true }));

    const agent = request.agent(app);
    const tokenRes = await agent.get('/csrf');
    const token = tokenRes.headers['x-csrf-token'];

    const res = await agent
      .post('/secure')
      .set('X-CSRF-Token', String(token))
      .send({});

    expect(res.status).toBe(200);
  });
});
