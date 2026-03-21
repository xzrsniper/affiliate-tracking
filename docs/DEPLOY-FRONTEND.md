# Оновлення фронтенду на VPS

Якщо в **Адмін → Тексти сайту** немає фіолетового блоку **«Сторінка для редагування»**, значить браузер або сервер віддає **старий `frontend/dist`**.

## Варіант A: API на Node (Express віддає `frontend/dist`)

З кореня проєкту:

```bash
cd ~/affiliate-tracking
git pull
cd frontend
npm ci
npm run build
cd ..
pm2 restart affiliate-tracking-api --update-env
```

Потім у браузері: **Ctrl+F5** на `/admin`.

## Варіант B: Nginx віддає статику з іншої теки

Перевір, куди вказує `root` / `alias` для `lehko.space`. Потрібно **скопіювати вміст** зібраної теки:

`affiliate-tracking/frontend/dist/` → у ту теку, яку читає Nginx.

Після копіювання: **Ctrl+F5**.

## Перевірка

Після успішного деплою внизу сайдбару або в блоці редактора текстів з’являється рядок **Build: &lt;число&gt;** — воно змінюється після кожного `npm run build`.
