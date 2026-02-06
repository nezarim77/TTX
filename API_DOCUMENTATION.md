# TTX API Documentation

## Base URL
```
http://localhost:5000
```

## Endpoints

### 1. Create Room
**POST** `/api/rooms`

Membuat ruangan permainan baru.

**Request Body:**
```json
{
    "name": "Ruang Teka-Teki"
}
```

**Response (201):**
```json
{
    "success": true,
    "message": "Room created successfully",
    "data": {
        "code": "ABC123",
        "name": "Ruang Teka-Teki",
        "created_at": "2026-02-06T10:30:45.123456",
        "participants": [],
        "status": "waiting",
        "host_id": "uuid-string"
    }
}
```

---

### 2. Get Room Info
**GET** `/api/rooms/<room_code>`

Mendapatkan informasi lengkap dari sebuah ruangan.

**Response (200):**
```json
{
    "success": true,
    "data": {
        "code": "ABC123",
        "name": "Ruang Teka-Teki",
        "created_at": "2026-02-06T10:30:45.123456",
        "participants": ["Player1", "Player2"],
        "status": "waiting"
    }
}
```

**Error Response (404):**
```json
{
    "success": false,
    "message": "Room not found"
}
```

---

### 3. Delete Room
**DELETE** `/api/rooms/<room_code>`

Menghapus ruangan permainan.

**Response (200):**
```json
{
    "success": true,
    "message": "Room deleted successfully"
}
```

---

### 4. Join Room
**POST** `/api/rooms/<room_code>/join`

Bergabung dengan ruangan permainan dengan nama pemain.

**Request Body:**
```json
{
    "player_name": "Nama Pemain"
}
```

**Response (200):**
```json
{
    "success": true,
    "message": "Successfully joined room",
    "data": {
        "code": "ABC123",
        "name": "Ruang Teka-Teki",
        "participants": ["Nama Pemain"],
        "status": "waiting"
    }
}
```

**Error Response (404):**
```json
{
    "success": false,
    "message": "Room not found"
}
```

**Error Response (400) - Duplicate Name:**
```json
{
    "success": false,
    "message": "Player name already exists in this room"
}
```

---

### 5. Leave Room
**POST** `/api/rooms/<room_code>/leave`

Keluar dari ruangan permainan.

**Request Body:**
```json
{
    "player_name": "Nama Pemain"
}
```

**Response (200):**
```json
{
    "success": true,
    "message": "Successfully left room"
}
```

---

### 6. Get Participants
**GET** `/api/rooms/<room_code>/participants`

Mendapatkan daftar semua peserta di dalam ruangan.

**Response (200):**
```json
{
    "success": true,
    "data": {
        "participants": ["Player1", "Player2", "Player3"],
        "count": 3
    }
}
```

---

### 7. Get Room Status
**GET** `/api/rooms/<room_code>/status`

Mendapatkan status ruangan saat ini.

**Response (200):**
```json
{
    "success": true,
    "data": {
        "code": "ABC123",
        "name": "Ruang Teka-Teki",
        "status": "waiting",
        "participants_count": 2
    }
}
```

**Status Values:**
- `waiting` - Menunggu permainan dimulai
- `playing` - Permainan sedang berlangsung
- `finished` - Permainan selesai

---

### 8. Start Game
**POST** `/api/rooms/<room_code>/start`

Memulai permainan di ruangan.

**Response (200):**
```json
{
    "success": true,
    "message": "Game started",
    "data": {
        "status": "playing"
    }
}
```

**Error Response (400) - No Participants:**
```json
{
    "success": false,
    "message": "At least one participant is required to start the game"
}
```

---

### 9. Finish Game
**POST** `/api/rooms/<room_code>/finish`

Mengakhiri permainan di ruangan.

**Response (200):**
```json
{
    "success": true,
    "message": "Game finished",
    "data": {
        "status": "finished"
    }
}
```

---

### 10. Get Statistics
**GET** `/api/stats`

Mendapatkan statistik server secara keseluruhan.

**Response (200):**
```json
{
    "success": true,
    "data": {
        "total_rooms": 5,
        "active_rooms": 3,
        "total_participants": 12
    }
}
```

---

### 11. Health Check
**GET** `/api/health`

Mengecek kesehatan server.

**Response (200):**
```json
{
    "status": "ok"
}
```

---

## Error Responses

### 400 Bad Request
```json
{
    "success": false,
    "message": "Deskripsi error"
}
```

### 404 Not Found
```json
{
    "success": false,
    "message": "Endpoint not found"
}
```

### 405 Method Not Allowed
```json
{
    "success": false,
    "message": "Method not allowed"
}
```

### 500 Internal Server Error
```json
{
    "success": false,
    "message": "Internal server error"
}
```

---

## Catatan

- Room code adalah uppercase, max 6 karakter
- Player name max 30 karakter
- Room name max 50 karakter
- Duplicate player name dalam satu ruangan tidak diizinkan
- Data disimpan dalam memory, akan hilang jika server restart
- CORS sudah enabled untuk komunikasi dengan frontend

---

## Contoh Penggunaan di Frontend

```javascript
// Create room
const createRoom = async (roomName) => {
    const response = await fetch('http://localhost:5000/api/rooms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: roomName })
    });
    return await response.json();
};

// Join room
const joinRoom = async (roomCode, playerName) => {
    const response = await fetch(`http://localhost:5000/api/rooms/${roomCode}/join`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ player_name: playerName })
    });
    return await response.json();
};

// Get room info
const getRoomInfo = async (roomCode) => {
    const response = await fetch(`http://localhost:5000/api/rooms/${roomCode}`);
    return await response.json();
};
```

---

**Dibuat untuk TTX Game Backend**
