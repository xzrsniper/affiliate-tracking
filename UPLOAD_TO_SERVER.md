# Як завантажити сайт на сервер

## Підготовка файлів для завантаження

### Варіант 1: Створення архіву (рекомендовано)

**На Windows PowerShell:**

```powershell
# Перейдіть в папку з проєктом
cd C:\Users\ergoa\Downloads\affiliate-tracking-main\affiliate-tracking-main

# Створіть архів без node_modules та .env
Compress-Archive -Path * -Exclude node_modules,frontend/node_modules,.env,frontend/.env,*.log,logs -DestinationPath ../deploy.zip -Force
```

**Що буде в архіві:**
- ✅ Всі файли проєкту
- ✅ package.json та всі конфігурації
- ❌ node_modules (буде встановлено на сервері)
- ❌ .env файли (будуть створені на сервері)

---

## Спосіб 1: Завантаження через SFTP (FileZilla) - НАЙПРОСТІШИЙ

### Крок 1: Встановіть FileZilla

1. Завантажте FileZilla: https://filezilla-project.org/
2. Встановіть програму

### Крок 2: Підключіться до сервера

1. Відкрийте FileZilla
2. Введіть дані:
   - **Host:** `vps76168.hyperhost.name` або `185.237.207.109`
   - **Username:** `ergoa` (або інше, що вказано в панелі)
   - **Password:** ваш пароль
   - **Port:** `22`
   - **Protocol:** `SFTP - SSH File Transfer Protocol`

3. Натисніть "Quickconnect"

### Крок 3: Завантажте файли

1. **Ліва сторона (локальний комп'ютер):**
   - Перейдіть в папку з проєктом: `C:\Users\ergoa\Downloads\affiliate-tracking-main\affiliate-tracking-main`

2. **Права сторона (сервер):**
   - Створіть папку для проєкту (наприклад, `/home/ergoa/affiliate-tracking`)

3. **Завантаження:**
   - Виберіть всі файли та папки (крім `node_modules`)
   - Перетягніть їх зліва направо
   - Або завантажте архів `deploy.zip` і розпакуйте на сервері

---

## Спосіб 2: Завантаження через WinSCP

### Крок 1: Встановіть WinSCP

1. Завантажте: https://winscp.net/
2. Встановіть програму

### Крок 2: Підключіться

1. Відкрийте WinSCP
2. Створіть нову сесію:
   - **File protocol:** `SFTP`
   - **Host name:** `vps76168.hyperhost.name`
   - **User name:** `ergoa`
   - **Password:** ваш пароль
   - **Port:** `22`

3. Натисніть "Login"

### Крок 3: Завантажте файли

1. Ліва сторона - ваш комп'ютер
2. Права сторона - сервер
3. Перетягніть файли або використайте кнопку "Upload"

---

## Спосіб 3: Через SSH команди (якщо SSH працює)

### Завантаження архіву

```powershell
# На вашому комп'ютері (PowerShell)
scp C:\Users\ergoa\Downloads\affiliate-tracking-main\deploy.zip ergoa@vps76168.hyperhost.name:/home/ergoa/
```

### Розпакування на сервері

```bash
# Після підключення через SSH
cd /home/ergoa
unzip deploy.zip -d affiliate-tracking
cd affiliate-tracking
```

---

## Спосіб 4: Через Git (якщо є репозиторій)

### На сервері:

```bash
# Встановіть Git (якщо ще не встановлено)
sudo apt install git

# Клонуйте репозиторій
cd /home/ergoa
git clone https://github.com/your-username/your-repo.git affiliate-tracking
cd affiliate-tracking
```

---

## Після завантаження файлів

### 1. Підключіться до сервера (через SSH або веб-термінал)

### 2. Перейдіть в папку проєкту

```bash
cd /home/ergoa/affiliate-tracking
# або
cd /home/ergoa/affiliate-tracking-main
```

### 3. Створіть .env файл

```bash
nano .env
```

**Вміст .env:**
```env
NODE_ENV=production
PORT=3000
DB_HOST=localhost
DB_PORT=3306
DB_NAME=affiliate_tracking
DB_USER=root
DB_PASSWORD=ваш_пароль_mysql
JWT_SECRET=згенеруйте_випадковий_рядок_тут
ADMIN_EMAIL=admin@yourdomain.com
```

### 4. Створіть frontend/.env

```bash
cd frontend
nano .env
```

**Вміст frontend/.env:**
```env
VITE_API_URL=https://yourdomain.com
VITE_GOOGLE_CLIENT_ID=ваш_google_client_id
VITE_TELEGRAM_USERNAME=hodunkooo
```

### 5. Встановіть залежності

```bash
# Поверніться в корінь проєкту
cd /home/ergoa/affiliate-tracking

# Backend залежності
npm install --production

# Frontend залежності та білд
cd frontend
npm install
npm run build
cd ..
```

### 6. Налаштуйте базу даних

```bash
# Створіть БД
sudo mysql -u root -p
CREATE DATABASE affiliate_tracking;
EXIT;

# Створіть таблиці
node scripts/init-db.js

# Створіть адміністратора
node scripts/create-admin.js admin@example.com password123
```

### 7. Запустіть сервер

```bash
# Встановіть PM2 (якщо ще не встановлено)
sudo npm install -g pm2

# Запустіть сервер
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

---

## Якщо не можете підключитися через SSH

### Варіант 1: Використайте веб-термінал в панелі HyperHost

1. Увійдіть в панель управління
2. Знайдіть "Terminal" або "SSH Console"
3. Використайте веб-термінал для виконання команд

### Варіант 2: Завантажте файли через панель

1. У панелі HyperHost знайдіть "File Manager"
2. Завантажте файли через веб-інтерфейс
3. Розпакуйте архів через File Manager

### Варіант 3: Зверніться в підтримку HyperHost

Попросите їх:
- Налаштувати SSH доступ
- Або надати правильні дані для підключення
- Або допомогти з завантаженням файлів

---

## Швидкий чеклист

- [ ] Підготовлено файли (створено архів або вибрано файли)
- [ ] Встановлено FileZilla або WinSCP
- [ ] Підключено до сервера через SFTP
- [ ] Завантажено файли на сервер
- [ ] Створено .env файли
- [ ] Встановлено залежності
- [ ] Зроблено білд frontend
- [ ] Налаштовано базу даних
- [ ] Запущено сервер

---

## Потрібна допомога?

Напишіть:
1. Чи вдалося підключитися через FileZilla/WinSCP?
2. Чи є доступ до веб-терміналу в панелі?
3. Які помилки виникають?
