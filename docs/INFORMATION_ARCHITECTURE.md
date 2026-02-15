# INFORMATION ARCHITECTURE — Gestionale COLF

## 1) Menu principale

- Dashboard
- Datori di lavoro
- Lavoratori
- Contratti
- Presenze
- Cedolini
- Scadenze
- Documenti
- Report
- Impostazioni

## Variante consulente
- Selettore Workspace Cliente (famiglia)
- Team e Permessi
- Template Contratto
- Fatturazione Clienti (opzionale)

---

## 2) Pagine principali

## Dashboard
- widget “prossime azioni”
- scadenze a 7/30 giorni
- stato contratti
- alert anomalie

## Datori di lavoro
- lista datori con ricerca e filtri
- scheda datore (anagrafica, contatti, documenti, lavoratori collegati)

## Lavoratori
- lista lavoratori
- scheda lavoratore (anagrafica, documenti, storico contratti)

## Contratti
- elenco contratti con stato
- pagina wizard nuovo contratto
- dettaglio contratto con timeline eventi

## Presenze
- calendario mensile per contratto
- riepilogo ore e causali
- stato approvazione mese

## Cedolini
- lista cedolini per periodo
- dettaglio voci paga
- export PDF

## Scadenze
- timeline scadenze
- filtri per priorità/stato
- storico notifiche

## Documenti
- repository centralizzato
- cartelle per datore/lavoratore/contratto
- upload + metadati

## Report
- costi mensili/annui
- ore lavorate
- trend assenze/straordinari

## Impostazioni
- profilo account
- preferenze notifiche
- configurazioni legali/territoriali

---

## 3) Componenti UI chiave

- **Top bar globale:** ricerca, switch workspace, profilo utente.
- **Sidebar navigazione:** menu principale con badge attività.
- **Card KPI:** numeri rapidi (scadenze, costi, pratiche aperte).
- **Wizard component:** stepper, validazioni inline, riepilogo finale.
- **Calendario presenze:** griglia mensile con causali rapide.
- **Timeline scadenze:** eventi ordinati per urgenza.
- **Tabella smart:** filtri, ordinamento, azioni bulk.
- **Drawer dettaglio rapido:** modifica senza cambiare pagina.
- **Centro notifiche:** messaggi operativi e reminder.
- **Audit panel:** storico modifiche per entità.
