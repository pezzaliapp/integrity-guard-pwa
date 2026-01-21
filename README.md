
Integrity Guard – PWA

Integrity Guard è una PWA di verifica dell’integrità degli asset web basata su SHA-256.

È pensata come strumento difensivo e dimostrativo: mostra cosa viene realmente eseguito dal browser e permette di rilevare modifiche non dichiarate nei file pubblicati.

⸻

🎯 Scopo

Integrity Guard NON:
	•	protegge da attacchi,
	•	impedisce compromissioni,
	•	garantisce sicurezza assoluta.

Integrity Guard SÌ:
	•	rende visibili le modifiche,
	•	permette verifiche ripetibili,
	•	dimostra che fidarsi del codice sorgente non basta.

Auditabilità ≠ Sicurezza
Questa app lavora sull’auditabilità.

⸻

🧩 Modalità di funzionamento (B – minimale)

Modalità attiva: hash-only
	•	✔️ verifica SHA-256 degli asset
	•	✔️ nessuna firma crittografica richiesta
	•	✔️ nessun blocco se manca integrity.sig
	•	⚠️ la firma crittografica è fuori scope (Trusting Trust reale ≠ browser)

Questa modalità è volutamente semplice, identica a quella utilizzata inizialmente nel progetto.

⸻

📁 Requisiti del sito da verificare

Il sito target deve esporre un file:

integrity.json

contenente la lista dei file e i rispettivi hash SHA-256.

Esempio:

{
  "index.html": "5c7660c1c3a9be4869f66a9e4a934a743d76ec115b71c0e07d4c05f47343ef7e",
  "app.js": "2574cc229bf3087e8704361a45c0cf3ad3acac52947abc114f78a25c69e40cb6"
}

Se integrity.json non è presente, la verifica fallisce correttamente.

⸻

🌐 CORS e limiti del browser

Integrity Guard esegue i controlli direttamente dal browser (fetch).

Per questo motivo:
	•	✅ funziona sempre sullo stesso dominio
	•	⚠️ su domini esterni funziona solo se il target abilita CORS
	•	❌ in caso contrario vedrai Failed to fetch
(non è un errore dell’app)

⸻

🧠 Filosofia del progetto

Integrity Guard non protegge il dominio.
Protegge solo ciò che dichiara di proteggere.

È una scelta consapevole:
	•	il dominio può cambiare liberamente
	•	le app possono dichiarare la propria integrità
	•	ogni modifica reale diventa osservabile

⸻

🔗 Uso consigliato

Proteggere singole applicazioni, non l’intero sito.

Esempio:

/trusting-trust-pwa/
/integrity-guard-pwa/
/csvxpressplus/

Ogni app decide se e come esporsi alla verifica.

⸻

⚠️ Nota importante

Questa PWA è educational & defensive.

Serve a rispondere a una sola domanda:

“Il codice che sto eseguendo è davvero quello che penso?”

Se la risposta è “non lo so”, Integrity Guard ha già fatto il suo lavoro.

⸻

📜 Licenza

MIT License
Usa, studia, modifica.
Ma non fidarti mai ciecamente degli strumenti.

⸻

✅ Stato attuale
	•	Modalità: B – minimale
	•	Funzionamento: confermato
	•	Output: coerente e verificabile
