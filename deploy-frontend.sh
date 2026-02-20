#!/bin/bash
# Збірка фронту і (опційно) копіювання в папку nginx.
# Використання:
#   ./deploy-frontend.sh              — тільки npm run build
#   ./deploy-frontend.sh /var/www/lehko.space   — збірка + копіювання в цю папку

set -e
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR/frontend"
echo "Building frontend..."
npm run build
echo "Build done: frontend/dist/"

if [ -n "$1" ]; then
  DEST="$1"
  sudo mkdir -p "$DEST"
  echo "Removing old assets in $DEST (so old index-*.js are gone)..."
  sudo rm -rf "$DEST"/assets "$DEST"/index.html
  echo "Copying new dist/* to $DEST"
  sudo cp -r dist/* "$DEST/"
  echo "Done. Reload browser with Ctrl+Shift+R to see changes."
else
  echo "To copy build to nginx root, run: sudo cp -r $SCRIPT_DIR/frontend/dist/* /path/from/nginx/root/"
  echo "Find nginx root: grep -E '^\s*root\s+' /etc/nginx/sites-enabled/affiliate-tracking"
fi
