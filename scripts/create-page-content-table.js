import sequelize from '../config/database.js';
import PageContent from '../models/PageContent.js';
import dotenv from 'dotenv';

dotenv.config();

async function createTable() {
  try {
    console.log('🔄 Створення таблиці page_contents...');
    
    await PageContent.sync({ force: false, alter: true });
    
    console.log('✅ Таблиця page_contents створена/оновлена успішно!');
    
    // Створюємо дефолтний контент для головної сторінки
    console.log('🔄 Створення дефолтного контенту...');
    
    const defaultContent = [
      // Hero Section
      { page: 'home', section: 'hero', key: 'title', content: 'Відстежуйте партнерські програми з точністю до кліку', content_type: 'text', order: 1 },
      { page: 'home', section: 'hero', key: 'title_highlight', content: 'партнерські програми', content_type: 'text', order: 2 },
      { page: 'home', section: 'hero', key: 'description', content: 'Професійна система відстеження affiliate трафіку з автоматичним підрахунком конверсій та доходів. Встановлення за 2 хвилини, працює на будь-якому сайті.', content_type: 'text', order: 3 },
      { page: 'home', section: 'hero', key: 'cta_text', content: 'Створити акаунт', content_type: 'text', order: 4 },
      
      // Stats Section
      { page: 'home', section: 'stats', key: 'stat1_value', content: '100%', content_type: 'text', order: 1 },
      { page: 'home', section: 'stats', key: 'stat1_label', content: 'Точність відстеження', content_type: 'text', order: 2 },
      { page: 'home', section: 'stats', key: 'stat2_value', content: '<2 хв', content_type: 'text', order: 3 },
      { page: 'home', section: 'stats', key: 'stat2_label', content: 'Встановлення', content_type: 'text', order: 4 },
      { page: 'home', section: 'stats', key: 'stat3_value', content: '24/7', content_type: 'text', order: 5 },
      { page: 'home', section: 'stats', key: 'stat3_label', content: 'Моніторинг', content_type: 'text', order: 6 },
      
      // Features Section
      { page: 'home', section: 'features', key: 'title', content: 'Всі можливості для успішного tracking', content_type: 'text', order: 1 },
      { page: 'home', section: 'features', key: 'subtitle', content: 'Все, що потрібно для ефективного управління партнерськими програмами', content_type: 'text', order: 2 },
      
      // Benefits Section
      { page: 'home', section: 'benefits', key: 'title', content: 'Чому обирають нас?', content_type: 'text', order: 1 },
      { page: 'home', section: 'benefits', key: 'description', content: 'Професійне рішення для відстеження affiliate трафіку з усіма необхідними інструментами', content_type: 'text', order: 2 },
      
      // CTA Section
      { page: 'home', section: 'cta', key: 'title', content: 'Готові почати?', content_type: 'text', order: 1 },
      { page: 'home', section: 'cta', key: 'description', content: 'Створіть безкоштовний акаунт за хвилину та почніть відстежувати ваш affiliate трафік вже сьогодні', content_type: 'text', order: 2 },
      { page: 'home', section: 'cta', key: 'button_text', content: 'Створити акаунт безкоштовно', content_type: 'text', order: 3 },
    ];
    
    for (const item of defaultContent) {
      await PageContent.upsert(item);
    }
    
    console.log('✅ Дефолтний контент створено!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Помилка:', error);
    process.exit(1);
  }
}

createTable();

