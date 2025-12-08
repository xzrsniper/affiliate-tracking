import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const Click = sequelize.define('Click', {
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
  visitor_fingerprint: {
    type: DataTypes.STRING(255),
    allowNull: false,
    comment: 'Unique identifier for the visitor (stored in localStorage/cookies)'
  },
  ip_address: {
    type: DataTypes.STRING(45),
    allowNull: true,
    comment: 'IPv4 or IPv6 address'
  },
  created_at: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'clicks',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: false,
  indexes: [
    {
      fields: ['link_id']
    },
    {
      fields: ['visitor_fingerprint']
    },
    {
      fields: ['link_id', 'visitor_fingerprint'],
      name: 'link_visitor_index'
    },
    {
      fields: ['created_at']
    }
  ]
});

export default Click;
