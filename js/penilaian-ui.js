/**
 * penilaian-ui.js
 * Alur Input: Mapel → TP → Kompetensi → Nilai
 * Saat ini memakai mock data. Nanti diganti baca/tulis Firestore.
 */

// ========== MOCK DATA (sementara) ==========
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

// 25 siswa Kelas 5A (nama placeholder — diganti data asli nanti)
const MOCK_SISWA = Array.from({ length: 25 }, (_, i) => ({
  id: `s${i + 1}`,
  nomorAbsen: i + 1,
  nama: `Siswa ${String(i + 1).padStart(2, "0")}`,
}));

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

  // Group by elemen
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
  list.innerHTML = MOCK_SISWA.map(
    (s) => `
    <div class="siswa-row">
      <span class="absen">${s.nomorAbsen}</span>
      <span class="nama">${escapeHtml(s.nama)}</span>
      <input type="number" min="0" max="100" step="1" data-siswa="${s.id}" placeholder="0–100" />
    </div>`
  ).join("");
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
  inputs.forEach((inp) => {
    const v = inp.value.trim();
    if (v !== "") {
      const n = Number(v);
      if (isNaN(n) || n < 0 || n > 100) {
        showError(`Nilai harus 0–100 (cek absen ${inp.closest(".siswa-row").querySelector(".absen").textContent})`);
        return;
      }
      nilaiMap[inp.dataset.siswa] = n;
      adaNilai = true;
    }
  });

  if (!adaNilai) {
    showError("Isi minimal satu nilai siswa.");
    return;
  }
  if (!tanggal) {
    showError("Tanggal wajib diisi.");
    return;
  }

  // MOCK: simpan ke console / localStorage sementara
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
  // AR-11: kembali ke daftar kompetensi TP yang sama
  goToKompetensi();
});

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
  setTimeout(() => el.classList.remove("show"), 4000);
}

function showSuccess(msg) {
  const el = document.getElementById("success-msg");
  el.textContent = msg;
  el.classList.add("show");
  document.getElementById("error-msg").classList.remove("show");
  setTimeout(() => el.classList.remove("show"), 3000);
}

// ========== INIT ==========
renderMapel();
showStep("step-mapel");
