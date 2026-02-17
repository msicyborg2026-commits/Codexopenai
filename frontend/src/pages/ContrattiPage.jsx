import { useEffect, useMemo, useState } from 'react';
import { apiFetch } from '../lib/api';
import { Button } from '../components/ui/Button';
import { EmptyState } from '../components/ui/EmptyState';
import { Badge } from '../components/ui/Badge';
import { Select } from '../components/ui/Select';
import { Input } from '../components/ui/Input';
import { Modal } from '../components/ui/Modal';

const STATUS_OPTIONS = [
  { value: '', label: 'All' },
  { value: 'DRAFT', label: 'DRAFT' },
  { value: 'ACTIVE', label: 'ACTIVE' },
  { value: 'CLOSED', label: 'CLOSED' }
];

const STATUS_BADGE_VARIANT = {
  DRAFT: 'warning',
  ACTIVE: 'success',
  CLOSED: 'neutral'
};

const MAX_MINUTES_PER_DAY = 24 * 60;
const SCHEDULE_FIELDS = [
  { key: 'monMinutes', label: 'Lun' },
  { key: 'tueMinutes', label: 'Mar' },
  { key: 'wedMinutes', label: 'Mer' },
  { key: 'thuMinutes', label: 'Gio' },
  { key: 'friMinutes', label: 'Ven' },
  { key: 'satMinutes', label: 'Sab' },
  { key: 'sunMinutes', label: 'Dom' }
];

const emptySchedule = {
  monMinutes: 0,
  tueMinutes: 0,
  wedMinutes: 0,
  thuMinutes: 0,
  friMinutes: 0,
  satMinutes: 0,
  sunMinutes: 0
};

const getEmployerLabel = (employer) => [employer?.nome, employer?.cognomeRagione].filter(Boolean).join(' ');
const getWorkerLabel = (worker) => [worker?.nome, worker?.cognome].filter(Boolean).join(' ');

const formatDate = (value) => {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';
  return new Intl.DateTimeFormat('it-IT').format(date);
};

const formatCurrency = (value) => {
  const amount = Number(value);
  if (!Number.isFinite(amount)) return '-';
  return new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR' }).format(amount);
};

const toMinutes = (value) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

const minutesToHoursAndMinutes = (totalMinutes) => {
  const safeTotal = Math.max(0, Math.floor(toMinutes(totalMinutes)));
  return {
    hours: Math.floor(safeTotal / 60),
    minutes: safeTotal % 60
  };
};

const formatMinutesLabel = (totalMinutes) => {
  const { hours, minutes } = minutesToHoursAndMinutes(totalMinutes);
  return `${hours}h ${String(minutes).padStart(2, '0')}m`;
};

export function ContrattiPage({ onCreateContract }) {
  const [contracts, setContracts] = useState([]);
  const [employers, setEmployers] = useState([]);
  const [workers, setWorkers] = useState([]);
  const [filters, setFilters] = useState({ status: '', employerId: '', workerId: '' });
  const [selectedContractId, setSelectedContractId] = useState(null);
  const [selectedContract, setSelectedContract] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [error, setError] = useState('');
  const [scheduleModalContract, setScheduleModalContract] = useState(null);
  const [scheduleForm, setScheduleForm] = useState(emptySchedule);
  const [scheduleFormError, setScheduleFormError] = useState('');
  const [scheduleSuccessMessage, setScheduleSuccessMessage] = useState('');
  const [loadingSchedule, setLoadingSchedule] = useState(false);
  const [savingSchedule, setSavingSchedule] = useState(false);

  const employersById = useMemo(
    () => Object.fromEntries(employers.map((employer) => [String(employer.id), employer])),
    [employers]
  );

  const workersById = useMemo(
    () => Object.fromEntries(workers.map((worker) => [String(worker.id), worker])),
    [workers]
  );

  const loadContracts = async (nextFilters = filters) => {
    try {
      setLoading(true);
      setError('');

      const searchParams = new URLSearchParams();
      if (nextFilters.status) searchParams.set('status', nextFilters.status);
      if (nextFilters.employerId) searchParams.set('employerId', nextFilters.employerId);
      if (nextFilters.workerId) searchParams.set('workerId', nextFilters.workerId);

      const queryString = searchParams.toString();
      const path = `/api/contracts${queryString ? `?${queryString}` : ''}`;
      const loadedContracts = await apiFetch(path);
      setContracts(loadedContracts);
    } catch (loadError) {
      setError(loadError.message);
    } finally {
      setLoading(false);
    }
  };

  const loadContractDetail = async (id) => {
    try {
      setLoadingDetail(true);
      setError('');
      const detail = await apiFetch(`/api/contracts/${id}`);
      setSelectedContract(detail);
      setSelectedContractId(id);
    } catch (detailError) {
      setError(`Non siamo riusciti ad aprire il dettaglio. ${detailError.message}`);
    } finally {
      setLoadingDetail(false);
    }
  };

  const loadOptions = async () => {
    try {
      const [loadedEmployers, loadedWorkers] = await Promise.all([
        apiFetch('/api/employers'),
        apiFetch('/api/workers')
      ]);
      setEmployers(loadedEmployers);
      setWorkers(loadedWorkers);
    } catch (loadError) {
      setError(loadError.message);
    }
  };

  useEffect(() => {
    const initialLoad = async () => {
      await Promise.all([loadOptions(), loadContracts({ status: '', employerId: '', workerId: '' })]);
    };

    initialLoad();
  }, []);

  const handleFilterChange = async (key, value) => {
    const nextFilters = { ...filters, [key]: value };
    setFilters(nextFilters);
    await loadContracts(nextFilters);
  };

  const updateStatus = async (contract, status) => {
    const actionLabel = status === 'CLOSED' ? 'chiudere' : 'riaprire';

    if (!window.confirm(`Vuoi davvero ${actionLabel} il contratto #${contract.id}?`)) {
      return;
    }

    try {
      setLoading(true);
      setError('');
      await apiFetch(`/api/contracts/${contract.id}`, {
        method: 'PUT',
        body: JSON.stringify({ ...contract, status })
      });

      if (selectedContractId === contract.id) {
        setSelectedContract((prev) => (prev ? { ...prev, status } : prev));
      }

      await loadContracts();
    } catch (saveError) {
      setError(`Non siamo riusciti ad aggiornare lo status. ${saveError.message}`);
    } finally {
      setLoading(false);
    }
  };

  const closeScheduleModal = () => {
    setScheduleModalContract(null);
    setScheduleForm(emptySchedule);
    setScheduleFormError('');
    setScheduleSuccessMessage('');
    setLoadingSchedule(false);
    setSavingSchedule(false);
  };

  const openScheduleModal = async (contract) => {
    setScheduleModalContract(contract);
    setScheduleForm(emptySchedule);
    setScheduleFormError('');
    setScheduleSuccessMessage('');

    try {
      setLoadingSchedule(true);
      const loadedSchedule = await apiFetch(`/api/contracts/${contract.id}/schedule`);
      setScheduleForm({ ...emptySchedule, ...loadedSchedule });
    } catch (loadError) {
      setScheduleFormError(`Non siamo riusciti a caricare l'orario. ${loadError.message}`);
      setScheduleForm(emptySchedule);
    } finally {
      setLoadingSchedule(false);
    }
  };

  const handleScheduleChange = (field, unit, value) => {
    setScheduleFormError('');
    setScheduleSuccessMessage('');

    const sanitized = value.replace(/[^0-9]/g, '');
    const parsedUnitValue = sanitized === '' ? 0 : Number(sanitized);

    setScheduleForm((prev) => {
      const currentMinutes = toMinutes(prev[field]);
      const current = minutesToHoursAndMinutes(currentMinutes);

      let nextHours = current.hours;
      let nextMinutes = current.minutes;

      if (unit === 'hours') {
        nextHours = Math.min(Math.max(parsedUnitValue, 0), 24);
      } else {
        nextMinutes = Math.min(Math.max(parsedUnitValue, 0), 59);
      }

      let nextTotal = (nextHours * 60) + nextMinutes;
      if (nextTotal > MAX_MINUTES_PER_DAY) nextTotal = MAX_MINUTES_PER_DAY;

      return {
        ...prev,
        [field]: nextTotal
      };
    });
  };

  const saveSchedule = async () => {
    if (!scheduleModalContract) return;

    const payload = SCHEDULE_FIELDS.reduce((acc, field) => {
      const value = Math.floor(toMinutes(scheduleForm[field.key]));
      acc[field.key] = value;
      return acc;
    }, {});

    const invalidField = Object.entries(payload).find(([, minutes]) => minutes < 0 || minutes > MAX_MINUTES_PER_DAY);
    if (invalidField) {
      setScheduleFormError('I minuti devono essere compresi tra 0 e 24 ore per ciascun giorno.');
      return;
    }

    try {
      setSavingSchedule(true);
      setScheduleFormError('');
      await apiFetch(`/api/contracts/${scheduleModalContract.id}/schedule`, {
        method: 'PUT',
        body: JSON.stringify(payload)
      });

      setScheduleSuccessMessage('Orario settimanale salvato con successo.');
      window.setTimeout(() => {
        closeScheduleModal();
      }, 700);
    } catch (saveError) {
      setScheduleFormError(`Non siamo riusciti a salvare l'orario. ${saveError.message}`);
    } finally {
      setSavingSchedule(false);
    }
  };

  const totalWeeklyMinutes = useMemo(
    () => SCHEDULE_FIELDS.reduce((sum, field) => sum + toMinutes(scheduleForm[field.key]), 0),
    [scheduleForm]
  );

  if (selectedContractId) {
    const employer = employersById[String(selectedContract?.employerId)];
    const worker = workersById[String(selectedContract?.workerId)];

    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-900">Dettaglio contratto #{selectedContractId}</h2>
          <Button
            variant="secondary"
            onClick={() => {
              setSelectedContractId(null);
              setSelectedContract(null);
            }}
          >
            Torna alla lista
          </Button>
        </div>

        {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

        {loadingDetail || !selectedContract ? (
          <div className="rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-600">Caricamento dettaglio...</div>
        ) : (
          <div className="grid gap-3 rounded-xl border border-slate-200 bg-white p-4 text-sm sm:grid-cols-2">
            <p><span className="font-medium text-slate-700">Datore:</span> {employer ? getEmployerLabel(employer) : `#${selectedContract.employerId}`}</p>
            <p><span className="font-medium text-slate-700">Lavoratore:</span> {worker ? getWorkerLabel(worker) : `#${selectedContract.workerId}`}</p>
            <p><span className="font-medium text-slate-700">Tipo:</span> {selectedContract.contractType}</p>
            <p><span className="font-medium text-slate-700">Livello:</span> {selectedContract.level}</p>
            <p><span className="font-medium text-slate-700">Data inizio:</span> {formatDate(selectedContract.startDate)}</p>
            <p><span className="font-medium text-slate-700">Ore settimanali:</span> {selectedContract.weeklyHours}</p>
            <p>
              <span className="font-medium text-slate-700">{selectedContract.payType === 'HOURLY' ? 'Paga oraria:' : 'Paga mensile:'}</span>{' '}
              {selectedContract.payType === 'HOURLY'
                ? `${formatCurrency(selectedContract.hourlyRate)} /h`
                : `${formatCurrency(selectedContract.monthlySalary)}`}
            </p>
            <p><span className="font-medium text-slate-700">Straordinario:</span> x{selectedContract.overtimeMultiplier}</p>
            <p><span className="font-medium text-slate-700">Status:</span> <Badge variant={STATUS_BADGE_VARIANT[selectedContract.status] || 'neutral'}>{selectedContract.status}</Badge></p>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-end">
        <Button onClick={onCreateContract}>Crea contratto</Button>
      </div>

      {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

      <div className="grid gap-3 rounded-xl border border-slate-200 bg-white p-4 sm:grid-cols-3">
        <div className="space-y-1">
          <label className="text-xs font-medium uppercase tracking-wide text-slate-500">Status</label>
          <Select value={filters.status} onChange={(event) => handleFilterChange('status', event.target.value)}>
            {STATUS_OPTIONS.map((option) => <option key={option.value || 'all'} value={option.value}>{option.label}</option>)}
          </Select>
        </div>

        <div className="space-y-1">
          <label className="text-xs font-medium uppercase tracking-wide text-slate-500">Datore</label>
          <Select value={filters.employerId} onChange={(event) => handleFilterChange('employerId', event.target.value)}>
            <option value="">Tutti</option>
            {employers.map((employer) => <option key={employer.id} value={employer.id}>{getEmployerLabel(employer)}</option>)}
          </Select>
        </div>

        <div className="space-y-1">
          <label className="text-xs font-medium uppercase tracking-wide text-slate-500">Lavoratore</label>
          <Select value={filters.workerId} onChange={(event) => handleFilterChange('workerId', event.target.value)}>
            <option value="">Tutti</option>
            {workers.map((worker) => <option key={worker.id} value={worker.id}>{getWorkerLabel(worker)}</option>)}
          </Select>
        </div>
      </div>

      {!loading && !contracts.length ? <EmptyState title="Nessun contratto" description="Premi “Crea contratto” per avviare il wizard." /> : (
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-50 text-left text-slate-500">
              <tr>
                <th className="px-4 py-3">ID</th>
                <th className="px-4 py-3">Datore</th>
                <th className="px-4 py-3">Lavoratore</th>
                <th className="px-4 py-3">Tipo</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Data inizio</th>
                <th className="px-4 py-3">Azioni</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-4 py-4 text-slate-600">Caricamento contratti...</td>
                </tr>
              ) : contracts.map((contract) => {
                const employer = employersById[String(contract.employerId)];
                const worker = workersById[String(contract.workerId)];

                return (
                  <tr key={contract.id} className="border-t border-slate-200">
                    <td className="px-4 py-3">#{contract.id}</td>
                    <td className="px-4 py-3">{employer ? getEmployerLabel(employer) : `#${contract.employerId}`}</td>
                    <td className="px-4 py-3">{worker ? getWorkerLabel(worker) : `#${contract.workerId}`}</td>
                    <td className="px-4 py-3">{contract.contractType}</td>
                    <td className="px-4 py-3">
                      <Badge variant={STATUS_BADGE_VARIANT[contract.status] || 'neutral'}>{contract.status}</Badge>
                    </td>
                    <td className="px-4 py-3">{formatDate(contract.startDate)}</td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-2">
                        <Button variant="secondary" onClick={() => loadContractDetail(contract.id)}>Apri</Button>
                        <Button variant="secondary" onClick={() => openScheduleModal(contract)}>Orario</Button>
                        {contract.status === 'ACTIVE' && (
                          <Button variant="danger" onClick={() => updateStatus(contract, 'CLOSED')}>Chiudi</Button>
                        )}
                        {contract.status === 'CLOSED' && (
                          <Button onClick={() => updateStatus(contract, 'ACTIVE')}>Riapri</Button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <Modal
        isOpen={Boolean(scheduleModalContract)}
        title={scheduleModalContract ? `Orario settimanale · Contratto #${scheduleModalContract.id}` : 'Orario settimanale'}
        onClose={closeScheduleModal}
      >
        <div className="space-y-4">
          {scheduleFormError && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{scheduleFormError}</p>
          )}
          {scheduleSuccessMessage && (
            <p className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{scheduleSuccessMessage}</p>
          )}

          {loadingSchedule ? (
            <p className="text-sm text-slate-600">Caricamento orario...</p>
          ) : (
            <div className="space-y-3">
              {SCHEDULE_FIELDS.map((field) => {
                const { hours, minutes } = minutesToHoursAndMinutes(scheduleForm[field.key]);

                return (
                  <div key={field.key} className="grid grid-cols-[70px_1fr_1fr_auto] items-center gap-3 rounded-lg border border-slate-200 px-3 py-2">
                    <p className="text-sm font-medium text-slate-700">{field.label}</p>
                    <Input
                      type="number"
                      min={0}
                      max={24}
                      value={hours}
                      onChange={(event) => handleScheduleChange(field.key, 'hours', event.target.value)}
                      aria-label={`Ore ${field.label}`}
                    />
                    <Input
                      type="number"
                      min={0}
                      max={59}
                      value={minutes}
                      onChange={(event) => handleScheduleChange(field.key, 'minutes', event.target.value)}
                      aria-label={`Minuti ${field.label}`}
                    />
                    <span className="text-xs text-slate-500">{formatMinutesLabel(scheduleForm[field.key])}</span>
                  </div>
                );
              })}
            </div>
          )}

          <div className="rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-700">
            <span className="font-medium">Totale settimanale previsto:</span> {formatMinutesLabel(totalWeeklyMinutes)}
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={closeScheduleModal} disabled={savingSchedule}>Annulla</Button>
            <Button onClick={saveSchedule} disabled={loadingSchedule || savingSchedule}>
              {savingSchedule ? 'Salvataggio...' : 'Salva'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
