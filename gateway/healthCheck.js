import fetch from 'node-fetch';
import { getServices } from './registry.js';

async function ping(url) {
  try {
    const res = await fetch(url, { timeout: 2000 });
    return res.ok;
  } catch {
    return false;
  }
}

export async function runHealthCheck() {
  const registry = getServices();
  for (const arr of registry.values()) {
    for (const s of arr) {
      s.isHealthy = s.healthCheckUrl ? await ping(s.healthCheckUrl) : true;
    }
  }
}

export function startHealthCheck() {
  setInterval(runHealthCheck, 10_000).unref();
}
