const OPEN_CORS_PREFIXES = [
  '/pixel.js',
  '/tracker.js',
  '/api/track',
  '/track',
  '/r/',
  '/api/reports/public'
];

function requestPath(req) {
  return (req.originalUrl || req.url || '').split('?')[0];
}

export function isOpenCorsPath(req) {
  const path = requestPath(req);
  return OPEN_CORS_PREFIXES.some((prefix) => path === prefix || path.startsWith(prefix));
}

function allowedOrigins() {
  const extra = String(process.env.CORS_ORIGINS || '')
    .split(',')
    .map((s) => s.trim().replace(/\/$/, ''))
    .filter(Boolean);
  const fromEnv = [
    process.env.SITE_URL,
    process.env.FRONTEND_URL,
    process.env.APP_URL,
    'https://lehko.space',
    'https://www.lehko.space',
    'http://localhost:5173',
    'http://localhost:3000',
    'http://127.0.0.1:5173',
    'http://127.0.0.1:3000'
  ]
    .filter(Boolean)
    .map((u) => String(u).replace(/\/$/, ''));
  return new Set([...fromEnv, ...extra]);
}

export function corsOptionsFor(req) {
  const common = {
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'X-Visitor-ID',
      'X-Tracker-Version',
      'ngrok-skip-browser-warning'
    ],
    exposedHeaders: ['X-Tracker-Version'],
    optionsSuccessStatus: 204,
    preflightContinue: false
  };

  if (isOpenCorsPath(req)) {
    return {
      ...common,
      origin: '*',
      credentials: false
    };
  }

  const allowed = allowedOrigins();
  return {
    ...common,
    credentials: true,
    origin(origin, callback) {
      if (!origin) return callback(null, true);
      const normalized = String(origin).replace(/\/$/, '');
      if (allowed.has(normalized)) return callback(null, true);
      if (process.env.NODE_ENV !== 'production') return callback(null, true);
      callback(null, false);
    }
  };
}
