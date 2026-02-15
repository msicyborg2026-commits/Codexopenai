import { useEffect, useMemo, useState } from 'react';
import { apiFetch } from '../lib/api';
import { Button } from '../components/ui/Button';
import { Select } from '../components/ui/Select';
import { Input } from '../components/ui/Input';
import { ContractWizardStepTwo } from '../components/contract-wizard/ContractWizardStepTwo';

const CONTRACT_TYPES = [
  { value: 'COLF', label: 'COLF' },
  { value: 'BADANTE_CONVIVENTE', label: 'Badante convivente' },
  { value: 'BADANTE_NON_CONVIVENTE', label: 'Badante non convivente' }
];

const WIZARD_TITLES = {
  1: 'Dati rapporto',
  2: 'Orario & Retribuzione',
  3: 'Riepilogo'
};

const initialForm = {
  employerId: '',
  workerId: '',
  tipoContratto: CONTRACT_TYPES[0].value,
  dataInizio: '',
  weeklyHours: '',
  monHours: '',
  tueHours: '',
  wedHours: '',
  thuHours: '',
  friHours: '',
  satHours: '',
  sunHours: '',
  payType: 'HOURLY',
  baseSalary: '',
  superminimo: '',
  foodAllowance: '',
  accommodationAllowance: '',
  thirteenth: true,
  level: '',
  convivente: false
};

const getEmployerLabel = (employer) => {
  if (employer?.fullName) return employer.fullName;
  return [employer?.nome, employer?.cognomeRagione].filter(Boolean).join(' ');
};

const getWorkerLabel = (worker) => [worker?.nome, worker?.cognome].filter(Boolean).join(' ');

const getStepTwoErrors = (form) => {
  const errors = {};

  if (!form.weeklyHours) {
    errors.weeklyHours = 'Inserisci le ore settimanali.';
  }

  if (!form.baseSalary) {
    errors.baseSalary = 'Inserisci la retribuzione base.';
  }

  return errors;
};

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

  const stepTwoErrors = useMemo(() => getStepTwoErrors(form), [form]);
  const isStepTwoValid = Object.keys(stepTwoErrors).length === 0;

  const handleFieldChange = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const goToStepTwo = (event) => {
    event.preventDefault();
    setStep(2);
  };

  const goToStepThree = (event) => {
    event.preventDefault();
    if (!isStepTwoValid) return;
    setStep(3);
  };

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-slate-200 bg-white p-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Wizard Contratto</p>
        <h2 className="text-lg font-semibold text-slate-900">Step {step}: {WIZARD_TITLES[step]}</h2>
      </div>

      {step === 1 && (
        <form onSubmit={goToStepTwo} className="space-y-4 rounded-xl border border-slate-200 bg-white p-4">
          {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">Datore</label>
            <Select
              value={form.employerId}
              onChange={(event) => handleFieldChange('employerId', event.target.value)}
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
              onChange={(event) => handleFieldChange('workerId', event.target.value)}
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
              onChange={(event) => handleFieldChange('tipoContratto', event.target.value)}
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
              onChange={(event) => handleFieldChange('dataInizio', event.target.value)}
              required
            />
          </div>

          <div className="flex flex-wrap justify-end gap-2 border-t border-slate-200 pt-4">
            <Button variant="secondary" onClick={onCancel}>Annulla</Button>
            <Button type="submit" disabled={loading}>Avanti</Button>
          </div>
        </form>
      )}

      {step === 2 && (
        <form onSubmit={goToStepThree} className="space-y-6 rounded-xl border border-slate-200 bg-white p-4">
          <ContractWizardStepTwo
            form={form}
            errors={stepTwoErrors}
            onChange={handleFieldChange}
            showConvivente={form.tipoContratto === 'BADANTE_CONVIVENTE'}
          />

          <div className="flex flex-wrap justify-between gap-2 border-t border-slate-200 pt-4">
            <div className="flex gap-2">
              <Button variant="secondary" onClick={onCancel}>Annulla</Button>
              <Button variant="ghost" onClick={() => setStep(1)}>Indietro</Button>
            </div>
            <Button type="submit" disabled={!isStepTwoValid}>Avanti</Button>
          </div>
        </form>
      )}

      {step === 3 && (
        <div className="space-y-4 rounded-xl border border-slate-200 bg-white p-4">
          <p className="text-sm text-slate-600">Step 3 (Riepilogo) sarà completato nelle prossime PR.</p>
          <div className="flex flex-wrap justify-between gap-2 border-t border-slate-200 pt-4">
            <div className="flex gap-2">
              <Button variant="secondary" onClick={onCancel}>Annulla</Button>
              <Button variant="ghost" onClick={() => setStep(2)}>Indietro</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
