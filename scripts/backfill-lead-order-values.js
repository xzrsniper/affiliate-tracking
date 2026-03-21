/**
 * One-time: set order_value on past lead rows that are still 0, using the same
 * logic as POST /api/track/conversion (static_price / last sale).
 *
 * Usage:
 *   node scripts/backfill-lead-order-values.js           # apply
 *   node scripts/backfill-lead-order-values.js --dry-run
 */
import dotenv from 'dotenv';
dotenv.config();
import '../models/index.js';
import { Conversion, Link } from '../models/index.js';
import { Op } from 'sequelize';
import { resolveLeadOrderValueFallback } from '../utils/leadOrderValueFallback.js';

const dryRun = process.argv.includes('--dry-run');

async function main() {
  const plain = await Conversion.findAll({
    where: {
      event_type: 'lead',
      [Op.or]: [{ order_value: 0 }, { order_value: null }]
    },
    order: [['created_at', 'ASC']]
  });

  let updated = 0;
  for (const conv of plain) {
    const link = await Link.findByPk(conv.link_id);
    if (!link) continue;

    const resolved = await resolveLeadOrderValueFallback(link, null);
    if (!resolved) {
      console.log(`skip id=${conv.id} link=${link.id} — no fallback`);
      continue;
    }

    console.log(
      `${dryRun ? '[dry-run] ' : ''}id=${conv.id} link=${link.id} → ${resolved.value} (${resolved.source})`
    );
    if (!dryRun) {
      await conv.update({ order_value: resolved.value });
    }
    updated++;
  }

  console.log(dryRun ? `Would update ${updated} row(s).` : `Updated ${updated} row(s).`);
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
