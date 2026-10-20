@echo off
title ThreatLens Startup
color 0A

echo.
echo ============================================
echo   ThreatLens - Smart Startup Script
echo ============================================
echo.

REM Check Node.js
echo [1/7] Checking Node.js...
node --version >nul 2>&1
if %errorlevel% neq 0 (
  color 0C
  echo ERROR: Node.js is not installed!
  echo.
  echo Please download and install Node.js from:
  echo https://nodejs.org
  echo.
  pause
  exit /b 1
)
echo     Found: 
node --version
echo.

REM Check npm
echo [2/7] Checking npm...
npm --version >nul 2>&1
if %errorlevel% neq 0 (
  color 0C
  echo ERROR: npm is not available!
  echo Please reinstall Node.js from: https://nodejs.org
  echo.
  pause
  exit /b 1
)
echo     Found: 
npm --version
echo.

REM Check MongoDB
echo [3/7] Checking MongoDB...
sc query MongoDB | find "RUNNING" >nul 2>&1
if %errorlevel% equ 0 (
  echo     MongoDB service is running!
) else (
  mongod --version >nul 2>&1
  if %errorlevel% equ 0 (
    echo     MongoDB executable found!
  ) else (
    echo     Attempting to start MongoDB service...
    net start MongoDB >nul 2>&1
    if %errorlevel% equ 0 (
      color 0A
      echo     MongoDB service started successfully!
    ) else (
      color 0E
      echo WARNING: MongoDB service is not running or not in PATH
      echo.
      echo Options:
      echo   1. Start service as Administrator: net start MongoDB
      echo   2. Install MongoDB: https://www.mongodb.com/try/download/community
      echo   3. Use MongoDB Atlas cloud: https://www.mongodb.com/cloud/atlas
      echo.
      echo Press any key to continue anyway or Ctrl+C to exit...
      pause >nul
    )
  )
)
echo.

REM Install server dependencies
echo [4/7] Installing server dependencies...
cd server
if not exist node_modules (
  echo     Installing...
  call npm install
  if %errorlevel% neq 0 (
    color 0C
    echo ERROR: Failed to install server dependencies
    cd ..
    pause
    exit /b 1
  )
) else (
  echo     Already installed
)
cd ..
echo.

REM Install client dependencies
echo [5/7] Installing client dependencies...
cd client
if not exist node_modules (
  echo     Installing...
  call npm install
  if %errorlevel% neq 0 (
    color 0C
    echo ERROR: Failed to install client dependencies
    cd ..
    pause
    exit /b 1
  )
) else (
  echo     Already installed
)
cd ..
echo.

REM Seed database
echo [6/7] Seeding database...
cd server
call npm run seed >nul 2>&1
if %errorlevel% neq 0 (
  color 0E
  echo     WARNING: Database seeding failed
  echo     This usually means MongoDB is not running
  echo.
  echo     To fix:
  echo       1. Start MongoDB: net start MongoDB (as Administrator)
  echo       2. Run: cd server ^&^& npm run seed
  echo.
  echo     Press any key to continue anyway or Ctrl+C to exit...
  pause >nul
) else (
  echo     Database seeded successfully!
)
cd ..
echo.

REM Start servers
color 0A
echo [7/7] Starting servers...
echo.
echo ============================================
echo   ThreatLens is starting!
echo ============================================
echo.
echo   Backend:  http://localhost:5000/api/health
echo   Frontend: http://localhost:3000
echo.
echo   Demo Credentials:
echo   ----------------
echo   User:  arjun@student.college.edu / User@123
echo   Admin: admin@threatlens.io / Admin@123
echo.
echo   Two new windows will open:
echo   - Backend Server (port 5000)
echo   - Frontend Server (port 3000)
echo.
echo   Press Ctrl+C in those windows to stop servers
echo ============================================
echo.
echo Press any key to start...
pause >nul

start "ThreatLens Backend" cmd /k "color 0B && cd /d "%~dp0server" && echo Starting Backend Server... && npm run dev"
timeout /t 3 /nobreak >nul
start "ThreatLens Frontend" cmd /k "color 0E && cd /d "%~dp0client" && echo Starting Frontend Server... && npm run dev"

echo.
echo Both servers are starting...
echo Open http://localhost:3000 in your browser
echo.
echo If you see login errors, run: node diagnose.js
echo For detailed help, see: TROUBLESHOOTING.md
echo.
pause
