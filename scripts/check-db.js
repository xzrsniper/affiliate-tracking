import { testConnection } from '../config/database.js';
import '../models/index.js';

const checkDatabase = async () => {
  console.log('🔍 Checking database connection...\n');
  
  const connected = await testConnection();
  
  if (connected) {
    console.log('✅ Database connection successful!');
    console.log('   Database is ready to use.\n');
    process.exit(0);
  } else {
    console.log('❌ Database connection failed.');
    console.log('\n📝 Please:');
    console.log('   1. Create database: npm run db:full-setup');
    console.log('   2. Or follow instructions in SETUP_DB.md\n');
    process.exit(1);
  }
};

checkDatabase();
