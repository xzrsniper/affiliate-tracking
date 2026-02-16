import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const PageContent = sequelize.define('PageContent', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  page: {
    type: DataTypes.STRING(100),
    allowNull: false,
    defaultValue: 'home',
    comment: 'Назва сторінки (home, landing, etc.)'
  },
  section: {
    type: DataTypes.STRING(100),
    allowNull: false,
    comment: 'Назва секції (hero, features, stats, etc.)'
  },
  key: {
    type: DataTypes.STRING(100),
    allowNull: false,
    comment: 'Унікальний ключ поля (title, description, image, etc.)'
  },
  content_type: {
    type: DataTypes.ENUM('text', 'html', 'image', 'json'),
    allowNull: false,
    defaultValue: 'text',
    comment: 'Тип контенту'
  },
  content: {
    type: DataTypes.TEXT('long'),
    allowNull: true,
    comment: 'Вміст (текст, HTML, URL зображення, JSON)'
  },
  order: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
    comment: 'Порядок відображення'
  },
  is_active: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true,
    comment: 'Чи активний цей контент'
  },
  created_at: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'page_contents',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    {
      unique: true,
      fields: ['page', 'section', 'key']
    },
    {
      fields: ['page', 'section']
    },
    {
      fields: ['is_active']
    }
  ]
});

export default PageContent;

