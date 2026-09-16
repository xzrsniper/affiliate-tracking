import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import readline from 'readline';
import crypto from 'crypto';

dotenv.config();

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const question = (query) => new Promise((resolve) => rl.question(query, resolve));

const createDB = async () => {
  try {
    console.log('🔧 Створення бази даних через Sequelize...\n');
    
    let password = process.env.DB_PASSWORD || '';
    
    // Try to connect with default password
    let connection;
    try {
      connection = await mysql.createConnection({
        host: 'localhost',
        port: 3306,
        user: 'root',
        password: password
      });
      console.log('✅ Підключення успішне!\n');
    } catch (error) {
      console.log('⚠️  Не вдалося підключитися з паролем з .env');
      console.log('Будь ласка, введіть правильний MySQL пароль:');
      password = await question('MySQL password: ');
      
      try {
        connection = await mysql.createConnection({
          host: 'localhost',
          port: 3306,
          user: 'root',
          password: password
        });
        console.log('✅ Підключення успішне!\n');
      } catch (err2) {
        console.error('❌ Помилка підключення:', err2.message);
        rl.close();
        process.exit(1);
      }
    }

    // Create database
    const dbName = 'affiliate_tracking';
    await connection.query(`CREATE DATABASE IF NOT EXISTS \`${dbName}\``);
    console.log(`✅ База даних '${dbName}' створена!\n`);

    await connection.end();
    rl.close();
    
    // Update .env file
    console.log('📝 Оновлюю .env файл...');
    const fs = await import('fs');
    const envContent = `# Database Configuration (MySQL - Local)
DB_HOST=localhost
DB_PORT=3306
DB_NAME=affiliate_tracking
DB_USER=root
DB_PASSWORD=${password}

# JWT Secret
JWT_SECRET=${crypto.randomBytes(32).toString('hex')}
ENCRYPTION_KEY=${crypto.randomBytes(32).toString('hex')}
REPORT_SHARE_SECRET=${crypto.randomBytes(32).toString('hex')}

# Server Configuration
PORT=3000
NODE_ENV=development
`;
    fs.writeFileSync('.env', envContent);
    console.log('✅ .env файл оновлено!\n');
    
    console.log('🎉 База даних готова! Тепер запустіть:');
    console.log('   npm run db:init\n');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Помилка:', error.message);
    rl.close();
    process.exit(1);
  }
};

createDB();
