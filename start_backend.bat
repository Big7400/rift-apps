@echo off
echo ========================================
echo  Rift Apps Backend + Tunnel Launcher
echo ========================================
echo.

cd /d %~dp0backend

echo [1/3] Starting FastAPI backend on port 8000...
start "Rift Backend" cmd /k "call .venv\Scripts\activate && set PYTHONUTF8=1 && python main.py"

echo [2/3] Waiting for backend to start...
timeout /t 4 /nobreak >nul

echo [3/3] Starting serveo.net tunnel...
start "Rift Tunnel" cmd /k "ssh -o StrictHostKeyChecking=no -R 80:localhost:8000 serveo.net"

echo.
echo Backend: http://localhost:8000/docs
echo Tunnel: see "Rift Tunnel" window for public URL
echo.
echo NOTE: Copy the serveo URL from the tunnel window and update:
echo   selfcare-pup\.env.local
echo   fitforge\.env.local
echo.
pause
