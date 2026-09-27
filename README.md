# Guru Pemula

Aplikasi web pribadi untuk membantu mengelola pekerjaan sehari-hari (penilaian, dll).

**Hanya untuk penggunaan pribadi** — tidak ada pendaftaran publik. Akun dibuat manual di Firebase Console.

## Fitur yang direncanakan

- **Penilaian** – Input dan kelola nilai siswa
- Fitur lain akan ditambahkan kemudian

## Teknologi

- HTML, CSS, JavaScript
- Firebase Authentication (login Email/Password)
- Firebase Firestore (database)

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
- Collection boleh dibuat nanti sesuai kebutuhan fitur

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

> Rules di atas hanya untuk development. Karena hanya kamu yang login, sudah cukup aman untuk penggunaan pribadi.

## Struktur Folder

```
├── index.html          # Halaman login
├── dashboard.html      # Halaman utama
├── penilaian.html      # Fitur penilaian
├── css/
│   └── style.css
└── js/
    ├── firebase-config.js
    └── auth.js
```

## Catatan

Project ini masih dalam tahap awal. Fitur penilaian akan dikembangkan secara bertahap.
