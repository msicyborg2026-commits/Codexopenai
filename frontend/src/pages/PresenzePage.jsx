import { useEffect, useMemo, useState } from 'react';
import { apiFetch } from '../lib/api';
import { Button } from '../components/ui/Button';
import { EmptyState } from '../components/ui/EmptyState';
import { Input } from '../components/ui/Input';
import { Modal } from '../components/ui/Modal';
import { Select } from '../components/ui/Select';

const weekdayLabels = ['Dom', 'Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab'];

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

const formatMonthLabel = (value) => {
  const [year, month] = value.split('-').map(Number);
  if (!year || !month) return value;
  return new Intl.DateTimeFormat('it-IT', { month: 'long', year: 'numeric' }).format(new Date(year, month - 1, 1));
};

const shiftMonth = (value, delta) => {
  const [year, month] = value.split('-').map(Number);
  const date = new Date(year, month - 1 + delta, 1);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
};

const toHours = (value) => {
  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
};

const toMinutes = (value) => {
  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
};

const minutesToHHMM = (totalMinutes) => {
  const safeMinutes = Math.max(0, Math.round(toMinutes(totalMinutes)));
  const hours = Math.floor(safeMinutes / 60);
  const minutes = safeMinutes % 60;
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
};

const parseDurationInputToMinutes = (value) => {
  const trimmed = String(value || '').trim();
  if (!trimmed) return null;

  const hhmmMatch = /^(\d{1,3}):(\d{1,2})$/.exec(trimmed);
  if (hhmmMatch) {
    const hours = Number(hhmmMatch[1]);
    const minutes = Number(hhmmMatch[2]);

    if (!Number.isInteger(hours) || !Number.isInteger(minutes) || minutes < 0 || minutes > 59) {
      return null;
    }

    return (hours * 60) + minutes;
  }

  const dotMatch = /^(\d{1,3})\.(\d{1,2})$/.exec(trimmed);
  if (dotMatch) {
    const hours = Number(dotMatch[1]);
    const minutes = Number(dotMatch[2]);

    if (!Number.isInteger(hours) || !Number.isInteger(minutes) || minutes < 0 || minutes > 59) {
      return null;
    }

    return (hours * 60) + minutes;
  }

  const hoursOnlyMatch = /^(\d{1,3})$/.exec(trimmed);
  if (hoursOnlyMatch) {
    const hours = Number(hoursOnlyMatch[1]);
    if (!Number.isInteger(hours)) {
      return null;
    }

    return hours * 60;
  }

  return null;
};

const toDateKey = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const formatDayLabel = (date) => new Intl.DateTimeFormat('it-IT', {
  day: '2-digit',
  month: 'short',
  year: 'numeric'
}).format(date);

const getEmployerLabel = (employer) => [employer?.nome, employer?.cognomeRagione].filter(Boolean).join(' ');
const getWorkerLabel = (worker) => [worker?.nome, worker?.cognome].filter(Boolean).join(' ');

const getContractLabel = (contract, employersById, workersById) => {
  const employer = employersById[String(contract.employerId)];
  const worker = workersById[String(contract.workerId)];
  const employerLabel = getEmployerLabel(employer) || `Datore #${contract.employerId}`;
  const workerLabel = getWorkerLabel(worker) || `Lavoratore #${contract.workerId}`;
  const contractType = contract.contractType || 'Tipo non definito';
  const level = contract.level || '-';
  const weeklyHours = toHours(contract.weeklyHours);

  return `${employerLabel} — ${workerLabel} · ${contractType} (${level}) · ${weeklyHours}h/settimana`;
};

const getPlannedMinutesForWeekday = (schedule, weekday) => {
  if (weekday === 1) return toMinutes(schedule.monMinutes);
  if (weekday === 2) return toMinutes(schedule.tueMinutes);
  if (weekday === 3) return toMinutes(schedule.wedMinutes);
  if (weekday === 4) return toMinutes(schedule.thuMinutes);
  if (weekday === 5) return toMinutes(schedule.friMinutes);
  if (weekday === 6) return toMinutes(schedule.satMinutes);
  return toMinutes(schedule.sunMinutes);
};

const toJustificationRows = (items = []) => items.map((item, index) => ({
  rowId: `${Date.now()}-${index}`,
  justificationTypeId: item.justificationTypeId ? String(item.justificationTypeId) : '',
  minutesInput: minutesToHHMM(item.minutes),
  note: item.note || ''
}));

const emptyJustificationRow = () => ({
  rowId: `${Date.now()}-${Math.random()}`,
  justificationTypeId: '',
  minutesInput: '00:00',
  note: ''
});

export function PresenzePage() {
  const [contracts, setContracts] = useState([]);
  const [employers, setEmployers] = useState([]);
  const [workers, setWorkers] = useState([]);
  const [entriesByDate, setEntriesByDate] = useState({});
  const [schedule, setSchedule] = useState(defaultSchedule);
  const [justificationTypes, setJustificationTypes] = useState([]);
  const [selectedContractId, setSelectedContractId] = useState('');
  const [selectedMonth, setSelectedMonth] = useState(getCurrentMonth());
  const [selectedDay, setSelectedDay] = useState(null);
  const [workedInput, setWorkedInput] = useState('00:00');
  const [noteInput, setNoteInput] = useState('');
  const [justificationRows, setJustificationRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const selectedContract = useMemo(
    () => contracts.find((contract) => String(contract.id) === String(selectedContractId)),
    [contracts, selectedContractId]
  );

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
      const weekday = date.getDay();
      const plannedMinutes = getPlannedMinutesForWeekday(schedule, weekday);
      const dateKey = toDateKey(date);
      const attendance = entriesByDate[dateKey];
      const justifications = attendance?.justifications || [];
      const coveredMinutes = justifications.reduce((sum, item) => sum + toMinutes(item.minutes), 0);
      const missingMinutes = Math.max(plannedMinutes - toMinutes(attendance?.workedMinutes), 0);
      const uncoveredMinutes = Math.max(missingMinutes - coveredMinutes, 0);

      return {
        key: `${selectedMonth}-${String(dayOfMonth).padStart(2, '0')}`,
        date,
        dateKey,
        dayOfMonth,
        weekday,
        plannedMinutes,
        workedMinutes: toMinutes(attendance?.workedMinutes),
        note: attendance?.note || '',
        justifications,
        coveredMinutes,
        missingMinutes,
        uncoveredMinutes
      };
    });
  }, [entriesByDate, schedule, selectedMonth]);

  const monthlyTotals = useMemo(() => {
    const workedTotalMinutes = monthDays.reduce((sum, day) => sum + day.workedMinutes, 0);
    const ordinaryMinutes = monthDays.reduce(
      (sum, day) => sum + Math.min(day.workedMinutes, day.plannedMinutes),
      0
    );
    const overtimeMinutes = monthDays.reduce(
      (sum, day) => sum + Math.max(day.workedMinutes - day.plannedMinutes, 0),
      0
    );
    const orePreviste = toHours(selectedContract?.weeklyHours) * 4.33;
    const previstoMeseMinuti = monthDays.reduce((sum, day) => sum + day.plannedMinutes, 0);
    const beyondThreshold = orePreviste > 0 && (workedTotalMinutes / 60) > orePreviste;

    return {
      ordinaryMinutes,
      overtimeMinutes,
      workedTotalMinutes,
      orePreviste,
      previstoMeseMinuti,
      beyondThreshold
    };
  }, [monthDays, selectedContract?.weeklyHours]);

  const workedMinutesFromInput = useMemo(() => parseDurationInputToMinutes(workedInput), [workedInput]);

  const dayCoverageSummary = useMemo(() => {
    const plannedMinutes = selectedDay ? selectedDay.plannedMinutes : 0;
    const workedMinutes = workedMinutesFromInput ?? 0;
    const missingMinutes = Math.max(plannedMinutes - workedMinutes, 0);

    const coveredMinutes = justificationRows.reduce((sum, row) => {
      const parsedMinutes = parseDurationInputToMinutes(row.minutesInput);
      return sum + (parsedMinutes && parsedMinutes > 0 ? parsedMinutes : 0);
    }, 0);

    const uncoveredMinutes = Math.max(missingMinutes - coveredMinutes, 0);

    return {
      plannedMinutes,
      workedMinutes,
      missingMinutes,
      coveredMinutes,
      uncoveredMinutes
    };
  }, [justificationRows, selectedDay, workedMinutesFromInput]);

  const loadContracts = async () => {
    const [contractData, employersData, workersData] = await Promise.all([
      apiFetch('/api/contracts'),
      apiFetch('/api/employers'),
      apiFetch('/api/workers')
    ]);

    setContracts(contractData);
    setEmployers(employersData);
    setWorkers(workersData);
  };

  const loadAttendances = async (contractId, month) => {
    if (!contractId || !month) {
      setEntriesByDate({});
      return;
    }

    const searchParams = new URLSearchParams({ month });
    const attendanceData = await apiFetch(`/api/contracts/${contractId}/attendances?${searchParams.toString()}`);

    const normalized = Object.fromEntries(
      attendanceData.map((entry) => {
        const dateKey = toDateKey(new Date(entry.date));
        return [dateKey, entry];
      })
    );

    setEntriesByDate(normalized);
  };

  const loadSchedule = async (contractId) => {
    if (!contractId) {
      setSchedule(defaultSchedule);
      return;
    }

    const scheduleData = await apiFetch(`/api/contracts/${contractId}/schedule`);
    setSchedule({ ...defaultSchedule, ...scheduleData });
  };

  const loadJustificationTypes = async () => {
    const types = await apiFetch('/api/justification-types');
    setJustificationTypes(types);
  };

  useEffect(() => {
    const initialLoad = async () => {
      try {
        setLoading(true);
        setError('');
        await Promise.all([loadContracts(), loadJustificationTypes()]);
      } catch (loadError) {
        setError(`Non siamo riusciti a caricare i dati iniziali. ${loadError.message}`);
      } finally {
        setLoading(false);
      }
    };

    initialLoad();
  }, []);

  useEffect(() => {
    const syncAttendancesAndSchedule = async () => {
      try {
        setLoading(true);
        setError('');
        await Promise.all([
          loadAttendances(selectedContractId, selectedMonth),
          loadSchedule(selectedContractId)
        ]);
      } catch (loadError) {
        setError(`Non siamo riusciti a caricare presenze o preventivo. ${loadError.message}`);
      } finally {
        setLoading(false);
      }
    };

    syncAttendancesAndSchedule();
  }, [selectedContractId, selectedMonth]);

  const openDayModal = async (day) => {
    setSelectedDay(day);
    setWorkedInput(minutesToHHMM(day.workedMinutes));
    setNoteInput(day.note || '');
    setJustificationRows(toJustificationRows(day.justifications));

    if (!selectedContractId) return;

    try {
      const rows = await apiFetch(`/api/contracts/${selectedContractId}/attendances/${day.dateKey}/justifications`);
      setJustificationRows(rows.length > 0 ? toJustificationRows(rows) : []);
    } catch (loadError) {
      setError(`Non siamo riusciti a caricare i giustificativi del giorno. ${loadError.message}`);
    }
  };

  const handleAddJustificationRow = () => {
    setJustificationRows((prev) => [...prev, emptyJustificationRow()]);
  };

  const updateJustificationRow = (rowId, field, value) => {
    setJustificationRows((prev) => prev.map((row) => (row.rowId === rowId ? { ...row, [field]: value } : row)));
  };

  const removeJustificationRow = (rowId) => {
    setJustificationRows((prev) => prev.filter((row) => row.rowId !== rowId));
  };

  const handleSaveDay = async () => {
    if (!selectedContractId || !selectedDay) return;

    const dateKey = selectedDay.dateKey;

    const workedMinutes = parseDurationInputToMinutes(workedInput);
    if (workedMinutes === null) {
      setError('Formato ore lavorate non valido. Usa HH:MM o H.MM (es. 08:30, 1.30, 3).');
      return;
    }

    const justificationItems = [];

    for (const row of justificationRows) {
      const isEmptyRow = !row.justificationTypeId && !String(row.minutesInput || '').trim() && !String(row.note || '').trim();
      if (isEmptyRow) {
        continue;
      }

      if (!row.justificationTypeId) {
        setError('Seleziona un tipo per ogni giustificativo.');
        return;
      }

      const parsedMinutes = parseDurationInputToMinutes(row.minutesInput);
      if (parsedMinutes === null || parsedMinutes < 0 || parsedMinutes > 1440) {
        setError('Ogni giustificativo deve avere una durata valida tra 00:00 e 24:00.');
        return;
      }

      justificationItems.push({
        justificationTypeId: Number(row.justificationTypeId),
        minutes: parsedMinutes,
        note: row.note.trim() || null
      });
    }

    try {
      setSaving(true);
      setError('');

      const attendancePayload = {
        workedMinutes,
        note: noteInput.trim() || null
      };

      const savedAttendance = await apiFetch(`/api/contracts/${selectedContractId}/attendances/${dateKey}`, {
        method: 'PUT',
        body: JSON.stringify(attendancePayload)
      });

      const savedJustifications = await apiFetch(`/api/contracts/${selectedContractId}/attendances/${dateKey}/justifications`, {
        method: 'PUT',
        body: JSON.stringify({ items: justificationItems })
      });

      setEntriesByDate((prev) => ({
        ...prev,
        [dateKey]: {
          ...(prev[dateKey] || {}),
          ...attendancePayload,
          ...(savedAttendance || {}),
          date: savedAttendance?.date || dateKey,
          justifications: savedJustifications || []
        }
      }));

      setSelectedDay(null);
    } catch (saveError) {
      setError(`Non siamo riusciti a salvare la giornata. ${saveError.message}`);
    } finally {
      setSaving(false);
    }
  };

  const selectedContractLabel = selectedContract
    ? getContractLabel(selectedContract, employersById, workersById)
    : 'Nessun contratto selezionato';

  return (
    <div className="space-y-4">
      {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

      <div className="grid gap-3 rounded-xl border border-slate-200 bg-white p-4 sm:grid-cols-2 xl:grid-cols-5">
        <div className="space-y-1 sm:col-span-2 xl:col-span-1">
          <label className="text-xs font-medium uppercase tracking-wide text-slate-500">Contratto</label>
          <Select
            value={selectedContractId}
            onChange={(event) => {
              const nextContractId = event.target.value;
              setSelectedContractId(nextContractId);
            }}
          >
            <option value="">Seleziona contratto</option>
            {contracts.map((contract) => (
              <option key={contract.id} value={contract.id}>
                {getContractLabel(contract, employersById, workersById)}
              </option>
            ))}
          </Select>
        </div>

        <div className="rounded-lg bg-slate-50 p-3">
          <p className="text-xs uppercase tracking-wide text-slate-500">Ore ordinarie mese</p>
          <p className="text-xl font-semibold text-slate-900">{minutesToHHMM(monthlyTotals.ordinaryMinutes)}</p>
        </div>
        <div className="rounded-lg bg-slate-50 p-3">
          <p className="text-xs uppercase tracking-wide text-slate-500">Ore straordinarie mese</p>
          <p className="text-xl font-semibold text-slate-900">{minutesToHHMM(monthlyTotals.overtimeMinutes)}</p>
        </div>
        <div className="rounded-lg bg-slate-50 p-3">
          <p className="text-xs uppercase tracking-wide text-slate-500">Totale ore mese</p>
          <p className="text-xl font-semibold text-slate-900">{minutesToHHMM(monthlyTotals.workedTotalMinutes)}</p>
        </div>
        <div className="rounded-lg bg-slate-50 p-3">
          <p className="text-xs uppercase tracking-wide text-slate-500">Ore previste mese</p>
          <p className="text-xl font-semibold text-slate-900">{monthlyTotals.orePreviste.toFixed(2)}</p>
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-3">
        <p className="text-xs uppercase tracking-wide text-slate-500">Previsto mese</p>
        <p className="text-xl font-semibold text-slate-900">{minutesToHHMM(monthlyTotals.previstoMeseMinuti)}</p>
      </div>

      {monthlyTotals.beyondThreshold && (
        <p className="rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-700">Ore oltre soglia</p>
      )}

      <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-3">
        <Button variant="secondary" onClick={() => setSelectedMonth((prev) => shiftMonth(prev, -1))}>&lt;</Button>
        <p className="text-base font-semibold capitalize text-slate-900">{formatMonthLabel(selectedMonth)}</p>
        <Button variant="secondary" onClick={() => setSelectedMonth((prev) => shiftMonth(prev, 1))}>&gt;</Button>
      </div>

      <div className="grid gap-3 rounded-xl border border-slate-200 bg-white p-4 sm:grid-cols-3">
        <div className="sm:col-span-2">
          <p className="text-xs uppercase tracking-wide text-slate-500">Contratto selezionato</p>
          <p className="text-sm font-medium text-slate-900">{selectedContractLabel}</p>
        </div>
        <div>
          <p className="text-xs uppercase tracking-wide text-slate-500">Mese</p>
          <p className="text-sm font-medium capitalize text-slate-900">{formatMonthLabel(selectedMonth)}</p>
          <p className="mt-1 text-xs text-slate-600">Giorni registrati: {Object.keys(entriesByDate).length}</p>
        </div>
      </div>

      {!selectedContractId ? (
        <EmptyState title="Seleziona un contratto per vedere le presenze" />
      ) : (
        <div className="space-y-3 rounded-xl border border-slate-200 bg-white p-4">
          <div className="grid grid-cols-7 gap-2">
            {weekdayLabels.map((label) => (
              <p key={label} className="text-center text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p>
            ))}
          </div>

          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7">
            {monthDays.map((day) => (
              <button
                key={day.key}
                type="button"
                className="rounded-lg border border-slate-200 bg-slate-50 p-2 text-left transition hover:border-slate-300 hover:bg-slate-100"
                onClick={() => openDayModal(day)}
              >
                <p className="text-sm font-semibold text-slate-900">{day.dayOfMonth} · {weekdayLabels[day.weekday]}</p>
                <p className="mt-1 text-xs text-slate-700">Previsto: {minutesToHHMM(day.plannedMinutes)}</p>
                <p className="mt-1 text-xs text-slate-700">Lavorato: {minutesToHHMM(day.workedMinutes)}</p>
                {day.missingMinutes > 0 && (
                  <span
                    className={`mt-1 inline-flex rounded-full px-2 py-0.5 text-[11px] font-semibold ${day.uncoveredMinutes > 0 ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'}`}
                  >
                    {day.uncoveredMinutes > 0 ? 'Scoperto' : 'OK'}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      )}

      <Modal
        isOpen={Boolean(selectedDay)}
        title={selectedDay ? `Giorno: ${formatDayLabel(selectedDay.date)}` : 'Giorno'}
        onClose={() => setSelectedDay(null)}
      >
        <div className="space-y-4">
          <div className="grid gap-2 rounded-lg bg-slate-50 p-3 text-sm text-slate-700 sm:grid-cols-2">
            <p>Previsto: <span className="font-semibold">{minutesToHHMM(dayCoverageSummary.plannedMinutes)}</span></p>
            <p>Lavorato: <span className="font-semibold">{minutesToHHMM(dayCoverageSummary.workedMinutes)}</span></p>
            <p>Mancanti: <span className="font-semibold">{minutesToHHMM(dayCoverageSummary.missingMinutes)}</span></p>
            <p>Coperto: <span className="font-semibold">{minutesToHHMM(dayCoverageSummary.coveredMinutes)}</span></p>
            <p className="sm:col-span-2">Scoperto: <span className="font-semibold">{minutesToHHMM(dayCoverageSummary.uncoveredMinutes)}</span></p>
          </div>

          {dayCoverageSummary.uncoveredMinutes > 0 && (
            <p className="rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-700">
              Ore non coperte: {minutesToHHMM(dayCoverageSummary.uncoveredMinutes)}
            </p>
          )}

          <div className="space-y-1">
            <label className="text-xs font-medium uppercase tracking-wide text-slate-500">Ore lavorate (HH:MM o H.MM)</label>
            <Input value={workedInput} onChange={(event) => setWorkedInput(event.target.value)} placeholder="08:00 o 1.30" />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium uppercase tracking-wide text-slate-500">Note (opzionale)</label>
            <textarea
              value={noteInput}
              onChange={(event) => setNoteInput(event.target.value)}
              rows={3}
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 shadow-sm placeholder:text-slate-400"
              placeholder="Inserisci una nota"
            />
          </div>

          <div className="space-y-2 rounded-lg border border-slate-200 p-3">
            <div className="flex items-center justify-between">
              <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Giustificativi</p>
              <Button variant="secondary" onClick={handleAddJustificationRow}>+ Aggiungi giustificativo</Button>
            </div>

            {justificationRows.length === 0 ? (
              <p className="text-sm text-slate-600">Nessun giustificativo inserito.</p>
            ) : (
              <div className="space-y-2">
                {justificationRows.map((row) => (
                  <div key={row.rowId} className="grid gap-2 rounded-lg border border-slate-200 p-2 sm:grid-cols-12">
                    <div className="sm:col-span-4">
                      <Select
                        value={row.justificationTypeId}
                        onChange={(event) => updateJustificationRow(row.rowId, 'justificationTypeId', event.target.value)}
                      >
                        <option value="">Tipo giustificativo</option>
                        {justificationTypes.map((type) => (
                          <option key={type.id} value={type.id}>{type.label}</option>
                        ))}
                      </Select>
                    </div>

                    <div className="sm:col-span-3">
                      <Input
                        value={row.minutesInput}
                        onChange={(event) => updateJustificationRow(row.rowId, 'minutesInput', event.target.value)}
                        placeholder="HH:MM o 1.30"
                      />
                    </div>

                    <div className="sm:col-span-4">
                      <Input
                        value={row.note}
                        onChange={(event) => updateJustificationRow(row.rowId, 'note', event.target.value)}
                        placeholder="Nota opzionale"
                      />
                    </div>

                    <div className="sm:col-span-1">
                      <Button variant="ghost" onClick={() => removeJustificationRow(row.rowId)}>✕</Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setSelectedDay(null)} disabled={saving}>Annulla</Button>
            <Button onClick={handleSaveDay} disabled={saving}>{saving ? 'Salvataggio...' : 'Salva'}</Button>
          </div>
        </div>
      </Modal>

      {loading && <p className="rounded-lg bg-slate-100 px-3 py-2 text-sm text-slate-700">Caricamento presenze...</p>}
    </div>
  );
}
