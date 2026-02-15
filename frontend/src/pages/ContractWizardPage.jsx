import { useEffect, useState } from 'react';
import { apiFetch } from '../lib/api';
import { Button } from '../components/ui/Button';
import { Select } from '../components/ui/Select';
import { Input } from '../components/ui/Input';

const CONTRACT_TYPES = [
  { value: 'COLF', label: 'COLF' },
  { value: 'BADANTE_CONVIVENTE', label: 'Badante convivente' },
  { value: 'BADANTE_NON_CONVIVENTE', label: 'Badante non convivente' }
];

const initialForm = {
  employerId: '',
  workerId: '',
  tipoContratto: CONTRACT_TYPES[0].value,
  dataInizio: ''
};

const getEmployerLabel = (employer) => {
  if (employer?.fullName) return employer.fullName;
  return [employer?.nome, employer?.cognomeRagione].filter(Boolean).join(' ');
};

const getWorkerLabel = (worker) => [worker?.nome, worker?.cognome].filter(Boolean).join(' ');

export function ContractWizardPage({ onCancel }) {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState(initialForm);
  const [employers, setEmployers] = useState([]);
  const [workers, setWorkers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadOptions = async () => {
      try {
        setLoading(true);
        const [loadedEmployers, loadedWorkers] = await Promise.all([apiFetch('/api/employers'), apiFetch('/api/workers')]);
        setEmployers(loadedEmployers);
        setWorkers(loadedWorkers);
      } catch (loadError) {
        setError(loadError.message);
      } finally {
        setLoading(false);
      }
    };

    loadOptions();
  }, []);

  const goNextStep = (event) => {
    event.preventDefault();
    setStep(2);
  };

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-slate-200 bg-white p-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Wizard Contratto</p>
        <h2 className="text-lg font-semibold text-slate-900">Step {step}: {step === 1 ? 'Dati rapporto' : 'Placeholder Step 2'}</h2>
      </div>

      {step === 1 ? (
        <form onSubmit={goNextStep} className="space-y-4 rounded-xl border border-slate-200 bg-white p-4">
          {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">Datore</label>
            <Select
              value={form.employerId}
              onChange={(event) => setForm((prev) => ({ ...prev, employerId: event.target.value }))}
              disabled={loading}
              required
            >
              <option value="">Seleziona datore</option>
              {employers.map((employer) => (
                <option key={employer.id} value={employer.id}>{getEmployerLabel(employer)}</option>
              ))}
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">Lavoratore</label>
            <Select
              value={form.workerId}
              onChange={(event) => setForm((prev) => ({ ...prev, workerId: event.target.value }))}
              disabled={loading}
              required
            >
              <option value="">Seleziona lavoratore</option>
              {workers.map((worker) => (
                <option key={worker.id} value={worker.id}>{getWorkerLabel(worker)}</option>
              ))}
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">Tipo contratto</label>
            <Select
              value={form.tipoContratto}
              onChange={(event) => setForm((prev) => ({ ...prev, tipoContratto: event.target.value }))}
              required
            >
              {CONTRACT_TYPES.map((type) => (
                <option key={type.value} value={type.value}>{type.label}</option>
              ))}
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">Data inizio</label>
            <Input
              type="date"
              value={form.dataInizio}
              onChange={(event) => setForm((prev) => ({ ...prev, dataInizio: event.target.value }))}
              required
            />
          </div>

          <div className="flex flex-wrap justify-end gap-2 border-t border-slate-200 pt-4">
            <Button variant="secondary" onClick={onCancel}>Annulla</Button>
            <Button type="submit" disabled={loading}>Avanti</Button>
          </div>
        </form>
      ) : (
        <div className="space-y-4 rounded-xl border border-slate-200 bg-white p-4">
          <p className="text-sm text-slate-600">Step 2 sarà disponibile nelle prossime PR.</p>
          <div className="flex justify-end">
            <Button variant="secondary" onClick={onCancel}>Torna alla lista contratti</Button>
          </div>
        </div>
      )}
    </div>
  );
}
