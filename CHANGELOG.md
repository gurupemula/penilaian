# Changelog

## [0.7.0] - 2026-10-02

### UI paket lengkap
- **Login** (`index.html`) — form email/password, error handling, redirect jika sudah login
- **Dashboard** — navbar + feature cards (Penilaian aktif)
- **CSS** — `dashboard-extras.css` untuk login form groups & dashboard grid
- **auth.js**, **firebase-config.js**, **siswa-db.js** diperbarui/ditambahkan
- **firestore.rules** diselaraskan dengan model data

## [Unreleased]
- Simpan nilai ke Firestore, matrix Rekap (sudah di kode)

## [0.6.0] - 2026-09-27

### Redesign (bukan sekadar diperkecil)
- **Sidebar** navigasi tetap (Input, Rekap, Siswa, Kurikulum)
- **Input**: filter Mapel → TP → Kompetensi (dropdown), area kerja **tabel spreadsheet** (No | Nama | Nilai)
- **Siswa**: tabel sheet (No | Nama | NISN)
- **Kurikulum**: tabel editable (Kode | Elemen | Bobot | Semester | Tujuan/Kompetensi | Simpan)
- Header sticky, baris tabel rapat seperti Excel
- Mobile: sidebar bisa di-toggle

## [0.5.x] — kurikulum + polish densitas
## [0.4.0] — siswa Firestore
## [0.1–0.3] — fondasi
