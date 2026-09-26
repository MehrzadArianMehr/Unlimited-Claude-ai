#!/bin/bash
# Mehrzad ArianMehr©
# Unlimited Claude - Linux launcher

cd "$(dirname "$0")" || exit 1

echo "============================================"
echo "   Unlimited Claude - AI Chat"
echo "   Starting up..."
echo "   (c) Mehrzad ArianMehr"
echo "============================================"
echo

if ! command -v bun >/dev/null 2>&1; then
  echo "[ERROR] Bun is not installed."
  echo "Install from: https://bun.sh"
  echo "  Linux:  curl -fsSL https://bun.sh/install | bash"
  echo
  read -rp "Press Enter to close..."
  exit 1
fi

cd "$(dirname "$0")/app" || { echo "[ERROR] app/ folder not found."; read -rp "Press Enter..."; exit 1; }

echo "[1/4] Installing dependencies (bun install)..."
bun install || { echo "[ERROR] Dependency installation failed."; read -rp "Press Enter..."; exit 1; }
echo

echo "[2/4] Generating Prisma client (prisma generate)..."
bun run db:generate 2>/dev/null || npx prisma generate
echo

echo "[3/4] Setting up the database (bun run db:push)..."
mkdir -p db
bun run db:push
echo

echo "[4/4] Starting the dev server..."
rm -rf .next 2>/dev/null
echo
echo "============================================"
echo "  The app will open in your browser shortly."
echo "  URL: http://localhost:3000"
echo "  Press Ctrl+C in this window to stop."
echo "============================================"
echo

open_browser() {
  if command -v xdg-open >/dev/null 2>&1; then
    xdg-open "http://localhost:3000" 2>/dev/null
  elif command -v sensible-browser >/dev/null 2>&1; then
    sensible-browser "http://localhost:3000" 2>/dev/null
  else
    for b in firefox chromium google-chrome chromium-browser brave-browser; do
      command -v "$b" >/dev/null 2>&1 && { "$b" "http://localhost:3000" 2>/dev/null & return; }
    done
  fi
}
( sleep 4 && open_browser ) &

bun run dev

echo
echo "Server stopped."
read -rp "Press Enter to close..."
