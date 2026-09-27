# Penilaian - Aplikasi Guru Pemula

Aplikasi web sederhana untuk membantu guru dalam mengelola pekerjaan sehari-hari.

## Fitur yang direncanakan

- **Penilaian** – Input dan kelola nilai siswa
- Fitur lain akan ditambahkan kemudian

## Teknologi

- HTML, CSS, JavaScript
- Firebase Authentication (login)
- Firebase Firestore (database)

## Cara Menjalankan

1. Buka `index.html` di browser (atau deploy ke hosting seperti Firebase Hosting / GitHub Pages)
2. Login menggunakan akun yang sudah didaftarkan di Firebase Authentication

## Setup Firebase yang perlu dilakukan

1. **Authentication**
   - Buka [Firebase Console](https://console.firebase.google.com/) → project `gurupemula-6315d`
   - Pilih **Authentication** → **Sign-in method**
   - Aktifkan **Email/Password**

2. **Firestore Database**
   - Buat database Firestore (mode production atau test)
   - Buat collection `users` (opsional, untuk data profil)

3. **Security Rules** (contoh sementara)

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

> **Peringatan:** Rules di atas hanya untuk development. Nanti harus diperketat sesuai kebutuhan.

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
