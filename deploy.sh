#!/bin/bash

# Скрипт для автоматичного деплою на продакшн сервер
# Використання: ./deploy.sh

set -e

echo "🚀 Початок деплою..."

# Кольори для виводу
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Перевірка, чи скрипт запущений з правильної директорії
if [ ! -f "package.json" ]; then
    echo -e "${RED}❌ Помилка: package.json не знайдено. Запустіть скрипт з кореневої директорії проекту${NC}"
    exit 1
fi

# Перевірка наявності .env файлу
if [ ! -f ".env" ]; then
    echo -e "${YELLOW}⚠️  .env файл не знайдено. Створіть його перед деплоєм${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Встановлення backend залежностей...${NC}"
npm install --production

echo -e "${GREEN}✅ Встановлення frontend залежностей...${NC}"
cd frontend
npm install

echo -e "${GREEN}✅ Білд frontend...${NC}"
npm run build
cd ..

echo -e "${GREEN}✅ Створення директорії для логів...${NC}"
mkdir -p logs

echo -e "${GREEN}✅ Перезапуск PM2...${NC}"
if pm2 list | grep -q "affiliate-tracking-api"; then
    pm2 restart affiliate-tracking-api
else
    pm2 start ecosystem.config.js
    pm2 save
fi

echo -e "${GREEN}✅ Перевірка статусу PM2...${NC}"
pm2 status

echo -e "${GREEN}✅ Деплой завершено!${NC}"
echo -e "${YELLOW}📝 Перевірте логи: pm2 logs affiliate-tracking-api${NC}"

