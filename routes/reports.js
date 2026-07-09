import express from 'express';
import crypto from 'crypto';
import { Op, fn, col } from 'sequelize';
import { authenticate } from '../middleware/auth.js';
import { User, Link, Click, Conversion } from '../models/index.js';
import { parseCommissionPercent, commissionFromOrder } from '../utils/affiliate.js';

const router = express.Router();

const REPORT_SECRET = process.env.REPORT_SHARE_SECRET || process.env.JWT_SECRET || 'lehko-report-secret';

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
      attributes: ['id', 'event_type', 'order_value', 'order_id', 'created_at'],
      order: [['created_at', 'DESC']],
      raw: true
    })
  ]);

  const c = clickRows[0] || {};
  const clicks = Number(c.clicks || 0);
  const uniqueClicks = Number(c.unique_clicks || 0);
  let conversions = 0, salesCount = 0, salesRevenue = 0, leadCount = 0, leadRevenue = 0;
  const conversionsList = convRows.map((r) => {
    const val = Number(r.order_value || 0);
    conversions += 1;
    if (r.event_type === 'sale' || r.event_type == null) {
      salesCount += 1;
      salesRevenue += val;
    } else if (r.event_type === 'lead') {
      leadCount += 1;
      leadRevenue += val;
    }
    return { id: r.id, event_type: r.event_type || 'sale', amount: val, order_id: r.order_id || null, created_at: r.created_at };
  });

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
      sales_count: salesCount,
      sales_revenue: Number(salesRevenue.toFixed(2)),
      lead_count: leadCount,
      lead_revenue: Number(leadRevenue.toFixed(2)),
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
      attributes: ['id', 'link_id', 'event_type', 'order_value', 'order_id', 'created_at'],
      order: [['created_at', 'DESC']],
      raw: true
    })
  ]);

  const clickBy = new Map(clickRows.map((r) => [Number(r.link_id), r]));
  const convBy = new Map();
  const convListBy = new Map();
  convRows.forEach((r) => {
    const id = Number(r.link_id);
    const curr = convBy.get(id) || { conversions: 0, sales_count: 0, sales_revenue: 0, lead_count: 0, lead_revenue: 0 };
    const val = Number(r.order_value || 0);
    curr.conversions += 1;
    if (r.event_type === 'sale' || r.event_type == null) {
      curr.sales_count += 1;
      curr.sales_revenue += val;
    } else if (r.event_type === 'lead') {
      curr.lead_count += 1;
      curr.lead_revenue += val;
    }
    convBy.set(id, curr);
    const list = convListBy.get(id) || [];
    list.push({ id: r.id, event_type: r.event_type || 'sale', amount: val, order_id: r.order_id || null, created_at: r.created_at });
    convListBy.set(id, list);
  });

  const items = links.map((l) => {
    const c = clickBy.get(Number(l.id)) || {};
    const v = convBy.get(Number(l.id)) || {};
    const clicks = Number(c.clicks || 0);
    const conversions = Number(v.conversions || 0);
    return {
      id: l.id,
      name: l.name || l.unique_code,
      original_url: l.original_url,
      clicks,
      unique_clicks: Number(c.unique_clicks || 0),
      conversions,
      sales_count: Number(v.sales_count || 0),
      sales_revenue: Number((v.sales_revenue || 0).toFixed(2)),
      lead_count: Number(v.lead_count || 0),
      lead_revenue: Number((v.lead_revenue || 0).toFixed(2)),
      conversion_rate: clicks > 0 ? Number(((conversions / clicks) * 100).toFixed(2)) : 0,
      conversions_list: convListBy.get(Number(l.id)) || [],
    };
  });

  return { items };
}

async function getAffiliatesOverview(range = 'all') {
  const fromDate = ['1', '3', '7', '14', '30'].includes(String(range))
    ? (() => {
        const d = new Date();
        d.setHours(0, 0, 0, 0);
        d.setDate(d.getDate() - (Number(range) - 1));
        return d;
      })()
    : null;

  const affiliates = await User.findAll({
    where: { role: 'affiliate' },
    attributes: ['id', 'email', 'affiliate_commission_percent', 'affiliate_balance'],
    raw: true
  });
  const affiliateIds = affiliates.map((a) => a.id);
  const links = await Link.findAll({
    where: { user_id: { [Op.in]: affiliateIds } },
    attributes: ['id', 'user_id'],
    raw: true
  });
  const linkIds = links.map((l) => l.id);
  const linkOwnerById = new Map(links.map((l) => [Number(l.id), Number(l.user_id)]));

  const whereConv = {
    link_id: { [Op.in]: linkIds },
    event_type: { [Op.in]: ['lead', 'sale'] },
    ...(fromDate ? { created_at: { [Op.gte]: fromDate } } : {})
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
    agg.conversions += 1;
    if (r.lead_status === 'pending') agg.pending_conversions += 1;
    if (r.lead_status === 'approved') {
      const val = Number(r.order_value || 0);
      agg.approved_revenue += val;
      agg.affiliate_earnings += commissionFromOrder(val, agg.commission_percent);
    }
  });

  return { range, items: Array.from(byAffiliate.values()) };
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
      if (req.user.role !== 'super_admin') return res.status(403).json({ error: 'Admin only report' });
      const range = ['1', '3', '7', '14', '30', 'all'].includes(String(req.body?.range)) ? String(req.body.range) : 'all';
      payload = { v: 1, type, range, user_id: req.user.id, white_label: null };
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
      const title = data.link.name ? `${data.link.name} — Link Report` : 'Link Report';
      return res.json({ success: true, type: payload.type, title, currency, white_label: payload.white_label, ...data });
    }
    if (payload.type === 'links_compare') {
      const data = await getLinksCompareData(payload.user_id, payload.link_ids || []);
      return res.json({ success: true, type: payload.type, title: 'Links comparison report', currency, white_label: payload.white_label, ...data });
    }
    if (payload.type === 'affiliates_overview') {
      const data = await getAffiliatesOverview(payload.range || 'all');
      return res.json({ success: true, type: payload.type, title: 'Affiliates overview report', white_label: payload.white_label, ...data });
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

    if (payload.type === 'link_single') {
      const data = await getSingleLinkData(payload.user_id, payload.link_id);
      if (!data) return res.status(404).send('Link not found');
      const s = data.stats;
      const rows = [
        ['Link', 'URL', 'Clicks', 'Unique Clicks', 'Conversions', 'Leads', 'CR %', 'Total Revenue', 'Sales Revenue'],
        [data.link.name, data.link.original_url, s.clicks, s.unique_clicks, s.conversions, s.lead_count, s.conversion_rate, s.total_revenue, s.sales_revenue]
      ];
      res.setHeader('Content-Disposition', `attachment; filename="link-report-${data.link.unique_code}.csv"`);
      return res.send(rows.map((r) => r.map((v) => `"${String(v ?? '').replace(/"/g, '""')}"`).join(',')).join('\n'));
    }
    if (payload.type === 'links_compare') {
      const data = await getLinksCompareData(payload.user_id, payload.link_ids || []);
      const rows = [['Link', 'URL', 'Clicks', 'Unique', 'Conversions', 'CR %', 'Sales Count', 'Sales Revenue', 'Lead Count', 'Lead Revenue']];
      data.items.forEach((i) => rows.push([i.name, i.original_url, i.clicks, i.unique_clicks, i.conversions, i.conversion_rate, i.sales_count, i.sales_revenue, i.lead_count, i.lead_revenue]));
      res.setHeader('Content-Disposition', 'attachment; filename="links-report.csv"');
      return res.send(rows.map((r) => r.map((v) => `"${String(v ?? '').replace(/"/g, '""')}"`).join(',')).join('\n'));
    }

    const data = await getAffiliatesOverview(payload.range || 'all');
    const rows = [['Affiliate', 'Commission %', 'Balance', 'Conversions', 'Pending', 'Approved Revenue', 'Earnings']];
    data.items.forEach((i) => rows.push([i.email, i.commission_percent, i.affiliate_balance, i.conversions, i.pending_conversions, i.approved_revenue, i.affiliate_earnings]));
    res.setHeader('Content-Disposition', 'attachment; filename="affiliates-report.csv"');
    return res.send(rows.map((r) => r.map((v) => `"${String(v ?? '').replace(/"/g, '""')}"`).join(',')).join('\n'));
  } catch (error) {
    next(error);
  }
});

export default router;
