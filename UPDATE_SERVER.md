# 🔄 Оновлення файлів на сервері

## Варіант 1: Через GitHub (якщо використовуєте git)

### На локальному комп'ютері:

```bash
cd /Users/ivanivanuk/Documents/DashCurs

# Додайте зміни
git add ecosystem.config.js

# Закомітьте
git commit -m "Fix PM2 configuration"

# Відправте на GitHub
git push origin main
```

### На сервері:

```bash
# Підключіться до сервера
ssh user@your-server-ip

# Перейдіть в директорію проекту
cd /var/www/affiliate-tracking

# Якщо є локальні зміни, збережіть їх або відкиньте
# Варіант 1: Зберегти зміни (stash)
git stash

# Варіант 2: Відкинути локальні зміни (якщо вони не потрібні)
# git checkout -- frontend/src/components/Layout.jsx frontend/src/pages/Landing.jsx

# Оновіть код з GitHub
git pull origin main

# Якщо використовували stash, можна застосувати зміни назад (опціонально)
# git stash pop

# ВАЖЛИВО: Перебудуйте frontend після оновлення (якщо були зміни в frontend)
cd frontend
npm install  # Якщо додалися нові залежності
npm run build  # Перебудуйте frontend
cd ..

# Переконайтеся що logo.png завантажений на сервер
# Перевірте чи файл існує:
ls -la frontend/public/logo.png

# Якщо файлу немає, завантажте його з локального комп'ютера:
# scp /Users/ivanivanuk/Documents/DashCurs/frontend/public/logo.png root@your-server-ip:/var/www/affiliate-tracking/frontend/public/

# Пересберіть frontend (якщо використовується build)
cd frontend
npm install
npm run build
cd ..

# Перезапустіть PM2
pm2 restart affiliate-tracking-api

# Очистіть кеш браузера (Ctrl+Shift+R або Cmd+Shift+R)
```

---

## Варіант 2: Через SCP (швидко, без git)

### З локального комп'ютера:

```bash
# Скопіюйте файл на сервер
scp /Users/ivanivanuk/Documents/DashCurs/ecosystem.config.js user@your-server-ip:/var/www/affiliate-tracking/

# На сервері перезапустіть PM2
ssh user@your-server-ip "cd /var/www/affiliate-tracking && pm2 restart affiliate-tracking-api"
```

---

## ⚠️ Важливо: Завантаження логотипу на сервер

Якщо логотип не відображається на сервері, завантажте файли:

```bash
# Завантажте logo.png
scp /Users/ivanivanuk/Documents/DashCurs/frontend/public/logo.png root@your-server-ip:/var/www/affiliate-tracking/frontend/public/

# Завантажте apple-touch-icon.png (якщо є)
scp /Users/ivanivanuk/Documents/DashCurs/frontend/public/apple-touch-icon.png root@your-server-ip:/var/www/affiliate-tracking/frontend/public/

# На сервері пересберіть frontend
ssh root@your-server-ip "cd /var/www/affiliate-tracking/frontend && npm run build"

# Перезапустіть PM2
ssh root@your-server-ip "cd /var/www/affiliate-tracking && pm2 restart affiliate-tracking-api"
```

---

## Варіант 3: Вручну на сервері (найшвидше)

### На сервері:

```bash
# Підключіться до сервера
ssh user@your-server-ip

# Перейдіть в директорію
cd /var/www/affiliate-tracking

# Відредагуйте файл
nano ecosystem.config.js
```

**Замініть вміст на:**

```javascript
module.exports = {
  apps: [{
    name: 'affiliate-tracking-api',
    script: './server.js',
    instances: 1,
    exec_mode: 'fork',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    error_file: './logs/pm2-error.log',
    out_file: './logs/pm2-out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    merge_logs: true,
    autorestart: true,
    max_memory_restart: '500M',
    watch: false,
    interpreter: 'node',
    interpreter_args: '--experimental-modules'
  }]
};
```

**Збережіть:** `Ctrl+O`, `Enter`, `Ctrl+X`

**Перезапустіть PM2:**
```bash
pm2 delete all
pm2 start ecosystem.config.js
pm2 save
```

---

## Варіант 4: Одна команда (якщо маєте доступ)

```bash
# На сервері
cd /var/www/affiliate-tracking && \
cat > ecosystem.config.js << 'EOF'
module.exports = {
  apps: [{
    name: 'affiliate-tracking-api',
    script: './server.js',
    instances: 1,
    exec_mode: 'fork',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    error_file: './logs/pm2-error.log',
    out_file: './logs/pm2-out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    merge_logs: true,
    autorestart: true,
    max_memory_restart: '500M',
    watch: false,
    interpreter: 'node',
    interpreter_args: '--experimental-modules'
  }]
};
EOF
pm2 restart ecosystem.config.js
```

---

## Після оновлення

```bash
# Перевірте статус
pm2 status

# Перевірте логи
pm2 logs affiliate-tracking-api

# Перевірте API
curl http://localhost:3000/health
```

---

## Який варіант обрати?

- **Варіант 1** - якщо використовуєте GitHub для деплою (рекомендовано)
- **Варіант 2** - якщо потрібно швидко оновити один файл
- **Варіант 3** - якщо немає доступу до git або GitHub
- **Варіант 4** - найшвидший, якщо знаєте команди

---

## 🔧 Вирішення проблем

### Проблема: Логотип не відображається після оновлення

**Рішення:**
```bash
# На сервері
cd /var/www/affiliate-tracking

# Переконайтеся, що файли логотипу є
ls -la frontend/public/logo.png
ls -la frontend/public/apple-touch-icon.png

# Переконайтеся, що файли скопійовані в dist після build
ls -la frontend/dist/logo.png
ls -la frontend/dist/apple-touch-icon.png

# Якщо файлів немає в dist, скопіюйте їх вручну:
cp frontend/public/logo.png frontend/dist/
cp frontend/public/apple-touch-icon.png frontend/dist/

# Перебудуйте frontend (ВАЖЛИВО!)
cd frontend
npm run build
cd ..

# Перевірте, що файли є в dist після build
ls -la frontend/dist/logo.png

# Перезапустіть сервер
pm2 restart affiliate-tracking-api

# Очистіть кеш браузера (Ctrl+Shift+R або Cmd+Shift+R)
# АБО відкрийте в режимі інкогніто для перевірки
```

### Проблема: "Failed to load links" на Dashboard

**Можливі причини:**
1. Проблема з підключенням до бази даних
2. Неправильний API URL
3. Проблема з авторизацією

**Рішення:**
```bash
# Перевірте логи сервера
pm2 logs affiliate-tracking-api --lines 50

# Перевірте підключення до бази даних
cd /var/www/affiliate-tracking
node -e "require('./config/database.js').default.authenticate().then(() => console.log('DB OK')).catch(e => console.error('DB Error:', e))"

# Перевірте API
curl http://localhost:3000/health

# Перевірте змінні оточення
cat .env | grep -E "(DB_|JWT_|PORT)"
```

**Якщо проблема з API URL на frontend:**
```bash
# Перевірте файл конфігурації frontend
cat frontend/dist/index.html | grep -i "api"

# Перебудуйте frontend з правильним API URL
cd frontend
# Переконайтеся, що .env.production містить правильний VITE_API_URL
cat .env.production
npm run build
cd ..
pm2 restart affiliate-tracking-api
```

### Проблема: "Login failed" або "Failed to load links"

**Можливі причини:**
1. Проблема з підключенням до бази даних
2. Неправильний API URL на frontend
3. Відсутній або неправильний JWT_SECRET
4. Користувач не існує в базі даних

**Діагностика:**
```bash
# 1. Перевірте підключення до бази даних
cd /var/www/affiliate-tracking
node -e "
const sequelize = require('./config/database.js').default;
sequelize.authenticate()
  .then(() => console.log('✅ База даних підключена'))
  .catch(err => console.error('❌ Помилка БД:', err.message));
"

# 2. Перевірте змінні оточення
cat .env | grep -E "(DB_|JWT_|PORT)" | sed 's/=.*/=***/'  # Приховати паролі

# 3. Перевірте чи працює API
curl http://localhost:3000/health
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"test123"}'

# 4. Перевірте логи сервера
pm2 logs affiliate-tracking-api --lines 100 | grep -i "error\|login\|auth"

# 5. Перевірте чи є користувач в базі
node -e "
const { User } = require('./models/index.js');
User.findAll({ limit: 5 })
  .then(users => {
    console.log('Користувачі в БД:', users.length);
    users.forEach(u => console.log('  -', u.email, u.role));
  })
  .catch(err => console.error('Помилка:', err.message));
"
```

**Рішення:**

1. **Якщо проблема з БД:**
```bash
# Перевірте налаштування БД в .env
nano .env
# Переконайтеся що є:
# DB_HOST=localhost
# DB_NAME=your_database
# DB_USER=your_user
# DB_PASS=your_password

# Перезапустіть сервер
pm2 restart affiliate-tracking-api
```

2. **Якщо проблема з API URL на frontend:**
```bash
# Створіть .env.production в frontend
cd /var/www/affiliate-tracking/frontend
cat > .env.production << EOF
VITE_API_URL=http://your-server-ip:3000
# АБО якщо використовуєте домен:
# VITE_API_URL=https://your-domain.com:3000
EOF

# Перебудуйте frontend
npm run build
cd ..
pm2 restart affiliate-tracking-api
```

3. **Якщо відсутній JWT_SECRET:**
```bash
# Додайте JWT_SECRET в .env
cd /var/www/affiliate-tracking
echo "JWT_SECRET=$(openssl rand -base64 32)" >> .env

# Перезапустіть сервер
pm2 restart affiliate-tracking-api
```

4. **Якщо користувач не існує:**
```bash
# Створіть користувача через скрипт
cd /var/www/affiliate-tracking
node scripts/create-admin.js
# АБО створити через реєстрацію на сайті
```

### Проблема: "Cannot find package 'multer'"

**Рішення:**
```bash
# Встановіть відсутні залежності
cd /var/www/affiliate-tracking
npm install

# Перезапустіть сервер
pm2 restart affiliate-tracking-api
```

### Проблема: "Table 'page_structures' doesn't exist"

**Рішення:**
```bash
# Створіть таблиці для візуального редактора
cd /var/www/affiliate-tracking

# Створіть таблицю page_structures
node scripts/create-page-structure-table.js

# Створіть таблицю page_contents (якщо потрібно)
node scripts/create-page-content-table.js

# Перезапустіть сервер
pm2 restart affiliate-tracking-api
```

### Проблема: "Unknown column 'order_id' in 'field list'"

**Рішення:**
```bash
# Додайте колонку order_id в таблицю conversions
cd /var/www/affiliate-tracking

# Дізнайтеся дані з .env файлу:
DB_USER=$(grep "^DB_USER=" .env | cut -d '=' -f2 | tr -d ' ' || echo "root")
DB_NAME=$(grep "^DB_NAME=" .env | cut -d '=' -f2 | tr -d ' ' || echo "affiliate_tracking")
DB_PASS=$(grep "^DB_PASSWORD=" .env | cut -d '=' -f2 | tr -d ' ' || echo "")

# Виконайте команду:
if [ -n "$DB_PASS" ]; then
  mysql -u "$DB_USER" -p"$DB_PASS" "$DB_NAME" << EOF
ALTER TABLE conversions ADD COLUMN order_id VARCHAR(255) NULL AFTER order_value;
CREATE INDEX idx_conversions_order_id ON conversions(order_id);
EOF
else
  echo "Введіть пароль MySQL:"
  mysql -u "$DB_USER" -p "$DB_NAME" << EOF
ALTER TABLE conversions ADD COLUMN order_id VARCHAR(255) NULL AFTER order_value;
CREATE INDEX idx_conversions_order_id ON conversions(order_id);
EOF
fi

# АБО вручну (якщо автоматично не працює):
# mysql -u root -p affiliate_tracking
# Потім в MySQL виконайте:
# ALTER TABLE conversions ADD COLUMN order_id VARCHAR(255) NULL AFTER order_value;
# CREATE INDEX idx_conversions_order_id ON conversions(order_id);
# exit;

# Якщо колонка вже існує, ви побачите помилку "Duplicate column name"
# Це нормально - просто ігноруйте помилку

# АБО використайте скрипт (якщо є)
node scripts/add-order-id-field.js

# Перезапустіть сервер
pm2 restart affiliate-tracking-api
```

### Проблема: "Illegal arguments: string, object" в bcrypt.compare

**Це означає, що password_hash в БД має неправильний формат.**

**Рішення:**
```bash
# Перевірте формат password_hash в БД
# Дізнайтеся дані з .env:
DB_USER=$(grep DB_USER .env | cut -d '=' -f2 | tr -d ' ')
DB_NAME=$(grep DB_NAME .env | cut -d '=' -f2 | tr -d ' ')
DB_PASS=$(grep DB_PASSWORD .env | cut -d '=' -f2 | tr -d ' ')

mysql -u ${DB_USER:-root} -p${DB_PASS} ${DB_NAME:-affiliate_tracking} -e "SELECT id, email, password_hash, LENGTH(password_hash) as hash_length FROM users LIMIT 5;"

# Якщо password_hash не рядок, потрібно пересоздати паролі користувачів
# АБО створити нового користувача через реєстрацію
```

**Швидке вирішення всіх проблем одразу:**
```bash
cd /var/www/affiliate-tracking

# 1. Встановіть залежності
npm install

# 2. Створіть таблиці для візуального редактора (якщо їх немає)
node scripts/create-page-structure-table.js
node scripts/create-page-content-table.js

# 3. Додайте order_id в таблицю conversions (якщо потрібно)
# Варіант А: Автоматично (читає з .env)
DB_USER=$(grep "^DB_USER=" .env | cut -d '=' -f2 | tr -d ' ' || echo "root")
DB_NAME=$(grep "^DB_NAME=" .env | cut -d '=' -f2 | tr -d ' ' || echo "affiliate_tracking")
DB_PASS=$(grep "^DB_PASSWORD=" .env | cut -d '=' -f2 | tr -d ' ' || echo "")

if [ -n "$DB_PASS" ]; then
  mysql -u "$DB_USER" -p"$DB_PASS" "$DB_NAME" << EOF
ALTER TABLE conversions ADD COLUMN order_id VARCHAR(255) NULL AFTER order_value;
CREATE INDEX idx_conversions_order_id ON conversions(order_id);
EOF
else
  echo "Введіть пароль MySQL вручну:"
  mysql -u "$DB_USER" -p "$DB_NAME" << EOF
ALTER TABLE conversions ADD COLUMN order_id VARCHAR(255) NULL AFTER order_value;
CREATE INDEX idx_conversions_order_id ON conversions(order_id);
EOF
fi

# Варіант Б: Вручну (якщо автоматично не працює)
# mysql -u root -p
# Потім в MySQL виконайте:
# USE affiliate_tracking;
# ALTER TABLE conversions ADD COLUMN order_id VARCHAR(255) NULL AFTER order_value;
# CREATE INDEX idx_conversions_order_id ON conversions(order_id);
# exit;

# 3. Оновіть код з GitHub
git pull origin main

# 4. Перебудуйте frontend
cd frontend
npm install
npm run build
cd ..

# 5. Перезапустіть сервер
pm2 restart affiliate-tracking-api

# 6. Перевірте логи
pm2 logs affiliate-tracking-api --lines 50
```

