import { testConnection, syncDatabase } from '../config/database.js';
import '../models/index.js'; // Import models to register associations

const initDatabase = async () => {
  console.log('🔄 Initializing database...\n');

  // Test connection
  const connected = await testConnection();
  if (!connected) {
    process.exit(1);
  }

  // Sync database (create tables if they don't exist)
  // Set force: true to drop and recreate tables (WARNING: deletes all data)
  // Set force: false to only create missing tables
  const forceSync = process.argv.includes('--force');
  
  if (forceSync) {
    console.log('\n⚠️  WARNING: --force flag detected. This will drop all existing tables!');
  }

  try {
    await syncDatabase(forceSync);
    console.log('\n✅ Database initialization completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Database initialization failed:', error);
    process.exit(1);
  }
};

initDatabase();
