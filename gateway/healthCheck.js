const { services } = require("./registry");

async function ping(url, timeoutMs = 2000) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(id);
    return res.ok;
  } catch {
    clearTimeout(id);
    return false;
  }
}

async function runHealthCheck() {
  const checks = [];

  for (const arr of services.values()) {
    for (const svc of arr) {
      checks.push(
        ping(svc.healthCheckUrl || svc.target)
          .then(ok => Object.assign(svc, { isHealthy: ok, lastChecked: Date.now() }))
      );
    }
  }
  await Promise.all(checks);
}

module.exports = {
  runHealthCheck,
};
