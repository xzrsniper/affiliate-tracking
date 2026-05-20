/**
 * A/B split-test: random exploration (45–55 clicks) then auto winner by sales/revenue.
 */
import { Op, QueryTypes } from 'sequelize';
import sequelize from '../config/database.js';
import { Link, LinkVariant, Click } from '../models/index.js';

export function randomExplorationLimit() {
  return 45 + Math.floor(Math.random() * 11); // 45–55 inclusive
}

export async function loadActiveVariants(linkId) {
  return LinkVariant.findAll({
    where: { link_id: linkId, is_active: true },
    order: [['sort_order', 'ASC'], ['id', 'ASC']]
  });
}

async function getVariantStats(linkId) {
  const rows = await sequelize.query(
    `
    SELECT
      v.id,
      v.label,
      v.destination_url,
      v.sort_order,
      v.is_active,
      COUNT(DISTINCT c.id) AS clicks,
      COUNT(DISTINCT CASE WHEN conv.event_type = 'sale' OR conv.event_type IS NULL THEN conv.id END) AS sales,
      COALESCE(SUM(CASE WHEN conv.event_type = 'sale' OR conv.event_type IS NULL THEN conv.order_value ELSE 0 END), 0) AS revenue
    FROM link_variants v
    LEFT JOIN clicks c ON c.variant_id = v.id AND c.link_id = v.link_id
    LEFT JOIN conversions conv ON conv.click_id = c.id
    WHERE v.link_id = ?
    GROUP BY v.id, v.label, v.destination_url, v.sort_order, v.is_active
    ORDER BY v.sort_order ASC, v.id ASC
    `,
    { replacements: [linkId], type: QueryTypes.SELECT }
  );
  return rows.map((r) => ({
    id: Number(r.id),
    label: r.label,
    destination_url: r.destination_url,
    sort_order: r.sort_order,
    is_active: Boolean(r.is_active),
    clicks: parseInt(r.clicks || 0, 10),
    sales: parseInt(r.sales || 0, 10),
    revenue: parseFloat(r.revenue || 0)
  }));
}

/** Pick winner: most sales, then revenue, then clicks. */
function pickWinnerFromStats(stats) {
  const active = stats.filter((s) => s.is_active);
  if (active.length === 0) return null;
  const sorted = [...active].sort((a, b) => {
    if (b.sales !== a.sales) return b.sales - a.sales;
    if (b.revenue !== a.revenue) return b.revenue - a.revenue;
    return b.clicks - a.clicks;
  });
  return sorted[0];
}

export async function finalizeSplitWinner(link) {
  if (!link.split_enabled || link.split_phase === 'completed') {
    return link.split_winner_variant_id;
  }

  const stats = await getVariantStats(link.id);
  const winner = pickWinnerFromStats(stats);
  if (!winner) return null;

  link.split_phase = 'completed';
  link.split_winner_variant_id = winner.id;
  link.original_url = winner.destination_url;
  await link.save();

  return winner.id;
}

/**
 * Resolve destination URL + variant for redirect.
 * @param {import('../models/Link.js').default} link
 */
export async function resolveSplitDestination(link) {
  if (!link.split_enabled) {
    return { destinationUrl: link.original_url, variantId: null, phase: null };
  }

  const variants = await loadActiveVariants(link.id);
  if (variants.length < 2) {
    return { destinationUrl: link.original_url, variantId: null, phase: link.split_phase };
  }

  if (link.split_phase === 'completed' && link.split_winner_variant_id) {
    const winner =
      variants.find((v) => v.id === link.split_winner_variant_id) ||
      (await LinkVariant.findByPk(link.split_winner_variant_id));
    if (winner) {
      return {
        destinationUrl: winner.destination_url,
        variantId: winner.id,
        phase: 'completed',
        winnerLabel: winner.label
      };
    }
  }

  const priorClicks = await Click.count({ where: { link_id: link.id } });
  const limit = link.split_exploration_limit || 50;

  if (priorClicks >= limit) {
    await finalizeSplitWinner(link);
    await link.reload();
    const winner = variants.find((v) => v.id === link.split_winner_variant_id) ||
      (await LinkVariant.findByPk(link.split_winner_variant_id));
    if (winner) {
      return {
        destinationUrl: winner.destination_url,
        variantId: winner.id,
        phase: 'completed',
        winnerLabel: winner.label
      };
    }
  }

  const idx = Math.floor(Math.random() * variants.length);
  const chosen = variants[idx];
  return {
    destinationUrl: chosen.destination_url,
    variantId: chosen.id,
    phase: 'exploring',
    explorationRemaining: Math.max(0, limit - priorClicks)
  };
}

export async function getSplitStatsForLink(linkId, userId) {
  const link = await Link.findOne({ where: { id: linkId, user_id: userId } });
  if (!link) return null;

  const variants = await getVariantStats(linkId);
  const winner = variants.find((v) => v.id === link.split_winner_variant_id) || null;
  const totalClicks = await Click.count({ where: { link_id: linkId } });

  return {
    split_enabled: Boolean(link.split_enabled),
    split_phase: link.split_phase,
    split_exploration_limit: link.split_exploration_limit,
    split_winner_variant_id: link.split_winner_variant_id,
    exploration_clicks_used: totalClicks,
    winner,
    variants
  };
}

export { getVariantStats };
