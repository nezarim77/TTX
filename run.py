#!/usr/bin/env python
"""Launch Gunicorn with proper PORT from environment variable."""
import os
import sys
import subprocess

if __name__ == '__main__':
    port = os.environ.get('PORT', '8080')
    args = ['gunicorn', 'app:app', '--bind', f'0.0.0.0:{port}', '--workers', '1']
    sys.exit(subprocess.call(args))
