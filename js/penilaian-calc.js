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

function bobotTPUntukSemester(tp, semesterFilter) {
  const b1 = Number(tp.bobot1 != null ? tp.bobot1 : tp.bobot) || 0;
  const b2 = Number(tp.bobot2 != null ? tp.bobot2 : tp.bobot) || 0;
  if (semesterFilter === "1") return b1;
  if (semesterFilter === "2") return b2;
  if (b1 > 0 && b2 > 0) return (b1 + b2) / 2;
  return b1 || b2;
}

function filterTPBySemester(tpList, semesterFilter) {
  if (!semesterFilter || semesterFilter === "kedua") return tpList || [];
  return (tpList || []).filter((tp) => {
    const b1 = Number(tp.bobot1 != null ? tp.bobot1 : 0) || 0;
    const b2 = Number(tp.bobot2 != null ? tp.bobot2 : 0) || 0;
    // Utamakan bobot S1/S2; field semester hanya fallback jika bobot belum diisi
    if (semesterFilter === "1") {
      if (b1 > 0) return true;
      if (b1 === 0 && b2 === 0) return tp.semester === "1" || tp.semester === "kedua";
      return false;
    }
    if (semesterFilter === "2") {
      if (b2 > 0) return true;
      if (b1 === 0 && b2 === 0) return tp.semester === "2" || tp.semester === "kedua";
      return false;
    }
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

function cekBobotPerSemester(tpList) {
  const s1 = cekTotalBobot((tpList || []).map((t) => ({ bobot: Number(t.bobot1) || 0 })));
  const s2 = cekTotalBobot((tpList || []).map((t) => ({ bobot: Number(t.bobot2) || 0 })));
  return { s1, s2 };
}

function buildRekapMapel(siswaList, mapel, penilaianDocs, semesterFilter) {
  const sem = semesterFilter || "kedua";
  const tps = filterTPBySemester((mapel && mapel.tp) || [], sem);

  // Ambil HANYA sesi terbaru per kompetensi+siswa (bukan rata-rata multi-tanggal)
  // Urut tanggal DESC → nilai pertama yang ditemukan = yang dipakai
  const byKomp = {}; // kompetensiId -> { siswaId: number }
  const sortedDocs = (penilaianDocs || [])
    .filter((doc) => doc && doc.kompetensiId && doc.nilai)
    .slice()
    .sort((a, b) => String(b.tanggal || "").localeCompare(String(a.tanggal || "")));

  sortedDocs.forEach((doc) => {
    const tpOk = tps.some((t) => t.id === doc.tpId);
    if (!tpOk) return;
    if (!byKomp[doc.kompetensiId]) byKomp[doc.kompetensiId] = {};
    Object.entries(doc.nilai).forEach(([sid, n]) => {
      const num = Number(n);
      if (isNaN(num)) return;
      const key = String(sid);
      // sudah ada dari tanggal lebih baru → lewati
      if (byKomp[doc.kompetensiId][key] !== undefined) return;
      byKomp[doc.kompetensiId][key] = num;
    });
  });

  const columns = tps.map((tp) => ({
    id: tp.id,
    kode: tp.kode || tp.id,
    elemen: tp.elemen || "",
    bobot: bobotTPUntukSemester(tp, sem),
    cabang: tp.cabang || null,
  }));

  const rows = (siswaList || []).map((s) => {
    const sid = String(s.id || s.nisn);
    const nilaiTP = {};
    tps.forEach((tp) => {
      const kompScores = (tp.kompetensi || []).map((k) => {
        const v = byKomp[k.id] && byKomp[k.id][sid];
        return v !== undefined && v !== null ? v : null;
      });
      nilaiTP[tp.id] = nilaiAkhirTP(kompScores);
    });

    let nilaiMapel = null;
    const isSeni = mapel && mapel.kelompokBobot && Object.keys(mapel.kelompokBobot).length;
    if (isSeni) {
      const tpPerCabang = {};
      tps.forEach((tp) => {
        const cab = tp.cabang || "Lainnya";
        if (!tpPerCabang[cab]) tpPerCabang[cab] = [];
        tpPerCabang[cab].push({
          nilai: nilaiTP[tp.id],
          bobot: bobotTPUntukSemester(tp, sem),
        });
      });
      const sb = nilaiAkhirSeniBudaya({
        kelompokBobot: mapel.kelompokBobot,
        tpPerCabang,
      });
      nilaiMapel = sb.nilaiMapel;
    } else {
      nilaiMapel = nilaiAkhirMapel(
        tps.map((tp) => ({
          nilai: nilaiTP[tp.id],
          bobot: bobotTPUntukSemester(tp, sem),
        }))
      );
    }

    return {
      siswaId: sid,
      nomorAbsen: s.nomorAbsen,
      nama: s.nama,
      nilaiTP,
      nilaiMapel,
      predikat: predikat(nilaiMapel),
    };
  });

  return { columns, rows, semester: sem, mapelId: mapel && mapel.id, mapelNama: mapel && mapel.nama };
}

function formatNilai(n) {
  if (n === null || n === undefined || isNaN(n)) return "—";
  return (Math.round(n * 10) / 10).toFixed(1).replace(/\.0$/, "");
}
