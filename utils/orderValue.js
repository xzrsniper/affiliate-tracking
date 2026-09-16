/** Shared order-value parsing for conversion endpoints and lead sanitization. */

export const LEAD_MAX_REASONABLE = 50000;
export const ORDER_VALUE_HARD_MAX = 10000000;

function roundMoney(value) {
  return Math.round(Number(value) * 100) / 100;
}

/**
 * Parse a price from pixel/GTM/query input without gluing several numbers together.
 * "516 грн 1 200 відгуків" → 516, not 5161200.
 */
export function parseOrderValue(raw) {
  if (raw === undefined || raw === null || raw === '') return 0;
  if (typeof raw === 'number') {
    if (!Number.isFinite(raw) || raw <= 0) return 0;
    if (raw > ORDER_VALUE_HARD_MAX) return 0;
    return roundMoney(raw);
  }

  const text = String(raw).trim();
  if (!text) return 0;

  const currencyFirst = text.match(
    /((\d{1,3}(?:[ \u00a0]\d{3})+|\d+)(?:[.,]\d{1,2})?)\s*(?:грн|uah|₴|\$|€|usd|eur)/i
  );
  const currencyAfter = currencyFirst
    ? null
    : text.match(/(?:грн|uah|₴|\$|€|usd|eur)\s*((\d{1,3}(?:[ \u00a0]\d{3})+|\d+)(?:[.,]\d{1,2})?)/i);

  const token = currencyFirst
    ? currencyFirst[1]
    : currencyAfter
      ? currencyAfter[1]
      : null;

  if (token) {
    const v = parseNumericToken(token);
    return v > 0 && v <= ORDER_VALUE_HARD_MAX ? v : 0;
  }

  let cleaned = text.replace(/[^\d.,-]/g, '');
  if (/^\d+,\d{1,2}$/.test(cleaned)) {
    cleaned = cleaned.replace(',', '.');
  } else {
    cleaned = cleaned.replace(/,/g, '');
  }
  cleaned = cleaned.replace(/^-/, '');

  const v = parseFloat(cleaned) || 0;
  if (v < 0 || v > ORDER_VALUE_HARD_MAX) return 0;
  return v;
}

function parseNumericToken(token) {
  let s = String(token).replace(/[\s\u00a0]/g, '');
  if (/^\d+,\d{1,2}$/.test(s)) s = s.replace(',', '.');
  else s = s.replace(/,/g, '');
  const v = parseFloat(s);
  return Number.isFinite(v) && v > 0 ? roundMoney(v) : 0;
}

/**
 * Pixel sometimes concatenates a real price with a nearby number
 * ("516 грн" + "1 200" → 5161200). Recover a plausible amount instead of storing 0.
 */
export function recoverInflatedLeadValue(value, max = LEAD_MAX_REASONABLE) {
  const n = Number(value);
  if (!Number.isFinite(n) || n <= 0) return 0;
  if (n <= max) return roundMoney(n);

  const digits = String(Math.trunc(Math.abs(n)));

  // 7 digits: typically 3-digit UAH price + 4-digit neighbour (516 + 1200).
  if (digits.length === 7) {
    const prefix3 = parseInt(digits.slice(0, 3), 10);
    if (prefix3 >= 20 && prefix3 <= max) return prefix3;
  }

  // 8 digits: 4-digit price + 4-digit neighbour.
  if (digits.length === 8) {
    const prefix4 = parseInt(digits.slice(0, 4), 10);
    if (prefix4 >= 100 && prefix4 <= max) return prefix4;
  }

  // Minor units (516.12 stored as 5161200).
  if (digits.length >= 7) {
    for (const div of [10000, 100, 1000]) {
      const recovered = n / div;
      if (recovered >= 10 && recovered <= max) return roundMoney(recovered);
    }
  }

  return 0;
}

export function sanitizeLeadOrderValue(value) {
  const parsed = typeof value === 'number' ? value : parseOrderValue(value);
  if (parsed <= 0) return 0;
  if (parsed <= LEAD_MAX_REASONABLE) return roundMoney(parsed);
  return recoverInflatedLeadValue(parsed);
}
