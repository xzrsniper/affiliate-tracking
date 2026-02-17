#!/bin/bash

echo "========================================"
echo "  Запуск тестового магазину локально"
echo "========================================"
echo ""

cd "$(dirname "$0")"

# Перевірка Python
if command -v python3 &> /dev/null; then
    echo "Python знайдено!"
    echo ""
    echo "Запускаю локальний сервер на http://localhost:8080"
    echo ""
    echo "Відкрийте в браузері: http://localhost:8080/?ref=TEST123"
    echo ""
    echo "Натисніть Ctrl+C для зупинки сервера"
    echo ""
    python3 -m http.server 8080
elif command -v python &> /dev/null; then
    echo "Python знайдено!"
    echo ""
    echo "Запускаю локальний сервер на http://localhost:8080"
    echo ""
    echo "Відкрийте в браузері: http://localhost:8080/?ref=TEST123"
    echo ""
    echo "Натисніть Ctrl+C для зупинки сервера"
    echo ""
    python -m http.server 8080
elif command -v node &> /dev/null; then
    echo "Node.js знайдено!"
    echo ""
    echo "Запускаю локальний сервер на http://localhost:8080"
    echo ""
    echo "Відкрийте в браузері: http://localhost:8080/?ref=TEST123"
    echo ""
    echo "Натисніть Ctrl+C для зупинки сервера"
    echo ""
    npx http-server -p 8080
else
    echo ""
    echo "Помилка: Не знайдено Python або Node.js!"
    echo ""
    echo "Встановіть один з них:"
    echo "- Python: https://www.python.org/downloads/"
    echo "- Node.js: https://nodejs.org/"
    echo ""
    exit 1
fi
