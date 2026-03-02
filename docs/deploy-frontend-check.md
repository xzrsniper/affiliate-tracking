# Чому не видно оновлень фронту після npm run build

## 1. Перевір, що новий білд є в dist

На сервері:
```bash
ls -la ~/affiliate-tracking/frontend/dist/assets/
```
Мають бути файли з **новим хешем** (наприклад `index-TKZ4jCCd.js`), а не старі (`index-BCgmwBNU...`).

## 2. Бекенд має працювати з NODE_ENV=production

Якщо NODE_ENV не production, Node **не віддає** frontend/dist — тоді сторінку може віддавати nginx з іншої папки (старий білд).

Перевір, як запущено додаток:
```bash
pm2 show 0
# або
pm2 env 0
```
Має бути `NODE_ENV: production` і робоча директорія — корінь проєкту (`/root/affiliate-tracking` або де лежить server.js).

Якщо NODE_ENV немає — додай при запуску або в ecosystem:
```bash
# в ~/affiliate-tracking
export NODE_ENV=production
pm2 restart all
```
Або в `ecosystem.config.js` / при старті: `NODE_ENV=production node server.js`.

## 3. Хто віддає lehko.space — Node чи nginx?

- Якщо **nginx** робить `proxy_pass http://127.0.0.1:3000` на всі запити — тоді фронт віддає Node з `frontend/dist`. Після білду достатньо **перезапустити pm2** і почистити кеш браузера (Ctrl+Shift+R).
- Якщо **nginx** сам віддає статику (`root /шлях/до/...;`) для lehko.space — тоді має бути `root` на **нову** папку з білдом, наприклад:
  `root /root/affiliate-tracking/frontend/dist;`
  Після цього перезавантаж nginx: `sudo systemctl reload nginx`.

## 4. Після змін — завжди

```bash
cd ~/affiliate-tracking
git pull origin main
cd frontend && npm run build && cd ..
pm2 restart all
```
У браузері: **жорстке оновлення** (Ctrl+Shift+R) або відкрити сайт у вкладці інкогніто.

## 5. Браузер все одно грузить старий білд (index-BCgmwBNu.js з кешу)

- У **Node** для головної сторінки вже стоять заголовки `no-store, no-cache`.
- Якщо перед Node стоїть **nginx** з `proxy_pass`, додай у відповідь заголовки без кешу — інакше nginx або браузер може кешувати. Приклад: `docs/nginx-no-cache-proxy.conf`.
- Після зміни nginx: `sudo nginx -t && sudo systemctl reload nginx`.
- Один раз почисти кеш сайту в браузері: DevTools → Application (Storage) → Clear site data для lehko.space, або відкрий сайт у **режимі інкогніто**.
