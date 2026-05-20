import express from 'express';
import { Link, Click, Conversion, LinkClick, User, Website } from '../models/index.js';
import { authenticate } from '../middleware/auth.js';
import { generateUniqueCode } from '../utils/codeGenerator.js';
import { runTrackingRedirect } from '../utils/trackingRedirect.js';
import { Op, QueryTypes } from 'sequelize';
import sequelize from '../config/database.js';
import { applyRevenueAdjustment } from '../utils/revenueAdjustment.js';
import { commissionFromOrder, isAffiliateUser, parseCommissionPercent } from '../utils/affiliate.js';
import { randomExplorationLimit, getSplitStatsForLink } from '../utils/splitTest.js';
import LinkVariant from '../models/LinkVariant.js';

const router = express.Router();

/**
 * Public redirect under /api — works when Nginx only proxies /api to Node and serves SPA for /r/CODE.
 * Browser hits React first → full navigation to /api/links/go/CODE → 302 to target site.
 */
router.get('/go/:unique_code', async (req, res, next) => {
  try {
    await runTrackingRedirect(req, res, req.params.unique_code);
  } catch (error) {
    next(error);
  }
});

let clickSessionColumnsCache = {
  checkedAt: 0,
  hasSessionDuration: false,
  hasHadEngagement: false
};

async function getClickSessionColumnsAvailability() {
  const now = Date.now();
  if (now - clickSessionColumnsCache.checkedAt < 5 * 60 * 1000) {
    return clickSessionColumnsCache;
  }

  try {
    const rows = await sequelize.query(`
      SELECT COLUMN_NAME
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME = 'clicks'
        AND COLUMN_NAME IN ('session_duration_seconds', 'had_engagement')
    `, {
      type: QueryTypes.SELECT
    });

    const names = new Set(rows.map((row) => row.COLUMN_NAME));
    clickSessionColumnsCache = {
      checkedAt: now,
      hasSessionDuration: names.has('session_duration_seconds'),
      hasHadEngagement: names.has('had_engagement')
    };
  } catch (error) {
    // Safe fallback: keep dashboard working even if schema inspection fails.
    clickSessionColumnsCache = {
      checkedAt: now,
      hasSessionDuration: false,
      hasHadEngagement: false
    };
  }

  return clickSessionColumnsCache;
}

function extractDomain(url) {
  try {
    const urlObj = new URL(url);
    return urlObj.hostname.replace(/^www\./, '').toLowerCase();
  } catch (e) {
    return null;
  }
}

function normalizeDomain(domain) {
  if (!domain) return null;
  return String(domain)
    .replace(/^https?:\/\//i, '')
    .replace(/\/+$/, '')
    .toLowerCase()
    .split('/')[0]
    .replace(/^www\./, '');
}

/** Same rules as GET /my-links — must stay consistent after PUT /:id */
function buildTrackingUrlForLink(link, req) {
  const format = link.link_format || 'tracking';
  if (format === 'original') {
    try {
      const url = new URL(link.original_url);
      url.searchParams.set('ref', link.unique_code);
      return url.toString();
    } catch {
      const sep = link.original_url.includes('?') ? '&' : '?';
      return `${link.original_url}${sep}ref=${link.unique_code}`;
    }
  }
  return `${req.protocol}://${req.get('host')}/r/${link.unique_code}`;
}

function buildRangeCondition(range = '7d') {
  switch (range) {
    case 'all':
      return '';
    case 'today':
      return ' AND created_at >= CURDATE()';
    case '30d':
      return ' AND created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)';
    case '7d':
    default:
      return ' AND created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)';
  }
}

// All routes require authentication
router.use(authenticate);

/**
 * POST /api/links/export-sheets
 * Create a Google Sheet from prepared report rows and return URL
 */
router.post('/export-sheets', async (req, res, next) => {
  try {
    let google;
    try {
      ({ google } = await import('googleapis'));
    } catch (importError) {
      return res.status(500).json({
        error: 'Google Sheets module is not available on this server. Run npm install and restart API.'
      });
    }

    const refreshToken = req.user?.google_sheets_refresh_token;
    if (!refreshToken) {
      return res.status(400).json({ error: 'GOOGLE_SHEETS_NOT_CONNECTED' });
    }

    const clientId = process.env.GOOGLE_SHEETS_OAUTH_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_SHEETS_OAUTH_CLIENT_SECRET;
    if (!clientId || !clientSecret) {
      return res.status(500).json({ error: 'GOOGLE_SHEETS_OAUTH_NOT_CONFIGURED' });
    }

    const rows = Array.isArray(req.body?.rows) ? req.body.rows : [];
    if (rows.length === 0) {
      return res.status(400).json({ error: 'rows are required' });
    }

    const normalizedRows = rows.map((row) =>
      Array.isArray(row)
        ? row.map((cell) => (cell == null ? '' : String(cell)))
        : [String(row ?? '')]
    );

    const now = new Date();
    const pad = (n) => String(n).padStart(2, '0');
    const title = `Lehko_report_${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}_${pad(now.getHours())}-${pad(now.getMinutes())}`;

    const redirectUri = process.env.GOOGLE_SHEETS_OAUTH_REDIRECT_URI ||
      `${req.protocol}://${req.get('host')}/api/google-sheets/oauth/callback`;

    const oauth2Client = new google.auth.OAuth2(clientId, clientSecret, redirectUri);
    oauth2Client.setCredentials({ refresh_token: refreshToken });

    const sheets = google.sheets({ version: 'v4', auth: oauth2Client });

    const createResponse = await sheets.spreadsheets.create({
      requestBody: {
        properties: { title }
      }
    });

    const spreadsheetId = createResponse.data.spreadsheetId;
    const spreadsheetUrl = createResponse.data.spreadsheetUrl;

    if (!spreadsheetId || !spreadsheetUrl) {
      return res.status(500).json({ error: 'Failed to create spreadsheet' });
    }

    const meta = await sheets.spreadsheets.get({
      spreadsheetId,
      fields: 'sheets.properties.title'
    });
    const firstSheetTitle = meta.data.sheets?.[0]?.properties?.title || 'Sheet1';

    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: `${firstSheetTitle}!A1`,
      valueInputOption: 'USER_ENTERED',
      requestBody: { values: normalizedRows }
    });

    res.json({ success: true, spreadsheetId, url: spreadsheetUrl });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/links/create
 * Create a new tracking link
 * Critical Logic: Check if user has reached their link_limit
 */
router.post('/create', async (req, res, next) => {
  try {
    const {
      original_url,
      name,
      source_type,
      link_format,
      split_enabled,
      variants: variantsBody
    } = req.body;

    const isSplit = Boolean(split_enabled);
    let resolvedOriginalUrl = original_url;
    let normalizedVariants = [];

    if (isSplit) {
      if (!Array.isArray(variantsBody) || variantsBody.length < 2) {
        return res.status(400).json({ error: 'A/B split requires at least 2 destination URLs' });
      }
      if (variantsBody.length > 6) {
        return res.status(400).json({ error: 'Maximum 6 URLs in A/B split test' });
      }

      normalizedVariants = variantsBody.map((v, i) => {
        let url = String(v.url || v.destination_url || '').trim();
        if (!url) return null;
        if (!url.match(/^https?:\/\//i)) url = `https://${url}`;
        try {
          new URL(url);
        } catch {
          return null;
        }
        return {
          label: String(v.label || v.name || String.fromCharCode(65 + i)).slice(0, 64),
          destination_url: url,
          sort_order: i
        };
      }).filter(Boolean);

      if (normalizedVariants.length < 2) {
        return res.status(400).json({ error: 'Provide at least 2 valid destination URLs' });
      }
      resolvedOriginalUrl = normalizedVariants[0].destination_url;
    } else if (!resolvedOriginalUrl) {
      return res.status(400).json({ error: 'original_url is required' });
    }

    try {
      new URL(resolvedOriginalUrl);
    } catch (e) {
      return res.status(400).json({ error: 'Invalid URL format' });
    }

    const validFormats = ['tracking', 'original', 'lehko'];
    let resolvedFormat = validFormats.includes(link_format) ? link_format : 'tracking';
    if (resolvedFormat === 'lehko') resolvedFormat = 'tracking';
    if (isSplit && resolvedFormat === 'original') {
      return res.status(400).json({
        error: 'A/B split test requires LehkoTrack domain (lehko.space/r/...). Choose "Домен LehkoTrack" format.'
      });
    }

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

    let uniqueCode;
    let codeExists = true;

    while (codeExists) {
      uniqueCode = generateUniqueCode();
      const existingLink = await Link.findOne({ where: { unique_code: uniqueCode } });
      codeExists = !!existingLink;
    }

    const explorationLimit = isSplit ? randomExplorationLimit() : null;

    const link = await Link.create({
      user_id: req.user.id,
      original_url: resolvedOriginalUrl,
      name: name || null,
      source_type: source_type || null,
      unique_code: uniqueCode,
      link_format: isSplit ? 'tracking' : resolvedFormat,
      split_enabled: isSplit,
      split_phase: isSplit ? 'exploring' : null,
      split_exploration_limit: explorationLimit
    });

    if (isSplit) {
      await LinkVariant.bulkCreate(
        normalizedVariants.map((v) => ({
          link_id: link.id,
          label: v.label,
          destination_url: v.destination_url,
          sort_order: v.sort_order
        }))
      );
    }

    const trackingUrl = buildTrackingUrlForLink(link, req);

    res.status(201).json({
      success: true,
      message: isSplit ? 'A/B split link created successfully' : 'Link created successfully',
      link: {
        id: link.id,
        name: link.name,
        original_url: link.original_url,
        source_type: link.source_type,
        unique_code: link.unique_code,
        link_format: link.link_format,
        tracking_url: trackingUrl,
        split_enabled: link.split_enabled,
        split_phase: link.split_phase,
        split_exploration_limit: link.split_exploration_limit,
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
 * GET /api/links/:id/split-stats
 * Per-variant A/B statistics (available even after winner is chosen).
 */
router.get('/:id/split-stats', async (req, res, next) => {
  try {
    const linkId = parseInt(req.params.id, 10);
    if (!Number.isFinite(linkId)) {
      return res.status(400).json({ error: 'Invalid link id' });
    }

    const stats = await getSplitStatsForLink(linkId, req.user.id);
    if (!stats) {
      return res.status(404).json({ error: 'Link not found' });
    }
    if (!stats.split_enabled) {
      return res.status(400).json({ error: 'This link is not an A/B split test' });
    }

    res.json({ success: true, ...stats });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/links/clicks-chart
 * Get time-series click data for the chart (last 7 days, hourly)
 * Optional query: ?snapshot=YYYY-MM-DDTHH  — show data only up to that hour
 */
router.get('/clicks-chart', async (req, res, next) => {
  try {
    const { source_type, range = '7d' } = req.query;

    // Get all link IDs for this user
    const userLinks = await Link.findAll({
      where: {
        user_id: req.user.id,
        ...(source_type ? { source_type } : {})
      },
      attributes: ['id']
    });
    const linkIds = userLinks.map(l => l.id);

    if (linkIds.length === 0) {
      return res.json({ success: true, data: [] });
    }

    // Build snapshot filter
    const { snapshot } = req.query;
    let snapshotCondition = '';
    const replacements = [linkIds];

    if (snapshot) {
      // snapshot format: "YYYY-MM-DDTHH" e.g. "2026-03-04T14"
      const snapshotEnd = `${snapshot.replace('T', ' ')}:59:59`;
      const snapshotStart = new Date(snapshotEnd);
      snapshotStart.setDate(snapshotStart.getDate() - 7);
      const startStr = snapshotStart.toISOString().slice(0, 19).replace('T', ' ');
      snapshotCondition = ' AND created_at >= ? AND created_at <= ?';
      replacements.push(startStr, snapshotEnd);
    } else {
      snapshotCondition = buildRangeCondition(range);
    }

    // Get hourly click data
    const [rows] = await sequelize.query(`
      SELECT 
        DATE_FORMAT(created_at, '%Y-%m-%d %H:00:00') as time_bucket,
        COUNT(*) as clicks,
        COUNT(DISTINCT visitor_fingerprint) as unique_clicks
      FROM clicks
      WHERE link_id IN (?)${snapshotCondition}
      GROUP BY time_bucket
      ORDER BY time_bucket ASC
    `, {
      replacements
    });

    res.json({ success: true, data: rows });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/links/my-links
 * Get all links belonging to the logged-in user
 * Includes count of clicks/conversions using Sequelize includes
 * Optional query: ?snapshot=YYYY-MM-DDTHH  — show stats only up to that hour
 */
router.get('/my-links', async (req, res, next) => {
  try {
    // Build snapshot filter
    const { snapshot, range = '7d' } = req.query;
    let snapshotCondition = '';
    const snapshotReplacements = [];

    if (snapshot) {
      // snapshot format: "YYYY-MM-DDTHH" e.g. "2026-03-04T14"
      const snapshotEnd = `${snapshot.replace('T', ' ')}:59:59`;
      snapshotCondition = ' AND created_at <= ?';
      snapshotReplacements.push(snapshotEnd);
    } else {
      snapshotCondition = buildRangeCondition(range);
    }

    const links = await Link.findAll({
      where: { user_id: req.user.id },
      attributes: ['id', 'name', 'original_url', 'source_type', 'unique_code', 'link_format', 'created_at', 'user_id', 'revenue_adjustment'],
      order: [['created_at', 'DESC']]
    });

    if (links.length === 0) {
      return res.json({
        success: true,
        links: [],
        summary: {
          total_links: 0,
          link_limit: req.user.link_limit,
          remaining_slots: Math.max(0, req.user.link_limit)
        }
      });
    }

    const linkIds = links.map((link) => link.id);

    const clickColumns = await getClickSessionColumnsAvailability();

    // Відмова: є виміряна сесія і не було engagement (скрол/клік/тач/клавіша).
    // Раніше було ще «< 15 с» — через heartbeat час швидко ставав >15 с, і «нічого не робив» не рахувалось як bounce.
    const bounceCaseWhen = clickColumns.hasHadEngagement
      ? 'session_duration_seconds IS NOT NULL AND COALESCE(had_engagement, 0) = 0'
      : 'session_duration_seconds IS NOT NULL AND session_duration_seconds < 15';

    const clickStatsSql = clickColumns.hasSessionDuration
      ? `
        SELECT
          link_id,
          COUNT(*) as total_clicks,
          COUNT(DISTINCT visitor_fingerprint) as unique_clicks,
          COUNT(CASE WHEN session_duration_seconds IS NOT NULL THEN 1 END) as measured_sessions,
          COALESCE(AVG(session_duration_seconds), 0) as avg_session_seconds,
          SUM(CASE WHEN ${bounceCaseWhen} THEN 1 ELSE 0 END) as bounces
        FROM clicks
        WHERE link_id IN (?)${snapshotCondition}
        GROUP BY link_id
      `
      : `
        SELECT
          link_id,
          COUNT(*) as total_clicks,
          COUNT(DISTINCT visitor_fingerprint) as unique_clicks,
          0 as measured_sessions,
          0 as avg_session_seconds,
          0 as bounces
        FROM clicks
        WHERE link_id IN (?)${snapshotCondition}
        GROUP BY link_id
      `;

    const [clickStatsRows, conversionStatsRows] = await Promise.all([
      sequelize.query(clickStatsSql, {
        replacements: [linkIds, ...snapshotReplacements],
        type: QueryTypes.SELECT
      }),
      sequelize.query(`
        SELECT
          link_id,
          COUNT(*) as conversions,
          COALESCE(SUM(order_value), 0) as total_revenue,
          SUM(CASE WHEN event_type = 'lead' THEN 1 ELSE 0 END) as leads,
          SUM(CASE WHEN event_type = 'sale' OR event_type IS NULL THEN 1 ELSE 0 END) as sales,
          SUM(CASE WHEN event_type = 'cart' THEN 1 ELSE 0 END) as carts,
          COALESCE(SUM(CASE WHEN event_type = 'sale' OR event_type IS NULL THEN order_value ELSE 0 END), 0) as sales_revenue,
          COALESCE(SUM(CASE WHEN event_type = 'lead' THEN order_value ELSE 0 END), 0) as lead_revenue,
          COALESCE(SUM(CASE WHEN event_type = 'lead' AND lead_status = 'approved' THEN order_value ELSE 0 END), 0) as approved_lead_revenue,
          COALESCE(SUM(CASE WHEN (event_type = 'sale' OR event_type IS NULL) AND lead_status = 'approved' THEN order_value ELSE 0 END), 0) as approved_sale_revenue,
          SUM(CASE WHEN event_type = 'lead' AND lead_status = 'pending' THEN 1 ELSE 0 END) as pending_leads,
          SUM(CASE WHEN (event_type = 'sale' OR event_type IS NULL) AND lead_status = 'pending' THEN 1 ELSE 0 END) as pending_sales
        FROM conversions
        WHERE link_id IN (?)${snapshotCondition}
        GROUP BY link_id
      `, {
        replacements: [linkIds, ...snapshotReplacements],
        type: QueryTypes.SELECT
      })
    ]);

    const clickStatsByLinkId = new Map(clickStatsRows.map((row) => [Number(row.link_id), row]));
    const conversionStatsByLinkId = new Map(conversionStatsRows.map((row) => [Number(row.link_id), row]));

    const candidateDomains = Array.from(new Set(
      links.map((link) => normalizeDomain(extractDomain(link.original_url))).filter(Boolean)
    ));

    const domainsToMatch = Array.from(new Set(candidateDomains.flatMap((domain) => [domain, `www.${domain}`])));
    const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);

    const [connectedWebsites, recentVerifications] = await Promise.all([
      Website.findAll({
        where: {
          user_id: req.user.id,
          is_connected: true,
          domain: { [Op.in]: domainsToMatch }
        },
        attributes: ['domain']
      }),
      sequelize.query(`
        SELECT DISTINCT domain
        FROM tracker_verifications
        WHERE domain IN (?) AND last_seen >= ?
      `, {
        replacements: [domainsToMatch, tenMinutesAgo],
        type: QueryTypes.SELECT
      })
    ]);

    const connectedDomains = new Set();
    connectedWebsites.forEach((website) => {
      const normalized = normalizeDomain(website.domain);
      if (normalized) connectedDomains.add(normalized);
    });
    recentVerifications.forEach((item) => {
      const normalized = normalizeDomain(item.domain);
      if (normalized) connectedDomains.add(normalized);
    });

    const isAffiliate = isAffiliateUser(req.user);
    const affiliatePercent = isAffiliate ? parseCommissionPercent(req.user.affiliate_commission_percent) : null;

    const linksWithStats = links.map((link) => {
      const clickStats = clickStatsByLinkId.get(link.id) || {};
      const conversionStats = conversionStatsByLinkId.get(link.id) || {};

      const totalClicks = parseInt(clickStats?.total_clicks || 0);
      const uniqueClicks = parseInt(clickStats?.unique_clicks || 0);
      const totalConversions = parseInt(conversionStats?.conversions || 0);
      const rawTotalRevenue = parseFloat(conversionStats?.total_revenue || 0);
      const totalLeads = parseInt(conversionStats?.leads || 0);
      const totalSales = parseInt(conversionStats?.sales || 0);
      const totalCarts = parseInt(conversionStats?.carts || 0);
      const rawSalesRevenue = parseFloat(conversionStats?.sales_revenue || 0);
      const rawLeadRevenue = parseFloat(conversionStats?.lead_revenue || 0);
      const rawApprovedLeadRevenue = parseFloat(conversionStats?.approved_lead_revenue || 0);
      const rawApprovedSaleRevenue = parseFloat(conversionStats?.approved_sale_revenue || 0);
      const pendingLeads = parseInt(conversionStats?.pending_leads || 0);
      const pendingSales = parseInt(conversionStats?.pending_sales || 0);
      const measuredSessions = parseInt(clickStats?.measured_sessions || 0);
      const avgSessionSeconds = parseFloat(clickStats?.avg_session_seconds || 0);
      const bounces = parseInt(clickStats?.bounces || 0);
      const bounceRate = measuredSessions > 0 ? (bounces / measuredSessions) * 100 : 0;
      const adj = parseFloat(link.revenue_adjustment || 0);
      const adjusted = applyRevenueAdjustment(rawTotalRevenue, rawSalesRevenue, rawLeadRevenue, adj, totalSales);
      const totalRevenue = adjusted.total_revenue;
      const salesRevenue = adjusted.sales_revenue;
      const leadRevenue = adjusted.lead_revenue;
      const averageCheck = adjusted.average_check;

      const domain = normalizeDomain(extractDomain(link.original_url));
      const isCodeConnected = domain ? connectedDomains.has(domain) : false;

      const trackingUrl = buildTrackingUrlForLink(link, req);

      // Earnings = commission only on admin-approved leads & sales.
      const affiliateEarningsSales = isAffiliate && affiliatePercent != null
        ? commissionFromOrder(rawApprovedSaleRevenue, affiliatePercent)
        : 0;
      const affiliateEarningsLeads = isAffiliate && affiliatePercent != null
        ? commissionFromOrder(rawApprovedLeadRevenue, affiliatePercent)
        : 0;
      const affiliateEarnings = parseFloat((affiliateEarningsSales + affiliateEarningsLeads).toFixed(2));
      const pendingPayouts = pendingLeads + pendingSales;

      return {
        id: link.id,
        name: link.name,
        original_url: link.original_url,
        source_type: link.source_type,
        unique_code: link.unique_code,
        link_format: link.link_format || 'tracking',
        tracking_url: trackingUrl,
        split_enabled: Boolean(link.split_enabled),
        split_phase: link.split_phase,
        split_exploration_limit: link.split_exploration_limit,
        split_winner_variant_id: link.split_winner_variant_id,
        created_at: link.created_at,
        code_connected: isCodeConnected,
        domain: domain,
        stats: {
          unique_clicks: uniqueClicks,
          total_clicks: totalClicks,
          conversions: totalConversions,
          leads: totalLeads,
          sales: totalSales,
          carts: totalCarts,
          total_revenue: totalRevenue,
          sales_revenue: salesRevenue,
          lead_revenue: leadRevenue,
          pending_leads: pendingLeads,
          pending_sales: pendingSales,
          pending_payouts: pendingPayouts,
          affiliate_earnings: affiliateEarnings,
          affiliate_earnings_sales: affiliateEarningsSales,
          affiliate_earnings_leads: affiliateEarningsLeads,
          revenue_adjustment: adj,
          raw_total_revenue: parseFloat(rawTotalRevenue.toFixed(2)),
          avg_session_seconds: parseFloat(avgSessionSeconds.toFixed(2)),
          bounce_rate: parseFloat(bounceRate.toFixed(2)),
          average_check: averageCheck,
          measured_sessions: measuredSessions
        }
      };
    });

    res.json({
      success: true,
      links: linksWithStats,
      summary: {
        total_links: links.length,
        link_limit: req.user.link_limit,
        remaining_slots: Math.max(0, req.user.link_limit - links.length),
        ...(isAffiliate ? {
          affiliate: {
            commission_percent: affiliatePercent,
            balance: parseFloat(req.user.affiliate_balance || 0)
          }
        } : {})
      }
    });
  } catch (error) {
    next(error);
  }
});

router.post('/bulk-delete', authenticate, async (req, res, next) => {
  try {
    const ids = Array.isArray(req.body.ids)
      ? req.body.ids.map((id) => parseInt(id, 10)).filter((id) => Number.isInteger(id) && id > 0)
      : [];

    if (ids.length === 0) {
      return res.status(400).json({ error: 'ids array is required' });
    }

    const deletedCount = await Link.destroy({
      where: {
        id: ids,
        user_id: req.user.id
      }
    });

    res.json({
      success: true,
      deleted_count: deletedCount,
      requested_count: ids.length
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/links/:id/clear-stats
 * Remove all clicks and conversions for this link (keeps the link row).
 */
router.post('/:id/clear-stats', authenticate, async (req, res, next) => {
  try {
    const linkId = parseInt(req.params.id, 10);
    if (!Number.isInteger(linkId) || linkId <= 0) {
      return res.status(400).json({ error: 'Invalid link id' });
    }

    const link = await Link.findOne({
      where: { id: linkId, user_id: req.user.id },
      attributes: ['id']
    });

    if (!link) {
      return res.status(404).json({ error: 'Link not found' });
    }

    let conversionsDeleted = 0;
    let clicksDeleted = 0;
    let linkClicksDeleted = 0;

    await sequelize.transaction(async (transaction) => {
      conversionsDeleted = await Conversion.destroy({
        where: { link_id: linkId },
        transaction
      });
      clicksDeleted = await Click.destroy({
        where: { link_id: linkId },
        transaction
      });
      linkClicksDeleted = await LinkClick.destroy({
        where: { link_id: linkId },
        transaction
      });
    });

    res.json({
      success: true,
      deleted: {
        conversions: conversionsDeleted,
        clicks: clicksDeleted,
        link_clicks: linkClicksDeleted
      }
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/links/:id/purchases
 * Return recent sale conversions for a link (for dashboard popup)
 */
router.get('/:id/purchases', authenticate, async (req, res, next) => {
  try {
    const link = await Link.findOne({
      where: {
        id: req.params.id,
        user_id: req.user.id
      },
      attributes: ['id', 'name', 'unique_code']
    });

    if (!link) {
      return res.status(404).json({ error: 'Link not found' });
    }

    const conversions = await Conversion.findAll({
      where: {
        link_id: link.id
      },
      attributes: ['id', 'order_id', 'order_value', 'event_type', 'created_at'],
      order: [['created_at', 'DESC']],
      limit: 500
    });

    const mapped = conversions.map((c) => ({
      id: c.id,
      order_id: c.order_id || null,
      amount: Number(c.order_value || 0),
      event_type: c.event_type || 'sale',
      created_at: c.created_at
    }));

    res.json({
      success: true,
      link: {
        id: link.id,
        name: link.name,
        unique_code: link.unique_code
      },
      // Legacy field kept for backwards compat: only confirmed sales
      purchases: mapped.filter((c) => c.event_type === 'sale'),
      // Full list with event_type for the structured modal
      conversions: mapped
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
          attributes: ['id', 'order_value', 'event_type', 'created_at']
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

    let rawSalesRev = 0;
    let rawLeadRev = 0;
    let rawTotalRev = 0;
    let salesCount = 0;
    for (const conv of conversions) {
      const v = parseFloat(conv.order_value || 0);
      rawTotalRev += v;
      const et = conv.event_type;
      if (et === 'lead') {
        rawLeadRev += v;
      } else if (et === 'sale' || et === undefined || et === null) {
        rawSalesRev += v;
        salesCount += 1;
      }
      // cart та інше: лише в загальній сумі (як у SQL total_revenue)
    }
    const adj = parseFloat(link.revenue_adjustment || 0);
    const adjusted = applyRevenueAdjustment(rawTotalRev, rawSalesRev, rawLeadRev, adj, salesCount);

    res.json({
      success: true,
      link: {
        id: link.id,
        name: link.name,
        original_url: link.original_url,
        source_type: link.source_type,
        unique_code: link.unique_code,
        link_format: link.link_format || 'tracking',
        tracking_url: buildTrackingUrlForLink(link, req),
        created_at: link.created_at,
        stats: {
          unique_clicks: uniqueFingerprints.size,
          total_clicks: clicks.length,
          conversions: conversions.length,
          total_revenue: adjusted.total_revenue,
          sales_revenue: adjusted.sales_revenue,
          lead_revenue: adjusted.lead_revenue,
          revenue_adjustment: adj,
          raw_total_revenue: parseFloat(rawTotalRev.toFixed(2)),
          average_check: adjusted.average_check
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
        link_format: link.link_format || 'tracking',
        tracking_url: buildTrackingUrlForLink(link, req),
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