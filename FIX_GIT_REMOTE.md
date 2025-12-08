# 🔧 Виправлення Git Remote URL

Якщо ви вже додали код до GitHub, але забули змінити "ваш-username" на свій, ось як виправити:

## Варіант 1: Змінити існуючий remote

```bash
# Перевірте поточний remote
git remote -v

# Змініть URL на правильний
git remote set-url origin https://github.com/ВАШ-USERNAME/affiliate-tracking.git

# Перевірте, що змінилося
git remote -v
```

## Варіант 2: Видалити і додати заново

```bash
# Видалити старий remote
git remote remove origin

# Додати новий з правильним URL
git remote add origin https://github.com/ВАШ-USERNAME/affiliate-tracking.git

# Перевірити
git remote -v
```

## Варіант 3: Якщо репозиторій ще не створений на GitHub

1. Створіть репозиторій на GitHub з правильним ім'ям
2. Потім виконайте:
```bash
git remote set-url origin https://github.com/ВАШ-USERNAME/назва-репозиторію.git
```

## Після виправлення URL

```bash
# Відправте код на GitHub
git push -u origin main

# Або якщо гілка називається master
git push -u origin master
```

## Якщо ви вже запушили на неправильний URL

Якщо ви вже запушили код на неправильний URL (який не існує), просто виправте URL і запушийте знову:

```bash
# Виправте URL
git remote set-url origin https://github.com/ВАШ-USERNAME/affiliate-tracking.git

# Відправте код
git push -u origin main
```

## Перевірка правильності URL

```bash
# Перевірте remote
git remote -v

# Має показати щось на кшталт:
# origin  https://github.com/ВАШ-USERNAME/affiliate-tracking.git (fetch)
# origin  https://github.com/ВАШ-USERNAME/affiliate-tracking.git (push)
```

## Якщо використовуєте SSH замість HTTPS

```bash
# Для SSH
git remote set-url origin git@github.com:ВАШ-USERNAME/affiliate-tracking.git
```

