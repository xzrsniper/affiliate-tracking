import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import { testConnection } from '../config/database.js';

dotenv.config();

async function addTrackerVerificationTable() {
  try {
    console.log('🔄 Adding tracker_verifications table...\n');

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

    // Create tracker_verifications table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS tracker_verifications (
        id INT AUTO_INCREMENT PRIMARY KEY,
        domain VARCHAR(255) NOT NULL COMMENT 'Домен сайту, де встановлено трекер',
        code VARCHAR(255) NULL COMMENT 'Tracking код (якщо є)',
        version VARCHAR(50) NULL COMMENT 'Версія трекера (gtm, direct, etc.)',
        last_seen DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Останній раз коли трекер відправив verification ping',
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_domain (domain),
        INDEX idx_code (code),
        INDEX idx_last_seen (last_seen)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    console.log('✅ Tracker verifications table created successfully!\n');
    await connection.end();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error adding tracker_verifications table:', error.message);
    process.exit(1);
  }
}

addTrackerVerificationTable();
