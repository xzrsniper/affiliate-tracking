# 🗄️ Налаштування MySQL на сервері

## Крок 1: Перевірка встановлення MySQL

```bash
# Перевірте, чи MySQL встановлений
mysql --version

# Перевірте статус служби
sudo systemctl status mysql
# або
sudo service mysql status
```

## Крок 2: Вхід в MySQL (без пароля)

Якщо MySQL встановлений, але пароль не встановлений, спробуйте:

```bash
# Варіант 1: Вхід як root без пароля
sudo mysql -u root

# Варіант 2: Якщо не працює, спробуйте
sudo mysql
```

## Крок 3: Встановлення пароля для root (якщо потрібно)

Якщо ви увійшли в MySQL, виконайте:

```sql
-- Встановлення пароля для root
ALTER USER 'root'@'localhost' IDENTIFIED WITH mysql_native_password BY 'ваш_надійний_пароль';

-- Або для MySQL 8.0+
ALTER USER 'root'@'localhost' IDENTIFIED BY 'ваш_надійний_пароль';

-- Оновлення прав
FLUSH PRIVILEGES;

-- Вихід
EXIT;
```

## Крок 4: Створення бази даних та користувача (рекомендовано)

Краще створити окремого користувача для додатку:

```bash
# Вхід в MySQL
sudo mysql -u root
# або якщо встановлений пароль:
mysql -u root -p
```

Потім в MySQL:

```sql
-- Створення бази даних
CREATE DATABASE affiliate_tracking CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Створення користувача
CREATE USER 'affiliate_user'@'localhost' IDENTIFIED BY 'ваш_надійний_пароль';

-- Надання прав
GRANT ALL PRIVILEGES ON affiliate_tracking.* TO 'affiliate_user'@'localhost';

-- Оновлення прав
FLUSH PRIVILEGES;

-- Перевірка
SHOW DATABASES;
SELECT user, host FROM mysql.user;

-- Вихід
EXIT;
```

## Крок 5: Перевірка підключення

```bash
# Спробуйте підключитися з новим користувачем
mysql -u affiliate_user -p
# Введіть пароль

# Якщо підключилися, виконайте:
USE affiliate_tracking;
SHOW TABLES;

# Вихід
EXIT;
```

## Крок 6: Оновлення .env файлу

```bash
nano /var/www/affiliate-tracking/.env
```

Додайте/оновіть:

```env
DB_HOST=localhost
DB_USER=affiliate_user
DB_PASSWORD=ваш_надійний_пароль
DB_NAME=affiliate_tracking
DB_PORT=3306
```

## Якщо не можете увійти в MySQL

### Варіант 1: Скидання пароля root (якщо забули)

```bash
# Зупиніть MySQL
sudo systemctl stop mysql

# Запустіть MySQL в безпечному режимі
sudo mysqld_safe --skip-grant-tables &

# Вхід без пароля
mysql -u root

# В MySQL виконайте:
FLUSH PRIVILEGES;
ALTER USER 'root'@'localhost' IDENTIFIED BY 'новий_пароль';
FLUSH PRIVILEGES;
EXIT;

# Перезапустіть MySQL
sudo systemctl restart mysql
```

### Варіант 2: Переустановка MySQL (якщо нічого не допомагає)

```bash
# Видалення MySQL
sudo apt remove --purge mysql-server mysql-client mysql-common mysql-server-core-* mysql-client-core-*
sudo apt autoremove
sudo apt autoclean

# Видалення конфігурацій
sudo rm -rf /var/lib/mysql
sudo rm -rf /etc/mysql

# Встановлення заново
sudo apt update
sudo apt install mysql-server

# Під час встановлення встановіть пароль для root
```

## Безпека MySQL

```bash
# Запустіть скрипт безпеки (задасть пароль root та видалить тестові БД)
sudo mysql_secure_installation
```

Відповіді на питання:
- Встановити пароль для root? **Y** → введіть пароль
- Видалити анонімних користувачів? **Y**
- Заборонити root login віддалено? **Y**
- Видалити test базу? **Y**
- Перезавантажити таблиці прав? **Y**

## Troubleshooting

### "Access denied for user"
- Перевірте, чи правильний пароль
- Перевірте, чи користувач існує: `SELECT user FROM mysql.user;`
- Перевірте права: `SHOW GRANTS FOR 'affiliate_user'@'localhost';`

### "Can't connect to MySQL server"
- Перевірте, чи MySQL запущений: `sudo systemctl status mysql`
- Перезапустіть: `sudo systemctl restart mysql`
- Перевірте порт: `sudo netstat -tlnp | grep 3306`

### "Unknown database"
- Перевірте, чи база створена: `SHOW DATABASES;`
- Створіть базу: `CREATE DATABASE affiliate_tracking;`

## Швидка команда для створення всього одразу

```bash
sudo mysql <<EOF
CREATE DATABASE IF NOT EXISTS affiliate_tracking CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER IF NOT EXISTS 'affiliate_user'@'localhost' IDENTIFIED BY 'ваш_пароль';
GRANT ALL PRIVILEGES ON affiliate_tracking.* TO 'affiliate_user'@'localhost';
FLUSH PRIVILEGES;
EOF
```

Замініть `ваш_пароль` на реальний пароль!

