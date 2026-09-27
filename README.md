# Guru Pemula

Aplikasi web pribadi untuk membantu mengelola pekerjaan sehari-hari (penilaian, dll).

**Hanya untuk penggunaan pribadi** — tidak ada pendaftaran publik. Akun dibuat manual di Firebase Console.

## Fitur

- **Penilaian** – Input dan kelola nilai siswa (berdasarkan mekanisme aplikasi offline Kelas 5A)
- Fitur lain akan ditambahkan kemudian

## Teknologi

- HTML, CSS, JavaScript
- Firebase Authentication (login Email/Password)
- Firebase Firestore (database)

## Dokumentasi

| Dokumen | Isi |
|---------|-----|
| [CHANGELOG.md](CHANGELOG.md) | Riwayat perubahan |
| [docs/MEKANISME_PENILAIAN.md](docs/MEKANISME_PENILAIAN.md) | Cara kerja penilaian (acuan offline) |
| [docs/ANTI_REGRESSION.md](docs/ANTI_REGRESSION.md) | Aturan yang wajib tidak rusak |
| [docs/DATA_MODEL.md](docs/DATA_MODEL.md) | Rencana struktur Firestore |

## Cara Menjalankan

1. Deploy atau buka lewat server lokal / GitHub Pages / Firebase Hosting
2. Login menggunakan akun yang sudah dibuat di Firebase Authentication

## Setup Firebase

### 1. Authentication
- Buka [Firebase Console](https://console.firebase.google.com/) → project `gurupemula-6315d`
- **Authentication** → **Sign-in method** → aktifkan **Email/Password**
- **Users** → **Add user** → buat akun dengan email & password kamu

### 2. Firestore Database
- **Firestore Database** → Create database (pilih lokasi terdekat)
- Collection dibuat sesuai [DATA_MODEL.md](docs/DATA_MODEL.md)

### 3. Security Rules (sementara)

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

## Struktur Folder

```
├── index.html
├── dashboard.html
├── penilaian.html
├── css/style.css
├── js/
│   ├── firebase-config.js
│   └── auth.js
├── docs/
│   ├── MEKANISME_PENILAIAN.md
│   ├── ANTI_REGRESSION.md
│   └── DATA_MODEL.md
├── CHANGELOG.md
└── README.md
```

## Catatan

Project ini masih dalam tahap awal. Fitur penilaian dikembangkan secara bertahap dengan acuan aplikasi offline dan dijaga anti-regresi.
