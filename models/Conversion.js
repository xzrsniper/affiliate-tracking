import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const Conversion = sequelize.define('Conversion', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  link_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'links',
      key: 'id'
    },
    onDelete: 'CASCADE'
  },
  order_value: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
    defaultValue: 0.00,
    comment: 'Purchase/order value in currency'
  },
  order_id: {
    type: DataTypes.STRING(255),
    allowNull: true,
    comment: 'Order ID for duplicate prevention'
  },
  click_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'clicks',
      key: 'id'
    },
    comment: 'Link to the click that led to this conversion'
  },
  event_type: {
    type: DataTypes.ENUM('lead', 'sale'),
    allowNull: false,
    defaultValue: 'sale',
    comment: 'lead = button click (intent), sale = confirmed purchase'
  },
  created_at: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'conversions',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: false,
  indexes: [
    {
      fields: ['link_id']
    },
    {
      fields: ['created_at']
    },
    {
      fields: ['order_id']
    },
    {
      fields: ['click_id']
    },
    {
      fields: ['event_type']
    }
  ]
});

export default Conversion;
