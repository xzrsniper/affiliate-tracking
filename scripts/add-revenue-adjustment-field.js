import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

const addField = async () => {
  let connection;

  try {
    const dbName = process.env.DB_NAME || 'affiliate_tracking';
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 3306,
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: dbName
    });

    console.log('🔄 Перевіряю поле revenue_adjustment у таблиці links...\n');

    const [check] = await connection.execute(
      `
      SELECT COUNT(*) as count
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_SCHEMA = ?
        AND TABLE_NAME = 'links'
        AND COLUMN_NAME = 'revenue_adjustment'
    `,
      [dbName]
    );

    if (check[0].count === 0) {
      await connection.execute(`
        ALTER TABLE links
        ADD COLUMN revenue_adjustment DECIMAL(12, 2) NOT NULL DEFAULT 0.00
        COMMENT 'Manual revenue correction (added to raw sums)'
      `);
      console.log('✅ Поле revenue_adjustment додано');
    } else {
      console.log('ℹ️  Поле revenue_adjustment вже існує');
    }
  } catch (error) {
    console.error('❌ Помилка:', error.message);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
};

addField();
