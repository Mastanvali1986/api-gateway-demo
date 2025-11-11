const ipRequests = new Map();
const LIMIT = 60;
const WINDOW = 60_000;

export function rateLimiter(req, res, next) {
  const ip = req.ip;
  const now = Date.now();
  const data = ipRequests.get(ip) || { count: 0, start: now };
  if (now - data.start > WINDOW) {
    data.count = 0;
    data.start = now;
  }
  data.count++;
  ipRequests.set(ip, data);
  if (data.count > LIMIT)
    return res.status(429).json({ error: 'Too many requests' });
  next();
}
