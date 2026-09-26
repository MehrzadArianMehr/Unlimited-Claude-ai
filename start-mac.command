#!/bin/bash
# Mehrzad ArianMehr©
# Unlimited Claude - macOS launcher

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
  echo "  macOS:  curl -fsSL https://bun.sh/install | bash"
  echo
  read -rp "Press Enter to close..."
  exit 1
fi

cd "$(dirname "$0")/app" || { echo "[ERROR] app/ folder not found."; read -rp "Press Enter..."; exit 1; }

echo "[1/3] Installing dependencies (bun install)..."
bun install || { echo "[ERROR] Dependency installation failed."; read -rp "Press Enter..."; exit 1; }
echo

echo "[2/3] Setting up the database (bun run db:push)..."
bun run db:push
echo

echo "[3/3] Starting the dev server..."
echo
echo "============================================"
echo "  The app will open in your browser shortly."
echo "  URL: http://localhost:3000"
echo "  Press Ctrl+C in this window to stop."
echo "============================================"
echo

( sleep 4 && open "http://localhost:3000" 2>/dev/null ) &

bun run dev

echo
echo "Server stopped."
read -rp "Press Enter to close..."
