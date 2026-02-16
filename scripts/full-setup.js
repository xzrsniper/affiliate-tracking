import mysql from 'mysql2/promise';
import readline from 'readline';
import dotenv from 'dotenv';
import { testConnection, syncDatabase } from '../config/database.js';
import '../models/index.js';

dotenv.config();

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const question = (query) => new Promise((resolve) => rl.question(query, resolve));

const fullSetup = async () => {
  try {
    console.log('🚀 Full Database Setup for Affiliate Tracking SaaS\n');

    // Get MySQL credentials
    const dbUser = process.env.DB_USER || await question('MySQL username (default: root): ') || 'root';
    const dbPassword = await question('MySQL password: ');
    const dbHost = process.env.DB_HOST || 'localhost';
    const dbPort = process.env.DB_PORT || 3306;
    const dbName = process.env.DB_NAME || 'affiliate_tracking';

    console.log('\n📦 Step 1: Creating database...');

    // Connect to MySQL server
    const connection = await mysql.createConnection({
      host: dbHost,
      port: dbPort,
      user: dbUser,
      password: dbPassword
    });

    await connection.query(`CREATE DATABASE IF NOT EXISTS \`${dbName}\``);
    console.log(`✅ Database '${dbName}' created or already exists`);

    await connection.end();

    // Update .env if not exists
    console.log('\n📝 Step 2: Updating environment configuration...');
    if (!process.env.DB_USER || !process.env.DB_PASSWORD) {
      console.log('⚠️  Please make sure your .env file contains:');
      console.log(`   DB_USER=${dbUser}`);
      console.log(`   DB_PASSWORD=${dbPassword}`);
      console.log(`   DB_NAME=${dbName}`);
      console.log(`   DB_HOST=${dbHost}`);
    }

    // Set environment variables for this session
    process.env.DB_USER = dbUser;
    process.env.DB_PASSWORD = dbPassword;
    process.env.DB_NAME = dbName;
    process.env.DB_HOST = dbHost;

    console.log('\n📦 Step 3: Initializing database tables...');

    // Test connection
    const connected = await testConnection();
    if (!connected) {
      throw new Error('Failed to connect to database');
    }

    // Sync database
    await syncDatabase(false);

    console.log('\n✅ Database setup completed successfully!');
    console.log('\n📝 Next step: Create a super admin user');
    console.log('   Run: npm run create-admin <email> <password>\n');

    rl.close();
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Error during setup:', error.message);
    rl.close();
    process.exit(1);
  }
};

fullSetup();
