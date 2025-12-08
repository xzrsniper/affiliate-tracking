#!/bin/bash

# Скрипт для запуску тестового сервера через ngrok
# Використання: ./start-ngrok.sh

echo "🚀 Запуск тестового сервера через ngrok..."
echo ""

# Перевірка чи встановлений ngrok
if ! command -v ngrok &> /dev/null; then
    echo "❌ ngrok не знайдено!"
    echo "📥 Встановіть ngrok:"
    echo "   macOS: brew install ngrok"
    echo "   Або завантажте з https://ngrok.com/download"
    exit 1
fi

# Перевірка чи запущений backend
if ! curl -s http://localhost:3000/health > /dev/null 2>&1; then
    echo "⚠️  Backend не запущений на порту 3000"
    echo "🔧 Запустіть backend в окремому терміналі:"
    echo "   cd $(pwd) && npm start"
    echo ""
    read -p "Продовжити все одно? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

# Перевірка чи запущений frontend
if ! curl -s http://localhost:5173 > /dev/null 2>&1; then
    echo "⚠️  Frontend не запущений на порту 5173"
    echo "🔧 Запустіть frontend в окремому терміналі:"
    echo "   cd $(pwd)/frontend && npm run dev"
    echo ""
    read -p "Продовжити все одно? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

echo "✅ Запуск ngrok тунелів..."
echo ""
echo "📡 Backend тунель (порт 3000):"
ngrok http 3000 --log=stdout &
NGROK_BACKEND_PID=$!

sleep 3

# Отримуємо URL backend з ngrok
BACKEND_URL=$(curl -s http://localhost:4040/api/tunnels | grep -o 'https://[^"]*\.ngrok-free\.app' | head -1)

if [ -z "$BACKEND_URL" ]; then
    echo "❌ Не вдалося отримати ngrok URL для backend"
    kill $NGROK_BACKEND_PID 2>/dev/null
    exit 1
fi

echo "✅ Backend URL: $BACKEND_URL"
echo ""
echo "📡 Frontend тунель (порт 5173):"
ngrok http 5173 --log=stdout &
NGROK_FRONTEND_PID=$!

sleep 3

# Отримуємо URL frontend з ngrok
FRONTEND_URL=$(curl -s http://localhost:4040/api/tunnels | grep -o 'https://[^"]*\.ngrok-free\.app' | tail -1)

if [ -z "$FRONTEND_URL" ]; then
    echo "❌ Не вдалося отримати ngrok URL для frontend"
    kill $NGROK_BACKEND_PID $NGROK_FRONTEND_PID 2>/dev/null
    exit 1
fi

echo "✅ Frontend URL: $FRONTEND_URL"
echo ""
echo "═══════════════════════════════════════════════════════"
echo "🎉 Тестовий сервер запущено!"
echo ""
echo "🌐 Frontend (для замовника):"
echo "   $FRONTEND_URL"
echo ""
echo "🔧 Backend API:"
echo "   $BACKEND_URL"
echo ""
echo "⚠️  Важливо: Оновіть frontend/src/config/api.js:"
echo "   Замініть API_BASE_URL на: $BACKEND_URL"
echo ""
echo "📝 Або встановіть змінну середовища:"
echo "   export VITE_API_URL=$BACKEND_URL"
echo "   cd frontend && npm run dev"
echo ""
echo "🛑 Для зупинки натисніть Ctrl+C"
echo "═══════════════════════════════════════════════════════"

# Функція для очищення при виході
cleanup() {
    echo ""
    echo "🛑 Зупинка ngrok тунелів..."
    kill $NGROK_BACKEND_PID $NGROK_FRONTEND_PID 2>/dev/null
    exit 0
}

trap cleanup SIGINT SIGTERM

# Очікування
wait

