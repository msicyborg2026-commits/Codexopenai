# USER FLOWS — Gestionale COLF

## 1) Flusso: Nuovo Datore di Lavoro

1. L’utente clicca **"Aggiungi Datore"**.
2. Inserisce dati anagrafici e contatti.
3. Inserisce indirizzo principale del rapporto di lavoro.
4. Configura preferenze notifiche (email/SMS/WhatsApp).
5. Carica documenti base (ID, CF).
6. Sistema mostra check di completezza.
7. Salvataggio e creazione profilo datore.

**Output atteso:** datore pronto per associare lavoratore e contratto.

---

## 2) Flusso: Nuovo Lavoratore

1. Da profilo datore, clic su **"Aggiungi Lavoratore"**.
2. Inserimento dati anagrafici lavoratore.
3. Inserimento documenti e dati fiscali/previdenziali.
4. Eventuale import dati da OCR con conferma manuale.
5. Definizione mansione principale.
6. Verifica campi obbligatori e salvataggio.

**Output atteso:** lavoratore attivo e collegato al datore.

---

## 3) Flusso: Wizard Nuovo Contratto

1. Selezione datore e lavoratore.
2. Step 1: tipologia rapporto e data inizio.
3. Step 2: inquadramento/livello e mansione.
4. Step 3: orario settimanale e distribuzione giorni.
5. Step 4: retribuzione proposta + simulazione costo.
6. Step 5: clausole specifiche (convivenza, vitto/alloggio, prova).
7. Step 6: riepilogo con warning errori/incongruenze.
8. Conferma finale e generazione contratto.

**Output atteso:** contratto validato, firmabile e pronto alla gestione mensile.

---

## 4) Flusso: Inserimento Presenze

1. Accesso al mese corrente dal contratto attivo.
2. Vista calendario con giorni precompilati da orario contrattuale.
3. Utente modifica eccezioni (assenza, straordinario, ferie, festività).
4. Sistema ricalcola totali in tempo reale.
5. Utente conferma mese.
6. Stato mese passa a “Pronto per cedolino”.

**Output atteso:** presenze consolidate e utilizzabili per il calcolo paghe.

---

## 5) Flusso: Dashboard Operativa

1. Login utente (famiglia o consulente).
2. Dashboard mostra:
   - attività urgenti,
   - scadenze prossime,
   - pratiche bloccate,
   - stato contratti attivi.
3. Utente apre una task consigliata dal copilota.
4. Completa azione con checklist guidata.
5. Dashboard aggiorna priorità e KPI operativi.

**Output atteso:** riduzione attività dimenticate e gestione giornaliera più lineare.
