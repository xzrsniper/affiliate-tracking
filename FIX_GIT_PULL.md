# Виправлення помилки Git Pull

## Помилка: "Your local changes would be overwritten by merge"

Це означає, що на сервері є локальні зміни, які конфліктують зі змінами на GitHub.

## Рішення:

### Варіант 1: Відкинути локальні зміни (рекомендовано)

Оскільки файл вже виправлено на GitHub, просто відкиньте локальні зміни:

```bash
cd ~/affiliate-tracking

# Відкинути локальні зміни в vite.config.js
git checkout -- frontend/vite.config.js

# Тепер зробіть pull
git pull origin main
```

### Варіант 2: Зберегти зміни в stash

Якщо хочете зберегти локальні зміни (хоча вони не потрібні):

```bash
cd ~/affiliate-tracking

# Зберегти зміни в stash
git stash

# Зробити pull
git pull origin main

# Застосувати збережені зміни (якщо потрібно)
# git stash pop
```

### Варіант 3: Commit локальних змін

```bash
cd ~/affiliate-tracking

# Додати зміни
git add frontend/vite.config.js

# Зробити commit
git commit -m "Fix vite.config.js"

# Зробити pull (може виникнути конфлікт)
git pull origin main

# Якщо виникне конфлікт, вирішіть його
```

---

## Рекомендована послідовність:

```bash
cd ~/affiliate-tracking

# 1. Відкинути локальні зміни
git checkout -- frontend/vite.config.js

# 2. Отримати оновлення з GitHub
git pull origin main

# 3. Перебілдіть frontend
cd frontend
npm run build
cd ..

# 4. Перезапустити сервер
pm2 restart affiliate-tracking-api
```

---

## Якщо є зміни в інших файлах:

```bash
# Подивитися, які файли змінені
git status

# Відкинути всі локальні зміни
git checkout -- .

# Або відкинути конкретні файли
git checkout -- frontend/vite.config.js frontend/index.html frontend/src/App.jsx

# Потім pull
git pull origin main
```

---

## Перевірка після:

```bash
# Перевірити статус
git status

# Має показати "Your branch is up to date with 'origin/main'"
```
