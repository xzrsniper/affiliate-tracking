import mysql from 'mysql2/promise';

const testConnection = async (password) => {
  try {
    const connection = await mysql.createConnection({
      host: 'localhost',
      port: 3306,
      user: 'root',
      password: password
    });

    console.log('✅ Connection successful!');
    
    // Try to create database
    await connection.query('CREATE DATABASE IF NOT EXISTS `affiliate_tracking`');
    console.log('✅ Database created successfully!');
    
    await connection.end();
    return true;
  } catch (error) {
    console.error('❌ Connection failed:', error.message);
    return false;
  }
};

// Try the provided password
const password = 'Vanua123';
console.log(`🔍 Testing MySQL connection with password...\n`);
const success = await testConnection(password);

if (!success) {
  console.log('\n💡 Можливо:');
  console.log('   1. Пароль неправильний');
  console.log('   2. MySQL налаштований інакше');
  console.log('   3. Спробуйте вручну: mysql -u root -p\n');
}

process.exit(success ? 0 : 1);
