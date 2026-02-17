import express from 'express';
import { Website } from '../models/index.js';
import { authenticate } from '../middleware/auth.js';
import { checkTrackerInstallation } from '../utils/trackerCheck.js';

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

