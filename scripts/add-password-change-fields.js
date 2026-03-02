import sequelize from '../config/database.js';
import { QueryTypes } from 'sequelize';

async function addPasswordChangeFields() {
  try {
    console.log('Adding password change confirmation fields to users table...');

    const columns = [
      { name: 'password_change_token', sql: 'ADD COLUMN password_change_token VARCHAR(255) NULL' },
      { name: 'password_change_expires_at', sql: 'ADD COLUMN password_change_expires_at DATETIME NULL' },
      { name: 'pending_password_hash', sql: 'ADD COLUMN pending_password_hash VARCHAR(255) NULL' }
    ];

    for (const col of columns) {
      const [results] = await sequelize.query(`
        SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS
        WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'users' AND COLUMN_NAME = ?
      `, { replacements: [col.name], type: QueryTypes.SELECT });

      if (results && results.length > 0) {
        console.log(`✅ ${col.name} already exists`);
        continue;
      }

      await sequelize.query(`ALTER TABLE users ${col.sql}`);
      console.log(`✅ Added ${col.name}`);
    }

    console.log('✅ Password change confirmation fields ready');
  } catch (error) {
    console.error('❌ Error adding password change fields:', error);
    throw error;
  } finally {
    await sequelize.close();
  }
}

addPasswordChangeFields();
