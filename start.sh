#!/bin/bash
set -e

# Get port from environment, default to 8080 if not set
PORT=${PORT:-8080}

# Run gunicorn with explicit port
exec gunicorn app:app --bind 0.0.0.0:$PORT --workers 1 --timeout 60 --access-logfile -
