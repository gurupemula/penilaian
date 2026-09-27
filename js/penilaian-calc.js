/**
 * penilaian-calc.js
 * Perhitungan nilai sesuai docs/ANTI_REGRESSION.md dan MEKANISME_PENILAIAN.md
 *
 * Semua fungsi pure — mudah diuji ulang saat ada perubahan.
 */

/**
 * AR-01: Nilai akhir 1 kompetensi = rata-rata semua entri penilaian
 * @param {number[]} nilaiList - daftar nilai (0–100)
 * @returns {number|null} rata-rata atau null jika kosong
 */
function nilaiAkhirKompetensi(nilaiList) {
  if (!nilaiList || nilaiList.length === 0) return null;
  const sum = nilaiList.reduce((a, b) => a + b, 0);
  return sum / nilaiList.length;
}

/**
 * AR-02: Nilai akhir 1 TP = rata-rata kompetensi yang SUDAH dinilai saja
 * @param {(number|null)[]} nilaiKompetensi - nilai akhir tiap kompetensi (null = belum dinilai)
 * @returns {number|null}
 */
function nilaiAkhirTP(nilaiKompetensi) {
  const sudah = (nilaiKompetensi || []).filter((n) => n !== null && n !== undefined);
  if (sudah.length === 0) return null;
  return sudah.reduce((a, b) => a + b, 0) / sudah.length;
}

/**
 * AR-03: Nilai akhir mapel = rata-rata tertimbang bobot TP (hanya TP yang ada nilai)
 * @param {{ nilai: number|null, bobot: number }[]} tpList
 * @returns {number|null}
 */
function nilaiAkhirMapel(tpList) {
  const ada = (tpList || []).filter((t) => t.nilai !== null && t.nilai !== undefined && t.bobot > 0);
  if (ada.length === 0) return null;
  const totalBobot = ada.reduce((s, t) => s + t.bobot, 0);
  if (totalBobot === 0) return null;
  const weighted = ada.reduce((s, t) => s + t.nilai * t.bobot, 0);
  return weighted / totalBobot;
}

/**
 * AR-04 & AR-05: Nilai akhir Seni Budaya
 * 1) Hitung nilai tiap cabang (weighted TP di dalam cabang)
 * 2) Rata-rata tertimbang antar cabang (hanya cabang yang punya nilai)
 *
 * @param {Object} data
 * @param {Object.<string, number>} data.kelompokBobot - { "Seni Musik": 52, ... }
 * @param {Object.<string, { nilai: number|null, bobot: number }[]>} data.tpPerCabang
 *        { "Seni Musik": [ {nilai, bobot}, ... ], ... }
 * @returns {{ nilaiCabang: Object.<string, number|null>, nilaiMapel: number|null }}
 */
function nilaiAkhirSeniBudaya(data) {
  const { kelompokBobot = {}, tpPerCabang = {} } = data;
  const nilaiCabang = {};

  for (const cabang of Object.keys(kelompokBobot)) {
    nilaiCabang[cabang] = nilaiAkhirMapel(tpPerCabang[cabang] || []);
  }

  // Hanya cabang yang sudah punya nilai
  const cabangAda = Object.entries(nilaiCabang)
    .filter(([, n]) => n !== null && n !== undefined)
    .map(([nama, nilai]) => ({
      nilai,
      bobot: kelompokBobot[nama] || 0,
    }));

  const nilaiMapel = nilaiAkhirMapel(cabangAda);
  return { nilaiCabang, nilaiMapel };
}

/**
 * AR-06: Filter TP menurut semester
 * @param {Array} tpList - daftar TP dengan field semester: "1" | "2" | "kedua"
 * @param {string} semesterFilter - "1" | "2" | "kedua"
 * @returns {Array}
 */
function filterTPBySemester(tpList, semesterFilter) {
  if (!semesterFilter || semesterFilter === "kedua") {
    return tpList || [];
  }
  return (tpList || []).filter(
    (tp) => tp.semester === semesterFilter || tp.semester === "kedua"
  );
}

/**
 * Predikat dari nilai (pengaturan bisa diubah nanti)
 * @param {number|null} nilai
 * @param {{ A: number, B: number, C: number }} skala
 * @returns {string}
 */
function predikat(nilai, skala = { A: 90, B: 80, C: 70 }) {
  if (nilai === null || nilai === undefined) return "-";
  if (nilai >= skala.A) return "A";
  if (nilai >= skala.B) return "B";
  if (nilai >= skala.C) return "C";
  return "D";
}

/**
 * Cek total bobot (untuk indikator ✓ / ⚠)
 * @param {{ bobot: number }[]} items
 * @returns {{ total: number, ok: boolean, selisih: number }}
 */
function cekTotalBobot(items) {
  const total = (items || []).reduce((s, i) => s + (Number(i.bobot) || 0), 0);
  const selisih = total - 100;
  return {
    total,
    ok: Math.abs(selisih) < 0.01,
    selisih,
  };
}
