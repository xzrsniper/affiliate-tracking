import dotenv from 'dotenv';
import mysql from 'mysql2/promise';

dotenv.config();

const email = process.argv[2] || '';

async function main() {
  if (!email) {
    console.error('Usage: node scripts/lookup-user-email.js <email>');
    process.exit(1);
  }

  const c = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'affiliate_tracking'
  });

  const [users] = await c.execute(
    'SELECT id, email, role, created_at FROM users WHERE email = ?',
    [email]
  );
  console.log('USER:', JSON.stringify(users, null, 2));

  if (!users.length) {
    await c.end();
    return;
  }

  const uid = users[0].id;
  const [links] = await c.execute(
    'SELECT id, unique_code, name, original_url, created_at FROM links WHERE user_id = ? ORDER BY id DESC',
    [uid]
  );
  console.log('LINKS (' + links.length + '):', JSON.stringify(links, null, 2));

  const [conv] = await c.execute(
    `SELECT c.id, c.created_at, c.event_type, c.order_value, c.order_id, l.unique_code
     FROM conversions c
     JOIN links l ON c.link_id = l.id
     WHERE l.user_id = ?
     ORDER BY c.created_at DESC
     LIMIT 30`,
    [uid]
  );
  console.log('CONVERSIONS:', JSON.stringify(conv, null, 2));

  const [clicks] = await c.execute(
    `SELECT COUNT(*) AS n FROM clicks ck JOIN links l ON ck.link_id = l.id WHERE l.user_id = ?`,
    [uid]
  );
  console.log('CLICKS total:', clicks[0]);

  await c.end();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
