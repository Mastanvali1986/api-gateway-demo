const services = new Map();
const rrIndex = new Map();

function upsertService(route, svc) {
  if (!services.has(route)) services.set(route, []);
  const arr = services.get(route);
  const existing = arr.find(x => x.target === svc.target);

  if (existing) Object.assign(existing, svc);
  else arr.push({ ...svc, isHealthy: true, lastChecked: 0 });
}

function deregisterService(route, target) {
  if (!services.has(route)) return;
  const arr = services.get(route).filter(s => s.target !== target);

  if (arr.length) services.set(route, arr);
  else services.delete(route);
  rrIndex.delete(route);
}

function pickHealthyInstance(route) {
  const arr = (services.get(route) || []).filter(s => s.isHealthy);
  if (!arr.length) return null;

  const i = (rrIndex.get(route) || 0) % arr.length;
  rrIndex.set(route, i + 1);
  return arr[i];
}

function listServices() {
  const out = {};
  for (const [route, arr] of services.entries()) {
    out[route] = arr.map(s => ({
      name: s.name,
      target: s.target,
      isHealthy: s.isHealthy,
      lastChecked: s.lastChecked,
    }));
  }
  return out;
}

module.exports = {
  services,
  upsertService,
  deregisterService,
  pickHealthyInstance,
  listServices,
};
