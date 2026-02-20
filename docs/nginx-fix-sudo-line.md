# Помилка nginx: unknown directive "sudo"

Якщо nginx не запускається з помилкою:
```text
nginx: [emerg] unknown directive "sudo" in /etc/nginx/sites-enabled/affiliate-tracking:1
```

у файл конфігурації потрапив **перший рядок з командою** (наприклад `sudo nano ...` або `sudo ln -s ...`). Її потрібно видалити.

## Що зробити на сервері

1. Відкрити конфіг:
   ```bash
   sudo nano /etc/nginx/sites-enabled/affiliate-tracking
   ```

2. **Видалити перший рядок**, якщо там щось на кшталт:
   - `sudo nano /etc/nginx/sites-available/affiliate-tracking`
   - `sudo ln -s ...`
   - або будь-який інший рядок, що починається з `sudo` або не є директивою nginx.

3. Перший рядок файлу має бути або порожнім, або `server {`, або `# коментар`. Переконайтесь, що далі йде коректний блок `server { ... }`.

4. Зберегти: `Ctrl+O`, Enter, `Ctrl+X`.

5. Перевірити і перезапустити nginx:
   ```bash
   sudo nginx -t
   sudo systemctl restart nginx
   ```

Якщо не впевнені — покажіть перші 5–10 рядків файлу командою:
```bash
head -15 /etc/nginx/sites-enabled/affiliate-tracking
```
