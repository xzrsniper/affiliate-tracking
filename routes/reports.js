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

function buildAffiliatesDateFilter({ range = 'all', from = null, to = null } = {}) {
  const fromDate = parseDateOnly(from, false);
  const toDate = parseDateOnly(to, true);
  if (fromDate || toDate) {
    const created_at = {};
    if (fromDate) created_at[Op.gte] = fromDate;
    if (toDate) created_at[Op.lte] = toDate;
    return {
      label: fromDate && toDate
        ? `${fromDate.toISOString().slice(0, 10)}…${toDate.toISOString().slice(0, 10)}`
        : (fromDate ? `from ${fromDate.toISOString().slice(0, 10)}` : `to ${toDate.toISOString().slice(0, 10)}`),
      filter: { created_at }
    };
  }

  if (['1', '3', '7', '14', '30'].includes(String(range))) {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() - (Number(range) - 1));
    return { label: String(range), filter: { created_at: { [Op.gte]: d } } };
  }

  return { label: 'all', filter: {} };
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

  return {
    link: {
      id: link.id,
      name: link.name || link.unique_code,
      unique_code: link.unique_code,
      original_url: link.original_url,
      created_at: link.created_at
    },
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

  return { items };
}

async function getAffiliatesOverview({ range = 'all', from = null, to = null } = {}) {
  const { label, filter: dateFilter } = buildAffiliatesDateFilter({ range, from, to });

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
    range: label,
    from: from || null,
    to: to || null,
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
    } else if (type === 'affiliates_overview') {
      if (req.user.role !== 'super_admin' && req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Admin only report' });
      }
      const range = ['1', '3', '7', '14', '30', 'all'].includes(String(req.body?.range)) ? String(req.body.range) : 'all';
      const from = parseDateOnly(req.body?.from) ? String(req.body.from).slice(0, 10) : null;
      const to = parseDateOnly(req.body?.to) ? String(req.body.to).slice(0, 10) : null;
      payload = { v: 1, type, range, from, to, user_id: req.user.id, white_label: null };
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

    if (payload.type === 'link_single') {
      const data = await getSingleLinkData(payload.user_id, payload.link_id);
      if (!data) return res.status(404).send('Link not found');
      const s = data.stats;
      const rows = [
        [h.link, h.url, h.clicks, h.uniqueClicks, h.conversions, h.leads, h.carts, h.cr, h.salesRevenue, h.cartRevenue],
        [data.link.name, data.link.original_url, s.clicks, s.unique_clicks, s.conversions, s.lead_count, s.cart_count, s.conversion_rate, s.sales_revenue, s.cart_revenue]
      ];
      res.setHeader('Content-Disposition', `attachment; filename="link-report-${data.link.unique_code}.csv"`);
      return res.send('\uFEFF' + rows.map((r) => r.map((v) => `"${String(v ?? '').replace(/"/g, '""')}"`).join(',')).join('\n'));
    }
    if (payload.type === 'links_compare') {
      const data = await getLinksCompareData(payload.user_id, payload.link_ids || []);
      const rows = [[h.link, h.url, h.clicks, h.unique, h.conversions, h.cr, h.salesCount, h.salesRevenue, h.leadCount, h.leadRevenue, h.carts, h.cartRevenue]];
      data.items.forEach((i) => rows.push([i.name, i.original_url, i.clicks, i.unique_clicks, i.conversions, i.conversion_rate, i.sales_count, i.sales_revenue, i.lead_count, i.lead_revenue, i.cart_count, i.cart_revenue]));
      res.setHeader('Content-Disposition', 'attachment; filename="links-report.csv"');
      return res.send('\uFEFF' + rows.map((r) => r.map((v) => `"${String(v ?? '').replace(/"/g, '""')}"`).join(',')).join('\n'));
    }

    const data = await getAffiliatesOverview({
      range: payload.range || 'all',
      from: payload.from || null,
      to: payload.to || null
    });
    const rows = [[h.affiliate, h.commission, h.balance, h.conversions, h.pending, h.approvedRevenue, h.earnings]];
    data.items.forEach((i) => rows.push([i.email, i.commission_percent, i.affiliate_balance, i.conversions, i.pending_conversions, i.approved_revenue, i.affiliate_earnings]));
    res.setHeader('Content-Disposition', 'attachment; filename="affiliates-report.csv"');
    return res.send('\uFEFF' + rows.map((r) => r.map((v) => `"${String(v ?? '').replace(/"/g, '""')}"`).join(',')).join('\n'));
  } catch (error) {
    next(error);
  }
});

export default router;
