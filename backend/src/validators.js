import { z } from 'zod';

const codiceFiscaleRegex = /^[A-Z0-9]{16}$/;

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
  employerId: z.coerce.number().int().positive(),
  workerId: z.coerce.number().int().positive(),
  tipoRapporto: z.string().min(2),
  livello: z.string().min(1),
  mansione: z.string().min(2),
  convivenzaFlag: z.boolean(),
  oreSettimanali: z.coerce.number().positive(),
  retribuzioneBase: z.coerce.number().positive(),
  dataInizio: z.coerce.date(),
  dataFine: z.coerce.date().optional().nullable(),
  statoContratto: z.string().min(2)
}).refine((data) => !data.dataFine || data.dataFine >= data.dataInizio, {
  message: 'La data fine non può essere precedente alla data inizio',
  path: ['dataFine']
});

export const attendanceSchema = z.object({
  contractId: z.coerce.number().int().positive(),
  data: z.coerce.date(),
  oreOrdinarie: z.coerce.number().min(0),
  oreStraordinario: z.coerce.number().min(0),
  causale: z.enum(['presenza', 'ferie', 'malattia', 'permesso', 'festività', 'altro']),
  note: z.string().optional().nullable(),
  validatoFlag: z.boolean().optional().default(false)
});
