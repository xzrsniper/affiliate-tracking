import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const TrackerVerification = sequelize.define('TrackerVerification', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  domain: {
    type: DataTypes.STRING(255),
    allowNull: false,
    comment: 'Домен сайту, де встановлено трекер'
  },
  code: {
    type: DataTypes.STRING(255),
    allowNull: true,
    comment: 'Tracking код (якщо є)'
  },
  version: {
    type: DataTypes.STRING(50),
    allowNull: true,
    comment: 'Версія трекера (gtm, direct, etc.)'
  },
  last_seen: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
    comment: 'Останній раз коли трекер відправив verification ping'
  }
}, {
  tableName: 'tracker_verifications',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    {
      fields: ['domain']
    },
    {
      fields: ['code']
    },
    {
      fields: ['last_seen']
    }
  ]
});

export default TrackerVerification;
