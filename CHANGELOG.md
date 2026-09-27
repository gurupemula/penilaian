# Changelog

Semua perubahan penting pada proyek ini dicatat di sini.

Format mengikuti [Keep a Changelog](https://keepachangelog.com/id/1.0.0/).

---

## [Unreleased]

### Ditambahkan
- (koneksi Firestore, seed TP lengkap, tab Rekap)

---

## [0.3.1] - 2026-09-27

### Ditambahkan
- `data/siswa-5a.json` — 25 siswa Kelas 5A (nomorAbsen, nisn, nama)
- Tab **Siswa** menampilkan daftar nama + NISN

### Diubah
- Form input nilai memakai nama siswa asli (id = NISN)
- Catatan di halaman penilaian: data siswa sudah asli

---

## [0.3.0] - 2026-09-27

### Ditambahkan
- `js/penilaian-calc.js` — modul pure calculation (AR-01 s/d AR-06 + predikat + cek bobot)
- `js/penilaian-ui.js` — alur Input 4 tahap dengan mock data
- UI penilaian: tab Input / Rekap / Siswa / TP
- Step: Pilih Mapel → TP → Kompetensi → form nilai 25 siswa
- Breadcrumb navigasi mundur
- Simpan mock ke localStorage (sementara)

### Diubah
- `penilaian.html` — kerangka fungsional
- `css/style.css` — style breadcrumb, choice-card, form nilai, tabs

---

## [0.2.0] - 2026-09-27

### Ditambahkan
- `docs/MEKANISME_PENILAIAN.md`
- `docs/ANTI_REGRESSION.md`
- `docs/DATA_MODEL.md`
- `CHANGELOG.md`

### Diubah
- README: tautan dokumentasi

---

## [0.1.0] - 2026-09-27

### Ditambahkan
- Login Firebase Auth, dashboard, struktur awal
- Login-only (single-user)
- Nama proyek: **Guru Pemula**
