import dotenv from 'dotenv';
import mysql from 'mysql2/promise';
import { testConnection } from '../config/database.js';

dotenv.config();

async function addWebsitesTable() {
  try {
    console.log('🔄 Adding websites table...\n');

    // Test connection
    const connected = await testConnection();
    if (!connected) {
      throw new Error('Failed to connect to database');
    }

    // Connect to MySQL
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 3306,
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'affiliate_tracking'
    });

    // Create websites table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS websites (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        name VARCHAR(255) NOT NULL COMMENT 'Назва сайту',
        domain VARCHAR(255) NULL COMMENT 'Домен сайту (для перевірки статусу)',
        is_connected BOOLEAN NOT NULL DEFAULT FALSE COMMENT 'Чи підключено tracking код',
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        INDEX idx_user_id (user_id),
        INDEX idx_domain (domain)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    console.log('✅ Websites table created successfully!\n');
    await connection.end();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error adding websites table:', error.message);
    process.exit(1);
  }
}

addWebsitesTable();

