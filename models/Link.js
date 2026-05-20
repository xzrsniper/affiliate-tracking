import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';
import { generateUniqueCode } from '../utils/codeGenerator.js';

const Link = sequelize.define('Link', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    },
    onDelete: 'CASCADE'
  },
  name: {
    type: DataTypes.STRING(255),
    allowNull: true,
    comment: 'Назва посилання для ідентифікації'
  },
  original_url: {
    type: DataTypes.TEXT,
    allowNull: false,
    validate: {
      isUrl: {
        msg: 'Must be a valid URL',
        // Custom validator that accepts localhost and IP addresses
        validator: function(value) {
          if (!value) return false;
          try {
            const url = new URL(value);
            // Accept http://localhost, http://127.0.0.1, and regular domains
            return url.protocol === 'http:' || url.protocol === 'https:';
          } catch (e) {
            return false;
          }
        }
      }
    }
  },
  source_type: {
    type: DataTypes.ENUM(
      'social_media',
      'email_marketing',
      'bloggers_influencers',
      'search_ads',
      'seo_traffic',
      'messengers',
      'own_website',
      'other'
    ),
    allowNull: true,
    comment: 'Тип джерела трафіку'
  },
  unique_code: {
    type: DataTypes.STRING(255),
    allowNull: false,
    unique: true
  },
  link_format: {
    type: DataTypes.ENUM('tracking', 'original'),
    allowNull: false,
    defaultValue: 'tracking',
    comment: 'tracking = lehko.space/track/code, original = original_url?ref=code'
  },
  split_enabled: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
    comment: 'A/B split test with multiple destination URLs'
  },
  split_phase: {
    type: DataTypes.ENUM('exploring', 'completed'),
    allowNull: true,
    comment: 'exploring = random split; completed = winner chosen'
  },
  split_exploration_limit: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: 'Clicks (45-55) before auto winner selection'
  },
  split_winner_variant_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: 'Winning link_variants.id after exploration'
  },
  revenue_adjustment: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: false,
    defaultValue: 0.0,
    comment: 'Manual revenue correction (added to raw sums); negative reduces displayed totals'
  },
  created_at: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'links',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    {
      unique: true,
      fields: ['unique_code']
    },
    {
      fields: ['user_id']
    }
  ],
  hooks: {
    beforeCreate: async (link) => {
      if (!link.unique_code) {
        // Fallback: Generate a unique code using nanoid if not provided
        link.unique_code = generateUniqueCode();
      }
    }
  }
});

export default Link;
