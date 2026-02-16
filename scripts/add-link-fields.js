import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

const addFields = async () => {
  let connection;
  
  try {
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 3306,
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || 'Vanua123.',
      database: process.env.DB_NAME || 'affiliate_tracking'
    });

    console.log('🔄 Додаю нові поля до таблиці links...\n');

    // Check if name column exists
    const [nameCheck] = await connection.execute(`
      SELECT COUNT(*) as count 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = ? 
      AND TABLE_NAME = 'links' 
      AND COLUMN_NAME = 'name'
    `, [process.env.DB_NAME || 'affiliate_tracking']);

    if (nameCheck[0].count === 0) {
      await connection.execute(`
        ALTER TABLE links 
        ADD COLUMN name VARCHAR(255) NULL 
        COMMENT 'Назва посилання для ідентифікації'
      `);
      console.log('✅ Поле "name" додано');
    } else {
      console.log('ℹ️  Поле "name" вже існує');
    }

    // Check if source_type column exists
    const [sourceCheck] = await connection.execute(`
      SELECT COUNT(*) as count 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = ? 
      AND TABLE_NAME = 'links' 
      AND COLUMN_NAME = 'source_type'
    `, [process.env.DB_NAME || 'affiliate_tracking']);

    if (sourceCheck[0].count === 0) {
      await connection.execute(`
        ALTER TABLE links 
        ADD COLUMN source_type ENUM(
          'social_media',
          'email_marketing',
          'bloggers_influencers',
          'search_ads',
          'seo_traffic',
          'messengers',
          'own_website',
          'other'
        ) NULL 
        COMMENT 'Тип джерела трафіку'
      `);
      console.log('✅ Поле "source_type" додано');
    } else {
      console.log('ℹ️  Поле "source_type" вже існує');
    }

    console.log('\n✅ Всі поля успішно додано до таблиці links!');
    
  } catch (error) {
    console.error('❌ Помилка при додаванні полів:', error.message);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
};

addFields();

