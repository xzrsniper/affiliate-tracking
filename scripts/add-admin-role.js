/**
 * Migration: add 'admin' value to users.role ENUM
 * Run once: node scripts/add-admin-role.js
 */
import sequelize from '../config/database.js';

async function run() {
  try {
    await sequelize.authenticate();
    console.log('DB connected');

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

    if (currentType.includes("'admin'")) {
      console.log("'admin' already in ENUM — skipping.");
      process.exit(0);
    }

    // Keep any existing values (e.g. moderator from older branch) and add admin.
    const values = ["'user'", "'super_admin'", "'affiliate'", "'admin'"];
    if (currentType.includes("'moderator'") && !values.includes("'moderator'")) {
      values.push("'moderator'");
    }

    await sequelize.query(`
      ALTER TABLE users
      MODIFY COLUMN role ENUM(${values.join(',')})
        NOT NULL DEFAULT 'user'
    `);

    console.log("✅ 'admin' added to users.role ENUM.");
    process.exit(0);
  } catch (err) {
    console.error('Migration failed:', err);
    process.exit(1);
  }
}

run();
