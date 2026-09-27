/** penilaian-rekap.js — tab Rekap per-siswa */

async function renderTabRekap() {
  const panel = document.getElementById("tab-rekap");
  if (!panel) return;

  if (typeof state.rekapMapelId === "undefined") state.rekapMapelId = "";
  if (typeof state.rekapSemester === "undefined") state.rekapSemester = "kedua";

  document.getElementById("topbar-actions").innerHTML =
    `<button type="button" class="btn btn-secondary btn-sm" id="btn-refresh-rekap">Muat ulang</button>`;

  if (!state.rekapMapelId && KURIKULUM.length) state.rekapMapelId = KURIKULUM[0].id;

  const mapelOpts = KURIKULUM.map(
    (m) =>
      `<option value="${m.id}" ${m.id === state.rekapMapelId ? "selected" : ""}>${escapeHtml(m.nama)}</option>`
  ).join("");

  panel.innerHTML = `
    <p class="page-desc">Rekap per siswa · rata-rata kompetensi → TP → mapel (bobot semester)</p>
    <div class="filters">
      <div class="ff">
        <label>Mapel</label>
        <select id="sel-rekap-mapel">${mapelOpts || '<option value="">— tidak ada mapel —</option>'}</select>
      </div>
      <div class="ff">
        <label>Semester</label>
        <select id="sel-rekap-sem">
          <option value="1" ${state.rekapSemester === "1" ? "selected" : ""}>Semester 1</option>
          <option value="2" ${state.rekapSemester === "2" ? "selected" : ""}>Semester 2</option>
          <option value="kedua" ${state.rekapSemester === "kedua" ? "selected" : ""}>Setahun</option>
        </select>
      </div>
    </div>
    <div id="rekap-body"><p class="hint">Memuat…</p></div>`;

  document.getElementById("sel-rekap-mapel").onchange = (e) => {
    state.rekapMapelId = e.target.value;
    renderTabRekap();
  };
  document.getElementById("sel-rekap-sem").onchange = (e) => {
    state.rekapSemester = e.target.value;
    renderTabRekap();
  };
  document.getElementById("btn-refresh-rekap").onclick = () => renderTabRekap();

  await fillRekapBody();
}

async function fillRekapBody() {
  const body = document.getElementById("rekap-body");
  if (!body) return;

  const mapel = KURIKULUM.find((m) => m.id === state.rekapMapelId);
  if (!mapel) {
    body.innerHTML = `<div class="empty-hint">Pilih mapel atau seed kurikulum dulu.</div>`;
    return;
  }
  if (!SISWA.length) {
    body.innerHTML = `<div class="empty-hint">Data siswa kosong. Seed siswa dulu.</div>`;
    return;
  }

  let docs = [];
  try {
    if (typeof listPenilaianByMapel === "function") {
      docs = await listPenilaianByMapel(mapel.id);
    }
  } catch (e) {
    body.innerHTML = `<div class="empty-hint">Gagal memuat penilaian: ${escapeHtml(formatFsError(e))}</div>`;
    return;
  }

  if (typeof buildRekapMapel !== "function") {
    body.innerHTML = `<div class="empty-hint">Modul perhitungan belum dimuat.</div>`;
    return;
  }

  const rekap = buildRekapMapel(SISWA, mapel, docs, state.rekapSemester);
  const { columns, rows } = rekap;

  if (!columns.length) {
    body.innerHTML = `<div class="empty-hint">Tidak ada TP untuk filter semester ini.</div>`;
    return;
  }

  const headTP = columns
    .map(
      (c) =>
        `<th class="w-nilai" title="${escapeHtml(c.elemen)} · bobot ${c.bobot}%">${escapeHtml(c.kode)}</th>`
    )
    .join("");

  const bodyRows = rows
    .map((r) => {
      const tds = columns
        .map((c) => {
          const n = r.nilaiTP[c.id];
          const txt = typeof formatNilai === "function" ? formatNilai(n) : n == null ? "—" : n;
          return `<td class="num">${txt}</td>`;
        })
        .join("");
      const nm =
        typeof formatNilai === "function" ? formatNilai(r.nilaiMapel) : r.nilaiMapel == null ? "—" : r.nilaiMapel;
      const predClass =
        r.predikat === "A"
          ? "pred-a"
          : r.predikat === "B"
            ? "pred-b"
            : r.predikat === "C"
              ? "pred-c"
              : r.predikat === "D"
                ? "pred-d"
                : "";
      return `<tr>
        <td class="num">${r.nomorAbsen}</td>
        <td class="rekap-nama">${escapeHtml(r.nama)}</td>
        ${tds}
        <td class="num"><strong>${nm}</strong></td>
        <td class="num ${predClass}"><strong>${escapeHtml(r.predikat)}</strong></td>
      </tr>`;
    })
    .join("");

  body.innerHTML = `
    <p class="hint" style="margin:0 0 .75rem">
      ${escapeHtml(mapel.nama)} ·
      ${state.rekapSemester === "1" ? "Semester 1" : state.rekapSemester === "2" ? "Semester 2" : "Setahun"} ·
      ${docs.length} sesi penilaian di Firestore
      ${docs.length ? "" : " · belum ada nilai tersimpan"}
    </p>
    <div class="table-scroll rekap-scroll">
      <table class="sheet rekap-sheet">
        <thead>
          <tr>
            <th class="w-abs">No</th>
            <th class="rekap-nama">Nama</th>
            ${headTP}
            <th class="w-nilai">Mapel</th>
            <th class="w-jk">Pred</th>
          </tr>
        </thead>
        <tbody>${bodyRows}</tbody>
      </table>
    </div>
    <p class="hint">Nilai TP = rata-rata kompetensi yang sudah dinilai. Nilai mapel = rata-rata tertimbang bobot TP (hanya TP yang ada nilainya).</p>`;
}
