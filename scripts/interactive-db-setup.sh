#!/bin/bash

echo "🔧 Налаштування бази даних для Affiliate Tracking SaaS"
echo ""
echo "Будь ласка, введіть MySQL пароль для користувача root:"
read -s MYSQL_PASS

echo ""
echo "📦 Створюю базу даних..."

mysql -u root -p"$MYSQL_PASS" <<EOF 2>&1
CREATE DATABASE IF NOT EXISTS affiliate_tracking;
SHOW DATABASES LIKE 'affiliate_tracking';
EOF

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ База даних 'affiliate_tracking' створена успішно!"
    echo ""
    echo "📝 Налаштовую .env файл..."
    cat > .env <<ENVFILE
# Database Configuration (MySQL - Local)
DB_HOST=localhost
DB_PORT=3306
DB_NAME=affiliate_tracking
DB_USER=root
DB_PASSWORD=$MYSQL_PASS

# JWT Secret
JWT_SECRET=affiliate-tracking-super-secret-key-change-in-production-2024

# Server Configuration
PORT=3000
NODE_ENV=development
ENVFILE
    echo "✅ .env файл створено!"
    echo ""
    echo "📦 Ініціалізую таблиці..."
    npm run db:init
    if [ $? -eq 0 ]; then
        echo ""
        echo "✅ Всі таблиці створені!"
        echo ""
        echo "🎉 Налаштування завершено успішно!"
        echo ""
        echo "📝 Наступний крок: Створіть адміністратора"
        echo "   npm run create-admin admin@example.com password123"
    else
        echo "❌ Помилка при створенні таблиць"
    fi
else
    echo ""
    echo "❌ Помилка при створенні бази даних. Перевірте пароль."
fi
