/**
 * Migration: add 'moderator' value to users.role ENUM
 * Run once: node scripts/add-moderator-role.js
 */
import sequelize from '../config/database.js';

async function run() {
  try {
    await sequelize.authenticate();
    console.log('DB connected');

    // Check current ENUM values
    const [rows] = await sequelize.query(`
      SELECT COLUMN_TYPE FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME = 'users'
        AND COLUMN_NAME = 'role'
    `);

    if (!rows.length) {
      console.error('Column users.role not found');
      process.exit(1);
    }

    const currentType = rows[0].COLUMN_TYPE;
    console.log('Current type:', currentType);

    if (currentType.includes("'moderator'")) {
      console.log("'moderator' already in ENUM — skipping.");
      process.exit(0);
    }

    await sequelize.query(`
      ALTER TABLE users
      MODIFY COLUMN role ENUM('user','super_admin','affiliate','moderator')
        NOT NULL DEFAULT 'user'
    `);

    console.log("✅ 'moderator' added to users.role ENUM.");
    process.exit(0);
  } catch (err) {
    console.error('Migration failed:', err);
    process.exit(1);
  }
}

run();
