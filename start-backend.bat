@echo off
echo ============================================
echo   BLOOM BACKEND SERVER - STARTUP SCRIPT
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

echo [3/3] Navigating to backend folder...
cd /d "%~dp0backend"
if %errorlevel% neq 0 (
    echo ERROR: Could not find backend folder!
    pause
    exit /b 1
)
echo ✓ Backend folder found
echo.

echo ============================================
echo   STARTING BACKEND SERVER
echo ============================================
echo.
echo Backend will start on http://localhost:5000
echo MongoDB must be running for this to work
echo.
echo Press Ctrl+C to stop the server
echo.

npm start

pause
