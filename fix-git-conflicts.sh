#!/bin/bash

# Скрипт для пошуку та виправлення Git конфліктів на сервері

echo "🔍 Шукаю файли з Git конфліктами..."

# Знайти всі файли з маркерами конфліктів
CONFLICT_FILES=$(grep -r "<<<<<<< HEAD" . --include="*.js" --include="*.jsx" --include="*.ts" --include="*.tsx" --include="*.html" --include="*.json" 2>/dev/null | cut -d: -f1 | sort -u)

if [ -z "$CONFLICT_FILES" ]; then
    echo "✅ Файлів з конфліктами не знайдено!"
    exit 0
fi

echo "❌ Знайдено файли з конфліктами:"
echo "$CONFLICT_FILES"
echo ""

# Перелік файлів, які потрібно перевірити вручну
echo "📝 Файли, які потрібно виправити:"
for file in $CONFLICT_FILES; do
    echo "  - $file"
done

echo ""
echo "💡 Для виправлення виконайте на сервері:"
echo "   cd ~/affiliate-tracking"
echo "   git pull origin main"
echo "   # Якщо є конфлікти, вирішіть їх або:"
echo "   git checkout --theirs <файл>  # Використати версію з GitHub"
echo "   git add ."
echo "   git commit -m 'Fix merge conflicts'"
echo "   git push origin main"
