# Виправлення помилок: Node.js версія та конфлікт Git

## Проблема 1: Застаріла версія Node.js

Vite потребує Node.js 20.19+ або 22.12+, а у вас 18.20.8.

### Рішення: Оновити Node.js

**На сервері виконайте:**

```bash
# Встановіть Node.js 20 (LTS)
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Перевірте версію
node --version
npm --version

# Має бути версія 20.x.x або вище
```

**Або встановіть Node.js 22:**

```bash
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt install -y nodejs
```

**Якщо версія не оновилася:**

```bash
# Видаліть стару версію
sudo apt remove nodejs npm
sudo apt autoremove

# Встановіть нову
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Перевірте
node --version
```

---

## Проблема 2: Конфлікт Git у vite.config.js

У файлі є маркери конфлікту Git merge (<<<<<<< HEAD).

### Рішення: Виправити vite.config.js

**На сервері виконайте:**

```bash
cd ~/affiliate-tracking/frontend

# Перевірте файл
cat vite.config.js

# Виправте конфлікт вручну або перезапишіть файл
cat > vite.config.js << 'EOF'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    hmr: {
      // Use WebSocket for HMR instead of eval() when possible
      protocol: 'ws',
    },
  },
  build: {
    // Disable eval in production builds
    target: 'esnext',
    minify: 'esbuild',
  },
})
EOF
```

**Або отримайте чисту версію з Git:**

```bash
cd ~/affiliate-tracking
git checkout -- frontend/vite.config.js
# Або
git pull origin main
```

---

## Після виправлення:

```bash
cd ~/affiliate-tracking

# Перевірте версію Node.js
node --version  # Має бути 20.x.x або 22.x.x

# Перевірте vite.config.js
cat frontend/vite.config.js  # Не має бути <<<<<<< HEAD

# Перебілдіть frontend
cd frontend
rm -rf node_modules
npm install
npm run build
cd ..
```

---

## Швидке виправлення (всі проблеми разом):

```bash
# 1. Оновити Node.js
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# 2. Перевірити версію
node --version

# 3. Виправити vite.config.js
cd ~/affiliate-tracking/frontend
cat > vite.config.js << 'EOF'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    hmr: {
      protocol: 'ws',
    },
  },
  build: {
    target: 'esnext',
    minify: 'esbuild',
  },
})
EOF

# 4. Перебілдіть
rm -rf node_modules
npm install
npm run build
cd ..
```
