/**
 * Adds affiliate role, commission %, balance on users; lead_status on conversions.
 * Run: node scripts/add-affiliate-system.js
 */
import sequelize from '../config/database.js';

async function columnExists(table, column) {
  const [rows] = await sequelize.query(
    `SELECT COUNT(*) AS c FROM information_schema.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = ?`,
    { replacements: [table, column] }
  );
  return Number(rows[0]?.c || 0) > 0;
}

async function run() {
  console.log('Adding affiliate system columns...');

  const [roleCol] = await sequelize.query(
    `SELECT COLUMN_TYPE FROM information_schema.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'users' AND COLUMN_NAME = 'role'`
  );
  const roleType = roleCol[0]?.COLUMN_TYPE || '';
  if (!roleType.includes('affiliate')) {
    await sequelize.query(`
      ALTER TABLE users
      MODIFY COLUMN role ENUM('user', 'super_admin', 'affiliate') NOT NULL DEFAULT 'user'
    `);
    console.log('  users.role: added affiliate');
  } else {
    console.log('  users.role: affiliate already present');
  }

  if (!(await columnExists('users', 'affiliate_commission_percent'))) {
    await sequelize.query(`
      ALTER TABLE users
      ADD COLUMN affiliate_commission_percent DECIMAL(5,2) NULL DEFAULT NULL
      COMMENT 'Commission % for affiliate role' AFTER role
    `);
    console.log('  users.affiliate_commission_percent: added');
  }

  if (!(await columnExists('users', 'affiliate_balance'))) {
    await sequelize.query(`
      ALTER TABLE users
      ADD COLUMN affiliate_balance DECIMAL(12,2) NOT NULL DEFAULT 0.00
      COMMENT 'Affiliate wallet balance' AFTER affiliate_commission_percent
    `);
    console.log('  users.affiliate_balance: added');
  }

  if (!(await columnExists('conversions', 'lead_status'))) {
    await sequelize.query(`
      ALTER TABLE conversions
      ADD COLUMN lead_status ENUM('pending', 'approved', 'rejected') NULL DEFAULT NULL
      COMMENT 'Moderation for affiliate leads only' AFTER event_type
    `);
    console.log('  conversions.lead_status: added');
  }

  const [backfill] = await sequelize.query(`
    UPDATE conversions c
    INNER JOIN links l ON l.id = c.link_id
    INNER JOIN users u ON u.id = l.user_id
    SET c.lead_status = 'pending'
    WHERE c.event_type = 'lead'
      AND u.role = 'affiliate'
      AND c.lead_status IS NULL
  `);
  console.log('  Backfilled pending lead_status for existing affiliate leads:', backfill?.affectedRows ?? backfill);

  console.log('Done.');
  await sequelize.close();
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
