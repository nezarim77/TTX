#!/usr/bin/env python
"""
Wrapper to run Gunicorn with proper PORT environment variable binding.
"""
import os
import sys
import subprocess

if __name__ == '__main__':
    # Read PORT from environment variable, default to 8080 if not set
    port = os.environ.get('PORT', '8080')
    print(f"[STARTUP] PORT={port}", flush=True)
    
    # Build gunicorn command
    cmd = [
        'gunicorn',
        'app:app',
        '--bind', f'0.0.0.0:{port}',
        '--workers', '1',
        '--timeout', '60',
        '--access-logfile', '-',
    ]
    
    print(f"[STARTUP] Executing: {' '.join(cmd)}", flush=True)
    sys.stdout.flush()
    
    # Run gunicorn
    exit_code = subprocess.call(cmd)
    sys.exit(exit_code)
