from flask import Flask, jsonify
import sys

print("[APP] Starting import...", flush=True, file=sys.stderr)
sys.stderr.flush()

app = Flask(__name__)

print("[APP] Minimal Flask app created", flush=True, file=sys.stderr)
sys.stderr.flush()

@app.route('/test')
def test():
    print("[APP] /test endpoint called", flush=True)
    return jsonify({'message': 'test ok'})

@app.route('/api/health')
def health():
    print("[APP] /api/health endpoint called", flush=True, file=sys.stderr)
    sys.stderr.flush()
    return jsonify({'status': 'ok'})

print("[APP] ✓ Routes registered", flush=True, file=sys.stderr)
sys.stderr.flush()

if __name__ == '__main__':
    app.run()
