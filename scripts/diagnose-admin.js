import { User } from '../models/index.js';
import { testConnection } from '../config/database.js';
import dotenv from 'dotenv';

dotenv.config();

const diagnoseAdmin = async () => {
  try {
    console.log('🔍 Діагностика адмін-панелі...\n');

    // Check database connection
    const connected = await testConnection();
    if (!connected) {
      console.error('❌ Помилка: Неможливо підключитися до бази даних.');
      process.exit(1);
    }
    console.log('✅ Підключення до бази даних успішне\n');

    // Check ADMIN_EMAIL environment variable
    const ADMIN_EMAIL = process.env.ADMIN_EMAIL;
    console.log('📧 ADMIN_EMAIL змінна середовища:');
    if (ADMIN_EMAIL) {
      console.log(`   ✅ Встановлено: ${ADMIN_EMAIL}`);
    } else {
      console.log('   ⚠️  НЕ встановлено! Адмін-панель буде недоступна.');
      console.log('   💡 Додайте ADMIN_EMAIL до файлу .env');
    }
    console.log('');

    // Find all super admins
    const admins = await User.findAll({ 
      where: { role: 'super_admin' },
      attributes: ['id', 'email', 'role', 'password_hash', 'created_at', 'is_banned']
    });

    console.log(`👥 Знайдено адміністраторів: ${admins.length}\n`);

    if (admins.length === 0) {
      console.log('❌ Адміністраторів не знайдено!');
      console.log('\n📝 Для створення адміністратора виконайте:');
      console.log('   npm run create-admin <email> <password>');
      console.log('   або');
      console.log('   node scripts/create-admin.js <email> <password>');
      process.exit(1);
    }

    // Check each admin
    admins.forEach((admin, index) => {
      console.log(`--- Адміністратор #${index + 1} ---`);
      console.log(`   Email: ${admin.email}`);
      console.log(`   ID: ${admin.id}`);
      console.log(`   Роль: ${admin.role}`);
      console.log(`   Заблоковано: ${admin.is_banned ? 'Так ❌' : 'Ні ✅'}`);
      console.log(`   Має password_hash: ${admin.password_hash ? 'Так ✅' : 'Ні ❌'}`);
      console.log(`   Створено: ${admin.created_at}`);
      
      // Check if email matches ADMIN_EMAIL
      if (ADMIN_EMAIL) {
        const emailMatches = admin.email.toLowerCase() === ADMIN_EMAIL.toLowerCase();
        console.log(`   Email відповідає ADMIN_EMAIL: ${emailMatches ? 'Так ✅' : 'Ні ❌'}`);
        if (!emailMatches) {
          console.log(`   ⚠️  Цей адміністратор НЕ зможе отримати доступ до адмін-панелі!`);
          console.log(`   💡 Або змініть ADMIN_EMAIL на ${admin.email}, або створіть нового адміністратора з email ${ADMIN_EMAIL}`);
        }
      } else {
        console.log(`   ⚠️  ADMIN_EMAIL не встановлено - доступ буде заборонено`);
      }

      // Check if has password_hash
      if (!admin.password_hash) {
        console.log(`   ⚠️  Цей адміністратор зареєстрований через Google OAuth і НЕ зможе отримати доступ!`);
        console.log(`   💡 Створіть нового адміністратора через email/password або змініть пароль для цього користувача`);
      }

      console.log('');
    });

    // Summary
    console.log('📊 Підсумок:');
    const validAdmins = admins.filter(admin => {
      const hasPassword = !!admin.password_hash;
      const emailMatches = ADMIN_EMAIL ? admin.email.toLowerCase() === ADMIN_EMAIL.toLowerCase() : false;
      const notBanned = !admin.is_banned;
      return hasPassword && emailMatches && notBanned;
    });

    if (validAdmins.length > 0) {
      console.log(`   ✅ Знайдено ${validAdmins.length} валідних адміністраторів, які можуть отримати доступ:`);
      validAdmins.forEach(admin => {
        console.log(`      - ${admin.email}`);
      });
    } else {
      console.log(`   ❌ НЕ знайдено валідних адміністраторів для доступу до адмін-панелі!`);
      console.log(`\n💡 Щоб виправити проблему:`);
      console.log(`   1. Переконайтеся, що ADMIN_EMAIL встановлено в .env файлі`);
      console.log(`   2. Створіть адміністратора з email, що відповідає ADMIN_EMAIL:`);
      console.log(`      node scripts/create-admin.js ${ADMIN_EMAIL || 'your-email@example.com'} your-password`);
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ Помилка:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
};

diagnoseAdmin();
