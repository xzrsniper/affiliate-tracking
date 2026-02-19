import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

const addEventType = async () => {
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

    // Check if event_type column already exists
    const [columns] = await connection.execute(
      "SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'conversions' AND COLUMN_NAME = 'event_type'",
      [process.env.DB_NAME || 'affiliate_tracking']
    );

    if (columns.length > 0) {
      console.log('event_type column already exists, skipping');
    } else {
      await connection.execute(`
        ALTER TABLE conversions
        ADD COLUMN event_type ENUM('lead', 'sale') NOT NULL DEFAULT 'sale'
        COMMENT 'lead = button click (intent), sale = confirmed purchase'
      `);
      console.log('Added event_type column to conversions');
      
      // Add index
      await connection.execute(`
        ALTER TABLE conversions ADD INDEX idx_event_type (event_type)
      `);
      console.log('Added index on event_type');
    }

    console.log('Migration completed successfully!');
  } catch (error) {
    console.error('Migration error:', error.message);
    process.exit(1);
  } finally {
    if (connection) await connection.end();
  }
};

addEventType();
