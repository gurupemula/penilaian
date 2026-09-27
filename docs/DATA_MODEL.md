# Data Model Firestore — Guru Pemula

Rencana struktur data untuk versi online. Bisa disesuaikan saat implementasi.

---

## Collections

### `siswa`
Daftar siswa (Kelas 5A sebagai default).

```
siswa/{siswaId}
  nama: string
  nomorAbsen: number
  kelas: string          // "5A"
  aktif: boolean
  createdAt: timestamp
```

### `mapel`
Mata pelajaran.

```
mapel/{mapelId}
  nama: string           // "Bahasa Indonesia"
  kode: string           // "BI"
  keterangan: string
  urutan: number
  // Khusus Seni Budaya:
  kelompokBobot: {       // opsional
    "Seni Musik": 52,
    "Seni Rupa": 30,
    "Seni Teater": 18
  }
```

### `tp`
Tujuan Pembelajaran (satu dokumen per TP).

```
tp/{tpId}
  mapelId: string
  kode: string           // "TP1"
  elemen: string         // "Menyimak"
  tujuan: string         // rumusan TP lengkap
  jp: number             // jam pelajaran (opsional)
  bobot: number          // % terhadap mapel / cabang
  semester: string       // "1" | "2" | "kedua"
  cabang: string | null  // khusus Seni Budaya: "Seni Musik" dll
  urutan: number
```

### `kompetensi`
Aspek yang dinilai di dalam satu TP.

```
kompetensi/{kompetensiId}
  tpId: string
  mapelId: string
  deskripsi: string
  urutan: number
```

### `penilaian`
Satu dokumen = satu kali penilaian satu kompetensi untuk **satu siswa**  
(atau alternatif: satu dokumen berisi map nilai semua siswa — lihat opsi di bawah).

**Opsi A — per siswa (fleksibel, mudah query riwayat):**
```
penilaian/{id}
  siswaId: string
  mapelId: string
  tpId: string
  kompetensiId: string
  nilai: number          // 0–100
  tanggal: string        // "YYYY-MM-DD"
  catatan: string
  createdAt: timestamp
  updatedAt: timestamp
```

**Opsi B — batch per kompetensi (mirip offline, hemat dokumen):**
```
penilaian/{mapelId_tpId_kompetensiId_tanggal}
  mapelId, tpId, kompetensiId, tanggal, catatan
  nilai: {               // map siswaId → angka
    "siswa1": 85,
    "siswa2": 90,
    ...
  }
  createdAt, updatedAt
```

> **Keputusan sementara:** Opsi B lebih dekat dengan alur offline (input 25 siswa sekaligus) dan lebih hemat. Bisa diganti ke Opsi A jika butuh riwayat sangat detail per siswa.

### `pengaturan`
```
pengaturan/predikat
  A: 90
  B: 80
  C: 70
  // di bawah C = D

pengaturan/umum
  kelasAktif: "5A"
  tahunAjaran: "2025/2026"
```

---

## Indeks yang Disarankan

- `penilaian`: mapelId + tpId + kompetensiId
- `penilaian`: siswaId + mapelId
- `tp`: mapelId + semester
- `kompetensi`: tpId

---

## Security Rules (awal)

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

Karena single-user, rules di atas sudah cukup untuk tahap awal.

---

## Migrasi dari Offline

1. Export / salin data dari `data-*.json` offline.
2. Seed ke Firestore lewat script atau halaman admin sederhana.
3. Pastikan struktur TP & kompetensi selaras dengan rumusan yang dipakai (termasuk revisi IPAS & PP).
