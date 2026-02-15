import { z } from 'zod';
import { EntityManagementPage } from '../features/EntityManagementPage';

const schema = z.object({
  tipoSoggetto: z.string().min(2),
  nome: z.string().min(2),
  cognomeRagione: z.string().min(2),
  codiceFiscale: z.string().min(16),
  email: z.string().email(),
  telefono: z.string().min(6),
  indirizzoLavoro: z.string().min(5),
  preferenzeNotifica: z.string().min(2)
});

const fields = [
  { name: 'tipoSoggetto', label: 'Tipo soggetto', required: true },
  { name: 'nome', label: 'Nome', required: true },
  { name: 'cognomeRagione', label: 'Cognome / Ragione sociale', required: true },
  { name: 'codiceFiscale', label: 'Codice fiscale', required: true },
  { name: 'email', label: 'Email', type: 'email', required: true },
  { name: 'telefono', label: 'Telefono', required: true },
  { name: 'indirizzoLavoro', label: 'Indirizzo lavoro', required: true },
  { name: 'preferenzeNotifica', label: 'Preferenze notifica', required: true }
];

const columns = [
  { key: 'nome', label: 'Nome' },
  { key: 'cognomeRagione', label: 'Cognome / Ragione' },
  { key: 'codiceFiscale', label: 'Codice fiscale' },
  { key: 'email', label: 'Email' },
  { key: 'telefono', label: 'Telefono' }
];

export function DatoriPage() {
  return <EntityManagementPage title="Datori" endpoint="/api/employers" fields={fields} columns={columns} schema={schema} />;
}
