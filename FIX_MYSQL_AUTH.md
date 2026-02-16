# Виправлення: MySQL приймає пароль вручну, але не через Node.js

## Проблема: Пароль працює вручну, але не через Node.js

Це зазвичай через auth plugin MySQL (caching_sha2_password vs mysql_native_password).

## Рішення:

### Крок 1: Перевірте auth plugin для root

```bash
sudo mysql -u root -pVanua123.
```

**В MySQL виконайте:**

```sql
-- Перевірте auth plugin
SELECT user, host, plugin FROM mysql.user WHERE user = 'root';

-- Якщо plugin = 'caching_sha2_password', змініть на mysql_native_password
ALTER USER 'root'@'localhost' IDENTIFIED WITH mysql_native_password BY 'Vanua123.';
FLUSH PRIVILEGES;

-- Перевірте знову
SELECT user, host, plugin FROM mysql.user WHERE user = 'root';

EXIT;
```

### Крок 2: Перевірте .env файл

```bash
cd ~/affiliate-tracking

# Перевірте вміст .env
cat .env

# Переконайтеся, що пароль правильний (без зайвих пробілів)
# DB_PASSWORD=Vanua123.
```

### Крок 3: Перевірте, чи правильно читається .env

```bash
cd ~/affiliate-tracking

# Тестовий скрипт
node -e "
require('dotenv').config();
console.log('DB_USER:', process.env.DB_USER);
console.log('DB_PASSWORD:', process.env.DB_PASSWORD);
console.log('DB_PASSWORD length:', process.env.DB_PASSWORD?.length);
"
```

### Крок 4: Якщо все ще не працює, створіть нового користувача

```bash
sudo mysql -u root -pVanua123.
```

**В MySQL:**

```sql
-- Створити користувача з mysql_native_password
CREATE USER 'affiliate_user'@'localhost' IDENTIFIED WITH mysql_native_password BY 'SimplePass123!';

-- Надати права
GRANT ALL PRIVILEGES ON affiliate_tracking.* TO 'affiliate_user'@'localhost';

FLUSH PRIVILEGES;

EXIT;
```

**Оновіть .env:**

```bash
cd ~/affiliate-tracking

cat > .env << EOF
DB_HOST=localhost
DB_PORT=3306
DB_NAME=affiliate_tracking
DB_USER=affiliate_user
DB_PASSWORD=SimplePass123!

JWT_SECRET=$(openssl rand -hex 32)
PORT=3000
NODE_ENV=production
ADMIN_EMAIL=admin@yourdomain.com
EOF
```

---

## Швидке виправлення (всі кроки разом):

```bash
# 1. Підключіться до MySQL
sudo mysql -u root -pVanua123.

# В MySQL виконайте:
# ALTER USER 'root'@'localhost' IDENTIFIED WITH mysql_native_password BY 'Vanua123.';
# FLUSH PRIVILEGES;
# EXIT;

# 2. Перевірте .env
cd ~/affiliate-tracking
cat .env | grep DB_PASSWORD

# 3. Перевірте підключення
node scripts/check-db.js
```

---

## Альтернатива: Використати connection string

Якщо все ще не працює, можна спробувати інший спосіб підключення в коді, але спочатку спробуйте змінити auth plugin.
