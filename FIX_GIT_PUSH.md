# Виправлення помилки Git Push

## Помилка: "Updates were rejected because the remote contains work"

Це означає, що на GitHub вже є файли (наприклад, README.md), яких немає у вас локально.

## Рішення:

### Варіант 1: Об'єднати зміни (рекомендовано)

```bash
# 1. Отримайте зміни з GitHub
git pull origin main --allow-unrelated-histories

# 2. Якщо виникнуть конфлікти, вирішіть їх, потім:
git add .
git commit -m "Merge remote changes"

# 3. Запуште зміни
git push -u origin main
```

### Варіант 2: Якщо гілка називається master

```bash
git pull origin master --allow-unrelated-histories
git push -u origin master
```

### Варіант 3: Перезаписати remote (якщо не важливі файли на GitHub)

⚠️ **УВАГА:** Це видалить всі файли на GitHub!

```bash
# Перезаписати remote вашими локальними файлами
git push -u origin main --force
```

## Повна послідовність (рекомендовано):

```bash
# 1. Перевірте поточний статус
git status

# 2. Перевірте, яка гілка
git branch

# 3. Отримайте зміни з GitHub
git pull origin main --allow-unrelated-histories

# 4. Якщо все добре, запуште
git push -u origin main
```

## Якщо виникли конфлікти:

Git може запитати про merge commit. Відкрийте редактор і збережіть файл (у Vim: натисніть `Esc`, потім `:wq` і Enter).

Або використайте:

```bash
git pull origin main --allow-unrelated-histories --no-edit
```

## Перевірка після:

```bash
# Перевірте, що все запушено
git status

# Перевірте останні commit
git log --oneline -5
```
