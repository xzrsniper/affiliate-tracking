#!/usr/bin/env python3
"""Run on server: patch lehko.space nginx /assets/ block."""
path = "/etc/nginx/sites-available/lehko.space"
with open(path, encoding="utf-8") as f:
    s = f.read()
old = """    location ^~ /assets/ {
        expires 1y;
        add_header Cache-Control \"public, max-age=31536000, immutable\" always;
        access_log off;
    }"""
new = """    location ^~ /assets/ {
        try_files $uri =404;
        expires 1y;
        add_header Cache-Control \"public, max-age=31536000, immutable\" always;
        access_log off;
    }"""
if old not in s:
    raise SystemExit("old_block_not_found")
with open(path, "w", encoding="utf-8", newline="\n") as f:
    f.write(s.replace(old, new, 1))
print("patched_try_files")
