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
 * Ambil semua siswa aktif, diurutkan nomor absen.
 * @returns {Promise<Array<{id, nomorAbsen, nisn, nama, kelas}>>}
 */
async function fetchSiswaFromFirestore(kelas = KELAS_DEFAULT) {
  const snap = await db
    .collection(SISWA_COLLECTION)
    .where("kelas", "==", kelas)
    .where("aktif", "==", true)
    .get();

  const list = [];
  snap.forEach((doc) => {
    const d = doc.data();
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
 * Seed siswa dari array (mis. isi data/siswa-5a.json).
 * Memakai batch write. Document ID = nisn.
 * Tidak menimpa jika sudah ada (merge: false) — kecuali force=true.
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

  // Batch max 500; kita cuma 25 siswa
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

    batch.set(
      ref,
      {
        nomorAbsen: s.nomorAbsen,
        nisn: String(s.nisn),
        nama: s.nama,
        kelas,
        aktif: true,
        createdAt: now,
        updatedAt: now,
      },
      { merge: force }
    );
    written++;
  }

  if (written > 0) {
    await batch.commit();
  }

  return { written, skipped };
}

/**
 * Update satu field siswa (mis. nama).
 */
async function updateSiswa(nisn, fields) {
  const ref = db.collection(SISWA_COLLECTION).doc(String(nisn));
  await ref.update({
    ...fields,
    updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
  });
}
