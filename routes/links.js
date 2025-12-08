import express from 'express';
import { Link, Click, Conversion, User } from '../models/index.js';
import { authenticate } from '../middleware/auth.js';
import { generateUniqueCode } from '../utils/codeGenerator.js';
import { Op } from 'sequelize';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

/**
 * POST /api/links/create
 * Create a new tracking link
 * Critical Logic: Check if user has reached their link_limit
 */
router.post('/create', async (req, res, next) => {
  try {
    const { original_url, name, source_type } = req.body;

    if (!original_url) {
      return res.status(400).json({ error: 'original_url is required' });
    }

    // Validate URL format
    try {
      new URL(original_url);
    } catch (e) {
      return res.status(400).json({ error: 'Invalid URL format' });
    }

    // Critical Logic: Check if user has reached link_limit
    const currentLinkCount = await Link.count({ 
      where: { user_id: req.user.id } 
    });

    if (currentLinkCount >= req.user.link_limit) {
      return res.status(403).json({ 
        error: `Link limit reached. You have reached your maximum of ${req.user.link_limit} links. Please contact admin to increase your limit.`,
        current_links: currentLinkCount,
        link_limit: req.user.link_limit
      });
    }

    // Generate unique code using nanoid
    let uniqueCode;
    let codeExists = true;
    
    // Ensure code is unique (retry if collision - very unlikely with nanoid)
    while (codeExists) {
      uniqueCode = generateUniqueCode();
      const existingLink = await Link.findOne({ where: { unique_code: uniqueCode } });
      codeExists = !!existingLink;
    }

    // Create the link
    const link = await Link.create({
      user_id: req.user.id,
      original_url: original_url,
      name: name || null,
      source_type: source_type || null,
      unique_code: uniqueCode
    });

    res.status(201).json({
      success: true,
      message: 'Link created successfully',
      link: {
        id: link.id,
        name: link.name,
        original_url: link.original_url,
        source_type: link.source_type,
        unique_code: link.unique_code,
        tracking_url: `${req.protocol}://${req.get('host')}/track/${link.unique_code}`,
        created_at: link.created_at
      },
      usage: {
        current_links: currentLinkCount + 1,
        link_limit: req.user.link_limit,
        remaining: req.user.link_limit - (currentLinkCount + 1)
      }
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/links/my-links
 * Get all links belonging to the logged-in user
 * Includes count of clicks/conversions using Sequelize includes
 */
router.get('/my-links', async (req, res, next) => {
  try {
    const links = await Link.findAll({
      where: { user_id: req.user.id },
      include: [
        {
          model: Click,
          as: 'clicks',
          attributes: ['id', 'visitor_fingerprint', 'created_at']
        },
        {
          model: Conversion,
          as: 'conversions',
          attributes: ['id', 'order_value', 'created_at']
        }
      ],
      order: [['created_at', 'DESC']]
    });

    // Calculate stats for each link
    const linksWithStats = links.map(link => {
      const clicks = link.clicks || [];
      const conversions = link.conversions || [];

      // Unique clicks: count distinct visitor fingerprints
      const uniqueFingerprints = new Set(clicks.map(c => c.visitor_fingerprint));
      const uniqueClicks = uniqueFingerprints.size;

      // Total clicks
      const totalClicks = clicks.length;

      // Conversions count and revenue
      const totalConversions = conversions.length;
      const totalRevenue = conversions.reduce((sum, conv) => 
        sum + parseFloat(conv.order_value || 0), 0
      );

      return {
        id: link.id,
        name: link.name,
        original_url: link.original_url,
        source_type: link.source_type,
        unique_code: link.unique_code,
        tracking_url: `${req.protocol}://${req.get('host')}/track/${link.unique_code}`,
        created_at: link.created_at,
        stats: {
          unique_clicks: uniqueClicks,
          total_clicks: totalClicks,
          conversions: totalConversions,
          total_revenue: parseFloat(totalRevenue.toFixed(2))
        }
      };
    });

    res.json({
      success: true,
      links: linksWithStats,
      summary: {
        total_links: links.length,
        link_limit: req.user.link_limit,
        remaining_slots: Math.max(0, req.user.link_limit - links.length)
      }
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/links/:id
 * Get single link by ID (belonging to current user)
 */
router.get('/:id', async (req, res, next) => {
  try {
    const link = await Link.findOne({
      where: {
        id: req.params.id,
        user_id: req.user.id
      },
      include: [
        {
          model: Click,
          as: 'clicks',
          attributes: ['id', 'visitor_fingerprint', 'ip_address', 'created_at']
        },
        {
          model: Conversion,
          as: 'conversions',
          attributes: ['id', 'order_value', 'created_at']
        }
      ]
    });

    if (!link) {
      return res.status(404).json({ error: 'Link not found' });
    }

    // Calculate stats
    const clicks = link.clicks || [];
    const conversions = link.conversions || [];
    const uniqueFingerprints = new Set(clicks.map(c => c.visitor_fingerprint));

    res.json({
      success: true,
      link: {
        id: link.id,
        name: link.name,
        original_url: link.original_url,
        source_type: link.source_type,
        unique_code: link.unique_code,
        tracking_url: `${req.protocol}://${req.get('host')}/track/${link.unique_code}`,
        created_at: link.created_at,
        stats: {
          unique_clicks: uniqueFingerprints.size,
          total_clicks: clicks.length,
          conversions: conversions.length,
          total_revenue: conversions.reduce((sum, conv) => 
            sum + parseFloat(conv.order_value || 0), 0
          ).toFixed(2)
        }
      }
    });
  } catch (error) {
    next(error);
  }
});

/**
 * PUT /api/links/:id
 * Update link (only original_url can be updated)
 */
router.put('/:id', authenticate, async (req, res, next) => {
  try {
    const { original_url, name, source_type } = req.body;

    const link = await Link.findOne({
      where: {
        id: req.params.id,
        user_id: req.user.id
      }
    });

    if (!link) {
      return res.status(404).json({ error: 'Link not found' });
    }

    if (original_url) {
      // Validate URL
      try {
        new URL(original_url);
      } catch (e) {
        return res.status(400).json({ error: 'Invalid URL format' });
      }
      link.original_url = original_url;
    }
    
    if (name !== undefined) {
      link.name = name || null;
    }
    
    if (source_type !== undefined) {
      link.source_type = source_type || null;
    }
    
    await link.save();

    res.json({
      success: true,
      message: 'Link updated successfully',
      link: {
        id: link.id,
        name: link.name,
        original_url: link.original_url,
        source_type: link.source_type,
        unique_code: link.unique_code,
        tracking_url: `${req.protocol}://${req.get('host')}/track/${link.unique_code}`,
        created_at: link.created_at
      }
    });
  } catch (error) {
    next(error);
  }
});

/**
 * DELETE /api/links/:id
 * Delete a link
 */
router.delete('/:id', authenticate, async (req, res, next) => {
  try {
    const link = await Link.findOne({
      where: {
        id: req.params.id,
        user_id: req.user.id
      }
    });

    if (!link) {
      return res.status(404).json({ error: 'Link not found' });
    }

    await link.destroy();

    res.json({ 
      success: true,
      message: 'Link deleted successfully' 
    });
  } catch (error) {
    next(error);
  }
});

export default router;