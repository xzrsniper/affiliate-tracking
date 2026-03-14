import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

const addClickSessionFields = async () => {
  let connection;

  try {
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 3306,
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'affiliate_tracking'
    });

    console.log('🔄 Adding click session metric fields...\n');

    const dbName = process.env.DB_NAME || 'affiliate_tracking';

    const [durationCheck] = await connection.execute(`
      SELECT COUNT(*) as count
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_SCHEMA = ?
      AND TABLE_NAME = 'clicks'
      AND COLUMN_NAME = 'session_duration_seconds'
    `, [dbName]);

    if (durationCheck[0].count === 0) {
      await connection.execute(`
        ALTER TABLE clicks
        ADD COLUMN session_duration_seconds INT NULL
        COMMENT 'Tracked session duration in seconds for this click'
      `);
      console.log('✅ Added session_duration_seconds to clicks');
    } else {
      console.log('ℹ️ session_duration_seconds already exists');
    }

    const [engagementCheck] = await connection.execute(`
      SELECT COUNT(*) as count
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_SCHEMA = ?
      AND TABLE_NAME = 'clicks'
      AND COLUMN_NAME = 'had_engagement'
    `, [dbName]);

    if (engagementCheck[0].count === 0) {
      await connection.execute(`
        ALTER TABLE clicks
        ADD COLUMN had_engagement TINYINT(1) NOT NULL DEFAULT 0
        COMMENT 'Whether the visitor interacted with the site after this click'
      `);
      console.log('✅ Added had_engagement to clicks');
    } else {
      console.log('ℹ️ had_engagement already exists');
    }

    try {
      await connection.execute('CREATE INDEX idx_clicks_had_engagement ON clicks(had_engagement)');
      console.log('✅ Added index on had_engagement');
    } catch (error) {
      console.log('ℹ️ Index on had_engagement already exists or could not be created');
    }

    console.log('\n✅ Click session metric migration completed');
  } catch (error) {
    console.error('❌ Migration error:', error.message);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
};

addClickSessionFields();