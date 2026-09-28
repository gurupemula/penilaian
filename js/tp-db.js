/**
 * tp-db.js
 * tp fields: bobot1 (S1), bobot2 (S2), semester (legacy/filter), ...
 */

const COL_MAPEL = "mapel";
const COL_TP = "tp";
const COL_KOMP = "kompetensi";

function normalizeTP(tp) {
  if (tp.bobot1 == null && tp.bobot2 == null && tp.bobot != null) {
    const b = Number(tp.bobot) || 0;
    const sem = tp.semester || "kedua";
    if (sem === "1") {
      tp.bobot1 = b;
      tp.bobot2 = 0;
    } else if (sem === "2") {
      tp.bobot1 = 0;
      tp.bobot2 = b;
    } else {
      tp.bobot1 = b;
      tp.bobot2 = b;
    }
  }
  tp.bobot1 = Number(tp.bobot1) || 0;
  tp.bobot2 = Number(tp.bobot2) || 0;
  return tp;
}

async function fetchMapel() {
  const snap = await db.collection(COL_MAPEL).orderBy("urutan").get();
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

async function fetchTPByMapel(mapelId) {
  const snap = await db.collection(COL_TP).where("mapelId", "==", mapelId).get();
  const list = snap.docs.map((d) => normalizeTP({ id: d.id, ...d.data() }));
  list.sort((a, b) => (a.urutan || 0) - (b.urutan || 0) || String(a.kode).localeCompare(String(b.kode)));
  return list;
}

async function fetchKompetensiByTP(tpId) {
  const snap = await db.collection(COL_KOMP).where("tpId", "==", tpId).get();
  const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  list.sort((a, b) => (a.urutan || 0) - (b.urutan || 0));
  return list;
}

/**
 * Muat kurikulum lengkap dengan 3 query paralel (bukan N+1 per TP).
 * 1) mapel  2) semua tp  3) semua kompetensi → join di client.
 */
async function fetchKurikulumLengkap() {
  const [mapelSnap, tpSnap, kompSnap] = await Promise.all([
    db.collection(COL_MAPEL).orderBy("urutan").get(),
    db.collection(COL_TP).get(),
    db.collection(COL_KOMP).get(),
  ]);

  let mapelList = mapelSnap.docs.map((d) => ({ id: d.id, ...d.data() }));

  const tpByMapel = {};
  tpSnap.docs.forEach((d) => {
    const data = normalizeTP({ id: d.id, ...d.data() });
    const mid = data.mapelId || "unknown";
    if (!tpByMapel[mid]) tpByMapel[mid] = [];
    tpByMapel[mid].push(data);
  });
  Object.keys(tpByMapel).forEach((mid) => {
    tpByMapel[mid].sort(
      (a, b) => (a.urutan || 0) - (b.urutan || 0) || String(a.kode).localeCompare(String(b.kode))
    );
  });

  const kompByTp = {};
  kompSnap.docs.forEach((d) => {
    const data = { id: d.id, ...d.data() };
    const tid = data.tpId || "unknown";
    if (!kompByTp[tid]) kompByTp[tid] = [];
    kompByTp[tid].push(data);
  });
  Object.keys(kompByTp).forEach((tid) => {
    kompByTp[tid].sort((a, b) => (a.urutan || 0) - (b.urutan || 0));
  });

  if (!mapelList.length && tpSnap.size) {
    mapelList = Object.keys(tpByMapel).map((mid, i) => ({
      id: mid,
      nama: mid.toUpperCase(),
      kode: mid.toUpperCase(),
      urutan: i + 1,
      _fromTpOnly: true,
    }));
  }

  return mapelList.map((m) => {
    const tps = (tpByMapel[m.id] || []).map((tp) => ({
      ...tp,
      kompetensi: kompByTp[tp.id] || [],
    }));
    return { ...m, tp: tps };
  });
}

async function fetchKurikulum() {
  return fetchKurikulumLengkap();
}

async function updateTP(tpId, fields) {
  const now = firebase.firestore.FieldValue.serverTimestamp();
  const data = { ...fields, updatedAt: now };
  await db.collection(COL_TP).doc(String(tpId)).set(data, { merge: true });

  const mapelId = fields.mapelId;
  if (mapelId) {
    const mRef = db.collection(COL_MAPEL).doc(String(mapelId));
    const mSnap = await mRef.get();
    if (!mSnap.exists) {
      await mRef.set(
        {
          nama: fields.mapelNama || String(mapelId).toUpperCase(),
          kode: fields.mapelKode || String(mapelId).toUpperCase(),
          urutan: fields.mapelUrutan || 0,
          createdAt: now,
          updatedAt: now,
        },
        { merge: true }
      );
    }
  }
}

async function updateKompetensi(kompetensiId, fields) {
  await db.collection(COL_KOMP).doc(String(kompetensiId)).set(
    {
      ...fields,
      updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
    },
    { merge: true }
  );
}

async function updateMapel(mapelId, fields) {
  await db.collection(COL_MAPEL).doc(String(mapelId)).set(
    {
      ...fields,
      updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
    },
    { merge: true }
  );
}

async function seedKurikulum(kurikulum, options = {}) {
  const { force = false, deskripsiOnly = false } = options;
  const now = firebase.firestore.FieldValue.serverTimestamp();
  let mapelN = 0,
    tpN = 0,
    kompN = 0,
    skipped = 0;

  const ops = [];

  async function flush() {
    while (ops.length) {
      const chunk = ops.splice(0, 400);
      const batch = db.batch();
      chunk.forEach(({ ref, data }) => batch.set(ref, data, { merge: true }));
      await batch.commit();
    }
  }

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
      ops.push({ ref: mapelRef, data: mapelData });
      mapelN++;
    } else if (deskripsiOnly) {
      ops.push({
        ref: mapelRef,
        data: { nama: m.nama, kode: m.kode, urutan: m.urutan || 0, updatedAt: now },
      });
      mapelN++;
    } else {
      skipped++;
    }

    let tpUrutan = 0;
    for (const tp of m.tp || []) {
      tpUrutan++;
      const n = normalizeTP({ ...tp });
      const tpRef = db.collection(COL_TP).doc(tp.id);
      const tpExists = (await tpRef.get()).exists;

      if (!tpExists) {
        const tpData = {
          mapelId: m.id,
          kode: tp.kode,
          elemen: tp.elemen || "",
          tujuan: tp.tujuan || "",
          bobot1: n.bobot1,
          bobot2: n.bobot2,
          bobot: n.bobot1 || n.bobot2,
          semester: tp.semester || "kedua",
          urutan: tp.urutan || tpUrutan,
          jp: tp.jp || 0,
          createdAt: now,
          updatedAt: now,
        };
        if (tp.cabang) tpData.cabang = tp.cabang;
        ops.push({ ref: tpRef, data: tpData });
        tpN++;
      } else if (deskripsiOnly) {
        const patch = {
          kode: tp.kode,
          elemen: tp.elemen || "",
          tujuan: tp.tujuan || "",
          urutan: tp.urutan || tpUrutan,
          updatedAt: now,
        };
        if (tp.cabang) patch.cabang = tp.cabang;
        ops.push({ ref: tpRef, data: patch });
        tpN++;
      } else if (force) {
        const tpData = {
          mapelId: m.id,
          kode: tp.kode,
          elemen: tp.elemen || "",
          tujuan: tp.tujuan || "",
          bobot1: n.bobot1,
          bobot2: n.bobot2,
          bobot: n.bobot1 || n.bobot2,
          semester: tp.semester || "kedua",
          urutan: tp.urutan || tpUrutan,
          jp: tp.jp || 0,
          updatedAt: now,
        };
        if (tp.cabang) tpData.cabang = tp.cabang;
        ops.push({ ref: tpRef, data: tpData });
        tpN++;
      } else {
        skipped++;
      }

      for (const k of tp.kompetensi || []) {
        const kRef = db.collection(COL_KOMP).doc(k.id);
        const kExists = (await kRef.get()).exists;

        if (!kExists) {
          ops.push({
            ref: kRef,
            data: {
              tpId: tp.id,
              mapelId: m.id,
              deskripsi: k.deskripsi,
              urutan: k.urutan || 1,
              createdAt: now,
              updatedAt: now,
            },
          });
          kompN++;
        } else if (deskripsiOnly || force) {
          ops.push({
            ref: kRef,
            data: {
              tpId: tp.id,
              mapelId: m.id,
              deskripsi: k.deskripsi,
              urutan: k.urutan || 1,
              updatedAt: now,
            },
          });
          kompN++;
        } else {
          skipped++;
        }
      }

      if (ops.length >= 400) await flush();
    }
  }
  await flush();
  return { mapel: mapelN, tp: tpN, kompetensi: kompN, skipped };
}

/**
 * seedTP(mode)
 * mode=false → isi dokumen yang belum ada
 * mode=true → timpa semua termasuk bobot
 * mode="deskripsi" → update teks saja; bobot tetap
 */
async function seedTP(mode = false) {
  const res = await fetch("data/kurikulum-5a.json");
  if (!res.ok) throw new Error("Gagal memuat data/kurikulum-5a.json (" + res.status + ")");
  const data = await res.json();
  const payload = Array.isArray(data) ? { mapel: data } : data;
  if (!payload.mapel || !payload.mapel.length) throw new Error("File kurikulum-5a.json kosong.");
  if (mode === "deskripsi" || mode === "teks") {
    return seedKurikulum(payload, { deskripsiOnly: true });
  }
  return seedKurikulum(payload, { force: !!mode });
}

function nextTpId(mapelId, existingTps) {
  const prefix = String(mapelId) + "-tp";
  let max = 0;
  (existingTps || []).forEach((t) => {
    const m = String(t.id || "").match(new RegExp("^" + prefix.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + "(\\d+)$", "i"));
    if (m) max = Math.max(max, Number(m[1]));
    const m2 = String(t.kode || "").match(/^TP(\\d+)$/i);
    if (m2) max = Math.max(max, Number(m2[1]));
  });
  return { id: prefix + (max + 1), kode: "TP" + (max + 1), urutan: max + 1 };
}

function nextKompId(tpId, existingKomps) {
  const prefix = String(tpId) + "-k";
  let max = 0;
  (existingKomps || []).forEach((k) => {
    const m = String(k.id || "").match(new RegExp("^" + prefix.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + "(\\d+)$", "i"));
    if (m) max = Math.max(max, Number(m[1]));
  });
  return { id: prefix + (max + 1), urutan: max + 1 };
}

async function createTP(mapelId, fields, existingTps = []) {
  if (!mapelId) throw new Error("mapelId wajib.");
  const gen = nextTpId(mapelId, existingTps);
  const id = fields.id || gen.id;
  const kode = fields.kode || gen.kode;
  const n = normalizeTP({
    bobot1: fields.bobot1,
    bobot2: fields.bobot2,
    bobot: fields.bobot,
    semester: fields.semester || "kedua",
  });
  const now = firebase.firestore.FieldValue.serverTimestamp();
  const data = {
    mapelId: String(mapelId),
    kode,
    elemen: fields.elemen || "",
    tujuan: fields.tujuan || "",
    bobot1: n.bobot1,
    bobot2: n.bobot2,
    bobot: n.bobot1 || n.bobot2,
    semester: fields.semester || "kedua",
    urutan: fields.urutan != null ? fields.urutan : gen.urutan,
    jp: fields.jp || 0,
    createdAt: now,
    updatedAt: now,
  };
  if (fields.cabang) data.cabang = fields.cabang;
  await db.collection(COL_TP).doc(id).set(data, { merge: true });

  const mRef = db.collection(COL_MAPEL).doc(String(mapelId));
  if (!(await mRef.get()).exists) {
    await mRef.set(
      {
        nama: fields.mapelNama || String(mapelId).toUpperCase(),
        kode: fields.mapelKode || String(mapelId).toUpperCase(),
        urutan: fields.mapelUrutan || 0,
        createdAt: now,
        updatedAt: now,
      },
      { merge: true }
    );
  }
  return { id, kode, ...data };
}

async function createKompetensi(tpId, mapelId, fields, existingKomps = []) {
  if (!tpId) throw new Error("tpId wajib.");
  const gen = nextKompId(tpId, existingKomps);
  const id = fields.id || gen.id;
  const now = firebase.firestore.FieldValue.serverTimestamp();
  const data = {
    tpId: String(tpId),
    mapelId: mapelId ? String(mapelId) : "",
    deskripsi: (fields.deskripsi || "").trim(),
    urutan: fields.urutan != null ? fields.urutan : gen.urutan,
    createdAt: now,
    updatedAt: now,
  };
  if (!data.deskripsi) throw new Error("Deskripsi kompetensi wajib.");
  await db.collection(COL_KOMP).doc(id).set(data, { merge: true });
  return { id, ...data };
}

async function deleteTP(tpId) {
  const snap = await db.collection(COL_KOMP).where("tpId", "==", String(tpId)).get();
  const batch = db.batch();
  snap.docs.forEach((d) => batch.delete(d.ref));
  batch.delete(db.collection(COL_TP).doc(String(tpId)));
  await batch.commit();
  return { deletedKomp: snap.size };
}

async function deleteKompetensi(kompetensiId) {
  await db.collection(COL_KOMP).doc(String(kompetensiId)).delete();
}

async function countMapel() {
  const snap = await db.collection(COL_MAPEL).get();
  return snap.size;
}
