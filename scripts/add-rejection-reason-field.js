/**
 * Migration: add rejection_reason column to conversions table
 * Run once: node scripts/add-rejection-reason-field.js
 */
import sequelize from '../config/database.js';

async function run() {
  try {
    await sequelize.authenticate();
    console.log('DB connected');

    const [results] = await sequelize.query(`
      SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME = 'conversions'
        AND COLUMN_NAME = 'rejection_reason'
    `);

    if (results.length > 0) {
      console.log('Column rejection_reason already exists — skipping.');
      process.exit(0);
    }

    await sequelize.query(`
      ALTER TABLE conversions
      ADD COLUMN rejection_reason VARCHAR(500) NULL DEFAULT NULL
        COMMENT 'Admin-provided reason when a conversion is rejected'
        AFTER lead_status
    `);

    console.log('✅ Column rejection_reason added to conversions.');
    process.exit(0);
  } catch (err) {
    console.error('Migration failed:', err);
    process.exit(1);
  }
}

run();
