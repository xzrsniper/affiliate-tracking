# Виправлення помилки nginx: invalid parameter "quic"

Помилка виникає, якщо в конфігурації nginx використовується параметр `quic` (HTTP/3), а встановлена версія nginx його не підтримує.

**На сервері виконай:**

1. Знайди файл, де використовується `quic`:
   ```bash
   sudo grep -r "quic" /etc/nginx/
   ```

2. Відкрий вказаний файл (наприклад `/etc/nginx/conf.d/realip.conf` або подібний):
   ```bash
   sudo nano /etc/nginx/conf.d/РЕЙЛ_З_КРОКУ_1
   ```

3. Знайди рядок на кшталт:
   ```nginx
   listen 443 ssl http2 quic;
   ```
   і прибери `quic`, залишивши:
   ```nginx
   listen 443 ssl http2;
   ```
   Збережи файл (Ctrl+O, Enter, Ctrl+X).

4. Перевір конфіг і перезавантаж nginx:
   ```bash
   sudo nginx -t
   sudo systemctl reload nginx
   ```

Якщо конфлікт із `server name "www.lehko.space"` — переконайся, що цей server_name оголошений лише в одному server { } блоці в межах одного файлу/конфігу.
