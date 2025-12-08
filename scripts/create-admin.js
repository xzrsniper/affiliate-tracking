import bcrypt from 'bcryptjs';
import { User } from '../models/index.js';
import { testConnection } from '../config/database.js';
import '../models/index.js'; // Import models to register associations

const createSuperAdmin = async () => {
  try {
    // Test database connection
    const connected = await testConnection();
    if (!connected) {
      console.error('❌ Failed to connect to database.');
      process.exit(1);
    }

    const email = process.argv[2];
    const password = process.argv[3];

    if (!email || !password) {
      console.error('❌ Usage: node scripts/create-admin.js <email> <password>');
      process.exit(1);
    }

    if (password.length < 6) {
      console.error('❌ Password must be at least 6 characters');
      process.exit(1);
    }

    // Check if user already exists
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      console.error(`❌ User with email ${email} already exists.`);
      process.exit(1);
    }

    // Hash password
    const password_hash = await bcrypt.hash(password, 10);

    // Create super admin
    const admin = await User.create({
      email,
      password_hash,
      role: 'super_admin',
      link_limit: 9999, // Unlimited for admin
      is_banned: false
    });

    console.log('✅ Super admin created successfully!');
    console.log(`   Email: ${admin.email}`);
    console.log(`   Role: ${admin.role}`);
    process.exit(0);
  } catch (error) {
    console.error('❌ Error creating super admin:', error.message);
    process.exit(1);
  }
};

createSuperAdmin();
