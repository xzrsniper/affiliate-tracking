import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

const addLinkFormat = async () => {
  let connection;

  try {
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 3306,
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'affiliate_tracking'
    });

    console.log('Connected to database');

    // Check if link_format column already exists
    const [columns] = await connection.execute(
      "SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'links' AND COLUMN_NAME = 'link_format'",
      [process.env.DB_NAME || 'affiliate_tracking']
    );

    if (columns.length > 0) {
      console.log('link_format column already exists, skipping');
    } else {
      await connection.execute(`
        ALTER TABLE links
        ADD COLUMN link_format ENUM('tracking', 'original') NOT NULL DEFAULT 'tracking'
        COMMENT 'tracking = lehko.space/track/code, original = original_url?ref=code'
      `);
      console.log('Added link_format column to links table');

      await connection.execute(`
        ALTER TABLE links ADD INDEX idx_link_format (link_format)
      `);
      console.log('Added index on link_format');
    }

    console.log('Migration completed successfully!');
  } catch (error) {
    console.error('Migration error:', error.message);
    process.exit(1);
  } finally {
    if (connection) await connection.end();
  }
};

addLinkFormat();
