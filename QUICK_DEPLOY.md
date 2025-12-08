# 🚀 Швидкий деплой на сервер

## Що потрібно зробити:

### 1. Підключіться до сервера по SSH
```bash
ssh user@your-server-ip
```

### 2. Завантажте код на сервер
```bash
# Створіть директорію
sudo mkdir -p /var/www/affiliate-tracking
sudo chown -R $USER:$USER /var/www/affiliate-tracking

# Завантажте код (через git або scp)
cd /var/www/affiliate-tracking
# git clone ваш-репозиторій .
# АБО через scp з вашого комп'ютера
```

### 3. Встановіть залежності
```bash
cd /var/www/affiliate-tracking
npm install --production
cd frontend && npm install && npm run build && cd ..
```

### 4. Налаштуйте базу даних
```bash
sudo mysql
CREATE DATABASE affiliate_tracking;
CREATE USER 'affiliate_user'@'localhost' IDENTIFIED BY 'ваш_пароль';
GRANT ALL PRIVILEGES ON affiliate_tracking.* TO 'affiliate_user'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

### 5. Створіть .env файл
```bash
nano .env
```
Додайте:
```
NODE_ENV=production
PORT=3000
DB_HOST=localhost
DB_USER=affiliate_user
DB_PASSWORD=ваш_пароль
DB_NAME=affiliate_tracking
DB_PORT=3306
JWT_SECRET=випадковий_секрет_32+_символів
ADMIN_EMAIL=ваш@email.com
```

### 6. Ініціалізуйте БД
```bash
npm run db:init
```

### 7. Налаштуйте Nginx
```bash
# Скопіюйте конфігурацію
sudo cp nginx.conf.example /etc/nginx/sites-available/your-domain.com

# Відредагуйте (замініть your-domain.com на ваш домен)
sudo nano /etc/nginx/sites-available/your-domain.com

# Активуйте
sudo ln -s /etc/nginx/sites-available/your-domain.com /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### 8. Встановіть SSL
```bash
sudo certbot --nginx -d your-domain.com -d www.your-domain.com
```

### 9. Запустіть через PM2
```bash
# Встановіть PM2 якщо ще не встановлено
sudo npm install -g pm2

# Запустіть
pm2 start ecosystem.config.js
pm2 save
pm2 startup  # виконайте команду, яку виведе
```

### 10. Перевірте
- Відкрийте https://your-domain.com
- Перевірте API: https://your-domain.com/api/health
- Перевірте логи: `pm2 logs affiliate-tracking-api`

## Якщо щось не працює:

- **Помилка підключення до БД**: перевірте `.env` та права користувача MySQL
- **PM2 не запускається**: `pm2 logs` для перегляду помилок
- **Nginx помилки**: `sudo nginx -t` та `sudo tail -f /var/log/nginx/error.log`
- **Порт зайнятий**: `lsof -i :3000` для перевірки

