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

/* REST OF FILE CONTINUES IN NEXT - ABORT */
