async function sha256(buffer) {
  const hash = await crypto.subtle.digest("SHA-256", buffer);
  return Array.from(new Uint8Array(hash))
    .map(b => b.toString(16).padStart(2, "0"))
    .join("");
}

async function fetchHash(url) {
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) throw new Error("HTTP " + res.status);
  const buf = await res.arrayBuffer();
  return sha256(buf);
}

async function verify() {
  const base = document.getElementById("baseUrl").value;
  const status = document.getElementById("status");
  const table = document.getElementById("results");
  const tbody = table.querySelector("tbody");

  status.textContent = "Verifica in corso…";
  status.className = "";
  tbody.innerHTML = "";
  table.hidden = true;

  let manifest;
  try {
    const res = await fetch(base + "integrity.json", { cache: "no-store" });
    if (!res.ok) throw new Error("integrity.json non trovato");
    manifest = await res.json();
  } catch (e) {
    status.textContent = "❌ Impossibile caricare integrity.json";
    status.className = "err";
    return;
  }

  const files = Object.keys(manifest.files || {});
  if (!files.length) {
    status.textContent = "⚠️ Nessun file dichiarato in integrity.json";
    status.className = "warn";
    return;
  }

  for (const file of files) {
    try {
      const hash = await fetchHash(base + file);
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${file}</td>
        <td>${hash}</td>
        <td class="ok">OK</td>
      `;
      tbody.appendChild(tr);
    } catch (e) {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${file}</td>
        <td>—</td>
        <td class="err">ERRORE</td>
      `;
      tbody.appendChild(tr);
    }
  }

  status.textContent = "✅ Verifica completata (hash-only)";
  status.className = "ok";
  table.hidden = false;
}
