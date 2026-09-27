# Changelog

Semua perubahan penting pada proyek ini dicatat di sini.

---

## [Unreleased]

### Ditambahkan
- (simpan nilai ke Firestore, tab Rekap)

---

## [0.5.0] - 2026-09-27

### Ditambahkan
- `data/kurikulum-5a.json` — BI (10 TP), IPAS (8), PP (10), Seni Budaya (10) + kompetensi
- Kompetensi IPAS & PP disusun dari rumusan TP revisi (belum ada di offline)
- `js/tp-db.js` — Firestore mapel / tp / kompetensi + seed
- Tab **TP**: seed kurikulum, edit bobot, semester, tujuan, deskripsi kompetensi
- Edit **bobot antar cabang** Seni Budaya + indikator total 100%
- Indikator total bobot TP per mapel (✓ / ⚠)

### Diubah
- Alur Input memakai kurikulum (Firestore atau JSON), bukan mock singkat

---

## [0.4.0] - 2026-09-27

### Ditambahkan
- Firestore collection `siswa` + seed

---

## [0.3.x] - 2026-09-27

### Ditambahkan
- Data siswa 5A, UI 4 tahap, modul perhitungan, dokumentasi

---

## [0.1.0] - 2026-09-27

### Ditambahkan
- Login & struktur awal Guru Pemula
