/**
 * Traffic Quality Score (0–100) for a tracking link.
 * Plain-language reasons for partners; higher = more like real visitors.
 */

const MIN_CLICKS_FOR_SCORE = 20;

/**
 * @param {object} input
 * @param {number} input.totalClicks
 * @param {number} input.uniqueClicks
 * @param {number} input.measuredSessions
 * @param {number} input.avgSessionSeconds
 * @param {number} input.bounceRate 0–100
 * @param {number} input.carts
 * @param {number} input.leads
 * @param {number} input.sales
 * @param {number} [input.topIpShare] 0–1 share of clicks from the single busiest IP
 * @returns {{ score: number|null, band: 'good'|'mixed'|'poor'|'na', reasons: string[] }}
 */
export function computeTrafficQualityScore(input) {
  const totalClicks = Number(input.totalClicks || 0);
  const uniqueClicks = Number(input.uniqueClicks || 0);
  const measuredSessions = Number(input.measuredSessions || 0);
  const avgSessionSeconds = Number(input.avgSessionSeconds || 0);
  const bounceRate = Number(input.bounceRate || 0);
  const carts = Number(input.carts || 0);
  const leads = Number(input.leads || 0);
  const sales = Number(input.sales || 0);
  const topIpShare = Number(input.topIpShare || 0);

  if (totalClicks < MIN_CLICKS_FOR_SCORE) {
    return {
      score: null,
      band: 'na',
      reasons: ['Поки мало переходів для оцінки']
    };
  }

  let score = 100;
  const reasons = [];

  const uniqueRatio = totalClicks > 0 ? uniqueClicks / totalClicks : 1;
  if (uniqueRatio < 0.35) {
    score -= 18;
    reasons.push('Багато повторних кліків з одних і тих же відвідувачів');
  } else if (uniqueRatio < 0.55) {
    score -= 8;
    reasons.push('Чимало повторних переходів');
  }

  if (topIpShare >= 0.35) {
    score -= 22;
    reasons.push('Дуже багато кліків з однієї IP-адреси');
  } else if (topIpShare >= 0.2) {
    score -= 12;
    reasons.push('Помітна частка кліків з однієї IP');
  }

  if (measuredSessions >= 10) {
    if (bounceRate >= 75) {
      score -= 16;
      reasons.push('Люди майже одразу йдуть зі сторінки');
    } else if (bounceRate >= 55) {
      score -= 8;
      reasons.push('Високий відсоток швидких відходів');
    }

    if (avgSessionSeconds > 0 && avgSessionSeconds < 5) {
      score -= 12;
      reasons.push('Середній час на сайті дуже малий');
    } else if (avgSessionSeconds > 0 && avgSessionSeconds < 12) {
      score -= 5;
      reasons.push('Короткий середній час на сайті');
    }
  }

  const conversions = carts + leads + sales;
  if (totalClicks >= 40 && conversions === 0) {
    score -= 10;
    reasons.push('Є переходи, але майже немає дій (кошик / лід / покупка)');
  }

  score = Math.max(0, Math.min(100, Math.round(score)));

  let band = 'good';
  if (score < 50) band = 'poor';
  else if (score < 80) band = 'mixed';

  return {
    score,
    band,
    reasons: reasons.slice(0, 3)
  };
}

/**
 * Build top-IP share map from rows: { link_id, ip_address, cnt }
 * @param {Array<{link_id:number, ip_address?:string, cnt:number}>} rows
 * @param {Map<number, number>} totalsByLink total clicks per link
 * @returns {Map<number, number>} linkId -> 0..1
 */
export function buildTopIpShareByLink(rows, totalsByLink) {
  const maxByLink = new Map();
  for (const row of rows || []) {
    const linkId = Number(row.link_id);
    const cnt = Number(row.cnt || 0);
    if (!linkId || cnt <= 0) continue;
    const prev = maxByLink.get(linkId) || 0;
    if (cnt > prev) maxByLink.set(linkId, cnt);
  }

  const share = new Map();
  for (const [linkId, maxCnt] of maxByLink.entries()) {
    const total = Number(totalsByLink.get(linkId) || 0);
    share.set(linkId, total > 0 ? maxCnt / total : 0);
  }
  return share;
}
