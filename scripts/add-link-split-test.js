/**
 * A/B split-test: link_variants table + split fields on links + variant_id on clicks.
 * Run: node scripts/add-link-split-test.js
 */
import sequelize from '../config/database.js';

async function columnExists(table, column) {
  const [rows] = await sequelize.query(
    `SELECT COUNT(*) AS c FROM information_schema.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = ?`,
    { replacements: [table, column] }
  );
  return Number(rows[0]?.c || 0) > 0;
}

async function tableExists(table) {
  const [rows] = await sequelize.query(
    `SELECT COUNT(*) AS c FROM information_schema.TABLES
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ?`,
    { replacements: [table] }
  );
  return Number(rows[0]?.c || 0) > 0;
}

async function run() {
  console.log('Adding A/B split-test schema...');

  if (!(await columnExists('links', 'split_enabled'))) {
    await sequelize.query(`
      ALTER TABLE links
      ADD COLUMN split_enabled TINYINT(1) NOT NULL DEFAULT 0
      COMMENT 'A/B split test active' AFTER link_format
    `);
    console.log('  links.split_enabled: added');
  }

  if (!(await columnExists('links', 'split_phase'))) {
    await sequelize.query(`
      ALTER TABLE links
      ADD COLUMN split_phase ENUM('exploring', 'completed') NULL DEFAULT NULL
      COMMENT 'exploring = random split; completed = winner chosen' AFTER split_enabled
    `);
    console.log('  links.split_phase: added');
  }

  if (!(await columnExists('links', 'split_exploration_limit'))) {
    await sequelize.query(`
      ALTER TABLE links
      ADD COLUMN split_exploration_limit INT UNSIGNED NULL DEFAULT NULL
      COMMENT 'Random 45-55 clicks before auto winner' AFTER split_phase
    `);
    console.log('  links.split_exploration_limit: added');
  }

  if (!(await columnExists('links', 'split_winner_variant_id'))) {
    await sequelize.query(`
      ALTER TABLE links
      ADD COLUMN split_winner_variant_id INT UNSIGNED NULL DEFAULT NULL
      COMMENT 'Winning variant after exploration' AFTER split_exploration_limit
    `);
    console.log('  links.split_winner_variant_id: added');
  }

  if (!(await tableExists('link_variants'))) {
    await sequelize.query(`
      CREATE TABLE link_variants (
        id INT AUTO_INCREMENT PRIMARY KEY,
        link_id INT NOT NULL,
        label VARCHAR(64) NOT NULL DEFAULT 'A',
        destination_url TEXT NOT NULL,
        sort_order TINYINT UNSIGNED NOT NULL DEFAULT 0,
        is_active TINYINT(1) NOT NULL DEFAULT 1,
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_link_variants_link (link_id),
        CONSTRAINT fk_link_variants_link FOREIGN KEY (link_id) REFERENCES links(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);
    console.log('  link_variants: created');
  }

  if (!(await columnExists('clicks', 'variant_id'))) {
    await sequelize.query(`
      ALTER TABLE clicks
      ADD COLUMN variant_id INT UNSIGNED NULL DEFAULT NULL
      COMMENT 'A/B split variant for this click' AFTER link_id,
      ADD INDEX idx_clicks_variant (variant_id)
    `);
    console.log('  clicks.variant_id: added');
  }

  console.log('Done.');
  await sequelize.close();
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
