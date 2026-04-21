import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

/** Один рядок = один унікальний перегляд статті (за ключем відвідувача). */
const BlogPostUniqueView = sequelize.define('BlogPostUniqueView', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  blog_post_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  visitor_key: {
    type: DataTypes.STRING(64),
    allowNull: false
  },
  first_seen_at: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'blog_post_unique_views',
  timestamps: false,
  indexes: [
    { unique: true, fields: ['blog_post_id', 'visitor_key'] },
    { fields: ['blog_post_id'] }
  ]
});

export default BlogPostUniqueView;
