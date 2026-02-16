# Виправлення Git конфліктів на сервері

## Помилка: `SyntaxError: Unexpected token '<<'`

Це означає, що на сервері є файли з Git merge конфліктами (маркери `<<<<<<< HEAD`).

## Швидке виправлення:

### Крок 1: Знайдіть файли з конфліктами

```bash
cd ~/affiliate-tracking

# Знайдіть всі файли з конфліктами
grep -r "<<<<<<< HEAD" . --include="*.js" --include="*.jsx" --include="*.html" 2>/dev/null
```

### Крок 2: Оновіть код з GitHub (використайте версію з GitHub)

```bash
cd ~/affiliate-tracking

# Збережіть локальні зміни (якщо потрібно)
git stash

# Оновіть з GitHub
git pull origin main

# Якщо все ще є конфлікти, використайте версію з GitHub для всіх файлів
git checkout --theirs .
git add .
git commit -m "Fix merge conflicts - use GitHub version"
```

### Крок 3: Або виправте конфлікти вручну

Якщо знайдено файли з конфліктами, наприклад `server.js`:

```bash
cd ~/affiliate-tracking

# Відкрийте файл
nano server.js

# Знайдіть маркери конфліктів:
# <<<<<<< HEAD
# ... ваш код ...
# =======
# ... код з GitHub ...
# >>>>>>> origin/main

# Видаліть маркери та залиште правильний код
# Збережіть файл (Ctrl+O, Enter, Ctrl+X)
```

### Крок 4: Після виправлення

```bash
cd ~/affiliate-tracking

# Додайте виправлені файли
git add .

# Закомітьте (якщо потрібно)
git commit -m "Fix merge conflicts"

# Перезапустіть PM2
pm2 restart affiliate-tracking-api

# Перевірте логи
pm2 logs affiliate-tracking-api --lines 50
```

---

## Альтернатива: Повне оновлення з GitHub

Якщо локальні зміни на сервері не важливі:

```bash
cd ~/affiliate-tracking

# Збережіть .env файли (якщо потрібно)
cp .env .env.backup
cp frontend/.env frontend/.env.backup

# Скиньте всі локальні зміни
git fetch origin
git reset --hard origin/main

# Відновіть .env файли
cp .env.backup .env
cp frontend/.env.backup frontend/.env

# Перебілдіть frontend
cd frontend
npm run build
cd ..

# Перезапустіть PM2
pm2 restart affiliate-tracking-api
```

---

## Автоматичне виправлення (використати версію з GitHub)

```bash
cd ~/affiliate-tracking

# Використайте версію з GitHub для всіх конфліктів
git fetch origin
git reset --hard origin/main

# Перебілдіть frontend
cd frontend
npm run build
cd ..

# Перезапустіть
pm2 restart affiliate-tracking-api
pm2 logs affiliate-tracking-api
```

---

## Перевірка після виправлення

```bash
# Перевірте, чи немає конфліктів
grep -r "<<<<<<< HEAD" . --include="*.js" --include="*.jsx" 2>/dev/null

# Перевірте статус PM2
pm2 status
pm2 logs affiliate-tracking-api --lines 20
```

Якщо все добре, ви не повинні бачити помилок `SyntaxError: Unexpected token '<<'`.
