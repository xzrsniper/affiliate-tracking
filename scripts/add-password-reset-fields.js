/**
 * Add password_reset_token and password_reset_expires_at fields to users table.
 * Run: node scripts/add-password-reset-fields.js
 */
import sequelize from '../config/database.js';

async function migrate() {
  try {
    await sequelize.authenticate();
    console.log('✅ Database connected');

    const qi = sequelize.getQueryInterface();

    // Check if columns already exist
    const tableDesc = await qi.describeTable('users');

    if (!tableDesc.password_reset_token) {
      await qi.addColumn('users', 'password_reset_token', {
        type: 'VARCHAR(255)',
        allowNull: true,
        defaultValue: null
      });
      console.log('✅ Added password_reset_token column');
    } else {
      console.log('ℹ️  password_reset_token column already exists');
    }

    if (!tableDesc.password_reset_expires_at) {
      await qi.addColumn('users', 'password_reset_expires_at', {
        type: 'DATETIME',
        allowNull: true,
        defaultValue: null
      });
      console.log('✅ Added password_reset_expires_at column');
    } else {
      console.log('ℹ️  password_reset_expires_at column already exists');
    }

    console.log('✅ Migration complete');
    process.exit(0);
  } catch (err) {
    console.error('❌ Migration failed:', err);
    process.exit(1);
  }
}

migrate();
