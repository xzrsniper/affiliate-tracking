import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';

dotenv.config();

const sequelize = new Sequelize(
  process.env.DB_NAME || 'affiliate_tracking',
  process.env.DB_USER || 'root',
  process.env.DB_PASSWORD || 'Vanua123.',
  {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    dialect: 'mysql',
    dialectOptions: {
      // Дозволити SSL (якщо потрібно)
      ssl: false,
      // Підтримка різних auth plugin
      connectTimeout: 60000
    },
    logging: process.env.NODE_ENV === 'development' ? console.log : false,
    pool: {
      max: parseInt(process.env.DB_POOL_MAX || '20', 10),
      min: parseInt(process.env.DB_POOL_MIN || '2', 10),
      acquire: parseInt(process.env.DB_POOL_ACQUIRE || '60000', 10),
      idle: parseInt(process.env.DB_POOL_IDLE || '10000', 10)
    },
    define: {
      timestamps: true,
      underscored: false,
      freezeTableName: false
    }
  }
);

// Test the connection
export const testConnection = async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ MySQL connection has been established successfully.');
    return true;
  } catch (error) {
    console.error('❌ Unable to connect to MySQL database:', error.message);
    return false;
  }
};

// Sync database (create tables if they don't exist)
export const syncDatabase = async (force = false) => {
  try {
    await sequelize.sync({ force });
    console.log('✅ Database synchronized successfully.');
  } catch (error) {
    console.error('❌ Error synchronizing database:', error.message);
    throw error;
  }
};

export default sequelize;
