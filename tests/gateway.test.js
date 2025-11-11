import request from 'supertest';
import express from 'express';
import { rateLimiter } from '../gateway/rateLimiter.js';

test('rateLimiter should block after limit', async () => {
  const app = express();
  app.use(rateLimiter);
  app.get('/', (_, res) => res.json({ ok: true }));

  for (let i = 0; i < 60; i++) await request(app).get('/');
  const res = await request(app).get('/');
  expect(res.status).toBe(429);
});
