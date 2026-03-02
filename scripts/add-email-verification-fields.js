import sequelize from '../config/database.js';
import { QueryTypes } from 'sequelize';

async function addEmailVerificationFields() {
  try {
    console.log('Adding email verification fields to users table...');

    const columns = [
      { name: 'email_verified', sql: 'ADD COLUMN email_verified TINYINT(1) NOT NULL DEFAULT 1' },
      { name: 'email_verification_token', sql: 'ADD COLUMN email_verification_token VARCHAR(255) NULL' },
      { name: 'email_verification_expires_at', sql: 'ADD COLUMN email_verification_expires_at DATETIME NULL' }
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

    console.log('✅ Email verification fields ready');
  } catch (error) {
    console.error('❌ Error adding email verification fields:', error);
    throw error;
  } finally {
    await sequelize.close();
  }
}

addEmailVerificationFields();
