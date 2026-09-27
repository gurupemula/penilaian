/**
 * penilaian-ui.js
 * Alur Input: Mapel → TP → Kompetensi → Nilai
 * Siswa: Firestore (prioritas) → JSON → fallback lokal
 * TP/mapel masih mock — nanti diganti Firestore.
 */

// ========== MOCK MAPEL & TP (sementara) ==========
const MOCK_MAPEL = [
  { id: "bi", nama: "Bahasa Indonesia", kode: "BI" },
  { id: "ipas", nama: "IPAS", kode: "IPAS" },
  { id: "pp", nama: "Pendidikan Pancasila", kode: "PP" },
  { id: "sb", nama: "Seni Budaya", kode: "SB" },
];

const MOCK_TP = {
  bi: [
    {
      id: "bi-tp1",
      kode: "TP1",
      elemen: "Menyimak",
      tujuan: "Mengidentifikasi dan mencatat informasi penting dari teks nonsastra aural sederhana.",
      bobot: 10,
      semester: "kedua",
      kompetensi: [
        { id: "bi-tp1-k1", deskripsi: "Ketepatan menangkap dan mencatat informasi inti" },
        { id: "bi-tp1-k2", deskripsi: "Ketepatan memilah informasi penting dari detail yang tidak perlu" },
        { id: "bi-tp1-k3", deskripsi: "Kesantunan dan kesesuaian respons/tanggapan lisan" },
      ],
    },
    {
      id: "bi-tp2",
      kode: "TP2",
      elemen: "Menyimak",
      tujuan: "Menjelaskan hubungan antarbagian informasi (sebab-akibat atau urutan kejadian) dari teks aural.",
      bobot: 10,
      semester: "kedua",
      kompetensi: [
        { id: "bi-tp2-k1", deskripsi: "Ketepatan mengidentifikasi hubungan sebab-akibat atau urutan kejadian" },
        { id: "bi-tp2-k2", deskripsi: "Kemampuan menjelaskan hubungan dengan pemahaman sendiri" },
      ],
    },
    {
      id: "bi-tp3",
      kode: "TP3",
      elemen: "Membaca dan Memirsa",
      tujuan: "Membaca lancar kata-kata dengan pola kombinasi huruf yang kompleks.",
      bobot: 10,
      semester: "kedua",
      kompetensi: [
        { id: "bi-tp3-k1", deskripsi: "Kelancaran membaca nyaring teks otentik" },
        { id: "bi-tp3-k2", deskripsi: "Ketepatan melafalkan gabungan konsonan dan kata serapan" },
      ],
    },
  ],
  ipas: [
    {
      id: "ipas-tp1",
      kode: "TP1",
      elemen: "Sistem Organ Tubuh dan Kesehatan",
      tujuan: "Mengidentifikasi hubungan antara aktivitas tubuh dan perubahan respons tubuh.",
      bobot: 15,
      semester: "kedua",
      kompetensi: [
        { id: "ipas-tp1-k1", deskripsi: "Ketepatan mengidentifikasi hubungan aktivitas–respons tubuh" },
        { id: "ipas-tp1-k2", deskripsi: "Pemahaman pentingnya menjaga kesehatan" },
      ],
    },
  ],
  pp: [
    {
      id: "pp-tp1",
      kode: "TP1",
      elemen: "Pancasila",
      tujuan: "Menjelaskan makna nilai-nilai Pancasila dalam kehidupan sehari-hari.",
      bobot: 10,
      semester: "kedua",
      kompetensi: [
        { id: "pp-tp1-k1", deskripsi: "Ketepatan menjelaskan makna nilai Pancasila" },
        { id: "pp-tp1-k2", deskripsi: "Contoh penerapan dalam kehidupan sehari-hari" },
      ],
    },
  ],
  sb: [
    {
      id: "sb-tp1",
      kode: "TP1",
      elemen: "Seni Rupa",
      tujuan: "Menjelaskan unsur rupa dan prinsip desain dari pengamatan lingkungan.",
      bobot: 50,
      semester: "1",
      cabang: "Seni Rupa",
      kompetensi: [
        { id: "sb-tp1-k1", deskripsi: "Ketepatan mengidentifikasi unsur rupa dan prinsip desain" },
        { id: "sb-tp1-k2", deskripsi: "Kesungguhan menguji coba teknik menggambar tekstur" },
      ],
    },
  ],
};

const SISWA_FALLBACK = [
  { id: "3153742941", nomorAbsen: 1, nisn: "3153742941", nama: "Abdurrahman Ar Ribery" },
  { id: "3162659714", nomorAbsen: 2, nisn: "3162659714", nama: "Abyan Nandana Khalif" },
  { id: "3150563992", nomorAbsen: 3, nisn: "3150563992", nama: "Adskhan Ibran Elfatih" },
  { id: "3159409800", nomorAbsen: 4, nisn: "3159409800", nama: "Afiya Nur Ataya Sandi" },
  { id: "3156365089", nomorAbsen: 5, nisn: "3156365089", nama: "Aisyah Afqohunnisa" },
  { id: "3150790933", nomorAbsen: 6, nisn: "3150790933", nama: "Akhdan Ziyad" },
  { id: "3161535657", nomorAbsen: 7, nisn: "3161535657", nama: "Alam Rayyan Fiyanto" },
  { id: "0169932726", nomorAbsen: 8, nisn: "0169932726", nama: "Arsyila Almahyira Azgefa" },
  { id: "3169474236", nomorAbsen: 9, nisn: "3169474236", nama: "Athifa Nur Pelangi" },
  { id: "3153495240", nomorAbsen: 10, nisn: "3153495240", nama: "Fairel Atharizz Calief" },
  { id: "3155825302", nomorAbsen: 11, nisn: "3155825302", nama: "Fatih Pratama Basuki" },
  { id: "3159944404", nomorAbsen: 12, nisn: "3159944404", nama: "Flora Baby Queen" },
  { id: "3155235740", nomorAbsen: 13, nisn: "3155235740", nama: "Gilang Aditya Ramadhan" },
  { id: "3169421033", nomorAbsen: 14, nisn: "3169421033", nama: "Ilham Ibrahim" },
  { id: "0137469444", nomorAbsen: 15, nisn: "0137469444", nama: "Inara Huwaida Ardhani" },
  { id: "3155739832", nomorAbsen: 16, nisn: "3155739832", nama: "Kinara Adisti Salsabila" },
  { id: "3164599601", nomorAbsen: 17, nisn: "3164599601", nama: "Kirana Hafizah Iqra Nasution" },
  { id: "3152422747", nomorAbsen: 18, nisn: "3152422747", nama: "Latifa Rafanda" },
  { id: "3152848251", nomorAbsen: 19, nisn: "3152848251", nama: "Meshya Belliza Utama" },
  { id: "3151303538", nomorAbsen: 20, nisn: "3151303538", nama: "Muhammad Ali Alfarizi" },
  { id: "3158326656", nomorAbsen: 21, nisn: "3158326656", nama: "Nayla Latifa" },
  { id: "3155846202", nomorAbsen: 22, nisn: "3155846202", nama: "Quenzino Satria Hadika" },
  { id: "3152660139", nomorAbsen: 23, nisn: "3152660139", nama: "Reynand Pratama" },
  { id: "3156646475", nomorAbsen: 24, nisn: "3156646475", nama: "Shakila Qiyana Shadiqah" },
  { id: "3158512331", nomorAbsen: 25, nisn: "3158512331", nama: "Shanum Meyra Rosadi" },
];

let SISWA = [...SISWA_FALLBACK];
/** Sumber data siswa: "firestore" | "json" | "fallback" */
let SISWA_SOURCE = "fallback";

// ========== STATE ==========
const state = {
  mapel: null,
  tp: null,
  kompetensi: null,
};

// ========== TABS ==========
document.querySelectorAll(".tab-btn").forEach((btn) => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".tab-btn").forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");
    const tab = btn.dataset.tab;
    document.querySelectorAll(".tab-panel").forEach((p) => (p.style.display = "none"));
    document.getElementById(`tab-${tab}`).style.display = "block";
    if (tab === "siswa") renderTabSiswa();
  });
});

// ========== RENDER ==========
function showStep(stepId) {
  document.querySelectorAll(".step-section").forEach((s) => s.classList.remove("active"));
  document.getElementById(stepId).classList.add("active");
  renderBreadcrumb();
}

function renderBreadcrumb() {
  const el = document.getElementById("breadcrumb");
  const parts = [];
  parts.push(`<button type="button" onclick="goToMapel()">Mapel</button>`);
  if (state.mapel) {
    parts.push(`<span class="sep">›</span>`);
    parts.push(
      state.tp
        ? `<button type="button" onclick="goToTP()">${escapeHtml(state.mapel.nama)}</button>`
        : `<span class="current">${escapeHtml(state.mapel.nama)}</span>`
    );
  }
  if (state.tp) {
    parts.push(`<span class="sep">›</span>`);
    parts.push(
      state.kompetensi
        ? `<button type="button" onclick="goToKompetensi()">${escapeHtml(state.tp.kode)}</button>`
        : `<span class="current">${escapeHtml(state.tp.kode)}</span>`
    );
  }
  if (state.kompetensi) {
    parts.push(`<span class="sep">›</span>`);
    parts.push(`<span class="current">Kompetensi</span>`);
  }
  el.innerHTML = parts.join("");
}

function renderMapel() {
  const list = document.getElementById("mapel-list");
  list.innerHTML = MOCK_MAPEL.map(
    (m) => `
    <button type="button" class="choice-card" onclick="pilihMapel('${m.id}')">
      <h3>${escapeHtml(m.nama)}</h3>
      <p>${escapeHtml(m.kode)}</p>
    </button>`
  ).join("");
}

function renderTP() {
  const container = document.getElementById("tp-list");
  const tps = MOCK_TP[state.mapel.id] || [];
  if (tps.length === 0) {
    container.innerHTML = `<p class="page-desc">Belum ada TP untuk mapel ini (mock).</p>`;
    return;
  }
  const byElemen = {};
  tps.forEach((tp) => {
    if (!byElemen[tp.elemen]) byElemen[tp.elemen] = [];
    byElemen[tp.elemen].push(tp);
  });
  let html = "";
  for (const [elemen, items] of Object.entries(byElemen)) {
    html += `<div class="elemen-group"><h2>${escapeHtml(elemen)}</h2><div class="choice-grid">`;
    items.forEach((tp) => {
      html += `
        <button type="button" class="choice-card" onclick="pilihTP('${tp.id}')">
          <h3>${escapeHtml(tp.kode)}</h3>
          <p>${escapeHtml(tp.tujuan)}</p>
          <div class="meta">Bobot ${tp.bobot}% · Sem ${tp.semester}</div>
        </button>`;
    });
    html += `</div></div>`;
  }
  container.innerHTML = html;
}

function renderKompetensi() {
  const list = document.getElementById("kompetensi-list");
  const items = state.tp.kompetensi || [];
  list.innerHTML = items
    .map(
      (k, i) => `
    <button type="button" class="choice-card" onclick="pilihKompetensi('${k.id}')">
      <h3>Kompetensi ${i + 1}</h3>
      <p>${escapeHtml(k.deskripsi)}</p>
    </button>`
    )
    .join("");
}

function renderInputNilai() {
  document.getElementById("tanggal").value = new Date().toISOString().slice(0, 10);
  document.getElementById("catatan").value = "";
  const list = document.getElementById("siswa-nilai-list");
  list.innerHTML = SISWA.map(
    (s) => `
    <div class="siswa-row">
      <span class="absen">${s.nomorAbsen}</span>
      <span class="nama">${escapeHtml(s.nama)}</span>
      <input type="number" min="0" max="100" step="1" data-siswa="${s.id}" placeholder="0–100" />
    </div>`
  ).join("");
}

function renderTabSiswa() {
  const panel = document.getElementById("tab-siswa");
  const sourceLabel =
    SISWA_SOURCE === "firestore"
      ? "Firestore ✓"
      : SISWA_SOURCE === "json"
        ? "File JSON (belum di-seed ke Firestore)"
        : "Fallback lokal";

  panel.innerHTML = `
    <div style="display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:0.75rem;margin-bottom:1rem">
      <p class="page-desc" style="margin:0">Kelas 5A · ${SISWA.length} siswa · Sumber: <strong>${sourceLabel}</strong></p>
      <div style="display:flex;gap:0.5rem;flex-wrap:wrap">
        <button type="button" class="btn btn-secondary btn-sm" id="btn-refresh-siswa">Muat ulang</button>
        <button type="button" class="btn btn-primary btn-sm" id="btn-seed-siswa" style="width:auto">
          ${SISWA_SOURCE === "firestore" ? "Seed ulang (timpa)" : "Seed ke Firestore"}
        </button>
      </div>
    </div>
    <div class="note-box">
      Collection Firestore: <code>siswa</code> · Document ID = NISN · Field: nomorAbsen, nisn, nama, kelas, aktif
    </div>
    <div class="input-panel">
      <div class="siswa-nilai-list" style="max-height:none">
        ${SISWA.map(
          (s) => `
          <div class="siswa-row" style="grid-template-columns: 2.5rem 1fr auto">
            <span class="absen">${s.nomorAbsen}</span>
            <span class="nama">${escapeHtml(s.nama)}</span>
            <span style="font-size:0.8rem;color:#a0aec0">${escapeHtml(s.nisn)}</span>
          </div>`
        ).join("")}
      </div>
    </div>`;

  document.getElementById("btn-refresh-siswa").addEventListener("click", async () => {
    await loadSiswa();
    renderTabSiswa();
    showSuccess("Data siswa dimuat ulang.");
  });

  document.getElementById("btn-seed-siswa").addEventListener("click", async () => {
    await handleSeedSiswa(SISWA_SOURCE === "firestore");
  });
}

// ========== ACTIONS ==========
function pilihMapel(id) {
  state.mapel = MOCK_MAPEL.find((m) => m.id === id);
  state.tp = null;
  state.kompetensi = null;
  renderTP();
  showStep("step-tp");
}

function pilihTP(id) {
  const tps = MOCK_TP[state.mapel.id] || [];
  state.tp = tps.find((t) => t.id === id);
  state.kompetensi = null;
  renderKompetensi();
  showStep("step-kompetensi");
}

function pilihKompetensi(id) {
  state.kompetensi = state.tp.kompetensi.find((k) => k.id === id);
  renderInputNilai();
  showStep("step-nilai");
}

function goToMapel() {
  state.mapel = null;
  state.tp = null;
  state.kompetensi = null;
  showStep("step-mapel");
}

function goToTP() {
  state.tp = null;
  state.kompetensi = null;
  renderTP();
  showStep("step-tp");
}

function goToKompetensi() {
  state.kompetensi = null;
  renderKompetensi();
  showStep("step-kompetensi");
}

document.getElementById("btn-batal").addEventListener("click", () => {
  goToKompetensi();
});

document.getElementById("btn-simpan").addEventListener("click", () => {
  const tanggal = document.getElementById("tanggal").value;
  const catatan = document.getElementById("catatan").value.trim();
  const inputs = document.querySelectorAll("#siswa-nilai-list input[data-siswa]");

  const nilaiMap = {};
  let adaNilai = false;
  let errorAbsen = null;

  inputs.forEach((inp) => {
    const v = inp.value.trim();
    if (v !== "") {
      const n = Number(v);
      if (isNaN(n) || n < 0 || n > 100) {
        errorAbsen = inp.closest(".siswa-row").querySelector(".absen").textContent;
        return;
      }
      nilaiMap[inp.dataset.siswa] = n;
      adaNilai = true;
    }
  });

  if (errorAbsen) {
    showError(`Nilai harus 0–100 (cek absen ${errorAbsen})`);
    return;
  }
  if (!adaNilai) {
    showError("Isi minimal satu nilai siswa.");
    return;
  }
  if (!tanggal) {
    showError("Tanggal wajib diisi.");
    return;
  }

  const payload = {
    mapelId: state.mapel.id,
    tpId: state.tp.id,
    kompetensiId: state.kompetensi.id,
    tanggal,
    catatan,
    nilai: nilaiMap,
    savedAt: new Date().toISOString(),
  };
  console.log("[MOCK] Nilai tersimpan:", payload);
  const key = `penilaian_mock_${payload.mapelId}_${payload.tpId}_${payload.kompetensiId}_${payload.tanggal}`;
  localStorage.setItem(key, JSON.stringify(payload));
  showSuccess("Nilai tersimpan (sementara di browser). Kembali ke daftar kompetensi.");
  goToKompetensi();
});

// ========== SISWA LOAD & SEED ==========
async function loadSiswaFromJson() {
  const res = await fetch("data/siswa-5a.json");
  if (!res.ok) throw new Error("fetch json failed");
  const data = await res.json();
  return (data.siswa || []).map((s) => ({
    id: String(s.nisn),
    nomorAbsen: s.nomorAbsen,
    nisn: String(s.nisn),
    nama: s.nama,
  }));
}

async function loadSiswa() {
  // 1) Coba Firestore
  try {
    const list = await fetchSiswaFromFirestore("5A");
    if (list.length > 0) {
      SISWA = list;
      SISWA_SOURCE = "firestore";
      return;
    }
  } catch (e) {
    console.warn("Firestore siswa belum siap:", e.message || e);
  }

  // 2) File JSON
  try {
    SISWA = await loadSiswaFromJson();
    SISWA_SOURCE = "json";
    return;
  } catch (e) {
    console.warn("Gagal muat siswa-5a.json:", e);
  }

  // 3) Fallback
  SISWA = [...SISWA_FALLBACK];
  SISWA_SOURCE = "fallback";
}

async function handleSeedSiswa(force) {
  const loading = document.getElementById("loading");
  loading.classList.add("show");
  try {
    let sourceList;
    try {
      sourceList = await loadSiswaFromJson();
    } catch {
      sourceList = SISWA_FALLBACK.map(({ nomorAbsen, nisn, nama }) => ({
        nomorAbsen,
        nisn,
        nama,
      }));
    }

    const result = await seedSiswaToFirestore(sourceList, { force: !!force, kelas: "5A" });
    await loadSiswa();
    renderTabSiswa();
    showSuccess(
      force
        ? `Seed selesai: ${result.written} ditulis (mode timpa).`
        : `Seed selesai: ${result.written} baru, ${result.skipped} sudah ada dilewati.`
    );
  } catch (e) {
    console.error(e);
    let msg = e.message || "Gagal seed ke Firestore.";
    if (String(msg).includes("permission") || e.code === "permission-denied") {
      msg =
        "Izin ditolak. Pastikan sudah login dan Rules Firestore mengizinkan read/write untuk user terautentikasi.";
    }
    showError(msg);
  } finally {
    loading.classList.remove("show");
  }
}

// ========== HELPERS ==========
function escapeHtml(str) {
  const d = document.createElement("div");
  d.textContent = str;
  return d.innerHTML;
}

function showError(msg) {
  const el = document.getElementById("error-msg");
  el.textContent = msg;
  el.classList.add("show");
  document.getElementById("success-msg").classList.remove("show");
  setTimeout(() => el.classList.remove("show"), 5000);
}

function showSuccess(msg) {
  const el = document.getElementById("success-msg");
  el.textContent = msg;
  el.classList.add("show");
  document.getElementById("error-msg").classList.remove("show");
  setTimeout(() => el.classList.remove("show"), 4000);
}

// ========== INIT ==========
(async function init() {
  await loadSiswa();
  renderMapel();
  showStep("step-mapel");
})();
