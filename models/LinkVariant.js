import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const LinkVariant = sequelize.define('LinkVariant', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  link_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: { model: 'links', key: 'id' },
    onDelete: 'CASCADE'
  },
  label: {
    type: DataTypes.STRING(64),
    allowNull: false,
    defaultValue: 'A'
  },
  destination_url: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  sort_order: {
    type: DataTypes.TINYINT,
    allowNull: false,
    defaultValue: 0
  },
  is_active: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true
  },
  created_at: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'link_variants',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: false,
  indexes: [{ fields: ['link_id'] }]
});

export default LinkVariant;
