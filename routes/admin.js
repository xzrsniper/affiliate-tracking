import express from 'express';
import { User, Link, Click, Conversion } from '../models/index.js';
import { authenticate, requireSuperAdmin } from '../middleware/auth.js';
import { Op } from 'sequelize';

const router = express.Router();

// All admin routes require authentication and super admin role
router.use(authenticate);
router.use(requireSuperAdmin);

/**
 * GET /api/admin/users
 * List all users
 * Query params:
 * - search: (optional) Search by email
 * - page: (optional) Page number for pagination
 * - limit: (optional) Items per page
 */
router.get('/users', async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const search = req.query.search || '';
    const offset = (page - 1) * limit;

    const where = {};
    if (search) {
      where.email = {
        [Op.like]: `%${search}%`
      };
    }

    const { count, rows: users } = await User.findAndCountAll({
      where,
      attributes: { exclude: ['password_hash'] },
      limit,
      offset,
      order: [['created_at', 'DESC']]
    });

    // Get link counts for each user
    const usersWithStats = await Promise.all(
      users.map(async (user) => {
        const linkCount = await Link.count({ where: { user_id: user.id } });
        return {
          ...user.toJSON(),
          link_count: linkCount
        };
      })
    );

    res.json({
      success: true,
      users: usersWithStats,
      pagination: {
        page,
        limit,
        total: count,
        pages: Math.ceil(count / limit)
      }
    });
  } catch (error) {
    next(error);
  }
});

/**
 * PATCH /api/admin/users/:id/limit
 * Update a specific user's link_limit
 * Body: { link_limit: number }
 */
router.patch('/users/:id/limit', async (req, res, next) => {
  try {
    const { link_limit } = req.body;

    if (link_limit === undefined || link_limit === null) {
      return res.status(400).json({ error: 'link_limit is required' });
    }

    const limit = parseInt(link_limit);
    if (isNaN(limit) || limit < 0) {
      return res.status(400).json({ error: 'link_limit must be a non-negative integer' });
    }

    const user = await User.findByPk(req.params.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Prevent modifying super admin's limit (optional safeguard)
    if (user.role === 'super_admin' && limit < 999) {
      console.warn(`Warning: Attempted to limit super admin's links`);
    }

    const oldLimit = user.link_limit;
    user.link_limit = limit;
    await user.save();

    res.json({
      success: true,
      message: `User's link limit updated from ${oldLimit} to ${limit}`,
      user: {
        id: user.id,
        email: user.email,
        link_limit: user.link_limit
      }
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/admin/users/:id/ban
 * Toggle is_banned status for a user
 * Body: (optional) { ban: boolean } - if not provided, toggles current status
 */
router.post('/users/:id/ban', async (req, res, next) => {
  try {
    const { ban } = req.body;
    const userId = parseInt(req.params.id);

    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Prevent banning super admins
    if (user.role === 'super_admin') {
      return res.status(403).json({ error: 'Cannot ban super admin users' });
    }

    // If ban is explicitly provided in body, use it; otherwise toggle
    const newBanStatus = ban !== undefined ? Boolean(ban) : !user.is_banned;

    user.is_banned = newBanStatus;
    await user.save();

    res.json({
      success: true,
      message: `User ${newBanStatus ? 'banned' : 'unbanned'} successfully`,
      user: {
        id: user.id,
        email: user.email,
        is_banned: user.is_banned
      }
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/admin/users/:id
 * Get single user with detailed stats
 */
router.get('/users/:id', async (req, res, next) => {
  try {
    const user = await User.findByPk(req.params.id, {
      attributes: { exclude: ['password_hash'] },
      include: [
        {
          model: Link,
          as: 'links',
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
          ]
        }
      ]
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Calculate aggregated stats
    const links = user.links || [];
    let totalClicks = 0;
    let uniqueClicks = 0;
    let totalConversions = 0;
    let totalRevenue = 0;
    const uniqueFingerprints = new Set();

    links.forEach(link => {
      const clicks = link.clicks || [];
      const conversions = link.conversions || [];

      clicks.forEach(click => {
        uniqueFingerprints.add(click.visitor_fingerprint);
        totalClicks++;
      });

      conversions.forEach(conv => {
        totalConversions++;
        totalRevenue += parseFloat(conv.order_value || 0);
      });
    });

    uniqueClicks = uniqueFingerprints.size;

    res.json({
      success: true,
      user: user.toJSON(),
      stats: {
        total_links: links.length,
        total_clicks: totalClicks,
        unique_clicks: uniqueClicks,
        total_conversions: totalConversions,
        total_revenue: parseFloat(totalRevenue.toFixed(2))
      }
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/admin/users/:id/impersonate
 * Impersonate user (view their dashboard data)
 */
router.get('/users/:id/impersonate', async (req, res, next) => {
  try {
    const user = await User.findByPk(req.params.id, {
      attributes: { exclude: ['password_hash'] }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Get user's links with stats (same as user's own dashboard)
    const links = await Link.findAll({
      where: { user_id: user.id },
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
      const uniqueFingerprints = new Set(clicks.map(c => c.visitor_fingerprint));

      return {
        id: link.id,
        original_url: link.original_url,
        unique_code: link.unique_code,
        created_at: link.created_at,
        stats: {
          unique_clicks: uniqueFingerprints.size,
          total_clicks: clicks.length,
          conversions: conversions.length,
          total_revenue: conversions.reduce((sum, conv) => 
            sum + parseFloat(conv.order_value || 0), 0
          ).toFixed(2)
        }
      };
    });

    res.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        link_limit: user.link_limit,
        is_banned: user.is_banned
      },
      links: linksWithStats
    });
  } catch (error) {
    next(error);
  }
});

export default router;