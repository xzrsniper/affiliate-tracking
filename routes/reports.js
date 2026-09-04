import express from 'express';
import crypto from 'crypto';
import { Op, fn, col } from 'sequelize';
import { authenticate } from '../middleware/auth.js';
import { User, Link, Click, Conversion, Website } from '../models/index.js';
import {
  parseCommissionPercent,
  commissionFromOrder,
  resolveCommissionPercentWithSites,
  groupWebsitesByUserId
} from '../utils/affiliate.js';
import {
  isApprovedModerationStatus,
  isConversionEvent,
  isPendingModerationStatus
} from '../utils/statsAggregation.js';
import { sendPublicReportEmail } from '../services/email.js';

const router = express.Router();

const REPORT_SECRET = process.env.REPORT_SHARE_SECRET || process.env.JWT_SECRET || 'lehko-report-secret';

/** Classify conversion by event_type (same rules as dashboard / links stats). */
function classifyEventType(eventType) {
  if (eventType === 'cart') return 'cart';
  if (eventType === 'lead') return 'lead';
  // 'sale' or null/undefined (legacy rows) → sale
  return 'sale';
}

function aggregateConversionRow(r, buckets) {
  const val = Number(r.order_value || 0);
  const kind = classifyEventType(r.event_type);
  if (kind === 'cart') {
    buckets.cart_count += 1;
    buckets.cart_revenue += val;
  } else if (kind === 'lead') {
    buckets.lead_count += 1;
    buckets.lead_revenue += val;
  } else {
    buckets.sales_count += 1;
    buckets.sales_revenue += val;
  }
  return {
    id: r.id,
    event_type: r.event_type || 'sale',
    lead_status: r.lead_status,
    amount: val,
    order_id: r.order_id || null,
    created_at: r.created_at
  };
}

function emptyBuckets() {
  return {
    sales_count: 0,
    sales_revenue: 0,
    lead_count: 0,
    lead_revenue: 0,
    cart_count: 0,
    cart_revenue: 0
  };
}

function signPayload(payload) {
  const body = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const sig = crypto.createHmac('sha256', REPORT_SECRET).update(body).digest('base64url');
  return `${body}.${sig}`;
}

function verifyToken(token) {
  const [body, sig] = String(token || '').split('.');
  if (!body || !sig) return null;
  const expected = crypto.createHmac('sha256', REPORT_SECRET).update(body).digest('base64url');
  if (expected !== sig) return null;
  try {
    return JSON.parse(Buffer.from(body, 'base64url').toString('utf8'));
  } catch {
    return null;
  }
}

function parseDateOnly(value, endOfDay = false) {
  const s = String(value || '').trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return null;
  const d = new Date(`${s}T${endOfDay ? '23:59:59.999' : '00:00:00'}`);
  return Number.isNaN(d.getTime()) ? null : d;
}

function toDateOnlyString(value) {
  if (!value) return null;
  if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}/.test(value)) {
    return value.slice(0, 10);
  }
  const d = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  // Local calendar date (server timezone) for consistent day boundaries
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function todayDateOnly() {
  return toDateOnlyString(new Date());
}

function formatPeriodLabel(from, to, { allTime = false, live = false } = {}) {
  if (allTime && !from && !to) {
    return {
      uk: 'Період: весь час',
      en: 'Period: all time'
    };
  }
  if (from && to && from === to) {
    return {
      uk: `Період: ${from}`,
      en: `Period: ${from}`
    };
  }
  if (from && to) {
    const liveNoteUk = live ? ' (актуально на день перегляду)' : '';
    const liveNoteEn = live ? ' (as of view date)' : '';
    return {
      uk: `Період: ${from} — ${to}${liveNoteUk}`,
      en: `Period: ${from} — ${to}${liveNoteEn}`
    };
  }
  if (from) {
    return {
      uk: `Період: з ${from}`,
      en: `Period: from ${from}`
    };
  }
  if (to) {
    return {
      uk: `Період: до ${to}`,
      en: `Period: until ${to}`
    };
  }
  return {
    uk: 'Період: весь час',
    en: 'Period: all time'
  };
}

function buildPeriod({ from = null, to = null, range = null, live = false, allTime = false } = {}) {
  const labels = formatPeriodLabel(from, to, { allTime, live });
  return {
    from: from || null,
    to: to || null,
    range: range || null,
    live: Boolean(live),
    all_time: Boolean(allTime),
    label: labels.uk,
    labels
  };
}

/** Freeze preset affiliate ranges into absolute calendar dates at share time. */
function resolveAffiliateSharePeriod(rangeInput, fromInput, toInput) {
  const from = parseDateOnly(fromInput) ? String(fromInput).slice(0, 10) : null;
  const to = parseDateOnly(toInput) ? String(toInput).slice(0, 10) : null;
  if (from || to) {
    return { range: 'custom', from, to };
  }
  const range = ['1', '3', '7', '14', '30', 'all'].includes(String(rangeInput))
    ? String(rangeInput)
    : 'all';
  if (['1', '3', '7', '14', '30'].includes(range)) {
    const toDate = new Date();
    toDate.setHours(0, 0, 0, 0);
    const fromDate = new Date(toDate);
    fromDate.setDate(fromDate.getDate() - (Number(range) - 1));
    return {
      range,
      from: toDateOnlyString(fromDate),
      to: toDateOnlyString(toDate)
    };
  }
  return { range: 'all', from: null, to: null };
}

function buildAffiliatesDateFilter({ range = 'all', from = null, to = null } = {}) {
  const fromDate = parseDateOnly(from, false);
  const toDate = parseDateOnly(to, true);
  if (fromDate || toDate) {
    const created_at = {};
    if (fromDate) created_at[Op.gte] = fromDate;
    if (toDate) created_at[Op.lte] = toDate;
    const fromStr = fromDate ? toDateOnlyString(fromDate) : null;
    const toStr = toDate ? toDateOnlyString(toDate) : null;
    return {
      from: fromStr,
      to: toStr,
      range: fromStr || toStr ? 'custom' : String(range || 'all'),
      filter: { created_at }
    };
  }

  if (['1', '3', '7', '14', '30'].includes(String(range))) {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() - (Number(range) - 1));
    const fromStr = toDateOnlyString(d);
    const toStr = todayDateOnly();
    return {
      from: fromStr,
      to: toStr,
      range: String(range),
      filter: { created_at: { [Op.gte]: d } }
    };
  }

  return { from: null, to: null, range: 'all', filter: {} };
}

async function getSingleLinkData(userId, linkId) {
  const link = await Link.findOne({
    where: { user_id: userId, id: linkId },
    attributes: ['id', 'name', 'unique_code', 'original_url', 'created_at'],
    raw: true
  });
  if (!link) return null;

  const [clickRows, convRows] = await Promise.all([
    Click.findAll({
      where: { link_id: link.id },
      attributes: [
        [fn('COUNT', col('id')), 'clicks'],
        [fn('COUNT', fn('DISTINCT', col('visitor_fingerprint'))), 'unique_clicks']
      ],
      raw: true
    }),
    Conversion.findAll({
      where: { link_id: link.id },
      attributes: ['id', 'event_type', 'lead_status', 'order_value', 'order_id', 'created_at'],
      order: [['created_at', 'DESC']],
      raw: true
    })
  ]);

  const c = clickRows[0] || {};
  const clicks = Number(c.clicks || 0);
  const uniqueClicks = Number(c.unique_clicks || 0);
  const buckets = emptyBuckets();
  const conversionsList = convRows.map((r) => aggregateConversionRow(r, buckets));
  const conversions = buckets.sales_count + buckets.lead_count;
  const periodFrom = toDateOnlyString(link.created_at);
  const periodTo = todayDateOnly();

  return {
    link: {
      id: link.id,
      name: link.name || link.unique_code,
      unique_code: link.unique_code,
      original_url: link.original_url,
      created_at: link.created_at
    },
    period: buildPeriod({ from: periodFrom, to: periodTo, live: true }),
    stats: {
      clicks,
      unique_clicks: uniqueClicks,
      conversions,
      sales_count: buckets.sales_count,
      sales_revenue: Number(buckets.sales_revenue.toFixed(2)),
      lead_count: buckets.lead_count,
      lead_revenue: Number(buckets.lead_revenue.toFixed(2)),
      cart_count: buckets.cart_count,
      cart_revenue: Number(buckets.cart_revenue.toFixed(2)),
      conversion_rate: clicks > 0 ? Number(((conversions / clicks) * 100).toFixed(2)) : 0,
    },
    conversions: conversionsList
  };
}

async function getLinksCompareData(userId, linkIds) {
  const links = await Link.findAll({
    where: { user_id: userId, id: { [Op.in]: linkIds } },
    attributes: ['id', 'name', 'unique_code', 'original_url', 'created_at'],
    order: [['created_at', 'DESC']],
    raw: true
  });
  if (!links.length) return { items: [] };
  const ids = links.map((l) => l.id);

  const [clickRows, convRows] = await Promise.all([
    Click.findAll({
      where: { link_id: { [Op.in]: ids } },
      attributes: [
        'link_id',
        [fn('COUNT', col('id')), 'clicks'],
        [fn('COUNT', fn('DISTINCT', col('visitor_fingerprint'))), 'unique_clicks']
      ],
      group: ['link_id'],
      raw: true
    }),
    Conversion.findAll({
      where: { link_id: { [Op.in]: ids } },
      attributes: ['id', 'link_id', 'event_type', 'lead_status', 'order_value', 'order_id', 'created_at'],
      order: [['created_at', 'DESC']],
      raw: true
    })
  ]);

  const clickBy = new Map(clickRows.map((r) => [Number(r.link_id), r]));
  const convBy = new Map();
  const convListBy = new Map();
  convRows.forEach((r) => {
    const id = Number(r.link_id);
    const curr = convBy.get(id) || emptyBuckets();
    const item = aggregateConversionRow(r, curr);
    convBy.set(id, curr);
    const list = convListBy.get(id) || [];
    list.push(item);
    convListBy.set(id, list);
  });

  const items = links.map((l) => {
    const c = clickBy.get(Number(l.id)) || {};
    const v = convBy.get(Number(l.id)) || emptyBuckets();
    const clicks = Number(c.clicks || 0);
    const conversions = v.sales_count + v.lead_count;
    return {
      id: l.id,
      name: l.name || l.unique_code,
      original_url: l.original_url,
      created_at: l.created_at,
      clicks,
      unique_clicks: Number(c.unique_clicks || 0),
      conversions,
      sales_count: v.sales_count,
      sales_revenue: Number(v.sales_revenue.toFixed(2)),
      lead_count: v.lead_count,
      lead_revenue: Number(v.lead_revenue.toFixed(2)),
      cart_count: v.cart_count,
      cart_revenue: Number(v.cart_revenue.toFixed(2)),
      conversion_rate: clicks > 0 ? Number(((conversions / clicks) * 100).toFixed(2)) : 0,
      conversions_list: convListBy.get(Number(l.id)) || [],
    };
  });

  const createdDates = links
    .map((l) => toDateOnlyString(l.created_at))
    .filter(Boolean)
    .sort();
  const periodFrom = createdDates[0] || null;
  const periodTo = todayDateOnly();

  return {
    items,
    period: buildPeriod({ from: periodFrom, to: periodTo, live: true })
  };
}

async function getUserLinksData(targetUserId) {
  const owner = await User.findByPk(targetUserId, { attributes: ['id', 'email'], raw: true });
  if (!owner) return null;

  const links = await Link.findAll({
    where: { user_id: targetUserId },
    attributes: ['id'],
    order: [['created_at', 'DESC']],
    raw: true
  });
  const ids = links.map((l) => l.id);
  if (!ids.length) {
    return { items: [], user: { id: owner.id, email: owner.email } };
  }

  const data = await getLinksCompareData(targetUserId, ids);
  return { ...data, user: { id: owner.id, email: owner.email } };
}

async function getAffiliatesOverview({ range = 'all', from = null, to = null } = {}) {
  const { from: resolvedFrom, to: resolvedTo, range: resolvedRange, filter: dateFilter } =
    buildAffiliatesDateFilter({ range, from, to });

  const affiliates = await User.findAll({
    where: { role: 'affiliate' },
    attributes: ['id', 'email', 'affiliate_commission_percent', 'affiliate_balance'],
    raw: true
  });
  const affiliateIds = affiliates.map((a) => a.id);
  const links = await Link.findAll({
    where: { user_id: { [Op.in]: affiliateIds } },
    attributes: ['id', 'user_id', 'original_url'],
    raw: true
  });
  const linkIds = links.map((l) => l.id);
  const linkById = new Map(links.map((l) => [Number(l.id), l]));
  const linkOwnerById = new Map(links.map((l) => [Number(l.id), Number(l.user_id)]));
  const affiliateById = new Map(affiliates.map((a) => [Number(a.id), a]));

  const websiteRows = affiliateIds.length
    ? await Website.findAll({
        where: { user_id: { [Op.in]: affiliateIds } },
        attributes: ['user_id', 'domain', 'commission_percent'],
        raw: true
      })
    : [];
  const websitesByUser = groupWebsitesByUserId(websiteRows);

  const whereConv = {
    link_id: { [Op.in]: linkIds },
    [Op.or]: [
      { event_type: { [Op.in]: ['lead', 'sale'] } },
      { event_type: null }
    ],
    ...dateFilter
  };
  const convRows = linkIds.length ? await Conversion.findAll({ where: whereConv, raw: true }) : [];

  const byAffiliate = new Map(
    affiliates.map((a) => [
      Number(a.id),
      {
        user_id: Number(a.id),
        email: a.email,
        commission_percent: parseCommissionPercent(a.affiliate_commission_percent) || 0,
        affiliate_balance: Number(a.affiliate_balance || 0),
        conversions: 0,
        pending_conversions: 0,
        approved_revenue: 0,
        affiliate_earnings: 0
      }
    ])
  );

  convRows.forEach((r) => {
    const ownerId = linkOwnerById.get(Number(r.link_id));
    const agg = byAffiliate.get(ownerId);
    if (!agg) return;
    if (!isConversionEvent(r.event_type)) return;
    agg.conversions += 1;
    if (isPendingModerationStatus(r.lead_status)) agg.pending_conversions += 1;
    // Same as admin overview: only explicitly approved conversions count as payout revenue
    if (isApprovedModerationStatus(r.lead_status)) {
      const val = Number(r.order_value || 0);
      const percent = resolveCommissionPercentWithSites(
        affiliateById.get(ownerId),
        linkById.get(Number(r.link_id)),
        websitesByUser.get(ownerId) || []
      ) ?? agg.commission_percent;
      agg.approved_revenue += val;
      agg.affiliate_earnings += commissionFromOrder(val, percent);
    }
  });

  return {
    range: resolvedRange,
    from: resolvedFrom,
    to: resolvedTo,
    period: buildPeriod({
      from: resolvedFrom,
      to: resolvedTo,
      range: resolvedRange,
      live: false,
      allTime: resolvedRange === 'all' && !resolvedFrom && !resolvedTo
    }),
    items: Array.from(byAffiliate.values()).map((a) => ({
      ...a,
      approved_revenue: Number(a.approved_revenue.toFixed(2)),
      affiliate_earnings: Number(a.affiliate_earnings.toFixed(2))
    }))
  };
}

router.post('/share', authenticate, async (req, res, next) => {
  try {
    const { type } = req.body || {};
    let payload;
    const currency = ['₴', '$', '€', '£'].includes(req.body?.currency) ? req.body.currency : '₴';
    if (type === 'link_single') {
      const linkId = parseInt(req.body?.link_id, 10);
      if (!Number.isInteger(linkId) || linkId <= 0) return res.status(400).json({ error: 'link_id required' });
      payload = { v: 1, type, user_id: req.user.id, link_id: linkId, currency, white_label: null };
    } else if (type === 'links_compare') {
      const linkIds = Array.isArray(req.body?.link_ids)
        ? req.body.link_ids.map((id) => parseInt(id, 10)).filter((id) => Number.isInteger(id) && id > 0).slice(0, 6)
        : [];
      if (linkIds.length < 1) return res.status(400).json({ error: 'link_ids required' });
      payload = { v: 1, type, user_id: req.user.id, link_ids: linkIds, currency, white_label: null };
    } else if (type === 'user_links') {
      if (req.user.role !== 'super_admin' && req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Admin only report' });
      }
      const targetUserId = parseInt(req.body?.target_user_id, 10);
      if (!Number.isInteger(targetUserId) || targetUserId <= 0) {
        return res.status(400).json({ error: 'target_user_id required' });
      }
      const target = await User.findByPk(targetUserId, { attributes: ['id'] });
      if (!target) return res.status(404).json({ error: 'User not found' });
      payload = {
        v: 1,
        type,
        user_id: targetUserId,
        created_by: req.user.id,
        currency,
        white_label: null
      };
    } else if (type === 'affiliates_overview') {
      if (req.user.role !== 'super_admin' && req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Admin only report' });
      }
      const sharedPeriod = resolveAffiliateSharePeriod(req.body?.range, req.body?.from, req.body?.to);
      payload = {
        v: 1,
        type,
        range: sharedPeriod.range,
        from: sharedPeriod.from,
        to: sharedPeriod.to,
        user_id: req.user.id,
        white_label: null
      };
    } else {
      return res.status(400).json({ error: 'Unsupported report type' });
    }

    payload.issued_at = Date.now();
    const token = signPayload(payload);
    const base = `${req.protocol}://${req.get('host')}`;
    res.json({ success: true, token, url: `${base}/report/${token}` });
  } catch (error) {
    next(error);
  }
});

function isValidEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value || '').trim());
}

function csvEscape(value) {
  return `"${String(value ?? '').replace(/"/g, '""')}"`;
}

function buildCsv(rows) {
  return `\uFEFF${rows.map((r) => r.map(csvEscape).join(',')).join('\n')}`;
}

/**
 * POST /api/reports/email
 * Create a public report token and email it to the user (or optional recipient).
 * Body: { type: 'link_single'|'links_compare', link_id?, link_ids?, currency?, lang?, to? }
 */
router.post('/email', authenticate, async (req, res, next) => {
  try {
    const { type } = req.body || {};
    const lang = String(req.body?.lang || '').toLowerCase() === 'en' ? 'en' : 'uk';
    const currency = ['₴', '$', '€', '£'].includes(req.body?.currency) ? req.body.currency : '₴';
    const locale = lang === 'en' ? 'en-US' : 'uk-UA';
    const to = String(req.body?.to || req.user.email || '').trim().toLowerCase();
    if (!isValidEmail(to)) {
      return res.status(400).json({ error: 'Valid recipient email required' });
    }

    let payload;
    if (type === 'link_single') {
      const linkId = parseInt(req.body?.link_id, 10);
      if (!Number.isInteger(linkId) || linkId <= 0) return res.status(400).json({ error: 'link_id required' });
      payload = { v: 1, type, user_id: req.user.id, link_id: linkId, currency, white_label: null };
    } else if (type === 'links_compare') {
      const linkIds = Array.isArray(req.body?.link_ids)
        ? req.body.link_ids.map((id) => parseInt(id, 10)).filter((id) => Number.isInteger(id) && id > 0).slice(0, 6)
        : [];
      if (linkIds.length < 1) return res.status(400).json({ error: 'link_ids required' });
      payload = { v: 1, type, user_id: req.user.id, link_ids: linkIds, currency, white_label: null };
    } else {
      return res.status(400).json({ error: 'Unsupported report type for email' });
    }

    payload.issued_at = Date.now();
    const token = signPayload(payload);
    const requestBase = `${req.protocol}://${req.get('host')}`;
    const publicBase = (process.env.FRONTEND_URL || process.env.APP_URL || requestBase).replace(/\/$/, '');
    const reportUrl = `${publicBase}/report/${token}`;
    const exportUrl = `${publicBase}/api/reports/public/${token}/export?lang=${lang}`;

    let title;
    let periodLabel = '';
    let stats = [];
    let tableRows = [];
    let attachment = null;

    if (type === 'link_single') {
      const data = await getSingleLinkData(req.user.id, payload.link_id);
      if (!data) return res.status(404).json({ error: 'Link not found' });
      const name = data.link.name || data.link.unique_code;
      title = lang === 'en'
        ? (name ? `${name} — Link report` : 'Link report')
        : (name ? `${name} — Звіт по посиланню` : 'Звіт по посиланню');
      periodLabel = data.period?.labels?.[lang] || data.period?.label || '';
      const s = data.stats || {};
      stats = [
        { label: lang === 'en' ? 'Clicks' : 'Кліки', value: Number(s.clicks || 0).toLocaleString(locale) },
        { label: lang === 'en' ? 'Unique' : 'Унікальні', value: Number(s.unique_clicks || 0).toLocaleString(locale) },
        { label: lang === 'en' ? 'Sales' : 'Продажі', value: Number(s.sales_count || 0).toLocaleString(locale) },
        { label: lang === 'en' ? 'Leads' : 'Ліди', value: Number(s.lead_count || 0).toLocaleString(locale) },
        { label: lang === 'en' ? 'CR' : 'CR', value: `${Number(s.conversion_rate || 0).toLocaleString(locale)}%` },
        {
          label: lang === 'en' ? 'Sales revenue' : 'Дохід з продажів',
          value: `${Number(s.sales_revenue || 0).toLocaleString(locale)} ${currency}`
        }
      ];
      attachment = {
        filename: `link-report-${data.link.unique_code}.csv`,
        content: buildCsv([
          [lang === 'en' ? 'Period' : 'Період', periodLabel],
          [],
          [
            lang === 'en' ? 'Link' : 'Посилання',
            'URL',
            lang === 'en' ? 'Clicks' : 'Кліки',
            lang === 'en' ? 'Unique' : 'Унікальні',
            lang === 'en' ? 'Conversions' : 'Конверсії',
            lang === 'en' ? 'Sales' : 'Продажі',
            lang === 'en' ? 'Leads' : 'Ліди',
            lang === 'en' ? 'Carts' : 'Кошик',
            'CR %',
            lang === 'en' ? 'Sales revenue' : 'Дохід з продажів'
          ],
          [
            name,
            data.link.original_url,
            s.clicks,
            s.unique_clicks,
            s.conversions,
            s.sales_count,
            s.lead_count,
            s.cart_count,
            s.conversion_rate,
            s.sales_revenue
          ]
        ])
      };
    } else {
      const data = await getLinksCompareData(req.user.id, payload.link_ids || []);
      title = lang === 'en' ? 'Links comparison report' : 'Порівняння посилань';
      periodLabel = data.period?.labels?.[lang] || data.period?.label || '';
      const items = data.items || [];
      const totalClicks = items.reduce((sum, i) => sum + Number(i.clicks || 0), 0);
      const totalConv = items.reduce((sum, i) => sum + Number(i.conversions || 0), 0);
      const totalSales = items.reduce((sum, i) => sum + Number(i.sales_count || 0), 0);
      const totalRevenue = items.reduce((sum, i) => sum + Number(i.sales_revenue || 0), 0);
      stats = [
        { label: lang === 'en' ? 'Links' : 'Посилання', value: String(items.length) },
        { label: lang === 'en' ? 'Clicks' : 'Кліки', value: totalClicks.toLocaleString(locale) },
        { label: lang === 'en' ? 'Conversions' : 'Конверсії', value: totalConv.toLocaleString(locale) },
        { label: lang === 'en' ? 'Sales' : 'Продажі', value: totalSales.toLocaleString(locale) },
        {
          label: lang === 'en' ? 'Sales revenue' : 'Дохід з продажів',
          value: `${totalRevenue.toLocaleString(locale)} ${currency}`
        }
      ];
      tableRows = items.map((i) => [
        i.name,
        Number(i.clicks || 0).toLocaleString(locale),
        Number(i.conversions || 0).toLocaleString(locale),
        `${Number(i.sales_revenue || 0).toLocaleString(locale)} ${currency}`
      ]);
      attachment = {
        filename: 'links-report.csv',
        content: buildCsv([
          [lang === 'en' ? 'Period' : 'Період', periodLabel],
          [],
          [
            lang === 'en' ? 'Link' : 'Посилання',
            'URL',
            lang === 'en' ? 'Clicks' : 'Кліки',
            lang === 'en' ? 'Unique' : 'Унікальні',
            lang === 'en' ? 'Conversions' : 'Конверсії',
            'CR %',
            lang === 'en' ? 'Sales' : 'Продажі',
            lang === 'en' ? 'Sales revenue' : 'Дохід з продажів',
            lang === 'en' ? 'Leads' : 'Ліди',
            lang === 'en' ? 'Lead revenue' : 'Дохід з лідів',
            lang === 'en' ? 'Carts' : 'Кошик',
            lang === 'en' ? 'Cart revenue' : 'Сума кошиків'
          ],
          ...items.map((i) => [
            i.name,
            i.original_url,
            i.clicks,
            i.unique_clicks,
            i.conversions,
            i.conversion_rate,
            i.sales_count,
            i.sales_revenue,
            i.lead_count,
            i.lead_revenue,
            i.cart_count,
            i.cart_revenue
          ])
        ])
      };
    }

    const sent = await sendPublicReportEmail({
      to,
      lang,
      type,
      title,
      periodLabel: periodLabel.replace(/^Період:\s*/i, '').replace(/^Period:\s*/i, ''),
      reportUrl,
      exportUrl,
      stats,
      tableRows,
      attachment
    });

    if (!sent.ok) {
      return res.status(503).json({ error: sent.error || 'Failed to send email' });
    }

    res.json({ success: true, to, url: reportUrl });
  } catch (error) {
    next(error);
  }
});

router.get('/public/:token', async (req, res, next) => {
  try {
    const payload = verifyToken(req.params.token);
    if (!payload) return res.status(404).json({ error: 'Report not found' });
    res.setHeader('X-Robots-Tag', 'noindex, nofollow');

    const currency = payload.currency || '₴';
    if (payload.type === 'link_single') {
      const data = await getSingleLinkData(payload.user_id, payload.link_id);
      if (!data) return res.status(404).json({ error: 'Link not found' });
      const name = data.link.name || data.link.unique_code;
      return res.json({
        success: true,
        type: payload.type,
        title: name ? `${name} — Link Report` : 'Link Report',
        titles: {
          uk: name ? `${name} — Звіт по посиланню` : 'Звіт по посиланню',
          en: name ? `${name} — Link report` : 'Link report'
        },
        currency,
        white_label: payload.white_label,
        ...data
      });
    }
    if (payload.type === 'links_compare') {
      const data = await getLinksCompareData(payload.user_id, payload.link_ids || []);
      return res.json({
        success: true,
        type: payload.type,
        title: 'Links comparison report',
        titles: { uk: 'Порівняння посилань', en: 'Links comparison' },
        currency,
        white_label: payload.white_label,
        ...data
      });
    }
    if (payload.type === 'user_links') {
      const data = await getUserLinksData(payload.user_id);
      if (!data) return res.status(404).json({ error: 'User not found' });
      const email = data.user?.email || '';
      return res.json({
        success: true,
        type: payload.type,
        title: email ? `${email} — User report` : 'User report',
        titles: {
          uk: email ? `${email} — Звіт по користувачу` : 'Звіт по користувачу',
          en: email ? `${email} — User report` : 'User report'
        },
        currency,
        white_label: payload.white_label,
        ...data
      });
    }
    if (payload.type === 'affiliates_overview') {
      const data = await getAffiliatesOverview({
        range: payload.range || 'all',
        from: payload.from || null,
        to: payload.to || null
      });
      return res.json({
        success: true,
        type: payload.type,
        title: 'Affiliates overview report',
        titles: { uk: 'Звіт по афілейтах', en: 'Affiliates overview' },
        white_label: payload.white_label,
        ...data
      });
    }

    return res.status(400).json({ error: 'Unsupported report type' });
  } catch (error) {
    next(error);
  }
});

router.get('/public/:token/export', async (req, res, next) => {
  try {
    const payload = verifyToken(req.params.token);
    if (!payload) return res.status(404).send('Report not found');
    res.setHeader('X-Robots-Tag', 'noindex, nofollow');
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');

    const lang = String(req.query.lang || '').toLowerCase() === 'en' ? 'en' : 'uk';
    const csvHeaders = {
      uk: {
        link: 'Посилання',
        url: 'URL',
        clicks: 'Кліки',
        uniqueClicks: 'Унікальні кліки',
        unique: 'Унікальні',
        conversions: 'Конверсії',
        leads: 'Ліди',
        cr: 'CR %',
        totalRevenue: 'Загальний дохід',
        salesRevenue: 'Дохід з продажів',
        salesCount: 'Продажі',
        leadCount: 'Ліди',
        leadRevenue: 'Дохід з лідів',
        carts: 'Кошик',
        cartRevenue: 'Сума кошиків',
        affiliate: 'Афілейт',
        commission: 'Комісія %',
        balance: 'Баланс',
        pending: 'Очікують',
        approvedRevenue: 'Підтверджений дохід',
        earnings: 'Заробіток'
      },
      en: {
        link: 'Link',
        url: 'URL',
        clicks: 'Clicks',
        uniqueClicks: 'Unique Clicks',
        unique: 'Unique',
        conversions: 'Conversions',
        leads: 'Leads',
        cr: 'CR %',
        totalRevenue: 'Total Revenue',
        salesRevenue: 'Sales Revenue',
        salesCount: 'Sales Count',
        leadCount: 'Lead Count',
        leadRevenue: 'Lead Revenue',
        carts: 'Cart',
        cartRevenue: 'Cart Revenue',
        affiliate: 'Affiliate',
        commission: 'Commission %',
        balance: 'Balance',
        pending: 'Pending',
        approvedRevenue: 'Approved Revenue',
        earnings: 'Earnings'
      }
    };
    const h = csvHeaders[lang];
    const periodHeader = lang === 'en' ? 'Period' : 'Період';

    if (payload.type === 'link_single') {
      const data = await getSingleLinkData(payload.user_id, payload.link_id);
      if (!data) return res.status(404).send('Link not found');
      const s = data.stats;
      const periodLabel = data.period?.labels?.[lang] || data.period?.label || '';
      const rows = [
        [periodHeader, periodLabel],
        [],
        [h.link, h.url, h.clicks, h.uniqueClicks, h.conversions, h.leads, h.carts, h.cr, h.salesRevenue, h.cartRevenue],
        [data.link.name, data.link.original_url, s.clicks, s.unique_clicks, s.conversions, s.lead_count, s.cart_count, s.conversion_rate, s.sales_revenue, s.cart_revenue]
      ];
      res.setHeader('Content-Disposition', `attachment; filename="link-report-${data.link.unique_code}.csv"`);
      return res.send('\uFEFF' + rows.map((r) => r.map((v) => `"${String(v ?? '').replace(/"/g, '""')}"`).join(',')).join('\n'));
    }
    if (payload.type === 'links_compare' || payload.type === 'user_links') {
      const data = payload.type === 'user_links'
        ? await getUserLinksData(payload.user_id)
        : await getLinksCompareData(payload.user_id, payload.link_ids || []);
      if (!data) return res.status(404).send('Report not found');
      const periodLabel = data.period?.labels?.[lang] || data.period?.label || '';
      const rows = [
        [periodHeader, periodLabel],
        [],
        [h.link, h.url, h.clicks, h.unique, h.conversions, h.cr, h.salesCount, h.salesRevenue, h.leadCount, h.leadRevenue, h.carts, h.cartRevenue]
      ];
      data.items.forEach((i) => rows.push([i.name, i.original_url, i.clicks, i.unique_clicks, i.conversions, i.conversion_rate, i.sales_count, i.sales_revenue, i.lead_count, i.lead_revenue, i.cart_count, i.cart_revenue]));
      const filename = payload.type === 'user_links' ? 'user-report.csv' : 'links-report.csv';
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      return res.send('\uFEFF' + rows.map((r) => r.map((v) => `"${String(v ?? '').replace(/"/g, '""')}"`).join(',')).join('\n'));
    }

    const data = await getAffiliatesOverview({
      range: payload.range || 'all',
      from: payload.from || null,
      to: payload.to || null
    });
    const periodLabel = data.period?.labels?.[lang] || data.period?.label || '';
    const rows = [
      [periodHeader, periodLabel],
      [],
      [h.affiliate, h.commission, h.balance, h.conversions, h.pending, h.approvedRevenue, h.earnings]
    ];
    data.items.forEach((i) => rows.push([i.email, i.commission_percent, i.affiliate_balance, i.conversions, i.pending_conversions, i.approved_revenue, i.affiliate_earnings]));
    res.setHeader('Content-Disposition', 'attachment; filename="affiliates-report.csv"');
    return res.send('\uFEFF' + rows.map((r) => r.map((v) => `"${String(v ?? '').replace(/"/g, '""')}"`).join(',')).join('\n'));
  } catch (error) {
    next(error);
  }
});

export default router;
