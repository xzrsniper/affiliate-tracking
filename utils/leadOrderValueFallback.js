/**
 * When a lead arrives with order_value 0 (pixel missed DOM price), resolve amount from:
 * 1) website.static_price by explicit site_id (body/query)
 * 2) website.static_price where website.domain matches link.original_url host
 * 3) website.static_price if user has exactly one website with static_price set
 * 4) last successful sale amount for the same tracking link (same product price heuristic)
 */
import { Op } from 'sequelize';
import { Website, Conversion } from '../models/index.js';

function normalizeHost(h) {
  if (!h || typeof h !== 'string') return '';
  return h.replace(/^www\./i, '').toLowerCase().trim();
}

/** domain field in DB may be "shop.ua", "https://shop.ua/path", "www.shop.ua" */
function hostnameFromStoredDomain(domain) {
  if (!domain || typeof domain !== 'string') return '';
  const s = domain.trim();
  if (/^https?:\/\//i.test(s)) {
    try {
      return normalizeHost(new URL(s).hostname);
    } catch {
      return '';
    }
  }
  return normalizeHost(s.split('/')[0]);
}

function hostnameFromLinkUrl(originalUrl) {
  if (!originalUrl || typeof originalUrl !== 'string') return '';
  try {
    const u = new URL(originalUrl);
    return normalizeHost(u.hostname);
  } catch {
    return '';
  }
}

function domainsMatch(linkHost, websiteDomainRaw) {
  const wd = hostnameFromStoredDomain(websiteDomainRaw);
  const h = normalizeHost(linkHost);
  if (!wd || !h) return false;
  if (h === wd) return true;
  if (h.endsWith('.' + wd)) return true;
  if (wd.endsWith('.' + h)) return true;
  return false;
}

function parseStaticPrice(raw) {
  if (raw == null) return null;
  const sp = parseFloat(raw);
  if (Number.isFinite(sp) && sp > 0 && sp < 10000000) return sp;
  return null;
}

/** @returns {Promise<{ value: number, source: string, websiteId?: number }|null>} */
export async function resolveLeadStaticPrice(link, siteIdFromBody) {
  const uid = link.user_id;

  if (siteIdFromBody != null && siteIdFromBody !== '') {
    const sid = parseInt(String(siteIdFromBody), 10);
    if (Number.isFinite(sid) && sid > 0) {
      try {
        const website = await Website.findByPk(sid, { attributes: ['id', 'static_price', 'user_id'] });
        if (website && Number(website.user_id) === Number(uid)) {
          const sp = parseStaticPrice(website.static_price);
          if (sp != null) {
            return { value: sp, source: 'static_price_site_id', websiteId: website.id };
          }
        }
      } catch (e) {
        console.warn('[leadOrderValueFallback] site_id lookup failed', e.message);
      }
    }
  }

  const websites = await Website.findAll({
    where: { user_id: uid },
    attributes: ['id', 'domain', 'static_price']
  });

  const withPrice = websites
    .map((w) => ({ w, sp: parseStaticPrice(w.static_price) }))
    .filter((x) => x.sp != null);

  if (withPrice.length === 0) return null;

  const linkHost = hostnameFromLinkUrl(link.original_url);
  if (linkHost) {
    for (const { w, sp } of withPrice) {
      if (w.domain && domainsMatch(linkHost, w.domain)) {
        return { value: sp, source: 'static_price_domain_match', websiteId: w.id };
      }
    }
  }

  if (withPrice.length === 1) {
    return {
      value: withPrice[0].sp,
      source: 'static_price_single_website',
      websiteId: withPrice[0].w.id
    };
  }

  return null;
}

/**
 * Last sale on same link — typical same SKU price when static_price not configured.
 */
export async function resolveLeadFromLastSale(linkId) {
  const row = await Conversion.findOne({
    where: {
      link_id: linkId,
      event_type: 'sale',
      order_value: { [Op.gt]: 0 }
    },
    order: [['created_at', 'DESC']],
    attributes: ['order_value']
  });
  if (!row) return null;
  const v = parseFloat(row.order_value);
  if (Number.isFinite(v) && v > 0 && v < 10000000) return v;
  return null;
}

/** Full chain for lead with parsedOrderValue === 0. */
export async function resolveLeadOrderValueFallback(link, siteIdFromBody) {
  const fromStatic = await resolveLeadStaticPrice(link, siteIdFromBody);
  if (fromStatic) return fromStatic;

  const last = await resolveLeadFromLastSale(link.id);
  if (last != null) {
    return { value: last, source: 'last_sale_same_link' };
  }

  return null;
}
