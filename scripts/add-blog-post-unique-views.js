/**
 * Таблиця унікальних переглядів блогу (пара post + visitor_key).
 * Run: node scripts/add-blog-post-unique-views.js
 */
import sequelize from '../config/database.js';
import { QueryTypes } from 'sequelize';

async function up() {
  await sequelize.query(`
    CREATE TABLE IF NOT EXISTS blog_post_unique_views (
      id INT AUTO_INCREMENT PRIMARY KEY,
      blog_post_id INT NOT NULL,
      visitor_key VARCHAR(64) NOT NULL,
      first_seen_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      UNIQUE KEY uq_blog_post_visitor (blog_post_id, visitor_key),
      KEY idx_blog_post_id (blog_post_id),
      CONSTRAINT fk_bpuv_blog_post FOREIGN KEY (blog_post_id)
        REFERENCES blog_posts(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `, { type: QueryTypes.RAW });
  console.log('✅ Table blog_post_unique_views created or already exists.');
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
