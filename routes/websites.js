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
 * POST /api/websites
 * Create a new website
 */
router.post('/', async (req, res, next) => {
  try {
    const { name, domain } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Website name is required' });
    }

    const website = await Website.create({
      user_id: req.user.id,
      name,
      domain: domain || null,
      is_connected: false
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
    }
    if (is_connected !== undefined) {
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

    const buildUrls = (domain) => {
      const clean = domain.replace(/^https?:\/\//i, '').replace(/\/+$/, '');
      return [`https://${clean}`, `http://${clean}`];
    };

    const urls = buildUrls(website.domain);
    let isConnected = false;
    let matchedUrl = null;

    for (const url of urls) {
      try {
        const response = await fetch(url, { method: 'GET', redirect: 'follow' });
        if (!response.ok) continue;
        const html = await response.text();
        // Heuristic: check for tracker script or config snippet
        if (html.includes('/tracker.js') || html.includes('TRACKER_CONFIG') || html.includes('AffiliateTracker')) {
          isConnected = true;
          matchedUrl = url;
          break;
        }
      } catch (err) {
        // Ignore fetch errors and try next protocol
        continue;
      }
    }

    website.is_connected = isConnected;
    await website.save();

    res.json({
      success: true,
      is_connected: isConnected,
      checked_url: matchedUrl || null
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

