#!/usr/bin/env python
"""Launch Gunicorn with proper PORT from environment variable."""
import os
import sys
import subprocess

if __name__ == '__main__':
    port = os.environ.get('PORT')
    print(f"[RUN.PY] PORT environment variable: {port}", flush=True)
    
    if port is None:
        port = '8080'
        print(f"[RUN.PY] PORT not set, using default: {port}", flush=True)
    
    # Debug: list all env vars containing PORT
    for key in sorted(os.environ.keys()):
        if 'PORT' in key.upper():
            print(f"[RUN.PY] Found env var: {key}={os.environ[key]}", flush=True)
    
    sys.stdout.flush()
    
    args = ['gunicorn', 'app:app', '--bind', f'0.0.0.0:{port}', '--workers', '1']
    print(f"[RUN.PY] Launching: {' '.join(args)}", flush=True)
    sys.stdout.flush()
    
    sys.exit(subprocess.call(args))
