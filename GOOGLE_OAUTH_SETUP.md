# Налаштування Google OAuth

## Крок 1: Створення Google OAuth Client ID

1. Перейдіть на [Google Cloud Console](https://console.cloud.google.com/)
2. Створіть новий проект або виберіть існуючий
3. Увімкніть **Google+ API**:
   - Перейдіть в "APIs & Services" > "Library"
   - Знайдіть "Google+ API" та натисніть "Enable"
4. Створіть **OAuth 2.0 Client ID**:
   - Перейдіть в "APIs & Services" > "Credentials"
   - Натисніть "Create Credentials" > "OAuth client ID"
   - Якщо потрібно, налаштуйте OAuth consent screen
   - Виберіть "Web application"
   - Додайте **Authorized JavaScript origins**:
     - `http://localhost:5173`
     - `http://localhost:3000` (для production замініть на ваш домен)
   - Додайте **Authorized redirect URIs**:
     - `http://localhost:5173`
     - `http://localhost:3000` (для production замініть на ваш домен)
   - Натисніть "Create"
5. Скопіюйте **Client ID**

## Крок 2: Налаштування в проєкті

1. Відкрийте файл `frontend/.env`
2. Замініть `YOUR_GOOGLE_CLIENT_ID_HERE` на ваш Client ID:
   ```
   VITE_GOOGLE_CLIENT_ID=ваш_client_id_тут
   ```
3. Перезапустіть frontend сервер:
   ```bash
   cd frontend
   npm run dev
   ```

## Перевірка

1. Відкрийте http://localhost:5173/login
2. Має з'явитися кнопка "Continue with Google"
3. Натисніть на неї та увійдіть через Google

## Примітки

- Google OAuth працює тільки для звичайних користувачів (не для адміністраторів)
- Адмін панель доступна тільки через email/password вхід
- Для production не забудьте додати ваш домен в Authorized origins та redirect URIs
