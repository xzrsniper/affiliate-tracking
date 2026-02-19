import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const LinkClick = sequelize.define('LinkClick', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  link_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: { model: 'links', key: 'id' },
    onDelete: 'SET NULL'
  },
  visitor_id: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  url: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'href of clicked link'
  },
  link_text: {
    type: DataTypes.STRING(500),
    allowNull: true
  },
  element_id: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  element_class: {
    type: DataTypes.STRING(500),
    allowNull: true
  },
  domain: {
    type: DataTypes.STRING(255),
    allowNull: true,
    comment: 'Page domain where click happened'
  },
  created_at: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'link_clicks',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: false,
  indexes: [
    { fields: ['link_id'] },
    { fields: ['visitor_id'] },
    { fields: ['created_at'] }
  ]
});

export default LinkClick;
