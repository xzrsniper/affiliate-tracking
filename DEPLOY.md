# 🚀 Інструкція з деплою на продакшн сервер

## Крок 1: Підготовка сервера

### Встановлення необхідного ПЗ

```bash
# Оновлення системи
sudo apt update && sudo apt upgrade -y

# Встановлення Node.js (v18 або новіше)
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Встановлення MySQL
sudo apt install -y mysql-server

# Встановлення Nginx
sudo apt install -y nginx

# Встановлення PM2
sudo npm install -g pm2

# Встановлення Certbot для SSL
sudo apt install -y certbot python3-certbot-nginx
```

## Крок 2: Налаштування бази даних

```bash
# Вхід в MySQL
sudo mysql

# Створення бази даних та користувача
CREATE DATABASE affiliate_tracking CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'affiliate_user'@'localhost' IDENTIFIED BY 'ваш_надійний_пароль';
GRANT ALL PRIVILEGES ON affiliate_tracking.* TO 'affiliate_user'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

## Крок 3: Завантаження коду на сервер

### Варіант A: Через GitHub (рекомендовано)

**Спочатку створіть репозиторій на GitHub:**
1. Перейдіть на https://github.com → New repository
2. Назвіть репозиторій (наприклад: `affiliate-tracking`)
3. **Важливо**: Оберіть **Public** (публічний) або **Private** (приватний)
4. **НЕ** додавайте README, .gitignore (вони вже є в проекті)

**На локальному комп'ютері:**
```bash
cd /Users/ivanivanuk/Documents/DashCurs

# Ініціалізація git (якщо ще не зроблено)
git init
git add .
git commit -m "Initial commit"

# Додайте remote (замініть на ваш URL)
git remote add origin https://github.com/ваш-username/affiliate-tracking.git
git branch -M main
git push -u origin main
```

**На сервері:**
```bash
# Встановлення git (якщо ще не встановлено)
sudo apt install -y git

# Клонування репозиторію
sudo mkdir -p /var/www
cd /var/www
sudo git clone https://github.com/ваш-username/affiliate-tracking.git affiliate-tracking
sudo chown -R $USER:$USER affiliate-tracking
cd affiliate-tracking
```

### Варіант B: Через SCP (без GitHub)

```bash
# З локального комп'ютера
cd /Users/ivanivanuk/Documents/DashCurs
scp -r . user@server:/var/www/affiliate-tracking/
```

**Детальні інструкції див. в `GITHUB_DEPLOY.md`**

## Крок 4: Встановлення залежностей

```bash
cd /var/www/affiliate-tracking

# Backend залежності
npm install --production

# Frontend залежності та білд
cd frontend
npm install
npm run build
cd ..
```

## Крок 5: Налаштування змінних середовища

```bash
# Створення .env файлу
nano /var/www/affiliate-tracking/.env
```

Додайте наступні змінні:

```env
NODE_ENV=production
PORT=3000

# База даних
DB_HOST=localhost
DB_USER=affiliate_user
DB_PASSWORD=ваш_надійний_пароль
DB_NAME=affiliate_tracking
DB_PORT=3306

# JWT секрет (згенеруйте випадковий рядок)
JWT_SECRET=ваш_дуже_довгий_випадковий_секрет_ключ

# Admin email (email власника для доступу до адмін панелі)
ADMIN_EMAIL=admin@yourdomain.com

# Google OAuth (якщо використовуєте)
GOOGLE_CLIENT_ID=ваш_google_client_id
GOOGLE_CLIENT_SECRET=ваш_google_client_secret
```

## Крок 6: Ініціалізація бази даних

```bash
cd /var/www/affiliate-tracking

# Створення таблиць
npm run db:init

# Створення адміністратора (опціонально)
npm run create-admin
```

## Крок 7: Налаштування PM2

```bash
cd /var/www/affiliate-tracking

# Створення директорії для логів
mkdir -p logs

# Запуск через PM2
pm2 start ecosystem.config.js

# Збереження конфігурації PM2
pm2 save

# Налаштування автозапуску при перезавантаженні сервера
pm2 startup
# Виконайте команду, яку виведе PM2
```

## Крок 8: Налаштування Nginx

```bash
# Копіювання конфігурації
sudo cp nginx.conf.example /etc/nginx/sites-available/lehko.space

# Редагування конфігурації
sudo nano /etc/nginx/sites-available/lehko.space

# Замініть your-domain.com на ваш домен у всіх місцях

# Створення симлінка
sudo ln -s /etc/nginx/sites-available/lehko.space /etc/nginx/sites-enabled/

# Видалення дефолтної конфігурації (якщо потрібно)
sudo rm /etc/nginx/sites-enabled/default

# Перевірка конфігурації
sudo nginx -t

# Перезавантаження Nginx
sudo systemctl reload nginx
```

## Крок 9: Налаштування SSL (Let's Encrypt)

```bash
# Отримання SSL сертифікату
sudo certbot --nginx -d your-domain.com -d www.your-domain.com

# Автоматичне оновлення сертифікатів
sudo certbot renew --dry-run
```

## Крок 10: Налаштування файрволу

```bash
# Дозвіл HTTP, HTTPS та SSH
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable
```

## Крок 11: Перевірка роботи

```bash
# Перевірка PM2
pm2 status
pm2 logs affiliate-tracking-api

# Перевірка Nginx
sudo systemctl status nginx

# Перевірка MySQL
sudo systemctl status mysql

# Перевірка API
curl http://localhost:3000/health
```

## Крок 12: Оновлення frontend конфігурації

Відредагуйте `/var/www/affiliate-tracking/frontend/src/config/api.js` або створіть `.env.production`:

```bash
cd /var/www/affiliate-tracking/frontend
nano .env.production
```

Додайте:
```
VITE_API_URL=https://your-domain.com
VITE_GOOGLE_CLIENT_ID=ваш_google_client_id
```

Потім перебілдіть frontend:
```bash
npm run build
```

## Полезні команди

```bash
# Перезапуск PM2
pm2 restart affiliate-tracking-api

# Перегляд логів PM2
pm2 logs affiliate-tracking-api

# Перезапуск Nginx
sudo systemctl restart nginx

# Перезапуск MySQL
sudo systemctl restart mysql

# Перегляд логів Nginx
sudo tail -f /var/log/nginx/affiliate-error.log
```

## Troubleshooting

### Помилка підключення до БД
- Перевірте, чи MySQL запущений: `sudo systemctl status mysql`
- Перевірте credentials в `.env`
- Перевірте, чи користувач має права: `sudo mysql -u affiliate_user -p`

### PM2 не запускається
- Перевірте логи: `pm2 logs affiliate-tracking-api`
- Перевірте, чи порт 3000 вільний: `lsof -i :3000`
- Перевірте `.env` файл

### Nginx не працює
- Перевірте конфігурацію: `sudo nginx -t`
- Перевірте логи: `sudo tail -f /var/log/nginx/error.log`
- Перевірте, чи порт 80/443 відкритий: `sudo netstat -tlnp | grep :80`

