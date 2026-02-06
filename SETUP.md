# Setup Guide - TTX Backend Server

## Prerequisites
- Python 3.8 atau lebih tinggi
- pip (Python package manager)

## Langkah-Langkah Instalasi

### 1. Install Python Dependencies
Open terminal di folder project dan jalankan:

```bash
pip install -r requirements.txt
```

Atau jika menggunakan Python 3.x secara eksplisit:
```bash
python -m pip install -r requirements.txt
```

### 2. Menjalankan Server

```bash
python app.py
```

Anda akan melihat output seperti ini:
```
==================================================
TTX (Teka-Teki Extra) - Backend Server
==================================================

Server berjalan di: http://localhost:5000
CORS enabled for frontend communication

Endpoints tersedia:
  - POST   /api/rooms
  - GET    /api/rooms/<code>
  - DELETE /api/rooms/<code>
  - ...

==================================================
```

### 3. Testing Server

Buka browser dan kunjungi:
```
http://localhost:5000/api/health
```

Jika Anda melihat `{"status": "ok"}`, server sudah berjalan dengan baik!

## Environment Setup (Optional)

### Windows - Command Prompt
```bash
# Create virtual environment
python -m venv venv

# Activate virtual environment
venv\Scripts\activate

# Install requirements
pip install -r requirements.txt

# Run server
python app.py
```

### Windows - PowerShell
```powershell
# Create virtual environment
python -m venv venv

# Activate virtual environment
.\venv\Scripts\Activate.ps1

# Install requirements
pip install -r requirements.txt

# Run server
python app.py
```

### macOS / Linux
```bash
# Create virtual environment
python3 -m venv venv

# Activate virtual environment
source venv/bin/activate

# Install requirements
pip install -r requirements.txt

# Run server
python3 app.py
```

## Dependencies

- **Flask** (2.3.3) - Web framework
- **Flask-CORS** (4.0.0) - Enable CORS for frontend
- **Werkzeug** (2.3.7) - WSGI utilities

## Struktur Project

```
TTX/
├── index.html              # Halaman utama
├── host.html               # Halaman host
├── peserta.html            # Halaman peserta
├── styles.css              # Styling
├── script.js               # Frontend logic
├── app.py                  # Flask backend server (NEW)
├── requirements.txt        # Python dependencies (NEW)
├── API_DOCUMENTATION.md    # API docs (NEW)
├── SETUP.md               # Setup guide (NEW)
└── README.md              # Project overview
```

## Koneksi Frontend ke Backend

Update `script.js` jika Anda ingin menggunakan API backend. Untuk saat ini, aplikasi masih menggunakan localStorage sebagai database temporary.

Contoh integrasi:
```javascript
// Menggunakan API Flask
async function createRoomViaAPI(roomName) {
    const response = await fetch('http://localhost:5000/api/rooms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: roomName })
    });
    return await response.json();
}
```

## Port Configuration

Server default berjalan di port `5000`. Jika ingin mengubah port, edit `app.py`:

```python
if __name__ == '__main__':
    app.run(
        host='0.0.0.0',
        port=5000,  # Ubah port di sini
        debug=True,
        use_reloader=True
    )
```

## Troubleshooting

### Error: "ModuleNotFoundError: No module named 'flask'"
**Solusi:** Pastikan requirements.txt sudah di-install dengan benar
```bash
pip install -r requirements.txt
```

### Error: "Address already in use"
Port 5000 sudah digunakan. Solusi:
- Tutup aplikasi lain yang menggunakan port 5000
- Atau ubah port di `app.py`

### Server tidak berjalan di Windows
Coba gunakan:
```bash
python -m flask run
```

## Development Tips

1. **Debug Mode** - Server sudah berjalan dengan `debug=True`, jadi perubahan kode akan otomatis reload
2. **CORS** - Sudah di-enable semua origin untuk development
3. **In-Memory Database** - Data akan hilang jika server di-restart. Untuk production, gunakan database proper

## Production Deployment

Untuk deployment ke production:
1. Set `debug=False` di app.py
2. Gunakan production WSGI server seperti Gunicorn:
   ```bash
   pip install gunicorn
   gunicorn app:app
   ```
3. Set CORS dengan domain spesifik
4. Gunakan database proper (PostgreSQL, MongoDB, dll)

---

**Last Updated:** February 6, 2026
