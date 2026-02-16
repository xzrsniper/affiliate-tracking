import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

const createDatabase = async () => {
  try {
    // Connect to MySQL without selecting a database
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 3306,
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || ''
    });

    console.log('✅ Connected to MySQL server');

    // Create database
    const dbName = process.env.DB_NAME || 'affiliate_tracking';
    await connection.query(`CREATE DATABASE IF NOT EXISTS \`${dbName}\``);
    console.log(`✅ Database '${dbName}' created or already exists`);

    await connection.end();
    console.log('\n✅ Database setup completed successfully!');
    console.log('   You can now run: npm run db:init\n');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error creating database:', error.message);
    console.error('\n📝 Please check:');
    console.error('   1. MySQL is running');
    console.error('   2. DB credentials in .env file are correct');
    console.error('   3. Or create database manually:');
    console.error(`      mysql -u root -p -e "CREATE DATABASE ${process.env.DB_NAME || 'affiliate_tracking'};"\n`);
    process.exit(1);
  }
};

createDatabase();
