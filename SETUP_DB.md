# Налаштування бази даних

## Варіант 1: Автоматичне налаштування (з паролем)

Якщо у вас є пароль для MySQL root:

```bash
npm run db:full-setup
```

Скрипт запитає пароль та створить БД та таблиці автоматично.

## Варіант 2: Вручну через MySQL CLI

1. Підключіться до MySQL:
```bash
mysql -u root -p
```

2. Створіть базу даних:
```sql
CREATE DATABASE affiliate_tracking;
exit;
```

3. Налаштуйте `.env` файл:
```bash
# Створіть .env файл в корені проєкту:
DB_HOST=localhost
DB_PORT=3306
DB_NAME=affiliate_tracking
DB_USER=root
DB_PASSWORD=ваш_пароль
JWT_SECRET=your-secret-key-here
PORT=3000
NODE_ENV=development
```

4. Ініціалізуйте таблиці:
```bash
npm run db:init
```

5. Створіть адміністратора:
```bash
npm run create-admin admin@example.com password123
```

## Варіант 3: Через SQL файл

```bash
mysql -u root -p < scripts/create-database.sql
```

Потім налаштуйте `.env` та запустіть `npm run db:init`.

## Перевірка

Після створення БД перевірте:

```bash
mysql -u root -p -e "SHOW DATABASES LIKE 'affiliate_tracking';"
```

Якщо бачите `affiliate_tracking` - БД створена успішно!
