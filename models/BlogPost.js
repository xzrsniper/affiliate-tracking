import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const BlogPost = sequelize.define('BlogPost', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  title: {
    type: DataTypes.STRING(500),
    allowNull: false,
    comment: 'Заголовок статті'
  },
  slug: {
    type: DataTypes.STRING(500),
    allowNull: false,
    unique: true,
    comment: 'URL slug (унікальний)'
  },
  excerpt: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Короткий опис для списку'
  },
  body: {
    type: DataTypes.TEXT('long'),
    allowNull: true,
    comment: 'Тіло статті (HTML)'
  },
  featured_image: {
    type: DataTypes.STRING(1000),
    allowNull: true,
    comment: 'URL головного зображення'
  },
  author_name: {
    type: DataTypes.STRING(255),
    allowNull: true,
    comment: "Ім'я автора"
  },
  published_at: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: 'Дата публікації (null = чернетка)'
  },
  view_count: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
    comment: 'Кількість переглядів (для популярних)'
  },
  created_at: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  },
  updated_at: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'blog_posts',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    { unique: true, fields: ['slug'] },
    { fields: ['published_at'] },
    { fields: ['view_count'] },
    { fields: ['created_at'] }
  ]
});

export default BlogPost;
