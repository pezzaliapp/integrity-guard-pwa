# Integrity Guard – PWA

**Integrity Guard** è una Progressive Web App per la verifica dell’integrità degli asset web basata su **SHA-256**.

È uno strumento **difensivo e dimostrativo**: mostra cosa viene *realmente eseguito dal browser* e permette di rilevare modifiche non dichiarate nei file pubblicati.

---

## 🎯 Scopo

**Integrity Guard NON:**
- protegge da attacchi
- impedisce compromissioni
- garantisce sicurezza assoluta

**Integrity Guard SÌ:**
- rende **visibili** le modifiche
- permette **verifiche ripetibili**
- dimostra che **fidarsi del codice sorgente non basta**

> **Auditabilità ≠ Sicurezza**  
> Questa app lavora sull’auditabilità.

---

## ⚙️ Modalità di funzionamento (B – minimale)

Modalità attiva: **hash-only**

- ✅ verifica SHA-256 degli asset
- ✅ nessuna firma crittografica richiesta
- ✅ nessun blocco se manca `integrity.sig`
- ⚠️ la firma crittografica è fuori scope  
  *(Trusting Trust reale ≠ browser)*

Questa modalità è **volutamente semplice** ed è identica a quella iniziale del progetto.

---

## 📁 Requisiti del sito verificato

Il sito target deve esporre un file:

```
integrity.json
```

contenente gli hash SHA-256 degli asset.

### Esempio di `integrity.json`

```json
{
  "index.html": "5c7660c1c3a9be4869f66a9e4a934a743d76ec115b71c0e07d4c05f47343ef7e",
  "app.js": "2574cc229bf3087e8704361a45c0cf3ad3acac52947abc114f78a25c69e40cb6"
}
```

Se `integrity.json` **non è presente**, la verifica **fallisce correttamente**.

---

## 🌐 CORS e limiti del browser

Integrity Guard esegue le verifiche tramite `fetch` direttamente dal browser.

- ✅ funziona sempre sullo **stesso dominio**
- ⚠️ su domini esterni funziona solo se il target abilita **CORS**
- ❌ in caso contrario verrà mostrato `Failed to fetch`  
  *(non è un errore dell’app)*

---

## 🧠 Filosofia del progetto

Integrity Guard **non protegge il dominio**.  
Protegge **solo ciò che dichiara di proteggere**.

Scelte consapevoli:
- il dominio può cambiare liberamente
- le singole app dichiarano la propria integrità
- ogni modifica reale diventa osservabile

---

## 🔗 Uso consigliato

Proteggere **singole applicazioni**, non l’intero sito.

Esempi:
```
/trusting-trust-pwa/
/integrity-guard-pwa/
/csvxpressplus/
```

---

## ⚠️ Nota finale

Questa PWA è **educational & defensive**.

Serve a rispondere a una sola domanda:

> **“Il codice che sto eseguendo è davvero quello che penso?”**

Se la risposta è “non lo so”, Integrity Guard ha già fatto il suo lavoro.

---

## 📜 Licenza

MIT License
