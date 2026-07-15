import express from 'express';
import { User, Link, Click, Conversion, Website } from '../models/index.js';
import { authenticate, requireSuperAdmin } from '../middleware/auth.js';
import { Op, fn, col, QueryTypes } from 'sequelize';
import { applyRevenueAdjustment } from '../utils/revenueAdjustment.js';
import sequelize from '../config/database.js';
import {
  commissionFromOrder,
  creditAffiliateBalance,
  parseCommissionPercent,
  isAffiliateUser,
  isAffiliatePayoutEvent
} from '../utils/affiliate.js';

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

function buildRangeFromQuery(rangeRaw) {
  const v = String(rangeRaw || 'all').toLowerCase();
  if (v === 'all') return { label: 'all', fromDate: null };
  const days = parseInt(v, 10);
  if (!Number.isFinite(days) || ![1, 3, 7, 14, 30].includes(days)) {
    return { label: 'all', fromDate: null };
  }
  const from = new Date();
  from.setHours(0, 0, 0, 0);
  from.setDate(from.getDate() - (days - 1));
  return { label: String(days), fromDate: from };
}

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

    const links = await Link.findAll({
      where: { user_id: user.id },
      attributes: ['id', 'original_url', 'unique_code', 'created_at', 'revenue_adjustment'],
      order: [['created_at', 'DESC']]
    });

    if (links.length === 0) {
      return res.json({
        success: true,
        user: {
          id: user.id,
          email: user.email,
          role: user.role,
          link_limit: user.link_limit,
          is_banned: user.is_banned,
          affiliate_commission_percent: user.affiliate_commission_percent,
          affiliate_balance: user.affiliate_balance
        },
        links: []
      });
    }

    const linkIds = links.map((l) => l.id);

    const [clickStatsRows, conversionStatsRows] = await Promise.all([
      sequelize.query(`
        SELECT
          link_id,
          COUNT(*) AS total_clicks,
          COUNT(DISTINCT visitor_fingerprint) AS unique_clicks
        FROM clicks
        WHERE link_id IN (?)
        GROUP BY link_id
      `, {
        replacements: [linkIds],
        type: QueryTypes.SELECT
      }),
      sequelize.query(`
        SELECT
          link_id,
          COUNT(*) AS conversions,
          COALESCE(SUM(order_value), 0) AS total_revenue,
          COALESCE(SUM(CASE WHEN event_type = 'sale' OR event_type IS NULL THEN order_value ELSE 0 END), 0) AS sales_revenue,
          COALESCE(SUM(CASE WHEN event_type = 'lead' THEN order_value ELSE 0 END), 0) AS lead_revenue,
          SUM(CASE WHEN event_type = 'sale' OR event_type IS NULL THEN 1 ELSE 0 END) AS sales
        FROM conversions
        WHERE link_id IN (?)
        GROUP BY link_id
      `, {
        replacements: [linkIds],
        type: QueryTypes.SELECT
      })
    ]);

    const clickByLink = new Map(clickStatsRows.map((r) => [Number(r.link_id), r]));
    const convByLink = new Map(conversionStatsRows.map((r) => [Number(r.link_id), r]));

    const linksWithStats = links.map((link) => {
      const clickStats = clickByLink.get(link.id) || {};
      const convStats = convByLink.get(link.id) || {};
      const totalClicks = parseInt(clickStats.total_clicks || 0, 10);
      const uniqueClicks = parseInt(clickStats.unique_clicks || 0, 10);
      const rawTotal = parseFloat(convStats.total_revenue || 0);
      const rawSales = parseFloat(convStats.sales_revenue || 0);
      const rawLead = parseFloat(convStats.lead_revenue || 0);
      const salesCount = parseInt(convStats.sales || 0, 10);
      const adj = parseFloat(link.revenue_adjustment || 0);
      const adjusted = applyRevenueAdjustment(rawTotal, rawSales, rawLead, adj, salesCount);

      return {
        id: link.id,
        original_url: link.original_url,
        unique_code: link.unique_code,
        created_at: link.created_at,
        stats: {
          unique_clicks: uniqueClicks,
          total_clicks: totalClicks,
          conversions: parseInt(convStats.conversions || 0, 10),
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
        is_banned: user.is_banned,
        affiliate_commission_percent: user.affiliate_commission_percent,
        affiliate_balance: user.affiliate_balance
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

/**
 * PATCH /api/admin/users/:id/affiliate
 * Set affiliate role and commission % (or revert to user).
 * Body: { role: 'affiliate' | 'user', commission_percent?: number }
 */
router.patch('/users/:id/affiliate', async (req, res, next) => {
  try {
    const user = await User.findByPk(req.params.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    if (user.role === 'super_admin') {
      return res.status(403).json({ error: 'Cannot change role for super admin' });
    }

    const { role, commission_percent } = req.body;
    if (role !== 'affiliate' && role !== 'user') {
      return res.status(400).json({ error: 'role must be affiliate or user' });
    }

    if (role === 'affiliate') {
      const percent = parseCommissionPercent(commission_percent);
      if (percent == null) {
        return res.status(400).json({ error: 'commission_percent must be between 0 and 100' });
      }
      user.role = 'affiliate';
      user.affiliate_commission_percent = percent;
    } else {
      user.role = 'user';
      user.affiliate_commission_percent = null;
    }

    await user.save();

    res.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        affiliate_commission_percent: user.affiliate_commission_percent,
        affiliate_balance: user.affiliate_balance
      }
    });
  } catch (error) {
    next(error);
  }
});

/**
 * PATCH /api/admin/users/:id/balance
 * Set affiliate wallet balance manually.
 * Body: { balance: number }
 */
router.patch('/users/:id/balance', async (req, res, next) => {
  try {
    const user = await User.findByPk(req.params.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    if (!isAffiliateUser(user)) {
      return res.status(400).json({ error: 'User is not an affiliate' });
    }

    const balance = parseFloat(req.body.balance);
    if (!Number.isFinite(balance) || balance < 0) {
      return res.status(400).json({ error: 'balance must be a non-negative number' });
    }

    user.affiliate_balance = Math.round(balance * 100) / 100;
    await user.save();

    res.json({
      success: true,
      affiliate_balance: user.affiliate_balance
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/admin/users/:id/website-commissions
 * Returns all websites owned by an affiliate with their per-site commission_percent.
 */
router.get('/users/:id/website-commissions', async (req, res, next) => {
  try {
    const user = await User.findByPk(req.params.id, { attributes: ['id', 'email', 'role', 'affiliate_commission_percent'] });
    if (!user) return res.status(404).json({ error: 'User not found' });

    const websites = await Website.findAll({
      where: { user_id: user.id },
      attributes: ['id', 'name', 'domain', 'is_connected', 'commission_percent'],
      order: [['id', 'ASC']],
      raw: true
    });

    res.json({
      success: true,
      global_commission: parseCommissionPercent(user.affiliate_commission_percent),
      websites: websites.map((w) => ({
        id: w.id,
        name: w.name,
        domain: w.domain,
        is_connected: w.is_connected,
        commission_percent: w.commission_percent !== null ? parseFloat(w.commission_percent) : null
      }))
    });
  } catch (error) {
    next(error);
  }
});

/**
 * PATCH /api/admin/users/:id/website-commissions
 * Bulk-update per-site commission overrides for an affiliate.
 * Body: { updates: [{ website_id, commission_percent }] }
 * Set commission_percent to null to remove the override (falls back to global).
 */
router.patch('/users/:id/website-commissions', async (req, res, next) => {
  try {
    const user = await User.findByPk(req.params.id, { attributes: ['id', 'role'] });
    if (!user) return res.status(404).json({ error: 'User not found' });

    const updates = req.body?.updates;
    if (!Array.isArray(updates)) return res.status(400).json({ error: 'updates array required' });

    for (const item of updates) {
      const { website_id, commission_percent } = item;
      const site = await Website.findOne({ where: { id: website_id, user_id: user.id } });
      if (!site) continue;

      if (commission_percent === null || commission_percent === '') {
        site.commission_percent = null;
      } else {
        const pct = parseFloat(commission_percent);
        if (!Number.isFinite(pct) || pct < 0 || pct > 100) continue;
        site.commission_percent = Math.round(pct * 100) / 100;
      }
      await site.save();
    }

    const websites = await Website.findAll({
      where: { user_id: user.id },
      attributes: ['id', 'name', 'domain', 'commission_percent'],
      raw: true
    });
    res.json({ success: true, websites });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/admin/affiliates/overview
 * Affiliate list + stats by period (1,3,7,14,30 days or all).
 * Query: range=1|3|7|14|30|all
 */
router.get('/affiliates/overview', async (req, res, next) => {
  try {
    const { label: range, fromDate } = buildRangeFromQuery(req.query.range);

    // Fetch affiliate-role users
    const affiliateUsers = await User.findAll({
      where: { role: 'affiliate' },
      attributes: ['id', 'email', 'affiliate_commission_percent', 'affiliate_balance', 'created_at'],
      order: [['created_at', 'DESC']],
      raw: true
    });
    const affiliateUserIds = new Set(affiliateUsers.map((a) => Number(a.id)));

    // Also find users without affiliate role who own links with conversions — catches role mismatches
    const mismatchUserRows = await sequelize.query(
      `SELECT DISTINCT u.id, u.email, u.affiliate_commission_percent, u.affiliate_balance, u.created_at
       FROM users u
       JOIN links l ON l.user_id = u.id
       JOIN conversions cv ON cv.link_id = l.id AND cv.event_type IN ('lead','sale')
       WHERE u.role NOT IN ('affiliate')`,
      { type: QueryTypes.SELECT }
    );
    const mismatchUsers = mismatchUserRows.map((u) => ({ ...u, role_mismatch: true }));

    const affiliates = [
      ...affiliateUsers,
      ...mismatchUsers.filter((u) => !affiliateUserIds.has(Number(u.id))).map((u) => ({ ...u, role_mismatch: true }))
    ];

    if (!affiliates.length) {
      return res.json({
        success: true,
        range,
        summary: {
          affiliates: 0,
          links: 0,
          clicks: 0,
          unique_clicks: 0,
          conversions: 0,
          pending_conversions: 0,
          approved_revenue: 0,
          affiliate_earnings: 0,
          balance_total: 0
        },
        affiliates: []
      });
    }

    const affiliateIds = affiliates.map((a) => Number(a.id));
    const links = await Link.findAll({
      where: { user_id: { [Op.in]: affiliateIds } },
      attributes: ['id', 'user_id'],
      raw: true
    });
    const linkIds = links.map((l) => Number(l.id));
    const linkOwnerById = new Map(links.map((l) => [Number(l.id), Number(l.user_id)]));

    const clickWhere = linkIds.length
      ? {
          link_id: { [Op.in]: linkIds },
          ...(fromDate ? { created_at: { [Op.gte]: fromDate } } : {})
        }
      : null;
    const convWhere = linkIds.length
      ? {
          link_id: { [Op.in]: linkIds },
          event_type: { [Op.in]: ['lead', 'sale'] },
          ...(fromDate ? { created_at: { [Op.gte]: fromDate } } : {})
        }
      : null;

    const [clickRows, convRows] = await Promise.all([
      clickWhere
        ? Click.findAll({
            where: clickWhere,
            attributes: [
              'link_id',
              [fn('COUNT', col('id')), 'clicks'],
              [fn('COUNT', fn('DISTINCT', col('visitor_fingerprint'))), 'unique_clicks']
            ],
            group: ['link_id'],
            raw: true
          })
        : [],
      convWhere
        ? Conversion.findAll({
            where: convWhere,
            attributes: ['link_id', 'event_type', 'lead_status', 'order_value'],
            raw: true
          })
        : []
    ]);

    const byAffiliate = new Map(
      affiliates.map((a) => [
        Number(a.id),
        {
          user_id: Number(a.id),
          email: a.email,
          commission_percent: parseCommissionPercent(a.affiliate_commission_percent) || 0,
          affiliate_balance: Number(a.affiliate_balance || 0),
          role_mismatch: a.role_mismatch || false,
          links: 0,
          clicks: 0,
          unique_clicks: 0,
          conversions: 0,
          pending_conversions: 0,
          approved_revenue: 0,
          affiliate_earnings: 0
        }
      ])
    );

    links.forEach((l) => {
      const agg = byAffiliate.get(Number(l.user_id));
      if (agg) agg.links += 1;
    });

    clickRows.forEach((r) => {
      const ownerId = linkOwnerById.get(Number(r.link_id));
      const agg = byAffiliate.get(ownerId);
      if (!agg) return;
      agg.clicks += parseInt(r.clicks || 0, 10);
      agg.unique_clicks += parseInt(r.unique_clicks || 0, 10);
    });

    convRows.forEach((c) => {
      const ownerId = linkOwnerById.get(Number(c.link_id));
      const agg = byAffiliate.get(ownerId);
      if (!agg) return;
      agg.conversions += 1;
      if (c.lead_status === 'pending') agg.pending_conversions += 1;
      // Count revenue for: approved leads, confirmed sales (lead_status=approved), and direct sales (event_type=sale with no rejection)
      const isApproved =
        c.lead_status === 'approved' ||
        (c.event_type === 'sale' && c.lead_status !== 'rejected');
      if (isApproved) {
        const orderValue = parseFloat(c.order_value || 0);
        agg.approved_revenue += orderValue;
        agg.affiliate_earnings += commissionFromOrder(orderValue, agg.commission_percent);
      }
    });

    const items = Array.from(byAffiliate.values()).map((a) => ({
      ...a,
      approved_revenue: parseFloat(a.approved_revenue.toFixed(2)),
      affiliate_earnings: parseFloat(a.affiliate_earnings.toFixed(2))
    }));

    const summary = items.reduce(
      (acc, item) => {
        acc.affiliates += 1;
        acc.links += item.links;
        acc.clicks += item.clicks;
        acc.unique_clicks += item.unique_clicks;
        acc.conversions += item.conversions;
        acc.pending_conversions += item.pending_conversions;
        acc.approved_revenue += item.approved_revenue;
        acc.affiliate_earnings += item.affiliate_earnings;
        acc.balance_total += Number(item.affiliate_balance || 0);
        return acc;
      },
      {
        affiliates: 0,
        links: 0,
        clicks: 0,
        unique_clicks: 0,
        conversions: 0,
        pending_conversions: 0,
        approved_revenue: 0,
        affiliate_earnings: 0,
        balance_total: 0
      }
    );

    summary.approved_revenue = parseFloat(summary.approved_revenue.toFixed(2));
    summary.affiliate_earnings = parseFloat(summary.affiliate_earnings.toFixed(2));
    summary.balance_total = parseFloat(summary.balance_total.toFixed(2));

    res.json({ success: true, range, summary, affiliates: items });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/admin/affiliates/moderation
 * Cross-affiliate moderation queue.
 * Query: status=pending|approved|rejected
 */
router.get('/affiliates/moderation', async (req, res, next) => {
  try {
    const status = req.query.status || 'pending';
    const allowed = ['pending', 'approved', 'rejected'];
    if (!allowed.includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const affiliates = await User.findAll({
      where: { role: 'affiliate' },
      attributes: ['id', 'email', 'affiliate_commission_percent'],
      raw: true
    });
    const affiliateById = new Map(affiliates.map((a) => [Number(a.id), a]));
    const linkRows = await Link.findAll({
      where: { user_id: { [Op.in]: affiliates.map((a) => a.id) } },
      attributes: ['id', 'user_id', 'name', 'unique_code', 'original_url'],
      raw: true
    });
    const linkById = new Map(linkRows.map((l) => [Number(l.id), l]));
    if (!linkRows.length) return res.json({ success: true, items: [] });

    const convRows = await Conversion.findAll({
      where: {
        link_id: { [Op.in]: linkRows.map((l) => l.id) },
        event_type: { [Op.in]: ['lead', 'sale'] },
        lead_status: status
      },
      attributes: ['id', 'link_id', 'order_value', 'order_id', 'event_type', 'lead_status', 'rejection_reason', 'created_at'],
      order: [['created_at', 'DESC']],
      limit: 1000,
      raw: true
    });

    const items = convRows.map((row) => {
      const link = linkById.get(Number(row.link_id));
      const affiliate = affiliateById.get(Number(link?.user_id));
      const percent = parseCommissionPercent(affiliate?.affiliate_commission_percent) || 0;
      return {
        id: row.id,
        link_id: row.link_id,
        link_name: link?.name || null,
        link_code: link?.unique_code || null,
        link_url: link?.original_url || null,
        affiliate_id: link?.user_id || null,
        affiliate_email: affiliate?.email || null,
        event_type: row.event_type,
        order_value: parseFloat(row.order_value || 0),
        order_id: row.order_id,
        lead_status: row.lead_status,
        rejection_reason: row.rejection_reason || null,
        created_at: row.created_at,
        commission_amount: commissionFromOrder(row.order_value, percent)
      };
    });

    res.json({ success: true, items });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/admin/users/:id/leads
 * List affiliate leads/sales for moderation (legacy path name).
 * Query: status=pending|approved|rejected (default pending)
 */
router.get('/users/:id/leads', async (req, res, next) => {
  try {
    const user = await User.findByPk(req.params.id, {
      attributes: ['id', 'email', 'role', 'affiliate_commission_percent']
    });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    if (!isAffiliateUser(user)) {
      return res.status(400).json({ error: 'User is not an affiliate' });
    }

    const status = req.query.status || 'pending';
    const allowed = ['pending', 'approved', 'rejected'];
    if (!allowed.includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const links = await Link.findAll({
      where: { user_id: user.id },
      attributes: ['id', 'name', 'unique_code', 'original_url']
    });
    const linkIds = links.map((l) => l.id);
    if (linkIds.length === 0) {
      return res.json({ success: true, leads: [], items: [], commission_percent: user.affiliate_commission_percent });
    }

    const rows = await Conversion.findAll({
      where: {
        link_id: { [Op.in]: linkIds },
        event_type: { [Op.in]: ['lead', 'sale'] },
        lead_status: status
      },
      attributes: ['id', 'link_id', 'order_value', 'order_id', 'event_type', 'lead_status', 'rejection_reason', 'created_at'],
      order: [['created_at', 'DESC']],
      limit: 500
    });

    const linkById = new Map(links.map((l) => [l.id, l]));
    const percent = parseCommissionPercent(user.affiliate_commission_percent) || 0;

    const mapRow = (row) => ({
      id: row.id,
      link_id: row.link_id,
      link_name: linkById.get(row.link_id)?.name || null,
      link_code: linkById.get(row.link_id)?.unique_code || null,
      link_url: linkById.get(row.link_id)?.original_url || null,
      event_type: row.event_type,
      order_value: parseFloat(row.order_value || 0),
      order_id: row.order_id,
      lead_status: row.lead_status,
      rejection_reason: row.rejection_reason || null,
      created_at: row.created_at,
      commission_amount: commissionFromOrder(row.order_value, percent)
    });

    const items = rows.map(mapRow);

    res.json({
      success: true,
      commission_percent: percent,
      leads: items,
      items
    });
  } catch (error) {
    next(error);
  }
});

/** Shared approve/reject for affiliate lead or sale payouts. */
async function moderateAffiliateConversion(conversionId, action, rejectionReason = null) {
  return sequelize.transaction(async (t) => {
    const conversion = await Conversion.findByPk(conversionId, { transaction: t, lock: t.LOCK.UPDATE });
    if (!conversion || !isAffiliatePayoutEvent(conversion.event_type)) {
      return { error: 'Conversion not found', status: 404 };
    }
    if (conversion.lead_status !== 'pending') {
      return { error: 'Conversion is not pending approval', status: 400 };
    }

    const link = await Link.findByPk(conversion.link_id, { transaction: t });
    if (!link) {
      return { error: 'Link not found', status: 404 };
    }

    const affiliate = await User.findByPk(link.user_id, { transaction: t, lock: t.LOCK.UPDATE });
    if (!affiliate || !isAffiliateUser(affiliate)) {
      return { error: 'Link owner is not an affiliate', status: 400 };
    }

    if (action === 'reject') {
      conversion.lead_status = 'rejected';
      conversion.rejection_reason = rejectionReason ? String(rejectionReason).slice(0, 500) : null;
      await conversion.save({ transaction: t });
      return { success: true, conversion_id: conversion.id, action: 'rejected' };
    }

    // Resolve commission: prefer per-site override on the link's destination website
    let percent = parseCommissionPercent(affiliate.affiliate_commission_percent);

    if (link.original_url) {
      try {
        const linkHost = new URL(
          link.original_url.startsWith('http') ? link.original_url : `https://${link.original_url}`
        ).hostname.replace(/^www\./, '');

        const siteOverride = await Website.findOne({
          where: { user_id: affiliate.id },
          attributes: ['commission_percent'],
          raw: true
        }).then(() =>
          // raw query to handle messy domain formats stored in DB
          sequelize.query(
            `SELECT commission_percent FROM websites
             WHERE user_id = :affiliateId
               AND commission_percent IS NOT NULL
               AND REPLACE(REPLACE(REPLACE(REPLACE(domain, 'https://', ''), 'http://', ''), 'www.', ''), '/', '') = :host
             LIMIT 1`,
            { replacements: { affiliateId: affiliate.id, host: linkHost }, type: QueryTypes.SELECT }
          )
        );

        if (siteOverride?.length && siteOverride[0].commission_percent != null) {
          const sitePercent = parseCommissionPercent(siteOverride[0].commission_percent);
          if (sitePercent != null) percent = sitePercent;
        }
      } catch {
        // ignore URL parse errors, fall back to global commission
      }
    }

    if (percent == null) {
      return { error: 'Affiliate commission not configured', status: 400 };
    }

    const amount = commissionFromOrder(conversion.order_value, percent);
    conversion.lead_status = 'approved';
    await conversion.save({ transaction: t });

    let newBalance = parseFloat(affiliate.affiliate_balance || 0);
    if (amount > 0) {
      newBalance = await creditAffiliateBalance(affiliate.id, amount, t);
    }

    return {
      success: true,
      conversion_id: conversion.id,
      action: 'approved',
      commission_amount: amount,
      affiliate_balance: newBalance
    };
  });
}

/**
 * POST /api/admin/conversions/:id/approve-lead
 * Approve affiliate lead or sale payout.
 */
router.post('/conversions/:id/approve-lead', async (req, res, next) => {
  try {
    const conversionId = parseInt(req.params.id, 10);
    if (!Number.isFinite(conversionId)) {
      return res.status(400).json({ error: 'Invalid conversion id' });
    }

    const result = await moderateAffiliateConversion(conversionId, 'approve');
    if (result.error) {
      return res.status(result.status).json({ error: result.error });
    }
    res.json(result);
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/admin/conversions/:id/reject-lead
 * Reject affiliate lead or sale payout.
 */
router.post('/conversions/:id/reject-lead', async (req, res, next) => {
  try {
    const conversionId = parseInt(req.params.id, 10);
    if (!Number.isFinite(conversionId)) {
      return res.status(400).json({ error: 'Invalid conversion id' });
    }

    const rejectionReason = req.body?.rejection_reason || null;
    const result = await moderateAffiliateConversion(conversionId, 'reject', rejectionReason);
    if (result.error) {
      return res.status(result.status).json({ error: result.error });
    }
    res.json(result);
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/admin/reports/monthly-affiliate
 * Manually trigger the monthly affiliate report send (super_admin only).
 * Optional body: { month: "2026-08" } to send for a specific month
 * (defaults to previous calendar month).
 */
router.post('/reports/monthly-affiliate', async (req, res, next) => {
  try {
    if (req.user.role !== 'super_admin') {
      return res.status(403).json({ error: 'Super admin only' });
    }

    // Parse optional override date
    let overrideDate;
    if (req.body?.month) {
      // "2026-08" → use 2026-09-03 so previousMonthRange gives Aug
      const [y, m] = req.body.month.split('-').map(Number);
      overrideDate = new Date(Date.UTC(y, m, 3)); // day=3, month index = m (1-based → 0-based +1 shift)
    }

    const { sendMonthlyReportsToAll } = await import('../services/affiliateMonthlyReport.js');
    const results = await sendMonthlyReportsToAll(overrideDate);

    res.json({ success: true, results });
  } catch (err) {
    next(err);
  }
});

export default router;