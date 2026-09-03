import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

function detectLang(text) {
  const letters = String(text || '').replace(/[^A-Za-zА-Яа-яЁёІіЇїЄєҐґ]/g, '');
  if (letters.length < 2) return null;
  const cyrillic = (letters.match(/[\u0400-\u04FF]/g) || []).length;
  return cyrillic / letters.length >= 0.3 ? 'uk' : 'en';
}

const migrate = async () => {
  let connection;

  try {
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 3306,
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'affiliate_tracking'
    });

    const dbName = process.env.DB_NAME || 'affiliate_tracking';

    const [columns] = await connection.execute(
      "SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'page_contents' AND COLUMN_NAME = 'lang'",
      [dbName]
    );

    if (columns.length === 0) {
      await connection.execute(`
        ALTER TABLE page_contents
        ADD COLUMN lang VARCHAR(8) NOT NULL DEFAULT 'uk'
        COMMENT 'Мова контенту: uk або en'
      `);
      console.log('Added lang column to page_contents');
    } else {
      console.log('lang column already exists');
    }

    const [indexes] = await connection.execute(
      `SELECT INDEX_NAME, NON_UNIQUE, GROUP_CONCAT(COLUMN_NAME ORDER BY SEQ_IN_INDEX) AS cols
       FROM INFORMATION_SCHEMA.STATISTICS
       WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'page_contents'
       GROUP BY INDEX_NAME, NON_UNIQUE`,
      [dbName]
    );

    for (const idx of indexes) {
      const cols = String(idx.cols || '');
      if (idx.NON_UNIQUE === 0 && cols === 'page,section,key') {
        await connection.execute(`ALTER TABLE page_contents DROP INDEX \`${idx.INDEX_NAME}\``);
        console.log(`Dropped old unique index ${idx.INDEX_NAME}`);
      }
    }

    const [rows] = await connection.execute(
      'SELECT id, page, section, `key`, content, lang FROM page_contents'
    );

    for (const row of rows) {
      const detected = detectLang(row.content);
      if (!detected) continue;
      if (row.lang !== detected) {
        await connection.execute('UPDATE page_contents SET lang = ? WHERE id = ?', [detected, row.id]);
      }
    }
    console.log(`Tagged ${rows.length} page_contents rows by detected language`);

    const hasNewUnique = indexes.some(
      (idx) => idx.NON_UNIQUE === 0 && String(idx.cols || '') === 'page,section,key,lang'
    );
    if (!hasNewUnique) {
      try {
        await connection.execute(
          'ALTER TABLE page_contents ADD UNIQUE INDEX page_contents_page_section_key_lang (page, section, `key`, lang)'
        );
        console.log('Added unique index page_contents_page_section_key_lang');
      } catch (err) {
        if (!String(err.message).includes('Duplicate')) throw err;
        console.log('Unique index already exists');
      }
    }

    console.log('page_contents lang migration completed');
  } catch (error) {
    console.error('Migration error:', error.message);
    process.exit(1);
  } finally {
    if (connection) await connection.end();
  }
};

migrate();
