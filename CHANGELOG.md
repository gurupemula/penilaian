# Changelog

Semua perubahan penting pada proyek ini dicatat di sini.

Format mengikuti [Keep a Changelog](https://keepachangelog.com/id/1.0.0/).

---

## [Unreleased]

### Ditambahkan
- (simpan nilai ke Firestore, TP lengkap, tab Rekap)

---

## [0.4.0] - 2026-09-27

### Ditambahkan
- `js/siswa-db.js` — fetch, seed, update collection Firestore `siswa`
- Tab Siswa: tombol **Seed ke Firestore** dan **Muat ulang**
- `docs/SETUP_FIRESTORE_SISWA.md` — panduan Rules + seed
- Prioritas load siswa: Firestore → JSON → fallback

### Diubah
- `penilaian-ui.js` terhubung ke Firestore untuk data siswa
- `penilaian.html` memuat `siswa-db.js`

---

## [0.3.1] - 2026-09-27

### Ditambahkan
- `data/siswa-5a.json` — 25 siswa Kelas 5A
- Tab Siswa menampilkan daftar + NISN

### Diubah
- Form input nilai memakai nama siswa asli (id = NISN)

---

## [0.3.0] - 2026-09-27

### Ditambahkan
- Modul perhitungan + UI 4 tahap Input (mock)

---

## [0.2.0] - 2026-09-27

### Ditambahkan
- Dokumentasi mekanisme, anti-regresi, data model

---

## [0.1.0] - 2026-09-27

### Ditambahkan
- Login, dashboard, struktur awal Guru Pemula
