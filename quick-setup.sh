#!/bin/bash

# Швидкий скрипт для встановлення сайту на сервер
# Використання: bash quick-setup.sh

set -e

echo "🚀 Початок встановлення Affiliate Tracking SaaS..."
echo ""

# Кольори
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Перевірка, чи скрипт запущений з правами root для деяких команд
if [ "$EUID" -eq 0 ]; then 
   echo -e "${RED}❌ Не запускайте скрипт з правами root!${NC}"
   exit 1
fi

# Крок 1: Встановлення Node.js
echo -e "${YELLOW}📦 Крок 1: Перевірка Node.js...${NC}"
if ! command -v node &> /dev/null; then
    echo "Встановлення Node.js..."
    curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
    sudo apt install -y nodejs
else
    echo -e "${GREEN}✅ Node.js вже встановлено: $(node --version)${NC}"
fi

# Крок 2: Встановлення PM2
echo -e "${YELLOW}📦 Крок 2: Перевірка PM2...${NC}"
if ! command -v pm2 &> /dev/null; then
    echo "Встановлення PM2..."
    sudo npm install -g pm2
else
    echo -e "${GREEN}✅ PM2 вже встановлено${NC}"
fi

# Крок 3: Перевірка MySQL
echo -e "${YELLOW}📦 Крок 3: Перевірка MySQL...${NC}"
if ! command -v mysql &> /dev/null; then
    echo -e "${YELLOW}⚠️  MySQL не встановлено. Встановіть вручну:${NC}"
    echo "sudo apt install -y mysql-server"
    echo "sudo mysql_secure_installation"
else
    echo -e "${GREEN}✅ MySQL встановлено${NC}"
fi

# Крок 4: Перевірка Git
echo -e "${YELLOW}📦 Крок 4: Перевірка Git...${NC}"
if ! command -v git &> /dev/null; then
    echo "Встановлення Git..."
    sudo apt install -y git
else
    echo -e "${GREEN}✅ Git встановлено${NC}"
fi

# Крок 5: Клонування репозиторію
echo -e "${YELLOW}📦 Крок 5: Клонування репозиторію...${NC}"
if [ ! -d "affiliate-tracking" ]; then
    git clone https://github.com/xzrsniper/affiliate-tracking.git
    cd affiliate-tracking
else
    echo -e "${GREEN}✅ Репозиторій вже клоновано${NC}"
    cd affiliate-tracking
    git pull origin main
fi

# Крок 6: Перевірка .env файлів
echo -e "${YELLOW}📦 Крок 6: Перевірка .env файлів...${NC}"
if [ ! -f ".env" ]; then
    echo -e "${RED}❌ Файл .env не знайдено!${NC}"
    echo "Створіть .env файл з налаштуваннями БД та JWT_SECRET"
    echo "Дивіться інструкцію в SERVER_SETUP_COMPLETE.md"
    exit 1
else
    echo -e "${GREEN}✅ .env файл знайдено${NC}"
fi

if [ ! -f "frontend/.env" ]; then
    echo -e "${RED}❌ Файл frontend/.env не знайдено!${NC}"
    echo "Створіть frontend/.env з VITE_API_URL та іншими налаштуваннями"
    exit 1
else
    echo -e "${GREEN}✅ frontend/.env файл знайдено${NC}"
fi

# Крок 7: Встановлення залежностей
echo -e "${YELLOW}📦 Крок 7: Встановлення залежностей...${NC}"
npm install --production

cd frontend
npm install
npm run build
cd ..

# Крок 8: Перевірка бази даних
echo -e "${YELLOW}📦 Крок 8: Перевірка бази даних...${NC}"
if node scripts/check-db.js; then
    echo -e "${GREEN}✅ Підключення до БД успішне${NC}"
    
    # Ініціалізація БД (якщо потрібно)
    echo "Ініціалізація таблиць..."
    node scripts/init-db.js
else
    echo -e "${RED}❌ Помилка підключення до БД!${NC}"
    echo "Перевірте налаштування в .env файлі"
    exit 1
fi

# Крок 9: Запуск через PM2
echo -e "${YELLOW}📦 Крок 9: Запуск сервера...${NC}"
if pm2 list | grep -q "affiliate-tracking-api"; then
    echo "Перезапуск існуючого процесу..."
    pm2 restart affiliate-tracking-api
else
    echo "Запуск нового процесу..."
    pm2 start ecosystem.config.js
    pm2 save
fi

echo ""
echo -e "${GREEN}✅ Встановлення завершено!${NC}"
echo ""
echo "📊 Статус сервера:"
pm2 status
echo ""
echo "📝 Наступні кроки:"
echo "1. Налаштуйте Nginx (дивіться SERVER_SETUP_COMPLETE.md)"
echo "2. Налаштуйте SSL сертифікат"
echo "3. Перевірте роботу сайту"
echo ""
echo "Корисні команди:"
echo "  pm2 logs affiliate-tracking-api  - перегляд логів"
echo "  pm2 restart affiliate-tracking-api  - перезапуск"
echo "  pm2 status  - статус процесів"
