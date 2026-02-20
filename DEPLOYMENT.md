# Інструкція з деплою на хостинг

## Підготовка до деплою

### 1. Збірка проєкту локально (опціонально, для перевірки)

```bash
# Backend залежності
npm install --production

# Frontend залежності та білд
cd frontend
npm install
npm run build
cd ..
```

### 2. Підготовка файлів для завантаження

**Файли, які потрібно завантажити на сервер:**
- Вся папка `affiliate-tracking-main` (крім `node_modules` та `.env`)
- Або створіть архів без `node_modules` та `.env`:
  ```bash
  # На Windows (PowerShell)
  Compress-Archive -Path * -Exclude node_modules,frontend/node_modules,.env,frontend/.env -DestinationPath deploy.zip
  ```

## Варіанти деплою

### Варіант 1: VPS/Сервер з SSH доступом (рекомендовано)

#### Крок 1: Підключення до сервера

```bash
ssh username@your-server-ip
```

#### Крок 2: Встановлення необхідного ПЗ

```bash
# Оновлення системи
sudo apt update && sudo apt upgrade -y

# Node.js (версія 18 або новіша)
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# MySQL
sudo apt install -y mysql-server
sudo mysql_secure_installation

# PM2 (для управління процесами)
sudo npm install -g pm2

# Nginx (для проксі та статичних файлів)
sudo apt install -y nginx
```

#### Крок 3: Завантаження файлів на сервер

```bash
# На локальному комп'ютері
scp -r affiliate-tracking-main username@your-server-ip:/home/username/

# Або через SFTP клієнт (FileZilla, WinSCP)
```

#### Крок 4: Налаштування на сервері

```bash
# Перейти в директорію проєкту
cd /home/username/affiliate-tracking-main

# Створити .env файл
nano .env
```

**Вміст .env файлу:**
```env
# Database Configuration
DB_HOST=localhost
DB_PORT=3306
DB_NAME=affiliate_tracking
DB_USER=root
DB_PASSWORD=your_mysql_password

# JWT Secret (згенеруйте випадковий рядок)
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production

# Server Configuration
PORT=3000
NODE_ENV=production

# Admin Configuration
ADMIN_EMAIL=admin@example.com

# Google OAuth (опціонально)
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
```

**Створити .env для frontend:**
```bash
cd frontend
nano .env
```

**Вміст frontend/.env:**
```env
# API URL (замініть на ваш домен)
VITE_API_URL=https://yourdomain.com

# Google OAuth
VITE_GOOGLE_CLIENT_ID=your_google_client_id

# Telegram
VITE_TELEGRAM_USERNAME=hodunkooo
```

#### Крок 5: Налаштування бази даних

```bash
# Підключитися до MySQL
sudo mysql -u root -p

# Створити базу даних
CREATE DATABASE affiliate_tracking;
CREATE USER 'affiliate_user'@'localhost' IDENTIFIED BY 'strong_password';
GRANT ALL PRIVILEGES ON affiliate_tracking.* TO 'affiliate_user'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

#### Крок 6: Встановлення залежностей та білд

```bash
# Backend залежності
npm install --production

# Frontend залежності та білд
cd frontend
npm install
npm run build
cd ..
```

#### Крок 7: Ініціалізація бази даних

```bash
# Створити таблиці
node scripts/init-db.js

# Створити адміністратора
node scripts/create-admin.js admin@example.com your_password
```

#### Крок 8: Налаштування Nginx

```bash
sudo nano /etc/nginx/sites-available/affiliate-tracking
```

**Конфігурація Nginx:**
```nginx
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;

    # Сторінка «Код для консолі» — проксувати на Node
    location = /console-code {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Frontend (статичні файли)
    location / {
        root /home/username/affiliate-tracking-main/frontend/dist;
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
}
```

**Активувати конфігурацію:**
```bash
sudo ln -s /etc/nginx/sites-available/affiliate-tracking /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

#### Крок 9: Запуск через PM2

```bash
# Запустити сервер
pm2 start ecosystem.config.js

# Зберегти конфігурацію PM2
pm2 save

# Налаштувати автозапуск при перезавантаженні
pm2 startup
# Виконайте команду, яку виведе PM2

# Перевірити статус
pm2 status
pm2 logs affiliate-tracking-api
```

#### Крок 10: Налаштування SSL (Let's Encrypt)

```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
```

### Варіант 2: Shared Hosting (cPanel, Plesk тощо)

#### Крок 1: Завантаження файлів

1. Завантажте файли через FTP/SFTP в папку `public_html` або `www`
2. Створіть структуру:
   ```
   public_html/
   ├── frontend/          (статичні файли з frontend/dist)
   └── backend/           (backend файли)
   ```

#### Крок 2: Налаштування .htaccess для frontend

Створіть файл `public_html/.htaccess`:
```apache
<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteBase /
  RewriteRule ^index\.html$ - [L]
  RewriteCond %{REQUEST_FILENAME} !-f
  RewriteCond %{REQUEST_FILENAME} !-d
  RewriteRule . /index.html [L]
</IfModule>
```

#### Крок 3: Налаштування бази даних

1. Створіть базу даних через панель управління хостингом
2. Запишіть дані для підключення

#### Крок 4: Налаштування Node.js (якщо підтримується)

Деякі хостинги підтримують Node.js через панель управління:
1. Створіть Node.js додаток в панелі
2. Вкажіть стартовий файл: `server.js`
3. Встановіть змінні оточення через панель

### Варіант 3: Cloud платформи (Render, Heroku, Railway)

#### Render.com

1. Підключіть GitHub репозиторій
2. Створіть два сервіси:
   - **Backend**: використайте `render.yaml` з проєкту
   - **Frontend**: Static Site з папки `frontend/dist`
3. Налаштуйте змінні оточення в панелі

#### Railway.app

1. Підключіть GitHub репозиторій
2. Створіть два сервіси:
   - Backend: вкажіть root директорію
   - Frontend: вкажіть `frontend` директорію
3. Налаштуйте змінні оточення

## Після деплою

### Перевірка роботи

1. Перевірте, чи працює frontend: `https://yourdomain.com`
2. Перевірте API: `https://yourdomain.com/api/health`
3. Перевірте вхід: `https://yourdomain.com/login`

### Оновлення сайту

```bash
# На сервері
cd /home/username/affiliate-tracking-main
git pull  # якщо використовуєте Git
# або завантажте нові файли

# Перезапустити
pm2 restart affiliate-tracking-api

# Перебілдити frontend (якщо змінився)
cd frontend
npm run build
cd ..
```

## Важливі примітки

1. **Безпека:**
   - Змініть `JWT_SECRET` на випадковий рядок
   - Використовуйте сильні паролі для БД
   - Налаштуйте firewall
   - Використовуйте HTTPS

2. **Продуктивність:**
   - Налаштуйте кешування в Nginx
   - Використовуйте CDN для статичних файлів
   - Налаштуйте моніторинг (PM2 Plus, Sentry)

3. **Резервне копіювання:**
   - Налаштуйте автоматичне резервне копіювання БД
   - Зберігайте копії `.env` файлів

## Підтримка

Якщо виникли проблеми:
1. Перевірте логи: `pm2 logs affiliate-tracking-api`
2. Перевірте логи Nginx: `sudo tail -f /var/log/nginx/error.log`
3. Перевірте підключення до БД: `node scripts/check-db.js`
