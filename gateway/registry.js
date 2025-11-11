const services = new Map();
const rrIndex = new Map();

export function registerService({ name, route, target, healthCheckUrl }) {
  if (!route || !target) return { error: 'route and target required' };
  if (!services.has(route)) services.set(route, []);
  const arr = services.get(route);
  const exists = arr.find(s => s.target === target);
  if (!exists) arr.push({ name, target, healthCheckUrl, isHealthy: true });
  return { ok: true, route, target };
}

export function deregisterService({ route, target }) {
  if (!services.has(route)) return { error: 'not found' };
  const arr = services.get(route).filter(s => s.target !== target);
  arr.length ? services.set(route, arr) : services.delete(route);
  return { ok: true };
}

export function getServices() {
  return services;
}

export function pickInstance(route) {
  const arr = (services.get(route) || []).filter(s => s.isHealthy);
  if (!arr.length) return null;
  const i = rrIndex.get(route) || 0;
  rrIndex.set(route, (i + 1) % arr.length);
  return arr[i];
}
