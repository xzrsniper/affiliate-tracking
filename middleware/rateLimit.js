const buckets = new Map();

function clientIp(req) {
  const forwarded = req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string' && forwarded.trim()) {
    return forwarded.split(',')[0].trim();
  }
  return req.ip || req.socket?.remoteAddress || 'unknown';
}

setInterval(() => {
  const now = Date.now();
  for (const [key, rec] of buckets) {
    if (now > rec.resetAt) buckets.delete(key);
  }
}, 60 * 1000).unref?.();

/**
 * Lightweight in-memory rate limiter (per-process). Enough to slow brute force
 * without adding a Redis dependency.
 */
export function rateLimit({ windowMs = 15 * 60 * 1000, max = 20, prefix = 'rl' } = {}) {
  return (req, res, next) => {
    const key = `${prefix}:${clientIp(req)}`;
    const now = Date.now();
    let rec = buckets.get(key);
    if (!rec || now > rec.resetAt) {
      rec = { count: 0, resetAt: now + windowMs };
      buckets.set(key, rec);
    }
    rec.count += 1;
    if (rec.count > max) {
      const retry = Math.max(1, Math.ceil((rec.resetAt - now) / 1000));
      res.setHeader('Retry-After', String(retry));
      return res.status(429).json({ error: 'Too many requests. Try again later.' });
    }
    next();
  };
}
