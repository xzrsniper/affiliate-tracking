import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import { testConnection } from '../config/database.js';

dotenv.config();

async function run() {
  try {
    console.log('Adding Universal Tracker tables/columns...\n');
    const connected = await testConnection();
    if (!connected) throw new Error('Failed to connect to database');

    const connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 3306,
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'affiliate_tracking'
    });

    // Add columns to websites if not exist (MySQL 8 safe)
    const cols = [
      { name: 'conversion_urls', def: 'TEXT NULL COMMENT \'JSON array of success URLs\'' },
      { name: 'price_selector', def: 'VARCHAR(500) NULL COMMENT \'CSS selector for price\'' },
      { name: 'static_price', def: 'DECIMAL(12,2) NULL COMMENT \'Fixed price per conversion\'' }
    ];
    for (const c of cols) {
      try {
        await connection.query(
          `ALTER TABLE websites ADD COLUMN ${c.name} ${c.def}`
        );
        console.log('Added column websites.' + c.name);
      } catch (e) {
        if (e.code !== 'ER_DUP_FIELDNAME') throw e;
        console.log('Column websites.' + c.name + ' already exists');
      }
    }

    await connection.query(`
      CREATE TABLE IF NOT EXISTS link_clicks (
        id INT AUTO_INCREMENT PRIMARY KEY,
        link_id INT NULL,
        visitor_id VARCHAR(255) NULL,
        url TEXT NULL,
        link_text VARCHAR(500) NULL,
        element_id VARCHAR(255) NULL,
        element_class VARCHAR(500) NULL,
        domain VARCHAR(255) NULL,
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_link_id (link_id),
        INDEX idx_visitor_id (visitor_id),
        INDEX idx_created_at (created_at),
        FOREIGN KEY (link_id) REFERENCES links(id) ON DELETE SET NULL
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);
    console.log('link_clicks table OK');

    await connection.end();
    console.log('\nDone.');
    process.exit(0);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

run();
