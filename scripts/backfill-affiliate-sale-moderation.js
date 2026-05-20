/**
 * Mark existing affiliate sales (already auto-credited before manual approval)
 * as approved so they are not shown as pending or double-credited.
 *
 * Run once: node scripts/backfill-affiliate-sale-moderation.js
 */
import sequelize from '../config/database.js';

async function run() {
  console.log('Backfilling affiliate sale moderation status...');

  const [result] = await sequelize.query(`
    UPDATE conversions c
    INNER JOIN links l ON l.id = c.link_id
    INNER JOIN users u ON u.id = l.user_id
    SET c.lead_status = 'approved'
    WHERE u.role = 'affiliate'
      AND (c.event_type = 'sale' OR c.event_type IS NULL)
      AND c.lead_status IS NULL
  `);
  console.log('  Existing affiliate sales marked approved:', result?.affectedRows ?? result);

  console.log('Done.');
  await sequelize.close();
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
