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

  const selectedContract = useMemo(
    () => contracts.find((contract) => String(contract.id) === String(selectedContractId)) || null,
    [contracts, selectedContractId]
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
    const payType = selectedContract?.payType ?? 'HOURLY';
    const hourlyRate = Math.max(toNumber(selectedContract?.hourlyRate), 0);
    const monthlySalary = Math.max(toNumber(selectedContract?.monthlySalary), 0);
    const overtimeMultiplier = Math.max(toNumber(selectedContract?.overtimeMultiplier, 1.25), 1);
    const weeklyHours = Math.max(toNumber(selectedContract?.weeklyHours), 0);
    const hourlyEquivalent = weeklyHours > 0 ? monthlySalary / (weeklyHours * 4.33) : 0;

    const estimatedGross = payType === 'HOURLY'
      ? (ordinaryHours * hourlyRate) + (overtimeHours * hourlyRate * overtimeMultiplier)
      : monthlySalary + (weeklyHours > 0 ? overtimeHours * hourlyEquivalent * overtimeMultiplier : 0);

    return {
      plannedMinutes,
      workedMinutes,
      coveredMinutes,
      ordinaryHours,
      overtimeHours,
      estimatedGross,
      payType,
      hourlyRate,
      monthlySalary,
      overtimeMultiplier,
      weeklyHours
    };
  }, [monthDays, selectedContract]);

  const selectedContractLabel = useMemo(() => {
    if (!selectedContract) return 'Nessun contratto selezionato';
    return getContractLabel(selectedContract, employersById, workersById);
  }, [employersById, selectedContract, workersById]);

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
          <label className="text-xs font-medium uppercase tracking-wide text-slate-500">
            {monthlySummary.payType === 'MONTHLY' ? 'Paga mensile (€)' : 'Paga oraria (€/h)'}
          </label>
          <Input
            value={monthlySummary.payType === 'MONTHLY' ? monthlySummary.monthlySalary : monthlySummary.hourlyRate}
            inputMode="decimal"
            disabled
          />
        </div>
        <div className="space-y-1">
          <label className="text-xs font-medium uppercase tracking-wide text-slate-500">Maggiorazione straordinario</label>
          <Input value={monthlySummary.overtimeMultiplier} inputMode="decimal" disabled />
        </div>
      </div>

      {!selectedContractId ? (
        <EmptyState title="Seleziona un contratto per calcolare la busta paga" />
      ) : (
        <div className="space-y-3 rounded-xl border border-slate-200 bg-white p-4">
          {monthlySummary.payType === 'MONTHLY' && monthlySummary.weeklyHours <= 0 && (
            <p className="rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800">
              Impossibile stimare straordinari senza ore settimanali.
            </p>
          )}

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
