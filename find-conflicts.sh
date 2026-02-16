#!/bin/bash

# Скрипт для пошуку Git конфліктів на сервері

echo "🔍 Шукаю файли з Git конфліктами..."

# Знайти всі файли з маркерами конфліктів
echo ""
echo "📋 Файли з маркерами <<<<<<< HEAD:"
grep -r "<<<<<<< HEAD" . --include="*.js" --include="*.jsx" --include="*.ts" --include="*.tsx" --include="*.html" --include="*.json" --include="*.cjs" 2>/dev/null | cut -d: -f1 | sort -u

echo ""
echo "📋 Файли з маркерами ======="
grep -r "=======" . --include="*.js" --include="*.jsx" --include="*.ts" --include="*.tsx" --include="*.html" --include="*.json" --include="*.cjs" 2>/dev/null | cut -d: -f1 | sort -u

echo ""
echo "📋 Файли з маркерами >>>>>>>"
grep -r ">>>>>>>" . --include="*.js" --include="*.jsx" --include="*.ts" --include="*.tsx" --include="*.html" --include="*.json" --include="*.cjs" 2>/dev/null | cut -d: -f1 | sort -u

echo ""
echo "✅ Пошук завершено!"
