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

const parsePositiveInt = (value, fieldName) => {
  const parsed = Number(value);

  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw Object.assign(new Error(`${fieldName} deve essere un intero positivo`), { statusCode: 400 });
  }

  return parsed;
};

app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

const crudRoutes = [
  ['employers', employerSchema, prisma.employer],
  ['workers', workerSchema, prisma.worker]
];

crudRoutes.forEach(([route, schema, model]) => {
  app.get(`/api/${route}`, asyncHandler(async (_req, res) => {
    const data = await model.findMany({ orderBy: { id: 'desc' } });
    res.json(data);
  }));

  app.get(`/api/${route}/:id`, asyncHandler(async (req, res) => {
    const id = parsePositiveInt(req.params.id, 'id');
    const data = await model.findUnique({ where: { id } });

    if (!data) return res.status(404).json({ error: 'Elemento non trovato' });
    return res.json(data);
  }));

  app.post(`/api/${route}`, asyncHandler(async (req, res) => {
    const parsed = schema.parse(req.body);
    const data = await model.create({ data: parsed });
    res.status(201).json(data);
  }));

  app.put(`/api/${route}/:id`, asyncHandler(async (req, res) => {
    const id = parsePositiveInt(req.params.id, 'id');
    const parsed = schema.parse(req.body);
    const data = await model.update({ where: { id }, data: parsed });
    res.json(data);
  }));

  app.delete(`/api/${route}/:id`, asyncHandler(async (req, res) => {
    const id = parsePositiveInt(req.params.id, 'id');
    await model.delete({ where: { id } });
    res.status(204).send();
  }));
});

app.get('/api/contracts', asyncHandler(async (req, res) => {
  const where = {};

  if (req.query.employerId !== undefined) {
    where.employerId = parsePositiveInt(req.query.employerId, 'employerId');
  }

  if (req.query.workerId !== undefined) {
    where.workerId = parsePositiveInt(req.query.workerId, 'workerId');
  }

  if (req.query.status !== undefined) {
    const status = String(req.query.status);
    const allowedStatus = ['DRAFT', 'ACTIVE', 'CLOSED'];

    if (!allowedStatus.includes(status)) {
      return res.status(400).json({ error: `status non valido. Valori consentiti: ${allowedStatus.join(', ')}` });
    }

    where.status = status;
  }

  const data = await prisma.contract.findMany({ where, orderBy: { id: 'desc' } });
  return res.json(data);
}));

app.get('/api/contracts/:id', asyncHandler(async (req, res) => {
  const id = parsePositiveInt(req.params.id, 'id');
  const data = await prisma.contract.findUnique({ where: { id } });

  if (!data) return res.status(404).json({ error: 'Elemento non trovato' });
  return res.json(data);
}));

app.post('/api/contracts', asyncHandler(async (req, res) => {
  const parsed = contractSchema.parse(req.body);
  const data = await prisma.contract.create({ data: parsed });
  res.status(201).json(data);
}));

app.put('/api/contracts/:id', asyncHandler(async (req, res) => {
  const id = parsePositiveInt(req.params.id, 'id');
  const parsed = contractSchema.parse(req.body);
  const data = await prisma.contract.update({ where: { id }, data: parsed });
  res.json(data);
}));

app.delete('/api/contracts/:id', asyncHandler(async (req, res) => {
  const id = parsePositiveInt(req.params.id, 'id');
  await prisma.contract.delete({ where: { id } });
  res.status(204).send();
}));

app.get('/api/contracts/:contractId/attendances', asyncHandler(async (req, res) => {
  const { month } = req.query;
  const contractId = parsePositiveInt(req.params.contractId, 'contractId');
  let where = { contractId };

  if (month) {
    const [year, monthNum] = String(month).split('-').map(Number);

    if (!year || !monthNum || monthNum < 1 || monthNum > 12) {
      return res.status(400).json({ error: 'month deve essere nel formato YYYY-MM' });
    }

    const start = new Date(Date.UTC(year, monthNum - 1, 1));
    const end = new Date(Date.UTC(year, monthNum, 1));
    where = { ...where, data: { gte: start, lt: end } };
  }

  const rows = await prisma.attendance.findMany({ where, orderBy: { data: 'asc' } });
  return res.json(rows);
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
  const totalEstimatedMonthlyCost = contracts.reduce((acc, contract) => acc + Number(contract.baseSalary) * 1.3, 0);
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
    const threshold = Number(contract.weeklyHours) * 4.33;
    if (workedHours > threshold) alerts.push(`Ore oltre soglia per contratto #${contract.id}`);
  }

  res.json({ totalEstimatedMonthlyCost, alerts });
}));

app.use((err, _req, res, _next) => {
  if (err.name === 'ZodError') {
    return res.status(400).json({ error: 'Validazione fallita', details: err.errors });
  }

  if (err.code === 'P2003') {
    return res.status(400).json({ error: 'Relazione non valida: employerId o workerId inesistente' });
  }

  if (err.code === 'P2025') {
    return res.status(404).json({ error: 'Elemento non trovato' });
  }

  if (err.statusCode) {
    return res.status(err.statusCode).json({ error: err.message });
  }

  console.error(err);
  return res.status(500).json({ error: 'Errore interno del server' });
});

app.listen(PORT, () => {
  console.log(`Backend in ascolto sulla porta ${PORT}`);
});
