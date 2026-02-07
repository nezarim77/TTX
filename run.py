#!/usr/bin/env python
"""
Simple wrapper to run Gunicorn with proper port binding.
Reads PORT from environment variable and passes it explicitly to gunicorn.
"""
import os
import sys
import subprocess

# Get PORT from environment, default to 8080
port = os.environ.get('PORT', '8080')
print(f"[STARTUP] PORT from environment: {port}")

# Build gunicorn command with explicit port
cmd = [
    'gunicorn',
    'app:app',
    f'--bind', f'0.0.0.0:{port}',
    '--workers', '1',
    '--timeout', '60',
    '--access-logfile', '-',
]

print(f"[STARTUP] Running: {' '.join(cmd)}")
sys.stdout.flush()

# Execute gunicorn
os.execvp(cmd[0], cmd)
