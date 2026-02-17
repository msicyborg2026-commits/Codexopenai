import { useEffect, useMemo, useState } from 'react';
import { apiFetch } from '../lib/api';
import { Button } from '../components/ui/Button';
import { EmptyState } from '../components/ui/EmptyState';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';

const defaultSchedule = {
  monMinutes: 0,
  tueMinutes: 0,
  wedMinutes: 0,
  thuMinutes: 0,
  friMinutes: 0,
  satMinutes: 0,
  sunMinutes: 0
};

const getCurrentMonth = () => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
};

const shiftMonth = (value, delta) => {
  const [year, month] = value.split('-').map(Number);
  const date = new Date(year, month - 1 + delta, 1);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
};

const formatMonthLabel = (value) => {
  const [year, month] = value.split('-').map(Number);
  if (!year || !month) return value;
  return new Intl.DateTimeFormat('it-IT', { month: 'long', year: 'numeric' }).format(new Date(year, month - 1, 1));
};

const toNumber = (value, fallback = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const getPlannedMinutesForWeekday = (schedule, weekday) => {
  if (weekday === 1) return toNumber(schedule.monMinutes);
  if (weekday === 2) return toNumber(schedule.tueMinutes);
  if (weekday === 3) return toNumber(schedule.wedMinutes);
  if (weekday === 4) return toNumber(schedule.thuMinutes);
  if (weekday === 5) return toNumber(schedule.friMinutes);
  if (weekday === 6) return toNumber(schedule.satMinutes);
  return toNumber(schedule.sunMinutes);
};

const toDateKey = (dateValue) => {
  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) return '';
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const formatHours = (minutes) => (toNumber(minutes) / 60).toFixed(2);

const formatCurrency = (value) => new Intl.NumberFormat('it-IT', {
  style: 'currency',
  currency: 'EUR'
}).format(toNumber(value));

const getEmployerLabel = (employer) => [employer?.nome, employer?.cognomeRagione].filter(Boolean).join(' ');
const getWorkerLabel = (worker) => [worker?.nome, worker?.cognome].filter(Boolean).join(' ');

const getContractLabel = (contract, employersById, workersById) => {
  const employer = employersById[String(contract.employerId)];
  const worker = workersById[String(contract.workerId)];
  const employerLabel = getEmployerLabel(employer) || `Datore #${contract.employerId}`;
  const workerLabel = getWorkerLabel(worker) || `Lavoratore #${contract.workerId}`;
  const contractType = contract.contractType || 'Tipo non definito';
  const level = contract.level || '-';

  return `${employerLabel} — ${workerLabel} · ${contractType} (${level})`;
};

export function PaghePage() {
  const [contracts, setContracts] = useState([]);
  const [employers, setEmployers] = useState([]);
  const [workers, setWorkers] = useState([]);
  const [schedule, setSchedule] = useState(defaultSchedule);
  const [entriesByDate, setEntriesByDate] = useState({});
  const [coveredByDate, setCoveredByDate] = useState({});
  const [selectedContractId, setSelectedContractId] = useState('');
  const [selectedMonth, setSelectedMonth] = useState(getCurrentMonth());
  const [pagaOrariaInput, setPagaOrariaInput] = useState('10');
  const [maggiorazioneInput, setMaggiorazioneInput] = useState('1.25');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const employersById = useMemo(
    () => Object.fromEntries(employers.map((employer) => [String(employer.id), employer])),
    [employers]
  );

  const workersById = useMemo(
    () => Object.fromEntries(workers.map((worker) => [String(worker.id), worker])),
    [workers]
  );

  const monthDays = useMemo(() => {
    const [year, month] = selectedMonth.split('-').map(Number);
    if (!year || !month) return [];

    const daysInMonth = new Date(year, month, 0).getDate();
    return Array.from({ length: daysInMonth }, (_, index) => {
      const dayOfMonth = index + 1;
      const date = new Date(year, month - 1, dayOfMonth);
      const dateKey = toDateKey(date);
      const plannedMinutes = getPlannedMinutesForWeekday(schedule, date.getDay());
      const workedMinutes = toNumber(entriesByDate[dateKey]?.workedMinutes);
      const coveredMinutes = toNumber(coveredByDate[dateKey]);

      return {
        dateKey,
        plannedMinutes,
        workedMinutes,
        coveredMinutes,
        ordinaryMinutes: Math.min(workedMinutes, plannedMinutes),
        overtimeMinutes: Math.max(workedMinutes - plannedMinutes, 0)
      };
    });
  }, [coveredByDate, entriesByDate, schedule, selectedMonth]);

  const monthlySummary = useMemo(() => {
    const plannedMinutes = monthDays.reduce((sum, day) => sum + day.plannedMinutes, 0);
    const workedMinutes = monthDays.reduce((sum, day) => sum + day.workedMinutes, 0);
    const coveredMinutes = monthDays.reduce((sum, day) => sum + day.coveredMinutes, 0);
    const ordinaryMinutes = monthDays.reduce((sum, day) => sum + day.ordinaryMinutes, 0);
    const overtimeMinutes = monthDays.reduce((sum, day) => sum + day.overtimeMinutes, 0);

    const ordinaryHours = ordinaryMinutes / 60;
    const overtimeHours = overtimeMinutes / 60;
    const pagaOraria = Math.max(toNumber(pagaOrariaInput), 0);
    const maggiorazione = Math.max(toNumber(maggiorazioneInput, 1.25), 0);
    const estimatedGross = (ordinaryHours * pagaOraria) + (overtimeHours * pagaOraria * maggiorazione);

    return {
      plannedMinutes,
      workedMinutes,
      coveredMinutes,
      ordinaryMinutes,
      overtimeMinutes,
      ordinaryHours,
      overtimeHours,
      estimatedGross
    };
  }, [maggiorazioneInput, monthDays, pagaOrariaInput]);

  const selectedContractLabel = useMemo(() => {
    const selected = contracts.find((contract) => String(contract.id) === String(selectedContractId));
    if (!selected) return 'Nessun contratto selezionato';
    return getContractLabel(selected, employersById, workersById);
  }, [contracts, employersById, selectedContractId, workersById]);

  useEffect(() => {
    const loadInitialData = async () => {
      try {
        setLoading(true);
        setError('');

        const [contractData, employersData, workersData] = await Promise.all([
          apiFetch('/api/contracts'),
          apiFetch('/api/employers'),
          apiFetch('/api/workers')
        ]);

        setContracts(contractData);
        setEmployers(employersData);
        setWorkers(workersData);
      } catch (loadError) {
        setError(`Non siamo riusciti a caricare i dati iniziali. ${loadError.message}`);
      } finally {
        setLoading(false);
      }
    };

    loadInitialData();
  }, []);

  useEffect(() => {
    const loadMonthlyData = async () => {
      if (!selectedContractId || !selectedMonth) {
        setSchedule(defaultSchedule);
        setEntriesByDate({});
        setCoveredByDate({});
        return;
      }

      try {
        setLoading(true);
        setError('');
        const searchParams = new URLSearchParams({ month: selectedMonth });

        const [scheduleData, attendanceData] = await Promise.all([
          apiFetch(`/api/contracts/${selectedContractId}/schedule`),
          apiFetch(`/api/contracts/${selectedContractId}/attendances?${searchParams.toString()}`)
        ]);

        setSchedule({ ...defaultSchedule, ...scheduleData });

        const normalizedAttendances = Object.fromEntries(
          attendanceData.map((entry) => [toDateKey(entry.date), entry])
        );
        setEntriesByDate(normalizedAttendances);

        try {
          const monthlyJustifications = await apiFetch(`/api/contracts/${selectedContractId}/justifications?${searchParams.toString()}`);
          const normalizedCovered = Object.fromEntries(
            monthlyJustifications.map((item) => [item.date, toNumber(item.coveredMinutes)])
          );
          setCoveredByDate(normalizedCovered);
        } catch {
          setCoveredByDate({});
        }
      } catch (loadError) {
        setError(`Non siamo riusciti a caricare i dati del mese. ${loadError.message}`);
      } finally {
        setLoading(false);
      }
    };

    loadMonthlyData();
  }, [selectedContractId, selectedMonth]);

  return (
    <section className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold text-slate-900">Paghe</h1>
        <p className="text-sm text-slate-600">Calcolo ore mensili e stima del lordo per contratto.</p>
      </div>

      {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
      {loading && <p className="text-sm text-slate-500">Caricamento dati...</p>}

      <div className="grid gap-3 rounded-xl border border-slate-200 bg-white p-4 md:grid-cols-2">
        <div className="space-y-1">
          <label className="text-xs font-medium uppercase tracking-wide text-slate-500">Contratto</label>
          <Select value={selectedContractId} onChange={(event) => setSelectedContractId(event.target.value)}>
            <option value="">Seleziona contratto</option>
            {contracts.map((contract) => (
              <option key={contract.id} value={contract.id}>{getContractLabel(contract, employersById, workersById)}</option>
            ))}
          </Select>
        </div>

        <div className="space-y-1">
          <label className="text-xs font-medium uppercase tracking-wide text-slate-500">Mese</label>
          <div className="flex items-center gap-2">
            <Button variant="secondary" onClick={() => setSelectedMonth((prev) => shiftMonth(prev, -1))}>&lt;</Button>
            <p className="text-base font-semibold capitalize text-slate-900">{formatMonthLabel(selectedMonth)}</p>
            <Button variant="secondary" onClick={() => setSelectedMonth((prev) => shiftMonth(prev, 1))}>&gt;</Button>
          </div>
        </div>
      </div>

      <div className="grid gap-3 rounded-xl border border-slate-200 bg-white p-4 sm:grid-cols-2">
        <div className="space-y-1">
          <label className="text-xs font-medium uppercase tracking-wide text-slate-500">Paga oraria (€/h)</label>
          <Input value={pagaOrariaInput} onChange={(event) => setPagaOrariaInput(event.target.value)} inputMode="decimal" />
        </div>
        <div className="space-y-1">
          <label className="text-xs font-medium uppercase tracking-wide text-slate-500">Maggiorazione straordinario</label>
          <Input value={maggiorazioneInput} onChange={(event) => setMaggiorazioneInput(event.target.value)} inputMode="decimal" />
        </div>
      </div>

      {!selectedContractId ? (
        <EmptyState title="Seleziona un contratto per calcolare la busta paga" />
      ) : (
        <div className="space-y-3 rounded-xl border border-slate-200 bg-white p-4">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <div>
              <p className="text-xs uppercase tracking-wide text-slate-500">Contratto selezionato</p>
              <p className="text-sm font-medium text-slate-900">{selectedContractLabel}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-slate-500">Ore previste / lavorate</p>
              <p className="text-sm font-medium text-slate-900">
                {formatHours(monthlySummary.plannedMinutes)}h / {formatHours(monthlySummary.workedMinutes)}h
              </p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-slate-500">Coperto da giustificativi</p>
              <p className="text-sm font-medium text-slate-900">{formatHours(monthlySummary.coveredMinutes)}h</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-slate-500">Ore ordinarie</p>
              <p className="text-sm font-medium text-slate-900">{monthlySummary.ordinaryHours.toFixed(2)}h</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-slate-500">Ore straordinarie</p>
              <p className="text-sm font-medium text-slate-900">{monthlySummary.overtimeHours.toFixed(2)}h</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-slate-500">Lordo stimato</p>
              <p className="text-lg font-semibold text-slate-900">{formatCurrency(monthlySummary.estimatedGross)}</p>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
