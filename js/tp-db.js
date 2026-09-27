/**
 * tp-db.js
 * Collection:
 *   mapel/{mapelId}
 *   tp/{tpId}          — field mapelId, bobot, semester, cabang, ...
 *   kompetensi/{id}    — field tpId, mapelId, deskripsi, urutan
 */

const COL_MAPEL = "mapel";
const COL_TP = "tp";
const COL_KOMP = "kompetensi";

/** @returns {Promise<Array>} mapel diurutkan urutan */
async function fetchMapel() {
  const snap = await db.collection(COL_MAPEL).orderBy("urutan").get();
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

/** @returns {Promise<Array>} TP untuk satu mapel */
async function fetchTPByMapel(mapelId) {
  const snap = await db.collection(COL_TP).where("mapelId", "==", mapelId).get();
  const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  list.sort((a, b) => (a.urutan || 0) - (b.urutan || 0) || String(a.kode).localeCompare(String(b.kode)));
  return list;
}

/** @returns {Promise<Array>} kompetensi untuk satu TP */
async function fetchKompetensiByTP(tpId) {
  const snap = await db.collection(COL_KOMP).where("tpId", "==", tpId).get();
  const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  list.sort((a, b) => (a.urutan || 0) - (b.urutan || 0));
  return list;
}

/** Muat seluruh kurikulum terstruktur: mapel[] dengan tp[] dan kompetensi[] */
async function fetchKurikulumLengkap() {
  const mapelList = await fetchMapel();
  const result = [];

  for (const m of mapelList) {
    const tps = await fetchTPByMapel(m.id);
    const tpWithKomp = [];
    for (const tp of tps) {
      const kompetensi = await fetchKompetensiByTP(tp.id);
      tpWithKomp.push({ ...tp, kompetensi });
    }
    result.push({ ...m, tp: tpWithKomp });
  }
  return result;
}

/** Update field TP (bobot, semester, tujuan, elemen, cabang, ...) */
async function updateTP(tpId, fields) {
  await db
    .collection(COL_TP)
    .doc(tpId)
    .update({
      ...fields,
      updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
    });
}

/** Update kompetensi */
async function updateKompetensi(kompetensiId, fields) {
  await db
    .collection(COL_KOMP)
    .doc(kompetensiId)
    .update({
      ...fields,
      updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
    });
}

/** Update mapel (nama, kelompokBobot, ...) */
async function updateMapel(mapelId, fields) {
  await db
    .collection(COL_MAPEL)
    .doc(mapelId)
    .update({
      ...fields,
      updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
    });
}

/**
 * Seed dari objek kurikulum (format data/kurikulum-5a.json).
 * force=true menimpa dokumen yang sudah ada.
 */
async function seedKurikulum(kurikulum, options = {}) {
  const { force = false } = options;
  const now = firebase.firestore.FieldValue.serverTimestamp();
  let mapelN = 0,
    tpN = 0,
    kompN = 0,
    skipped = 0;

  for (const m of kurikulum.mapel || []) {
    const mapelRef = db.collection(COL_MAPEL).doc(m.id);
    const mapelExists = (await mapelRef.get()).exists;

    if (!mapelExists || force) {
      const mapelData = {
        nama: m.nama,
        kode: m.kode,
        urutan: m.urutan || 0,
        updatedAt: now,
      };
      if (m.kelompokBobot) mapelData.kelompokBobot = m.kelompokBobot;
      if (m.catatanKompetensi) mapelData.catatanKompetensi = m.catatanKompetensi;
      if (!mapelExists) mapelData.createdAt = now;
      await mapelRef.set(mapelData, { merge: force });
      mapelN++;
    } else {
      skipped++;
    }

    let tpUrutan = 0;
    for (const tp of m.tp || []) {
      tpUrutan++;
      const tpRef = db.collection(COL_TP).doc(tp.id);
      const tpExists = (await tpRef.get()).exists;

      if (!tpExists || force) {
        const tpData = {
          mapelId: m.id,
          kode: tp.kode,
          elemen: tp.elemen || "",
          tujuan: tp.tujuan || "",
          bobot: Number(tp.bobot) || 0,
          semester: tp.semester || "kedua",
          urutan: tp.urutan || tpUrutan,
          jp: tp.jp || 0,
          updatedAt: now,
        };
        if (tp.cabang) tpData.cabang = tp.cabang;
        if (!tpExists) tpData.createdAt = now;
        await tpRef.set(tpData, { merge: force });
        tpN++;
      } else {
        skipped++;
      }

      for (const k of tp.kompetensi || []) {
        const kRef = db.collection(COL_KOMP).doc(k.id);
        const kExists = (await kRef.get()).exists;
        if (!kExists || force) {
          const kData = {
            tpId: tp.id,
            mapelId: m.id,
            deskripsi: k.deskripsi,
            urutan: k.urutan || 1,
            updatedAt: now,
          };
          if (!kExists) kData.createdAt = now;
          await kRef.set(kData, { merge: force });
          kompN++;
        } else {
          skipped++;
        }
      }
    }
  }

  return { mapel: mapelN, tp: tpN, kompetensi: kompN, skipped };
}

async function countMapel() {
  const snap = await db.collection(COL_MAPEL).get();
  return snap.size;
}
