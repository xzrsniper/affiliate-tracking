import sequelize from '../config/database.js';
import { QueryTypes } from 'sequelize';

async function addGoogleIdField() {
  try {
    console.log('Adding google_id field to users table...');

    // Check if column already exists
    const [results] = await sequelize.query(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = DATABASE() 
      AND TABLE_NAME = 'users' 
      AND COLUMN_NAME = 'google_id'
    `, { type: QueryTypes.SELECT });

    if (results && results.length > 0) {
      console.log('✅ google_id field already exists');
      return;
    }

    // Add google_id column
    await sequelize.query(`
      ALTER TABLE users 
      ADD COLUMN google_id VARCHAR(255) NULL UNIQUE AFTER password_hash
    `);

    // Add index
    await sequelize.query(`
      CREATE INDEX idx_users_google_id ON users(google_id)
    `);

    console.log('✅ Successfully added google_id field to users table');
  } catch (error) {
    console.error('❌ Error adding google_id field:', error);
    throw error;
  } finally {
    await sequelize.close();
  }
}

addGoogleIdField();

