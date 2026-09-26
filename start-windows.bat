@echo off
title Unlimited Claude - AI Chat
REM Mehrzad ArianMehr©

cd /d "%~dp0"

echo ============================================
echo    Unlimited Claude - AI Chat
echo    Starting up...
echo    (c) Mehrzad ArianMehr
echo ============================================
echo.

REM ---- Check for Bun ----
where bun >nul 2>nul
if errorlevel 1 (
  echo [ERROR] Bun is not installed or not on PATH.
  echo.
  echo Install Bun from: https://bun.sh
  echo   Windows ^(PowerShell^):  powershell -c "irm bun.sh/install.ps1 ^| iex"
  echo.
  pause
  exit /b 1
)

REM ---- Enter the app folder (the actual Next.js project lives here) ----
cd /d "%~dp0app"

echo [1/3] Installing dependencies ^(bun install^)...
call bun install
if errorlevel 1 (
  echo [ERROR] Dependency installation failed.
  pause
  exit /b 1
)
echo.

echo [2/3] Setting up the database ^(bun run db:push^)...
call bun run db:push
echo.

echo [3/3] Starting the dev server...
echo.
echo ============================================
echo  The app will open in your browser shortly.
echo  URL: http://localhost:3000
echo  Press Ctrl+C in this window to stop.
echo ============================================
echo.

REM open the browser after a short delay, then run the dev server
start "" /b cmd /c "timeout /t 4 /nobreak >nul && start http://localhost:3000"

call bun run dev

echo.
echo Server stopped. Press any key to close this window.
pause >nul
