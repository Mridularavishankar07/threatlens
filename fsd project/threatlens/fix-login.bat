@echo off
title ThreatLens - Login Issue Fix
color 0E

echo.
echo ============================================
echo   ThreatLens - Login Issue Fixer
echo ============================================
echo.
echo This script will:
echo   1. Check system requirements
echo   2. Verify MongoDB connection
echo   3. Re-seed the database
echo   4. Test authentication
echo   5. Clear browser cache instructions
echo.
pause

REM Check if MongoDB is running
echo.
echo [Step 1] Checking MongoDB...
sc query MongoDB | find "RUNNING" >nul 2>&1
if %errorlevel% neq 0 (
  color 0C
  echo ERROR: MongoDB service is NOT running
  echo.
  echo Attempting to start MongoDB...
  net start MongoDB >nul 2>&1
  if %errorlevel% neq 0 (
    echo FAILED: Could not start MongoDB service
    echo.
    echo Please run this as Administrator:
    echo   net start MongoDB
    echo.
    echo Or install MongoDB from:
    echo   https://www.mongodb.com/try/download/community
    echo.
    pause
    exit /b 1
  ) else (
    color 0A
    echo SUCCESS: MongoDB service started!
  )
) else (
  color 0A
  echo SUCCESS: MongoDB service is running
)

REM Check server dependencies
echo.
echo [Step 2] Checking server dependencies...
cd server
if not exist node_modules (
  color 0E
  echo Installing dependencies...
  call npm install
  if %errorlevel% neq 0 (
    color 0C
    echo ERROR: Failed to install dependencies
    cd ..
    pause
    exit /b 1
  )
) else (
  echo Dependencies found
)

REM Re-seed database
echo.
echo [Step 3] Re-seeding database...
color 0A
call npm run seed
if %errorlevel% neq 0 (
  color 0C
  echo ERROR: Database seeding failed
  echo.
  echo Please check:
  echo   1. MongoDB is running: sc query MongoDB
  echo   2. Connection string in server/.env file
  echo.
  cd ..
  pause
  exit /b 1
) else (
  echo SUCCESS: Database seeded!
)

REM Test authentication
echo.
echo [Step 4] Testing authentication...
node test-auth.js
if %errorlevel% neq 0 (
  color 0C
  echo.
  echo WARNING: Authentication test failed
  echo Check the output above for details
  echo.
) else (
  color 0A
  echo.
  echo SUCCESS: Authentication test passed!
)

cd ..

REM Instructions
color 0A
echo.
echo ============================================
echo   Fix Complete!
echo ============================================
echo.
echo [Step 5] Clear your browser cache:
echo.
echo   1. Open your browser (where you're testing the app)
echo   2. Press F12 to open Developer Tools
echo   3. Go to Console tab
echo   4. Type: localStorage.clear()
echo   5. Press Enter
echo   6. Type: location.reload()
echo   7. Press Enter
echo.
echo OR simply open an Incognito/Private window
echo.
echo ============================================
echo   Start the application:
echo ============================================
echo.
echo Run: start-with-checks.bat
echo.
echo Or manually:
echo   Terminal 1: cd server ^&^& npm run dev
echo   Terminal 2: cd client ^&^& npm run dev
echo.
echo Then try logging in with:
echo   Email:    arjun@student.college.edu
echo   Password: User@123
echo.
echo Or admin account:
echo   Email:    admin@threatlens.io
echo   Password: Admin@123
echo.
echo ============================================
pause
