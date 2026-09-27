/**
 * penilaian-ui.js — sidebar + spreadsheet workspace
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
let KURIKULUM = [];
let KURIKULUM_SOURCE = "none";

const state = { mapelId: "", tpId: "", kompetensiId: "", tpTabMapelId: null };

const TITLES = {
  input: "Input Nilai",
  rekap: "Rekap",
  siswa: "Siswa",
  tp: "Kurikulum / TP",
};

/* —— Nav —— */
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

  const actions = document.getElementById("topbar-actions");
  actions.innerHTML = "";

  if (tab === "siswa") renderTabSiswa();
  if (tab === "tp") renderTabTP();
}

/* —— Input: cascade selects —— */
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
  let ada = false;
  let bad = null;
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

/* —— Siswa (sheet) —— */
function renderTabSiswa() {
  const panel = document.getElementById("tab-siswa");
  const src = SISWA_SOURCE === "firestore" ? "Firestore ✓" : SISWA_SOURCE === "json" ? "JSON" : "Lokal";

  document.getElementById("topbar-actions").innerHTML = `
    <button type="button" class="btn btn-secondary btn-sm" id="btn-refresh-siswa">Muat ulang</button>
    <button type="button" class="btn btn-primary btn-sm" id="btn-seed-siswa">
      ${SISWA_SOURCE === "firestore" ? "Seed ulang" : "Seed Firestore"}
    </button>`;

  panel.innerHTML = `
    <p class="page-desc" style="margin-bottom:.5rem">Kelas 5A · ${SISWA.length} siswa · sumber <strong>${src}</strong></p>
    <div class="table-scroll">
      <table class="sheet">
        <thead><tr><th class="w-abs">No</th><th>Nama</th><th class="w-nilai">NISN</th></tr></thead>
        <tbody>
          ${SISWA.map(
            (s) => `<tr>
              <td class="num">${s.nomorAbsen}</td>
              <td>${escapeHtml(s.nama)}</td>
              <td class="cell-muted">${escapeHtml(s.nisn)}</td>
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
}

/* —— Kurikulum TP (sheet editable) —— */
function renderTabTP() {
  const panel = document.getElementById("tab-tp");
  const src =
    KURIKULUM_SOURCE === "firestore" ? "Firestore ✓" : KURIKULUM_SOURCE === "json" ? "JSON" : "Kosong";

  if (!state.tpTabMapelId && KURIKULUM.length) state.tpTabMapelId = KURIKULUM[0].id;
  const mapel = KURIKULUM.find((m) => m.id === state.tpTabMapelId);

  document.getElementById("topbar-actions").innerHTML = `
    <button type="button" class="btn btn-secondary btn-sm" id="btn-refresh-tp">Muat ulang</button>
    <button type="button" class="btn btn-primary btn-sm" id="btn-seed-tp">
      ${KURIKULUM_SOURCE === "firestore" ? "Seed ulang" : "Seed kurikulum"}
    </button>`;

  const mapelOptions = KURIKULUM.map(
    (m) =>
      `<option value="${m.id}" ${state.tpTabMapelId === m.id ? "selected" : ""}>${escapeHtml(m.nama)}</option>`
  ).join("");

  let extra = "";
  let rows = `<tr><td colspan="6" class="cell-muted">Belum ada data. Seed kurikulum dulu.</td></tr>`;

  if (mapel) {
    const bc = cekTotalBobot(mapel.tp || []);
    extra = `<span class="bobot-pill ${bc.ok ? "ok" : "warn"}">${bc.ok ? "✓" : "⚠"} Bobot ${bc.total.toFixed(0)}%</span>`;

    if (mapel.kelompokBobot) {
      const kb = mapel.kelompokBobot;
      const kbc = cekTotalBobot(Object.values(kb).map((b) => ({ bobot: Number(b) })));
      extra += `
        <div class="cabang-row" style="margin-top:.5rem;width:100%">
          ${Object.entries(kb)
            .map(
              ([n, b]) => `
            <div class="ff"><label>${escapeHtml(n)}</label>
              <input type="number" min="0" max="100" class="kb-input" data-cabang="${escapeHtml(n)}" value="${b}" />
            </div>`
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
          <td><strong>${escapeHtml(tp.kode)}</strong>
            ${tp.cabang ? `<div class="cell-muted">${escapeHtml(tp.cabang)}</div>` : ""}
          </td>
          <td class="cell-muted">${escapeHtml(tp.elemen || "")}</td>
          <td class="w-bobot"><input type="number" min="0" max="100" data-field="bobot" value="${tp.bobot}" /></td>
          <td class="w-sem">
            <select data-field="semester">
              <option value="1" ${tp.semester === "1" ? "selected" : ""}>1</option>
              <option value="2" ${tp.semester === "2" ? "selected" : ""}>2</option>
              <option value="kedua" ${tp.semester === "kedua" ? "selected" : ""}>Kedua</option>
            </select>
          </td>
          <td><textarea data-field="tujuan" rows="2">${escapeHtml(tp.tujuan || "")}</textarea>
            <details style="margin-top:.25rem">
              <summary class="cell-muted" style="cursor:pointer">${nK} kompetensi</summary>
              <div style="margin-top:.35rem">
                ${(tp.kompetensi || [])
                  .map(
                    (k, i) => `
                  <div style="display:flex;gap:.35rem;margin-bottom:.25rem;align-items:center">
                    <span class="cell-muted">${i + 1}</span>
                    <input type="text" data-komp-id="${k.id}" value="${escapeHtml(k.deskripsi)}" style="flex:1;border:1px solid var(--border);border-radius:4px;padding:.25rem .35rem;font-size:.75rem" />
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
      <div class="ff">
        <label>Mapel</label>
        <select id="tp-mapel-select">${mapelOptions || "<option>—</option>"}</select>
      </div>
      <div style="display:flex;align-items:center;gap:.5rem;flex-wrap:wrap">${extra}</div>
      <span class="cell-muted" style="margin-left:auto;font-size:.72rem">Sumber: ${src}</span>
    </div>
    <div class="table-scroll">
      <table class="sheet">
        <thead>
          <tr>
            <th>Kode</th>
            <th>Elemen</th>
            <th class="w-bobot">Bobot%</th>
            <th class="w-sem">Semester</th>
            <th>Tujuan / Kompetensi</th>
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
      const bobot = Number(tr.querySelector('[data-field="bobot"]').value);
      const semester = tr.querySelector('[data-field="semester"]').value;
      const tujuan = tr.querySelector('[data-field="tujuan"]').value.trim();
      if (isNaN(bobot) || bobot < 0 || bobot > 100) return showError("Bobot 0–100.");
      try {
        if (KURIKULUM_SOURCE === "firestore") await updateTP(tpId, { bobot, semester, tujuan });
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

/* —— Load / seed —— */
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
    console.warn(e);
  }
  SISWA = [...SISWA_FALLBACK];
  SISWA_SOURCE = "fallback";
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
    const res = await fetch("data/kurikulum-5a.json");
    if (!res.ok) throw new Error("fail");
    const data = await res.json();
    KURIKULUM = data.mapel || [];
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
    let list;
    try {
      list = await loadSiswaFromJson();
    } catch {
      list = SISWA_FALLBACK.map(({ nomorAbsen, nisn, nama }) => ({ nomorAbsen, nisn, nama }));
    }
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
  if (msg.includes("permission") || e.code === "permission-denied") {
    return "Izin ditolak. Cek login & Rules Firestore.";
  }
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
