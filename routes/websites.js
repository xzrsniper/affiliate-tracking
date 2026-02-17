import express from 'express';
import { Website, TrackerVerification } from '../models/index.js';
import { authenticate } from '../middleware/auth.js';
import { Op } from 'sequelize';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

/**
 * GET /api/websites
 * Get all websites belonging to the logged-in user
 */
router.get('/', async (req, res, next) => {
  try {
    const websites = await Website.findAll({
      where: { user_id: req.user.id },
      order: [['created_at', 'DESC']]
    });

    res.json({
      success: true,
      websites
    });
  } catch (error) {
    next(error);
  }
});

/**
 * Helper function to check if tracker is installed on a domain
 * Uses multiple methods:
 * 1. Verification ping check (checks if tracker sent verification ping recently) - PRIMARY METHOD
 * 2. HTML scraping (looks for tracker code in page source) - FALLBACK METHOD
 */
const checkTrackerInstallation = async (domain) => {
  if (!domain) return false;

  // Normalize domain
  const normalizedDomain = domain.replace(/^https?:\/\//i, '').replace(/\/+$/, '').toLowerCase();

  // Перевірка на localhost/127.0.0.1 - не можна перевірити з сервера
  const isLocalhost = /^(localhost|127\.0\.0\.1|0\.0\.0\.0)/i.test(normalizedDomain);
  if (isLocalhost) {
    console.log(`[Website Check] Localhost detected: ${normalizedDomain} - cannot check from server`);
    return false;
  }
  
  // Method 1: Check verification ping (most reliable - tracker sends pings every 5 minutes)
  // If tracker sent verification ping within last 10 minutes, it's definitely installed
  try {
    const recentVerification = await TrackerVerification.findOne({
      where: {
        domain: normalizedDomain,
        last_seen: {
          [Op.gte]: new Date(Date.now() - 10 * 60 * 1000) // Within last 10 minutes
        }
      },
      order: [['last_seen', 'DESC']]
    });

    if (recentVerification) {
      console.log(`[Website Check] ✅ Tracker verified via ping on ${normalizedDomain} (last seen: ${recentVerification.last_seen})`);
      return true;
    }
  } catch (error) {
    console.error('[Website Check] Error checking verification pings:', error);
  }

  // Method 2: HTML scraping (fallback if no verification ping found)
  const buildUrls = (domain) => {
    const clean = domain.replace(/^https?:\/\//i, '').replace(/\/+$/, '');
    return [`https://${clean}`, `http://${clean}`];
  };

  const urls = buildUrls(domain);
  let isConnected = false;
  let lastError = null;

  for (const url of urls) {
    let timeoutId = null;
    try {
      console.log(`[Website Check] Trying to fetch: ${url}`);
      
      // Використовуємо AbortController для timeout
      const controller = new AbortController();
      timeoutId = setTimeout(() => controller.abort(), 10000); // 10 seconds
      
      const response = await fetch(url, { 
        method: 'GET', 
        redirect: 'follow',
        signal: controller.signal,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
        }
      });
      
      if (timeoutId) clearTimeout(timeoutId);
      
      if (!response.ok) {
        console.log(`[Website Check] Response not OK: ${response.status} for ${url}`);
        continue;
      }
      
      const html = await response.text();
      console.log(`[Website Check] Fetched ${html.length} bytes from ${url}`);
      
      // Розширений пошук трекера - шукаємо різні варіанти
      // Перевіряємо тільки реальні індикатори наявності нашого трекера
      const trackerIndicators = [
        // Tracker v2 (новий, рекомендований)
        'tracker-v2.js',
        '/tracker-v2.js',
        'src="tracker-v2.js',
        "src='tracker-v2.js",
        'src="/tracker-v2.js',
        "src='/tracker-v2.js",
        '_affiliateTrackerV2Initialized',
        'Affiliate Tracker v2',
        // Tracker v1 (legacy)
        'tracker.js',
        '/tracker.js',
        'src="tracker.js',
        "src='tracker.js",
        'src="/tracker.js',
        "src='/tracker.js",
        'href="tracker.js',
        "href='tracker.js",
        // Конфігурація (обов'язкова частина коду для обох версій)
        'TRACKER_CONFIG',
        'window.TRACKER_CONFIG',
        'TRACKER_CONFIG =',
        'TRACKER_CONFIG=',
        // Об'єкт трекера (створюється при ініціалізації)
        'AffiliateTracker',
        'window.AffiliateTracker',
        'affiliate-tracker',
        'affiliate_tracker',
        // API endpoints (використовуються трекером)
        'api/track',
        '/api/track',
        'BASE_URL',
        'CONVERSION_KEYWORDS',
        'CONVERSION_URLS',
        'CONVERSION_SELECTORS',
        'MIN_CONFIDENCE_SCORE',
        // Інші індикатори
        'aff_ref_code',
        'affiliate_visitor_id',
        'affiliate_visitor_id',
        // GTM індикатори (якщо використовується GTM)
        '_lehkoTrackerGTMInitialized',
        '_affiliateTrackerInitialized'
      ];
      
      // Перевіряємо наявність будь-якого з індикаторів (case-insensitive)
      const htmlLower = html.toLowerCase();
      let foundTracker = false;
      let foundIndicator = null;
      
      for (let i = 0; i < trackerIndicators.length; i++) {
        const indicator = trackerIndicators[i];
        const indicatorLower = indicator.toLowerCase();
        if (htmlLower.includes(indicatorLower)) {
          foundTracker = true;
          foundIndicator = indicator;
          console.log(`[Website Check] ✅ Found tracker indicator: ${indicator}`);
          break;
        }
      }
      
      // Важливо: GTM сам по собі НЕ означає, що наш трекер встановлено
      // Тому не перевіряємо тільки GTM, а шукаємо конкретні індикатори нашого трекера
      
      if (foundTracker) {
        isConnected = true;
        console.log(`[Website Check] ✅ Tracker found on ${url}`);
        break;
      } else {
        console.log(`[Website Check] ❌ No tracker indicators found on ${url}`);
      }
    } catch (err) {
      lastError = err.message;
      if (timeoutId) clearTimeout(timeoutId);
      
      if (err.name === 'AbortError') {
        console.log(`[Website Check] Timeout for ${url}`);
      } else {
        console.log(`[Website Check] Error fetching ${url}: ${err.message}`);
      }
      continue;
    }
  }

  if (!isConnected && lastError) {
    console.log(`[Website Check] Final error: ${lastError}`);
  }

  return isConnected;
};

/**
 * POST /api/websites
 * Create a new website
 */
router.post('/', async (req, res, next) => {
  try {
    const { name, domain } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Website name is required' });
    }

    // Автоматично перевіряємо підключення при створенні, якщо вказано domain
    let is_connected = false;
    if (domain) {
      is_connected = await checkTrackerInstallation(domain);
    }

    const website = await Website.create({
      user_id: req.user.id,
      name,
      domain: domain || null,
      is_connected
    });

    res.status(201).json({
      success: true,
      message: 'Website created successfully',
      website
    });
  } catch (error) {
    next(error);
  }
});

/**
 * PUT /api/websites/:id
 * Update a website
 */
router.put('/:id', async (req, res, next) => {
  try {
    const { name, domain, is_connected } = req.body;

    const website = await Website.findOne({
      where: {
        id: req.params.id,
        user_id: req.user.id
      }
    });

    if (!website) {
      return res.status(404).json({ error: 'Website not found' });
    }

    if (name !== undefined) {
      website.name = name;
    }
    if (domain !== undefined) {
      website.domain = domain;
      // Автоматично перевіряємо підключення при зміні домену
      if (domain) {
        website.is_connected = await checkTrackerInstallation(domain);
      } else {
        // Якщо domain видалено, скидаємо статус
        website.is_connected = false;
      }
    }
    // Статус is_connected можна встановити ТІЛЬКИ через автоматичну перевірку
    // Ручне встановлення статусу заборонено - тільки через /api/websites/:id/check

    await website.save();

    res.json({
      success: true,
      message: 'Website updated successfully',
      website
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/websites/:id/check
 * Try to detect tracker installation on the website page
 */
router.get('/:id/check', async (req, res, next) => {
  try {
    const website = await Website.findOne({
      where: {
        id: req.params.id,
        user_id: req.user.id
      }
    });

    if (!website) {
      return res.status(404).json({ error: 'Website not found' });
    }

    if (!website.domain) {
      return res.status(400).json({ error: 'Domain is required to check connection' });
    }

    const isConnected = await checkTrackerInstallation(website.domain);
    
    website.is_connected = isConnected;
    await website.save();

    res.json({
      success: true,
      is_connected: isConnected,
      domain: website.domain
    });
  } catch (error) {
    next(error);
  }
});

/**
 * DELETE /api/websites/:id
 * Delete a website
 */
router.delete('/:id', async (req, res, next) => {
  try {
    const website = await Website.findOne({
      where: {
        id: req.params.id,
        user_id: req.user.id
      }
    });

    if (!website) {
      return res.status(404).json({ error: 'Website not found' });
    }

    await website.destroy();

    res.json({
      success: true,
      message: 'Website deleted successfully'
    });
  } catch (error) {
    next(error);
  }
});

export default router;

