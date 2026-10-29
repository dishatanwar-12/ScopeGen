import sys
import types
from pathlib import Path

# Ensure current directory (/var/task on Vercel) is on sys.path
backend_dir = Path(__file__).resolve().parent
if str(backend_dir) not in sys.path:
    sys.path.insert(0, str(backend_dir))

# When deployed inside Vercel serverless with root: "backend", the directory contains "app/".
# Register virtual 'backend' package so that 'from backend.app... import ...' imports resolve seamlessly.
try:
    import backend
except ImportError:
    backend_pkg = types.ModuleType("backend")
    import app
    backend_pkg.app = app
    sys.modules["backend"] = backend_pkg
    sys.modules["backend.app"] = app

from backend.app.main import app

__all__ = ["app"]
