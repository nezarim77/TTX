#!/usr/bin/env python
import os
import sys

# Try to use Flask with Waitress WSGI server instead of Gunicorn
try:
    print("[STARTUP] Importing Flask app...", flush=True)
    from app import app
    print("[STARTUP] ✓ Flask app imported", flush=True)
    
    port = int(os.environ.get('PORT', '8080'))
    print(f"[STARTUP] Listening on port {port}", flush=True)
    
    # Try Waitress first (more cross-platform than Gunicorn)
    try:
        from waitress import serve
        print("[STARTUP] Using Waitress WSGI server", flush=True)
        serve(app, host='0.0.0.0', port=port, _quiet=False)
    except ImportError:
        print("[STARTUP] Waitress not available, trying Gunicorn...", flush=True)
        import subprocess
        subprocess.call([
            sys.executable, '-m', 'gunicorn',
            'app:app',
            '--bind', f'0.0.0.0:{port}',
            '--workers', '2',
            '--threads', '4',
            '--timeout', '60',
        ])
except Exception as e:
    print(f"[STARTUP] FATAL ERROR: {e}", flush=True)
    import traceback
    traceback.print_exc()
    sys.exit(1)
