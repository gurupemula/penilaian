/**
 * siswa-db.js
 * Baca/tulis collection `siswa` di Firestore.
 * Document ID = NISN.
 *
 * Struktur dokumen:
 * {
 *   nomorAbsen: number,
 *   nisn: string,
 *   nama: string,
 *   kelas: "5A",
 *   aktif: true,
 *   createdAt, updatedAt
 * }
 */

const SISWA_COLLECTION = "siswa";
const KELAS_DEFAULT = "5A";

/**
 * Ambil semua siswa aktif untuk satu kelas, diurutkan nomor absen.
 * Query hanya filter kelas (satu field) agar tidak wajib composite index.
 * @returns {Promise<Array<{id, nomorAbsen, nisn, nama, kelas}>>}
 */
async function fetchSiswaFromFirestore(kelas = KELAS_DEFAULT) {
  const snap = await db
    .collection(SISWA_COLLECTION)
    .where("kelas", "==", kelas)
    .get();

  const list = [];
  snap.forEach((doc) => {
    const d = doc.data();
    if (d.aktif === false) return;
    list.push({
      id: doc.id,
      nomorAbsen: d.nomorAbsen,
      nisn: d.nisn || doc.id,
      nama: d.nama,
      kelas: d.kelas || kelas,
    });
  });

  list.sort((a, b) => a.nomorAbsen - b.nomorAbsen);
  return list;
}

/**
 * Seed siswa dari array (isi data/siswa-5a.json).
 * Document ID = nisn. Batch write.
 * Jika force=false, dokumen yang sudah ada dilewati.
 *
 * @param {Array<{nomorAbsen, nisn, nama}>} siswaList
 * @param {{ force?: boolean, kelas?: string }} options
 * @returns {Promise<{ written: number, skipped: number }>
 */
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

    const payload = {
      nomorAbsen: s.nomorAbsen,
      nisn: String(s.nisn),
      nama: s.nama,
      kelas,
      aktif: true,
      updatedAt: now,
    };
    if (force) {
      batch.set(ref, payload, { merge: true });
    } else {
      payload.createdAt = now;
      batch.set(ref, payload);
    }
    written++;
  }

  if (written > 0) {
    await batch.commit();
  }

  return { written, skipped };
}

/**
 * Update field siswa.
 */
async function updateSiswa(nisn, fields) {
  const ref = db.collection(SISWA_COLLECTION).doc(String(nisn));
  await ref.update({
    ...fields,
    updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
  });
}

/**
 * Cek apakah collection siswa sudah terisi untuk kelas tertentu.
 */
async function countSiswa(kelas = KELAS_DEFAULT) {
  const snap = await db.collection(SISWA_COLLECTION).where("kelas", "==", kelas).get();
  return snap.size;
}
