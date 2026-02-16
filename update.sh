#!/bin/bash

# Скрипт для оновлення проєкту на сервері
# Використання: ./update.sh

set -e

echo "🔄 Оновлення проєкту..."

# Перейти в директорію проєкту
cd /home/ergoa/affiliate-tracking || cd ~/affiliate-tracking

# Якщо використовується Git
if [ -d ".git" ]; then
    echo "📥 Отримання останніх змін з Git..."
    git pull origin main || git pull origin master
fi

# Встановити backend залежності
echo "📦 Встановлення backend залежностей..."
npm install --production

# Перебілдіть frontend
echo "🏗️  Білд frontend..."
cd frontend
npm install
npm run build
cd ..

# Перезапустити сервер
echo "🔄 Перезапуск сервера..."
pm2 restart affiliate-tracking-api || pm2 start ecosystem.config.js

echo "✅ Оновлення завершено!"
echo "📊 Статус сервера:"
pm2 status
