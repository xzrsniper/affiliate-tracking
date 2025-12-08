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
    }
  ]
});

export default Conversion;
