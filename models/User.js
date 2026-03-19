import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const User = sequelize.define('User', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  email: {
    type: DataTypes.STRING(255),
    allowNull: false,
    unique: true,
    validate: {
      isEmail: true
    }
  },
  password_hash: {
    type: DataTypes.STRING(255),
    allowNull: true // Allow null for Google OAuth users
  },
  google_id: {
    type: DataTypes.STRING(255),
    allowNull: true,
    unique: true
  },
  role: {
    type: DataTypes.ENUM('user', 'super_admin'),
    allowNull: false,
    defaultValue: 'user'
  },
  link_limit: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 3,
    validate: {
      min: 0
    }
  },
  is_banned: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false
  },
  email_verified: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false
  },
  email_verification_token: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  email_verification_expires_at: {
    type: DataTypes.DATE,
    allowNull: true
  },
  password_change_token: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  password_change_expires_at: {
    type: DataTypes.DATE,
    allowNull: true
  },
  pending_password_hash: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  password_reset_token: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  password_reset_expires_at: {
    type: DataTypes.DATE,
    allowNull: true
  },
  google_sheets_refresh_token: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  google_sheets_connected_at: {
    type: DataTypes.DATE,
    allowNull: true
  },
  google_sheets_email: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  created_at: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'users',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    {
      unique: true,
      fields: ['email']
    },
    {
      fields: ['role']
    },
    {
      fields: ['is_banned']
    },
    {
      fields: ['google_id']
    }
  ]
});

export default User;
