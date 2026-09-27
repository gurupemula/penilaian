/** penilaian-tp-tab.js — tab Kurikulum: TP + Kompetensi */

function renderTabTP() {
  const panel = document.getElementById("tab-tp");
  if (!panel) return;
  const src = KURIKULUM_SOURCE === "firestore" ? "Firestore ✓" : KURIKULUM_SOURCE === "json" ? "JSON (belum di Firestore)" : "Kosong";
  document.getElementById("topbar-actions").innerHTML = `
    <button type="button" class="btn btn-secondary btn-sm" id="btn-refresh-tp">Muat ulang</button>
    <button type="button" class="btn btn-primary btn-sm" id="btn-seed-tp">Seed (isi kosong)</button>
    <button type="button" class="btn btn-secondary btn-sm" id="btn-seed-force-tp">Seed ulang (timpa)</button>`;

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
    <p class="page-desc">Kurikulum 5A · sumber: <strong>${src}</strong> · Klik <strong>▸ Kompetensi</strong> di kolom Aksi untuk edit/tambah</p>
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
            <td class="w-act">
              <div class="btn-stack">
                <button type="button" class="btn btn-primary btn-sm btn-save-tp">Simpan TP</button>
                <button type="button" class="btn btn-sm btn-toggle-komp ${open ? "is-open" : ""}" data-tp="${tp.id}">
                  ${open ? "▾ Tutup" : "▸"} Kompetensi (${nKomp})
                </button>
              </div>
            </td>
          </tr>
          <tr class="komp-panel ${open ? "" : "hidden"}" data-komp-for="${tp.id}">
            <td colspan="6">
              <div class="komp-title">Kompetensi — ${escapeHtml(tp.kode || tp.id)} · edit / tambah / hapus di sini</div>
              <div class="table-scroll" style="max-height:none;box-shadow:none;border-radius:8px;border:1px solid var(--border)">
                <table class="sheet" style="table-layout:auto">
                  <thead><tr><th style="width:44px">No</th><th>Deskripsi kompetensi</th><th style="width:140px">Aksi</th></tr></thead>
                  <tbody>
                    ${(tp.kompetensi || []).length
                      ? (tp.kompetensi || []).map((k, i) => `
                      <tr data-komp-id="${k.id}">
                        <td class="num">${k.urutan || i + 1}</td>
                        <td><input type="text" data-field="deskripsi" value="${escapeHtml(k.deskripsi || "")}" placeholder="Deskripsi…" /></td>
                        <td style="white-space:nowrap">
                          <button type="button" class="btn btn-primary btn-sm btn-save-komp">Simpan</button>
                          <button type="button" class="btn btn-ghost btn-sm btn-del-komp" title="Hapus">✕ Hapus</button>
                        </td>
                      </tr>`).join("")
                      : `<tr><td colspan="3" class="komp-empty">Belum ada kompetensi. Isi form di bawah lalu klik + Tambah.</td></tr>`}
                  </tbody>
                </table>
              </div>
              <div class="toolbar-row" style="margin:.7rem 0 0;padding:.55rem .65rem;box-shadow:none;background:#fff;border:1px dashed #93c5fd;border-radius:8px">
                <div class="ff ff-grow"><label>Kompetensi baru</label>
                  <input type="text" class="new-komp-desc" data-tp="${tp.id}" placeholder="Tulis deskripsi kompetensi…" /></div>
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
    <p class="hint">Klik <strong>▸ Kompetensi (n)</strong> di kolom Aksi untuk membuka panel edit/tambah/hapus kompetensi tiap TP. Bobot 0 di S1 atau S2 = TP tidak muncul di filter Input Nilai semester tersebut.</p>`;

  document.getElementById("sel-tp-mapel").value = state.tpTabMapelId || (mapel && mapel.id) || "";
  document.getElementById("sel-tp-mapel").onchange = (e) => {
    state.tpTabMapelId = e.target.value;
    state.expandedTpId = "";
    renderTabTP();
  };
  document.getElementById("btn-refresh-tp").onclick = async () => {
    await loadKurikulum();
    renderTabTP();
    showSuccess(KURIKULUM_SOURCE === "firestore" ? "Dimuat dari Firestore." : "Dimuat dari JSON.");
  };
  document.getElementById("btn-seed-tp").onclick = () => handleSeedTP(false);
  document.getElementById("btn-seed-force-tp").onclick = () => handleSeedTP(true);
  document.getElementById("btn-show-add-tp").onclick = () => document.getElementById("form-add-tp").classList.toggle("hidden");
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
      state.expandedTpId = state.expandedTpId === btn.dataset.tp ? "" : btn.dataset.tp;
      renderTabTP();
      requestAnimationFrame(() => {
        const panelRow = document.querySelector(`.komp-panel[data-komp-for="${state.expandedTpId}"]`);
        if (panelRow && !panelRow.classList.contains("hidden")) {
          panelRow.scrollIntoView({ behavior: "smooth", block: "nearest" });
        }
      });
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
        showSuccess("TP disimpan. Filter Input Nilai akan mengikuti bobot S1/S2 ini.");
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
  if (typeof createTP !== "function") return showError("createTP tidak tersedia.");
  const kode = (document.getElementById("new-tp-kode")?.value || "").trim();
  const elemen = (document.getElementById("new-tp-elemen")?.value || "").trim();
  const tujuan = (document.getElementById("new-tp-tujuan")?.value || "").trim();
  const bobot1 = Number(document.getElementById("new-tp-b1")?.value) || 0;
  const bobot2 = Number(document.getElementById("new-tp-b2")?.value) || 0;
  if (!tujuan) return showError("Tujuan pembelajaran wajib diisi.");
  try {
    const created = await createTP(mapel.id, {
      kode: kode || undefined, elemen, tujuan, bobot1, bobot2,
      mapelNama: mapel.nama, mapelKode: mapel.kode, mapelUrutan: mapel.urutan,
    }, mapel.tp || []);
    if (!mapel.tp) mapel.tp = [];
    mapel.tp.push({
      id: created.id, kode: created.kode, elemen, tujuan, bobot1, bobot2,
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
  if (typeof createKompetensi !== "function") return showError("createKompetensi tidak tersedia.");
  const inp = document.querySelector(`.new-komp-desc[data-tp="${tpId}"]`);
  const deskripsi = (inp?.value || "").trim();
  if (!deskripsi) return showError("Isi deskripsi kompetensi dulu.");
  const mapel = KURIKULUM.find((m) => m.id === state.tpTabMapelId);
  const tp = mapel && (mapel.tp || []).find((t) => t.id === tpId);
  try {
    const created = await createKompetensi(tpId, mapel?.id || state.tpTabMapelId, { deskripsi }, tp?.kompetensi || []);
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
