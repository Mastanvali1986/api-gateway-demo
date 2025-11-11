import express from 'express';
import bodyParser from 'body-parser';
import httpProxy from 'http-proxy';
import { registerService, deregisterService, getServices, pickInstance } from './registry.js';
import { rateLimiter } from './rateLimiter.js';
import { jwtAuth, issueToken } from './auth.js';
import { runHealthCheck, startHealthCheck } from './healthCheck.js';

const app = express();
const proxy = httpProxy.createProxyServer({});
app.use(bodyParser.json());
app.use(rateLimiter);

const PORT = process.env.PORT || 8080;
const JWT_SECRET = process.env.JWT_SECRET || 'secret123';

// --- Auth ---
app.post('/auth/login', (req, res) => {
  const { userId = 'demo', role = 'user' } = req.body;
  const token = issueToken(userId, role, JWT_SECRET);
  res.json({ token });
});

// --- Registry APIs ---
app.post('/register', (req, res) => {
  const result = registerService(req.body);
  res.json(result);
});
app.delete('/register', (req, res) => {
  const result = deregisterService(req.body);
  res.json(result);
});
app.get('/admin/services', (req, res) => res.json(getServices()));
app.post('/admin/healthcheck', async (req, res) => {
  await runHealthCheck();
  res.json(getServices());
});

// --- Proxy Logic ---
const protectedRoutes = ['/secure'];
proxy.on('error', (err, req, res) => {
  res.status(502).json({ error: err.message });
});

app.use(async (req, res, next) => {
  const prefix = Array.from(getServices().keys()).find(p => req.path.startsWith(p));
  if (!prefix) return next();

  if (protectedRoutes.some(p => prefix.startsWith(p))) {
    const middleware = jwtAuth(JWT_SECRET);
    let done = false;
    await new Promise(resolve => middleware(req, res, () => { done = true; resolve(); }));
    if (!done) return;
  }

  const instance = pickInstance(prefix);
  if (!instance) return res.status(503).json({ error: 'No healthy service' });

  const forwardUrl = instance.target + req.originalUrl.replace(prefix, '');
  req.headers['x-forwarded-for'] = req.ip;
  proxy.web(req, res, { target: forwardUrl, changeOrigin: true });
});

app.use((req, res) => res.status(404).json({ error: 'Not Found' }));

app.listen(PORT, () => {
  console.log(`Gateway running at http://localhost:${PORT}`);
});

startHealthCheck();
