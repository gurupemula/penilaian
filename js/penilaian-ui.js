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
      let bobot1 = tp.bobot1,
        bobot2 = tp.bobot2;
      if (bobot1 == null && bobot2 == null) {
        if (sem === "1") {
          bobot1 = b;
          bobot2 = 0;
        } else if (sem === "2") {
          bobot1 = 0;
          bobot2 = b;
        } else {
          bobot1 = b;
          bobot2 = b;
        }
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
  document.getElementById("topbar-title").textContent = TITLES[tab] || tab;
  document.getElementById("sidebar")?.classList.remove("open");
  document.getElementById("topbar-actions").innerHTML = "";
  if (tab === "siswa") renderTabSiswa();
  if (tab === "tp") renderTabTP();
}

function fillMapelSelect() {
  const sel = document.getElementById("sel-mapel");
  sel.innerHTML =
    `<option value="">— pilih mapel —</option>` +
    KURIKULUM.map((m) => `<option value="${m.id}">${escapeHtml(m.nama)}</option>`).join("");
}

function fillTPSelect() {
  const sel = document.getElementById("sel-tp");
  const mapel = KURIKULUM.find((m) => m.id === state.mapelId);
  if (!mapel) {
    sel.innerHTML = `<option value="">—</option>`;
    sel.disabled = true;
    return;
  }
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
  const mapel = KURIKULUM.find((m) => m.id === state.mapelId);
  const tp = mapel && (mapel.tp || []).find((t) => t.id === state.tpId);
  if (!tp) {
    sel.innerHTML = `<option value="">—</option>`;
    sel.disabled = true;
    return;
  }
  sel.innerHTML =
    `<option value="">— pilih kompetensi —</option>` +
    (tp.kompetensi || [])
      .map((k, i) => `<option value="${k.id}">${i + 1}. ${escapeHtml(short(k.deskripsi, 70))}</option>`)
      .join("");
  sel.disabled = false;
}

function updateInputWorkspace() {
  const ready = state.mapelId && state.tpId && state.kompetensiId;
  document.getElementById("input-workspace").classList.toggle("hidden", !ready);
  document.getElementById("input-empty").classList.toggle("hidden", ready);
  if (ready) renderNilaiSheet();
}

function renderNilaiSheet() {
  document.getElementById("tanggal").value = new Date().toISOString().slice(0, 10);
  document.getElementById("catatan").value = "";
  document.getElementById("tbody-nilai").innerHTML = SISWA.map(
    (s) => `
    <tr>
      <td class="num">${s.nomorAbsen}</td>
      <td>${escapeHtml(s.nama)}</td>
      <td class="w-nilai"><input type="number" min="0" max="100" step="1" data-siswa="${s.id}" /></td>
    </tr>`
  ).join("");
}

document.getElementById("sel-mapel").addEventListener("change", (e) => {
  state.mapelId = e.target.value;
  state.tpId = "";
  state.kompetensiId = "";
  fillTPSelect();
  fillKompetensiSelect();
  updateInputWorkspace();
});
document.getElementById("sel-tp").addEventListener("change", (e) => {
  state.tpId = e.target.value;
  state.kompetensiId = "";
  fillKompetensiSelect();
  updateInputWorkspace();
});
document.getElementById("sel-kompetensi").addEventListener("change", (e) => {
  state.kompetensiId = e.target.value;
  updateInputWorkspace();
});

document.getElementById("btn-simpan").addEventListener("click", () => {
  const tanggal = document.getElementById("tanggal").value;
  const catatan = document.getElementById("catatan").value.trim();
  const inputs = document.querySelectorAll("#tbody-nilai input[data-siswa]");
  const nilaiMap = {};
  let ada = false,
    bad = null;
  inputs.forEach((inp) => {
    const v = inp.value.trim();
    if (v === "") return;
    const n = Number(v);
    if (isNaN(n) || n < 0 || n > 100) {
      bad = inp.closest("tr").querySelector(".num").textContent;
      return;
    }
    nilaiMap[inp.dataset.siswa] = n;
    ada = true;
  });
  if (bad) return showError(`Nilai 0–100 (baris ${bad})`);
  if (!ada) return showError("Isi minimal satu nilai.");
  if (!tanggal) return showError("Tanggal wajib.");
  const payload = {
    mapelId: state.mapelId,
    tpId: state.tpId,
    kompetensiId: state.kompetensiId,
    tanggal,
    catatan,
    nilai: nilaiMap,
    savedAt: new Date().toISOString(),
  };
  localStorage.setItem(
    `penilaian_mock_${payload.mapelId}_${payload.tpId}_${payload.kompetensiId}_${payload.tanggal}`,
    JSON.stringify(payload)
  );
  showSuccess("Nilai tersimpan (sementara di browser).");
});

/* —— Siswa editable —— */
function renderTabSiswa() {
  const panel = document.getElementById("tab-siswa");
  const src = SISWA_SOURCE === "firestore" ? "Firestore ✓" : SISWA_SOURCE === "json" ? "JSON" : "Lokal";
  document.getElementById("topbar-actions").innerHTML = `
    <button type="button" class="btn btn-secondary btn-sm" id="btn-refresh-siswa">Muat ulang</button>
    <button type="button" class="btn btn-primary btn-sm" id="btn-seed-siswa">${SISWA_SOURCE === "firestore" ? "Seed ulang" : "Seed Firestore"}</button>`;

  panel.innerHTML = `
    <p class="page-desc">5A · ${SISWA.length} siswa · <strong>${src}</strong> · edit sel lalu klik Simpan</p>
    <div class="table-scroll">
      <table class="sheet">
        <thead>
          <tr>
            <th class="w-abs">No</th>
            <th>Nama</th>
            <th class="w-nis">NISN</th>
            <th class="w-nis">NIS</th>
            <th class="w-jk">JK</th>
            <th class="w-ttl">Tempat, Tgl lahir</th>
            <th>Alamat</th>
            <th class="w-act"></th>
          </tr>
        </thead>
        <tbody>
          ${SISWA.map(
            (s) => `
            <tr data-nisn="${escapeHtml(s.nisn)}">
              <td class="w-abs"><input type="number" min="1" data-f="nomorAbsen" value="${s.nomorAbsen}" /></td>
              <td><input type="text" data-f="nama" value="${escapeHtml(s.nama)}" /></td>
              <td class="cell-muted">${escapeHtml(s.nisn)}</td>
              <td class="w-nis"><input type="text" data-f="nis" value="${escapeHtml(s.nis)}" /></td>
              <td class="w-jk">
                <select data-f="jenisKelamin">
                  <option value="L" ${s.jenisKelamin === "L" ? "selected" : ""}>L</option>
                  <option value="P" ${s.jenisKelamin === "P" ? "selected" : ""}>P</option>
                </select>
              </td>
              <td class="w-ttl">
                <input type="text" data-f="tempatLahir" value="${escapeHtml(s.tempatLahir)}" placeholder="Tempat" style="margin-bottom:2px" />
                <input type="date" data-f="tanggalLahir" value="${escapeHtml(s.tanggalLahir)}" />
              </td>
              <td><input type="text" data-f="alamat" value="${escapeHtml(s.alamat)}" /></td>
              <td class="w-act"><button type="button" class="btn btn-primary btn-sm btn-save-siswa">Simpan</button></td>
            </tr>`
          ).join("")}
        </tbody>
      </table>
    </div>`;

  document.getElementById("btn-refresh-siswa").onclick = async () => {
    await loadSiswa();
    renderTabSiswa();
    showSuccess("Siswa dimuat ulang.");
  };
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
        if (SISWA_SOURCE === "firestore") await updateSiswa(nisn, fields);
        const s = SISWA.find((x) => x.nisn === nisn);
        if (s) Object.assign(s, fields);
        showSuccess(`Siswa ${fields.nama} disimpan.`);
      } catch (e) {
        showError(e.message || "Gagal simpan siswa.");
      }
    };
  });
}

/* —— Kurikulum: bobot1 / bobot2 —— */
function renderTabTP() {
  const panel = document.getElementById("tab-tp");
  const src =
    KURIKULUM_SOURCE === "firestore" ? "Firestore ✓" : KURIKULUM_SOURCE === "json" ? "JSON" : "Kosong";
  if (!state.tpTabMapelId && KURIKULUM.length) state.tpTabMapelId = KURIKULUM[0].id;
  const mapel = KURIKULUM.find((m) => m.id === state.tpTabMapelId);

  document.getElementById("topbar-actions").innerHTML = `
    <button type="button" class="btn btn-secondary btn-sm" id="btn-refresh-tp">Muat ulang</button>
    <button type="button" class="btn btn-primary btn-sm" id="btn-seed-tp">${KURIKULUM_SOURCE === "firestore" ? "Seed ulang" : "Seed kurikulum"}</button>`;

  const mapelOptions = KURIKULUM.map(
    (m) =>
      `<option value="${m.id}" ${state.tpTabMapelId === m.id ? "selected" : ""}>${escapeHtml(m.nama)}</option>`
  ).join("");

  let extra = "";
  let rows = `<tr><td colspan="6" class="cell-muted">Belum ada data. Seed kurikulum dulu.</td></tr>`;

  if (mapel) {
    const bc = typeof cekBobotPerSemester === "function" ? cekBobotPerSemester(mapel.tp || []) : null;
    if (bc) {
      extra = `
        <span class="bobot-pill ${bc.s1.ok ? "ok" : "warn"}">S1 ${bc.s1.total.toFixed(0)}%</span>
        <span class="bobot-pill ${bc.s2.ok ? "ok" : "warn"}">S2 ${bc.s2.total.toFixed(0)}%</span>`;
    }
    if (mapel.kelompokBobot) {
      const kb = mapel.kelompokBobot;
      const kbc = cekTotalBobot(Object.values(kb).map((b) => ({ bobot: Number(b) })));
      extra += `
        <div class="cabang-row" style="width:100%;margin-top:.35rem">
          ${Object.entries(kb)
            .map(
              ([n, b]) =>
                `<div class="ff"><label>${escapeHtml(n)}</label><input type="number" min="0" max="100" class="kb-input" data-cabang="${escapeHtml(n)}" value="${b}" /></div>`
            )
            .join("")}
          <button type="button" class="btn btn-primary btn-sm" id="btn-save-kb">Simpan cabang</button>
          <span class="bobot-pill ${kbc.ok ? "ok" : "warn"}">${kbc.total}%</span>
        </div>`;
    }

    rows = (mapel.tp || [])
      .map((tp) => {
        const nK = (tp.kompetensi || []).length;
        return `<tr data-tp-id="${tp.id}">
          <td class="w-kode"><strong>${escapeHtml(tp.kode)}</strong>${tp.cabang ? `<div class="cell-muted">${escapeHtml(tp.cabang)}</div>` : ""}</td>
          <td class="w-elemen"><span class="elemen-text" title="${escapeHtml(tp.elemen || "")}">${escapeHtml(tp.elemen || "")}</span></td>
          <td class="w-bobot"><input type="number" min="0" max="100" data-field="bobot1" value="${tp.bobot1 ?? 0}" title="Bobot semester 1" /></td>
          <td class="w-bobot"><input type="number" min="0" max="100" data-field="bobot2" value="${tp.bobot2 ?? 0}" title="Bobot semester 2" /></td>
          <td class="col-tujuan">
            <textarea data-field="tujuan" rows="2">${escapeHtml(tp.tujuan || "")}</textarea>
            <details style="margin-top:.2rem">
              <summary class="cell-muted" style="cursor:pointer">${nK} kompetensi</summary>
              <div style="margin-top:.3rem">
                ${(tp.kompetensi || [])
                  .map(
                    (k, i) => `
                  <div style="display:flex;gap:.3rem;margin-bottom:.2rem;align-items:center">
                    <span class="cell-muted">${i + 1}</span>
                    <input type="text" data-komp-id="${k.id}" value="${escapeHtml(k.deskripsi)}" style="flex:1;border:1px solid var(--border);border-radius:4px;padding:.2rem .3rem;font-size:.75rem" />
                    <button type="button" class="btn btn-secondary btn-sm btn-save-komp" data-komp-id="${k.id}">OK</button>
                  </div>`
                  )
                  .join("")}
              </div>
            </details>
          </td>
          <td class="w-act"><button type="button" class="btn btn-primary btn-sm btn-save-tp" data-tp-id="${tp.id}">Simpan</button></td>
        </tr>`;
      })
      .join("");
  }

  panel.innerHTML = `
    <div class="filter-bar">
      <div class="ff"><label>Mapel</label><select id="tp-mapel-select">${mapelOptions || "<option>—</option>"}</select></div>
      <div style="display:flex;align-items:center;gap:.4rem;flex-wrap:wrap">${extra}</div>
      <span class="cell-muted" style="margin-left:auto;font-size:.7rem">${src}</span>
    </div>
    <div class="table-scroll">
      <table class="sheet">
        <thead>
          <tr>
            <th class="w-kode">Kode</th>
            <th class="w-elemen">Elemen</th>
            <th class="w-bobot">Bobot S1</th>
            <th class="w-bobot">Bobot S2</th>
            <th class="col-tujuan">Tujuan / Kompetensi</th>
            <th class="w-act"></th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
    </div>`;

  document.getElementById("btn-refresh-tp").onclick = async () => {
    await loadKurikulum();
    renderTabTP();
    fillMapelSelect();
    showSuccess("Kurikulum dimuat ulang.");
  };
  document.getElementById("btn-seed-tp").onclick = () => handleSeedKurikulum(KURIKULUM_SOURCE === "firestore");
  document.getElementById("tp-mapel-select").onchange = (e) => {
    state.tpTabMapelId = e.target.value;
    renderTabTP();
  };

  panel.querySelectorAll(".btn-save-tp").forEach((btn) => {
    btn.onclick = async () => {
      const tr = btn.closest("tr");
      const tpId = btn.dataset.tpId;
      const bobot1 = Number(tr.querySelector('[data-field="bobot1"]').value) || 0;
      const bobot2 = Number(tr.querySelector('[data-field="bobot2"]').value) || 0;
      const tujuan = tr.querySelector('[data-field="tujuan"]').value.trim();
      if (bobot1 < 0 || bobot1 > 100 || bobot2 < 0 || bobot2 > 100) return showError("Bobot 0–100.");
      let semester = "kedua";
      if (bobot1 > 0 && bobot2 === 0) semester = "1";
      else if (bobot2 > 0 && bobot1 === 0) semester = "2";
      try {
        if (KURIKULUM_SOURCE === "firestore") {
          await updateTP(tpId, { bobot1, bobot2, bobot: bobot1 || bobot2, semester, tujuan });
        }
        const m = KURIKULUM.find((x) => x.id === state.tpTabMapelId);
        const tp = m && m.tp.find((t) => t.id === tpId);
        if (tp) {
          tp.bobot1 = bobot1;
          tp.bobot2 = bobot2;
          tp.semester = semester;
          tp.tujuan = tujuan;
        }
        showSuccess(`TP ${tp ? tp.kode : tpId} disimpan.`);
        renderTabTP();
      } catch (e) {
        showError(e.message || "Gagal simpan.");
      }
    };
  });

  panel.querySelectorAll(".btn-save-komp").forEach((btn) => {
    btn.onclick = async () => {
      const id = btn.dataset.kompId;
      const input = panel.querySelector(`input[data-komp-id="${id}"]`);
      const deskripsi = input.value.trim();
      if (!deskripsi) return showError("Deskripsi kosong.");
      try {
        if (KURIKULUM_SOURCE === "firestore") await updateKompetensi(id, { deskripsi });
        for (const m of KURIKULUM) {
          for (const tp of m.tp || []) {
            const k = (tp.kompetensi || []).find((x) => x.id === id);
            if (k) k.deskripsi = deskripsi;
          }
        }
        showSuccess("Kompetensi disimpan.");
      } catch (e) {
        showError(e.message || "Gagal.");
      }
    };
  });

  const btnKb = document.getElementById("btn-save-kb");
  if (btnKb) {
    btnKb.onclick = async () => {
      const kelompokBobot = {};
      panel.querySelectorAll(".kb-input").forEach((inp) => {
        kelompokBobot[inp.dataset.cabang] = Number(inp.value) || 0;
      });
      try {
        if (KURIKULUM_SOURCE === "firestore") await updateMapel(state.tpTabMapelId, { kelompokBobot });
        const m = KURIKULUM.find((x) => x.id === state.tpTabMapelId);
        if (m) m.kelompokBobot = kelompokBobot;
        showSuccess("Bobot cabang disimpan.");
        renderTabTP();
      } catch (e) {
        showError(e.message || "Gagal.");
      }
    };
  }
}

async function loadSiswaFromJson() {
  const res = await fetch("data/siswa-5a.json");
  if (!res.ok) throw new Error("fetch json failed");
  const data = await res.json();
  return (data.siswa || []).map(mapSiswaRow);
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
    console.warn(e);
  }
  SISWA = [];
  SISWA_SOURCE = "fallback";
}

async function loadKurikulum() {
  try {
    const n = await countMapel();
    if (n > 0) {
      KURIKULUM = normalizeKurikulum(await fetchKurikulumLengkap());
      KURIKULUM_SOURCE = "firestore";
      return;
    }
  } catch (e) {
    console.warn("Firestore kurikulum:", e.message || e);
  }
  try {
    const res = await fetch("data/kurikulum-5a.json");
    if (!res.ok) throw new Error("fail");
    const data = await res.json();
    KURIKULUM = normalizeKurikulum(data.mapel || []);
    KURIKULUM_SOURCE = "json";
    return;
  } catch (e) {
    console.warn(e);
  }
  KURIKULUM = [];
  KURIKULUM_SOURCE = "none";
}

async function handleSeedSiswa(force) {
  const loading = document.getElementById("loading");
  loading.classList.add("show");
  try {
    const list = await loadSiswaFromJson();
    const r = await seedSiswaToFirestore(list, { force: !!force, kelas: "5A" });
    await loadSiswa();
    renderTabSiswa();
    showSuccess(`Seed siswa: ${r.written} ditulis, ${r.skipped} dilewati.`);
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
    if (!res.ok) throw new Error("Gagal muat kurikulum-5a.json");
    const data = await res.json();
    const r = await seedKurikulum(data, { force: !!force });
    await loadKurikulum();
    fillMapelSelect();
    renderTabTP();
    showSuccess(`Seed: ${r.mapel} mapel, ${r.tp} TP, ${r.kompetensi} komp.`);
  } catch (e) {
    showError(formatFsError(e));
  } finally {
    loading.classList.remove("show");
  }
}

function formatFsError(e) {
  const msg = e.message || String(e);
  if (msg.includes("permission") || e.code === "permission-denied") return "Izin ditolak. Cek login & Rules.";
  return msg;
}
function short(s, n) {
  s = s || "";
  return s.length > n ? s.slice(0, n - 1) + "…" : s;
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
  setTimeout(() => el.classList.remove("show"), 4500);
}
function showSuccess(msg) {
  const el = document.getElementById("success-msg");
  el.textContent = msg;
  el.classList.add("show");
  document.getElementById("error-msg").classList.remove("show");
  setTimeout(() => el.classList.remove("show"), 3500);
}

(async function init() {
  await Promise.all([loadSiswa(), loadKurikulum()]);
  fillMapelSelect();
  switchTab("input");
})();
