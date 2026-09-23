# Soft 404 (SPA) — Search Console

Google marks URLs as **Soft 404** when the server returns **HTTP 200** but the page is empty / “not found”.

## What is intentional

`robots.txt` **Disallow** for `/dashboard`, `/login`, `/api/`, `/r/`, etc. is intentional.
Those show as “Blocked by robots.txt” in GSC — that is not a Soft 404 bug.

## What we fixed

1. **Node** (`server.js`): unknown SPA paths and missing blog posts return **HTTP 404** while still serving the SPA shell (client `NotFound` / blog error UI). Response includes `X-Robots-Tag: noindex, nofollow` and no self-canonical.
2. **Nginx** (`scripts/lehko.space.nginx.fixed.conf`): SPA fallback is `try_files $uri @nodejs_spa` (proxy to Node), **not** `try_files … /index.html`.

## Deploy checklist (VPS)

```bash
# After git pull + pm2 restart:
sudo cp scripts/lehko.space.nginx.fixed.conf /etc/nginx/sites-available/lehko.space
# (or merge the location = / and @nodejs_spa blocks into the live config)
sudo nginx -t && sudo systemctl reload nginx
```

Verify:

```bash
curl -sI 'https://lehko.space/this-page-does-not-exist' | head -1   # expect HTTP/2 404
curl -sI 'https://lehko.space/blog/missing-slug-xyz' | head -1      # expect HTTP/2 404
curl -sI 'https://lehko.space/guide' | head -1                      # expect HTTP/2 200
```
