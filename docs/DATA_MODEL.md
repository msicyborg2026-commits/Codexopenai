# DATA MODEL — Gestionale COLF

## 1) Entità principali

## Employer
Rappresenta il datore di lavoro (famiglia/persona).

**Campi minimi:**
- id
- tipo_soggetto
- nome
- cognome/ragione_sociale
- codice_fiscale
- contatti (email, telefono)
- indirizzo_lavoro
- preferenze_notifica
- created_at, updated_at

## Worker
Rappresenta il lavoratore domestico.

**Campi minimi:**
- id
- nome
- cognome
- codice_fiscale
- data_nascita
- contatti
- documenti_identità
- iban (opzionale)
- created_at, updated_at

## Contract
Rappresenta il rapporto contrattuale tra Employer e Worker.

**Campi minimi:**
- id
- employer_id (FK)
- worker_id (FK)
- tipo_rapporto
- livello
- mansione
- convivenza_flag
- ore_settimanali
- retribuzione_base
- data_inizio
- data_fine (opzionale)
- stato_contratto
- created_at, updated_at

## Attendance
Rappresenta presenze/assenze giornaliere per contratto.

**Campi minimi:**
- id
- contract_id (FK)
- data
- ore_ordinarie
- ore_straordinario
- causale (presenza, ferie, malattia, permesso, festività, altro)
- note
- validato_flag
- created_at, updated_at

## PayPeriod (facoltativo ma consigliato)
Rappresenta un periodo paga (mese) con aggregazioni.

**Campi minimi:**
- id
- contract_id (FK)
- periodo_da
- periodo_a
- totale_ore_ordinarie
- totale_ore_straordinario
- retribuzione_lorda
- contributi
- netto_stimato
- stato_elaborazione
- created_at, updated_at

---

## 2) Relazioni

- Employer **1:N** Contract
- Worker **1:N** Contract
- Contract **1:N** Attendance
- Contract **1:N** PayPeriod (se attivo)

Nota: la relazione Employer ↔ Worker è indiretta tramite Contract, così si gestisce storico e casi di più contratti nel tempo.

---

## 3) Regole di integrità consigliate

- Un Attendance deve appartenere a un solo Contract attivo o storico.
- Un Contract non può avere data_fine precedente a data_inizio.
- Un PayPeriod non deve sovrapporsi a un altro PayPeriod dello stesso Contract.
- Employer e Worker devono avere codice fiscale formalmente valido.
- La cancellazione fisica è sconsigliata: usare soft delete per audit.
