const RATE_LIMIT_MAX = 60; 
const RATE_LIMIT_WINDOW_MS = 60_000;

const ipBuckets = new Map();

function rateLimiter(req, res, next) {
  const ip = req.ip || req.connection.remoteAddress || "unknown";
  const now = Date.now();

  const entry = ipBuckets.get(ip) || { count: 0, windowStart: now };

  if (now - entry.windowStart > RATE_LIMIT_WINDOW_MS) {
    entry.count = 0;
    entry.windowStart = now;
  }

  entry.count++;
  ipBuckets.set(ip, entry);

  if (entry.count > RATE_LIMIT_MAX) {
    return res.status(429).json({
      error: "Too Many Requests",
      details: `Rate limit: ${RATE_LIMIT_MAX}/${RATE_LIMIT_WINDOW_MS / 1000}s`,
    });
  }

  next();
}

module.exports = { rateLimiter };
