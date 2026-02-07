#!/usr/bin/env python
"""
Wrapper to run Gunicorn with proper PORT environment variable binding.
"""
import os
import sys
import subprocess

if __name__ == '__main__':
    # Debug: Check if app.py can be imported
    print("[STARTUP] Attempting to import app.py...", flush=True)
    try:
        import app
        print("[STARTUP] ✓ app.py imported successfully", flush=True)
    except Exception as e:
        print(f"[STARTUP] ✗ FAILED to import app.py: {e}", flush=True)
        print(f"[STARTUP] Error type: {type(e).__name__}", flush=True)
        import traceback
        traceback.print_exc()
        sys.exit(1)
    
    # Read PORT from environment variable, default to 8080 if not set
    port = os.environ.get('PORT', '8080')
    print(f"[STARTUP] PORT={port}", flush=True)
    
    # Check if PORT is actually set by Railway
    if 'PORT' in os.environ:
        print(f"[STARTUP] ✓ PORT environment variable is set", flush=True)
    else:
        print(f"[STARTUP] ⚠ PORT not in environment, using default 8080", flush=True)
    
    # Build gunicorn command with verbose logging
    cmd = [
        'gunicorn',
        'app:app',
        '--bind', f'0.0.0.0:{port}',
        '--workers', '1',
        '--worker-class', 'sync',
        '--timeout', '120',
        '--keep-alive', '5',
        '--access-logfile', '-',
        '--error-logfile', '-',
        '--log-level', 'debug',
    ]
    
    print(f"[STARTUP] Executing: {' '.join(cmd)}", flush=True)
    sys.stdout.flush()
    sys.stderr.flush()
    
    # Run gunicorn
    exit_code = subprocess.call(cmd)
    sys.exit(exit_code)
