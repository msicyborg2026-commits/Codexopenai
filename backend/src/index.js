import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { prisma } from './prisma.js';
import { attendanceSchema, contractSchema, employerSchema, workerSchema } from './validators.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors({ origin: process.env.FRONTEND_URL || 'http://localhost:5173' }));
app.use(express.json());

const asyncHandler = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

const crudRoutes = [
  ['employers', employerSchema, prisma.employer],
  ['workers', workerSchema, prisma.worker],
  ['contracts', contractSchema, prisma.contract]
];

crudRoutes.forEach(([route, schema, model]) => {
  app.get(`/api/${route}`, asyncHandler(async (_req, res) => {
    const data = await model.findMany({ orderBy: { id: 'desc' } });
    res.json(data);
  }));

  app.get(`/api/${route}/:id`, asyncHandler(async (req, res) => {
    const data = await model.findUnique({ where: { id: Number(req.params.id) } });
    if (!data) return res.status(404).json({ error: 'Elemento non trovato' });
    res.json(data);
  }));

  app.post(`/api/${route}`, asyncHandler(async (req, res) => {
    const parsed = schema.parse(req.body);
    const data = await model.create({ data: parsed });
    res.status(201).json(data);
  }));

  app.put(`/api/${route}/:id`, asyncHandler(async (req, res) => {
    const parsed = schema.parse(req.body);
    const data = await model.update({ where: { id: Number(req.params.id) }, data: parsed });
    res.json(data);
  }));

  app.delete(`/api/${route}/:id`, asyncHandler(async (req, res) => {
    await model.delete({ where: { id: Number(req.params.id) } });
    res.status(204).send();
  }));
});

app.get('/api/contracts/:contractId/attendances', asyncHandler(async (req, res) => {
  const { month } = req.query;
  const contractId = Number(req.params.contractId);
  let where = { contractId };

  if (month) {
    const [year, monthNum] = String(month).split('-').map(Number);
    const start = new Date(Date.UTC(year, monthNum - 1, 1));
    const end = new Date(Date.UTC(year, monthNum, 1));
    where = { ...where, data: { gte: start, lt: end } };
  }

  const rows = await prisma.attendance.findMany({ where, orderBy: { data: 'asc' } });
  res.json(rows);
}));

app.post('/api/attendances', asyncHandler(async (req, res) => {
  const parsed = attendanceSchema.parse(req.body);
  const data = await prisma.attendance.upsert({
    where: { contractId_data: { contractId: parsed.contractId, data: parsed.data } },
    update: parsed,
    create: parsed
  });
  res.status(201).json(data);
}));

app.get('/api/dashboard', asyncHandler(async (_req, res) => {
  const contracts = await prisma.contract.findMany({ include: { employer: true, worker: true, attendances: true } });
  const totalEstimatedMonthlyCost = contracts.reduce((acc, contract) => acc + contract.retribuzioneBase * 1.3, 0);
  const alerts = [];

  const workers = await prisma.worker.findMany({ include: { contracts: true } });
  workers.filter((w) => w.contracts.length === 0).forEach((w) => alerts.push(`Contratto mancante per ${w.nome} ${w.cognome}`));

  const monthStart = new Date();
  monthStart.setDate(1);
  monthStart.setHours(0, 0, 0, 0);

  for (const contract of contracts) {
    const monthAttendances = contract.attendances.filter((a) => {
      const d = new Date(a.data);
      return d.getMonth() === monthStart.getMonth() && d.getFullYear() === monthStart.getFullYear();
    });

    if (monthAttendances.length < 20) alerts.push(`Presenze incomplete per il mese per contratto #${contract.id}`);

    const workedHours = monthAttendances.reduce((sum, a) => sum + a.oreOrdinarie + a.oreStraordinario, 0);
    const threshold = contract.oreSettimanali * 4.33;
    if (workedHours > threshold) alerts.push(`Ore oltre soglia per contratto #${contract.id}`);
  }

  res.json({ totalEstimatedMonthlyCost, alerts });
}));

app.use((err, _req, res, _next) => {
  if (err.name === 'ZodError') {
    return res.status(400).json({ error: 'Validazione fallita', details: err.errors });
  }

  if (err.code === 'P2025') {
    return res.status(404).json({ error: 'Elemento non trovato' });
  }

  console.error(err);
  return res.status(500).json({ error: 'Errore interno del server' });
});

app.listen(PORT, () => {
  console.log(`Backend in ascolto sulla porta ${PORT}`);
});
