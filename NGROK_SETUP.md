# Налаштування ngrok для двох тунелів

На безкоштовному плані ngrok дозволяє тільки один одночасний сеанс. Щоб запустити обидва тунелі (backend і frontend), потрібно використати конфігураційний файл.

## Варіант 1: Використання конфігураційного файлу (Рекомендовано)

### Крок 1: Встановіть auth token в ngrok.yml

Відкрийте файл `ngrok.yml` і замініть `YOUR_AUTH_TOKEN_HERE` на ваш ngrok auth token.

АБО видаліть рядок `authtoken:` з файлу, якщо ви вже встановили токен через:
```bash
ngrok config add-authtoken YOUR_TOKEN
```

### Крок 2: Запустіть ngrok з конфігурацією

```bash
cd /Users/ivanivanuk/Documents/DashCurs
ngrok start --all --config=ngrok.yml
```

Або використайте готовий скрипт:
```bash
./start-ngrok-config.sh
```

### Крок 3: Отримайте URLs

Після запуску ngrok відкрийте http://localhost:4040 в браузері, щоб побачити обидва тунелі:
- **Frontend URL** (порт 5173)
- **Backend URL** (порт 3000)

### Крок 4: Оновіть API URL у frontend

Відкрийте `frontend/src/config/api.js` і тимчасово змініть:
```javascript
const API_BASE_URL = 'https://ваш-backend-ngrok-url.ngrok-free.app';
```

АБО запустіть frontend з змінною середовища:
```bash
cd frontend
VITE_API_URL=https://ваш-backend-ngrok-url.ngrok-free.app npm run dev
```

---

## Варіант 2: Тільки Frontend тунель (Простіше)

Якщо вам не потрібен окремий backend тунель, можна запустити тільки frontend:

### Крок 1: Запустіть тільки frontend тунель

```bash
ngrok http 5173
```

### Крок 2: Налаштуйте backend URL в frontend

Відкрийте `frontend/src/config/api.js` і вкажіть ваш backend URL:

```javascript
// Якщо backend також через ngrok або інший публічний URL:
const API_BASE_URL = 'https://ваш-backend-url.com';

// АБО якщо backend локальний (не працюватиме з іншого комп'ютера):
// const API_BASE_URL = 'http://localhost:3000';
```

**Проблема:** Якщо backend локальний, замовник не зможе отримати доступ до API зі свого комп'ютера.

**Рішення:** Запустіть обидва тунелі через конфігураційний файл (Варіант 1).

---

## Варіант 3: Використання глобального конфігураційного файлу ngrok

Можна налаштувати ngrok глобально:

### Крок 1: Створіть або відредагуйте ~/.ngrok2/ngrok.yml

```bash
mkdir -p ~/.ngrok2
nano ~/.ngrok2/ngrok.yml
```

Додайте:
```yaml
version: "2"
tunnels:
  frontend:
    addr: 5173
    proto: http
    
  backend:
    addr: 3000
    proto: http
```

### Крок 2: Запустіть

```bash
ngrok start --all
```

---

## Швидка перевірка

Після запуску ngrok перевірте:
1. Відкрийте http://localhost:4040 - там будуть обидва URLs
2. Скопіюйте Backend URL
3. Оновіть `frontend/src/config/api.js`
4. Перезапустіть frontend (якщо потрібно)
5. Скопіюйте Frontend URL і надішліть замовнику

