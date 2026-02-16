import { z } from 'zod';

const codiceFiscaleRegex = /^[A-Z0-9]{16}$/;

const minuteField = (fieldName) => z.coerce.number()
  .int(`${fieldName} deve essere un intero`)
  .min(0, `${fieldName} deve essere maggiore o uguale a 0`);

const decimalField = (fieldName, { required = true, min = 0 } = {}) => {
  let schema = z.coerce.number({ invalid_type_error: `${fieldName} deve essere un numero` });

  if (required) {
    schema = schema.refine((value) => Number.isFinite(value), `${fieldName} è obbligatorio`);
  }

  return schema.refine((value) => value >= min, `${fieldName} deve essere maggiore o uguale a ${min}`);
};

export const employerSchema = z.object({
  tipoSoggetto: z.string().min(2),
  nome: z.string().min(2),
  cognomeRagione: z.string().min(2),
  codiceFiscale: z.string().regex(codiceFiscaleRegex, 'Codice fiscale non valido').toUpperCase(),
  email: z.string().email(),
  telefono: z.string().min(6),
  indirizzoLavoro: z.string().min(5),
  preferenzeNotifica: z.string().min(2)
});

export const workerSchema = z.object({
  nome: z.string().min(2),
  cognome: z.string().min(2),
  codiceFiscale: z.string().regex(codiceFiscaleRegex, 'Codice fiscale non valido').toUpperCase(),
  dataNascita: z.coerce.date(),
  email: z.string().email(),
  telefono: z.string().min(6),
  documentiIdentita: z.string().min(3),
  iban: z.string().optional().nullable()
});

export const contractSchema = z.object({
  employerId: z.coerce.number().int().positive('employerId deve essere un intero positivo'),
  workerId: z.coerce.number().int().positive('workerId deve essere un intero positivo'),
  status: z.enum(['DRAFT', 'ACTIVE', 'CLOSED'], { errorMap: () => ({ message: 'status non valido' }) }),
  contractType: z.enum(['COLF', 'BADANTE_CONVIVENTE', 'BADANTE_NON_CONVIVENTE'], { errorMap: () => ({ message: 'contractType non valido' }) }),
  level: z.string().min(1, 'level è obbligatorio'),
  convivente: z.boolean({ invalid_type_error: 'convivente deve essere booleano' }),
  startDate: z.coerce.date({ invalid_type_error: 'startDate deve essere una data valida' }),
  endDate: z.coerce.date({ invalid_type_error: 'endDate deve essere una data valida' }).optional().nullable(),
  probationMonths: z.coerce.number().int().min(0, 'probationMonths deve essere >= 0').optional().nullable(),
  weeklyHours: decimalField('weeklyHours', { min: 0 }),
  monHours: decimalField('monHours', { required: false, min: 0 }).optional().nullable(),
  tueHours: decimalField('tueHours', { required: false, min: 0 }).optional().nullable(),
  wedHours: decimalField('wedHours', { required: false, min: 0 }).optional().nullable(),
  thuHours: decimalField('thuHours', { required: false, min: 0 }).optional().nullable(),
  friHours: decimalField('friHours', { required: false, min: 0 }).optional().nullable(),
  satHours: decimalField('satHours', { required: false, min: 0 }).optional().nullable(),
  sunHours: decimalField('sunHours', { required: false, min: 0 }).optional().nullable(),
  payType: z.enum(['HOURLY', 'MONTHLY'], { errorMap: () => ({ message: 'payType non valido' }) }),
  baseSalary: decimalField('baseSalary', { min: 0 }),
  superminimo: decimalField('superminimo', { required: false, min: 0 }).optional().nullable(),
  foodAllowance: decimalField('foodAllowance', { required: false, min: 0 }).optional().nullable(),
  accommodationAllowance: decimalField('accommodationAllowance', { required: false, min: 0 }).optional().nullable(),
  thirteenth: z.boolean({ invalid_type_error: 'thirteenth deve essere booleano' }).default(true),
  tfrAccrualRate: decimalField('tfrAccrualRate', { required: false, min: 0 }).optional().nullable(),
  calculatedGrossMonthly: decimalField('calculatedGrossMonthly', { required: false, min: 0 }).optional().nullable(),
  calculatedInps: decimalField('calculatedInps', { required: false, min: 0 }).optional().nullable(),
  calculatedTotalCost: decimalField('calculatedTotalCost', { required: false, min: 0 }).optional().nullable(),
  notes: z.string().optional().nullable()
}).refine((data) => !data.endDate || data.endDate >= data.startDate, {
  message: 'endDate non può essere precedente a startDate',
  path: ['endDate']
});

export const attendanceDaySchema = z.object({
  workedMinutes: minuteField('workedMinutes'),
  note: z.string().trim().max(1000, 'note troppo lunga').optional().nullable()
});

export const workScheduleSchema = z.object({
  monMinutes: minuteField('monMinutes'),
  tueMinutes: minuteField('tueMinutes'),
  wedMinutes: minuteField('wedMinutes'),
  thuMinutes: minuteField('thuMinutes'),
  friMinutes: minuteField('friMinutes'),
  satMinutes: minuteField('satMinutes'),
  sunMinutes: minuteField('sunMinutes')
});
