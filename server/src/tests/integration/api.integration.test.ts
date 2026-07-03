jest.mock('../../config/logger', () => ({
  __esModule: true,
  default: { info: jest.fn(), warn: jest.fn(), error: jest.fn() }
}));

import request from 'supertest';
import { app } from '../../server';

describe('API integration', () => {
  it('returns version metadata at /api', async () => {
    const res = await request(app).get('/api');

    expect(res.status).toBe(200);
    expect(res.body.version).toBe('v1');
    expect(res.body.docs).toBe('/api/docs');
  });

  it('serves OpenAPI docs', async () => {
    const jsonRes = await request(app).get('/api/docs/openapi.json');
    expect(jsonRes.status).toBe(200);
    expect(jsonRes.body.openapi).toBe('3.0.3');

    const uiRes = await request(app).get('/api/docs/');
    expect(uiRes.status).toBe(200);
    expect(uiRes.text).toContain('swagger');
  });

  it('includes X-Request-ID on responses', async () => {
    const res = await request(app)
      .get('/')
      .set('X-Request-ID', 'integration-request-id');

    expect(res.headers['x-request-id']).toBe('integration-request-id');
  });

  it('protects dashboard routes without authentication', async () => {
    const res = await request(app).get('/api/v1/dashboard/stats');
    expect(res.status).toBe(401);
  });
});
