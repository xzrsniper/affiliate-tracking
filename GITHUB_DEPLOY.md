# 📦 Деплой через GitHub

## Варіант 1: Публічний репозиторій (безкоштовно)

### ⚠️ Важливо: Безпека
- **НЕ** завантажуйте `.env` файл в репозиторій
- **НЕ** завантажуйте секрети (JWT_SECRET, паролі БД)
- Використовуйте `.env.example` як шаблон

### Крок 1: Створення репозиторію на GitHub

1. Перейдіть на https://github.com
2. Натисніть "New repository"
3. Назвіть репозиторій (наприклад: `affiliate-tracking`)
4. Оберіть **Public** (публічний)
5. **НЕ** додавайте README, .gitignore або license (вони вже є)
6. Натисніть "Create repository"

### Крок 2: Ініціалізація Git в проекті

```bash
cd /Users/ivanivanuk/Documents/DashCurs

# Ініціалізація git (якщо ще не зроблено)
git init

# Перевірка .gitignore (має містити .env)
cat .gitignore | grep -E "(\.env|node_modules)"

# Додавання файлів
git add .

# Перший коміт
git commit -m "Initial commit: Affiliate Tracking SaaS"

# Додавання remote репозиторію (замініть на ваш URL)
git remote add origin https://github.com/ваш-username/affiliate-tracking.git

# Відправка на GitHub
git branch -M main
git push -u origin main
```

### Крок 3: Деплой на сервер через GitHub

```bash
# Підключіться до сервера
ssh user@your-server-ip

# Встановіть git (якщо ще не встановлено)
sudo apt install -y git

# Клонуйте репозиторій
cd /var/www
sudo git clone https://github.com/ваш-username/affiliate-tracking.git affiliate-tracking
sudo chown -R $USER:$USER affiliate-tracking
cd affiliate-tracking

# Створіть .env файл (НЕ клонується з GitHub!)
cp .env.example .env
nano .env  # Заповніть реальними значеннями

# Встановіть залежності
npm install --production
cd frontend && npm install && npm run build && cd ..

# Налаштуйте БД та запустіть (див. DEPLOY.md)
```

### Крок 4: Оновлення коду на сервері

```bash
# На сервері
cd /var/www/affiliate-tracking
git pull origin main

# Перебілдіть frontend якщо були зміни
cd frontend && npm run build && cd ..

# Перезапустіть PM2
pm2 restart affiliate-tracking-api
```

---

## Варіант 2: Приватний репозиторій (рекомендовано)

### Переваги:
- ✅ Безпечніше (секрети не потрапляють в публічний доступ)
- ✅ Можна зберігати конфігурації
- ⚠️ Потрібен GitHub Pro або організація (платно)

### Створення приватного репозиторію:

1. На GitHub натисніть "New repository"
2. Оберіть **Private**
3. Решта кроків такі ж, як у Варіанті 1

### Клонування приватного репозиторію на сервер:

```bash
# Варіант A: Через SSH ключ (рекомендовано)
ssh-keygen -t ed25519 -C "your_email@example.com"
# Скопіюйте публічний ключ в GitHub Settings → SSH Keys

git clone git@github.com:ваш-username/affiliate-tracking.git

# Варіант B: Через Personal Access Token
git clone https://YOUR_TOKEN@github.com/ваш-username/affiliate-tracking.git
```

---

## Варіант 3: Деплой без GitHub (через SCP)

Якщо не хочете використовувати GitHub:

```bash
# З вашого локального комп'ютера
cd /Users/ivanivanuk/Documents/DashCurs

# Створіть архів (виключаючи node_modules та .env)
tar --exclude='node_modules' \
    --exclude='frontend/node_modules' \
    --exclude='.env' \
    --exclude='.git' \
    -czf affiliate-tracking.tar.gz .

# Завантажте на сервер
scp affiliate-tracking.tar.gz user@your-server-ip:/tmp/

# На сервері
ssh user@your-server-ip
cd /var/www
sudo mkdir -p affiliate-tracking
sudo tar -xzf /tmp/affiliate-tracking.tar.gz -C affiliate-tracking
sudo chown -R $USER:$USER affiliate-tracking
cd affiliate-tracking

# Створіть .env та встановіть залежності
cp .env.example .env
nano .env
npm install --production
cd frontend && npm install && npm run build && cd ..
```

---

## Перевірка безпеки перед публікацією

```bash
# Перевірте, що .env не потрапляє в git
git status | grep .env

# Перевірте, що немає секретів у файлах
grep -r "JWT_SECRET\|DB_PASSWORD\|ADMIN_EMAIL" --include="*.js" --include="*.json" .

# Перевірте .gitignore
cat .gitignore
```

## Автоматичний деплой через GitHub Actions (опціонально)

Можна налаштувати автоматичний деплой при push в main гілку. Створіть `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Production

on:
  push:
    branches: [ main ]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Deploy to server
        uses: appleboy/ssh-action@master
        with:
          host: ${{ secrets.HOST }}
          username: ${{ secrets.USERNAME }}
          key: ${{ secrets.SSH_KEY }}
          script: |
            cd /var/www/affiliate-tracking
            git pull origin main
            npm install --production
            cd frontend && npm install && npm run build && cd ..
            pm2 restart affiliate-tracking-api
```

---

## Рекомендації

1. **Для продакшн**: Використовуйте приватний репозиторій або SCP
2. **Для демо/тестування**: Публічний репозиторій ОК, але переконайтеся, що `.env` в `.gitignore`
3. **Для команди**: Приватний репозиторій + GitHub Actions для автоматичного деплою

