@echo off
setlocal
echo Stopping ProposalCraft AI services on ports 8008 and 5173...

for /f "tokens=5" %%a in ('netstat -aon ^| findstr :8008 ^| findstr LISTENING') do (
    echo Terminating PID %%a on port 8008
    taskkill /F /PID %%a >nul 2>&1
)

for /f "tokens=5" %%a in ('netstat -aon ^| findstr :5173 ^| findstr LISTENING') do (
    echo Terminating PID %%a on port 5173
    taskkill /F /PID %%a >nul 2>&1
)

echo Services stopped.
