/**
 * Migration: Add cart_button_selector column to websites table
 * and add 'cart' to conversions.event_type ENUM
 * 
 * Run: node scripts/add-cart-button-selector.js
 */

import sequelize from '../config/database.js';
import { QueryTypes } from 'sequelize';

async function migrate() {
  console.log('🔧 Starting migration: cart_button_selector + cart event type...\n');

  try {
    await sequelize.authenticate();
    console.log('✅ Database connected');

    // 1. Add cart_button_selector column to websites table
    try {
      const [columns] = await sequelize.query(
        "SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'websites' AND COLUMN_NAME = 'cart_button_selector'"
      );
      
      if (columns.length === 0) {
        await sequelize.query(
          "ALTER TABLE websites ADD COLUMN cart_button_selector VARCHAR(500) NULL COMMENT 'CSS selector for add-to-cart button (Visual Event Mapper)'"
        );
        console.log('✅ Added cart_button_selector column to websites table');
      } else {
        console.log('⏭️  cart_button_selector column already exists');
      }
    } catch (err) {
      console.error('❌ Error adding cart_button_selector column:', err.message);
    }

    // 2. Update event_type ENUM to include 'cart'
    try {
      const [typeInfo] = await sequelize.query(
        "SELECT COLUMN_TYPE FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'conversions' AND COLUMN_NAME = 'event_type'"
      );

      if (typeInfo.length > 0) {
        const currentType = typeInfo[0].COLUMN_TYPE;
        console.log(`   Current event_type: ${currentType}`);

        if (!currentType.includes('cart')) {
          await sequelize.query(
            "ALTER TABLE conversions MODIFY COLUMN event_type ENUM('lead', 'sale', 'cart') NOT NULL DEFAULT 'sale'"
          );
          console.log('✅ Updated event_type ENUM to include "cart"');
        } else {
          console.log('⏭️  event_type ENUM already includes "cart"');
        }
      }
    } catch (err) {
      console.error('❌ Error updating event_type ENUM:', err.message);
    }

    console.log('\n🎉 Migration completed!');
  } catch (err) {
    console.error('❌ Migration failed:', err.message);
  } finally {
    await sequelize.close();
    process.exit(0);
  }
}

migrate();
