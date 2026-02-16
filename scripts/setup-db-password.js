import mysql from 'mysql2/promise';
import fs from 'fs';

const setupDatabase = async () => {
  try {
    const password = process.argv[2] || '';

    console.log('🔧 Підключення до MySQL...\n');

    // Connect to MySQL server
    const connection = await mysql.createConnection({
      host: 'localhost',
      port: 3306,
      user: 'root',
      password: password
    });

    console.log('✅ Підключення успішне!\n');

    // Create database
    const dbName = 'affiliate_tracking';
    await connection.query(`CREATE DATABASE IF NOT EXISTS \`${dbName}\``);
    console.log(`✅ База даних '${dbName}' створена!\n`);

    await connection.end();

    // Update .env file
    console.log('📝 Оновлюю .env файл...');
    const envContent = `# Database Configuration (MySQL - Local)
DB_HOST=localhost
DB_PORT=3306
DB_NAME=affiliate_tracking
DB_USER=root
DB_PASSWORD=${password}

# JWT Secret
JWT_SECRET=affiliate-tracking-super-secret-key-change-in-production-2024

# Server Configuration
PORT=3000
NODE_ENV=development
`;
    fs.writeFileSync('.env', envContent);
    console.log('✅ .env файл оновлено!\n');

    console.log('🎉 База даних готова!\n');
    process.exit(0);
  } catch (error) {
    console.error('❌ Помилка:', error.message);
    if (error.message.includes('Access denied')) {
      console.error('\n💡 Перевірте правильність пароля MySQL');
    }
    process.exit(1);
  }
};

setupDatabase();
