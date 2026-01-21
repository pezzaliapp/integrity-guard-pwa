(() => {
  const $ = (id) => document.getElementById(id);

  const state = { expected: null, fileList: null };

  function normalizeBase(url) {
    url = (url || "").trim();
    if (!url) return "";
    if (!url.endsWith("/")) url += "/";
    return url;
  }
  function join(base, path) {
    base = normalizeBase(base);
    path = (path || "").replace(/^\//, "");
    return base + path;
  }

  async function fetchTextNoStore(url) {
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) throw new Error(`HTTP ${res.status} ${res.statusText}`);
    return await res.text();
  }

  async function fetchBytesNoStore(url) {
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) throw new Error(`HTTP ${res.status} ${res.statusText}`);
    return new Uint8Array(await res.arrayBuffer());
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

  function manualFiles() {
    const raw = $("files").value || "";
    const list = raw.split("\n").map(s => s.trim()).filter(Boolean);
    return list.length ? list : null;
  }

  async function importPublicKeyFromPem(pemText) {
    const b64 = pemText
      .replace(/-----BEGIN PUBLIC KEY-----/g, "")
      .replace(/-----END PUBLIC KEY-----/g, "")
      .replace(/\s+/g, "");
    const bin = atob(b64);
    const bytes = new Uint8Array([...bin].map(c => c.charCodeAt(0)));
    return await crypto.subtle.importKey(
      "spki",
      bytes,
      { name: "Ed25519" },
      true,
      ["verify"]
    );
  }

  function b64ToBytes(b64) {
    const bin = atob((b64 || "").trim());
    return new Uint8Array([...bin].map(c => c.charCodeAt(0)));
  }

  async function verifySignatureEd25519(integrityJsonBytes, sigB64, publicKeyPemText) {
    const pubKey = await importPublicKeyFromPem(publicKeyPemText);
    const sigBytes = b64ToBytes(sigB64);
    return await crypto.subtle.verify(
      { name: "Ed25519" },
      pubKey,
      sigBytes,
      integrityJsonBytes
    );
  }

  async function loadSignedManifest(base) {
    // carichiamo manifest + firma + public key
    const [integrityJsonText, sigText, pubPem] = await Promise.all([
      fetchTextNoStore(join(base, "integrity.json")),
      fetchTextNoStore(join(base, "integrity.sig")),
      fetchTextNoStore("public-key.pem")
    ]);

    const integrityJsonBytes = new TextEncoder().encode(integrityJsonText);
    const ok = await verifySignatureEd25519(integrityJsonBytes, sigText, pubPem);

    if (!ok) throw new Error("Firma NON valida (integrity.sig)");

    let json;
    try { json = JSON.parse(integrityJsonText); } catch {
      throw new Error("integrity.json non è JSON valido");
    }
    if (!json?.files || typeof json.files !== "object") throw new Error("integrity.json: manca files{}");

    json.__signatureVerified = true;
    return json;
  }

  async function verify() {
    const base = normalizeBase($("base").value);
    if (!base) { setSummary(`<span class="bad">Inserisci un Base URL.</span>`); return; }

    clearTable();
    setSummary(`Verifica in corso…`);

    let expected = null;
    try {
      expected = await loadSignedManifest(base);
      state.expected = expected;
    } catch (e) {
      state.expected = null;
      setSummary(`
        <span class="bad">Manifest non verificabile.</span>
        <div class="small">${escapeHtml(e.message)}</div>
        <div class="small">Serve <code>integrity.json</code> + <code>integrity.sig</code> firmati (Ed25519) e accessibili dal browser.</div>
      `);
      return;
    }

    let files = manualFiles();
    if (!files) files = Object.keys(state.expected.files);
    if (!files?.length) { setSummary(`<span class="bad">Nessuna lista file disponibile.</span>`); return; }

    let okCount = 0, bad = 0, warn = 0;

    for (const file of files) {
      const url = join(base, file);
      const exp = state.expected.files[file] || null;

      let actual = null;
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
        addRow({ file, expected: null, actual, status: "warn", note: "File non presente in integrity.json" });
        continue;
      }

      if (actual === exp) { okCount++; addRow({ file, expected: exp, actual, status: "ok" }); }
      else { bad++; addRow({ file, expected: exp, actual, status: "bad" }); }
    }

    const meta = state.expected?.meta;
    setSummary(`
      <div><span class="pill">Base</span> <code>${escapeHtml(base)}</code></div>
      <div style="margin-top:6px"><span class="ok">Firma:</span> ✅ valida (Ed25519)</div>
      <div style="margin-top:6px">
        <span class="ok">OK:</span> ${okCount} &nbsp;
        <span class="bad">MISMATCH:</span> ${bad} &nbsp;
        <span class="warn">WARN:</span> ${warn}
      </div>
      ${bad ? `<div class="bad" style="margin-top:6px">Attenzione: almeno un file non coincide con l’atteso.</div>` : ""}
      ${meta ? `<div class="small" style="margin-top:6px">Meta: <code>${escapeHtml(JSON.stringify(meta))}</code></div>` : ""}
    `);
  }

  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, c => ({
      "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"
    }[c]));
  }

  function reset() {
    state.expected = null;
    $("files").value = "";
    clearTable();
    setSummary("");
  }

  window.addEventListener("DOMContentLoaded", () => {
    $("verify").onclick = verify;
    $("clear").onclick = reset;

    // Precompilo (comodità)
    $("base").value = "https://www.alessandropezzali.it/trusting-trust-pwa/";
  });
})();
