import { z } from 'zod';
import { EntityManagementPage } from '../features/EntityManagementPage';

const schema = z.object({
  nome: z.string().min(2),
  cognome: z.string().min(2),
  codiceFiscale: z.string().min(16),
  dataNascita: z.string().min(8),
  email: z.string().email(),
  telefono: z.string().min(6),
  documentiIdentita: z.string().min(3),
  iban: z.string().optional().nullable()
});

const fields = [
  { name: 'nome', label: 'Nome', required: true },
  { name: 'cognome', label: 'Cognome', required: true },
  { name: 'codiceFiscale', label: 'Codice fiscale', required: true },
  { name: 'dataNascita', label: 'Data nascita', type: 'date', required: true },
  { name: 'email', label: 'Email', type: 'email', required: true },
  { name: 'telefono', label: 'Telefono', required: true },
  { name: 'documentiIdentita', label: 'Documenti identità', required: true },
  { name: 'iban', label: 'IBAN' }
];

const columns = [
  { key: 'nome', label: 'Nome' },
  { key: 'cognome', label: 'Cognome' },
  { key: 'codiceFiscale', label: 'Codice fiscale' },
  { key: 'email', label: 'Email' },
  { key: 'telefono', label: 'Telefono' }
];

export function LavoratoriPage() {
  return <EntityManagementPage title="Lavoratori" endpoint="/api/workers" fields={fields} columns={columns} schema={schema} />;
}
