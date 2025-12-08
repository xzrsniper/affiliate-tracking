#!/bin/bash

# Скрипт для ініціалізації Git репозиторію та публікації на GitHub
# Використання: ./init-git.sh

set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${GREEN}🚀 Ініціалізація Git репозиторію...${NC}"

# Перевірка, чи вже є git репозиторій
if [ -d ".git" ]; then
    echo -e "${YELLOW}⚠️  Git репозиторій вже ініціалізовано${NC}"
    read -p "Продовжити? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

# Перевірка наявності .env
if [ -f ".env" ]; then
    echo -e "${GREEN}✅ .env файл знайдено${NC}"
    if git ls-files --error-unmatch .env > /dev/null 2>&1; then
        echo -e "${RED}❌ ПОМИЛКА: .env файл вже в git! Це небезпечно!${NC}"
        echo "Видаліть його: git rm --cached .env"
        exit 1
    fi
else
    echo -e "${YELLOW}⚠️  .env файл не знайдено (це нормально для нового проекту)${NC}"
fi

# Перевірка .gitignore
if grep -q "\.env" .gitignore; then
    echo -e "${GREEN}✅ .env в .gitignore${NC}"
else
    echo -e "${YELLOW}⚠️  Додаю .env в .gitignore...${NC}"
    echo ".env" >> .gitignore
fi

# Ініціалізація git (якщо ще не зроблено)
if [ ! -d ".git" ]; then
    git init
    echo -e "${GREEN}✅ Git репозиторій ініціалізовано${NC}"
fi

# Додавання файлів
echo -e "${GREEN}📦 Додавання файлів...${NC}"
git add .

# Перевірка, чи є зміни для коміту
if git diff --staged --quiet; then
    echo -e "${YELLOW}⚠️  Немає змін для коміту${NC}"
else
    # Коміт
    read -p "Введіть повідомлення коміту (або натисніть Enter для 'Initial commit'): " commit_msg
    commit_msg=${commit_msg:-"Initial commit"}
    
    git commit -m "$commit_msg"
    echo -e "${GREEN}✅ Коміт створено${NC}"
fi

# Перевірка remote
if git remote | grep -q "origin"; then
    echo -e "${GREEN}✅ Remote 'origin' вже налаштовано${NC}"
    git remote -v
else
    echo -e "${YELLOW}📝 Налаштування remote репозиторію...${NC}"
    read -p "Введіть URL GitHub репозиторію (наприклад: https://github.com/username/repo.git): " repo_url
    
    if [ -z "$repo_url" ]; then
        echo -e "${YELLOW}⚠️  Remote не додано. Можете додати пізніше:${NC}"
        echo "git remote add origin https://github.com/username/repo.git"
    else
        git remote add origin "$repo_url"
        echo -e "${GREEN}✅ Remote додано${NC}"
    fi
fi

# Перевірка гілки
current_branch=$(git branch --show-current 2>/dev/null || echo "main")
if [ "$current_branch" != "main" ]; then
    git branch -M main
    echo -e "${GREEN}✅ Гілка перейменована на 'main'${NC}"
fi

echo ""
echo -e "${GREEN}✅ Готово!${NC}"
echo ""
echo "Наступні кроки:"
echo "1. Створіть репозиторій на GitHub (якщо ще не створено)"
echo "2. Додайте remote (якщо ще не додано):"
echo "   git remote add origin https://github.com/username/repo.git"
echo "3. Відправте код:"
echo "   git push -u origin main"
echo ""
echo -e "${YELLOW}⚠️  Переконайтеся, що .env файл НЕ в репозиторії!${NC}"
echo "Перевірка: git ls-files | grep .env"

