import { useEffect, useMemo, useState } from 'react';
import { apiFetch } from '../lib/api';
import { Button } from '../components/ui/Button';
import { Select } from '../components/ui/Select';
import { Input } from '../components/ui/Input';
import { ContractWizardStepTwo } from '../components/contract-wizard/ContractWizardStepTwo';
import { ContractWizardStepThree } from '../components/contract-wizard/ContractWizardStepThree';

const CONTRACT_TYPES = [
  { value: 'COLF', label: 'COLF' },
  { value: 'BADANTE_CONVIVENTE', label: 'Badante convivente' },
  { value: 'BADANTE_NON_CONVIVENTE', label: 'Badante non convivente' }
];

const WIZARD_TITLES = {
  1: 'Dati rapporto',
  2: 'Retribuzione',
  3: 'Orari settimanali',
  4: 'Riepilogo'
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

  if (!form.baseSalary) {
    errors.baseSalary = 'Inserisci la retribuzione base.';
  }

  return errors;
};

const getStepOneErrors = (form) => {
  const errors = {};

  if (!form.employerId) {
    errors.employerId = 'Seleziona un datore.';
  }

  if (!form.workerId) {
    errors.workerId = 'Seleziona un lavoratore.';
  }

  if (!form.tipoContratto) {
    errors.tipoContratto = 'Seleziona il tipo di contratto.';
  }

  if (!form.dataInizio) {
    errors.dataInizio = 'Inserisci la data di inizio.';
  }

  return errors;
};

const toNullableNumberString = (value) => (value === '' ? null : value);

const calculateWeeklyHours = (form) => {
  const dayKeys = ['monHours', 'tueHours', 'wedHours', 'thuHours', 'friHours', 'satHours', 'sunHours'];

  return dayKeys
    .map((key) => Number(form[key] || 0))
    .reduce((total, current) => total + (Number.isFinite(current) ? current : 0), 0)
    .toFixed(1);
};

export function ContractWizardPage({ onCancel }) {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState(initialForm);
  const [contractId, setContractId] = useState(null);
  const [employers, setEmployers] = useState([]);
  const [workers, setWorkers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
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
  const stepOneErrors = useMemo(() => getStepOneErrors(form), [form]);
  const computedWeeklyHours = useMemo(() => calculateWeeklyHours(form), [form]);
  const isStepTwoValid = Object.keys(stepTwoErrors).length === 0;
  const isStepOneValid = Object.keys(stepOneErrors).length === 0;

  const handleFieldChange = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const buildContractPayload = ({ applyStepOneDefaults = false, weeklyHoursOverride } = {}) => ({
    employerId: Number(form.employerId),
    workerId: Number(form.workerId),
    status: 'DRAFT',
    contractType: form.tipoContratto,
    startDate: new Date(form.dataInizio).toISOString(),
    level: form.level || 'BS',
    convivente: form.tipoContratto === 'BADANTE_CONVIVENTE' ? (applyStepOneDefaults ? true : form.convivente) : false,
    weeklyHours: applyStepOneDefaults ? '0' : (weeklyHoursOverride ?? form.weeklyHours),
    monHours: applyStepOneDefaults ? null : toNullableNumberString(form.monHours),
    tueHours: applyStepOneDefaults ? null : toNullableNumberString(form.tueHours),
    wedHours: applyStepOneDefaults ? null : toNullableNumberString(form.wedHours),
    thuHours: applyStepOneDefaults ? null : toNullableNumberString(form.thuHours),
    friHours: applyStepOneDefaults ? null : toNullableNumberString(form.friHours),
    satHours: applyStepOneDefaults ? null : toNullableNumberString(form.satHours),
    sunHours: applyStepOneDefaults ? null : toNullableNumberString(form.sunHours),
    payType: applyStepOneDefaults ? 'MONTHLY' : form.payType,
    baseSalary: applyStepOneDefaults ? '0' : form.baseSalary,
    superminimo: applyStepOneDefaults ? null : toNullableNumberString(form.superminimo),
    foodAllowance: applyStepOneDefaults ? null : toNullableNumberString(form.foodAllowance),
    accommodationAllowance: applyStepOneDefaults ? null : toNullableNumberString(form.accommodationAllowance),
    thirteenth: form.thirteenth
  });

  const goToStepTwo = async (event) => {
    event.preventDefault();

    if (!isStepOneValid) return;

    try {
      setIsSaving(true);
      setError('');
      const payload = buildContractPayload({ applyStepOneDefaults: true });
      const createdContract = await apiFetch('/api/contracts', {
        method: 'POST',
        body: JSON.stringify(payload)
      });
      setContractId(createdContract.id);
      setForm((prev) => ({
        ...prev,
        payType: 'MONTHLY',
        baseSalary: '0',
        weeklyHours: '0',
        level: prev.level || 'BS',
        convivente: prev.tipoContratto === 'BADANTE_CONVIVENTE'
      }));
      setStep(2);
    } catch (saveError) {
      setError(`Non siamo riusciti a salvare la bozza. ${saveError.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  const goToStepThree = async (event) => {
    event.preventDefault();
    if (!isStepTwoValid) return;

    if (!contractId) {
      setError('Bozza non trovata. Torna allo step 1 e salva di nuovo il contratto.');
      return;
    }

    try {
      setIsSaving(true);
      setError('');
      const payload = buildContractPayload();
      await apiFetch(`/api/contracts/${contractId}`, {
        method: 'PUT',
        body: JSON.stringify(payload)
      });
      setStep(3);
    } catch (saveError) {
      setError(`Non siamo riusciti a salvare i dati del contratto. ${saveError.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  const goToStepFour = async (event) => {
    event.preventDefault();

    if (!contractId) {
      setError('Bozza non trovata. Torna allo step 1 e salva di nuovo il contratto.');
      return;
    }

    try {
      setIsSaving(true);
      setError('');
      const payload = buildContractPayload({ weeklyHoursOverride: computedWeeklyHours });
      await apiFetch(`/api/contracts/${contractId}`, {
        method: 'PUT',
        body: JSON.stringify(payload)
      });
      setForm((prev) => ({ ...prev, weeklyHours: computedWeeklyHours }));
      setStep(4);
    } catch (saveError) {
      setError(`Non siamo riusciti a salvare gli orari settimanali. ${saveError.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-slate-200 bg-white p-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Wizard Contratto</p>
        <h2 className="text-lg font-semibold text-slate-900">Step {step}: {WIZARD_TITLES[step]}</h2>
        {isSaving && <p className="mt-2 text-sm text-slate-600">Saving...</p>}
      </div>

      {step === 1 && (
        <form onSubmit={goToStepTwo} className="space-y-4 rounded-xl border border-slate-200 bg-white p-4">
          {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">Datore</label>
            <Select
              value={form.employerId}
              onChange={(event) => handleFieldChange('employerId', event.target.value)}
              disabled={loading || isSaving}
              required
            >
              <option value="">Seleziona datore</option>
              {employers.map((employer) => (
                <option key={employer.id} value={employer.id}>{getEmployerLabel(employer)}</option>
              ))}
            </Select>
            {stepOneErrors.employerId && <p className="text-xs text-red-600">{stepOneErrors.employerId}</p>}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">Lavoratore</label>
            <Select
              value={form.workerId}
              onChange={(event) => handleFieldChange('workerId', event.target.value)}
              disabled={loading || isSaving}
              required
            >
              <option value="">Seleziona lavoratore</option>
              {workers.map((worker) => (
                <option key={worker.id} value={worker.id}>{getWorkerLabel(worker)}</option>
              ))}
            </Select>
            {stepOneErrors.workerId && <p className="text-xs text-red-600">{stepOneErrors.workerId}</p>}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">Tipo contratto</label>
            <Select
              value={form.tipoContratto}
              onChange={(event) => handleFieldChange('tipoContratto', event.target.value)}
              disabled={isSaving}
              required
            >
              {CONTRACT_TYPES.map((type) => (
                <option key={type.value} value={type.value}>{type.label}</option>
              ))}
            </Select>
            {stepOneErrors.tipoContratto && <p className="text-xs text-red-600">{stepOneErrors.tipoContratto}</p>}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">Data inizio</label>
            <Input
              type="date"
              value={form.dataInizio}
              onChange={(event) => handleFieldChange('dataInizio', event.target.value)}
              disabled={isSaving}
              required
            />
            {stepOneErrors.dataInizio && <p className="text-xs text-red-600">{stepOneErrors.dataInizio}</p>}
          </div>

          <div className="flex flex-wrap justify-end gap-2 border-t border-slate-200 pt-4">
            <Button variant="secondary" onClick={onCancel} disabled={isSaving}>Annulla</Button>
            <Button type="submit" disabled={loading || isSaving || !isStepOneValid}>Avanti</Button>
          </div>
        </form>
      )}

      {step === 2 && (
        <form onSubmit={goToStepThree} className="space-y-6 rounded-xl border border-slate-200 bg-white p-4">
          {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

          <ContractWizardStepTwo
            form={form}
            errors={stepTwoErrors}
            onChange={handleFieldChange}
            showConvivente={form.tipoContratto === 'BADANTE_CONVIVENTE'}
            disabled={isSaving}
          />

          <div className="flex flex-wrap justify-between gap-2 border-t border-slate-200 pt-4">
            <div className="flex gap-2">
              <Button variant="secondary" onClick={onCancel} disabled={isSaving}>Annulla</Button>
              <Button variant="ghost" onClick={() => setStep(1)} disabled={isSaving}>Indietro</Button>
            </div>
            <Button type="submit" disabled={!isStepTwoValid || isSaving}>Avanti</Button>
          </div>
        </form>
      )}

      {step === 3 && (
        <form onSubmit={goToStepFour} className="space-y-6 rounded-xl border border-slate-200 bg-white p-4">
          {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

          <ContractWizardStepThree
            form={form}
            weeklyHours={computedWeeklyHours}
            onChange={handleFieldChange}
            disabled={isSaving}
          />

          <div className="flex flex-wrap justify-between gap-2 border-t border-slate-200 pt-4">
            <div className="flex gap-2">
              <Button variant="secondary" onClick={onCancel} disabled={isSaving}>Annulla</Button>
              <Button variant="ghost" onClick={() => setStep(2)} disabled={isSaving}>Indietro</Button>
            </div>
            <Button type="submit" disabled={isSaving}>Salva Step 3</Button>
          </div>
        </form>
      )}

      {step === 4 && (
        <div className="space-y-4 rounded-xl border border-slate-200 bg-white p-4">
          {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
          <p className="text-sm text-slate-600">Step 4 (Riepilogo) sarà completato nelle prossime PR.</p>
          <div className="flex flex-wrap justify-between gap-2 border-t border-slate-200 pt-4">
            <div className="flex gap-2">
              <Button variant="secondary" onClick={onCancel} disabled={isSaving}>Annulla</Button>
              <Button variant="ghost" onClick={() => setStep(3)} disabled={isSaving}>Indietro</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
