import mysql from 'mysql2/promise';
import fs from 'fs';

const changePassword = async () => {
  try {
    const oldPassword = 'Мфтгф123ю'; // Старий пароль (українська розкладка)
    const newPassword = 'Vanua123.'; // Новий пароль

    console.log('🔧 Підключення до MySQL зі старим паролем...\n');

    // Connect to MySQL server with old password
    const connection = await mysql.createConnection({
      host: 'localhost',
      port: 3306,
      user: 'root',
      password: oldPassword
    });

    console.log('✅ Підключення успішне!\n');

    // Change password
    console.log('🔐 Змінюю пароль MySQL...');
    await connection.query(`ALTER USER 'root'@'localhost' IDENTIFIED BY '${newPassword}'`);
    console.log('✅ Пароль змінено на Vanua123.!\n');

    // Flush privileges
    await connection.query('FLUSH PRIVILEGES');
    console.log('✅ Привілеї оновлено!\n');

    await connection.end();

    // Create database
    console.log('📦 Створюю базу даних...');
    const newConnection = await mysql.createConnection({
      host: 'localhost',
      port: 3306,
      user: 'root',
      password: newPassword
    });

    const dbName = 'affiliate_tracking';
    await newConnection.query(`CREATE DATABASE IF NOT EXISTS \`${dbName}\``);
    console.log(`✅ База даних '${dbName}' створена!\n`);

    await newConnection.end();

    // Update .env file
    console.log('📝 Оновлюю .env файл...');
    const envContent = `# Database Configuration (MySQL - Local)
DB_HOST=localhost
DB_PORT=3306
DB_NAME=affiliate_tracking
DB_USER=root
DB_PASSWORD=${newPassword}

# JWT Secret
JWT_SECRET=affiliate-tracking-super-secret-key-change-in-production-2024

# Server Configuration
PORT=3000
NODE_ENV=development
`;
    fs.writeFileSync('.env', envContent);
    console.log('✅ .env файл оновлено!\n');

    console.log('🎉 Налаштування завершено!\n');
    console.log('📝 Пароль MySQL змінено на: Vanua123.\n');
    process.exit(0);
  } catch (error) {
    console.error('❌ Помилка:', error.message);
    if (error.message.includes('Access denied')) {
      console.error('\n💡 Перевірте правильність старого пароля');
    }
    process.exit(1);
  }
};

changePassword();
