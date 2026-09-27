/**
 * penilaian-ui.js
 * Input: Mapel → TP → Kompetensi → Nilai
 * Tab TP: seed, edit bobot/semester/tujuan/kompetensi, bobot antar-cabang SB
 */

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
let SISWA_SOURCE = "fallback";

/** Kurikulum: array mapel dengan tp[] + kompetensi[] */
let KURIKULUM = [];
let KURIKULUM_SOURCE = "none";

const state = {
  mapel: null,
  tp: null,
  kompetensi: null,
  tpTabMapelId: null,
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
    if (tab === "tp") renderTabTP();
  });
});

// ========== RENDER INPUT ==========
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
  if (!KURIKULUM.length) {
    list.innerHTML = `<p class="page-desc">Belum ada data mapel. Buka tab <strong>TP</strong> lalu seed kurikulum.</p>`;
    return;
  }
  list.innerHTML = KURIKULUM.map(
    (m) => `
    <button type="button" class="choice-card" onclick="pilihMapel('${m.id}')">
      <h3>${escapeHtml(m.nama)}</h3>
      <p>${escapeHtml(m.kode)} · ${(m.tp || []).length} TP</p>
    </button>`
  ).join("");
}

function renderTP() {
  const container = document.getElementById("tp-list");
  const tps = state.mapel.tp || [];
  if (!tps.length) {
    container.innerHTML = `<p class="page-desc">Belum ada TP untuk mapel ini.</p>`;
    return;
  }
  const byElemen = {};
  tps.forEach((tp) => {
    const key = tp.elemen || "Lainnya";
    if (!byElemen[key]) byElemen[key] = [];
    byElemen[key].push(tp);
  });
  let html = "";
  for (const [elemen, items] of Object.entries(byElemen)) {
    html += `<div class="elemen-group"><h2>${escapeHtml(elemen)}</h2><div class="choice-grid">`;
    items.forEach((tp) => {
      const nKomp = (tp.kompetensi || []).length;
      html += `
        <button type="button" class="choice-card" onclick="pilihTP('${tp.id}')">
          <h3>${escapeHtml(tp.kode)}</h3>
          <p>${escapeHtml(tp.tujuan || "")}</p>
          <div class="meta">Bobot ${tp.bobot}% · Sem ${tp.semester} · ${nKomp} kompetensi</div>
        </button>`;
    });
    html += `</div></div>`;
  }
  container.innerHTML = html;
}

function renderKompetensi() {
  const list = document.getElementById("kompetensi-list");
  const items = state.tp.kompetensi || [];
  if (!items.length) {
    list.innerHTML = `<p class="page-desc">Belum ada kompetensi. Edit di tab TP.</p>`;
    return;
  }
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
  document.getElementById("siswa-nilai-list").innerHTML = SISWA.map(
    (s) => `
    <div class="siswa-row">
      <span class="absen">${s.nomorAbsen}</span>
      <span class="nama">${escapeHtml(s.nama)}</span>
      <input type="number" min="0" max="100" step="1" data-siswa="${s.id}" placeholder="0–100" />
    </div>`
  ).join("");
}

// ========== ACTIONS INPUT ==========
function pilihMapel(id) {
  state.mapel = KURIKULUM.find((m) => m.id === id);
  state.tp = null;
  state.kompetensi = null;
  renderTP();
  showStep("step-tp");
}

function pilihTP(id) {
  state.tp = (state.mapel.tp || []).find((t) => t.id === id);
  state.kompetensi = null;
  renderKompetensi();
  showStep("step-kompetensi");
}

function pilihKompetensi(id) {
  state.kompetensi = (state.tp.kompetensi || []).find((k) => k.id === id);
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

document.getElementById("btn-batal").addEventListener("click", () => goToKompetensi());

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
  if (errorAbsen) return showError(`Nilai harus 0–100 (cek absen ${errorAbsen})`);
  if (!adaNilai) return showError("Isi minimal satu nilai siswa.");
  if (!tanggal) return showError("Tanggal wajib diisi.");

  const payload = {
    mapelId: state.mapel.id,
    tpId: state.tp.id,
    kompetensiId: state.kompetensi.id,
    tanggal,
    catatan,
    nilai: nilaiMap,
    savedAt: new Date().toISOString(),
  };
  console.log("[MOCK] Nilai:", payload);
  localStorage.setItem(
    `penilaian_mock_${payload.mapelId}_${payload.tpId}_${payload.kompetensiId}_${payload.tanggal}`,
    JSON.stringify(payload)
  );
  showSuccess("Nilai tersimpan (sementara di browser).");
  goToKompetensi();
});

// ========== TAB SISWA ==========
function renderTabSiswa() {
  const panel = document.getElementById("tab-siswa");
  const sourceLabel =
    SISWA_SOURCE === "firestore" ? "Firestore ✓" : SISWA_SOURCE === "json" ? "File JSON" : "Fallback lokal";
  panel.innerHTML = `
    <div style="display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:0.75rem;margin-bottom:1rem">
      <p class="page-desc" style="margin:0">Kelas 5A · ${SISWA.length} siswa · <strong>${sourceLabel}</strong></p>
      <div style="display:flex;gap:0.5rem;flex-wrap:wrap">
        <button type="button" class="btn btn-secondary btn-sm" id="btn-refresh-siswa">Muat ulang</button>
        <button type="button" class="btn btn-primary btn-sm" id="btn-seed-siswa" style="width:auto">
          ${SISWA_SOURCE === "firestore" ? "Seed ulang (timpa)" : "Seed ke Firestore"}
        </button>
      </div>
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
  document.getElementById("btn-refresh-siswa").onclick = async () => {
    await loadSiswa();
    renderTabSiswa();
    showSuccess("Data siswa dimuat ulang.");
  };
  document.getElementById("btn-seed-siswa").onclick = () => handleSeedSiswa(SISWA_SOURCE === "firestore");
}

// ========== TAB TP ==========
function renderTabTP() {
  const panel = document.getElementById("tab-tp");
  const src =
    KURIKULUM_SOURCE === "firestore"
      ? "Firestore ✓"
      : KURIKULUM_SOURCE === "json"
        ? "File JSON (belum seed)"
        : "Belum ada data";

  const mapelOptions = KURIKULUM.map(
    (m) =>
      `<option value="${m.id}" ${state.tpTabMapelId === m.id ? "selected" : ""}>${escapeHtml(m.nama)}</option>`
  ).join("");

  if (!state.tpTabMapelId && KURIKULUM.length) state.tpTabMapelId = KURIKULUM[0].id;
  const mapel = KURIKULUM.find((m) => m.id === state.tpTabMapelId);

  let body = "";
  if (!mapel) {
    body = `<p class="page-desc">Belum ada kurikulum. Klik <strong>Seed kurikulum ke Firestore</strong>.</p>`;
  } else {
    const bobotCheck = cekTotalBobot(mapel.tp || []);
    const bobotBadge = bobotCheck.ok
      ? `<span style="color:#276749">✓ Total bobot ${bobotCheck.total.toFixed(0)}%</span>`
      : `<span style="color:#c05621">⚠ Total bobot ${bobotCheck.total.toFixed(0)}% (selisih ${bobotCheck.selisih > 0 ? "+" : ""}${bobotCheck.selisih.toFixed(0)})</span>`;

    let kelompokHtml = "";
    if (mapel.kelompokBobot) {
      const kb = mapel.kelompokBobot;
      const kbItems = Object.entries(kb).map(([nama, bobot]) => ({ bobot: Number(bobot) }));
      const kbCheck = cekTotalBobot(kbItems);
      kelompokHtml = `
        <div class="input-panel" style="margin-bottom:1rem">
          <h3 style="margin-bottom:0.75rem;font-size:1rem">Bobot antar cabang Seni Budaya</h3>
          <div class="choice-grid">
            ${Object.entries(kb)
              .map(
                ([nama, bobot]) => `
              <div class="form-group" style="margin:0">
                <label>${escapeHtml(nama)}</label>
                <input type="number" min="0" max="100" step="1" data-cabang="${escapeHtml(nama)}" value="${bobot}" class="kb-input" />
              </div>`
              )
              .join("")}
          </div>
          <p style="margin-top:0.75rem;font-size:0.9rem">${kbCheck.ok ? "✓" : "⚠"} Total ${kbCheck.total}%</p>
          <button type="button" class="btn btn-primary btn-sm" id="btn-save-kb" style="width:auto;margin-top:0.5rem">Simpan bobot cabang</button>
        </div>`;
    }

    body = `
      ${kelompokHtml}
      <p style="margin-bottom:1rem;font-size:0.9rem">${bobotBadge} · ideal 100% per semester (dicek di akhir)</p>
      ${(mapel.tp || [])
        .map((tp) => {
          const kompList = (tp.kompetensi || [])
            .map(
              (k, i) => `
            <div class="siswa-row" style="grid-template-columns:2rem 1fr auto;margin-bottom:0.35rem">
              <span class="absen">${i + 1}</span>
              <input type="text" data-komp-id="${k.id}" value="${escapeHtml(k.deskripsi)}" style="width:100%;padding:0.4rem 0.5rem;border:1.5px solid #e2e8f0;border-radius:8px;font-size:0.9rem" />
              <button type="button" class="btn btn-secondary btn-sm btn-save-komp" data-komp-id="${k.id}">Simpan</button>
            </div>`
            )
            .join("");
          return `
          <div class="input-panel" style="margin-bottom:1rem" data-tp-id="${tp.id}">
            <div style="display:flex;flex-wrap:wrap;gap:0.75rem;align-items:flex-start;justify-content:space-between">
              <div style="flex:1;min-width:200px">
                <strong>${escapeHtml(tp.kode)}</strong>
                ${tp.cabang ? `<span style="color:#718096;font-size:0.85rem"> · ${escapeHtml(tp.cabang)}</span>` : ""}
                <p style="font-size:0.85rem;color:#718096;margin:0.25rem 0">${escapeHtml(tp.elemen || "")}</p>
              </div>
              <div style="display:flex;gap:0.5rem;flex-wrap:wrap">
                <div class="form-group" style="margin:0">
                  <label style="font-size:0.75rem">Bobot %</label>
                  <input type="number" min="0" max="100" step="1" data-field="bobot" value="${tp.bobot}" style="width:4.5rem;padding:0.4rem;border:1.5px solid #e2e8f0;border-radius:8px" />
                </div>
                <div class="form-group" style="margin:0">
                  <label style="font-size:0.75rem">Semester</label>
                  <select data-field="semester" style="padding:0.4rem;border:1.5px solid #e2e8f0;border-radius:8px">
                    <option value="1" ${tp.semester === "1" ? "selected" : ""}>1</option>
                    <option value="2" ${tp.semester === "2" ? "selected" : ""}>2</option>
                    <option value="kedua" ${tp.semester === "kedua" ? "selected" : ""}>Kedua</option>
                  </select>
                </div>
                <button type="button" class="btn btn-primary btn-sm btn-save-tp" data-tp-id="${tp.id}" style="align-self:flex-end">Simpan TP</button>
              </div>
            </div>
            <div class="form-group" style="margin-top:0.75rem">
              <label style="font-size:0.75rem">Tujuan pembelajaran</label>
              <textarea data-field="tujuan" rows="2" style="width:100%;padding:0.5rem;border:1.5px solid #e2e8f0;border-radius:8px;font-size:0.9rem;font-family:inherit">${escapeHtml(tp.tujuan || "")}</textarea>
            </div>
            <details style="margin-top:0.5rem">
              <summary style="cursor:pointer;font-weight:600;font-size:0.9rem">Kompetensi (${(tp.kompetensi || []).length})</summary>
              <div style="margin-top:0.75rem">${kompList || "<p class=page-desc>Belum ada kompetensi</p>"}</div>
            </details>
          </div>`;
        })
        .join("")}`;
  }

  panel.innerHTML = `
    <div style="display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:0.75rem;margin-bottom:1rem">
      <p class="page-desc" style="margin:0">Kurikulum · sumber: <strong>${src}</strong></p>
      <div style="display:flex;gap:0.5rem;flex-wrap:wrap">
        <button type="button" class="btn btn-secondary btn-sm" id="btn-refresh-tp">Muat ulang</button>
        <button type="button" class="btn btn-primary btn-sm" id="btn-seed-tp" style="width:auto">
          ${KURIKULUM_SOURCE === "firestore" ? "Seed ulang (timpa)" : "Seed kurikulum ke Firestore"}
        </button>
      </div>
    </div>
    <div class="note-box">
      Kompetensi IPAS & PP disusun dari rumusan TP revisi (belum ada di data offline). Bobot bawaan bisa diubah. Ideal total 100% per semester.
    </div>
    <div class="form-group">
      <label>Pilih mapel</label>
      <select id="tp-mapel-select" style="width:100%;max-width:320px;padding:0.6rem;border:1.5px solid #e2e8f0;border-radius:10px">
        ${mapelOptions || "<option value=\"\">—</option>"}
      </select>
    </div>
    <div id="tp-edit-body">${body}</div>`;

  document.getElementById("btn-refresh-tp").onclick = async () => {
    await loadKurikulum();
    renderTabTP();
    renderMapel();
    showSuccess("Kurikulum dimuat ulang.");
  };
  document.getElementById("btn-seed-tp").onclick = () => handleSeedKurikulum(KURIKULUM_SOURCE === "firestore");

  const sel = document.getElementById("tp-mapel-select");
  if (sel) {
    sel.onchange = () => {
      state.tpTabMapelId = sel.value;
      renderTabTP();
    };
  }

  panel.querySelectorAll(".btn-save-tp").forEach((btn) => {
    btn.onclick = async () => {
      const card = btn.closest("[data-tp-id]");
      const tpId = btn.dataset.tpId;
      const bobot = Number(card.querySelector('[data-field="bobot"]').value);
      const semester = card.querySelector('[data-field="semester"]').value;
      const tujuan = card.querySelector('[data-field="tujuan"]').value.trim();
      if (isNaN(bobot) || bobot < 0 || bobot > 100) return showError("Bobot harus 0–100.");
      try {
        if (KURIKULUM_SOURCE === "firestore") {
          await updateTP(tpId, { bobot, semester, tujuan });
        }
        // update lokal
        const m = KURIKULUM.find((x) => x.id === state.tpTabMapelId);
        const tp = m && m.tp.find((t) => t.id === tpId);
        if (tp) {
          tp.bobot = bobot;
          tp.semester = semester;
          tp.tujuan = tujuan;
        }
        showSuccess(`TP ${tp ? tp.kode : tpId} disimpan.`);
        renderTabTP();
      } catch (e) {
        showError(e.message || "Gagal simpan TP.");
      }
    };
  });

  panel.querySelectorAll(".btn-save-komp").forEach((btn) => {
    btn.onclick = async () => {
      const kompId = btn.dataset.kompId;
      const input = panel.querySelector(`input[data-komp-id="${kompId}"]`);
      const deskripsi = input.value.trim();
      if (!deskripsi) return showError("Deskripsi kompetensi tidak boleh kosong.");
      try {
        if (KURIKULUM_SOURCE === "firestore") {
          await updateKompetensi(kompId, { deskripsi });
        }
        for (const m of KURIKULUM) {
          for (const tp of m.tp || []) {
            const k = (tp.kompetensi || []).find((x) => x.id === kompId);
            if (k) k.deskripsi = deskripsi;
          }
        }
        showSuccess("Kompetensi disimpan.");
      } catch (e) {
        showError(e.message || "Gagal simpan kompetensi.");
      }
    };
  });

  const btnKb = document.getElementById("btn-save-kb");
  if (btnKb) {
    btnKb.onclick = async () => {
      const inputs = panel.querySelectorAll(".kb-input");
      const kelompokBobot = {};
      inputs.forEach((inp) => {
        kelompokBobot[inp.dataset.cabang] = Number(inp.value) || 0;
      });
      const check = cekTotalBobot(Object.values(kelompokBobot).map((b) => ({ bobot: b })));
      try {
        if (KURIKULUM_SOURCE === "firestore") {
          await updateMapel(state.tpTabMapelId, { kelompokBobot });
        }
        const m = KURIKULUM.find((x) => x.id === state.tpTabMapelId);
        if (m) m.kelompokBobot = kelompokBobot;
        showSuccess(
          check.ok
            ? "Bobot antar cabang disimpan (100%)."
            : `Bobot disimpan. Total ${check.total}% (belum 100%).`
        );
        renderTabTP();
      } catch (e) {
        showError(e.message || "Gagal simpan bobot cabang.");
      }
    };
  }
}

// ========== LOAD & SEED ==========
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
  try {
    const list = await fetchSiswaFromFirestore("5A");
    if (list.length > 0) {
      SISWA = list;
      SISWA_SOURCE = "firestore";
      return;
    }
  } catch (e) {
    console.warn("Firestore siswa:", e.message || e);
  }
  try {
    SISWA = await loadSiswaFromJson();
    SISWA_SOURCE = "json";
    return;
  } catch (e) {
    console.warn("JSON siswa:", e);
  }
  SISWA = [...SISWA_FALLBACK];
  SISWA_SOURCE = "fallback";
}

async function loadKurikulumFromJson() {
  const res = await fetch("data/kurikulum-5a.json");
  if (!res.ok) throw new Error("fetch kurikulum failed");
  const data = await res.json();
  return data.mapel || [];
}

async function loadKurikulum() {
  try {
    const n = await countMapel();
    if (n > 0) {
      KURIKULUM = await fetchKurikulumLengkap();
      KURIKULUM_SOURCE = "firestore";
      return;
    }
  } catch (e) {
    console.warn("Firestore kurikulum:", e.message || e);
  }
  try {
    KURIKULUM = await loadKurikulumFromJson();
    KURIKULUM_SOURCE = "json";
    return;
  } catch (e) {
    console.warn("JSON kurikulum:", e);
  }
  KURIKULUM = [];
  KURIKULUM_SOURCE = "none";
}

async function handleSeedSiswa(force) {
  const loading = document.getElementById("loading");
  loading.classList.add("show");
  try {
    let sourceList;
    try {
      sourceList = await loadSiswaFromJson();
    } catch {
      sourceList = SISWA_FALLBACK.map(({ nomorAbsen, nisn, nama }) => ({ nomorAbsen, nisn, nama }));
    }
    const result = await seedSiswaToFirestore(sourceList, { force: !!force, kelas: "5A" });
    await loadSiswa();
    renderTabSiswa();
    showSuccess(
      force
        ? `Seed siswa: ${result.written} ditulis.`
        : `Seed siswa: ${result.written} baru, ${result.skipped} dilewati.`
    );
  } catch (e) {
    showError(formatFsError(e));
  } finally {
    loading.classList.remove("show");
  }
}

async function handleSeedKurikulum(force) {
  const loading = document.getElementById("loading");
  loading.classList.add("show");
  try {
    const res = await fetch("data/kurikulum-5a.json");
    if (!res.ok) throw new Error("Gagal memuat kurikulum-5a.json");
    const data = await res.json();
    const result = await seedKurikulum(data, { force: !!force });
    await loadKurikulum();
    renderTabTP();
    renderMapel();
    showSuccess(
      `Seed kurikulum: ${result.mapel} mapel, ${result.tp} TP, ${result.kompetensi} kompetensi` +
        (result.skipped ? `, ${result.skipped} dilewati` : "") +
        "."
    );
  } catch (e) {
    showError(formatFsError(e));
  } finally {
    loading.classList.remove("show");
  }
}

function formatFsError(e) {
  const msg = e.message || String(e);
  if (msg.includes("permission") || e.code === "permission-denied") {
    return "Izin ditolak. Pastikan login dan Rules Firestore mengizinkan read/write.";
  }
  return msg;
}

function escapeHtml(str) {
  const d = document.createElement("div");
  d.textContent = str == null ? "" : String(str);
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

(async function init() {
  await Promise.all([loadSiswa(), loadKurikulum()]);
  renderMapel();
  showStep("step-mapel");
})();
