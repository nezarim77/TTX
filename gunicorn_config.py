"""
Gunicorn configuration file for Railway production deployment.
This file provides lifecycle hooks to diagnose worker issues.
"""
import sys
import logging
import os

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format='[%(levelname)s] %(message)s',
    stream=sys.stderr,
    force=True
)
logger = logging.getLogger(__name__)

# ==================== WORKER LIFECYCLE HOOKS ====================

def post_worker_init(worker):
    """Called after a worker has been initialized."""
    logger.info(f"Worker {worker.pid} has been initialized and is ready to accept connections")
    sys.stderr.flush()

def worker_int(worker):
    """Called when a worker receives SIGINT or is interrupted."""
    logger.info(f"Worker {worker.pid} received SIGINT")
    sys.stderr.flush()

def worker_abort(worker):
    """Called when a worker is aborted."""
    logger.error(f"Worker {worker.pid} has been aborted")
    sys.stderr.flush()

# ==================== GUNICORN SERVER HOOKS ====================

def on_starting(server):
    """Called just before the master process is initialized."""
    logger.info("Gunicorn master process starting")
    sys.stderr.flush()

def when_ready(server):
    """Called just after the server is started."""
    logger.info("Gunicorn server is ready. Spawning workers")
    sys.stderr.flush()

def server_int(server):
    """Called when the server receives SIGINT."""
    logger.info("Gunicorn server stopping")
    sys.stderr.flush()

# ==================== GUNICORN SETTINGS ====================

# Get port from environment variable (Railway sets this)
PORT = int(os.environ.get('PORT', 8080))
bind = f"0.0.0.0:{PORT}"

workers = 2
worker_class = "gthread"
threads = 2
timeout = 120
graceful_timeout = 30
keep_alive = 5
access_log_format = '[%(h)s] "%(r)s" %(s)s %(b)s "%(f)s" "%(a)s"'
access_log = "-"
error_log = "-"
loglevel = "info"
