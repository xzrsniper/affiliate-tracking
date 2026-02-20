import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { testConnection } from './config/database.js';
import './models/index.js'; // Import models to register associations

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Import routes
import authRoutes from './routes/auth.js';
import trackRoutes from './routes/track.js';
import linkRoutes from './routes/links.js';
import adminRoutes from './routes/admin.js';
import redirectRoutes from './routes/redirect.js';
import websiteRoutes from './routes/websites.js';
import pageContentRoutes from './routes/pageContent.js';
import pageStructureRoutes from './routes/pageStructure.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
// CORS: Allow requests from ANY origin (for JS pixel on client domains)
app.use(cors({
  origin: '*', // Allow all origins for tracking pixel
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Visitor-ID', 'X-Tracker-Version', 'ngrok-skip-browser-warning'],
  exposedHeaders: ['X-Tracker-Version'],
  credentials: false,
  preflightContinue: false,
  optionsSuccessStatus: 204
}));

// Explicitly handle OPTIONS requests for CORS preflight
app.options('*', cors());

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser()); // Enable cookie parsing for conversion tracking

// Trust proxy for accurate IP detection (if behind reverse proxy)
app.set('trust proxy', true);

// Serve pixel.js — CORS + MIME щоб не було ERR_BLOCKED_BY_ORB при завантаженні з GTM/інших сайтів
function serveTrackerScript(req, res) {
  res.setHeader('Content-Type', 'application/javascript; charset=utf-8');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Cache-Control', 'public, max-age=300');
  res.sendFile(path.join(__dirname, 'public', 'pixel.js'));
}
app.get('/pixel.js', serveTrackerScript);
app.get('/tracker.js', serveTrackerScript);

// Serve static files (for other static files)
app.use(express.static('public', {
  setHeaders: (res, path) => {
    // Set CORS headers for all static files
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET');
    // Set proper Content-Type for JavaScript files
    if (path.endsWith('.js')) {
      res.setHeader('Content-Type', 'application/javascript; charset=utf-8');
      res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
      res.setHeader('Cross-Origin-Embedder-Policy', 'unsafe-none');
    }
  }
}));

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'Server is running' });
});

// Public config (для фронту: Google Client ID тощо) — щоб продакшн не залежав від VITE_* при білді
app.get('/api/config/public', (req, res) => {
  const googleClientId = process.env.GOOGLE_CLIENT_ID_PUBLIC || process.env.VITE_GOOGLE_CLIENT_ID || '';
  console.log('📤 GET /api/config/public - GOOGLE_CLIENT_ID_PUBLIC:', googleClientId ? googleClientId.substring(0, 20) + '...' : '(not set)');
  res.json({ googleClientId });
});

// Tracking redirect route (must be before API routes)
app.use('/track', redirectRoutes);

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/track', trackRoutes);
app.use('/api/links', linkRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/websites', websiteRoutes);
app.use('/api/page-content', pageContentRoutes);
app.use('/api/page-structure', pageStructureRoutes);

// Сторінка «Код для консолі» — працює на бекенді, не залежить від версії фронту на хостингу
app.get('/console-code', (req, res) => {
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  const base = (req.protocol + '://' + req.get('host')).replace(/\/$/, '');
  res.send(`<!DOCTYPE html>
<html lang="uk">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>LehkoTrack — Код для консолі</title>
  <style>
    * { box-sizing: border-box; }
    body { font-family: system-ui, sans-serif; max-width: 560px; margin: 2rem auto; padding: 0 1rem; background: #1e293b; color: #e2e8f0; }
    h1 { font-size: 1.25rem; margin-bottom: 1rem; }
    p { margin: 0.5rem 0; font-size: 0.9rem; color: #94a3b8; }
    select, button, textarea { width: 100%; padding: 0.6rem 0.75rem; margin: 0.5rem 0; border-radius: 8px; font-size: 0.95rem; }
    select, textarea { background: #334155; color: #e2e8f0; border: 1px solid #475569; }
    button { background: #f59e0b; color: #1e293b; border: none; font-weight: 600; cursor: pointer; }
    button:disabled { opacity: 0.6; cursor: not-allowed; }
    button.secondary { background: #475569; color: #e2e8f0; margin-top: 0.25rem; }
    textarea { min-height: 80px; resize: vertical; }
    .ok { color: #4ade80; }
    .err { color: #f87171; }
    a { color: #f59e0b; }
  </style>
</head>
<body>
  <h1>Код для консолі (Visual Mapper)</h1>
  <p>Оберіть сайт і натисніть «Отримати код». Потім на сайті клієнта: F12 → Console → вставте код → Enter. Код дійсний 10 хв.</p>
  <p>Якщо списку немає — <a href="${base}/">увійдіть у LehkoTrack</a>, потім поверніться сюди.</p>
  <select id="site" style="margin-bottom:0.5rem"></select>
  <button id="btnGet">Отримати код</button>
  <textarea id="out" placeholder="Тут з'явиться код після натискання «Отримати код»" readonly></textarea>
  <button id="btnCopy" class="secondary" disabled>Скопіювати в буфер</button>
  <p id="msg"></p>
  <script>
    const base = ${JSON.stringify(base)};
    const select = document.getElementById('site');
    const out = document.getElementById('out');
    const btnGet = document.getElementById('btnGet');
    const btnCopy = document.getElementById('btnCopy');
    const msg = document.getElementById('msg');
    function show(m, isErr) { msg.textContent = m; msg.className = isErr ? 'err' : 'ok'; }
    fetch(base + '/api/websites', { credentials: 'include' }).then(r => {
      if (r.status === 401) { show('Увійдіть у LehkoTrack на головній сторінці, потім оновіть цю сторінку.', true); return []; }
      return r.json();
    }).then(data => {
      const list = (data && data.websites) || [];
      if (list.length === 0 && !data.error) show('Сайтів не знайдено. Додайте сайт у Налаштування.', true);
      select.innerHTML = list.map(w => '<option value="' + w.id + '">' + (w.name || w.domain || w.id) + '</option>').join('');
    }).catch(() => show('Помилка завантаження. Перевірте, що ви увійшли.', true));
    btnGet.onclick = function() {
      const id = select.value;
      if (!id) { show('Оберіть сайт', true); return; }
      btnGet.disabled = true;
      show('Завантаження…');
      fetch(base + '/api/websites/' + id + '/configure-session', { method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' } })
        .then(r => r.json())
        .then(d => {
          if (d.error || !d.configUrl) { show(d.error || 'Помилка'); btnGet.disabled = false; return; }
          const codeMatch = d.configUrl.match(/lehko_cfg=([^&]+)/);
          const code = codeMatch ? codeMatch[1] : '';
          if (!code) { show('Помилка формату посилання'); btnGet.disabled = false; return; }
          const mapperUrl = base + '/api/track/mapper/' + code;
          const snippet = "var s=document.createElement('script');s.src='" + mapperUrl + "';document.head.appendChild(s);";
          out.value = snippet;
          show('Код готовий. Натисніть «Скопіювати в буфер».');
          btnCopy.disabled = false;
          btnGet.disabled = false;
        })
        .catch(() => { show('Помилка мережі'); btnGet.disabled = false; });
    };
    btnCopy.onclick = function() {
      if (!out.value) return;
      navigator.clipboard.writeText(out.value).then(() => show('Скопійовано!')).catch(() => show('Не вдалося скопіювати', true));
    };
  </script>
</body>
</html>`);
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// Serve frontend in production (after all API routes)
if (process.env.NODE_ENV === 'production') {
  const frontendPath = path.join(__dirname, 'frontend', 'dist');
  // Static assets (JS/CSS with hash in name) — cache aggressively
  app.use(express.static(frontendPath, {
    maxAge: '1h',
    setHeaders: (res, filePath) => {
      // index.html should never be cached
      if (filePath.endsWith('.html')) {
        res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
        res.setHeader('Pragma', 'no-cache');
        res.setHeader('Expires', '0');
      }
    }
  }));
  app.get('*', (req, res) => {
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    res.sendFile(path.join(frontendPath, 'index.html'));
  });
} else {
  // In development, Vite handles frontend
  // 404 handler for API routes only
  app.use((req, res) => {
    res.status(404).json({ error: 'Route not found' });
  });
}

// Start server
const startServer = async () => {
  try {
    // Test database connection
    const connected = await testConnection();
    if (!connected) {
      console.warn('⚠️  Warning: Failed to connect to database. Server will start but database features may not work.');
      console.warn('⚠️  Please ensure MySQL is running and database is configured.');
      // Do not exit, allow server to start for frontend development
    }

    app.listen(PORT, () => {
      console.log(`🚀 Server is running on http://localhost:${PORT}`);
      console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
      if (!connected) {
        console.warn('⚠️  Database connection failed - some features may not work');
      }
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    // Still try to start the server even if DB connection fails
    app.listen(PORT, () => {
      console.log(`🚀 Server is running on http://localhost:${PORT} (without database)`);
      console.warn('⚠️  Database connection failed - some features may not work');
    });
  }
};

startServer();

export default app;
