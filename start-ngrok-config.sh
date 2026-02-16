#!/bin/bash

# Скрипт для запуску ngrok з конфігураційним файлом
# Використання: ./start-ngrok-config.sh

echo "🚀 Запуск ngrok з конфігураційним файлом..."
echo ""

# Перевірка чи встановлений ngrok
if ! command -v ngrok &> /dev/null; then
    echo "❌ ngrok не знайдено!"
    echo "📥 Встановіть ngrok:"
    echo "   macOS: brew install ngrok"
    exit 1
fi

# Перевірка чи є конфігураційний файл
if [ ! -f "ngrok.yml" ]; then
    echo "❌ Файл ngrok.yml не знайдено!"
    echo "📝 Створіть файл ngrok.yml або запустіть скрипт з директорії проекту"
    exit 1
fi

# Перевірка чи встановлений authtoken
if grep -q "YOUR_AUTH_TOKEN_HERE" ngrok.yml; then
    echo "⚠️  Встановіть ваш ngrok auth token в ngrok.yml"
    echo "   Відкрийте ngrok.yml і замініть YOUR_AUTH_TOKEN_HERE на ваш токен"
    echo ""
    echo "   Або виконайте:"
    echo "   ngrok config add-authtoken YOUR_TOKEN"
    echo "   і видаліть рядок 'authtoken:' з ngrok.yml"
    exit 1
fi

# Перевірка чи запущений backend
if ! curl -s http://localhost:3000/health > /dev/null 2>&1; then
    echo "⚠️  Backend не запущений на порту 3000"
    echo "🔧 Запустіть backend в окремому терміналі:"
    echo "   npm start"
    echo ""
fi

# Перевірка чи запущений frontend
if ! curl -s http://localhost:5173 > /dev/null 2>&1; then
    echo "⚠️  Frontend не запущений на порту 5173"
    echo "🔧 Запустіть frontend в окремому терміналі:"
    echo "   cd frontend && npm run dev"
    echo ""
fi

echo "✅ Запуск ngrok з конфігурацією..."
echo ""

# Запуск ngrok з конфігураційним файлом
ngrok start --all --config=ngrok.yml

