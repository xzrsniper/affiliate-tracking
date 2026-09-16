import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

const changePassword = async () => {
  const oldPassword = process.env.OLD_DB_PASSWORD;
  const newPassword = process.env.NEW_DB_PASSWORD;

  if (!oldPassword || !newPassword) {
    console.error('Usage: OLD_DB_PASSWORD=... NEW_DB_PASSWORD=... node scripts/change-mysql-password.js');
    process.exit(1);
  }

  try {
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 3306,
      user: process.env.DB_USER || 'root',
      password: oldPassword
    });

    await connection.query('ALTER USER ?@\'localhost\' IDENTIFIED BY ?', [
      process.env.DB_USER || 'root',
      newPassword
    ]);
    await connection.query('FLUSH PRIVILEGES');
    await connection.end();
    console.log('MySQL password updated. Set DB_PASSWORD in .env to the new value.');
    process.exit(0);
  } catch (error) {
    console.error('Failed to change MySQL password:', error.message);
    process.exit(1);
  }
};

changePassword();
