#!/bin/bash

# Скрипт для пошуку та виправлення Git конфліктів на сервері

echo "🔍 Шукаю файли з Git конфліктами..."

# Знайти всі файли з маркерами конфліктів
CONFLICT_FILES=$(grep -r "<<<<<<< HEAD" . --include="*.js" --include="*.jsx" --include="*.ts" --include="*.tsx" --include="*.html" --include="*.json" --include="*.cjs" 2>/dev/null | cut -d: -f1 | sort -u)

if [ -z "$CONFLICT_FILES" ]; then
    echo "✅ Файлів з конфліктами не знайдено!"
    exit 0
fi

echo "❌ Знайдено файли з конфліктами:"
echo "$CONFLICT_FILES"
echo ""

# Показати конфлікти в кожному файлі
for file in $CONFLICT_FILES; do
    echo "📄 Файл: $file"
    echo "   Конфлікти:"
    grep -n "<<<<<<< HEAD" "$file" 2>/dev/null | head -5
    echo ""
done

echo "💡 Для виправлення виконайте:"
echo "   git fetch origin"
echo "   git reset --hard origin/main"
echo "   pm2 restart affiliate-tracking-api"
