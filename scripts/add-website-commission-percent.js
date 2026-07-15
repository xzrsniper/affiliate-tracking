/**
 * Migration: add commission_percent to websites table
 * Run once: node scripts/add-website-commission-percent.js
 */
import sequelize from '../config/database.js';

async function run() {
  try {
    await sequelize.authenticate();
    console.log('DB connected');

    const [rows] = await sequelize.query(`
      SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME = 'websites'
        AND COLUMN_NAME = 'commission_percent'
    `);

    if (rows.length > 0) {
      console.log('Column commission_percent already exists on websites — skipping.');
      process.exit(0);
    }

    await sequelize.query(`
      ALTER TABLE websites
      ADD COLUMN commission_percent DECIMAL(5,2) NULL DEFAULT NULL
        COMMENT 'Per-site affiliate commission override; NULL = use global user commission'
        AFTER cart_button_selector
    `);

    console.log('✅ Column commission_percent added to websites.');
    process.exit(0);
  } catch (err) {
    console.error('Migration failed:', err);
    process.exit(1);
  }
}

run();
