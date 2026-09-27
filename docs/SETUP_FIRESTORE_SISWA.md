# Setup Firestore — Collection `siswa`

## 1. Buat database (jika belum)

1. [Firebase Console](https://console.firebase.google.com/) → project **gurupemula-6315d**
2. **Build** → **Firestore Database** → **Create database**
3. Mode: Production (atau Test sementara)
4. Lokasi: pilih terdekat (mis. `asia-southeast2`)

## 2. Security Rules

**Firestore** → **Rules**:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

Publish rules. Karena hanya kamu yang login, ini cukup untuk tahap awal.

## 3. Seed data siswa (dari aplikasi)

1. Login ke aplikasi → buka **Penilaian** → tab **Siswa**
2. Klik **Seed ke Firestore**
3. Jika berhasil, sumber data berubah menjadi **Firestore ✓**

Tombol **Seed ulang (timpa)** menulis ulang semua dokumen (berguna jika ada koreksi nama).

## 4. Struktur dokumen

| Field | Tipe | Contoh |
|-------|------|--------|
| Document ID | string | `3153742941` (NISN) |
| `nomorAbsen` | number | `1` |
| `nisn` | string | `"3153742941"` |
| `nama` | string | `"Abdurrahman Ar Ribery"` |
| `kelas` | string | `"5A"` |
| `aktif` | boolean | `true` |
| `createdAt` | timestamp | server |
| `updatedAt` | timestamp | server |

Collection name: **`siswa`**

## 5. Urutan prioritas load di aplikasi

1. Firestore (jika ada data kelas 5A)
2. `data/siswa-5a.json`
3. Fallback hardcode di `penilaian-ui.js`

## 6. Troubleshooting

| Gejala | Kemungkinan | Perbaikan |
|--------|-------------|-----------|
| permission-denied | Rules belum publish / belum login | Cek Rules + pastikan sudah login |
| Sumber tetap JSON | Seed belum dijalankan atau collection kosong | Klik Seed ke Firestore |
| CORS / fetch JSON gagal | Dibuka via `file://` | Pakai server lokal atau GitHub Pages / Hosting |
