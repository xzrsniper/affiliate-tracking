import express from 'express';
import { Link, Click, Conversion, User, Website } from '../models/index.js';
import { authenticate } from '../middleware/auth.js';
import { generateUniqueCode } from '../utils/codeGenerator.js';
import { Op, QueryTypes } from 'sequelize';
import sequelize from '../config/database.js';

const router = express.Router();

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
    const { original_url, name, source_type, link_format } = req.body;

    if (!original_url) {
      return res.status(400).json({ error: 'original_url is required' });
    }

    // Validate URL format
    try {
      new URL(original_url);
    } catch (e) {
      return res.status(400).json({ error: 'Invalid URL format' });
    }

    // Validate link_format
    const validFormats = ['tracking', 'original'];
    const resolvedFormat = validFormats.includes(link_format) ? link_format : 'tracking';

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
      unique_code: uniqueCode,
      link_format: resolvedFormat
    });

    // Build tracking_url based on format
    let trackingUrl;
    if (resolvedFormat === 'original') {
      try {
        const url = new URL(original_url);
        url.searchParams.set('ref', uniqueCode);
        trackingUrl = url.toString();
      } catch {
        const sep = original_url.includes('?') ? '&' : '?';
        trackingUrl = `${original_url}${sep}ref=${uniqueCode}`;
      }
    } else {
      trackingUrl = `${req.protocol}://${req.get('host')}/r/${uniqueCode}`;
    }

    res.status(201).json({
      success: true,
      message: 'Link created successfully',
      link: {
        id: link.id,
        name: link.name,
        original_url: link.original_url,
        source_type: link.source_type,
        unique_code: link.unique_code,
        link_format: link.link_format,
        tracking_url: trackingUrl,
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
      attributes: ['id', 'name', 'original_url', 'source_type', 'unique_code', 'link_format', 'created_at', 'user_id'],
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

    const clickStatsSql = clickColumns.hasSessionDuration
      ? `
        SELECT
          link_id,
          COUNT(*) as total_clicks,
          COUNT(DISTINCT visitor_fingerprint) as unique_clicks,
          COUNT(CASE WHEN session_duration_seconds IS NOT NULL THEN 1 END) as measured_sessions,
          COALESCE(AVG(session_duration_seconds), 0) as avg_session_seconds,
          SUM(CASE WHEN session_duration_seconds IS NOT NULL AND session_duration_seconds < 15 AND ${clickColumns.hasHadEngagement ? 'COALESCE(had_engagement, 0)' : '0'} = 0 THEN 1 ELSE 0 END) as bounces
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
          COALESCE(SUM(CASE WHEN event_type = 'lead' THEN order_value ELSE 0 END), 0) as lead_revenue
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

    const linksWithStats = links.map((link) => {
      const clickStats = clickStatsByLinkId.get(link.id) || {};
      const conversionStats = conversionStatsByLinkId.get(link.id) || {};

      const totalClicks = parseInt(clickStats?.total_clicks || 0);
      const uniqueClicks = parseInt(clickStats?.unique_clicks || 0);
      const totalConversions = parseInt(conversionStats?.conversions || 0);
      const totalRevenue = parseFloat(conversionStats?.total_revenue || 0);
      const totalLeads = parseInt(conversionStats?.leads || 0);
      const totalSales = parseInt(conversionStats?.sales || 0);
      const totalCarts = parseInt(conversionStats?.carts || 0);
      const salesRevenue = parseFloat(conversionStats?.sales_revenue || 0);
      const leadRevenue = parseFloat(conversionStats?.lead_revenue || 0);
      const measuredSessions = parseInt(clickStats?.measured_sessions || 0);
      const avgSessionSeconds = parseFloat(clickStats?.avg_session_seconds || 0);
      const bounces = parseInt(clickStats?.bounces || 0);
      const bounceRate = measuredSessions > 0 ? (bounces / measuredSessions) * 100 : 0;
      const averageCheck = totalSales > 0 ? salesRevenue / totalSales : 0;

      const domain = normalizeDomain(extractDomain(link.original_url));
      const isCodeConnected = domain ? connectedDomains.has(domain) : false;

      // Build tracking_url based on saved link_format
      let trackingUrl;
      if (link.link_format === 'original') {
        try {
          const url = new URL(link.original_url);
          url.searchParams.set('ref', link.unique_code);
          trackingUrl = url.toString();
        } catch {
          const sep = link.original_url.includes('?') ? '&' : '?';
          trackingUrl = `${link.original_url}${sep}ref=${link.unique_code}`;
        }
      } else {
        trackingUrl = `${req.protocol}://${req.get('host')}/r/${link.unique_code}`;
      }

      return {
        id: link.id,
        name: link.name,
        original_url: link.original_url,
        source_type: link.source_type,
        unique_code: link.unique_code,
        link_format: link.link_format || 'tracking',
        tracking_url: trackingUrl,
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
          total_revenue: parseFloat(totalRevenue.toFixed(2)),
          sales_revenue: parseFloat(salesRevenue.toFixed(2)),
          lead_revenue: parseFloat(leadRevenue.toFixed(2)),
          avg_session_seconds: parseFloat(avgSessionSeconds.toFixed(2)),
          bounce_rate: parseFloat(bounceRate.toFixed(2)),
          average_check: parseFloat(averageCheck.toFixed(2)),
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
        remaining_slots: Math.max(0, req.user.link_limit - links.length)
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