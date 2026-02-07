#!/usr/bin/env python
"""Minimal wrapper to properly read PORT environment variable and launch Gunicorn."""
import os
import sys
import subprocess

if __name__ == '__main__':
    port = os.environ.get('PORT', '8080')
    
    # Launch Gunicorn with explicit PORT from environment
    subprocess.call([
        'gunicorn',
        'app:app',
        '--bind', f'0.0.0.0:{port}',
        '--workers', '1',
    ])
