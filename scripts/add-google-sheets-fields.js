/**
 * Add Google Sheets OAuth fields to users table.
 * Run: node scripts/add-google-sheets-fields.js
 */
import sequelize from '../config/database.js';
import { QueryTypes } from 'sequelize';

async function addGoogleSheetsFields() {
  try {
    console.log('Adding Google Sheets OAuth fields to users table...');

    const columns = [
      {
        name: 'google_sheets_refresh_token',
        sql: 'ADD COLUMN google_sheets_refresh_token TEXT NULL'
      },
      {
        name: 'google_sheets_connected_at',
        sql: 'ADD COLUMN google_sheets_connected_at DATETIME NULL'
      },
      {
        name: 'google_sheets_email',
        sql: 'ADD COLUMN google_sheets_email VARCHAR(255) NULL'
      }
    ];

    for (const col of columns) {
      const [rows] = await sequelize.query(
        `
        SELECT COLUMN_NAME
        FROM INFORMATION_SCHEMA.COLUMNS
        WHERE TABLE_SCHEMA = DATABASE()
          AND TABLE_NAME = 'users'
          AND COLUMN_NAME = ?
        `,
        { replacements: [col.name], type: QueryTypes.SELECT }
      );

      if (rows && rows.length > 0) {
        console.log(`✅ ${col.name} already exists`);
        continue;
      }

      await sequelize.query(`ALTER TABLE users ${col.sql}`);
      console.log(`✅ Added ${col.name}`);
    }

    console.log('✅ Google Sheets OAuth fields ready');
  } finally {
    await sequelize.close();
  }
}

addGoogleSheetsFields().catch((err) => {
  console.error('❌ Error adding Google Sheets fields:', err);
  process.exit(1);
});

