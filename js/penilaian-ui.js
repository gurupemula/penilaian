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
const state = { mapelId: "", tpId: "", kompetensiId: "", tpTabMapelId: null, rekapMapelId: "", rekapSemester: "kedua", expandedTpId: "", inputSemester: "1" };
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

function labelSemesterTP(tp) {
  const b1 = Number(tp.bobot1 != null ? tp.bobot1 : 0) || 0;
  const b2 = Number(tp.bobot2 != null ? tp.bobot2 : 0) || 0;
  if (b1 > 0 && b2 > 0) return "S1+S2";
  if (b1 > 0) return "S1";
  if (b2 > 0) return "S2";
  return "—";
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
  if (!mapel) {
    sel.innerHTML = `<option value="">—</option>`;
    sel.disabled = true;
    updateSemesterHint(0, 0);
    return;
  }

  const sem = state.inputSemester || "1";
  let allTp = mapel.tp || [];
  if (typeof filterTPBySemester === "function") {
    allTp = filterTPBySemester(allTp, sem);
  } else {
    allTp = allTp.filter((tp) => {
      const b1 = Number(tp.bobot1) || 0;
      const b2 = Number(tp.bobot2) || 0;
      if (sem === "1") return b1 > 0;
      if (sem === "2") return b2 > 0;
      return b1 > 0 || b2 > 0;
    });
  }

  const totalMapel = (mapel.tp || []).length;
  updateSemesterHint(allTp.length, totalMapel);

  const groups = {};
  allTp.forEach((tp) => {
    const e = tp.elemen || "Lainnya";
    if (!groups[e]) groups[e] = [];
    groups[e].push(tp);
  });

  let html = `<option value="">— pilih TP (${allTp.length}) —</option>`;
  for (const [elemen, list] of Object.entries(groups)) {
    html += `<optgroup label="${escapeHtml(elemen)}">`;
    list.forEach((tp) => {
      const tag = labelSemesterTP(tp);
      const bobot =
        sem === "1"
          ? Number(tp.bobot1) || 0
          : sem === "2"
            ? Number(tp.bobot2) || 0
            : Number(tp.bobot1 || tp.bobot2) || 0;
      html += `<option value="${tp.id}">${escapeHtml(tp.kode)} [${tag}] ${bobot}% — ${escapeHtml(short(tp.tujuan, 40))}</option>`;
    });
    html += `</optgroup>`;
  }
  if (!allTp.length) {
    html = `<option value="">— tidak ada TP untuk filter semester ini —</option>`;
  }
  sel.innerHTML = html;
  sel.disabled = allTp.length === 0;

  if (state.tpId && !allTp.some((t) => t.id === state.tpId)) {
    state.tpId = "";
    state.kompetensiId = "";
    fillKompetensiSelect();
    updateInputWorkspace();
  } else if (state.tpId) {
    sel.value = state.tpId;
  }
}

function updateSemesterHint(shown, total) {
  const el = document.getElementById("semester-hint");
  if (!el) return;
  const sem = state.inputSemester || "1";
  const label = sem === "1" ? "Semester 1" : sem === "2" ? "Semester 2" : "Semua semester";
  if (!state.mapelId) {
    el.textContent = "Pilih mapel. TP akan difilter menurut bobot S1/S2 di tab Kurikulum.";
    return;
  }
  el.innerHTML =
    `<strong>${label}</strong>: menampilkan <strong>${shown}</strong> dari ${total} TP ` +
    `(hanya yang bobot ${sem === "kedua" ? "S1 atau S2" : sem === "1" ? "S1" : "S2"} > 0 di Kurikulum).`;
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
  let sumberTanggal = null;
  let adaDokumenHariIni = false;

  if (typeof getPenilaian === "function" && state.mapelId && state.tpId && state.kompetensiId && tanggal) {
    try {
      const doc = await getPenilaian(state.mapelId, state.tpId, state.kompetensiId, tanggal);
      if (doc) {
        nilaiMap = doc.nilai || {};
        catatanLama = doc.catatan || "";
        adaDokumenHariIni = true;
        sumberTanggal = tanggal;
      } else if (typeof getLatestPenilaian === "function") {
        const latest = await getLatestPenilaian(state.mapelId, state.tpId, state.kompetensiId);
        if (latest && latest.nilai && Object.keys(latest.nilai).length) {
          nilaiMap = latest.nilai;
          catatanLama = latest.catatan || "";
          sumberTanggal = latest.tanggal || null;
        }
      }
    } catch (e) {
      console.warn("getPenilaian/getLatest", e);
    }
  }
  if (cat) cat.value = catatanLama;

  tbody.innerHTML = SISWA.map((s) => {
    const v =
      nilaiMap[s.id] != null
        ? nilaiMap[s.id]
        : nilaiMap[s.nisn] != null
          ? nilaiMap[s.nisn]
          : "";
    const hasVal = v !== "" && v != null;
    return `<tr data-siswa="${s.id}">
      <td class="num">${s.nomorAbsen}</td>
      <td>${escapeHtml(s.nama)}</td>
      <td class="w-nilai">
        <div class="nilai-cell">
          <input type="number" min="0" max="100" step="1" data-siswa="${s.id}" value="${hasVal ? v : ""}" />
          <button type="button" class="btn-clear-nilai" title="Hapus nilai siswa ini" data-siswa="${s.id}" ${hasVal ? "" : "disabled"}>×</button>
        </div>
      </td>
    </tr>`;
  }).join("");

  // Event delegation (1 listener) — hindari N addEventListener per render
  if (!tbody._nilaiDelegated) {
    tbody._nilaiDelegated = true;
    tbody.addEventListener("click", (e) => {
      const btn = e.target.closest(".btn-clear-nilai");
      if (btn && !btn.disabled) handleClearNilaiSiswa(btn.dataset.siswa);
    });
    tbody.addEventListener("input", (e) => {
      const inp = e.target;
      if (!inp.matches || !inp.matches("input[data-siswa]")) return;
      const b = inp.closest(".nilai-cell")?.querySelector(".btn-clear-nilai");
      if (b) b.disabled = inp.value.trim() === "";
    });
  }

  const info = document.getElementById("nilai-session-info");
  if (info) {
    const n = Object.keys(nilaiMap).length;
    if (adaDokumenHariIni) {
      info.innerHTML = `<strong>${n}</strong> nilai tersimpan untuk tanggal <strong>${escapeHtml(tanggal)}</strong>.`;
    } else if (sumberTanggal && n) {
      info.innerHTML =
        `Menampilkan <strong>${n}</strong> nilai terakhir (tanggal <strong>${escapeHtml(String(sumberTanggal))}</strong>). ` +
        `Belum ada data untuk <strong>${escapeHtml(tanggal)}</strong> — klik <strong>Simpan nilai</strong> untuk menyalin ke tanggal ini.`;
    } else {
      info.textContent = "Belum ada nilai tersimpan untuk kompetensi ini.";
    }
  }
}

async function handleClearNilaiSiswa(siswaId) {
  if (!siswaId) return;
  const tanggal = document.getElementById("tanggal")?.value;
  if (!tanggal) return showError("Tanggal wajib.");
  if (!state.mapelId || !state.tpId || !state.kompetensiId) {
    return showError("Pilih mapel, TP, dan kompetensi.");
  }
  const s = SISWA.find((x) => String(x.id) === String(siswaId) || String(x.nisn) === String(siswaId));
  const nama = s ? s.nama : siswaId;
  if (!confirm(`Hapus nilai ${nama} untuk tanggal ${tanggal}?`)) return;

  const inp = document.querySelector(`#tbody-nilai input[data-siswa="${siswaId}"]`);
  if (inp) inp.value = "";
  const btn = document.querySelector(`#tbody-nilai .btn-clear-nilai[data-siswa="${siswaId}"]`);
  if (btn) btn.disabled = true;

  try {
    if (typeof hapusNilaiSiswa === "function") {
      const r = await hapusNilaiSiswa(state.mapelId, state.tpId, state.kompetensiId, tanggal, siswaId);
      if (typeof invalidateRekapCache === "function") invalidateRekapCache(state.mapelId);
      if (r && r.deleted) {
        showSuccess(`Nilai ${nama} dihapus.`);
      } else {
        showSuccess(`Nilai ${nama} dikosongkan (belum ada di tanggal ini).`);
      }
    } else {
      showSuccess(`Nilai ${nama} dikosongkan di form.`);
    }
  } catch (e) {
    showError(formatFsError(e));
    await renderNilaiSheet();
  }
}

document.getElementById("sel-semester")?.addEventListener("change", (e) => {
  state.inputSemester = e.target.value || "1";
  state.tpId = "";
  state.kompetensiId = "";
  fillTPSelect();
  fillKompetensiSelect();
  updateInputWorkspace();
});
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
    if (typeof invalidateRekapCache === "function") invalidateRekapCache(state.mapelId);
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
    .replace(/&/g, "\u0026amp;")
    .replace(/</g, "\u0026lt;")
    .replace(/>/g, "\u0026gt;")
    .replace(/"/g, "\u0026quot;");
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

async function handleSeedTP(mode) {
  if (typeof seedTP !== "function" && typeof seedKurikulum !== "function") {
    return showError("seed kurikulum tidak tersedia.");
  }
  if (mode === true) {
    const ok = confirm(
      "SEED ULANG akan MENIMPA semua bobot/tujuan di Firestore dengan default JSON.\n\nLanjutkan?"
    );
    if (!ok) return;
  } else if (mode === "deskripsi") {
    const ok = confirm(
      "Update deskripsi: memperbarui tujuan TP & deskripsi kompetensi dari JSON.\n\n" +
      "Bobot S1/S2 yang sudah Anda atur TIDAK diubah.\n" +
      "TP/kompetensi baru (mis. Matematika) akan ditambahkan.\n\nLanjutkan?"
    );
    if (!ok) return;
  }
  try {
    let r;
    if (typeof seedTP === "function") {
      r = await seedTP(mode);
    } else {
      return showError("seedTP tidak tersedia.");
    }
    await loadKurikulum();
    renderTabTP();
    const written = r
      ? `mapel ${r.mapel || 0}, tp ${r.tp || 0}, komp ${r.kompetensi || 0}, lewati ${r.skipped || 0}`
      : "";
    if (mode === "deskripsi") {
      showSuccess(`Deskripsi diperbarui; bobot tetap. (${written})`);
    } else if (mode === true) {
      showSuccess(`Seed ulang selesai (${written}).`);
    } else {
      showSuccess(`Seed selesai (${written}).`);
    }
  } catch (e) {
    showError(formatFsError(e));
  }
}

(async function init() {
  if (typeof requireAuth === "function") requireAuth();
  if (typeof showUserEmail === "function") showUserEmail();
  await Promise.all([loadSiswa(), loadKurikulum()]);
  fillMapelSelect();
  const semSel = document.getElementById("sel-semester");
  if (semSel) semSel.value = state.inputSemester || "1";
  switchTab("input");
})();
