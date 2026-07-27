/**
 * Shared conversion create/merge helpers.
 * Ensures lead→sale upgrades, order_id dedup, and no double rows after approve.
 */
import { Conversion } from '../models/index.js';
import { Op, QueryTypes } from 'sequelize';
import { applyAffiliateConversionEffects, getAffiliateOwnerForLink } from './affiliate.js';

function clickIdNumber(attributedClick, clickIdRaw) {
  const fromClick = attributedClick?.id ? Number(attributedClick.id) : null;
  if (Number.isFinite(fromClick) && fromClick > 0) return fromClick;
  const parsed = clickIdRaw ? parseInt(clickIdRaw, 10) : null;
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

function buildMatchOrClauses({ normalizedOrderId, originalOrderId, clickIdNum }) {
  const orClauses = [];
  if (normalizedOrderId) {
    orClauses.push({ order_id: normalizedOrderId });
    if (originalOrderId && originalOrderId !== normalizedOrderId) {
      orClauses.push({ order_id: originalOrderId });
    }
  }
  if (clickIdNum) {
    orClauses.push({ click_id: clickIdNum });
  }
  return orClauses;
}

async function bumpOrderValue(conversion, parsedOrderValue, originalOrderId, clickIdNum, transaction) {
  let dirty = false;
  const nextVal = Math.max(Number(conversion.order_value || 0), Number(parsedOrderValue || 0));
  if (nextVal !== Number(conversion.order_value || 0)) {
    conversion.order_value = nextVal;
    dirty = true;
  }
  if (originalOrderId && conversion.order_id !== originalOrderId) {
    conversion.order_id = originalOrderId;
    dirty = true;
  }
  if (clickIdNum && Number(conversion.click_id) !== clickIdNum) {
    conversion.click_id = clickIdNum;
    dirty = true;
  }
  if (dirty) {
    await conversion.save({ transaction });
  }
  return conversion;
}

/**
 * Upgrade a lead row to sale (or merge into an existing sale) inside a transaction.
 */
export async function upgradeOrMergeSale({
  link,
  attributedClick,
  clickIdRaw = null,
  parsedOrderValue = 0,
  originalOrderId = null,
  normalizedOrderId = null,
  transaction
}) {
  const clickIdNum = clickIdNumber(attributedClick, clickIdRaw);
  const orClauses = buildMatchOrClauses({ normalizedOrderId, originalOrderId, clickIdNum });
  if (!orClauses.length) return null;

  const leadToUpgrade = await Conversion.findOne({
    where: {
      link_id: link.id,
      event_type: 'lead',
      [Op.or]: orClauses
    },
    transaction,
    lock: transaction.LOCK.UPDATE,
    order: [['created_at', 'DESC']]
  });

  if (leadToUpgrade) {
    leadToUpgrade.event_type = 'sale';
    await bumpOrderValue(leadToUpgrade, parsedOrderValue, originalOrderId, clickIdNum, transaction);
    await applyAffiliateConversionEffects(leadToUpgrade, link, 'sale', transaction);
    return leadToUpgrade;
  }

  // Existing sale (e.g. admin already approved lead→sale) — merge, never create a 2nd payout row
  const existingSale = await Conversion.findOne({
    where: {
      link_id: link.id,
      [Op.and]: [
        { [Op.or]: [{ event_type: 'sale' }, { event_type: null }] },
        { [Op.or]: orClauses }
      ]
    },
    transaction,
    lock: transaction.LOCK.UPDATE,
    order: [['created_at', 'DESC']]
  });

  if (existingSale) {
    await bumpOrderValue(existingSale, parsedOrderValue, originalOrderId, clickIdNum, transaction);
    await applyAffiliateConversionEffects(existingSale, link, 'sale', transaction);
    return existingSale;
  }

  return null;
}

/**
 * Record cart/lead/sale with dedup + lead→sale upgrade.
 * Must be called inside an open Sequelize transaction.
 */
export async function recordAttributedConversion({
  link,
  attributedClick,
  eventType,
  parsedOrderValue = 0,
  originalOrderId = null,
  normalizedOrderId = null,
  clickIdRaw = null,
  transaction
}) {
  const clickIdNum = clickIdNumber(attributedClick, clickIdRaw);
  const sequelize = transaction.sequelize;

  if (normalizedOrderId) {
    const lockQuery = `
      SELECT id FROM conversions
      WHERE link_id = ?
        AND (order_id = ? ${originalOrderId && originalOrderId !== normalizedOrderId ? 'OR order_id = ?' : ''})
      ORDER BY created_at DESC
      LIMIT 1
      FOR UPDATE
    `;
    const lockParams = originalOrderId && originalOrderId !== normalizedOrderId
      ? [link.id, normalizedOrderId, originalOrderId]
      : [link.id, normalizedOrderId];

    const lockResults = await sequelize.query(lockQuery, {
      replacements: lockParams,
      type: QueryTypes.SELECT,
      transaction
    });

    if (lockResults?.length) {
      const existing = await Conversion.findByPk(lockResults[0].id, {
        transaction,
        lock: transaction.LOCK.UPDATE
      });
      if (existing) {
        if (eventType === 'sale' && existing.event_type === 'lead') {
          existing.event_type = 'sale';
          await bumpOrderValue(existing, parsedOrderValue, originalOrderId, clickIdNum, transaction);
          await applyAffiliateConversionEffects(existing, link, 'sale', transaction);
          return { conversion: existing, merged: true, upgraded: true };
        }
        if (eventType === 'sale' && (existing.event_type === 'sale' || existing.event_type == null)) {
          await bumpOrderValue(existing, parsedOrderValue, originalOrderId, clickIdNum, transaction);
          return { conversion: existing, merged: true, duplicate: true };
        }
        if (eventType === 'lead' && (existing.event_type === 'sale' || existing.event_type == null)) {
          return { conversion: existing, merged: true, duplicate: true };
        }
        if (eventType === existing.event_type) {
          await bumpOrderValue(existing, parsedOrderValue, originalOrderId, clickIdNum, transaction);
          return { conversion: existing, merged: true, duplicate: true };
        }
      }
    }
  } else {
    const dedupSeconds = eventType === 'lead' ? 60 : 3;
    const recentResults = await sequelize.query(`
      SELECT id FROM conversions
      WHERE link_id = ?
        AND event_type = ?
        AND created_at >= DATE_SUB(NOW(), INTERVAL ? SECOND)
      ORDER BY created_at DESC
      LIMIT 1
      FOR UPDATE
    `, {
      replacements: [link.id, eventType, dedupSeconds],
      type: QueryTypes.SELECT,
      transaction
    });

    if (recentResults?.length) {
      const recent = await Conversion.findByPk(recentResults[0].id, {
        transaction,
        lock: transaction.LOCK.UPDATE
      });
      if (recent) {
        return { conversion: recent, merged: true, duplicate: true };
      }
    }
  }

  if (eventType === 'sale') {
    const merged = await upgradeOrMergeSale({
      link,
      attributedClick,
      clickIdRaw,
      parsedOrderValue,
      originalOrderId,
      normalizedOrderId,
      transaction
    });
    if (merged) {
      return { conversion: merged, merged: true, upgraded: true };
    }
  }

  const conversionData = {
    link_id: link.id,
    order_value: parsedOrderValue,
    event_type: eventType
  };

  if (eventType === 'lead' || eventType === 'sale') {
    const affiliateOwner = await getAffiliateOwnerForLink(link, transaction);
    if (affiliateOwner) {
      conversionData.lead_status = 'pending';
    }
  }

  if (originalOrderId) conversionData.order_id = originalOrderId;
  if (clickIdNum) conversionData.click_id = clickIdNum;

  try {
    const created = await Conversion.create(conversionData, { transaction });
    await applyAffiliateConversionEffects(created, link, eventType, transaction);
    return { conversion: created, merged: false };
  } catch (createError) {
    const msg = createError.message || '';
    if (msg.includes('order_id') || msg.includes('event_type') || msg.includes('lead_status')) {
      delete conversionData.order_id;
      if (msg.includes('lead_status')) delete conversionData.lead_status;
      try {
        const created = await Conversion.create(conversionData, { transaction });
        await applyAffiliateConversionEffects(created, link, eventType, transaction);
        return { conversion: created, merged: false };
      } catch (e2) {
        if (e2.message && String(e2.message).includes('event_type')) {
          delete conversionData.event_type;
          const created = await Conversion.create(conversionData, { transaction });
          await applyAffiliateConversionEffects(created, link, eventType, transaction);
          return { conversion: created, merged: false };
        }
        throw e2;
      }
    }
    throw createError;
  }
}
