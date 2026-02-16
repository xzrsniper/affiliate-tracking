# Налаштування Git репозиторію

## Помилка: "src refspec main does not match any"

Ця помилка означає, що:
1. Немає жодного commit в репозиторії
2. Гілка `main` не існує
3. Або репозиторій не ініціалізовано

## Рішення:

### Крок 1: Перевірте, чи ініціалізовано репозиторій

```bash
# Перевірте, чи є папка .git
ls -la .git
# або на Windows
dir .git
```

Якщо папки `.git` немає, ініціалізуйте репозиторій:

```bash
git init
```

### Крок 2: Перевірте поточну гілку

```bash
git branch
```

Якщо гілка називається `master` замість `main`:

```bash
# Перейменуйте гілку
git branch -M main
```

Або створіть гілку main:

```bash
git checkout -b main
```

### Крок 3: Додайте файли та зробіть перший commit

```bash
# Додайте всі файли (крім тих, що в .gitignore)
git add .

# Зробіть перший commit
git commit -m "Initial commit"
```

### Крок 4: Додайте remote репозиторій

```bash
# Перевірте, чи вже додано remote
git remote -v

# Якщо немає, додайте:
git remote add origin https://github.com/xzrsniper/affiliate-tracking.git

# Або якщо вже є, оновіть URL:
git remote set-url origin https://github.com/xzrsniper/affiliate-tracking.git
```

### Крок 5: Запуште в репозиторій

```bash
# Запуште гілку main
git push -u origin main

# Або якщо гілка називається master:
git push -u origin master
```

## Повна послідовність команд:

```bash
# 1. Ініціалізуйте репозиторій (якщо ще не зроблено)
git init

# 2. Перейменуйте гілку на main (якщо потрібно)
git branch -M main

# 3. Додайте всі файли
git add .

# 4. Зробіть перший commit
git commit -m "Initial commit"

# 5. Додайте remote (якщо ще не додано)
git remote add origin https://github.com/xzrsniper/affiliate-tracking.git

# 6. Запуште в репозиторій
git push -u origin main
```

## Створення .gitignore

Переконайтеся, що у вас є файл `.gitignore` з таким вмістом:

```
# Dependencies
node_modules/
frontend/node_modules/

# Environment variables
.env
frontend/.env
.env.local
.env.production

# Logs
logs/
*.log
npm-debug.log*

# Build outputs
frontend/dist/
frontend/build/

# IDE
.vscode/
.idea/
*.swp
*.swo

# OS
.DS_Store
Thumbs.db

# Temporary files
*.tmp
*.temp
deploy.zip
deploy-temp/
```

## Якщо репозиторій на GitHub вже має файли:

Якщо на GitHub вже є файли (наприклад, README.md), спочатку зробіть pull:

```bash
# Отримайте зміни з GitHub
git pull origin main --allow-unrelated-histories

# Або якщо гілка називається master:
git pull origin master --allow-unrelated-histories

# Потім запуште
git push -u origin main
```

## Перевірка після налаштування:

```bash
# Перевірте статус
git status

# Перевірте гілки
git branch

# Перевірте remote
git remote -v

# Перевірте останні commit
git log --oneline -5
```

## Після успішного налаштування:

Тепер ви можете:
1. Робити зміни локально
2. Комітити: `git add . && git commit -m "Опис змін"`
3. Пушити: `git push origin main`
4. На сервері: `git pull` або `./update.sh`
