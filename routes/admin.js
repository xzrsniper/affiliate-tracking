import express from 'express';
import { User, Link, Click, Conversion } from '../models/index.js';
import { authenticate, requireSuperAdmin } from '../middleware/auth.js';
import { Op, fn, col } from 'sequelize';
import { applyRevenueAdjustment } from '../utils/revenueAdjustment.js';

const router = express.Router();

function csvEscape(value) {
  if (value === null || value === undefined) return '';
  const str = String(value);
  if (/[",\n\r]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

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

    const userIds = users.map((user) => user.id);
    const linkCountRows = userIds.length
      ? await Link.findAll({
          where: { user_id: { [Op.in]: userIds } },
          attributes: ['user_id', [fn('COUNT', col('id')), 'link_count']],
          group: ['user_id'],
          raw: true
        })
      : [];

    const linkCountByUserId = new Map(
      linkCountRows.map((row) => [Number(row.user_id), Number(row.link_count || 0)])
    );

    const usersWithStats = users.map((user) => ({
      ...user.toJSON(),
      link_count: linkCountByUserId.get(user.id) || 0
    }));

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
              attributes: ['id', 'order_value', 'event_type', 'created_at']
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

    links.forEach((link) => {
      const clicks = link.clicks || [];
      const conversions = link.conversions || [];

      clicks.forEach((click) => {
        uniqueFingerprints.add(click.visitor_fingerprint);
        totalClicks++;
      });

      let rawTotal = 0;
      let rawSales = 0;
      let rawLead = 0;
      let salesCount = 0;
      conversions.forEach((conv) => {
        totalConversions++;
        const v = parseFloat(conv.order_value || 0);
        rawTotal += v;
        if (conv.event_type === 'lead') rawLead += v;
        else if (conv.event_type === 'sale' || conv.event_type === undefined || conv.event_type === null) {
          rawSales += v;
          salesCount += 1;
        }
      });
      const adj = parseFloat(link.revenue_adjustment || 0);
      const adjusted = applyRevenueAdjustment(rawTotal, rawSales, rawLead, adj, salesCount);
      totalRevenue += adjusted.total_revenue;
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
      attributes: ['id', 'original_url', 'unique_code', 'created_at', 'revenue_adjustment'],
      include: [
        {
          model: Click,
          as: 'clicks',
          attributes: ['id', 'visitor_fingerprint', 'created_at']
        },
        {
          model: Conversion,
          as: 'conversions',
          attributes: ['id', 'order_value', 'event_type', 'created_at']
        }
      ],
      order: [['created_at', 'DESC']]
    });

    // Calculate stats for each link
    const linksWithStats = links.map((link) => {
      const clicks = link.clicks || [];
      const conversions = link.conversions || [];
      const uniqueFingerprints = new Set(clicks.map((c) => c.visitor_fingerprint));

      let rawTotal = 0;
      let rawSales = 0;
      let rawLead = 0;
      let salesCount = 0;
      for (const conv of conversions) {
        const v = parseFloat(conv.order_value || 0);
        rawTotal += v;
        if (conv.event_type === 'lead') rawLead += v;
        else if (conv.event_type === 'sale' || conv.event_type === undefined || conv.event_type === null) {
          rawSales += v;
          salesCount += 1;
        }
      }
      const adj = parseFloat(link.revenue_adjustment || 0);
      const adjusted = applyRevenueAdjustment(rawTotal, rawSales, rawLead, adj, salesCount);

      return {
        id: link.id,
        original_url: link.original_url,
        unique_code: link.unique_code,
        created_at: link.created_at,
        stats: {
          unique_clicks: uniqueFingerprints.size,
          total_clicks: clicks.length,
          conversions: conversions.length,
          total_revenue: adjusted.total_revenue,
          sales_revenue: adjusted.sales_revenue,
          lead_revenue: adjusted.lead_revenue,
          raw_total_revenue: parseFloat(rawTotal.toFixed(2)),
          revenue_adjustment: adj
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

/**
 * PATCH /api/admin/links/:linkId/revenue-adjustment
 * Body: { revenue_adjustment: number } — додається до «сирої» суми з конверсій (від’ємне значення зменшує показаний дохід).
 */
router.patch('/links/:linkId/revenue-adjustment', async (req, res, next) => {
  try {
    const linkId = parseInt(req.params.linkId, 10);
    if (!Number.isInteger(linkId) || linkId < 1) {
      return res.status(400).json({ error: 'Invalid link id' });
    }

    const { revenue_adjustment } = req.body;
    if (revenue_adjustment === undefined || revenue_adjustment === null || revenue_adjustment === '') {
      return res.status(400).json({ error: 'revenue_adjustment is required' });
    }

    const adj = Number(revenue_adjustment);
    if (Number.isNaN(adj)) {
      return res.status(400).json({ error: 'revenue_adjustment must be a number' });
    }
    if (adj < -1e9 || adj > 1e9) {
      return res.status(400).json({ error: 'revenue_adjustment out of allowed range' });
    }

    const link = await Link.findByPk(linkId);
    if (!link) {
      return res.status(404).json({ error: 'Link not found' });
    }

    link.revenue_adjustment = adj;
    await link.save();

    res.json({
      success: true,
      link: {
        id: link.id,
        revenue_adjustment: parseFloat(String(link.revenue_adjustment))
      }
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/admin/conversions/export
 * Export conversions with timestamp and amount to CSV
 */
router.get('/conversions/export', async (req, res, next) => {
  try {
    const conversions = await Conversion.findAll({
      include: [
        {
          model: Link,
          as: 'link',
          attributes: ['id', 'name', 'unique_code', 'original_url'],
          include: [
            {
              model: User,
              as: 'user',
              attributes: ['id', 'email']
            }
          ]
        }
      ],
      attributes: ['id', 'event_type', 'order_id', 'order_value', 'created_at'],
      order: [['created_at', 'DESC']],
      limit: 50000
    });

    const header = [
      'conversion_id',
      'event_type',
      'order_id',
      'amount',
      'created_at',
      'link_id',
      'link_name',
      'link_code',
      'link_url',
      'user_id',
      'user_email'
    ];

    const rows = conversions.map((conv) => [
      conv.id,
      conv.event_type || '',
      conv.order_id || '',
      conv.order_value ?? '',
      conv.created_at ? new Date(conv.created_at).toISOString() : '',
      conv.link?.id ?? '',
      conv.link?.name || '',
      conv.link?.unique_code || '',
      conv.link?.original_url || '',
      conv.link?.user?.id ?? '',
      conv.link?.user?.email || ''
    ]);

    const csv = [header, ...rows].map((row) => row.map(csvEscape).join(',')).join('\n');
    const stamp = new Date().toISOString().replace(/[:.]/g, '-');

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="conversions-${stamp}.csv"`);
    res.send(csv);
  } catch (error) {
    next(error);
  }
});

export default router;