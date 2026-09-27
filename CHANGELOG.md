# Changelog

Semua perubahan penting pada proyek ini dicatat di sini.

Format mengikuti [Keep a Changelog](https://keepachangelog.com/id/1.0.0/).

---

## [Unreleased]

### Ditambahkan
- (koneksi Firestore, seed data siswa/TP, tab Rekap)

---

## [0.3.0] - 2026-09-27

### Ditambahkan
- `js/penilaian-calc.js` — modul pure calculation (AR-01 s/d AR-06 + predikat + cek bobot)
- `js/penilaian-ui.js` — alur Input 4 tahap dengan mock data
- UI penilaian: tab Input / Rekap / Siswa / TP
- Step: Pilih Mapel → TP (per elemen) → Kompetensi → form nilai 25 siswa
- Breadcrumb navigasi mundur
- Simpan mock ke localStorage (sementara, sebelum Firestore)

### Diubah
- `penilaian.html` — dari placeholder menjadi kerangka fungsional
- `css/style.css` — style breadcrumb, choice-card, form nilai siswa, tabs

---

## [0.2.0] - 2026-09-27

### Ditambahkan
- `docs/MEKANISME_PENILAIAN.md` — ringkasan cara kerja dari aplikasi offline Kelas 5A
- `docs/ANTI_REGRESSION.md` — aturan yang wajib tidak rusak (AR-01 s/d AR-22)
- `docs/DATA_MODEL.md` — rencana collection Firestore
- `CHANGELOG.md`

### Diubah
- README: tautan dokumentasi, struktur folder

---

## [0.1.0] - 2026-09-27

### Ditambahkan
- Struktur awal: login (Firebase Auth), dashboard, placeholder penilaian
- Login-only (tanpa daftar publik) — single-user
- README, CSS dasar, firebase-config, auth helper
- Nama proyek: **Guru Pemula**
