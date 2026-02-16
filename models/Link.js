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
      isUrl: true
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
