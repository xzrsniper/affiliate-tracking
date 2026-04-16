/**
 * Застосовує ручну корекцію доходу (наприклад, через дублікати конверсій).
 * Корекція розподіляється пропорційно між продажами, лідами та «іншим» (кошик тощо),
 * щоб збігалося з агрегатами SQL (total = sales + lead + решта).
 */
export function applyRevenueAdjustment(rawTotal, rawSales, rawLead, adjustment, totalSalesCount = 0) {
  const adj = Number(adjustment) || 0;
  const r = Number(rawTotal) || 0;
  const s = Number(rawSales) || 0;
  const l = Number(rawLead) || 0;
  const rest = Math.max(0, r - s - l);
  const newTotal = Math.max(0, r + adj);

  let newSales = s;
  let newLead = l;
  let newRest = rest;

  if (r > 0) {
    newSales = Math.max(0, s + adj * (s / r));
    newLead = Math.max(0, l + adj * (l / r));
    newRest = Math.max(0, rest + adj * (rest / r));
  } else if (adj !== 0) {
    newSales = Math.max(0, s + adj);
  }

  newSales = parseFloat(newSales.toFixed(2));
  newLead = parseFloat(newLead.toFixed(2));
  newRest = parseFloat(newRest.toFixed(2));
  const target = parseFloat(newTotal.toFixed(2));
  let sum = newSales + newLead + newRest;
  if (Math.abs(sum - target) > 0.02) {
    const diff = parseFloat((target - sum).toFixed(2));
    if (newSales >= newLead && newSales >= newRest) {
      newSales = parseFloat((newSales + diff).toFixed(2));
    } else if (newLead >= newRest) {
      newLead = parseFloat((newLead + diff).toFixed(2));
    } else {
      newRest = parseFloat((newRest + diff).toFixed(2));
    }
  }

  const ts = Number(totalSalesCount) || 0;
  const averageCheck = ts > 0 ? newSales / ts : 0;

  return {
    total_revenue: target,
    sales_revenue: newSales,
    lead_revenue: newLead,
    average_check: parseFloat(averageCheck.toFixed(2))
  };
}
