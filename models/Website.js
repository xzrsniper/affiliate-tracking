import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const Website = sequelize.define('Website', {
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
    allowNull: false,
    comment: 'Назва сайту'
  },
  domain: {
    type: DataTypes.STRING(255),
    allowNull: true,
    comment: 'Домен сайту (для перевірки статусу)'
  },
  is_connected: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
    comment: 'Чи підключено tracking код'
  },
  conversion_urls: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'JSON array of success URLs e.g. ["/thanks","/success"]'
  },
  price_selector: {
    type: DataTypes.STRING(500),
    allowNull: true,
    comment: 'CSS selector for price element (DOM scraping)'
  },
  static_price: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: true,
    comment: 'Fixed price per conversion if not on page'
  },
  purchase_button_selector: {
    type: DataTypes.STRING(500),
    allowNull: true,
    comment: 'CSS selector for purchase button (Visual Event Mapper)'
  },
  created_at: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'websites',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    {
      fields: ['user_id']
    },
    {
      fields: ['domain']
    }
  ]
});

export default Website;

