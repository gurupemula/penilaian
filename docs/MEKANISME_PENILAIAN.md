# Mekanisme Penilaian (Referensi dari Aplikasi Offline)

Dokumen ini merangkum cara kerja aplikasi penilaian offline Kelas 5A yang menjadi acuan pengembangan versi online (Firebase).

Sumber: `Panduan_Lengkap_Aplikasi_Nilai_dan_TP_Kelas_5A.md`

---

## 1. Alur Input Nilai

Empat tahap berurutan:

1. **Pilih Mata Pelajaran** (Bahasa Indonesia, IPAS, Pendidikan Pancasila, Seni Budaya, …)
2. **Pilih Tujuan Pembelajaran (TP)** — dikelompokkan per elemen
3. **Pilih Kompetensi** — 2–4 aspek yang dinilai per TP
4. **Isi Nilai** — tanggal, catatan opsional, nilai 0–100 untuk seluruh siswa kelas sekaligus

Setelah disimpan, kembali ke daftar kompetensi TP yang sama agar bisa lanjut kompetensi berikutnya.

---

## 2. Hierarki Perhitungan Nilai

### Langkah 1 — Nilai akhir 1 Kompetensi
Rata-rata dari seluruh kali penilaian pada kompetensi tersebut.

### Langkah 2 — Nilai akhir 1 TP
Rata-rata dari nilai akhir seluruh kompetensi di TP itu.  
**Hanya** kompetensi yang sudah dinilai yang dihitung. Kompetensi yang belum dinilai **tidak** dianggap 0 dan tidak menyeret nilai TP turun.

### Langkah 3 — Nilai akhir 1 Mata Pelajaran
Rata-rata **tertimbang** sesuai Bobot (%) tiap TP, hanya dari TP yang sudah ada nilainya.

Contoh: TP1 bobot 70% + TP2 bobot 30% →  
`nilai_mapel = 0.7 × nilai_TP1 + 0.3 × nilai_TP2`

Bobot ideal total 100% per semester (dicek di akhir semester).

---

## 3. Kekhususan Seni Budaya

Seni Budaya = 3 cabang dengan bobot antar-cabang (bawaan):

| Cabang       | Bobot |
|--------------|-------|
| Seni Musik   | 52%   |
| Seni Rupa    | 30%   |
| Seni Teater  | 18%   |

Perhitungan:
1. Nilai TP = rata-rata kompetensi (sama seperti mapel lain)
2. Nilai **cabang** = rata-rata tertimbang TP-TP di dalam cabang itu
3. Nilai **mapel Seni Budaya** = rata-rata tertimbang dari nilai ketiga cabang  
   Cabang yang belum ada nilai sama sekali **tidak ikut dihitung** (bukan 0).

---

## 4. Semester

Setiap TP punya penanda: Semester 1 / Semester 2 / Kedua Semester.

- Filter semester memengaruhi TP yang tampil dan perhitungan nilai akhir mapel.
- "Kedua Semester" = nilai setahun penuh.

---

## 5. Fitur Pendukung (dari offline)

| Fitur | Keterangan |
|-------|------------|
| **Rekap** | Tabel siswa × TP, rincian riwayat kompetensi, ekspor CSV |
| **Siswa** | Daftar 25 siswa Kelas 5A (bisa dikoreksi ejaan) |
| **TP** | Lihat & edit TP + kompetensi, tambah TP custom |
| **Pengaturan** | Skala predikat (A≥90, B≥80, C≥70, D), reset nilai, cadangan data |

---

## 6. Data Model Offline (JSON)

Setiap mapel punya file `data-*.json` berisi:

- `mapel`, `kode`, `keterangan`
- `tp[]` — kode, elemen, jp, tujuan, kompetensi[], bobot, semester
- `nilai{}` — nilai yang sudah diinput
- (Seni Budaya) `kelompokBobot` — bobot antar cabang

Versi online akan memetakan struktur ini ke **Firestore**.

---

## 7. Mapel & TP yang Ada di Referensi

| Mapel | Jumlah TP (referensi) | Catatan |
|-------|------------------------|---------|
| Bahasa Indonesia | 10 | Menyimak, Membaca, Berbicara, Menulis |
| IPAS | 8 (rumusan revisi) | Perlu susun ulang kompetensi |
| Matematika | banyak (revisi) | Belum ada di database offline |
| Pendidikan Pancasila | 10 (rumusan revisi) | Perlu susun ulang kompetensi |
| Seni Budaya | 10 (3 cabang) | Bobot antar-cabang khusus |

---

## Catatan untuk Versi Online

- Data disimpan di Firestore, bukan file JSON lokal.
- Satu user (pemilik) saja — tidak ada multi-guru / multi-kelas di tahap awal.
- Kelas default: **5A** (25 siswa) — bisa dikembangkan nanti.
- Perhitungan harus **identik** dengan rumus offline di atas (anti-regresi).
