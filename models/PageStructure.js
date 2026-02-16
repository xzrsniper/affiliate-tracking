import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const PageStructure = sequelize.define('PageStructure', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  page: {
    type: DataTypes.STRING(100),
    allowNull: false,
    unique: true,
    comment: 'Назва сторінки (home, landing, etc.)'
  },
  structure: {
    type: DataTypes.JSON,
    allowNull: false,
    comment: 'JSON структура сторінки з секціями та блоками'
  },
  created_at: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'page_structures',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    {
      unique: true,
      fields: ['page']
    }
  ]
});

export default PageStructure;

