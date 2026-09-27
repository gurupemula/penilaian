/** penilaian-ui.js — sidebar + sheet + simpan nilai Firestore */

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
const state = { mapelId: "", tpId: "", kompetensiId: "", tpTabMapelId: null, rekapMapelId: "", rekapSemester: "kedua", expandedTpId: "" };
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
  if (tab === "rekap" && typeof renderTabRekap === "function") renderTabRekap();
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

async function renderNilaiSheet() {
  const tgl = document.getElementById("tanggal");
  const cat = document.getElementById("catatan");
  const tbody = document.getElementById("tbody-nilai");
  if (!tbody) return;
  if (tgl && !tgl.value) tgl.value = new Date().toISOString().slice(0, 10);
  const tanggal = tgl ? tgl.value : new Date().toISOString().slice(0, 10);
  let nilaiMap = {};
  let catatanLama = "";
  if (typeof getPenilaian === "function" && state.mapelId && state.tpId && state.kompetensiId && tanggal) {
    try {
      const doc = await getPenilaian(state.mapelId, state.tpId, state.kompetensiId, tanggal);
      if (doc) { nilaiMap = doc.nilai || {}; catatanLama = doc.catatan || ""; }
    } catch (e) { console.warn("getPenilaian", e); }
  }
  if (cat) cat.value = catatanLama;
  tbody.innerHTML = SISWA.map((s) => {
    const v = nilaiMap[s.id] != null ? nilaiMap[s.id] : nilaiMap[s.nisn] != null ? nilaiMap[s.nisn] : "";
    return `<tr><td class="num">${s.nomorAbsen}</td><td>${escapeHtml(s.nama)}</td><td class="w-nilai"><input type="number" min="0" max="100" step="1" data-siswa="${s.id}" value="${v === "" ? "" : v}" /></td></tr>`;
  }).join("");
  const info = document.getElementById("nilai-session-info");
  if (info) {
    const n = Object.keys(nilaiMap).length;
    info.textContent = n ? `${n} nilai sudah tersimpan di Firestore untuk tanggal ini.` : "Belum ada nilai tersimpan untuk tanggal ini.";
  }
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
document.getElementById("tanggal")?.addEventListener("change", () => {
  if (state.mapelId && state.tpId && state.kompetensiId) renderNilaiSheet();
});

document.getElementById("btn-simpan")?.addEventListener("click", async () => {
  const tanggal = document.getElementById("tanggal")?.value;
  const catatan = (document.getElementById("catatan")?.value || "").trim();
  const inputs = document.querySelectorAll("#tbody-nilai input[data-siswa]");
  const nilaiMap = {};
  let ada = false, bad = null;
  inputs.forEach((inp) => {
    const v = inp.value.trim();
    if (v === "") return;
    const n = Number(v);
    if (isNaN(n) || n < 0 || n > 100) { bad = inp.closest("tr").querySelector(".num").textContent; return; }
    nilaiMap[inp.dataset.siswa] = n; ada = true;
  });
  if (bad) return showError(`Nilai 0–100 (baris ${bad})`);
  if (!ada) return showError("Isi minimal satu nilai.");
  if (!tanggal) return showError("Tanggal wajib.");
  if (!state.mapelId || !state.tpId || !state.kompetensiId) return showError("Pilih mapel, TP, dan kompetensi.");
  const btn = document.getElementById("btn-simpan");
  if (btn) { btn.disabled = true; btn.textContent = "Menyimpan…"; }
  try {
    if (typeof savePenilaian !== "function") throw new Error("Modul nilai-db belum dimuat.");
    const result = await savePenilaian({ mapelId: state.mapelId, tpId: state.tpId, kompetensiId: state.kompetensiId, tanggal, catatan, nilai: nilaiMap, merge: true });
    showSuccess(result.isNew ? `Nilai tersimpan di Firestore (${result.written} siswa).` : `Nilai diperbarui di Firestore (${result.written} diisi, total ${result.count} siswa).`);
    await renderNilaiSheet();
  } catch (e) { showError(formatFsError(e)); }
  finally { if (btn) { btn.disabled = false; btn.textContent = "Simpan nilai"; } }
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
    <div class="table-scroll"><table class="sheet">
      <thead><tr><th class="w-abs">No</th><th>Nama</th><th class="w-nis">NISN</th><th class="w-nis">NIS</th><th class="w-jk">JK</th><th class="w-ttl">Tempat, Tgl lahir</th><th>Alamat</th><th class="w-act"></th></tr></thead>
      <tbody>${SISWA.map((s) => `
        <tr data-nisn="${escapeHtml(s.nisn)}">
          <td class="w-abs"><input type="number" min="1" data-f="nomorAbsen" value="${s.nomorAbsen}" /></td>
          <td><input type="text" data-f="nama" value="${escapeHtml(s.nama)}" /></td>
          <td class="cell-muted">${escapeHtml(s.nisn)}</td>
          <td class="w-nis"><input type="text" data-f="nis" value="${escapeHtml(s.nis)}" /></td>
          <td class="w-jk"><select data-f="jenisKelamin"><option value="L" ${s.jenisKelamin === "L" ? "selected" : ""}>L</option><option value="P" ${s.jenisKelamin === "P" ? "selected" : ""}>P</option></select></td>
          <td class="w-ttl"><input type="text" data-f="tempatLahir" value="${escapeHtml(s.tempatLahir)}" placeholder="Tempat" style="margin-bottom:2px" /><input type="date" data-f="tanggalLahir" value="${escapeHtml(s.tanggalLahir)}" /></td>
          <td><input type="text" data-f="alamat" value="${escapeHtml(s.alamat)}" /></td>
          <td class="w-act"><button type="button" class="btn btn-primary btn-sm btn-save-siswa">Simpan</button></td>
        </tr>`).join("")}</tbody></table></div>`;
  document.getElementById("btn-refresh-siswa").onclick = async () => { await loadSiswa(); renderTabSiswa(); showSuccess("Siswa dimuat ulang."); };
  document.getElementById("btn-seed-siswa").onclick = () => handleSeedSiswa(SISWA_SOURCE === "firestore");
  panel.querySelectorAll(".btn-save-siswa").forEach((btn) => {
    btn.onclick = async () => {
      const tr = btn.closest("tr"); const nisn = tr.dataset.nisn;
      const fields = { nomorAbsen: Number(tr.querySelector('[data-f="nomorAbsen"]').value) || 0, nama: tr.querySelector('[data-f="nama"]').value.trim(), nis: tr.querySelector('[data-f="nis"]').value.trim(), jenisKelamin: tr.querySelector('[data-f="jenisKelamin"]').value, tempatLahir: tr.querySelector('[data-f="tempatLahir"]').value.trim(), tanggalLahir: tr.querySelector('[data-f="tanggalLahir"]').value, alamat: tr.querySelector('[data-f="alamat"]').value.trim() };
      if (!fields.nama) return showError("Nama wajib.");
      try {
        if (SISWA_SOURCE === "firestore" && typeof updateSiswa === "function") await updateSiswa(nisn, fields);
        const s = SISWA.find((x) => x.nisn === nisn); if (s) Object.assign(s, fields);
        showSuccess(`Siswa ${fields.nama} disimpan.`);
      } catch (e) { showError(e.message || "Gagal simpan siswa."); }
    };
  });
}

function renderTabTP() {
  const panel = document.getElementById("tab-tp");
  if (!panel) return;
  const src = KURIKULUM_SOURCE === "firestore" ? "Firestore ✓" : KURIKULUM_SOURCE === "json" ? "JSON (belum di Firestore)" : "Kosong";
  document.getElementById("topbar-actions").innerHTML = `
    <button type="button" class="btn btn-secondary btn-sm" id="btn-refresh-tp" title="Ambil ulang data dari Firestore">Muat ulang</button>
    <button type="button" class="btn btn-primary btn-sm" id="btn-seed-tp" title="Isi dokumen yang belum ada">Seed (isi kosong)</button>
    <button type="button" class="btn btn-secondary btn-sm" id="btn-seed-force-tp" title="Menimpa semua dengan default JSON">Seed ulang (timpa)</button>`;

  const mapelOpts = KURIKULUM.map((m) => `<option value="${m.id}">${escapeHtml(m.nama)}</option>`).join("");
  if (!state.tpTabMapelId && KURIKULUM.length) state.tpTabMapelId = KURIKULUM[0].id;
  const mapel = KURIKULUM.find((m) => m.id === state.tpTabMapelId) || KURIKULUM[0];
  const tps = (mapel && mapel.tp) || [];
  let bc = { s1: { total: 0, ok: true }, s2: { total: 0, ok: true } };
  if (typeof cekBobotSemester === "function") bc = cekBobotSemester(tps);
  else if (typeof cekBobotPerSemester === "function") bc = cekBobotPerSemester(tps);
  else if (typeof cekTotalBobot === "function") {
    bc.s1 = cekTotalBobot(tps.map((t) => ({ bobot: Number(t.bobot1) || 0 })));
    bc.s2 = cekTotalBobot(tps.map((t) => ({ bobot: Number(t.bobot2) || 0 })));
  }

  const expandedId = state.expandedTpId || "";

  panel.innerHTML = `
    <p class="page-desc">Kurikulum 5A · sumber: <strong>${src}</strong> · Simpan = permanen · Seed isi kosong tidak menimpa edit</p>
    <div class="filters">
      <div class="ff"><label>Mapel</label><select id="sel-tp-mapel">${mapelOpts}</select></div>
      <div class="ff" style="justify-content:flex-end;gap:.35rem;flex-direction:row;align-items:center;min-width:auto">
        <span class="bobot-pill bobot-pill-s1 ${bc.s1.ok ? "ok" : "warn"}">S1 ${bc.s1.total.toFixed(0)}%</span>
        <span class="bobot-pill bobot-pill-s2 ${bc.s2.ok ? "ok" : "warn"}">S2 ${bc.s2.total.toFixed(0)}%</span>
        <button type="button" class="btn btn-primary btn-sm" id="btn-show-add-tp">+ Tambah TP</button>
      </div>
    </div>

    <div id="form-add-tp" class="toolbar-row hidden">
      <div class="ff" style="min-width:90px"><label>Kode</label><input type="text" id="new-tp-kode" placeholder="auto" /></div>
      <div class="ff" style="min-width:120px"><label>Elemen</label><input type="text" id="new-tp-elemen" placeholder="mis. Menyimak" /></div>
      <div class="ff ff-grow"><label>Tujuan Pembelajaran</label><input type="text" id="new-tp-tujuan" placeholder="Deskripsi tujuan…" /></div>
      <div class="ff" style="min-width:80px"><label>Bobot S1</label><input type="number" id="new-tp-b1" min="0" max="100" value="0" /></div>
      <div class="ff" style="min-width:80px"><label>Bobot S2</label><input type="number" id="new-tp-b2" min="0" max="100" value="0" /></div>
      <div class="ff" style="min-width:auto;justify-content:flex-end">
        <label>&nbsp;</label>
        <button type="button" class="btn btn-primary btn-sm" id="btn-create-tp">Simpan TP baru</button>
      </div>
    </div>

    <div class="table-scroll"><table class="sheet">
      <thead><tr>
        <th class="w-kode">Kode</th><th class="w-elemen">Elemen</th>
        <th class="col-tujuan">Tujuan Pembelajaran</th>
        <th class="w-bobot">Bobot S1</th><th class="w-bobot">Bobot S2</th>
        <th class="w-act">Aksi</th>
      </tr></thead>
      <tbody>
        ${tps.map((tp) => {
          const nKomp = (tp.kompetensi || []).length;
          const open = expandedId === tp.id;
          return `
          <tr data-tp-id="${tp.id}">
            <td class="w-kode cell-muted">${escapeHtml(tp.kode || "")}</td>
            <td class="w-elemen"><input type="text" data-field="elemen" value="${escapeHtml(tp.elemen || "")}" /></td>
            <td class="col-tujuan"><textarea data-field="tujuan" rows="2">${escapeHtml(tp.tujuan || "")}</textarea></td>
            <td class="w-bobot"><input type="number" min="0" max="100" data-field="bobot1" value="${tp.bobot1 ?? 0}" class="${(tp.bobot1 ?? 0) == 0 ? "is-zero" : ""}" /></td>
            <td class="w-bobot"><input type="number" min="0" max="100" data-field="bobot2" value="${tp.bobot2 ?? 0}" class="${(tp.bobot2 ?? 0) == 0 ? "is-zero" : ""}" /></td>
            <td class="w-act" style="white-space:nowrap">
              <button type="button" class="btn btn-primary btn-sm btn-save-tp">Simpan</button>
              <button type="button" class="btn btn-secondary btn-sm btn-toggle-komp" data-tp="${tp.id}">Komp (${nKomp})</button>
            </td>
          </tr>
          <tr class="komp-panel ${open ? "" : "hidden"}" data-komp-for="${tp.id}">
            <td colspan="6" style="background:#f8fafc;padding:.75rem 1rem">
              <div style="font-size:.8rem;font-weight:600;margin-bottom:.5rem;color:#64748b">Kompetensi — ${escapeHtml(tp.kode || tp.id)}</div>
              <div class="table-scroll" style="max-height:none;box-shadow:none;border-radius:8px">
                <table class="sheet" style="table-layout:auto">
                  <thead><tr><th style="width:40px">No</th><th>Deskripsi kompetensi</th><th class="w-act"></th></tr></thead>
                  <tbody>
                    ${(tp.kompetensi || []).map((k, i) => `
                      <tr data-komp-id="${k.id}">
                        <td class="num">${k.urutan || i + 1}</td>
                        <td><input type="text" data-field="deskripsi" value="${escapeHtml(k.deskripsi || "")}" /></td>
                        <td class="w-act">
                          <button type="button" class="btn btn-primary btn-sm btn-save-komp">Simpan</button>
                          <button type="button" class="btn btn-ghost btn-sm btn-del-komp" title="Hapus">✕</button>
                        </td>
                      </tr>`).join("") || `<tr><td colspan="3" class="cell-muted" style="text-align:center">Belum ada kompetensi</td></tr>`}
                  </tbody>
                </table>
              </div>
              <div class="toolbar-row" style="margin:.65rem 0 0;padding:.5rem;box-shadow:none">
                <div class="ff ff-grow"><label>Kompetensi baru</label>
                  <input type="text" class="new-komp-desc" data-tp="${tp.id}" placeholder="Deskripsi kompetensi…" /></div>
                <div class="ff" style="min-width:auto;justify-content:flex-end">
                  <label>&nbsp;</label>
                  <button type="button" class="btn btn-primary btn-sm btn-add-komp" data-tp="${tp.id}">+ Tambah kompetensi</button>
                </div>
              </div>
            </td>
          </tr>`;
        }).join("")}
      </tbody>
    </table></div>
    <p class="hint">Klik <strong>Komp (n)</strong> untuk kelola kompetensi. Bobot 0% = tidak dipakai di semester itu.</p>`;

  document.getElementById("sel-tp-mapel").value = state.tpTabMapelId || (mapel && mapel.id) || "";
  document.getElementById("sel-tp-mapel").onchange = (e) => {
    state.tpTabMapelId = e.target.value;
    state.expandedTpId = "";
    renderTabTP();
  };
  document.getElementById("btn-refresh-tp").onclick = async () => {
    await loadKurikulum();
    renderTabTP();
    showSuccess(KURIKULUM_SOURCE === "firestore" ? "Dimuat dari Firestore." : "Dimuat dari JSON (Firestore kosong).");
  };
  document.getElementById("btn-seed-tp").onclick = () => handleSeedTP(false);
  document.getElementById("btn-seed-force-tp").onclick = () => handleSeedTP(true);

  document.getElementById("btn-show-add-tp").onclick = () => {
    document.getElementById("form-add-tp").classList.toggle("hidden");
  };
  document.getElementById("btn-create-tp").onclick = () => handleCreateTP();

  function refreshBobotPills() {
    let s1 = 0, s2 = 0;
    panel.querySelectorAll('[data-field="bobot1"]').forEach((el) => { s1 += Number(el.value) || 0; });
    panel.querySelectorAll('[data-field="bobot2"]').forEach((el) => { s2 += Number(el.value) || 0; });
    const pill1 = panel.querySelector(".bobot-pill-s1");
    const pill2 = panel.querySelector(".bobot-pill-s2");
    if (pill1) {
      pill1.textContent = "S1 " + s1.toFixed(0) + "%";
      pill1.className = "bobot-pill bobot-pill-s1 " + (Math.abs(s1 - 100) < 0.01 ? "ok" : "warn");
    }
    if (pill2) {
      pill2.textContent = "S2 " + s2.toFixed(0) + "%";
      pill2.className = "bobot-pill bobot-pill-s2 " + (Math.abs(s2 - 100) < 0.01 ? "ok" : "warn");
    }
  }
  panel.querySelectorAll('.w-bobot input[type="number"]').forEach((inp) => {
    inp.addEventListener("input", () => {
      inp.classList.toggle("is-zero", (Number(inp.value) || 0) === 0);
      refreshBobotPills();
    });
  });

  panel.querySelectorAll(".btn-toggle-komp").forEach((btn) => {
    btn.onclick = () => {
      const id = btn.dataset.tp;
      state.expandedTpId = state.expandedTpId === id ? "" : id;
      renderTabTP();
    };
  });

  panel.querySelectorAll(".btn-save-tp").forEach((btn) => {
    btn.onclick = async () => {
      const tr = btn.closest("tr");
      const tpId = tr.dataset.tpId;
      const bobot1 = Number(tr.querySelector('[data-field="bobot1"]').value) || 0;
      const bobot2 = Number(tr.querySelector('[data-field="bobot2"]').value) || 0;
      const tujuan = tr.querySelector('[data-field="tujuan"]').value.trim();
      const elemen = (tr.querySelector('[data-field="elemen"]')?.value || "").trim();
      if (bobot1 < 0 || bobot1 > 100 || bobot2 < 0 || bobot2 > 100) return showError("Bobot 0–100.");
      let semester = "kedua";
      if (bobot1 > 0 && bobot2 === 0) semester = "1";
      else if (bobot2 > 0 && bobot1 === 0) semester = "2";
      try {
        const m = KURIKULUM.find((x) => x.id === state.tpTabMapelId);
        const tp = m && (m.tp || []).find((t) => t.id === tpId);
        const payload = {
          mapelId: (m && m.id) || state.tpTabMapelId || "",
          mapelNama: m && m.nama,
          mapelKode: m && m.kode,
          mapelUrutan: m && m.urutan,
          bobot1, bobot2, bobot: bobot1 || bobot2, semester, tujuan, elemen,
        };
        if (tp) {
          if (tp.kode) payload.kode = tp.kode;
          if (tp.urutan != null) payload.urutan = tp.urutan;
          if (tp.cabang) payload.cabang = tp.cabang;
        }
        if (typeof updateTP === "function") await updateTP(tpId, payload);
        if (tp) {
          tp.bobot1 = bobot1; tp.bobot2 = bobot2; tp.bobot = bobot1 || bobot2;
          tp.semester = semester; tp.tujuan = tujuan; tp.elemen = elemen;
        }
        KURIKULUM_SOURCE = "firestore";
        showSuccess("TP disimpan permanen di Firestore.");
        refreshBobotPills();
      } catch (e) {
        showError(e.message || "Gagal simpan TP.");
      }
    };
  });

  panel.querySelectorAll(".btn-add-komp").forEach((btn) => {
    btn.onclick = () => handleCreateKompetensi(btn.dataset.tp);
  });
  panel.querySelectorAll(".new-komp-desc").forEach((inp) => {
    inp.addEventListener("keydown", (e) => {
      if (e.key === "Enter") handleCreateKompetensi(inp.dataset.tp);
    });
  });

  panel.querySelectorAll(".btn-save-komp").forEach((btn) => {
    btn.onclick = async () => {
      const tr = btn.closest("tr");
      const kid = tr.dataset.kompId;
      const deskripsi = tr.querySelector('[data-field="deskripsi"]').value.trim();
      if (!deskripsi) return showError("Deskripsi wajib.");
      try {
        if (typeof updateKompetensi === "function") await updateKompetensi(kid, { deskripsi });
        const m = KURIKULUM.find((x) => x.id === state.tpTabMapelId);
        (m?.tp || []).forEach((tp) => {
          const k = (tp.kompetensi || []).find((x) => x.id === kid);
          if (k) k.deskripsi = deskripsi;
        });
        showSuccess("Kompetensi disimpan.");
      } catch (e) {
        showError(e.message || "Gagal simpan kompetensi.");
      }
    };
  });

  panel.querySelectorAll(".btn-del-komp").forEach((btn) => {
    btn.onclick = async () => {
      const tr = btn.closest("tr");
      const kid = tr.dataset.kompId;
      if (!confirm("Hapus kompetensi ini?")) return;
      try {
        if (typeof deleteKompetensi === "function") await deleteKompetensi(kid);
        const m = KURIKULUM.find((x) => x.id === state.tpTabMapelId);
        (m?.tp || []).forEach((tp) => {
          if (tp.kompetensi) tp.kompetensi = tp.kompetensi.filter((k) => k.id !== kid);
        });
        showSuccess("Kompetensi dihapus.");
        renderTabTP();
      } catch (e) {
        showError(e.message || "Gagal hapus kompetensi.");
      }
    };
  });
}

async function handleCreateTP() {
  const mapel = KURIKULUM.find((m) => m.id === state.tpTabMapelId);
  if (!mapel) return showError("Pilih mapel dulu.");
  if (typeof createTP !== "function") return showError("createTP tidak tersedia. Perbarui js/tp-db.js.");

  const kode = (document.getElementById("new-tp-kode")?.value || "").trim();
  const elemen = (document.getElementById("new-tp-elemen")?.value || "").trim();
  const tujuan = (document.getElementById("new-tp-tujuan")?.value || "").trim();
  const bobot1 = Number(document.getElementById("new-tp-b1")?.value) || 0;
  const bobot2 = Number(document.getElementById("new-tp-b2")?.value) || 0;
  if (!tujuan) return showError("Tujuan pembelajaran wajib diisi.");

  try {
    const created = await createTP(
      mapel.id,
      {
        kode: kode || undefined,
        elemen,
        tujuan,
        bobot1,
        bobot2,
        mapelNama: mapel.nama,
        mapelKode: mapel.kode,
        mapelUrutan: mapel.urutan,
      },
      mapel.tp || []
    );
    if (!mapel.tp) mapel.tp = [];
    mapel.tp.push({
      id: created.id,
      kode: created.kode,
      elemen,
      tujuan,
      bobot1,
      bobot2,
      bobot: bobot1 || bobot2,
      semester: bobot1 > 0 && bobot2 === 0 ? "1" : bobot2 > 0 && bobot1 === 0 ? "2" : "kedua",
      kompetensi: [],
    });
    KURIKULUM_SOURCE = "firestore";
    showSuccess(`TP ${created.kode} ditambahkan.`);
    state.expandedTpId = created.id;
    renderTabTP();
  } catch (e) {
    showError(e.message || "Gagal tambah TP.");
  }
}

async function handleCreateKompetensi(tpId) {
  if (!tpId) return;
  if (typeof createKompetensi !== "function") return showError("createKompetensi tidak tersedia. Perbarui js/tp-db.js.");
  const inp = document.querySelector(`.new-komp-desc[data-tp="${tpId}"]`);
  const deskripsi = (inp?.value || "").trim();
  if (!deskripsi) return showError("Isi deskripsi kompetensi dulu.");

  const mapel = KURIKULUM.find((m) => m.id === state.tpTabMapelId);
  const tp = mapel && (mapel.tp || []).find((t) => t.id === tpId);
  try {
    const created = await createKompetensi(
      tpId,
      mapel?.id || state.tpTabMapelId,
      { deskripsi },
      tp?.kompetensi || []
    );
    if (tp) {
      if (!tp.kompetensi) tp.kompetensi = [];
      tp.kompetensi.push({ id: created.id, deskripsi, urutan: created.urutan });
    }
    KURIKULUM_SOURCE = "firestore";
    showSuccess("Kompetensi ditambahkan.");
    state.expandedTpId = tpId;
    renderTabTP();
  } catch (e) {
    showError(e.message || "Gagal tambah kompetensi.");
  }
}

function cekBobotSemester(tpList) {
  if (typeof cekBobotPerSemester === "function") return cekBobotPerSemester(tpList);
  return { s1: { total: 0, ok: true }, s2: { total: 0, ok: true } };
}
function formatFsError(e) {
  if (!e) return "Error tidak diketahui";
  if (e.code === "permission-denied") return "Izin Firestore ditolak. Periksa rules.";
  return e.message || String(e);
}
function short(s, n) { s = String(s || ""); return s.length <= n ? s : s.slice(0, n - 1) + "…"; }
function escapeHtml(s) {
  return String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
function showError(msg) {
  const el = document.getElementById("error-msg") || document.getElementById("topbar-actions");
  if (!el) { alert(msg); return; }
  if (el.id === "error-msg") { el.textContent = msg; el.className = "flash flash-err"; setTimeout(() => { el.textContent = ""; }, 5000); return; }
  const d = document.createElement("div"); d.className = "msg msg-err"; d.textContent = msg; el.prepend(d); setTimeout(() => d.remove(), 4000);
}
function showSuccess(msg) {
  const el = document.getElementById("success-msg") || document.getElementById("topbar-actions");
  if (!el) return;
  if (el.id === "success-msg") { el.textContent = msg; el.className = "flash flash-ok"; setTimeout(() => { el.textContent = ""; }, 4000); return; }
  const d = document.createElement("div"); d.className = "msg msg-ok"; d.textContent = msg; el.prepend(d); setTimeout(() => d.remove(), 3000);
}

async function loadSiswa() {
  try {
    if (typeof fetchSiswa === "function") {
      const list = await fetchSiswa();
      if (list && list.length) { SISWA = list.map(mapSiswaRow); SISWA_SOURCE = "firestore"; return; }
    }
  } catch (e) { console.warn("fetchSiswa", e); }
  try {
    const res = await fetch("data/siswa-5a.json");
    if (res.ok) {
      const data = await res.json();
      const arr = Array.isArray(data) ? data : data.siswa || [];
      SISWA = arr.map(mapSiswaRow); SISWA_SOURCE = "json"; return;
    }
  } catch (e) { console.warn("json siswa", e); }
  SISWA = []; SISWA_SOURCE = "fallback";
}

async function loadKurikulum() {
  try {
    if (typeof fetchKurikulum === "function") {
      const list = await fetchKurikulum();
      if (list && list.length) { KURIKULUM = normalizeKurikulum(list); KURIKULUM_SOURCE = "firestore"; return; }
    }
  } catch (e) { console.warn("fetchKurikulum", e); }
  try {
    const res = await fetch("data/kurikulum-5a.json");
    if (res.ok) {
      const data = await res.json();
      const arr = Array.isArray(data) ? data : data.mapel || [];
      KURIKULUM = normalizeKurikulum(arr); KURIKULUM_SOURCE = "json"; return;
    }
  } catch (e) { console.warn("json kurikulum", e); }
  KURIKULUM = []; KURIKULUM_SOURCE = "none";
}

async function handleSeedSiswa(force) {
  if (typeof seedSiswa !== "function") return showError("seedSiswa tidak tersedia.");
  try {
    const r = await seedSiswa(force);
    await loadSiswa(); renderTabSiswa();
    showSuccess(`Seed siswa selesai (tulis ${r && r.written != null ? r.written : "?"}, lewati ${r && r.skipped != null ? r.skipped : 0}).`);
  } catch (e) { showError(formatFsError(e)); }
}

async function handleSeedTP(force) {
  if (typeof seedTP !== "function" && typeof seedKurikulum !== "function") {
    return showError("seed kurikulum tidak tersedia.");
  }
  if (force) {
    const ok = confirm(
      "SEED ULANG akan MENIMPA semua bobot/tujuan yang sudah Anda ubah di Firestore\n" +
      "dengan nilai DEFAULT dari file JSON.\n\n" +
      "Perubahan yang sudah disimpan akan hilang.\n\nLanjutkan?"
    );
    if (!ok) return;
  }
  try {
    const r = typeof seedTP === "function" ? await seedTP(force) : await seedKurikulum(force);
    await loadKurikulum();
    renderTabTP();
    const written = r ? `mapel ${r.mapel || 0}, tp ${r.tp || 0}, lewati ${r.skipped || 0}` : "";
    showSuccess(
      force
        ? `Seed ulang selesai (${written}). Data diganti dengan default JSON.`
        : `Seed selesai (${written}). Dokumen yang sudah ada tidak diubah.`
    );
  } catch (e) {
    showError(formatFsError(e));
  }
}

(async function init() {
  await Promise.all([loadSiswa(), loadKurikulum()]);
  fillMapelSelect();
  switchTab("input");
})();
