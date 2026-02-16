# Як створити .env файли без nano

## Варіант 1: Встановити nano

```bash
sudo apt update
sudo apt install -y nano
```

Після цього використовуйте nano як зазвичай.

---

## Варіант 2: Використати vi або vim

```bash
# Відкрити файл
vi .env
# або
vim .env
```

**Як працювати з vi/vim:**
1. Натисніть `i` для входу в режим редагування
2. Введіть текст
3. Натисніть `Esc` для виходу з режиму редагування
4. Введіть `:wq` та натисніть `Enter` для збереження та виходу
5. Або `:q!` для виходу без збереження

---

## Варіант 3: Створити файл через echo/cat (найпростіший)

### Створення backend/.env

```bash
cd ~/affiliate-tracking

cat > .env << 'EOF'
# Database Configuration
DB_HOST=localhost
DB_PORT=3306
DB_NAME=affiliate_tracking
DB_USER=affiliate_user
DB_PASSWORD=your_password_here

# JWT Secret (згенеруйте випадковий рядок)
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production

# Server Configuration
PORT=3000
NODE_ENV=production

# Admin Configuration
ADMIN_EMAIL=admin@yourdomain.com

# Google OAuth (опціонально)
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
EOF
```

### Створення frontend/.env

```bash
cd ~/affiliate-tracking/frontend

cat > .env << 'EOF'
# API URL (замініть на ваш домен)
VITE_API_URL=https://yourdomain.com

# Google OAuth
VITE_GOOGLE_CLIENT_ID=your_google_client_id

# Telegram
VITE_TELEGRAM_USERNAME=hodunkooo
EOF
```

**Важливо:** Замініть значення на свої перед виконанням команд!

---

## Варіант 4: Створити файл через printf

```bash
# Backend .env
cd ~/affiliate-tracking

printf "# Database Configuration\nDB_HOST=localhost\nDB_PORT=3306\nDB_NAME=affiliate_tracking\nDB_USER=affiliate_user\nDB_PASSWORD=your_password\n\n# JWT Secret\nJWT_SECRET=your-secret-key\n\n# Server\nPORT=3000\nNODE_ENV=production\n\n# Admin\nADMIN_EMAIL=admin@yourdomain.com\n" > .env
```

---

## Варіант 5: Завантажити готові файли через FileZilla

1. Створіть `.env` файли локально на комп'ютері
2. Завантажте їх через FileZilla на сервер
3. Переконайтеся, що файли мають правильні права доступу

---

## Перевірка створених файлів

```bash
# Перевірити вміст .env
cat .env

# Перевірити frontend/.env
cat frontend/.env
```

---

## Редагування існуючих файлів

### Якщо встановили nano:
```bash
nano .env
```

### Якщо використовуєте vi/vim:
```bash
vi .env
# Натисніть 'i' для редагування
# Зробіть зміни
# Натисніть Esc, потім :wq для збереження
```

### Якщо потрібно тільки змінити одне значення:
```bash
# Наприклад, змінити DB_PASSWORD
sed -i 's/DB_PASSWORD=old_password/DB_PASSWORD=new_password/' .env
```

---

## Швидке створення з правильними значеннями

**Спочатку запишіть ваші значення:**
- DB_PASSWORD: ваш_пароль_mysql
- JWT_SECRET: згенеруйте випадковий рядок
- ADMIN_EMAIL: admin@yourdomain.com
- VITE_API_URL: https://yourdomain.com

**Потім виконайте команди з заміною значень:**

```bash
cd ~/affiliate-tracking

# Backend .env
cat > .env << EOF
DB_HOST=localhost
DB_PORT=3306
DB_NAME=affiliate_tracking
DB_USER=affiliate_user
DB_PASSWORD=ВАШ_ПАРОЛЬ_ТУТ
JWT_SECRET=$(openssl rand -hex 32)
PORT=3000
NODE_ENV=production
ADMIN_EMAIL=admin@yourdomain.com
EOF

# Frontend .env
cd frontend
cat > .env << EOF
VITE_API_URL=https://yourdomain.com
VITE_GOOGLE_CLIENT_ID=ваш_google_client_id
VITE_TELEGRAM_USERNAME=hodunkooo
EOF
cd ..
```

**Замініть:**
- `ВАШ_ПАРОЛЬ_ТУТ` на пароль MySQL
- `yourdomain.com` на ваш домен
- `ваш_google_client_id` на Google Client ID (якщо є)
