#!/bin/bash
# ProposalCraft AI Local Startup Script

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$PROJECT_ROOT"

echo "=== Starting ProposalCraft AI Services ==="

# 1. Kill any existing instances on 8008 or 5173
lsof -ti :8008 | xargs kill -9 2>/dev/null || true
lsof -ti :5173 | xargs kill -9 2>/dev/null || true

# 2. Start Backend API on port 8008
echo "Starting FastAPI backend on port 8008..."
source backend/.venv/bin/activate
PYTHONPATH=. nohup python3 -m uvicorn backend.app.main:app --host 0.0.0.0 --port 8008 </dev/null > backend.log 2>&1 &
BACKEND_PID=$!
echo "Backend started with PID: $BACKEND_PID"

# 3. Start Frontend SPA on port 5173
echo "Starting Vite frontend on port 5173..."
cd "$PROJECT_ROOT/frontend"
nohup npx vite --host 0.0.0.0 </dev/null > ../frontend.log 2>&1 &
FRONTEND_PID=$!
echo "Frontend started with PID: $FRONTEND_PID"

# 4. Wait for readiness
sleep 2

echo ""
echo "=== ProposalCraft AI is Ready ==="
echo "Frontend: http://localhost:5173"
echo "Backend Docs: http://localhost:8008/docs"
echo "Health: http://localhost:8008/api/v1/system/health"
echo "Logs: backend.log and frontend.log"
