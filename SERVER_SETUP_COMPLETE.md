# Повна інструкція: Встановлення сайту на сервер через Git

## Крок 1: Підключення до сервера

### Варіант А: Через SSH (якщо працює)

```bash
ssh ergoa@vps76168.hyperhost.name
# або
ssh ergoa@185.237.207.109
```

### Варіант Б: Через веб-термінал в панелі HyperHost

1. Увійдіть в панель управління HyperHost
2. Знайдіть "Terminal" або "SSH Console"
3. Відкрийте веб-термінал

---

## Крок 2: Встановлення необхідного ПЗ

### Оновлення системи

```bash
sudo apt update && sudo apt upgrade -y
```

### Встановлення Node.js (версія 18 або новіша)

```bash
# Додайте репозиторій NodeSource
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -

# Встановіть Node.js
sudo apt install -y nodejs

# Перевірте версію
node --version
npm --version
```

### Встановлення MySQL

```bash
# Встановіть MySQL
sudo apt install -y mysql-server

# Запустіть MySQL
sudo systemctl start mysql
sudo systemctl enable mysql

# Налаштуйте безпеку MySQL
sudo mysql_secure_installation
# Відповідайте на питання:
# - Встановіть пароль для root
# - Видаліть анонімних користувачів: Yes
# - Забороніть remote login для root: Yes
# - Видаліть test базу: Yes
# - Перезавантажте привілеї: Yes
```

### Встановлення PM2 (менеджер процесів)

```bash
sudo npm install -g pm2
```

### Встановлення Nginx

```bash
sudo apt install -y nginx

# Запустіть Nginx
sudo systemctl start nginx
sudo systemctl enable nginx
```

### Встановлення Git (якщо ще не встановлено)

```bash
sudo apt install -y git
```

---

## Крок 3: Створення бази даних

```bash
# Підключіться до MySQL
sudo mysql -u root -p
# Введіть пароль, який встановили під час mysql_secure_installation
```

**В MySQL виконайте:**

```sql
-- Створіть базу даних
CREATE DATABASE affiliate_tracking CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Створіть користувача (замініть 'strong_password' на свій пароль)
CREATE USER 'affiliate_user'@'localhost' IDENTIFIED BY 'strong_password';

-- Надайте права
GRANT ALL PRIVILEGES ON affiliate_tracking.* TO 'affiliate_user'@'localhost';

-- Застосуйте зміни
FLUSH PRIVILEGES;

-- Вийдіть
EXIT;
```

**Запишіть дані:**
- DB_NAME: `affiliate_tracking`
- DB_USER: `affiliate_user`
- DB_PASSWORD: `strong_password` (той, що ви встановили)

---

## Крок 4: Клонування репозиторію

```bash
# Перейдіть в домашню директорію
cd ~

# Клонуйте репозиторій
git clone https://github.com/xzrsniper/affiliate-tracking.git

# Перейдіть в папку проєкту
cd affiliate-tracking
```

---

## Крок 5: Налаштування змінних оточення

### Створіть .env файл для backend

```bash
nano .env
```

**Вміст .env (замініть значення на свої, якщо потрібно):**

```env
# Database Configuration
DB_HOST=localhost
DB_PORT=3306
DB_NAME=affiliate_tracking
DB_USER=affiliate_user
DB_PASSWORD=strong_password

# JWT Secret (згенеруйте випадковий рядок)
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production-$(openssl rand -hex 32)

# Server Configuration
PORT=3000
NODE_ENV=production

# Admin Configuration
ADMIN_EMAIL=admin@lehko.space

# Google OAuth (опціонально)
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
```

**Збережіть:** `Ctrl+O`, `Enter`, `Ctrl+X`

### Створіть .env файл для frontend

```bash
cd frontend
nano .env
```

**Вміст frontend/.env (замініть lehko.space на ваш домен):**

```env
# API URL (замініть на ваш домен)
VITE_API_URL=https://lehko.space

# Google OAuth
VITE_GOOGLE_CLIENT_ID=your_google_client_id

# Telegram
VITE_TELEGRAM_USERNAME=hodunkooo
```

**Збережіть:** `Ctrl+O`, `Enter`, `Ctrl+X`

```bash
# Поверніться в корінь проєкту
cd ..
```

---

## Крок 6: Встановлення залежностей та білд

### Backend залежності

```bash
# В корені проєкту
npm install --production
```

### Frontend залежності та білд

```bash
cd frontend
npm install
npm run build
cd ..
```

---

## Крок 7: Ініціалізація бази даних

```bash
# Створіть таблиці в базі даних
node scripts/init-db.js

# Створіть адміністратора (замініть email та password)
node scripts/create-admin.js admin@lehko.space your_admin_password
```

---

## Крок 8: Налаштування Nginx

### Створіть конфігурацію Nginx

```bash
sudo nano /etc/nginx/sites-available/affiliate-tracking
```

**Вміст (замініть /home/ergoa на ваш шлях, якщо потрібно):**

```nginx
server {
    listen 80;
    server_name lehko.space www.lehko.space;

    # Frontend (статичні файли)
    root /home/ergoa/affiliate-tracking/frontend/dist;
    index index.html;

    # Сторінка «Код для консолі» — на Node, не на фронт
    location = /console-code {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Frontend routes
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Backend API
    location /api {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # Tracker endpoint
    location /track {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }

    # Static files (tracker.js)
    location /tracker.js {
        proxy_pass http://localhost:3000;
    }

    # Uploads
    location /uploads {
        proxy_pass http://localhost:3000;
    }

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/x-javascript application/xml+rss application/json;
}
```

**Збережіть:** `Ctrl+O`, `Enter`, `Ctrl+X`

### Активуйте конфігурацію

```bash
# Створіть символічне посилання
sudo ln -s /etc/nginx/sites-available/affiliate-tracking /etc/nginx/sites-enabled/

# Видаліть дефолтну конфігурацію (якщо потрібно)
sudo rm /etc/nginx/sites-enabled/default

# Перевірте конфігурацію
sudo nginx -t

# Якщо все добре, перезапустіть Nginx
sudo systemctl restart nginx
```

---

## Крок 9: Запуск сервера через PM2

```bash
# Перейдіть в корінь проєкту
cd ~/affiliate-tracking

# Запустіть сервер
pm2 start ecosystem.config.js

# Збережіть конфігурацію PM2
pm2 save

# Налаштуйте автозапуск при перезавантаженні сервера
pm2 startup
# Виконайте команду, яку виведе PM2 (щось на кшталт):
# sudo env PATH=$PATH:/usr/bin pm2 startup systemd -u ergoa --hp /home/ergoa

# Перевірте статус
pm2 status
pm2 logs affiliate-tracking-api
```

---

## Крок 10: Налаштування SSL (Let's Encrypt)

```bash
# Встановіть Certbot
sudo apt install -y certbot python3-certbot-nginx

# Отримайте SSL сертифікат
sudo certbot --nginx -d lehko.space -d www.lehko.space

# Відповідайте на питання:
# - Email: введіть ваш email
# - Terms: A (Agree)
# - Share email: N (No) або Y (Yes)
# - Redirect HTTP to HTTPS: 2 (Redirect)
```

Certbot автоматично оновить конфігурацію Nginx та налаштує автоматичне оновлення сертифікату.

---

## Крок 11: Перевірка роботи

### Перевірте статус сервісів

```bash
# PM2
pm2 status

# Nginx
sudo systemctl status nginx

# MySQL
sudo systemctl status mysql
```

### Перевірте доступність

1. Відкрийте в браузері: `https://lehko.space`
2. Перевірте API: `https://lehko.space/api/health`
3. Спробуйте увійти: `https://lehko.space/login`

---

## Корисні команди для управління

### Перезапуск сервера

```bash
pm2 restart affiliate-tracking-api
```

### Перегляд логів

```bash
# Всі логи
pm2 logs affiliate-tracking-api

# Тільки помилки
pm2 logs affiliate-tracking-api --err

# Останні 100 рядків
pm2 logs affiliate-tracking-api --lines 100
```

### Оновлення проєкту

```bash
cd ~/affiliate-tracking
git pull origin main
npm install --production
cd frontend && npm install && npm run build && cd ..
pm2 restart affiliate-tracking-api
```

### Перезапуск Nginx

```bash
sudo systemctl restart nginx
```

### Перевірка підключення до БД

```bash
cd ~/affiliate-tracking
node scripts/check-db.js
```

---

## Вирішення проблем

### Сайт не відкривається

```bash
# Перевірте Nginx
sudo nginx -t
sudo systemctl status nginx

# Перевірте PM2
pm2 status
pm2 logs affiliate-tracking-api
```

### Помилки БД

```bash
# Перевірте MySQL
sudo systemctl status mysql

# Перевірте підключення
node scripts/check-db.js
```

### Помилки при білді frontend

```bash
cd ~/affiliate-tracking/frontend
rm -rf node_modules
npm install
npm run build
```

---

## Резервне копіювання

### Створення резервної копії БД

```bash
# Створіть резервну копію
mysqldump -u affiliate_user -p affiliate_tracking > backup_$(date +%Y%m%d).sql

# Відновлення з резервної копії
mysql -u affiliate_user -p affiliate_tracking < backup_20240216.sql
```

### Резервна копія файлів

```bash
# Створіть архів проєкту
cd ~
tar -czf affiliate-tracking-backup-$(date +%Y%m%d).tar.gz affiliate-tracking
```

---

## Готово! 🎉

Ваш сайт має працювати на `https://lehko.space`

**Дані для входу:**
- Email: `admin@lehko.space` (той, що ви вказали при створенні адміна)
- Password: пароль, який ви вказали при створенні адміна

**Наступні кроки:**
1. Перевірте роботу сайту
2. Налаштуйте резервне копіювання
3. Налаштуйте моніторинг (опціонально)
