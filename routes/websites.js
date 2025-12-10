import express from 'express';
import { Website } from '../models/index.js';
import { authenticate } from '../middleware/auth.js';

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
 */
const checkTrackerInstallation = async (domain) => {
  if (!domain) return false;

  const buildUrls = (domain) => {
    const clean = domain.replace(/^https?:\/\//i, '').replace(/\/+$/, '');
    return [`https://${clean}`, `http://${clean}`];
  };

  const urls = buildUrls(domain);
  let isConnected = false;

  for (const url of urls) {
    let timeoutId = null;
    try {
      // Використовуємо AbortController для timeout
      const controller = new AbortController();
      timeoutId = setTimeout(() => controller.abort(), 10000); // 10 seconds
      
      const response = await fetch(url, { 
        method: 'GET', 
        redirect: 'follow',
        signal: controller.signal,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      });
      
      if (timeoutId) clearTimeout(timeoutId);
      
      if (!response.ok) continue;
      
      const html = await response.text();
      
      // Розширений пошук трекера - шукаємо різні варіанти
      const trackerIndicators = [
        '/tracker.js',
        'tracker.js',
        'TRACKER_CONFIG',
        'AffiliateTracker',
        'affiliate-tracker',
        'affiliate_tracker',
        'window.TRACKER_CONFIG',
        'BASE_URL',
        'CONVERSION_KEYWORDS',
        'api/track'
      ];
      
      // Перевіряємо наявність будь-якого з індикаторів
      const foundTracker = trackerIndicators.some(indicator => {
        if (indicator.includes('.')) {
          // Для шляхів шукаємо в src або href
          return html.includes(`src="${indicator}`) || 
                 html.includes(`src='${indicator}`) ||
                 html.includes(`href="${indicator}`) ||
                 html.includes(`href='${indicator}`) ||
                 html.includes(indicator);
        }
        // Для текстових індикаторів
        return html.includes(indicator);
      });
      
      if (foundTracker) {
        isConnected = true;
        break;
      }
    } catch (err) {
      // Ignore fetch errors (timeout, network errors, etc.) and try next protocol
      if (timeoutId) clearTimeout(timeoutId);
      continue;
    }
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
      }
    }
    if (is_connected !== undefined && domain === undefined) {
      // Дозволяємо ручне встановлення статусу тільки якщо domain не змінюється
      website.is_connected = is_connected;
    }

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

