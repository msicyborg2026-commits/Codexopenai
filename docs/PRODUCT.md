# PRODUCT SPEC — Gestionale COLF

## 1) Target

### Segmento A: Famiglie (datori di lavoro domestico)
**Chi sono:** famiglie che assumono colf, badanti, baby sitter, giardinieri, autisti domestici.

**Bisogni operativi principali:**
- assumere in regola senza studiare norme complesse;
- registrare ore/presenze senza errori;
- avere buste paga e scadenze sempre sotto controllo;
- ridurre rischio di sanzioni, contenziosi e dimenticanze.

### Segmento B: Consulenti (CAF, consulenti del lavoro, studi paghe)
**Chi sono:** professionisti che gestiscono molte famiglie contemporaneamente.

**Bisogni operativi principali:**
- standardizzare onboarding e contratti;
- lavorare su più clienti da una sola dashboard;
- delegare attività al team con ruoli e permessi;
- ridurre tempo per pratica e aumentare marginalità.

---

## 2) Value Proposition

**Per famiglie:**
"Gestisci tutto il lavoro domestico in regola, in pochi passaggi guidati, senza stress burocratico."

**Per consulenti:**
"Una piattaforma multi-cliente che trasforma pratiche ripetitive in processi veloci, controllati e scalabili."

**Posizionamento competitivo:**
- più semplice dei software paghe tradizionali;
- più completo dei tool “solo cedolino”;
- più guidato dei competitor che scaricano la complessità sull’utente.

---

## 3) 10 Feature Killer (con vantaggio competitivo)

## 1. Wizard Contratto “anti-errore” (domestico specifico)
**Perché batte i competitor:** guida passo-passo con controlli in tempo reale su inquadramento, orario, convivenza e clausole; riduce drasticamente errori iniziali che causano problemi nei mesi successivi.

**Dati necessari:** tipo rapporto, livello inquadramento, mansione, convivenza/non convivenza, ore settimanali, retribuzione, data inizio, luogo lavoro, eventuale vitto/alloggio.

**UI idea:** wizard in 6 step con barra avanzamento, validazioni “semaforo” (verde/giallo/rosso) e riepilogo finale modificabile.

## 2. Simulatore costo totale datore (prima di assumere)
**Perché batte i competitor:** mostra costo mensile/annuo reale (retribuzione + contributi + tredicesima + TFR stimato), aiutando la famiglia a decidere prima della firma.

**Dati necessari:** livello, ore, paga proposta, tipo orario, calendario ferie previsto, eventuale convivenza.

**UI idea:** slider ore/paga + card “Costo netto per la famiglia” con breakdown espandibile.

## 3. Presenze smart con regole automatiche
**Perché batte i competitor:** automatizza straordinari, festività, assenze e riposi secondo regole preimpostate del contratto domestico; evita conteggi manuali in Excel.

**Dati necessari:** calendario presenze giornaliere, ore ordinarie, causali assenza, festività locali, regole contratto attivo.

**UI idea:** calendario mensile drag&drop con chip causali e suggerimenti auto-compilati.

## 4. Cedolino “spiegato” in linguaggio semplice
**Perché batte i competitor:** oltre al PDF ufficiale, mostra versione comprensibile al datore (voci spiegate) riducendo richieste di supporto.

**Dati necessari:** voci paga calcolate, contributi, trattenute, progressivi, presenze del periodo.

**UI idea:** doppia vista “Ufficiale” / “Spiegata”, con tooltip su ogni voce.

## 5. Scadenziario proattivo multicanale
**Perché batte i competitor:** non solo elenca scadenze, ma invia reminder intelligenti con priorità e checklist di cosa fare oggi.

**Dati necessari:** calendario contributi, rinnovi, scadenze pagamenti, stato attività, canale preferito (email/WhatsApp/SMS).

**UI idea:** timeline con semafori priorità + pulsante rapido “Segna come fatto”.

## 6. Centro documenti con OCR e campi auto-estratti
**Perché batte i competitor:** carica documenti (ID, codice fiscale, contratto) e propone compilazione automatica anagrafica.

**Dati necessari:** file upload, metadati documento, estrazione OCR, conferma utente dei dati letti.

**UI idea:** area upload drag&drop con pannello “Dati rilevati” da confermare/modificare.

## 7. Benchmark retributivo locale
**Perché batte i competitor:** suggerisce range retributivi realistici per area geografica e tipologia, migliorando qualità dell’offerta e riducendo turnover.

**Dati necessari:** CAP/comune, tipologia lavoro, ore richieste, storico offerte/accettazioni interne piattaforma.

**UI idea:** grafico a banda (min-med-max) + suggerimento “offerta consigliata”.

## 8. Multi-tenant consulenti con workspace famiglie
**Perché batte i competitor:** consulente può gestire centinaia di famiglie con viste separate, template riusabili e onboarding guidato delegabile.

**Dati necessari:** anagrafica studio, anagrafiche clienti, utenti team, ruoli e permessi, stato pratiche per cliente.

**UI idea:** switcher workspace in header + tabella clienti con filtri avanzati.

## 9. Audit trail completo e cronologia modifiche
**Perché batte i competitor:** traccia chi ha modificato cosa e quando, utile in caso di contestazioni o controllo interno.

**Dati necessari:** log eventi (utente, timestamp, entità, campo, valore prima/dopo), origine azione (manuale/automatica).

**UI idea:** pannello “Cronologia” su ogni entità con diff leggibile.

## 10. Copilota operativo (checklist giornaliera)
**Perché batte i competitor:** home con “prossime 5 azioni” personalizzate per ridurre procrastinazione e errori di processo.

**Dati necessari:** stato pratiche aperte, scadenze prossime, documenti mancanti, attività pendenti per ruolo.

**UI idea:** dashboard task-first con card azioni ordinate per impatto/urgenza.

---

## 4) MVP vs Pro

## MVP (go-live rapido)
- onboarding datore e lavoratore;
- wizard contratto base;
- presenze mensili manuali;
- calcolo cedolino standard + export PDF;
- scadenziario base con reminder email;
- archivio documenti base.

## Pro (vantaggio competitivo pieno)
- simulatore costo avanzato;
- benchmark retributivo locale;
- OCR documentale con auto-compilazione;
- scadenziario multicanale smart;
- audit trail avanzato;
- multi-tenant consulenti + ruoli granulari;
- copilota operativo con priorità intelligenti.

---

## 5) Pricing Idea

## Famiglie
- **Starter**: 12–16 €/mese per 1 lavoratore, funzioni essenziali.
- **Plus**: 19–29 €/mese, reminder avanzati + supporto prioritario + automazioni base.

## Consulenti
- **Studio Start**: 49 €/mese fino a 15 famiglie.
- **Studio Growth**: 129 €/mese fino a 75 famiglie.
- **Studio Scale**: 249 €/mese fino a 200 famiglie + API/export avanzati.

## Add-on
- invio comunicazioni premium (SMS/WhatsApp),
- reportistica avanzata,
- onboarding assistito.

**Ipotesi di differenziazione:** prezzo accessibile per famiglia singola, forte convenienza a volume per consulenti.
