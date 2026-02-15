# Gestionale COLF — MVP

Monorepo con backend Node/Express/Prisma/PostgreSQL e frontend React/Vite/Tailwind.

## Struttura

- `backend/` API REST + Prisma
- `frontend/` interfaccia utente
- `docker-compose.yml` PostgreSQL

## Avvio rapido

1. Installa dipendenze dalla root:
   ```bash
   npm install
   ```
2. Avvia PostgreSQL:
   ```bash
   docker compose up -d
   ```
3. Copia env:
   ```bash
   cp backend/.env.example backend/.env
   cp frontend/.env.example frontend/.env
   ```
4. Migrazioni e seed:
   ```bash
   npm run db:migrate
   npm run db:seed
   ```
5. Avvio backend + frontend con un solo comando:
   ```bash
   npm run dev
   ```

## Sezioni UI

- Panoramica
- Datori
- Lavoratori
- Contratti (CRUD + wizard guidato)
- Presenze (vista mensile)

## API principali

- `GET /health`
- CRUD: `/api/employers`, `/api/workers`, `/api/contracts` (con filtri opzionali `employerId`, `workerId`, `status`)
- `GET /api/contracts/:contractId/attendances?month=YYYY-MM`
- `POST /api/attendances`
- `GET /api/dashboard`
