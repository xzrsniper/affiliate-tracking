# Виправлення помилки PM2: "No script path"

## Помилка: "Error: No script path - aborting"

Це означає, що PM2 не може знайти файл server.js або конфігурація неправильна.

## Рішення:

### Крок 1: Перевірте, чи існує server.js

```bash
cd ~/affiliate-tracking
ls -la server.js
```

Якщо файлу немає, перевірте, чи ви в правильній директорії.

### Крок 2: Використайте .cjs файл замість .js

PM2 краще працює з CommonJS форматом:

```bash
cd ~/affiliate-tracking

# Використайте .cjs файл
pm2 start ecosystem.config.cjs
```

### Крок 3: Або запустіть напряму

```bash
cd ~/affiliate-tracking

# Запустіть напряму з вказанням шляху
pm2 start server.js --name affiliate-tracking-api

# Або з повним шляхом
pm2 start /root/affiliate-tracking/server.js --name affiliate-tracking-api
```

### Крок 4: Створіть папку для логів

```bash
cd ~/affiliate-tracking
mkdir -p logs
```

### Крок 5: Запустіть знову

```bash
# Спробуйте .cjs
pm2 start ecosystem.config.cjs

# Або напряму
pm2 start server.js --name affiliate-tracking-api --env production
```

---

## Альтернатива: Створіть новий ecosystem.config.js

```bash
cd ~/affiliate-tracking

cat > ecosystem.config.js << 'EOF'
module.exports = {
  apps: [{
    name: 'affiliate-tracking-api',
    script: './server.js',
    cwd: '/root/affiliate-tracking',
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
    watch: false
  }]
};
EOF
```

---

## Швидке виправлення:

```bash
cd ~/affiliate-tracking

# 1. Перевірте наявність server.js
ls -la server.js

# 2. Створіть папку для логів
mkdir -p logs

# 3. Запустіть напряму
pm2 start server.js --name affiliate-tracking-api

# 4. Збережіть
pm2 save

# 5. Перевірте статус
pm2 status
pm2 logs affiliate-tracking-api
```

---

## Якщо все ще не працює:

```bash
# Перевірте поточну директорію
pwd

# Перевірте наявність файлів
ls -la | grep -E "server.js|ecosystem"

# Спробуйте з абсолютним шляхом
pm2 start /root/affiliate-tracking/server.js --name affiliate-tracking-api
```
