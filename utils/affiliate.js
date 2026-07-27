/**
 * Affiliate commission and balance helpers.
 */
import { User, Website } from '../models/index.js';

export function isAffiliateUser(user) {
  return user?.role === 'affiliate';
}

export function parseCommissionPercent(raw) {
  const p = parseFloat(raw);
  if (!Number.isFinite(p) || p < 0 || p > 100) return null;
  return Math.round(p * 100) / 100;
}

/** Commission amount from order value and percent. */
export function commissionFromOrder(orderValue, percent) {
  const p = parseCommissionPercent(percent);
  if (p == null || p === 0) return 0;
  const v = parseFloat(orderValue);
  if (!Number.isFinite(v) || v <= 0) return 0;
  return Math.round((v * p) / 100 * 100) / 100;
}

/** Normalize domain/host the same way as routes/links.js */
export function normalizeDomain(domain) {
  if (!domain) return null;
  return String(domain)
    .replace(/^https?:\/\//i, '')
    .replace(/\/+$/, '')
    .toLowerCase()
    .split('/')[0]
    .replace(/^www\./, '');
}

/** Extract hostname from a URL (or bare host), without www. */
export function extractHostFromUrl(url) {
  if (!url) return null;
  try {
    const raw = String(url).trim();
    const withProto = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;
    return new URL(withProto).hostname.replace(/^www\./, '').toLowerCase();
  } catch {
    return normalizeDomain(url);
  }
}

/**
 * Resolve commission % for a link using optional preloaded websites.
 * Site override wins when set; otherwise falls back to affiliate global %.
 */
export function resolveCommissionPercentWithSites(affiliate, link, websites = []) {
  const global = parseCommissionPercent(affiliate?.affiliate_commission_percent);
  const host = extractHostFromUrl(link?.original_url);
  if (!host || !Array.isArray(websites) || websites.length === 0) return global;

  for (const site of websites) {
    const siteHost = normalizeDomain(site.domain);
    if (!siteHost || siteHost !== host) continue;
    const sitePct = parseCommissionPercent(site.commission_percent);
    if (sitePct != null) return sitePct;
  }
  return global;
}

/**
 * Resolve commission % for a link by loading the affiliate's websites.
 */
export async function resolveCommissionPercentForLink(affiliate, link, options = {}) {
  if (!affiliate?.id) {
    return parseCommissionPercent(affiliate?.affiliate_commission_percent);
  }

  const websites = options.websites || await Website.findAll({
    where: { user_id: affiliate.id },
    attributes: ['domain', 'commission_percent'],
    raw: true,
    transaction: options.transaction
  });

  return resolveCommissionPercentWithSites(affiliate, link, websites);
}

/** Group website rows by user_id for batch commission resolution. */
export function groupWebsitesByUserId(websiteRows = []) {
  const map = new Map();
  for (const row of websiteRows) {
    const uid = Number(row.user_id);
    if (!map.has(uid)) map.set(uid, []);
    map.get(uid).push(row);
  }
  return map;
}

/** Lead/sale conversions that can earn affiliate commission. */
export function isAffiliatePayoutEvent(eventType) {
  return eventType === 'lead' || eventType === 'sale' || eventType == null;
}

/**
 * Credit affiliate balance atomically.
 * @returns {Promise<number>} new balance
 */
export async function creditAffiliateBalance(userId, amount, transaction) {
  const add = parseFloat(amount);
  if (!Number.isFinite(add) || add <= 0) return null;

  const user = await User.findByPk(userId, {
    transaction,
    lock: transaction?.LOCK?.UPDATE
  });
  if (!user || !isAffiliateUser(user)) return null;

  const current = parseFloat(user.affiliate_balance || 0);
  const next = Math.round((current + add) * 100) / 100;
  user.affiliate_balance = next;
  await user.save({ transaction });
  return next;
}

/** Load link owner if affiliate with commission configured (global or per-site). */
export async function getAffiliateOwnerForLink(link, transaction) {
  if (!link?.user_id) return null;
  const user = await User.findByPk(link.user_id, {
    attributes: ['id', 'role', 'affiliate_commission_percent', 'affiliate_balance'],
    transaction
  });
  if (!isAffiliateUser(user)) return null;
  const percent = await resolveCommissionPercentForLink(user, link, { transaction });
  if (percent == null) return null;
  return { user, percent };
}

/**
 * After conversion create/upgrade: mark pending for admin approval (leads & sales).
 * Balance is credited only when admin approves.
 */
export async function applyAffiliateConversionEffects(conversion, link, eventType, transaction) {
  const affiliate = await getAffiliateOwnerForLink(link, transaction);
  if (!affiliate) return conversion;

  if (!isAffiliatePayoutEvent(eventType)) {
    return conversion;
  }

  // Already moderated — keep status (approved = already paid, rejected = denied)
  if (conversion.lead_status === 'approved' || conversion.lead_status === 'rejected') {
    await conversion.save({ transaction });
    return conversion;
  }

  conversion.lead_status = 'pending';
  await conversion.save({ transaction });
  return conversion;
}
