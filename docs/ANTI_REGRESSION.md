# Catatan Anti-Regresi

Dokumen ini mencatat **perilaku yang wajib tetap benar** saat fitur dikembangkan. Setiap perubahan yang menyentuh perhitungan nilai, alur input, atau data model harus dicek terhadap poin-poin di bawah.

---

## A. Perhitungan Nilai (Kritis)

| ID | Aturan | Status |
|----|--------|--------|
| AR-01 | Nilai akhir **kompetensi** = rata-rata semua entri penilaian pada kompetensi itu | Wajib |
| AR-02 | Nilai akhir **TP** = rata-rata kompetensi yang **sudah dinilai saja**. Kompetensi belum dinilai **tidak** dianggap 0 | Wajib |
| AR-03 | Nilai akhir **mapel** = rata-rata tertimbang bobot TP, hanya dari TP yang sudah ada nilai | Wajib |
| AR-04 | Seni Budaya: nilai mapel = rata-rata tertimbang **cabang** (Musik/Rupa/Teater). Cabang tanpa nilai sama sekali tidak ikut dihitung | Wajib |
| AR-05 | Bobot TP di dalam cabang Seni Budaya dihitung terpisah per cabang (bukan terhadap seluruh mapel) | Wajib |
| AR-06 | Filter semester hanya menghitung TP yang sesuai semester yang dipilih | Wajib |

---

## B. Alur Input

| ID | Aturan | Status |
|----|--------|--------|
| AR-10 | Urutan input: Mapel → TP → Kompetensi → Nilai siswa | Wajib |
| AR-11 | Setelah simpan nilai, kembali ke daftar kompetensi TP yang sama | Disarankan |
| AR-12 | Nilai per siswa: 0–100 (angka) | Wajib |
| AR-13 | Satu entri penilaian punya tanggal + catatan opsional | Wajib |

---

## C. Data & Keamanan

| ID | Aturan | Status |
|----|--------|--------|
| AR-20 | Hanya user yang sudah login (Firebase Auth) yang bisa baca/tulis data | Wajib |
| AR-21 | Tidak ada fitur daftar publik — akun dibuat manual di Console | Wajib |
| AR-22 | Perubahan data harus tercatat (bisa di-audit lewat riwayat penilaian) | Disarankan |

---

## D. Cara Mengecek Saat Ada Perubahan

1. **Hitung manual** 2–3 TP contoh (satu mapel biasa + Seni Budaya).
2. Bandingkan hasil aplikasi dengan hitungan manual.
3. Uji kasus: kompetensi belum dinilai, TP belum ada nilai, cabang kosong, semester filter.
4. Update baris di tabel di atas jika aturan berubah (catat di CHANGELOG).

---

## Riwayat Perubahan Aturan Anti-Regresi

| Tanggal | Perubahan |
|---------|-----------|
| 2026-09-27 | Dokumen awal dibuat berdasarkan aplikasi offline Kelas 5A |
