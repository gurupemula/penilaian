/** penilaian-ui.js — sidebar + sheet */

function mapSiswaRow(s) {
  return {
    id: String(s.nisn),
    nomorAbsen: s.nomorAbsen,
    nisn: String(s.nisn),
    nis: s.nis || "",
    nama: s.nama || "",
    tempatLahir: s.tempatLahir || "",
    tanggalLahir: s.tanggalLahir || "",
    jenisKelamin: s.jenisKelamin || "",
    alamat: s.alamat || "",
  };
}

let SISWA = [];
let SISWA_SOURCE = "fallback";
let KURIKULUM = [];
let KURIKULUM_SOURCE = "none";
const state = { mapelId: "", tpId: "", kompetensiId: "", tpTabMapelId: null };
const TITLES = { input: "Input Nilai", rekap: "Rekap", siswa: "Siswa", tp: "Kurikulum / TP" };

function normalizeKurikulum(mapelList) {
  return (mapelList || []).map((m) => ({
    ...m,
    tp: (m.tp || []).map((tp) => {
      if (typeof normalizeTP === "function") return normalizeTP({ ...tp });
      const b = Number(tp.bobot) || 0;
      const sem = tp.semester || "kedua";
      let bobot1 = tp.bobot1,
        bobot2 = tp.bobot2;
      if (bobot1 == null && bobot2 == null) {
        if (sem === "1") {
          bobot1 = b;
          bobot2 = 0;
        } else if (sem === "2") {
          bobot1 = 0;
          bobot2 = b;
        } else {
          bobot1 = b;
          bobot2 = b;
        }
      }
      return { ...tp, bobot1: Number(bobot1) || 0, bobot2: Number(bobot2) || 0 };
    }),
  }));
}

// SEE ARTIFACTS - partial push marker
console.error('INCOMPLETE_PUSH_USE_ARTIFACTS');
