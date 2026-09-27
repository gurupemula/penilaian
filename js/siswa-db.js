/**
 * siswa-db.js — collection `siswa`, doc id = NISN
 */

const SISWA_COLLECTION = "siswa";
const KELAS_DEFAULT = "5A";

function mapSiswaDoc(doc) {
  const d = doc.data();
  return {
    id: doc.id,
    nomorAbsen: d.nomorAbsen,
    nisn: d.nisn || doc.id,
    nis: d.nis || "",
    nama: d.nama || "",
    tempatLahir: d.tempatLahir || "",
    tanggalLahir: d.tanggalLahir || "",
    jenisKelamin: d.jenisKelamin || "",
    alamat: d.alamat || "",
    agama: d.agama || "",
    namaAyah: d.namaAyah || "",
    pekerjaanAyah: d.pekerjaanAyah || "",
    namaIbu: d.namaIbu || "",
    pekerjaanIbu: d.pekerjaanIbu || "",
    kelas: d.kelas || KELAS_DEFAULT,
    aktif: d.aktif !== false,
  };
}

async function fetchSiswaFromFirestore(kelas = KELAS_DEFAULT) {
  const snap = await db.collection(SISWA_COLLECTION).where("kelas", "==", kelas).get();
  const list = [];
  snap.forEach((doc) => {
    const s = mapSiswaDoc(doc);
    if (!s.aktif) return;
    list.push(s);
  });
  list.sort((a, b) => a.nomorAbsen - b.nomorAbsen);
  return list;
}

function buildSiswaPayload(s, kelas, now) {
  return {
    nomorAbsen: s.nomorAbsen,
    nisn: String(s.nisn),
    nis: s.nis != null ? String(s.nis) : "",
    nama: s.nama || "",
    tempatLahir: s.tempatLahir || "",
    tanggalLahir: s.tanggalLahir || "",
    jenisKelamin: s.jenisKelamin || "",
    alamat: s.alamat || "",
    agama: s.agama || "",
    namaAyah: s.namaAyah || "",
    pekerjaanAyah: s.pekerjaanAyah || "",
    namaIbu: s.namaIbu || "",
    pekerjaanIbu: s.pekerjaanIbu || "",
    kelas: s.kelas || kelas,
    aktif: true,
    updatedAt: now,
  };
}

async function seedSiswaToFirestore(siswaList, options = {}) {
  const { force = false, kelas = KELAS_DEFAULT } = options;
  const now = firebase.firestore.FieldValue.serverTimestamp();
  let written = 0;
  let skipped = 0;
  const batch = db.batch();

  for (const s of siswaList) {
    const ref = db.collection(SISWA_COLLECTION).doc(String(s.nisn));
    if (!force) {
      const existing = await ref.get();
      if (existing.exists) {
        skipped++;
        continue;
      }
    }
    const payload = buildSiswaPayload(s, kelas, now);
    if (force) {
      batch.set(ref, payload, { merge: true });
    } else {
      payload.createdAt = now;
      batch.set(ref, payload);
    }
    written++;
  }
  if (written > 0) await batch.commit();
  return { written, skipped };
}

async function updateSiswa(nisn, fields) {
  const allowed = [
    "nomorAbsen",
    "nis",
    "nama",
    "tempatLahir",
    "tanggalLahir",
    "jenisKelamin",
    "alamat",
    "agama",
    "namaAyah",
    "pekerjaanAyah",
    "namaIbu",
    "pekerjaanIbu",
    "kelas",
    "aktif",
  ];
  const data = {};
  for (const k of allowed) {
    if (fields[k] !== undefined) data[k] = fields[k];
  }
  data.updatedAt = firebase.firestore.FieldValue.serverTimestamp();
  await db.collection(SISWA_COLLECTION).doc(String(nisn)).update(data);
}

async function countSiswa(kelas = KELAS_DEFAULT) {
  const snap = await db.collection(SISWA_COLLECTION).where("kelas", "==", kelas).get();
  return snap.size;
}
