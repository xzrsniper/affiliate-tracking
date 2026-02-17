@echo off
echo ========================================
echo   Запуск тестового магазину локально
echo ========================================
echo.

cd /d "%~dp0"

echo Перевірка Python...
python --version >nul 2>&1
if %errorlevel% == 0 (
    echo Python знайдено!
    echo.
    echo Запускаю локальний сервер на http://localhost:8080
    echo.
    echo Відкрийте в браузері: http://localhost:8080/?ref=TEST123
    echo.
    echo Натисніть Ctrl+C для зупинки сервера
    echo.
    python -m http.server 8080
) else (
    echo Python не знайдено. Перевірка Node.js...
    node --version >nul 2>&1
    if %errorlevel% == 0 (
        echo Node.js знайдено!
        echo.
        echo Запускаю локальний сервер на http://localhost:8080
        echo.
        echo Відкрийте в браузері: http://localhost:8080/?ref=TEST123
        echo.
        echo Натисніть Ctrl+C для зупинки сервера
        echo.
        npx http-server -p 8080
    ) else (
        echo.
        echo Помилка: Не знайдено Python або Node.js!
        echo.
        echo Встановіть один з них:
        echo - Python: https://www.python.org/downloads/
        echo - Node.js: https://nodejs.org/
        echo.
        pause
    )
)
