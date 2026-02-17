#!/bin/bash

# Скрипт для оновлення ADMIN_EMAIL на сервері
# Використання: ./update-admin-email.sh admin@example.com

if [ -z "$1" ]; then
    echo "❌ Помилка: Потрібно вказати email"
    echo "Використання: ./update-admin-email.sh admin@example.com"
    exit 1
fi

NEW_EMAIL=$1
ENV_FILE=".env"

# Перевірка, чи існує .env файл
if [ ! -f "$ENV_FILE" ]; then
    echo "❌ Помилка: Файл .env не знайдено в поточній директорії"
    echo "Переконайтеся, що ви знаходитесь в корені проєкту: /home/ergoa/affiliate-tracking"
    exit 1
fi

# Зробити резервну копію
BACKUP_FILE=".env.backup-$(date +%Y%m%d-%H%M%S)"
cp "$ENV_FILE" "$BACKUP_FILE"
echo "✅ Створено резервну копію: $BACKUP_FILE"

# Перевірити поточне значення
CURRENT_EMAIL=$(grep "^ADMIN_EMAIL=" "$ENV_FILE" | cut -d '=' -f2)
echo "📧 Поточний ADMIN_EMAIL: $CURRENT_EMAIL"

# Оновити ADMIN_EMAIL
if grep -q "^ADMIN_EMAIL=" "$ENV_FILE"; then
    # Замінити існуючий рядок
    if [[ "$OSTYPE" == "darwin"* ]]; then
        # macOS
        sed -i '' "s/^ADMIN_EMAIL=.*/ADMIN_EMAIL=$NEW_EMAIL/" "$ENV_FILE"
    else
        # Linux
        sed -i "s/^ADMIN_EMAIL=.*/ADMIN_EMAIL=$NEW_EMAIL/" "$ENV_FILE"
    fi
    echo "✅ ADMIN_EMAIL оновлено на: $NEW_EMAIL"
else
    # Додати новий рядок, якщо його немає
    echo "ADMIN_EMAIL=$NEW_EMAIL" >> "$ENV_FILE"
    echo "✅ ADMIN_EMAIL додано: $NEW_EMAIL"
fi

# Перевірити зміни
echo ""
echo "📋 Перевірка змін:"
grep "^ADMIN_EMAIL=" "$ENV_FILE"

# Перезапустити сервер
echo ""
read -p "🔄 Перезапустити сервер через pm2? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    pm2 restart affiliate-tracking-api
    echo "✅ Сервер перезапущено"
    echo ""
    echo "📊 Перевірка статусу:"
    pm2 status affiliate-tracking-api
else
    echo "⚠️  Не забудьте перезапустити сервер вручну:"
    echo "   pm2 restart affiliate-tracking-api"
fi

echo ""
echo "✅ Готово! ADMIN_EMAIL оновлено на $NEW_EMAIL"
echo "💡 Для перевірки запустіть: npm run diagnose-admin"
