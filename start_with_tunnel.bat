@echo off
echo ============================================
echo  Rift Apps -- Local Backend + Public Tunnel
echo ============================================
echo.
echo [1/2] Starting FastAPI backend on port 8000...
start "Rift Backend" cmd /k "cd /d %~dp0backend && .venv\Scripts\activate && set PYTHONUTF8=1 && python main.py"
echo     Backend started.
timeout /t 3 /nobreak >nul

echo.
echo [2/2] Creating public tunnel via localtunnel...
echo     Your public API URL will appear below.
echo     Copy the URL and paste it in selfcare-pup/.env.local and fitforge/.env.local
echo     as: EXPO_PUBLIC_API_URL=https://your-url.loca.lt
echo.
npx localtunnel --port 8000 --subdomain rift-apps-api
pause
