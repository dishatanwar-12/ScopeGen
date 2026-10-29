#!/bin/bash
# ProposalCraft AI Local Shutdown Script

echo "=== Stopping ProposalCraft AI Services ==="
lsof -ti :8008 | xargs kill -9 2>/dev/null && echo "Backend (port 8008) stopped." || echo "Backend not running."
lsof -ti :5173 | xargs kill -9 2>/dev/null && echo "Frontend (port 5173) stopped." || echo "Frontend not running."
echo "All ProposalCraft AI processes stopped."

