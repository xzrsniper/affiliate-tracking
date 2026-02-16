import { User } from '../models/index.js';
import { testConnection } from '../config/database.js';

const checkAdmin = async () => {
  try {
    const connected = await testConnection();
    if (!connected) {
      console.error('❌ Failed to connect to database.');
      process.exit(1);
    }

    const admins = await User.findAll({ 
      where: { role: 'super_admin' },
      attributes: ['id', 'email', 'role', 'created_at']
    });

    if (admins.length > 0) {
      console.log('✅ Знайдено адміністраторів:');
      admins.forEach(admin => {
        console.log(`   Email: ${admin.email}`);
        console.log(`   ID: ${admin.id}`);
        console.log(`   Створено: ${admin.created_at}`);
        console.log('');
      });
    } else {
      console.log('❌ Адміністраторів не знайдено');
      console.log('\n📝 Для створення адміністратора виконайте:');
      console.log('   npm run create-admin <email> <password>');
      console.log('   або');
      console.log('   node scripts/create-admin.js <email> <password>');
    }
    process.exit(0);
  } catch (error) {
    console.error('❌ Помилка:', error.message);
    process.exit(1);
  }
};

checkAdmin();
