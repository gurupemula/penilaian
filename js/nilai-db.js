/**
 * nilai-db.js — collection `penilaian`
 * Opsi B: satu dokumen = batch nilai satu kompetensi pada satu tanggal
 * doc id: {mapelId}__{tpId}__{kompetensiId}__{tanggal}
 */

const COL_PENILAIAN = "penilaian";

function penilaianDocId(mapelId, tpId, kompetensiId, tanggal) {
  return [mapelId, tpId, kompetensiId, tanggal].map(String).join("__");
}

/**
 * Simpan / merge batch nilai.
 * @param {object} payload
 * @param {string} payload.mapelId
 * @param {string} payload.tpId
 * @param {string} payload.kompetensiId
 * @param {string} payload.tanggal  YYYY-MM-DD
 * @param {string} [payload.catatan]
 * @param {Object.<string, number>} payload.nilai  nisn → 0–100
 * @param {boolean} [payload.merge=true]  true = gabung dengan nilai lama di tanggal sama
 */
async function savePenilaian(payload) {
  const { mapelId, tpId, kompetensiId, tanggal, catatan = "", nilai, merge = true } = payload;
  if (!mapelId || !tpId || !kompetensiId || !tanggal) {
    throw new Error("mapelId, tpId, kompetensiId, tanggal wajib.");
  }
  if (!nilai || typeof nilai !== "object" || !Object.keys(nilai).length) {
    throw new Error("Minimal satu nilai siswa.");
  }

  const id = penilaianDocId(mapelId, tpId, kompetensiId, tanggal);
  const ref = db.collection(COL_PENILAIAN).doc(id);
  const now = firebase.firestore.FieldValue.serverTimestamp();

  let nilaiFinal = { ...nilai };
  const existing = await ref.get();
  if (existing.exists && merge) {
    const old = existing.data().nilai || {};
    nilaiFinal = { ...old, ...nilai };
  }

  const data = {
    mapelId,
    tpId,
    kompetensiId,
    tanggal,
    catatan: catatan || "",
    nilai: nilaiFinal,
    updatedAt: now,
  };
  if (!existing.exists) data.createdAt = now;

  await ref.set(data, { merge: true });
  return {
    id,
    count: Object.keys(nilaiFinal).length,
    written: Object.keys(nilai).length,
    isNew: !existing.exists,
  };
}

/** Ambil satu batch penilaian */
async function getPenilaian(mapelId, tpId, kompetensiId, tanggal) {
  const id = penilaianDocId(mapelId, tpId, kompetensiId, tanggal);
  const snap = await db.collection(COL_PENILAIAN).doc(id).get();
  if (!snap.exists) return null;
  return { id: snap.id, ...snap.data() };
}

/**
 * Semua sesi penilaian untuk satu kompetensi (riwayat tanggal).
 * Diurutkan tanggal terbaru dulu.
 */
async function listPenilaianByKompetensi(mapelId, tpId, kompetensiId) {
  const snap = await db
    .collection(COL_PENILAIAN)
    .where("mapelId", "==", mapelId)
    .where("tpId", "==", tpId)
    .where("kompetensiId", "==", kompetensiId)
    .get();
  const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  list.sort((a, b) => String(b.tanggal || "").localeCompare(String(a.tanggal || "")));
  return list;
}

/** Batch terbaru untuk kompetensi (untuk prefill sheet) */
async function getLatestPenilaian(mapelId, tpId, kompetensiId) {
  const list = await listPenilaianByKompetensi(mapelId, tpId, kompetensiId);
  return list[0] || null;
}

/**
 * Semua penilaian satu mapel (untuk rekap).
 */
async function listPenilaianByMapel(mapelId) {
  const snap = await db.collection(COL_PENILAIAN).where("mapelId", "==", mapelId).get();
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

async function deletePenilaian(mapelId, tpId, kompetensiId, tanggal) {
  const id = penilaianDocId(mapelId, tpId, kompetensiId, tanggal);
  await db.collection(COL_PENILAIAN).doc(id).delete();
}

/**
 * Hapus nilai satu siswa dari dokumen tanggal tertentu.
 * Jika dokumen kosong setelah hapus, dokumen ikut dihapus.
 */
async function hapusNilaiSiswa(mapelId, tpId, kompetensiId, tanggal, siswaId) {
  if (!mapelId || !tpId || !kompetensiId || !tanggal || !siswaId) {
    throw new Error("Parameter hapus nilai tidak lengkap.");
  }
  const id = penilaianDocId(mapelId, tpId, kompetensiId, tanggal);
  const ref = db.collection(COL_PENILAIAN).doc(id);
  const snap = await ref.get();
  if (!snap.exists) return { deleted: false, empty: true };

  const data = snap.data() || {};
  const nilai = { ...(data.nilai || {}) };
  const key = String(siswaId);
  if (!(key in nilai)) return { deleted: false, empty: Object.keys(nilai).length === 0 };

  delete nilai[key];
  const now = firebase.firestore.FieldValue.serverTimestamp();
  if (Object.keys(nilai).length === 0) {
    await ref.delete();
    return { deleted: true, empty: true, id };
  }
  await ref.set({ nilai, updatedAt: now }, { merge: true });
  return { deleted: true, empty: false, id, remaining: Object.keys(nilai).length };
}
