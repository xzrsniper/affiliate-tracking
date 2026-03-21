/**
 * Ідемпотентна перевірка/оновлення схеми для lead_revenue та трекінгу конверсій.
 * На проді часто: event_type ENUM без 'cart', відсутній click_id/order_id, немає websites.static_price.
 *
 * Запуск на сервері (з кореня проєкту, з .env):
 *   npm run db:ensure-conversions
 */
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

const dbName = process.env.DB_NAME || 'affiliate_tracking';

async function getColumnType(connection, table, column) {
  const [rows] = await connection.execute(
    `
    SELECT COLUMN_TYPE FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ? AND COLUMN_NAME = ?
    `,
    [dbName, table, column]
  );
  return rows[0]?.COLUMN_TYPE || null;
}

async function columnExists(connection, table, column) {
  const t = await getColumnType(connection, table, column);
  return !!t;
}

async function main() {
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
    console.error('❌ Підключення до MySQL:', e.message);
    process.exit(1);
  }

  console.log(`🔧 ensure-conversions-schema — БД «${dbName}»\n`);

  // --- conversions.event_type (обов’язково lead + sale + cart для коду) ---
  let ev = await getColumnType(connection, 'conversions', 'event_type');
  if (!ev) {
    await connection.execute(`
      ALTER TABLE conversions
      ADD COLUMN event_type ENUM('lead', 'sale', 'cart') NOT NULL DEFAULT 'sale'
      COMMENT 'lead, sale, cart'
    `);
    console.log('✅ Додано conversions.event_type ENUM(lead, sale, cart)');
    try {
      await connection.execute('ALTER TABLE conversions ADD INDEX idx_event_type (event_type)');
    } catch (e) {
      if (e.code !== 'ER_DUP_KEYNAME') console.warn('idx_event_type:', e.message);
    }
  } else if (!String(ev).includes('cart')) {
    console.log(`📝 Поточний event_type: ${ev}`);
    console.log('   Оновлення до ENUM(lead, sale, cart)…');
    await connection.execute(`
      ALTER TABLE conversions MODIFY COLUMN event_type ENUM('lead', 'sale', 'cart') NOT NULL DEFAULT 'sale'
    `);
    console.log('✅ ENUM оновлено (додано cart — потрібно для cart-подій і узгодженості з кодом)');
  } else {
    console.log('✅ conversions.event_type уже містить lead, sale, cart');
  }

  // --- conversions.click_id ---
  if (!(await columnExists(connection, 'conversions', 'click_id'))) {
    await connection.execute(`
      ALTER TABLE conversions ADD COLUMN click_id INT NULL COMMENT 'Link to clicks.id'
    `);
    console.log('✅ Додано conversions.click_id');
    try {
      await connection.execute('CREATE INDEX idx_click_id ON conversions(click_id)');
    } catch (e) {
      if (e.code !== 'ER_DUP_KEYNAME') console.warn('idx_click_id:', e.message);
    }
    try {
      await connection.execute(`
        ALTER TABLE conversions ADD CONSTRAINT fk_conversions_click_id
        FOREIGN KEY (click_id) REFERENCES clicks(id) ON DELETE SET NULL
      `);
    } catch (e) {
      console.log('ℹ️  FK fk_conversions_click_id не створено (можна вручну пізніше):', e.message);
    }
  } else {
    console.log('✅ conversions.click_id є');
  }

  // --- conversions.order_id ---
  if (!(await columnExists(connection, 'conversions', 'order_id'))) {
    await connection.execute(`
      ALTER TABLE conversions ADD COLUMN order_id VARCHAR(255) NULL COMMENT 'Order id dedup'
    `);
    console.log('✅ Додано conversions.order_id');
    try {
      await connection.execute('CREATE INDEX idx_order_id ON conversions(order_id)');
    } catch (e) {
      if (e.code !== 'ER_DUP_KEYNAME') console.warn('idx_order_id:', e.message);
    }
  } else {
    console.log('✅ conversions.order_id є');
  }

  // --- websites.static_price (fallback доходу ліда в API) ---
  if (!(await columnExists(connection, 'websites', 'static_price'))) {
    try {
      await connection.execute(`
        ALTER TABLE websites ADD COLUMN static_price DECIMAL(12,2) NULL
        COMMENT 'Fixed price when pixel sends order_value 0'
      `);
      console.log('✅ Додано websites.static_price');
    } catch (e) {
      if (e.code !== 'ER_DUP_FIELDNAME') throw e;
      console.log('✅ websites.static_price вже є');
    }
  } else {
    console.log('✅ websites.static_price є');
  }

  await connection.end();
  console.log('\n✅ Схема готова. Перезапусти API: pm2 restart …');
  process.exit(0);
}

main().catch((e) => {
  console.error('❌', e.message);
  process.exit(1);
});
