# Чеклист для деплою

## Перед деплоєм

- [ ] Оновлено `VITE_API_URL` в `frontend/.env` на production URL
- [ ] Оновлено `VITE_GOOGLE_CLIENT_ID` в `frontend/.env`
- [ ] Додано production домен в Google OAuth Authorized origins
- [ ] Змінено `JWT_SECRET` на випадковий безпечний рядок
- [ ] Налаштовано базу даних на хостингу
- [ ] Створено `.env` файл з правильними налаштуваннями
- [ ] Створено `frontend/.env` файл з production налаштуваннями
- [ ] Перевірено, що всі залежності встановлені
- [ ] Зроблено білд frontend (`npm run build` в папці frontend)
- [ ] Перевірено роботу локально

## Під час деплою

- [ ] Завантажено файли на сервер
- [ ] Встановлено залежності (`npm install --production`)
- [ ] Зроблено білд frontend
- [ ] Створено базу даних
- [ ] Запущено `node scripts/init-db.js` для створення таблиць
- [ ] Створено адміністратора (`node scripts/create-admin.js`)
- [ ] Налаштовано Nginx/Apache
- [ ] Налаштовано SSL сертифікат
- [ ] Запущено сервер через PM2 або інший менеджер процесів

## Після деплою

- [ ] Перевірено доступність сайту
- [ ] Перевірено API endpoint (`/api/health`)
- [ ] Перевірено вхід через email/password
- [ ] Перевірено вхід через Google OAuth
- [ ] Перевірено роботу адмін панелі
- [ ] Перевірено роботу dashboard
- [ ] Перевірено роботу tracking функцій
- [ ] Налаштовано резервне копіювання БД
- [ ] Налаштовано моніторинг

## Змінні оточення для production

### Backend (.env)
```env
NODE_ENV=production
PORT=3000
DB_HOST=localhost
DB_PORT=3306
DB_NAME=affiliate_tracking
DB_USER=your_db_user
DB_PASSWORD=strong_password
JWT_SECRET=generate-random-secret-here
ADMIN_EMAIL=admin@yourdomain.com
```

### Frontend (frontend/.env)
```env
VITE_API_URL=https://yourdomain.com
VITE_GOOGLE_CLIENT_ID=your_google_client_id
VITE_TELEGRAM_USERNAME=hodunkooo
```

## Команди для швидкого деплою

```bash
# 1. Підключення до сервера
ssh user@server-ip

# 2. Перехід в директорію проєкту
cd /path/to/project

# 3. Оновлення коду (якщо використовуєте Git)
git pull

# 4. Встановлення залежностей
npm install --production
cd frontend && npm install && npm run build && cd ..

# 5. Оновлення БД (якщо потрібно)
node scripts/init-db.js

# 6. Перезапуск сервера
pm2 restart affiliate-tracking-api

# 7. Перевірка статусу
pm2 status
pm2 logs affiliate-tracking-api --lines 50
```
