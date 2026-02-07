#!/usr/bin/env python
import os
import sys

print("[STARTUP] Environment check:", flush=True)
print(f"  PORT={os.environ.get('PORT', 'NOT SET')}", flush=True)
print(f"  RAILWAY_PUBLIC_DOMAIN={os.environ.get('RAILWAY_PUBLIC_DOMAIN', 'NOT SET')}", flush=True)

# Check all env vars that contain PORT or SERVICE
for key in sorted(os.environ.keys()):
    if 'PORT' in key or 'SERVICE' in key:
        print(f"  {key}={os.environ[key]}", flush=True)

sys.stdout.flush()

# Try to use Flask with Waitress WSGI server instead of Gunicorn
try:
    print("[STARTUP] Importing Flask app...", flush=True)
    from app import app
    print("[STARTUP] ✓ Flask app imported", flush=True)
    
    port = int(os.environ.get('PORT', '8080'))
    print(f"[STARTUP] Using port: {port}", flush=True)
    sys.stdout.flush()
    
    # Try Waitress first (more cross-platform than Gunicorn)
    try:
        from waitress import serve
        print("[STARTUP] Using Waitress WSGI server", flush=True)
        sys.stdout.flush()
        serve(app, host='0.0.0.0', port=port)
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
