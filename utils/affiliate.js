/**
 * Affiliate commission and balance helpers.
 */
import sequelize from '../config/database.js';
import { User } from '../models/index.js';

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

/** Load link owner if affiliate with commission configured. */
export async function getAffiliateOwnerForLink(link, transaction) {
  if (!link?.user_id) return null;
  const user = await User.findByPk(link.user_id, {
    attributes: ['id', 'role', 'affiliate_commission_percent', 'affiliate_balance'],
    transaction
  });
  if (!isAffiliateUser(user)) return null;
  const percent = parseCommissionPercent(user.affiliate_commission_percent);
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
