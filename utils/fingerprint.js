// Generate or retrieve visitor fingerprint from request
export const getVisitorFingerprint = (req) => {
  // Try to get from custom header first (set by JS pixel)
  if (req.headers['x-visitor-id']) {
    return req.headers['x-visitor-id'];
  }

  // Fallback: generate from IP + User Agent
  const ip = req.ip || req.connection.remoteAddress || 'unknown';
  const userAgent = req.headers['user-agent'] || 'unknown';
  
  // Simple hash-like fingerprint (not cryptographically secure, but good enough for tracking)
  return Buffer.from(`${ip}-${userAgent}`).toString('base64').substring(0, 32);
};

export const getClientIP = (req) => {
  return req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
         req.headers['x-real-ip'] ||
         req.ip ||
         req.connection.remoteAddress ||
         'unknown';
};
