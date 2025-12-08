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

# Оновіть код з GitHub
git pull origin main

# Перезапустіть PM2
pm2 restart affiliate-tracking-api
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

