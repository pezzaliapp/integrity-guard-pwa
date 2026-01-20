(() => {
  const $ = (id) => document.getElementById(id);

  const state = {
    expected: null,   // { files: { "app.js": "<sha256>", ... }, meta: {...} }
    fileList: null
  };

  function normalizeBase(url) {
    url = (url || "").trim();
    if (!url) return "";
    // se manca slash finale, aggiungilo
    if (!url.endsWith("/")) url += "/";
    return url;
  }

  function join(base, path) {
    base = normalizeBase(base);
    path = (path || "").replace(/^\//, "");
    return base + path;
  }

  async function sha256(text) {
    const enc = new TextEncoder().encode(text);
    const buf = await crypto.subtle.digest("SHA-256", enc);
    return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, "0")).join("");
  }

  function setSummary(html) {
    $("summary").innerHTML = html || "";
  }

  function clearTable() {
    $("rows").innerHTML = "";
  }

  function addRow({ file, expected, actual, status, note }) {
    const tr = document.createElement("tr");

    const tdFile = document.createElement("td");
    tdFile.textContent = file;

    const tdExp = document.createElement("td");
    tdExp.innerHTML = expected ? `<code>${expected}</code>` : `<span class="warn">—</span>`;

    const tdAct = document.createElement("td");
    tdAct.innerHTML = actual ? `<code>${actual}</code>` : `<span class="warn">—</span>`;

    const tdStatus = document.createElement("td");
    tdStatus.innerHTML =
      status === "ok" ? `<span class="ok">OK</span>${note ? ` <span class="small">(${note})</span>` : ""}` :
      status === "bad" ? `<span class="bad">MISMATCH</span>${note ? ` <span class="small">(${note})</span>` : ""}` :
      `<span class="warn">WARN</span>${note ? ` <span class="small">(${note})</span>` : ""}`;

    tr.appendChild(tdFile);
    tr.appendChild(tdExp);
    tr.appendChild(tdAct);
    tr.appendChild(tdStatus);
    $("rows").appendChild(tr);
  }

  async function fetchTextNoStore(url) {
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) throw new Error(`HTTP ${res.status} ${res.statusText}`);
    return await res.text();
  }

  async function loadIntegrityManifest(base) {
    const url = join(base, "integrity.json");
    const txt = await fetchTextNoStore(url);
    let json;
    try { json = JSON.parse(txt); } catch {
      throw new Error("integrity.json non è JSON valido");
    }
    if (!json || typeof json !== "object") throw new Error("integrity.json non valido");
    if (!json.files || typeof json.files !== "object") throw new Error("integrity.json: manca files{}");
    return json;
  }

  function manualFiles() {
    const raw = $("files").value || "";
    const list = raw.split("\n").map(s => s.trim()).filter(Boolean);
    return list.length ? list : null;
  }

  async function verify() {
    const base = normalizeBase($("base").value);
    if (!base) {
      setSummary(`<span class="bad">Inserisci un Base URL.</span>`);
      return;
    }

    clearTable();
    setSummary(`Verifica in corso…`);

    // 1) prova a caricare integrity.json (attesi)
    let expected = null;
    try {
      expected = await loadIntegrityManifest(base);
      state.expected = expected;
    } catch (e) {
      state.expected = null;
    }

    // 2) determina lista file
    let files = manualFiles();
    if (!files && state.expected) {
      files = Object.keys(state.expected.files);
    }
    if (!files || !files.length) {
      setSummary(`<span class="bad">Nessuna lista file disponibile.</span><br/><span class="small">Aggiungi integrity.json sul target oppure incolla la lista file manuale.</span>`);
      return;
    }

    // 3) verifica
    let ok = 0, bad = 0, warn = 0;

    for (const file of files) {
      const url = join(base, file);
      let actual = null;
      let exp = state.expected?.files?.[file] || null;

      try {
        const txt = await fetchTextNoStore(url);
        actual = await sha256(txt);
      } catch (e) {
        warn++;
        addRow({ file, expected: exp, actual: null, status: "warn", note: `Fetch/CORS: ${e.message}` });
        continue;
      }

      if (!exp) {
        warn++;
        addRow({ file, expected: null, actual, status: "warn", note: "Nessun hash atteso (integrity.json mancante o file non incluso)" });
        continue;
      }

      if (actual === exp) {
        ok++;
        addRow({ file, expected: exp, actual, status: "ok" });
      } else {
        bad++;
        addRow({ file, expected: exp, actual, status: "bad" });
      }
    }

    const meta = state.expected?.meta;
    const metaLine = meta ? `<div class="small">Target meta: <code>${escapeHtml(JSON.stringify(meta))}</code></div>` : "";

    setSummary(`
      <div><span class="pill">Base</span> <code>${escapeHtml(base)}</code></div>
      <div style="margin-top:6px">
        <span class="ok">OK:</span> ${ok} &nbsp; 
        <span class="bad">MISMATCH:</span> ${bad} &nbsp; 
        <span class="warn">WARN:</span> ${warn}
      </div>
      ${bad ? `<div class="bad" style="margin-top:6px">Attenzione: almeno un file non coincide con l’atteso.</div>` : ""}
      ${!state.expected ? `<div class="warn" style="margin-top:6px">Nota: integrity.json non disponibile (o bloccato da CORS). Mostro solo hash reali/avvisi.</div>` : ""}
      ${metaLine}
    `);
  }

  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, c => ({
      "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"
    }[c]));
  }

  async function load() {
    const base = normalizeBase($("base").value);
    if (!base) {
      setSummary(`<span class="bad">Inserisci un Base URL.</span>`);
      return;
    }
    setSummary("Carico integrity.json…");
    clearTable();
    try {
      const m = await loadIntegrityManifest(base);
      state.expected = m;
      const files = Object.keys(m.files);
      $("files").value = files.join("\n");
      setSummary(`<span class="ok">Manifest caricato.</span> <span class="small">File: ${files.length}. Ora premi “Verifica”.</span>`);
    } catch (e) {
      state.expected = null;
      setSummary(`<span class="warn">Impossibile caricare integrity.json.</span> <span class="small">${escapeHtml(e.message)} (possibile CORS). Puoi usare la lista file manuale.</span>`);
    }
  }

  function reset() {
    state.expected = null;
    $("files").value = "";
    clearTable();
    setSummary("");
  }

  window.addEventListener("DOMContentLoaded", () => {
    $("load").onclick = load;
    $("verify").onclick = verify;
    $("clear").onclick = reset;

    // Precompilo (comodità)
    $("base").value = "https://www.alessandropezzali.it/trusting-trust-pwa/";
  });
})();
