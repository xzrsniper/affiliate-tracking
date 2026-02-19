import express from 'express';
import { Link, Click, Conversion, User, Website } from '../models/index.js';
import { authenticate } from '../middleware/auth.js';
import { generateUniqueCode } from '../utils/codeGenerator.js';
import { checkTrackerInstallation } from '../utils/trackerCheck.js';
import { Op, QueryTypes } from 'sequelize';
import sequelize from '../config/database.js';

const router = express.Router();

function extractDomain(url) {
  try {
    const urlObj = new URL(url);
    return urlObj.hostname.replace(/^www\./, '').toLowerCase();
  } catch (e) {
    return null;
  }
}

// Check if tracking code is connected: either in "My sites" with connected status, OR tracker detected on link's domain
async function isCodeConnectedForLink(userId, linkDomain) {
  if (!linkDomain) return false;
  const website = await Website.findOne({
    where: {
      user_id: userId,
      is_connected: true,
      [Op.or]: [
        { domain: linkDomain },
        { domain: `www.${linkDomain}` },
        { domain: linkDomain.replace(/^www\./, '') }
      ]
    }
  });
  if (website) return true;
  return await checkTrackerInstallation(linkDomain);
}

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
    // Use raw queries for better performance - aggregate stats directly in SQL
    const links = await Link.findAll({
      where: { user_id: req.user.id },
      attributes: ['id', 'name', 'original_url', 'source_type', 'unique_code', 'created_at', 'user_id'],
      order: [['created_at', 'DESC']]
    });

    // Calculate stats for each link using optimized SQL aggregation
    // This is much faster than loading all clicks/conversions into memory
    const linksWithStats = await Promise.all(links.map(async (link) => {
      // Use SQL aggregation for better performance
      const [clickStats] = await sequelize.query(`
        SELECT 
          COUNT(*) as total_clicks,
          COUNT(DISTINCT visitor_fingerprint) as unique_clicks
        FROM clicks
        WHERE link_id = ?
      `, {
        replacements: [link.id],
        type: QueryTypes.SELECT
      });

      const [conversionStats] = await sequelize.query(`
        SELECT 
          COUNT(*) as conversions,
          COALESCE(SUM(order_value), 0) as total_revenue,
          SUM(CASE WHEN event_type = 'lead' THEN 1 ELSE 0 END) as leads,
          SUM(CASE WHEN event_type = 'sale' OR event_type IS NULL THEN 1 ELSE 0 END) as sales,
          COALESCE(SUM(CASE WHEN event_type = 'sale' OR event_type IS NULL THEN order_value ELSE 0 END), 0) as sales_revenue
        FROM conversions
        WHERE link_id = ?
      `, {
        replacements: [link.id],
        type: QueryTypes.SELECT
      });

      const totalClicks = parseInt(clickStats?.total_clicks || 0);
      const uniqueClicks = parseInt(clickStats?.unique_clicks || 0);
      const totalConversions = parseInt(conversionStats?.conversions || 0);
      const totalRevenue = parseFloat(conversionStats?.total_revenue || 0);
      const totalLeads = parseInt(conversionStats?.leads || 0);
      const totalSales = parseInt(conversionStats?.sales || 0);
      const salesRevenue = parseFloat(conversionStats?.sales_revenue || 0);

      const domain = extractDomain(link.original_url);
      const isCodeConnected = await isCodeConnectedForLink(req.user.id, domain);

      return {
        id: link.id,
        name: link.name,
        original_url: link.original_url,
        source_type: link.source_type,
        unique_code: link.unique_code,
        tracking_url: `${req.protocol}://${req.get('host')}/track/${link.unique_code}`,
        created_at: link.created_at,
        code_connected: isCodeConnected,
        domain: domain,
        stats: {
          unique_clicks: uniqueClicks,
          total_clicks: totalClicks,
          conversions: totalConversions,
          leads: totalLeads,
          sales: totalSales,
          total_revenue: parseFloat(totalRevenue.toFixed(2)),
          sales_revenue: parseFloat(salesRevenue.toFixed(2))
        }
      };
    }));

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