# TTX (Teka-Teki Extra) - Web Game

Sebuah web game interaktif dengan sistem host-peserta untuk bermain teka-teki bersama.

## 📋 Daftar File

- **index.html** - Halaman utama dengan pilihan peran (host/peserta)
- **host.html** - Halaman untuk host dengan kontrol ruangan
- **peserta.html** - Halaman untuk peserta bergabung dengan ruangan
- **styles.css** - Styling untuk semua halaman
- **script.js** - Logika JavaScript untuk interaksi antar halaman

## 🎮 Fitur

### Halaman Utama
- 2 pilihan menu: Menjadi Host atau Menjadi Peserta
- Interface yang user-friendly dan responsif

### Mode Host
- ✅ Buat ruangan dengan nama custom
- ✅ Kode ruangan otomatis terbuat (6 karakter alfanumerik)
- ✅ Tombol salin kode untuk disebarkan ke peserta
- ✅ Lihat daftar peserta yang bergabung
- ✅ Hapus ruangan kapan saja

### Mode Peserta
- ✅ Input nama pemain
- ✅ Input kode ruangan dari host
- ✅ Validasi kode ruangan
- ✅ Tunggu permainan dimulai di waiting room
- ✅ Lihat peserta lain yang sedang bergabung
- ✅ Keluar dari ruangan kapan saja

## 🚀 Cara Menggunakan

1. **Buka index.html** di browser
2. **Pilih peran:**
   - **Host**: Klik "Menjadi Host" untuk membuat ruangan
   - **Peserta**: Klik "Menjadi Peserta" untuk bergabung dengan ruangan

### Untuk Host:
1. Masukkan nama ruangan
2. Klik "Buat Ruangan"
3. Salin kode ruangan dengan tombol "Salin Kode"
4. Bagikan kode ke peserta

### Untuk Peserta:
1. Masukkan nama pemain Anda
2. Masukkan kode ruangan dari host
3. Klik "Bergabung"
4. Tunggu di ruangan sampai host memulai permainan

## 💾 Penyimpanan Data

Aplikasi menggunakan **localStorage** browser untuk menyimpan:
- Data ruangan (nama, kode, peserta)
- Session pemain (nama, kode ruangan yang diikuti)

Data akan hilang jika cache/localStorage browser dihapus.

## 📱 Responsif

Aplikasi sudah dioptimalkan untuk:
- Desktop (1920px ke atas)
- Tablet (768px - 1024px)
- Mobile (480px - 768px)
- Smartphone (di bawah 480px)

## 🎨 Design Features

- Gradient background yang menarik
- Smooth transitions dan animations
- Clean dan modern interface
- User feedback dengan toast notifications
- Loading spinner untuk waiting state

## 🔄 Perbaruan Auto (Real-time)

Daftar peserta dan informasi ruangan akan di-refresh otomatis setiap 2 detik untuk pengalaman yang lebih real-time.

## 📝 Catatan

- Kode ruangan terdiri dari 6 karakter (A-Z dan 0-9)
- Nama peserta tidak boleh duplikat dalam satu ruangan
- Ruangan dapat dihapus kapan saja oleh host
- Peserta dapat keluar kapan saja dari ruangan

---

**Versi**: 1.0  
**Status**: Siap untuk Core Game Logic
