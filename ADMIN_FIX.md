# Виправлення проблем з адмін-панеллю

## Проблема
Адмін-панель не працює - користувач не може отримати доступ до `/admin` або `/api/admin/*` маршрутів.

## Можливі причини

### 1. ADMIN_EMAIL не встановлено в .env
Адмін-панель доступна тільки користувачу з email, що відповідає змінній `ADMIN_EMAIL` в `.env` файлі.

**Рішення:**
```bash
# Додайте до файлу .env (в корені проєкту)
ADMIN_EMAIL=your-email@example.com
```

### 2. Користувач не має ролі super_admin
Тільки користувачі з роллю `super_admin` можуть отримати доступ до адмін-панелі.

**Рішення:**
Створіть адміністратора:
```bash
npm run create-admin your-email@example.com your-password
```

Або перевірте існуючих адміністраторів:
```bash
npm run check-admin
```

### 3. Користувач зареєстрований через Google OAuth
Адмін-панель доступна тільки користувачам, зареєстрованим через email/password (не через Google OAuth).

**Рішення:**
Створіть нового адміністратора через email/password:
```bash
npm run create-admin your-email@example.com your-password
```

### 4. Email користувача не відповідає ADMIN_EMAIL
Навіть якщо користувач має роль `super_admin`, доступ буде заборонено, якщо його email не відповідає `ADMIN_EMAIL`.

**Рішення:**
Переконайтеся, що `ADMIN_EMAIL` в `.env` відповідає email адміністратора:
```bash
# В .env файлі
ADMIN_EMAIL=admin@example.com  # Має відповідати email адміністратора
```

## Діагностика проблеми

Запустіть скрипт діагностики:
```bash
npm run diagnose-admin
```

Цей скрипт покаже:
- ✅ Чи встановлено `ADMIN_EMAIL`
- ✅ Список всіх адміністраторів
- ✅ Чи має адміністратор `password_hash` (зареєстрований через email)
- ✅ Чи email адміністратора відповідає `ADMIN_EMAIL`
- ✅ Чи заблокований адміністратор

## Швидке виправлення

1. **Перевірте .env файл:**
   ```bash
   # Переконайтеся, що є рядок:
   ADMIN_EMAIL=your-email@example.com
   ```

2. **Створіть/перевірте адміністратора:**
   ```bash
   # Перевірте існуючих адміністраторів
   npm run check-admin
   
   # Якщо немає адміністраторів, створіть нового
   npm run create-admin your-email@example.com your-password
   ```

3. **Запустіть діагностику:**
   ```bash
   npm run diagnose-admin
   ```

4. **Перезапустіть сервер:**
   ```bash
   # Якщо використовуєте pm2
   pm2 restart affiliate-tracking-api
   
   # Або якщо запускаєте локально
   npm start
   ```

## Перевірка доступу

Після виправлення:

1. Увійдіть в систему з email, що відповідає `ADMIN_EMAIL`
2. Переконайтеся, що ви зареєстровані через email/password (не Google OAuth)
3. Перейдіть на `/admin` - має відкритися адмін-панель
4. Якщо все ще не працює, перевірте консоль браузера та логи сервера на помилки

## Логи та помилки

### Помилка 403: "Access denied. Super admin required."
- Користувач не має ролі `super_admin`
- **Рішення:** Створіть адміністратора: `npm run create-admin email password`

### Помилка 403: "Access denied. Admin panel is only accessible to users registered via email, not Google OAuth."
- Користувач зареєстрований через Google OAuth
- **Рішення:** Створіть нового адміністратора через email/password

### Помилка 403: "Access denied. Admin panel is only accessible to the owner."
- Email користувача не відповідає `ADMIN_EMAIL`
- **Рішення:** Встановіть `ADMIN_EMAIL` в `.env` на email користувача або створіть нового адміністратора з email, що відповідає `ADMIN_EMAIL`

### Помилка 401: "No token provided" або "Invalid token"
- Користувач не авторизований
- **Рішення:** Увійдіть в систему через `/login`

## Додаткова інформація

- Адмін-панель доступна тільки одному користувачу (з email = `ADMIN_EMAIL`)
- Користувач має бути зареєстрований через email/password (не Google OAuth)
- Користувач має мати роль `super_admin`
- Користувач не повинен бути заблокований (`is_banned = false`)
