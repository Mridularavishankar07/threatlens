@echo off
echo ============================================
echo   ThreatLens - Starting Up
echo ============================================

echo.
echo [1/4] Installing server dependencies...
cd server
call npm install
if %errorlevel% neq 0 (
  echo ERROR: npm install failed for server. Is Node.js installed?
  echo Download from: https://nodejs.org
  pause
  exit /b 1
)

echo.
echo [2/4] Seeding database with demo data...
call npm run seed
if %errorlevel% neq 0 (
  echo WARNING: Seed failed. Is MongoDB running?
  echo Try: net start MongoDB  (run as Administrator)
  echo Continuing anyway...
)

echo.
echo [3/4] Installing client dependencies...
cd ..\client
call npm install
if %errorlevel% neq 0 (
  echo ERROR: npm install failed for client.
  pause
  exit /b 1
)

echo.
echo [4/4] Starting servers...
echo.
echo Backend running at: http://localhost:5000
echo Frontend running at: http://localhost:3000
echo.
echo Demo Login:
echo   User:  arjun@student.college.edu / User@123
echo   Admin: admin@threatlens.io / Admin@123
echo.
echo Press Ctrl+C to stop.
echo ============================================

cd ..
start "ThreatLens Backend" cmd /k "cd server && npm run dev"
timeout /t 3 /nobreak >nul
start "ThreatLens Frontend" cmd /k "cd client && npm run dev"

echo Both servers are starting in separate windows.
echo Open http://localhost:3000 in your browser.
pause
