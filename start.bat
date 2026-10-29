@echo off
setlocal
cd /d "%~dp0"

echo ===================================================
echo Starting ProposalCraft AI Services...
echo ===================================================

echo [1/2] Launching FastAPI Backend on http://localhost:8008...
start "ProposalCraft Backend (Port 8008)" /D "%~dp0" "%~dp0backend\venv\Scripts\python.exe" -m uvicorn backend.app.main:app --host 0.0.0.0 --port 8008

ping 127.0.0.1 -n 4 >nul

echo [2/2] Launching Vite Frontend on http://localhost:5173...
start "ProposalCraft Frontend (Port 5173)" /D "%~dp0frontend" cmd /k "npm run dev -- --host 0.0.0.0 --port 5173"

echo ===================================================
echo ProposalCraft AI is running!
echo Frontend:     http://localhost:5173
echo Backend Docs: http://localhost:8008/docs
echo ===================================================

