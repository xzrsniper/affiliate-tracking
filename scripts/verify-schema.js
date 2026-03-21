/**
 * Перевірка наявності таблиць і критичних колонок (MySQL).
 * Запуск на сервері: npm run db:verify
 * Якщо чогось не вистачає — див. npm run db:add-click-session тощо.
 */
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

const REQUIRED_TABLES = [
  'users',
  'links',
  'clicks',
  'conversions',
  'websites',
  'page_contents',
  'page_structures',
  'tracker_verifications',
  'link_clicks',
  'blog_posts'
];

/** Таблиця → [колонки, які мають бути] */
const REQUIRED_COLUMNS = {
  clicks: ['session_duration_seconds', 'had_engagement'],
  conversions: ['event_type', 'click_id']
};

async function main() {
  const dbName = process.env.DB_NAME || 'affiliate_tracking';

  let connection;
  try {
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      port: Number(process.env.DB_PORT) || 3306,
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: dbName
    });
  } catch (e) {
    console.error('❌ Не вдалося підключитися до MySQL:', e.message);
    console.error('   Перевір .env (DB_HOST, DB_USER, DB_PASSWORD, DB_NAME)');
    process.exit(1);
  }

  console.log(`🔍 Перевірка схеми БД «${dbName}»...\n`);

  let failures = 0;

  const [tables] = await connection.execute(
    `
    SELECT TABLE_NAME
    FROM INFORMATION_SCHEMA.TABLES
    WHERE TABLE_SCHEMA = ?
    `,
    [dbName]
  );
  const tableSet = new Set(tables.map((r) => r.TABLE_NAME));

  for (const t of REQUIRED_TABLES) {
    if (!tableSet.has(t)) {
      console.log(`❌ Таблиця відсутня: ${t}`);
      failures++;
    } else {
      console.log(`✅ Таблиця: ${t}`);
    }
  }

  for (const [table, cols] of Object.entries(REQUIRED_COLUMNS)) {
    if (!tableSet.has(table)) continue;

    for (const col of cols) {
      const [rows] = await connection.execute(
        `
        SELECT COUNT(*) AS c
        FROM INFORMATION_SCHEMA.COLUMNS
        WHERE TABLE_SCHEMA = ?
          AND TABLE_NAME = ?
          AND COLUMN_NAME = ?
        `,
        [dbName, table, col]
      );
      if (rows[0].c === 0) {
        console.log(`❌ Колонка відсутня: ${table}.${col}`);
        failures++;
      } else {
        console.log(`✅ Колонка: ${table}.${col}`);
      }
    }
  }

  await connection.end();

  console.log('');
  if (failures > 0) {
    console.log(`❌ Знайдено проблем: ${failures}`);
    console.log('   Міграції (з кореня проєкту):');
    console.log('   npm run db:add-click-session   — session_duration_seconds, had_engagement у clicks');
    console.log('   npm run db:add-event-type      — event_type у conversions (якщо треба)');
    console.log('   npm run db:add-click-id        — click_id у conversions (якщо треба)');
    console.log('   npm run db:add-page-content    — page_contents');
    console.log('   npm run db:add-blog-posts      — blog_posts');
    process.exit(1);
  }

  console.log('✅ Усі перевірені таблиці та колонки на місці.');
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
