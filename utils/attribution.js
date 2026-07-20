import { Op } from 'sequelize';

/** How long a click stays attributable to an affiliate (calendar days). */
export const ATTRIBUTION_WINDOW_DAYS = 14;

export const ATTRIBUTION_WINDOW_MS = ATTRIBUTION_WINDOW_DAYS * 24 * 60 * 60 * 1000;

export function attributionCutoffDate(now = new Date()) {
  return new Date(now.getTime() - ATTRIBUTION_WINDOW_MS);
}

export function isWithinAttributionWindow(createdAt, now = new Date()) {
  if (!createdAt) return false;
  const t = new Date(createdAt).getTime();
  if (!Number.isFinite(t)) return false;
  return t >= attributionCutoffDate(now).getTime();
}

/**
 * Resolve a click that is still inside the attribution window.
 *
 * Priority:
 * 1) explicit click_id (must be ≤ 14 days old)
 * 2) last click for link + visitor fingerprint within window
 * 3) optional: last click for link within window (cookie-only paths)
 *
 * Returns null when the visitor/click is "forgotten" (> 14 days).
 */
export async function resolveAttributionClick(Click, {
  clickId = null,
  linkId = null,
  visitorFingerprint = null,
  allowAnyRecentLinkClick = false,
  transaction = null
} = {}) {
  const cutoff = attributionCutoffDate();
  const opts = transaction ? { transaction } : {};

  const cid = clickId != null ? parseInt(clickId, 10) : NaN;
  if (Number.isFinite(cid) && cid > 0) {
    const byId = await Click.findByPk(cid, {
      attributes: ['id', 'link_id', 'visitor_fingerprint', 'created_at'],
      ...opts
    });
    if (byId && isWithinAttributionWindow(byId.created_at)) {
      if (linkId == null || Number(byId.link_id) === Number(linkId)) {
        return byId;
      }
    }
    // Explicit click_id that is missing or older than 14 days → forgotten
    return null;
  }

  if (!linkId) return null;

  if (visitorFingerprint) {
    const byFp = await Click.findOne({
      where: {
        link_id: linkId,
        visitor_fingerprint: visitorFingerprint,
        created_at: { [Op.gte]: cutoff }
      },
      attributes: ['id', 'link_id', 'visitor_fingerprint', 'created_at'],
      order: [['created_at', 'DESC']],
      ...opts
    });
    if (byFp) return byFp;
  }

  if (!allowAnyRecentLinkClick) return null;

  return Click.findOne({
    where: {
      link_id: linkId,
      created_at: { [Op.gte]: cutoff }
    },
    attributes: ['id', 'link_id', 'visitor_fingerprint', 'created_at'],
    order: [['created_at', 'DESC']],
    ...opts
  });
}
