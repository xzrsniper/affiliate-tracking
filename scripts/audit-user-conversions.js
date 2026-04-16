/**
 * Аудит конверсій користувача за діапазоном дат (локальний час MySQL / stored timestamps).
 * Usage: node scripts/audit-user-conversions.js <email> [startDate] [endDate]
 *   startDate/endDate: YYYY-MM-DD (optional; default: вчора і сьогодні відносно UTC-now сервера)
 */
import dotenv from 'dotenv';
import mysql from 'mysql2/promise';

dotenv.config();

const email = process.argv[2];
if (!email) {
  console.error('Usage: node scripts/audit-user-conversions.js <email> [YYYY-MM-DD start] [YYYY-MM-DD end]');
  process.exit(1);
}

async function main() {
  const c = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'affiliate_tracking'
  });

  const [[{ now: serverNow }]] = await c.query('SELECT NOW() as now');
  const [[tz]] = await c.query('SELECT @@session.time_zone AS tz');
  console.log('DB NOW():', serverNow, '| session tz:', tz);

  const [users] = await c.execute('SELECT id, email FROM users WHERE email = ?', [email]);
  if (!users.length) {
    console.log('USER not found');
    await c.end();
    return;
  }
  const uid = users[0].id;
  console.log('USER:', users[0]);

  let start = process.argv[3];
  let end = process.argv[4];
  if (!start || !end) {
    const [d] = await c.query(`
      SELECT DATE_FORMAT(DATE_SUB(CURDATE(), INTERVAL 1 DAY), '%Y-%m-%d') AS y,
             DATE_FORMAT(CURDATE(), '%Y-%m-%d') AS t
    `);
    start = d[0].y;
    end = d[0].t;
    console.log('Range (default): yesterday .. today (DB calendar):', start, '..', end);
  }

  const startDt = `${start} 00:00:00`;
  const endDt = `${end} 23:59:59`;

  const [byType] = await c.execute(
    `SELECT c.event_type, COUNT(*) as n, COALESCE(SUM(c.order_value),0) as sum_val
     FROM conversions c
     JOIN links l ON c.link_id = l.id
     WHERE l.user_id = ? AND c.created_at >= ? AND c.created_at <= ?
     GROUP BY c.event_type
     ORDER BY n DESC`,
    [uid, startDt, endDt]
  );
  console.log('\nBy event_type in range:', JSON.stringify(byType, null, 2));

  const [salesOnly] = await c.execute(
    `SELECT c.id, c.created_at, c.event_type, c.order_value, c.order_id, l.unique_code, l.name
     FROM conversions c
     JOIN links l ON c.link_id = l.id
     WHERE l.user_id = ?
       AND (c.event_type = 'sale' OR c.event_type IS NULL)
       AND c.created_at >= ? AND c.created_at <= ?
     ORDER BY c.created_at`,
    [uid, startDt, endDt]
  );
  console.log('\nRows counted as SALE in stats (sale or NULL):', salesOnly.length);
  console.log(JSON.stringify(salesOnly, null, 2));

  const [allInRange] = await c.execute(
    `SELECT c.id, c.created_at, c.event_type, c.order_value, l.unique_code
     FROM conversions c
     JOIN links l ON c.link_id = l.id
     WHERE l.user_id = ?
       AND c.created_at >= ? AND c.created_at <= ?
     ORDER BY c.created_at`,
    [uid, startDt, endDt]
  );
  console.log('\nAll conversions in range:', allInRange.length);
  console.log(JSON.stringify(allInRange, null, 2));

  const [yesterdayAfter17] = await c.execute(
    `SELECT c.id, c.created_at, c.event_type, c.order_value, l.unique_code
     FROM conversions c
     JOIN links l ON c.link_id = l.id
     WHERE l.user_id = ?
       AND c.created_at >= CONCAT(DATE_SUB(CURDATE(), INTERVAL 1 DAY), ' 17:00:00')
       AND c.created_at < CONCAT(CURDATE(), ' 00:00:00')
     ORDER BY c.created_at`,
    [uid]
  );
  console.log(
    '\n--- «Вчора після 17:00» (календар БД: від учора 17:00 до опівночі учора) — рядків:',
    yesterdayAfter17.length
  );
  console.log(JSON.stringify(yesterdayAfter17, null, 2));

  await c.end();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
