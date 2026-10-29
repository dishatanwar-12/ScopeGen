import sys
from pathlib import Path

# Ensure both backend directory and repository root are on sys.path
backend_dir = Path(__file__).resolve().parent
project_root = backend_dir.parent

for p in (project_root, backend_dir):
    if str(p) not in sys.path:
        sys.path.insert(0, str(p))

from backend.app.main import app

# Expose app for Vercel Python runtime
__all__ = ["app"]

