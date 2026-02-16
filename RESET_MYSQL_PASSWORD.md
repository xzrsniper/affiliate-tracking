# Скидання/встановлення пароля MySQL root

## Проблема: Access denied for user 'root'@'localhost'

Це означає, що пароль root неправильний або не встановлений.

## Рішення:

### Крок 1: Перевірте, чи працює MySQL

```bash
sudo systemctl status mysql
```

Якщо не працює, запустіть:
```bash
sudo systemctl start mysql
```

### Крок 2: Спробуйте підключитися без пароля

```bash
sudo mysql
```

Якщо це працює, значить root не має пароля або використовує auth_socket.

### Крок 3: Встановіть/змініть пароль root

**Якщо підключення через `sudo mysql` працює:**

```sql
-- В MySQL виконайте:
ALTER USER 'root'@'localhost' IDENTIFIED WITH mysql_native_password BY 'Vanua123.';
FLUSH PRIVILEGES;
EXIT;
```

**Або створіть нового користувача:**

```sql
CREATE USER 'root'@'localhost' IDENTIFIED BY 'Vanua123.';
GRANT ALL PRIVILEGES ON *.* TO 'root'@'localhost' WITH GRANT OPTION;
FLUSH PRIVILEGES;
EXIT;
```

### Крок 4: Оновіть .env файл

```bash
cd ~/affiliate-tracking

cat > .env << EOF
DB_HOST=localhost
DB_PORT=3306
DB_NAME=affiliate_tracking
DB_USER=root
DB_PASSWORD=Vanua123.

JWT_SECRET=$(openssl rand -hex 32)
PORT=3000
NODE_ENV=production
ADMIN_EMAIL=admin@yourdomain.com
EOF
```

### Крок 5: Перевірте підключення

```bash
node scripts/check-db.js
```

---

## Альтернатива: Створити базу даних та користувача з нуля

```bash
sudo mysql
```

**В MySQL:**

```sql
-- Створити базу даних
CREATE DATABASE IF NOT EXISTS affiliate_tracking CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Створити користувача з простим паролем
CREATE USER 'affiliate_user'@'localhost' IDENTIFIED BY 'SimplePass123!';

-- Надати права
GRANT ALL PRIVILEGES ON affiliate_tracking.* TO 'affiliate_user'@'localhost';

-- Застосувати
FLUSH PRIVILEGES;

-- Перевірити
SHOW DATABASES;
SELECT user, host FROM mysql.user WHERE user = 'affiliate_user';

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

## Якщо нічого не працює: Скидання пароля root

```bash
# Зупинити MySQL
sudo systemctl stop mysql

# Запустити MySQL в безпечному режимі
sudo mysqld_safe --skip-grant-tables --skip-networking &

# Підключитися без пароля
mysql -u root

# В MySQL:
FLUSH PRIVILEGES;
ALTER USER 'root'@'localhost' IDENTIFIED BY 'Vanua123.';
FLUSH PRIVILEGES;
EXIT;

# Зупинити безпечний режим
sudo pkill mysqld

# Запустити MySQL нормально
sudo systemctl start mysql
```

---

## Швидке виправлення (рекомендовано):

```bash
# 1. Спробуйте підключитися без пароля
sudo mysql

# 2. Якщо працює, встановіть пароль:
# ALTER USER 'root'@'localhost' IDENTIFIED BY 'Vanua123.';
# FLUSH PRIVILEGES;
# EXIT;

# 3. Оновіть .env
cd ~/affiliate-tracking
cat > .env << EOF
DB_HOST=localhost
DB_PORT=3306
DB_NAME=affiliate_tracking
DB_USER=root
DB_PASSWORD=Vanua123.

JWT_SECRET=$(openssl rand -hex 32)
PORT=3000
NODE_ENV=production
ADMIN_EMAIL=admin@yourdomain.com
EOF

# 4. Створіть базу даних
sudo mysql -u root -pVanua123. -e "CREATE DATABASE IF NOT EXISTS affiliate_tracking;"

# 5. Перевірте
node scripts/check-db.js
```
