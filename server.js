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
import blogRoutes from './routes/blog.js';
import googleSheetsRoutes from './routes/googleSheets.js';
import reportRoutes from './routes/reports.js';
import { BlogPost, PageContent, User } from './models/index.js';
import { Op, fn, col } from 'sequelize';
import { applySeoToHtml, loadSpaIndexHtml } from './utils/seoShell.js';
import { assertProductionSecrets } from './utils/secrets.js';
import { encryptExistingGoogleTokens } from './utils/crypto.js';
import { securityHeaders } from './middleware/securityHeaders.js';
import { corsOptionsFor } from './middleware/corsPolicy.js';

dotenv.config();

const app = express();
app.disable('x-powered-by');
app.set('trust proxy', true);
const PORT = process.env.PORT || 3000;
const SITE_URL = (process.env.SITE_URL || 'https://lehko.space').replace(/\/$/, '');

function toIsoDate(value) {
  if (!value) return new Date().toISOString();
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? new Date().toISOString() : date.toISOString();
}

function escapeXml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function absoluteAssetUrl(maybeRelative) {
  if (!maybeRelative) return null;
  const raw = String(maybeRelative).trim();
  if (!raw) return null;
  if (/^https?:\/\//i.test(raw)) return raw;
  return `${SITE_URL}${raw.startsWith('/') ? raw : `/${raw}`}`;
}

// Middleware
app.use(securityHeaders);
app.use((req, res, next) => cors(corsOptionsFor(req))(req, res, next));
app.options('*', (req, res, next) => cors(corsOptionsFor(req))(req, res, next));

app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));
app.use(cookieParser());

// API responses should be fresh for dashboards; public CMS page JSON can be cached briefly.
app.use('/api', (req, res, next) => {
  const raw = (req.originalUrl || '').split('?')[0];
  const pathPart = req.path || raw;
  const isPublicPageContentGet =
    req.method === 'GET' &&
    (/^\/api\/page-content\/[^/]+$/.test(raw) ||
      /^\/page-content\/[^/]+$/.test(pathPart));
  if (isPublicPageContentGet) {
    return next();
  }
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  next();
});

// /pixel.js and /tracker.js: tiny bootstrap → always load the real tracker from
// /api/track/pixel.js (CF BYPASS + no-store). Avoids edge cache keeping a broken
// full pixel.js build for hours after deploy.
function serveTrackerBootstrap(req, res) {
  res.setHeader('Content-Type', 'application/javascript; charset=utf-8');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  // Keep in sync with public/pixel.js header version when bumping the tracker.
  const PIXEL_BOOTSTRAP_VERSION = '5.7';
  res.send(
    `(function(){var c=document.currentScript;var o=(c&&c.src)?new URL(c.src).origin:location.origin;var s=document.createElement('script');s.src=o+'/api/track/pixel.js?v=${PIXEL_BOOTSTRAP_VERSION}';s.async=true;if(c){var d=c.getAttribute('data-site');if(d)s.setAttribute('data-site',d);}document.head.appendChild(s);})();`
  );
}
app.get('/pixel.js', serveTrackerBootstrap);
app.get('/tracker.js', serveTrackerBootstrap);

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

// Legacy SEO routes: avoid soft-404 and blocked old path.
app.get('/home-new', (req, res) => {
  res.redirect(301, '/');
});

app.get('/yunit-ekonomika-rozrahunok-prybutku-marketing', (req, res) => {
  res.status(410).type('text/plain; charset=utf-8').send('Gone');
});

// Dynamic sitemap.xml with static pages, CMS pages, and blog posts.
app.get('/sitemap.xml', async (req, res, next) => {
  try {
    const urls = [];
    const pushUrl = (pathName, lastmod, priority, changefreq = 'weekly') => {
      urls.push({
        loc: `${SITE_URL}${pathName === '/' ? '' : pathName}`,
        lastmod: toIsoDate(lastmod),
        changefreq,
        priority: priority.toFixed(1)
      });
    };

    const staticPublicPages = [
      { path: '/', priority: 1.0, changefreq: 'daily' },
      { path: '/guide', priority: 0.7, changefreq: 'monthly' },
      { path: '/blog', priority: 0.9, changefreq: 'daily' },
      { path: '/terms', priority: 0.4, changefreq: 'yearly' },
      { path: '/privacy', priority: 0.4, changefreq: 'yearly' },
      { path: '/refund', priority: 0.4, changefreq: 'yearly' }
    ];

    staticPublicPages.forEach((page) => pushUrl(page.path, new Date(), page.priority, page.changefreq));

    const pageRows = await PageContent.findAll({
      attributes: ['page', [fn('MAX', col('updated_at')), 'lastmod']],
      where: {
        is_active: true,
        page: { [Op.not]: null }
      },
      group: ['page'],
      raw: true
    });

    const reservedPages = new Set([
      'dashboard', 'admin', 'settings', 'setup', 'login', 'register',
      'console-code', 'success', 'report', 'utm-builder', 'link-shortener'
    ]);
    const existingPaths = new Set(staticPublicPages.map((p) => p.path));

    for (const row of pageRows) {
      const pageName = String(row.page || '').trim().toLowerCase();
      if (!pageName || reservedPages.has(pageName)) continue;
      const pathName = pageName === 'home' ? '/' : `/${pageName}`;
      if (existingPaths.has(pathName)) continue;
      existingPaths.add(pathName);
      pushUrl(pathName, row.lastmod, 0.6, 'weekly');
    }

    const blogPosts = await BlogPost.findAll({
      attributes: ['slug', 'updated_at', 'published_at'],
      where: {
        published_at: { [Op.ne]: null },
        slug: { [Op.ne]: null }
      },
      order: [['published_at', 'DESC']],
      raw: true
    });

    for (const post of blogPosts) {
      const slug = String(post.slug || '').trim();
      if (!slug) continue;
      pushUrl(`/blog/${slug}`, post.updated_at || post.published_at, 0.8, 'weekly');
    }

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map((url) => `  <url>
    <loc>${escapeXml(url.loc)}</loc>
    <lastmod>${url.lastmod}</lastmod>
    <changefreq>${url.changefreq}</changefreq>
    <priority>${url.priority}</priority>
  </url>`).join('\n')}
</urlset>`;

    // Keep sitemap fresh so newly published posts appear quickly for crawlers.
    res.setHeader('Content-Type', 'application/xml; charset=utf-8');
    res.setHeader('Cache-Control', 'public, max-age=300, must-revalidate');
    res.send(xml);
  } catch (error) {
    next(error);
  }
});

// Public config (для фронту: Google Client ID тощо) — щоб продакшн не залежав від VITE_* при білді
app.get('/api/config/public', (req, res) => {
  const googleClientId = (process.env.GOOGLE_CLIENT_ID_PUBLIC || process.env.GOOGLE_CLIENT_ID || process.env.VITE_GOOGLE_CLIENT_ID || '').trim();
  if (process.env.NODE_ENV !== 'production') {
    console.log('📤 GET /api/config/public - googleClientId:', googleClientId ? googleClientId.substring(0, 24) + '...' : '(not set, Google Login disabled)');
  }
  res.json({ googleClientId });
});

// Tracking redirect route (must be before API routes)
app.use('/track', redirectRoutes);

// Short redirect route (alias for /track - shorter URLs like lehko.space/r/AbCdEfGh)
app.use('/r', redirectRoutes);

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/track', trackRoutes);
app.use('/api/links', linkRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/websites', websiteRoutes);
app.use('/api/page-content', pageContentRoutes);
app.use('/api/page-structure', pageStructureRoutes);
app.use('/api/blog', blogRoutes);
app.use('/api/google-sheets', googleSheetsRoutes);
app.use('/api/reports', reportRoutes);

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
  console.error('Error:', err?.message || err);
  const isDev = process.env.NODE_ENV === 'development';
  res.status(err.status || 500).json({
    error: isDev ? (err.message || 'Internal server error') : 'Internal server error',
    ...(isDev && { stack: err.stack })
  });
});

// Serve frontend in production (after all API routes)
if (process.env.NODE_ENV === 'production') {
  const frontendPath = path.join(__dirname, 'frontend', 'dist');

  function noCacheHeaders(res) {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
  }

  function sendSeoShell(res, seo, statusCode = 200) {
    noCacheHeaders(res);
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    if (statusCode >= 400 || seo?.noindex) {
      res.setHeader('X-Robots-Tag', 'noindex, nofollow');
    }
    const html = applySeoToHtml(loadSpaIndexHtml(frontendPath), {
      siteUrl: SITE_URL,
      ...seo
    });
    res.status(statusCode).send(html);
  }

  /** SPA routes that must return 200 (even when robots.txt Disallows them). */
  const SPA_EXACT_ROUTES = new Set([
    '/',
    '/guide',
    '/blog',
    '/terms',
    '/privacy',
    '/refund',
    '/home-new',
    '/login',
    '/register',
    '/verify-email',
    '/confirm-password-change',
    '/reset-password',
    '/dashboard',
    '/admin',
    '/settings',
    '/setup',
    '/utm-builder',
    '/link-shortener',
    '/console-code',
    '/success',
    '/pixel.js'
  ]);

  const SPA_PREFIX_ROUTES = [
    '/report/',
    '/r/',
    '/track/'
  ];

  function isKnownSpaRoute(pathname) {
    const pathName = (pathname || '/').split('?')[0] || '/';
    if (SPA_EXACT_ROUTES.has(pathName)) return true;
    if (pathName.startsWith('/blog/')) return true; // existence checked in /blog/:slug handler
    return SPA_PREFIX_ROUTES.some((prefix) => pathName.startsWith(prefix));
  }

  function sendSpaIndex(res, statusCode = 200, seoExtras = null) {
    noCacheHeaders(res);
    if (statusCode >= 400) {
      res.setHeader('X-Robots-Tag', 'noindex, nofollow');
    }
    if (seoExtras) {
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      const html = applySeoToHtml(loadSpaIndexHtml(frontendPath), {
        siteUrl: SITE_URL,
        ...seoExtras
      });
      return res.status(statusCode).send(html);
    }
    res.status(statusCode).sendFile(path.join(frontendPath, 'index.html'));
  }

  // Blog index + posts: inject correct title/description/canonical for crawlers.
  // Nginx must proxy /blog to Node for this to take effect.
  app.get('/blog', async (req, res, next) => {
    try {
      sendSeoShell(res, {
        title: 'Блог | lehko.space',
        description: 'Статті про трекінг реклами, ROI, Telegram/Instagram аналітику та атрибуцію продажів.',
        canonicalPath: '/blog',
        jsonLd: {
          '@context': 'https://schema.org',
          '@type': 'Blog',
          name: 'Блог lehko.space',
          url: `${SITE_URL}/blog`
        }
      });
    } catch (error) {
      next(error);
    }
  });

  app.get('/blog/:slug', async (req, res, next) => {
    try {
      const slug = String(req.params.slug || '').trim();
      if (!slug) return next();

      const post = await BlogPost.findOne({
        where: {
          slug,
          published_at: { [Op.ne]: null }
        },
        attributes: ['title', 'slug', 'excerpt', 'featured_image', 'published_at', 'updated_at', 'author_name'],
        raw: true
      });

      if (!post) {
        // Real HTTP 404 — avoids Soft 404 in Search Console while SPA still renders NotFound.
        return sendSeoShell(res, {
          title: 'Статтю не знайдено | lehko.space',
          description: 'Запитувану статтю блогу не знайдено.',
          omitCanonical: true,
          noindex: true
        }, 404);
      }

      const description = (post.excerpt || post.title || '').replace(/\s+/g, ' ').trim();
      sendSeoShell(res, {
        title: `${post.title} | lehko.space`,
        description,
        canonicalPath: `/blog/${post.slug}`,
        image: post.featured_image,
        jsonLd: {
          '@context': 'https://schema.org',
          '@type': 'Article',
          headline: post.title,
          description,
          datePublished: post.published_at,
          dateModified: post.updated_at || post.published_at,
          author: {
            '@type': 'Person',
            name: post.author_name || 'lehko.space'
          },
          mainEntityOfPage: `${SITE_URL}/blog/${post.slug}`,
          image: absoluteAssetUrl(post.featured_image) || undefined
        }
      });
    } catch (error) {
      next(error);
    }
  });

  // Головна та index.html — завжди без кешу, щоб браузер підхоплював нові assets
  app.get('/', (req, res) => {
    sendSpaIndex(res, 200);
  });
  app.get('/index.html', (req, res) => {
    sendSpaIndex(res, 200);
  });

  app.use(express.static(frontendPath, {
    maxAge: '1y',
    immutable: true,
    setHeaders: (res, filePath) => {
      if (filePath.endsWith('.html')) {
        noCacheHeaders(res);
        return;
      }

      // Vite build outputs hashed assets; safe to cache for a long time.
      if (filePath.includes(`${path.sep}assets${path.sep}`)) {
        res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
        return;
      }

      // Other static files should still be cached to avoid repeated downloads.
      res.setHeader('Cache-Control', 'public, max-age=604800');
    }
  }));

  // SPA fallback: known routes → 200; unknown → real 404 (still serves index.html for client NotFound).
  // Nginx must proxy HTML fallback to Node (not try_files → index.html) or Soft 404 persists.
  app.get('*', (req, res) => {
    const pathname = req.path || '/';
    if (isKnownSpaRoute(pathname)) {
      return sendSpaIndex(res, 200);
    }
    return sendSpaIndex(res, 404, {
      title: 'Сторінку не знайдено | lehko.space',
      description: 'Запитувану сторінку не знайдено.',
      omitCanonical: true,
      noindex: true
    });
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
    assertProductionSecrets();

    const connected = await testConnection();
    if (!connected) {
      console.warn('⚠️  Warning: Failed to connect to database. Server will start but database features may not work.');
      console.warn('⚠️  Please ensure MySQL is running and database is configured.');
    } else {
      try {
        const encrypted = await encryptExistingGoogleTokens(User);
        if (encrypted > 0) {
          console.log(`🔐 Encrypted ${encrypted} Google Sheets refresh token(s) at rest`);
        }
      } catch (migrateError) {
        console.warn('⚠️  Could not encrypt stored OAuth tokens:', migrateError.message);
      }
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
    if (process.env.NODE_ENV === 'production' && /must be set in production/i.test(String(error?.message || ''))) {
      process.exit(1);
    }
    app.listen(PORT, () => {
      console.log(`🚀 Server is running on http://localhost:${PORT} (without database)`);
      console.warn('⚠️  Database connection failed - some features may not work');
    });
  }
};

startServer();

export default app;
