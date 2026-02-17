# Тестовий сайт Shopin (shopin.pp.ua)

Статичний тестовий магазин для перевірки Lehko Track на домені **shopin.pp.ua**.

**Якщо у вас тільки домен, без хостингу** — дивіться інструкцію **[БЕЗ_ХОСТИНГУ.md](./БЕЗ_ХОСТИНГУ.md)** (Netlify, Cloudflare Pages, GitHub Pages безкоштовно).

## Що всередині

- **index.html** — головна сторінка з каталогом товарів
- **checkout.html** — оформлення замовлення
- **thank-you.html** — сторінка подяки після замовлення (конверсія)

Трекер: **Lehko Track v2** (`https://lehko.space/tracker-v2.js`), API: `https://lehko.space/api/track`.

## Як викласти на shopin.pp.ua

### Варіант 1: хостинг з FTP (наприклад, звичайний shared-хостинг)

1. Підключіться по FTP до хостингу домену shopin.pp.ua.
2. Завантажте всі файли з папки `public/shopin-pp-ua/` у корінь сайту (наприклад, у `public_html/` або `www/`):
   - `index.html`
   - `checkout.html`
   - `thank-you.html`
3. Переконайтеся, що головна сторінка відкривається за адресою `https://shopin.pp.ua/` (або `https://shopin.pp.ua/index.html`).

### Варіант 2: Nginx (VPS/сервер)

Якщо shopin.pp.ua обслуговується Nginx:

1. Скопіюйте папку на сервер, наприклад:
   ```bash
   /var/www/shopin.pp.ua/
   ├── index.html
   ├── checkout.html
   └── thank-you.html
   ```
2. Додайте серверний блок для shopin.pp.ua, наприклад:

```nginx
server {
    listen 80;
    listen [::]:80;
    server_name shopin.pp.ua www.shopin.pp.ua;
    root /var/www/shopin.pp.ua;
    index index.html;
    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

3. Увімкніть сайт і перезавантажте Nginx. При потребі налаштуйте SSL (наприклад, Let's Encrypt).

### Варіант 3: Netlify / Vercel / GitHub Pages

1. Завантажте вміст папки `public/shopin-pp-ua/` у репозиторій або через drag-and-drop.
2. Вкажіть коренем проєкту цю папку (або корінь з цими файлами).
3. Підключіть свій домен shopin.pp.ua в налаштуваннях сервісу.

## Як тестувати трекінг

1. У Lehko Track створіть реферальне посилання (наприклад, код `SHOPIN`).
2. Відкрийте сайт з параметром ref:
   ```
   https://shopin.pp.ua/?ref=SHOPIN
   ```
3. Додайте товар у кошик, натисніть «Оформити замовлення», заповніть форму та підтвердіть.
4. Після переходу на «Дякуємо за замовлення» конверсія має відстежитися (автоматично v2 + ручний виклик на thank-you).
5. Перевірте кліки та конверсії в панелі Lehko Track.

## Додати shopin.pp.ua в «Мої сайти»

1. У Lehko Track: **Налаштування** → **Мої сайти**.
2. Додайте сайт з доменом `shopin.pp.ua`.
3. Через 5–10 хвилин після відкриття сайту з трекером статус має стати «Підключено» (verification ping).

## Примітки

- Трекер підключено до `https://lehko.space`; змінювати нічого в коді для shopin.pp.ua не потрібно.
- Кошик і замовлення зберігаються в `localStorage` браузера (ключі `shopinCart`, `shopinOrder`) тільки для демо.
