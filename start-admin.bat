@echo off
echo ============================================
echo   BLOOM ADMIN DASHBOARD - STARTUP SCRIPT
echo ============================================
echo.

echo [1/3] Checking if Node.js is installed...
node --version
if %errorlevel% neq 0 (
    echo ERROR: Node.js is not installed!
    echo Please install Node.js from https://nodejs.org
    pause
    exit /b 1
)
echo ✓ Node.js is installed
echo.

echo [2/3] Checking if npm is installed...
npm --version
if %errorlevel% neq 0 (
    echo ERROR: npm is not installed!
    pause
    exit /b 1
)
echo ✓ npm is installed
echo.

echo [3/3] Navigating to admin folder...
cd /d "%~dp0admin"
if %errorlevel% neq 0 (
    echo ERROR: Could not find admin folder!
    pause
    exit /b 1
)
echo ✓ Admin folder found
echo.

echo ============================================
echo   STARTING ADMIN DEV SERVER
echo ============================================
echo.
echo The admin dashboard will open in your browser.
echo Backend must be running on http://localhost:5000
echo.
echo Press Ctrl+C to stop the server
echo.

npm run dev

pause
