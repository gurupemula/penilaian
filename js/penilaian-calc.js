/** penilaian-calc.js — pure functions */

function nilaiAkhirKompetensi(nilaiList) {
  if (!nilaiList || nilaiList.length === 0) return null;
  return nilaiList.reduce((a, b) => a + b, 0) / nilaiList.length;
}

function nilaiAkhirTP(nilaiKompetensi) {
  const sudah = (nilaiKompetensi || []).filter((n) => n !== null && n !== undefined);
  if (sudah.length === 0) return null;
  return sudah.reduce((a, b) => a + b, 0) / sudah.length;
}

function nilaiAkhirMapel(tpList) {
  const ada = (tpList || []).filter((t) => t.nilai !== null && t.nilai !== undefined && t.bobot > 0);
  if (ada.length === 0) return null;
  const totalBobot = ada.reduce((s, t) => s + t.bobot, 0);
  if (totalBobot === 0) return null;
  return ada.reduce((s, t) => s + t.nilai * t.bobot, 0) / totalBobot;
}

function nilaiAkhirSeniBudaya(data) {
  const { kelompokBobot = {}, tpPerCabang = {} } = data;
  const nilaiCabang = {};
  for (const cabang of Object.keys(kelompokBobot)) {
    nilaiCabang[cabang] = nilaiAkhirMapel(tpPerCabang[cabang] || []);
  }
  const cabangAda = Object.entries(nilaiCabang)
    .filter(([, n]) => n !== null && n !== undefined)
    .map(([nama, nilai]) => ({ nilai, bobot: kelompokBobot[nama] || 0 }));
  return { nilaiCabang, nilaiMapel: nilaiAkhirMapel(cabangAda) };
}

/** Bobot efektif TP untuk semester filter: "1" | "2" | "kedua" */
function bobotTPUntukSemester(tp, semesterFilter) {
  const b1 = Number(tp.bobot1 != null ? tp.bobot1 : tp.bobot) || 0;
  const b2 = Number(tp.bobot2 != null ? tp.bobot2 : tp.bobot) || 0;
  if (semesterFilter === "1") return b1;
  if (semesterFilter === "2") return b2;
  // setahun: rata-rata bobot yang aktif, atau max non-zero
  if (b1 > 0 && b2 > 0) return (b1 + b2) / 2;
  return b1 || b2;
}

function filterTPBySemester(tpList, semesterFilter) {
  if (!semesterFilter || semesterFilter === "kedua") return tpList || [];
  return (tpList || []).filter((tp) => {
    const b1 = Number(tp.bobot1 != null ? tp.bobot1 : 0) || 0;
    const b2 = Number(tp.bobot2 != null ? tp.bobot2 : 0) || 0;
    if (semesterFilter === "1") return b1 > 0 || tp.semester === "1" || tp.semester === "kedua";
    if (semesterFilter === "2") return b2 > 0 || tp.semester === "2" || tp.semester === "kedua";
    return true;
  });
}

function predikat(nilai, skala = { A: 90, B: 80, C: 70 }) {
  if (nilai === null || nilai === undefined) return "-";
  if (nilai >= skala.A) return "A";
  if (nilai >= skala.B) return "B";
  if (nilai >= skala.C) return "C";
  return "D";
}

function cekTotalBobot(items) {
  const total = (items || []).reduce((s, i) => s + (Number(i.bobot) || 0), 0);
  const selisih = total - 100;
  return { total, ok: Math.abs(selisih) < 0.01, selisih };
}

/** Total bobot1 dan bobot2 terpisah untuk indikator UI */
function cekBobotPerSemester(tpList) {
  const s1 = cekTotalBobot((tpList || []).map((t) => ({ bobot: Number(t.bobot1) || 0 })));
  const s2 = cekTotalBobot((tpList || []).map((t) => ({ bobot: Number(t.bobot2) || 0 })));
  return { s1, s2 };
}
