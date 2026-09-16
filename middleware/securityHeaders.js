const TRACKING_PATHS = [/^\/pixel\.js$/, /^\/tracker\.js$/, /^\/api\/track(?:\/|$)/, /^\/track(?:\/|$)/, /^\/r\//];

function isTrackingPath(req) {
  const path = (req.originalUrl || req.url || '').split('?')[0];
  return TRACKING_PATHS.some((re) => re.test(path));
}

export function securityHeaders(req, res, next) {
  res.removeHeader('X-Powered-By');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  res.setHeader('X-DNS-Prefetch-Control', 'off');
  res.setHeader('X-Download-Options', 'noopen');
  res.setHeader('X-Permitted-Cross-Domain-Policies', 'none');

  if (!isTrackingPath(req)) {
    res.setHeader('X-Frame-Options', 'SAMEORIGIN');
    res.setHeader('Cross-Origin-Opener-Policy', 'same-origin-allow-popups');
  }

  if (process.env.NODE_ENV === 'production') {
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  }

  next();
}
