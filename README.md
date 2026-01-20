# Integrity Guard – PWA

Utility PWA per verificare l’integrità di asset web (SHA-256) su un URL base.

## Modalità
- **Standard (consigliata):** il target pubblica `integrity.json` con hash attesi.
- **Fallback:** lista file manuale (calcola hash reali; senza “attesi” segnala WARN).

> Nota: per verificare domini terzi il browser richiede CORS.
> Su alessandropezzali.it e GitHub Pages di solito funziona.

## Quick start
Pubblica la repo con GitHub Pages e apri la PWA.
