/**
 * Create blog_posts table for blog feature.
 * Run: node scripts/add-blog-posts-table.js
 */
import sequelize from '../config/database.js';
import { QueryTypes } from 'sequelize';

async function up() {
  await sequelize.query(`
    CREATE TABLE IF NOT EXISTS blog_posts (
      id INT AUTO_INCREMENT PRIMARY KEY,
      title VARCHAR(500) NOT NULL,
      slug VARCHAR(500) NOT NULL,
      excerpt TEXT NULL,
      body LONGTEXT NULL,
      featured_image VARCHAR(1000) NULL,
      author_name VARCHAR(255) NULL,
      published_at DATETIME NULL,
      view_count INT NOT NULL DEFAULT 0,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      UNIQUE KEY unique_slug (slug),
      KEY idx_published_at (published_at),
      KEY idx_view_count (view_count),
      KEY idx_created_at (created_at)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `, { type: QueryTypes.RAW });
  console.log('✅ Table blog_posts created or already exists.');
}

async function run() {
  try {
    await sequelize.authenticate();
    await up();
    process.exit(0);
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  }
}

run();
