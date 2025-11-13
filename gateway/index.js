const express = require("express");
const bodyParser = require("body-parser");
const httpProxy = require("http-proxy");

const { jwtAuth, login } = require("./auth");
const { rateLimiter } = require("./rateLimiter");
const { upsertService, deregisterService, pickHealthyInstance, listServices } = require("./registry");
const { runHealthCheck } = require("./healthCheck");

const PORT = process.env.PORT || 8080;
const HEALTH_INTERVAL_MS = 10_000;

const app = express();
app.use(bodyParser.json());
app.use(rateLimiter);

// LOGIN
app.post("/auth/login", login);

// REGISTER SERVICES
app.post("/register", (req, res) => {
  const { name, route, target, healthCheckUrl } = req.body || {};
  if (!name || !route || !target)
    return res.status(400).json({ error: "name, route, target are required" });

  upsertService(route, { name, route, target, healthCheckUrl });
  res.json({ ok: true, services: listServices() });
});

app.delete("/register", (req, res) => {
  const { route, target } = req.body || {};
  if (!route || !target)
    return res.status(400).json({ error: "route, target required" });

  deregisterService(route, target);
  res.json({ ok: true, services: listServices() });
});

/**
 * ADMIN services
 *  jwtAuth(true) to authorise admin users
 */
app.get("/admin/services", jwtAuth(true), (req, res) => {
  res.json({ services: listServices() });
});

app.post("/admin/healthcheck",jwtAuth(true), async (req, res) => {
  await runHealthCheck();
  res.json({ ok: true, services: listServices() });
});

setInterval(runHealthCheck, HEALTH_INTERVAL_MS).unref();

// PROXY
const proxy = httpProxy.createProxyServer({});

proxy.on("error", (err, req, res) => {
  if (!res.headersSent)
    res.status(502).json({ error: "Bad Gateway", details: err.message });
});

app.use(async (req, res, next) => {
  const prefixes = Array.from(listServices() ? Object.keys(listServices()) : [])
    .sort((a, b) => b.length - a.length);

  const prefix = prefixes.find(p => req.path.startsWith(p));
  if (!prefix) return next();

  const targetSvc = pickHealthyInstance(prefix);
  if (!targetSvc)
    return res.status(503).json({ error: "No healthy instance" });

  const upstreamPath = req.originalUrl.replace(prefix, "") || "/";
  const forwardUrl = targetSvc.target + upstreamPath;

  proxy.web(req, res, { target: forwardUrl, changeOrigin: true });
});

app.use((req, res) => {
  res.status(404).json({ error: "Route not found" });
});

app.listen(PORT, () =>
  console.log(`Gateway running http://localhost:${PORT}`)
);
