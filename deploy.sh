#!/usr/bin/env bash
# =============================================================================
#  LehkoTrack — автоматичний деплой на VPS (Ubuntu/Debian)
#  Використання: bash deploy.sh [--update]
#
#  Перший запуск: повне встановлення (Node, MySQL, PM2, Nginx)
#  Повторний:     git pull + rebuild + pm2 restart
# =============================================================================
set -euo pipefail

APP_DIR="/var/www/affiliate-tracking"
REPO_URL="https://github.com/xzrsniper/affiliate-tracking.git"
BRANCH="main"
NODE_VERSION="20"
APP_NAME="affiliate-tracking-api"

GREEN='\033[0;32m'; YELLOW='\033[1;33m'; RED='\033[0;31m'; NC='\033[0m'
info()  { echo -e "${GREEN}[INFO]${NC}  $*"; }
warn()  { echo -e "${YELLOW}[WARN]${NC}  $*"; }
error() { echo -e "${RED}[ERROR]${NC} $*"; exit 1; }

UPDATE_ONLY=false
[[ "${1:-}" == "--update" ]] && UPDATE_ONLY=true

# ─── helpers ──────────────────────────────────────────────────────────────────
require_root() { [[ $EUID -eq 0 ]] || error "Запустіть від root: sudo bash deploy.sh"; }
require_root

# ─── 1. Базові пакети ─────────────────────────────────────────────────────────
if ! $UPDATE_ONLY; then
  info "Оновлення системи та встановлення залежностей..."
  apt-get update -y
  apt-get install -y git curl build-essential nginx certbot python3-certbot-nginx ufw

  # Node.js
  if ! command -v node &>/dev/null || [[ $(node -e "process.version.split('.')[0].slice(1)") -lt $NODE_VERSION ]]; then
    info "Встановлення Node.js $NODE_VERSION..."
    curl -fsSL https://deb.nodesource.com/setup_${NODE_VERSION}.x | bash -
    apt-get install -y nodejs
  fi
  info "Node: $(node -v) | npm: $(npm -v)"

  # PM2
  if ! command -v pm2 &>/dev/null; then
    info "Встановлення PM2..."
    npm install -g pm2
  fi

  # MySQL
  if ! command -v mysql &>/dev/null; then
    info "Встановлення MySQL..."
    apt-get install -y mysql-server
    systemctl enable mysql
    systemctl start mysql
  fi
fi

# ─── 2. Репозиторій ───────────────────────────────────────────────────────────
if [[ -d "$APP_DIR/.git" ]]; then
  info "Оновлення коду ($BRANCH)..."
  git -C "$APP_DIR" fetch origin
  git -C "$APP_DIR" reset --hard origin/$BRANCH
else
  info "Клонування репозиторію..."
  mkdir -p "$(dirname $APP_DIR)"
  git clone --branch "$BRANCH" "$REPO_URL" "$APP_DIR"
fi
cd "$APP_DIR"

# ─── 3. .env ──────────────────────────────────────────────────────────────────
if [[ ! -f "$APP_DIR/.env" ]]; then
  warn ".env не знайдено — створюю шаблон. Відредагуйте його і запустіть знову з --update!"
  cat > "$APP_DIR/.env" <<'EOF'
# ── Database ──────────────────────────────────────
DB_HOST=localhost
DB_PORT=3306
DB_NAME=affiliate_tracking
DB_USER=affiliate_user
DB_PASSWORD=CHANGE_ME_DB_PASSWORD

# ── Server ────────────────────────────────────────
PORT=3000
NODE_ENV=production
JWT_SECRET=CHANGE_ME_GENERATE_RANDOM_64_CHARS

# ── Admin ─────────────────────────────────────────
ADMIN_EMAIL=admin@yourdomain.com

# ── Google OAuth (optional) ───────────────────────
# GOOGLE_CLIENT_ID=
# GOOGLE_CLIENT_SECRET=

# ── Email / SMTP (optional) ───────────────────────
# SMTP_HOST=smtp.gmail.com
# SMTP_PORT=587
# SMTP_USER=
# SMTP_PASS=
# EMAIL_FROM=noreply@yourdomain.com
EOF
  warn "Відредагуйте /var/www/affiliate-tracking/.env і запустіть: bash deploy.sh --update"
  exit 0
fi

# ─── 4. Frontend .env ─────────────────────────────────────────────────────────
if [[ ! -f "$APP_DIR/frontend/.env" ]]; then
  # Try to guess domain from nginx configs
  DOMAIN=$(nginx -T 2>/dev/null | grep -oP '(?<=server_name )[^\s;]+' | grep -v '_' | head -1 || true)
  DOMAIN="${DOMAIN:-https://YOUR_DOMAIN}"
  cat > "$APP_DIR/frontend/.env" <<EOF
VITE_API_URL=${DOMAIN}
# VITE_GOOGLE_CLIENT_ID=
EOF
fi

# ─── 5. MySQL: база даних ─────────────────────────────────────────────────────
if ! $UPDATE_ONLY; then
  info "Налаштування MySQL..."
  source "$APP_DIR/.env"
  mysql -u root <<SQL 2>/dev/null || true
CREATE DATABASE IF NOT EXISTS \`${DB_NAME}\`;
CREATE USER IF NOT EXISTS '${DB_USER}'@'localhost' IDENTIFIED BY '${DB_PASSWORD}';
GRANT ALL PRIVILEGES ON \`${DB_NAME}\`.* TO '${DB_USER}'@'localhost';
FLUSH PRIVILEGES;
SQL
fi

# ─── 6. Залежності ────────────────────────────────────────────────────────────
info "Встановлення залежностей backend..."
npm ci --omit=dev

info "Встановлення та білд frontend..."
cd frontend
npm ci
npm run build
cd "$APP_DIR"

# ─── 7. БД: ініціалізація / міграції ─────────────────────────────────────────
info "Ініціалізація схеми БД..."
node scripts/init-db.js 2>/dev/null || warn "init-db.js повернув помилку (можливо таблиці вже існують)"
node scripts/ensure-conversions-schema.js 2>/dev/null || true
node scripts/add-affiliate-system.js 2>/dev/null || true
node scripts/add-link-split-test.js 2>/dev/null || true

# ─── 8. Nginx ─────────────────────────────────────────────────────────────────
if ! $UPDATE_ONLY; then
  read -rp "Введіть домен (наприклад: lehkotrack.com, або залиште порожнім для IP): " DOMAIN
  DOMAIN="${DOMAIN:-_}"

  cat > /etc/nginx/sites-available/affiliate-tracking <<NGINX
server {
    listen 80;
    server_name ${DOMAIN};

    # Frontend (SPA)
    root ${APP_DIR}/frontend/dist;
    index index.html;

    location / {
        try_files \$uri \$uri/ /index.html;
    }

    # Short redirect links
    location ~* ^/r/ {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }
    location ~* ^/track {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }
    location = /tracker.js {
        proxy_pass http://127.0.0.1:3000;
    }
    location = /console-code {
        proxy_pass http://127.0.0.1:3000;
    }

    # Backend API
    location /api {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
        client_max_body_size 10M;
    }

    # Gzip
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml image/svg+xml;
    gzip_min_length 1024;
}
NGINX

  ln -sf /etc/nginx/sites-available/affiliate-tracking /etc/nginx/sites-enabled/ 2>/dev/null || true
  rm -f /etc/nginx/sites-enabled/default 2>/dev/null || true
  nginx -t && systemctl reload nginx
  info "Nginx налаштовано"

  if [[ "$DOMAIN" != "_" ]]; then
    read -rp "Налаштувати SSL через Let's Encrypt? [y/N]: " SSL
    if [[ "${SSL,,}" == "y" ]]; then
      certbot --nginx -d "$DOMAIN" --non-interactive --agree-tos --email "$(grep ADMIN_EMAIL $APP_DIR/.env | cut -d= -f2)"
    fi
  fi
fi

# ─── 9. PM2 ───────────────────────────────────────────────────────────────────
info "Запуск/перезапуск через PM2..."
if pm2 describe "$APP_NAME" &>/dev/null; then
  pm2 reload "$APP_NAME" --update-env
else
  pm2 start "$APP_DIR/ecosystem.config.cjs" --env production
fi
pm2 save

if ! $UPDATE_ONLY; then
  pm2 startup systemd -u root --hp /root | tail -1 | bash || true
fi

# ─── 10. UFW firewall ─────────────────────────────────────────────────────────
if ! $UPDATE_ONLY && command -v ufw &>/dev/null; then
  ufw allow OpenSSH
  ufw allow 'Nginx Full'
  ufw --force enable
fi

# ─── Done ─────────────────────────────────────────────────────────────────────
info "=== ДЕПЛОЙ ЗАВЕРШЕНО ==="
echo ""
pm2 status
echo ""
info "Фронтенд:  http://$(curl -s ifconfig.me 2>/dev/null || echo YOUR_IP)"
info "API health: http://$(curl -s ifconfig.me 2>/dev/null || echo YOUR_IP)/api/health"
info ""
info "Для оновлення в майбутньому: bash $APP_DIR/deploy.sh --update"
