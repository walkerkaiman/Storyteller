@echo off
echo Starting Storyteller System...
echo.

echo Installing backend dependencies...
cd backend
call npm install
if %errorlevel% neq 0 (
    echo Failed to install backend dependencies
    pause
    exit /b 1
)

echo Installing frontend dependencies...
cd ..\frontend
call npm install
if %errorlevel% neq 0 (
    echo Failed to install frontend dependencies
    pause
    exit /b 1
)

echo Building frontend...
call npm run build
if %errorlevel% neq 0 (
    echo Failed to build frontend
    pause
    exit /b 1
)

echo.
echo Starting backend server...
cd ..\backend
start "Storyteller Backend" cmd /k "npm start"

echo.
echo Waiting for server to start...
timeout /t 5 /nobreak > nul

echo.
echo Opening dashboard in browser...
start http://localhost:3000/dashboard

echo.
echo ========================================
echo Storyteller System Started Successfully!
echo ========================================
echo.
echo Local Access:
echo Backend API: http://localhost:3000
echo Dashboard: http://localhost:3000/dashboard
echo Portal: http://localhost:3000
echo.
echo Network Access (for other devices):
echo Dashboard: http://YOUR_IP:3000/dashboard
echo Portal: http://YOUR_IP:3000
echo.
echo Dashboard Login:
echo Username: admin
echo Password: 1234
echo.
echo To find your network IP addresses, run: node find-network-ip.js
echo Or use: ipconfig
echo.
echo Press any key to stop the server...
pause > nul

echo Stopping server...
taskkill /f /im node.exe > nul 2>&1
echo Server stopped. 