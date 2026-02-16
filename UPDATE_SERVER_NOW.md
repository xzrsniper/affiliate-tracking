# 🔄 ШВИДКЕ ОНОВЛЕННЯ НА СЕРВЕРІ

## Проблема: `SyntaxError: Unexpected token '<<'`

На сервері все ще є старі файли з Git конфліктами. Потрібно оновити код з GitHub.

## ⚡ ШВИДКЕ ВИПРАВЛЕННЯ (виконайте на сервері):

```bash
cd ~/affiliate-tracking

# 1. Зупиніть PM2
pm2 stop affiliate-tracking-api

# 2. Збережіть .env файли (якщо потрібно)
cp .env .env.backup
cp frontend/.env frontend/.env.backup 2>/dev/null || true

# 3. Оновіть код з GitHub (використайте версію з GitHub)
git fetch origin
git reset --hard origin/main

# 4. Відновіть .env файли
cp .env.backup .env
cp frontend/.env.backup frontend/.env 2>/dev/null || true

# 5. Перевірте, чи немає конфліктів
echo "🔍 Перевірка конфліктів..."
grep -r "<<<<<<< HEAD" . --include="*.js" --include="*.jsx" 2>/dev/null || echo "✅ Конфліктів не знайдено!"

# 6. Перезапустіть PM2
pm2 restart affiliate-tracking-api

# 7. Перевірте логи
pm2 logs affiliate-tracking-api --lines 30
```

---

## Якщо `git reset --hard` не працює:

```bash
cd ~/affiliate-tracking

# Знайдіть файли з конфліктами
grep -r "<<<<<<< HEAD" . --include="*.js" --include="*.jsx" 2>/dev/null

# Виправте кожен файл вручну або:
# Використайте версію з GitHub для всіх конфліктів
git checkout --theirs .
git add .
git commit -m "Fix merge conflicts"

# Перезапустіть
pm2 restart affiliate-tracking-api
```

---

## Альтернатива: Повне перезавантаження проекту

```bash
cd ~

# Збережіть .env файли
cp affiliate-tracking/.env .env.backup
cp affiliate-tracking/frontend/.env .env.frontend.backup 2>/dev/null || true

# Видаліть стару папку
rm -rf affiliate-tracking

# Клонуйте заново
git clone https://github.com/xzrsniper/affiliate-tracking.git
cd affiliate-tracking

# Відновіть .env файли
cp ../.env.backup .env
cp ../.env.frontend.backup frontend/.env 2>/dev/null || true

# Встановіть залежності
npm install --production
cd frontend
npm install
npm run build
cd ..

# Запустіть PM2
pm2 start ecosystem.config.cjs
# або
pm2 start server.js --name affiliate-tracking-api

# Збережіть
pm2 save

# Перевірте
pm2 logs affiliate-tracking-api
```

---

## Перевірка після оновлення:

```bash
# 1. Перевірте, чи немає конфліктів
grep -r "<<<<<<< HEAD" . --include="*.js" --include="*.jsx" 2>/dev/null

# 2. Перевірте статус PM2
pm2 status

# 3. Перевірте логи
pm2 logs affiliate-tracking-api --lines 50

# 4. Перевірте, чи сервер відповідає
curl http://localhost:3000/health
```

Якщо все добре, ви не повинні бачити помилок `SyntaxError: Unexpected token '<<'`.
