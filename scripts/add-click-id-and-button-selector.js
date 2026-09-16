import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

const addNewFields = async () => {
  let connection;
  
  try {
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 3306,
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'affiliate_tracking'
    });

    console.log('🔄 Додаю нові поля для трекінгу конверсій...\n');

    // 1. Add click_id field to conversions table
    const [clickIdCheck] = await connection.execute(`
      SELECT COUNT(*) as count 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = ? 
      AND TABLE_NAME = 'conversions' 
      AND COLUMN_NAME = 'click_id'
    `, [process.env.DB_NAME || 'affiliate_tracking']);

    if (clickIdCheck[0].count === 0) {
      await connection.execute(`
        ALTER TABLE conversions 
        ADD COLUMN click_id INT NULL 
        COMMENT 'Link to the click that led to this conversion',
        ADD CONSTRAINT fk_conversions_click_id 
        FOREIGN KEY (click_id) REFERENCES clicks(id) 
        ON DELETE SET NULL
      `);
      console.log('✅ Поле "click_id" додано до таблиці conversions');
      
      // Add index on click_id for faster lookups
      try {
        await connection.execute(`
          CREATE INDEX idx_click_id ON conversions(click_id)
        `);
        console.log('✅ Індекс на click_id створено');
      } catch (idxError) {
        console.log('ℹ️  Індекс на click_id вже існує або не може бути створено');
      }
    } else {
      console.log('ℹ️  Поле "click_id" вже існує в таблиці conversions');
    }

    // 2. Add purchase_button_selector field to websites table
    const [buttonSelectorCheck] = await connection.execute(`
      SELECT COUNT(*) as count 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = ? 
      AND TABLE_NAME = 'websites' 
      AND COLUMN_NAME = 'purchase_button_selector'
    `, [process.env.DB_NAME || 'affiliate_tracking']);

    if (buttonSelectorCheck[0].count === 0) {
      await connection.execute(`
        ALTER TABLE websites 
        ADD COLUMN purchase_button_selector VARCHAR(500) NULL 
        COMMENT 'CSS selector for purchase button (Visual Event Mapper)'
      `);
      console.log('✅ Поле "purchase_button_selector" додано до таблиці websites');
    } else {
      console.log('ℹ️  Поле "purchase_button_selector" вже існує в таблиці websites');
    }

    console.log('\n✅ Міграція завершена успішно!');
    
  } catch (error) {
    console.error('❌ Помилка при додаванні полів:', error.message);
    console.error('Stack:', error.stack);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
};

addNewFields();
