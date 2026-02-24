import express from 'express';
import jwt from 'jsonwebtoken';
import { Website } from '../models/index.js';
import { authenticate } from '../middleware/auth.js';
import { checkTrackerInstallation } from '../utils/trackerCheck.js';
import { storeConfigCode } from './track.js';

const router = express.Router();

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
    const { name, domain, is_connected, conversion_urls, price_selector, static_price, purchase_button_selector, cart_button_selector } = req.body;

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
    if (conversion_urls !== undefined) {
      website.conversion_urls = Array.isArray(conversion_urls)
        ? JSON.stringify(conversion_urls)
        : (typeof conversion_urls === 'string' ? conversion_urls : null);
    }
    if (price_selector !== undefined) {
      website.price_selector = price_selector || null;
    }
    if (static_price !== undefined) {
      website.static_price = static_price == null || static_price === '' ? null : parseFloat(static_price);
    }
    if (purchase_button_selector !== undefined) {
      website.purchase_button_selector = purchase_button_selector || null;
    }
    if (cart_button_selector !== undefined) {
      website.cart_button_selector = cart_button_selector || null;
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
 * POST /api/websites/:id/configure-session
 * Generate a short-lived token for the Visual Event Mapper.
 * pixel.js uses this token to authenticate when saving selectors.
 */
router.post('/:id/configure-session', async (req, res, next) => {
  try {
    const website = await Website.findOne({
      where: { id: req.params.id, user_id: req.user.id }
    });

    if (!website) {
      return res.status(404).json({ error: 'Website not found' });
    }

    if (!website.domain) {
      return res.status(400).json({ error: 'Website domain is required for configuration' });
    }

    const token = jwt.sign(
      { websiteId: website.id, userId: req.user.id, purpose: 'configure' },
      process.env.JWT_SECRET,
      { expiresIn: '30m' }
    );

    const shortCode = storeConfigCode(token);
    const protocol = website.domain.startsWith('localhost') ? 'http' : 'https';
    const configUrl = `${protocol}://${website.domain}?lehko_cfg=${shortCode}`;

    res.json({ success: true, token, configUrl, websiteId: website.id });
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

