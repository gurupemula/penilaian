/** penilaian-ui.js — sidebar + sheet */

function mapSiswaRow(s) {
  return {
    id: String(s.nisn),
    nomorAbsen: s.nomorAbsen,
    nisn: String(s.nisn),
    nis: s.nis || "",
    nama: s.nama || "",
    tempatLahir: s.tempatLahir || "",
    tanggalLahir: s.tanggalLahir || "",
    jenisKelamin: s.jenisKelamin || "",
    alamat: s.alamat || "",
  };
}

let SISWA = [];
let SISWA_SOURCE = "fallback";
let KURIKULUM = [];
let KURIKULUM_SOURCE = "none";
const state = { mapelId: "", tpId: "", kompetensiId: "", tpTabMapelId: null };
const TITLES = { input: "Input Nilai", rekap: "Rekap", siswa: "Siswa", tp: "Kurikulum / TP" };

function normalizeKurikulum(mapelList) {
  return (mapelList || []).map((m) => ({
    ...m,
    tp: (m.tp || []).map((tp) => {
      if (typeof normalizeTP === "function") return normalizeTP({ ...tp });
      const b = Number(tp.bobot) || 0;
      const sem = tp.semester || "kedua";
      let bobot1 = tp.bobot1, bobot2 = tp.bobot2;
      if (bobot1 == null && bobot2 == null) {
        if (sem === "1") { bobot1 = b; bobot2 = 0; }
        else if (sem === "2") { bobot1 = 0; bobot2 = b; }
        else { bobot1 = b; bobot2 = b; }
      }
      return { ...tp, bobot1: Number(bobot1) || 0, bobot2: Number(bobot2) || 0 };
    }),
  }));
}

document.querySelectorAll(".sidebar-nav .nav-item[data-tab]").forEach((btn) => {
  btn.addEventListener("click", () => switchTab(btn.dataset.tab));
});
document.getElementById("sidebar-toggle")?.addEventListener("click", () => {
  document.getElementById("sidebar").classList.toggle("open");
});

function switchTab(tab) {
  document.querySelectorAll(".sidebar-nav .nav-item[data-tab]").forEach((b) => {
    b.classList.toggle("active", b.dataset.tab === tab);
  });
  document.querySelectorAll(".tab-panel").forEach((p) => {
    p.hidden = p.id !== `tab-${tab}`;
  });
  const titleEl = document.getElementById("topbar-title");
  if (titleEl) titleEl.textContent = TITLES[tab] || tab;
  document.getElementById("sidebar")?.classList.remove("open");
  const actions = document.getElementById("topbar-actions");
  if (actions) actions.innerHTML = "";
  if (tab === "siswa") renderTabSiswa();
  if (tab === "tp") renderTabTP();
}

function fillMapelSelect() {
  const sel = document.getElementById("sel-mapel");
  if (!sel) return;
  sel.innerHTML = `<option value="">— pilih mapel —</option>` +
    KURIKULUM.map((m) => `<option value="${m.id}">${escapeHtml(m.nama)}</option>`).join("");
}

function fillTPSelect() {
  const sel = document.getElementById("sel-tp");
  if (!sel) return;
  const mapel = KURIKULUM.find((m) => m.id === state.mapelId);
  if (!mapel) { sel.innerHTML = `<option value="">—</option>`; sel.disabled = true; return; }
  const groups = {};
  (mapel.tp || []).forEach((tp) => {
    const e = tp.elemen || "Lainnya";
    if (!groups[e]) groups[e] = [];
    groups[e].push(tp);
  });
  let html = `<option value="">— pilih TP —</option>`;
  for (const [elemen, list] of Object.entries(groups)) {
    html += `<optgroup label="${escapeHtml(elemen)}">`;
    list.forEach((tp) => {
      html += `<option value="${tp.id}">${escapeHtml(tp.kode)} — ${escapeHtml(short(tp.tujuan, 48))}</option>`;
    });
    html += `</optgroup>`;
  }
  sel.innerHTML = html;
  sel.disabled = false;
}

function fillKompetensiSelect() {
  const sel = document.getElementById("sel-kompetensi");
  if (!sel) return;
  const mapel = KURIKULUM.find((m) => m.id === state.mapelId);
  const tp = mapel && (mapel.tp || []).find((t) => t.id === state.tpId);
  if (!tp) { sel.innerHTML = `<option value="">—</option>`; sel.disabled = true; return; }
  sel.innerHTML = `<option value="">— pilih kompetensi —</option>` +
    (tp.kompetensi || []).map((k, i) => `<option value="${k.id}">${i + 1}. ${escapeHtml(short(k.deskripsi, 70))}</option>`).join("");
  sel.disabled = false;
}

function updateInputWorkspace() {
  const ready = state.mapelId && state.tpId && state.kompetensiId;
  document.getElementById("input-workspace")?.classList.toggle("hidden", !ready);
  document.getElementById("input-empty")?.classList.toggle("hidden", ready);
  if (ready) renderNilaiSheet();
}

function renderNilaiSheet() {
  const tgl = document.getElementById("tanggal");
  const cat = document.getElementById("catatan");
  const tbody = document.getElementById("tbody-nilai");
  if (tgl) tgl.value = new Date().toISOString().slice(0, 10);
  if (cat) cat.value = "";
  if (!tbody) return;
  tbody.innerHTML = SISWA.map((s) => `
    <tr>
      <td class="num">${s.nomorAbsen}</td>
      <td>${escapeHtml(s.nama)}</td>
      <td class="w-nilai"><input type="number" min="0" max="100" step="1" data-siswa="${s.id}" /></td>
    </tr>`).join("");
}

document.getElementById("sel-mapel")?.addEventListener("change", (e) => {
  state.mapelId = e.target.value; state.tpId = ""; state.kompetensiId = "";
  fillTPSelect(); fillKompetensiSelect(); updateInputWorkspace();
});
document.getElementById("sel-tp")?.addEventListener("change", (e) => {
  state.tpId = e.target.value; state.kompetensiId = "";
  fillKompetensiSelect(); updateInputWorkspace();
});
document.getElementById("sel-kompetensi")?.addEventListener("change", (e) => {
  state.kompetensiId = e.target.value; updateInputWorkspace();
});

document.getElementById("btn-simpan")?.addEventListener("click", () => {
  const tanggal = document.getElementById("tanggal")?.value;
  const catatan = (document.getElementById("catatan")?.value || "").trim();
  const inputs = document.querySelectorAll("#tbody-nilai input[data-siswa]");
  const nilaiMap = {}; let ada = false, bad = null;
  inputs.forEach((inp) => {
    const v = inp.value.trim(); if (v === "") return;
    const n = Number(v);
    if (isNaN(n) || n < 0 || n > 100) { bad = inp.closest("tr").querySelector(".num").textContent; return; }
    nilaiMap[inp.dataset.siswa] = n; ada = true;
  });
  if (bad) return showError(`Nilai 0–100 (baris ${bad})`);
  if (!ada) return showError("Isi minimal satu nilai.");
  if (!tanggal) return showError("Tanggal wajib.");
  const payload = { mapelId: state.mapelId, tpId: state.tpId, kompetensiId: state.kompetensiId, tanggal, catatan, nilai: nilaiMap, savedAt: new Date().toISOString() };
  localStorage.setItem(`penilaian_mock_${payload.mapelId}_${payload.tpId}_${payload.kompetensiId}_${payload.tanggal}`, JSON.stringify(payload));
  showSuccess("Nilai tersimpan (sementara di browser).");
});

function renderTabSiswa() {
  const panel = document.getElementById("tab-siswa");
  if (!panel) return;
  const src = SISWA_SOURCE === "firestore" ? "Firestore ✓" : SISWA_SOURCE === "json" ? "JSON" : "Lokal";
  document.getElementById("topbar-actions").innerHTML = `
    <button type="button" class="btn btn-secondary btn-sm" id="btn-refresh-siswa">Muat ulang</button>
    <button type="button" class="btn btn-primary btn-sm" id="btn-seed-siswa">${SISWA_SOURCE === "firestore" ? "Seed ulang" : "Seed Firestore"}</button>`;
  panel.innerHTML = `
    <p class="page-desc">5A · ${SISWA.length} siswa · <strong>${src}</strong> · edit sel lalu klik Simpan</p>
    <div class="table-scroll">
      <table class="sheet">
        <thead><tr>
          <th class="w-abs">No</th><th>Nama</th><th class="w-nis">NISN</th><th class="w-nis">NIS</th>
          <th class="w-jk">JK</th><th class="w-ttl">Tempat, Tgl lahir</th><th>Alamat</th><th class="w-act"></th>
        </tr></thead>
        <tbody>
          ${SISWA.map((s) => `
            <tr data-nisn="${escapeHtml(s.nisn)}">
              <td class="w-abs"><input type="number" min="1" data-f="nomorAbsen" value="${s.nomorAbsen}" /></td>
              <td><input type="text" data-f="nama" value="${escapeHtml(s.nama)}" /></td>
              <td class="cell-muted">${escapeHtml(s.nisn)}</td>
              <td class="w-nis"><input type="text" data-f="nis" value="${escapeHtml(s.nis)}" /></td>
              <td class="w-jk"><select data-f="jenisKelamin">
                <option value="L" ${s.jenisKelamin === "L" ? "selected" : ""}>L</option>
                <option value="P" ${s.jenisKelamin === "P" ? "selected" : ""}>P</option>
              </select></td>
              <td class="w-ttl">
                <input type="text" data-f="tempatLahir" value="${escapeHtml(s.tempatLahir)}" placeholder="Tempat" style="margin-bottom:2px" />
                <input type="date" data-f="tanggalLahir" value="${escapeHtml(s.tanggalLahir)}" />
              </td>
              <td><input type="text" data-f="alamat" value="${escapeHtml(s.alamat)}" /></td>
              <td class="w-act"><button type="button" class="btn btn-primary btn-sm btn-save-siswa">Simpan</button></td>
            </tr>`).join("")}
        </tbody>
      </table>
    </div>`;
  document.getElementById("btn-refresh-siswa").onclick = async () => { await loadSiswa(); renderTabSiswa(); showSuccess("Siswa dimuat ulang."); };
  document.getElementById("btn-seed-siswa").onclick = () => handleSeedSiswa(SISWA_SOURCE === "firestore");
  panel.querySelectorAll(".btn-save-siswa").forEach((btn) => {
    btn.onclick = async () => {
      const tr = btn.closest("tr");
      const nisn = tr.dataset.nisn;
      const fields = {
        nomorAbsen: Number(tr.querySelector('[data-f="nomorAbsen"]').value) || 0,
        nama: tr.querySelector('[data-f="nama"]').value.trim(),
        nis: tr.querySelector('[data-f="nis"]').value.trim(),
        jenisKelamin: tr.querySelector('[data-f="jenisKelamin"]').value,
        tempatLahir: tr.querySelector('[data-f="tempatLahir"]').value.trim(),
        tanggalLahir: tr.querySelector('[data-f="tanggalLahir"]').value,
        alamat: tr.querySelector('[data-f="alamat"]').value.trim(),
      };
      if (!fields.nama) return showError("Nama wajib.");
      try {
        if (SISWA_SOURCE === "firestore" && typeof updateSiswa === "function") await updateSiswa(nisn, fields);
        const s = SISWA.find((x) => x.nisn === nisn);
        if (s) Object.assign(s, fields);
        showSuccess(`Siswa ${fields.nama} disimpan.`);
      } catch (e) { showError(e.message || "Gagal simpan siswa."); }
    };
  });
}

function renderTabTP() {
  const panel = document.getElementById("tab-tp");
  if (!panel) return;
  const src = KURIKULUM_SOURCE === "firestore" ? "Firestore ✓" : KURIKULUM_SOURCE === "json" ? "JSON" : "Kosong";
  document.getElementById("topbar-actions").innerHTML = `
    <button type="button" class="btn btn-secondary btn-sm" id="btn-refresh-tp">Muat ulang</button>
    <button type="button" class="btn btn-primary btn-sm" id="btn-seed-tp">${KURIKULUM_SOURCE === "firestore" ? "Seed ulang" : "Seed Firestore"}</button>`;
  const mapelOpts = KURIKULUM.map((m) => `<option value="${m.id}">${escapeHtml(m.nama)}</option>`).join("");
  if (!state.tpTabMapelId && KURIKULUM.length) state.tpTabMapelId = KURIKULUM[0].id;
  const mapel = KURIKULUM.find((m) => m.id === state.tpTabMapelId) || KURIKULUM[0];
  const tps = (mapel && mapel.tp) || [];
  let bc = { s1: { total: 0, ok: true }, s2: { total: 0, ok: true } };
  if (typeof cekBobotSemester === "function") bc = cekBobotSemester(tps);
  else if (typeof cekTotalBobot === "function") {
    bc.s1 = cekTotalBobot(tps.map((t) => ({ bobot: Number(t.bobot1) || 0 })));
    bc.s2 = cekTotalBobot(tps.map((t) => ({ bobot: Number(t.bobot2) || 0 })));
  }
  panel.innerHTML = `
    <p class="page-desc">Kurikulum 5A · <strong>${src}</strong> · Bobot 0 = tidak dipakai semester itu</p>
    <div class="filters">
      <div class="ff"><label>Mapel</label>
        <select id="sel-tp-mapel">${mapelOpts}</select></div>
      <div class="ff" style="justify-content:flex-end;gap:.35rem">
        <span class="bobot-pill ${bc.s1.ok ? "ok" : "warn"}">S1 ${bc.s1.total.toFixed(0)}%</span>
        <span class="bobot-pill ${bc.s2.ok ? "ok" : "warn"}">S2 ${bc.s2.total.toFixed(0)}%</span>
      </div>
    </div>
    <div class="table-scroll">
      <table class="sheet">
        <thead><tr>
          <th class="w-kode">Kode</th><th class="w-elemen">Elemen</th>
          <th class="col-tujuan">Tujuan Pembelajaran</th>
          <th class="w-bobot">Bobot S1</th><th class="w-bobot">Bobot S2</th><th class="w-act"></th>
        </tr></thead>
        <tbody>
          ${tps.map((tp) => `
            <tr data-tp-id="${tp.id}">
              <td class="w-kode cell-muted">${escapeHtml(tp.kode || "")}</td>
              <td class="w-elemen"><span class="elemen-text" title="${escapeHtml(tp.elemen || "")}">${escapeHtml(tp.elemen || "")}</span></td>
              <td class="col-tujuan"><textarea data-field="tujuan" rows="2">${escapeHtml(tp.tujuan || "")}</textarea></td>
              <td class="w-bobot"><input type="number" min="0" max="100" data-field="bobot1" value="${tp.bobot1 ?? 0}" title="Bobot semester 1 (0 = tidak dipakai)" class="${(tp.bobot1 ?? 0) == 0 ? "is-zero" : ""}" /></td>
              <td class="w-bobot"><input type="number" min="0" max="100" data-field="bobot2" value="${tp.bobot2 ?? 0}" title="Bobot semester 2 (0 = tidak dipakai)" class="${(tp.bobot2 ?? 0) == 0 ? "is-zero" : ""}" /></td>
              <td class="w-act"><button type="button" class="btn btn-primary btn-sm btn-save-tp">Simpan</button></td>
            </tr>`).join("")}
        </tbody>
      </table>
    </div>
    <p class="hint">Bobot 0% = tidak dipakai di semester tersebut. Total ideal S1/S2 ≈ 100%.</p>`;
  document.getElementById("sel-tp-mapel").value = state.tpTabMapelId || (mapel && mapel.id) || "";
  document.getElementById("sel-tp-mapel").onchange = (e) => { state.tpTabMapelId = e.target.value; renderTabTP(); };
  document.getElementById("btn-refresh-tp").onclick = async () => { await loadKurikulum(); renderTabTP(); showSuccess("Kurikulum dimuat ulang."); };
  document.getElementById("btn-seed-tp").onclick = () => handleSeedTP(KURIKULUM_SOURCE === "firestore");
  panel.querySelectorAll('.w-bobot input[type="number"]').forEach((inp) => {
    inp.addEventListener("input", () => {
      const v = Number(inp.value) || 0;
      inp.classList.toggle("is-zero", v === 0);
    });
  });
  panel.querySelectorAll(".btn-save-tp").forEach((btn) => {
    btn.onclick = async () => {
      const tr = btn.closest("tr");
      const tpId = tr.dataset.tpId;
      const bobot1 = Number(tr.querySelector('[data-field="bobot1"]').value) || 0;
      const bobot2 = Number(tr.querySelector('[data-field="bobot2"]').value) || 0;
      const tujuan = tr.querySelector('[data-field="tujuan"]').value.trim();
      if (bobot1 < 0 || bobot1 > 100 || bobot2 < 0 || bobot2 > 100) return showError("Bobot 0–100.");
      let semester = "kedua";
      if (bobot1 > 0 && bobot2 === 0) semester = "1";
      else if (bobot2 > 0 && bobot1 === 0) semester = "2";
      try {
        if (typeof updateTP === "function") await updateTP(tpId, { bobot1, bobot2, bobot: bobot1 || bobot2, semester, tujuan });
        const m = KURIKULUM.find((x) => x.id === state.tpTabMapelId);
        const tp = m && (m.tp || []).find((t) => t.id === tpId);
        if (tp) { tp.bobot1 = bobot1; tp.bobot2 = bobot2; tp.bobot = bobot1 || bobot2; tp.semester = semester; tp.tujuan = tujuan; }
        showSuccess("TP disimpan.");
        renderTabTP();
      } catch (e) { showError(e.message || "Gagal simpan TP."); }
    };
  });
}

function formatFsError(e) {
  if (!e) return "Error tidak diketahui";
  if (e.code === "permission-denied") return "Izin Firestore ditolak. Periksa rules.";
  return e.message || String(e);
}
function short(s, n) { s = String(s || ""); return s.length <= n ? s : s.slice(0, n - 1) + "…"; }
function escapeHtml(s) {
  return String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}
function showError(msg) {
  const el = document.getElementById("msg-area") || document.getElementById("topbar-actions");
  if (!el) { alert(msg); return; }
  const d = document.createElement("div"); d.className = "msg msg-err"; d.textContent = msg;
  el.prepend(d); setTimeout(() => d.remove(), 4000);
}
function showSuccess(msg) {
  const el = document.getElementById("msg-area") || document.getElementById("topbar-actions");
  if (!el) return;
  const d = document.createElement("div"); d.className = "msg msg-ok"; d.textContent = msg;
  el.prepend(d); setTimeout(() => d.remove(), 3000);
}

async function loadSiswa() {
  try {
    if (typeof fetchSiswa === "function") {
      const list = await fetchSiswa();
      if (list && list.length) {
        SISWA = list.map(mapSiswaRow);
        SISWA_SOURCE = "firestore";
        return;
      }
    }
  } catch (e) { console.warn("fetchSiswa", e); }
  try {
    const res = await fetch("data/siswa-5a.json");
    if (res.ok) {
      const data = await res.json();
      const arr = Array.isArray(data) ? data : data.siswa || [];
      SISWA = arr.map(mapSiswaRow);
      SISWA_SOURCE = "json";
      return;
    }
  } catch (e) { console.warn("json siswa", e); }
  SISWA = [];
  SISWA_SOURCE = "fallback";
}

async function loadKurikulum() {
  try {
    if (typeof fetchKurikulum === "function") {
      const list = await fetchKurikulum();
      if (list && list.length) {
        KURIKULUM = normalizeKurikulum(list);
        KURIKULUM_SOURCE = "firestore";
        return;
      }
    }
  } catch (e) { console.warn("fetchKurikulum", e); }
  try {
    const res = await fetch("data/kurikulum-5a.json");
    if (res.ok) {
      const data = await res.json();
      const arr = Array.isArray(data) ? data : data.mapel || [];
      KURIKULUM = normalizeKurikulum(arr);
      KURIKULUM_SOURCE = "json";
      return;
    }
  } catch (e) { console.warn("json kurikulum", e); }
  KURIKULUM = [];
  KURIKULUM_SOURCE = "none";
}

async function handleSeedSiswa(force) {
  if (typeof seedSiswa !== "function") return showError("seedSiswa tidak tersedia.");
  try {
    await seedSiswa(force);
    await loadSiswa();
    renderTabSiswa();
    showSuccess("Seed siswa selesai.");
  } catch (e) { showError(formatFsError(e)); }
}

async function handleSeedTP(force) {
  if (typeof seedKurikulum !== "function" && typeof seedTP !== "function") return showError("seed kurikulum tidak tersedia.");
  try {
    if (typeof seedKurikulum === "function") await seedKurikulum(force);
    else await seedTP(force);
    await loadKurikulum();
    renderTabTP();
    showSuccess("Seed kurikulum selesai.");
  } catch (e) { showError(formatFsError(e)); }
}

(async function init() {
  await Promise.all([loadSiswa(), loadKurikulum()]);
  fillMapelSelect();
  switchTab("input");
})();
