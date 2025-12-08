# 🔧 Виправлення PM2 з ES Modules

## Проблема

Проект використовує ES modules (`"type": "module"` в package.json), тому PM2 конфігурація має бути в форматі `.cjs` або використовувати ES modules синтаксис.

## Рішення 1: Використати .cjs файл (рекомендовано)

На сервері:

```bash
cd /var/www/affiliate-tracking

# Створіть ecosystem.config.cjs
cat > ecosystem.config.cjs << 'EOF'
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
    watch: false
  }]
};
EOF

# Запустіть з .cjs файлом
pm2 start ecosystem.config.cjs

# Або видаліть старий .js файл і використайте .cjs
rm ecosystem.config.js
pm2 start ecosystem.config.cjs
pm2 save
```

## Рішення 2: Запуск без конфігурації

```bash
cd /var/www/affiliate-tracking
mkdir -p logs

# Запустіть напряму
pm2 start server.js --name affiliate-tracking-api --env production

# Збережіть
pm2 save
```

## Рішення 3: Використати ES modules синтаксис

Якщо хочете залишити `.js` файл, використайте ES modules:

```bash
cd /var/www/affiliate-tracking

cat > ecosystem.config.js << 'EOF'
export default {
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
    watch: false
  }]
};
EOF

pm2 start ecosystem.config.js
```

**Примітка:** PM2 може не підтримувати ES modules в конфігурації, тому краще використати `.cjs` файл.

## Перевірка

```bash
# Статус
pm2 status

# Логи
pm2 logs affiliate-tracking-api

# API
curl http://localhost:3000/health
```

## Рекомендація

**Найкраще:** Використайте `ecosystem.config.cjs` (Рішення 1) - це найнадійніший спосіб.

