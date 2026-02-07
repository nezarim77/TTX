from flask import Flask, jsonify

app = Flask(__name__)

print("[APP] Minimal Flask app created", flush=True)

@app.route('/test')
def test():
    print("[APP] /test endpoint called", flush=True)
    return jsonify({'message': 'test ok'})

@app.route('/api/health')
def health():
    print("[APP] /api/health endpoint called", flush=True)
    return jsonify({'status': 'ok'})

if __name__ == '__main__':
    app.run()
