#!/bin/bash

# Скрипт для виправлення Git remote URL
# Використання: ./fix-remote.sh

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${GREEN}🔧 Виправлення Git Remote URL${NC}"
echo ""

# Перевірка поточного remote
echo "Поточний remote:"
git remote -v
echo ""

# Запит username
read -p "Введіть ваш GitHub username: " github_username

if [ -z "$github_username" ]; then
    echo -e "${RED}❌ Username не може бути порожнім${NC}"
    exit 1
fi

# Запит назви репозиторію
read -p "Введіть назву репозиторію (за замовчуванням: affiliate-tracking): " repo_name
repo_name=${repo_name:-affiliate-tracking}

# Запит протоколу
echo ""
echo "Оберіть протокол:"
echo "1) HTTPS (рекомендовано)"
echo "2) SSH"
read -p "Ваш вибір (1 або 2): " protocol_choice

if [ "$protocol_choice" = "2" ]; then
    new_url="git@github.com:${github_username}/${repo_name}.git"
else
    new_url="https://github.com/${github_username}/${repo_name}.git"
fi

echo ""
echo -e "${YELLOW}Новий URL буде: ${new_url}${NC}"
read -p "Продовжити? (y/n) " -n 1 -r
echo ""

if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Скасовано"
    exit 1
fi

# Зміна URL
git remote set-url origin "$new_url"

echo ""
echo -e "${GREEN}✅ Remote URL оновлено!${NC}"
echo ""
echo "Новий remote:"
git remote -v
echo ""

# Перевірка, чи репозиторій існує
echo -e "${YELLOW}Перевірка підключення...${NC}"
if git ls-remote --heads origin > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Репозиторій знайдено на GitHub!${NC}"
    echo ""
    echo "Тепер ви можете відправити код:"
    echo "  git push -u origin main"
else
    echo -e "${YELLOW}⚠️  Репозиторій не знайдено на GitHub${NC}"
    echo ""
    echo "Можливі причини:"
    echo "1. Репозиторій ще не створений на GitHub"
    echo "2. Неправильна назва репозиторію"
    echo "3. Проблеми з доступом"
    echo ""
    echo "Створіть репозиторій на GitHub, а потім виконайте:"
    echo "  git push -u origin main"
fi

