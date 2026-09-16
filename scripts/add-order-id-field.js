import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

const addOrderIdField = async () => {
  let connection;
  
  try {
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 3306,
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'affiliate_tracking'
    });

    console.log('🔄 Додаю поле order_id до таблиці conversions...\n');

    // Check if order_id column exists
    const [orderIdCheck] = await connection.execute(`
      SELECT COUNT(*) as count 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = ? 
      AND TABLE_NAME = 'conversions' 
      AND COLUMN_NAME = 'order_id'
    `, [process.env.DB_NAME || 'affiliate_tracking']);

    if (orderIdCheck[0].count === 0) {
      await connection.execute(`
        ALTER TABLE conversions 
        ADD COLUMN order_id VARCHAR(255) NULL 
        COMMENT 'Order ID for duplicate prevention'
      `);
      console.log('✅ Поле "order_id" додано');
      
      // Add index on order_id for faster lookups
      try {
        await connection.execute(`
          CREATE INDEX idx_order_id ON conversions(order_id)
        `);
        console.log('✅ Індекс на order_id створено');
      } catch (idxError) {
        // Index might already exist or there's an issue, but continue
        console.log('ℹ️  Індекс на order_id вже існує або не може бути створено');
      }
      
      // Add composite index for link_id + order_id lookups
      try {
        await connection.execute(`
          CREATE INDEX idx_link_order ON conversions(link_id, order_id)
        `);
        console.log('✅ Складений індекс (link_id, order_id) створено');
      } catch (idxError) {
        // Index might already exist
        console.log('ℹ️  Складений індекс вже існує або не може бути створено');
      }
    } else {
      console.log('ℹ️  Поле "order_id" вже існує');
    }

    console.log('\n✅ Міграція завершена успішно!');
    
  } catch (error) {
    console.error('❌ Помилка при додаванні поля:', error.message);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
};

addOrderIdField();
