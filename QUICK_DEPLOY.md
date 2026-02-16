# Швидкий деплой - покрокова інструкція

## Який у вас тип хостингу?

### 1. VPS/Сервер з SSH (Ubuntu/Debian)

**Крок 1:** Підключіться до сервера
```bash
ssh username@your-server-ip
```

**Крок 2:** Встановіть Node.js та MySQL (якщо ще не встановлено)
```bash
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs mysql-server
sudo npm install -g pm2
```

**Крок 3:** Завантажте файли на сервер
- Через SFTP (FileZilla, WinSCP) завантажте всю папку `affiliate-tracking-main`
- Або через Git: `git clone your-repo-url`

**Крок 4:** Налаштуйте .env файли
```bash
cd affiliate-tracking-main
nano .env  # Додайте налаштування БД та JWT_SECRET
cd frontend
nano .env  # Додайте VITE_API_URL=https://yourdomain.com
```

**Крок 5:** Встановіть залежності та зробіть білд
```bash
cd /path/to/affiliate-tracking-main
npm install --production
cd frontend
npm install
npm run build
cd ..
```

**Крок 6:** Налаштуйте базу даних
```bash
sudo mysql -u root -p
# Створіть БД та користувача
CREATE DATABASE affiliate_tracking;
CREATE USER 'db_user'@'localhost' IDENTIFIED BY 'password';
GRANT ALL ON affiliate_tracking.* TO 'db_user'@'localhost';
FLUSH PRIVILEGES;
EXIT;

# Створіть таблиці
node scripts/init-db.js

# Створіть адміністратора
node scripts/create-admin.js admin@example.com password123
```

**Крок 7:** Налаштуйте Nginx
```bash
sudo nano /etc/nginx/sites-available/affiliate-tracking
# Скопіюйте конфігурацію з DEPLOYMENT.md
sudo ln -s /etc/nginx/sites-available/affiliate-tracking /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

**Крок 8:** Запустіть сервер
```bash
pm2 start ecosystem.config.js
pm2 save
pm2 startup  # Налаштуйте автозапуск
```

**Крок 9:** Налаштуйте SSL
```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d yourdomain.com
```

---

### 2. Shared Hosting (cPanel)

**Крок 1:** Завантажте файли через FTP
- Завантажте вміст `frontend/dist` в `public_html`
- Завантажте backend файли в окрему папку (якщо підтримується Node.js)

**Крок 2:** Створіть базу даних через cPanel
- MySQL Databases → Create Database
- Запишіть дані для підключення

**Крок 3:** Налаштуйте .env файли через File Manager
- Створіть `.env` в корені backend
- Створіть `.env` в `frontend` (якщо потрібно)

**Крок 4:** Якщо підтримується Node.js
- Створіть Node.js додаток в cPanel
- Вкажіть стартовий файл: `server.js`
- Встановіть змінні оточення

---

### 3. Cloud платформи (Render, Railway, Heroku)

**Render.com:**
1. Підключіть GitHub репозиторій
2. Створіть Web Service для backend
3. Створіть Static Site для frontend (з папки `frontend/dist`)
4. Налаштуйте змінні оточення

**Railway.app:**
1. Підключіть GitHub
2. Створіть два сервіси (backend + frontend)
3. Налаштуйте змінні оточення

---

## Найважливіші налаштування

### Backend .env
```env
NODE_ENV=production
PORT=3000
DB_HOST=localhost
DB_NAME=affiliate_tracking
DB_USER=your_user
DB_PASSWORD=your_password
JWT_SECRET=random-secret-string-here
ADMIN_EMAIL=admin@yourdomain.com
```

### Frontend .env
```env
VITE_API_URL=https://yourdomain.com
VITE_GOOGLE_CLIENT_ID=your_google_client_id
VITE_TELEGRAM_USERNAME=hodunkooo
```

## Перевірка після деплою

1. Відкрийте `https://yourdomain.com` - має відкритися сайт
2. Перевірте API: `https://yourdomain.com/api/health`
3. Спробуйте увійти: `https://yourdomain.com/login`

## Проблеми?

- **Сайт не відкривається:** Перевірте Nginx/Apache конфігурацію
- **API не працює:** Перевірте логи PM2: `pm2 logs`
- **Помилки БД:** Перевірте підключення: `node scripts/check-db.js`
- **Frontend не завантажується:** Перевірте, чи зроблено білд: `npm run build` в папці frontend

## Потрібна допомога?

Напишіть мені:
- Тип хостингу
- Чи є SSH доступ
- Які помилки виникають
- Логи з сервера
