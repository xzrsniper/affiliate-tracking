/**
 * Shared rules for report / dashboard / affiliate stats.
 * Cart is a funnel event, not a conversion payout event.
 */

export function isCartEvent(eventType) {
  return eventType === 'cart';
}

/** Lead, sale, or legacy null (treated as sale). */
export function isConversionEvent(eventType) {
  return eventType === 'lead' || eventType === 'sale' || eventType == null;
}

export function isSaleEvent(eventType) {
  return eventType === 'sale' || eventType == null;
}

export function isLeadEvent(eventType) {
  return eventType === 'lead';
}

/** Waiting for affiliate moderation (legacy null counted as pending). */
export function isPendingModerationStatus(leadStatus) {
  return leadStatus === 'pending' || leadStatus == null;
}

export function isApprovedModerationStatus(leadStatus) {
  return leadStatus === 'approved';
}

/**
 * SQL fragment helpers for conversions aggregations.
 * Keep dashboard / impersonate / admin user stats aligned.
 */
export const conversionSql = {
  /** sales + leads (+ legacy null), excluding cart */
  conversionsCount: `SUM(CASE WHEN event_type IN ('lead', 'sale') OR event_type IS NULL THEN 1 ELSE 0 END)`,
  salesCount: `SUM(CASE WHEN event_type = 'sale' OR event_type IS NULL THEN 1 ELSE 0 END)`,
  leadCount: `SUM(CASE WHEN event_type = 'lead' THEN 1 ELSE 0 END)`,
  cartCount: `SUM(CASE WHEN event_type = 'cart' THEN 1 ELSE 0 END)`,
  /** Revenue excluding cart */
  conversionRevenue: `COALESCE(SUM(CASE WHEN event_type IN ('lead', 'sale') OR event_type IS NULL THEN order_value ELSE 0 END), 0)`,
  salesRevenue: `COALESCE(SUM(CASE WHEN event_type = 'sale' OR event_type IS NULL THEN order_value ELSE 0 END), 0)`,
  leadRevenue: `COALESCE(SUM(CASE WHEN event_type = 'lead' THEN order_value ELSE 0 END), 0)`,
  cartRevenue: `COALESCE(SUM(CASE WHEN event_type = 'cart' THEN order_value ELSE 0 END), 0)`,
  approvedLeadRevenue: `COALESCE(SUM(CASE WHEN event_type = 'lead' AND lead_status = 'approved' THEN order_value ELSE 0 END), 0)`,
  approvedSaleRevenue: `COALESCE(SUM(CASE WHEN (event_type = 'sale' OR event_type IS NULL) AND lead_status = 'approved' THEN order_value ELSE 0 END), 0)`,
  pendingLeads: `SUM(CASE WHEN event_type = 'lead' AND (lead_status = 'pending' OR lead_status IS NULL) THEN 1 ELSE 0 END)`,
  pendingSales: `SUM(CASE WHEN (event_type = 'sale' OR event_type IS NULL) AND lead_status = 'pending' THEN 1 ELSE 0 END)`
};
