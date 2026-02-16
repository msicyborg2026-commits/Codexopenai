import { useEffect, useMemo, useState } from 'react';
import { apiFetch } from '../lib/api';
import { Button } from '../components/ui/Button';
import { EmptyState } from '../components/ui/EmptyState';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';

const initialForm = {
  contractId: '',
  data: '',
  oreOrdinarie: 8,
  oreStraordinario: 0,
  causale: 'ordinaria',
  note: '',
  validatoFlag: false
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
  const date = new Date(year, (month - 1) + delta, 1);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
};

const toHours = (value) => {
  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
};

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

export function PresenzePage() {
  const [contracts, setContracts] = useState([]);
  const [employers, setEmployers] = useState([]);
  const [workers, setWorkers] = useState([]);
  const [entries, setEntries] = useState([]);
  const [form, setForm] = useState(initialForm);
  const [selectedContractId, setSelectedContractId] = useState('');
  const [selectedMonth, setSelectedMonth] = useState(getCurrentMonth());
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

  const monthlyTotals = useMemo(() => {
    const oreOrdinarie = entries.reduce((sum, entry) => sum + toHours(entry.oreOrdinarie), 0);
    const oreStraordinario = entries.reduce((sum, entry) => sum + toHours(entry.oreStraordinario), 0);
    const totale = oreOrdinarie + oreStraordinario;
    const orePreviste = toHours(selectedContract?.weeklyHours) * 4.33;
    const beyondThreshold = orePreviste > 0 && totale > orePreviste;

    return { oreOrdinarie, oreStraordinario, totale, orePreviste, beyondThreshold };
  }, [entries, selectedContract?.weeklyHours]);

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
      setEntries([]);
      return;
    }

    const searchParams = new URLSearchParams({ contractId: String(contractId), month });
    const attendanceData = await apiFetch(`/api/attendances?${searchParams.toString()}`);
    setEntries(attendanceData);
  };

  useEffect(() => {
    const initialLoad = async () => {
      try {
        setLoading(true);
        setError('');
        await loadContracts();
      } catch (loadError) {
        setError(`Non siamo riusciti a caricare i contratti. ${loadError.message}`);
      } finally {
        setLoading(false);
      }
    };

    initialLoad();
  }, []);

  useEffect(() => {
    const syncAttendances = async () => {
      try {
        setLoading(true);
        setError('');
        await loadAttendances(selectedContractId, selectedMonth);
      } catch (loadError) {
        setError(`Non siamo riusciti a caricare le presenze. ${loadError.message}`);
      } finally {
        setLoading(false);
      }
    };

    syncAttendances();
  }, [selectedContractId, selectedMonth]);

  const save = async (event) => {
    event.preventDefault();

    try {
      setSaving(true);
      setError('');

      await apiFetch('/api/attendances', {
        method: 'POST',
        body: JSON.stringify({
          ...form,
          contractId: Number(form.contractId),
          oreOrdinarie: Number(form.oreOrdinarie),
          oreStraordinario: Number(form.oreStraordinario),
          note: form.note || null
        })
      });

      setForm((prev) => ({ ...initialForm, contractId: prev.contractId }));

      const monthFromSavedDate = form.data ? form.data.slice(0, 7) : selectedMonth;
      setSelectedContractId(form.contractId);
      setSelectedMonth(monthFromSavedDate);
      await loadAttendances(form.contractId, monthFromSavedDate);
    } catch (saveError) {
      setError(`Non siamo riusciti a salvare la presenza. ${saveError.message}`);
    } finally {
      setSaving(false);
    }
  };

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
              setForm((prev) => ({ ...prev, contractId: nextContractId }));
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
          <p className="text-xl font-semibold text-slate-900">{monthlyTotals.oreOrdinarie.toFixed(2)}</p>
        </div>
        <div className="rounded-lg bg-slate-50 p-3">
          <p className="text-xs uppercase tracking-wide text-slate-500">Ore straordinarie mese</p>
          <p className="text-xl font-semibold text-slate-900">{monthlyTotals.oreStraordinario.toFixed(2)}</p>
        </div>
        <div className="rounded-lg bg-slate-50 p-3">
          <p className="text-xs uppercase tracking-wide text-slate-500">Totale ore mese</p>
          <p className="text-xl font-semibold text-slate-900">{monthlyTotals.totale.toFixed(2)}</p>
        </div>
        <div className="rounded-lg bg-slate-50 p-3">
          <p className="text-xs uppercase tracking-wide text-slate-500">Ore previste mese</p>
          <p className="text-xl font-semibold text-slate-900">{monthlyTotals.orePreviste.toFixed(2)}</p>
        </div>
      </div>

      {monthlyTotals.beyondThreshold && (
        <p className="rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-700">Ore oltre soglia</p>
      )}

      <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-3">
        <Button variant="secondary" onClick={() => setSelectedMonth((prev) => shiftMonth(prev, -1))}>&lt;</Button>
        <p className="text-base font-semibold capitalize text-slate-900">{formatMonthLabel(selectedMonth)}</p>
        <Button variant="secondary" onClick={() => setSelectedMonth((prev) => shiftMonth(prev, 1))}>&gt;</Button>
      </div>

      <form onSubmit={save} className="grid gap-3 rounded-xl border border-slate-200 bg-white p-4 md:grid-cols-3">
        <Select value={form.contractId} onChange={(e) => setForm((p) => ({ ...p, contractId: e.target.value }))} required>
          <option value="">Contratto</option>
          {contracts.map((contract) => (
            <option key={contract.id} value={contract.id}>
              {getContractLabel(contract, employersById, workersById)}
            </option>
          ))}
        </Select>
        <Input type="date" value={form.data} onChange={(e) => setForm((p) => ({ ...p, data: e.target.value }))} required />
        <Input type="number" value={form.oreOrdinarie} onChange={(e) => setForm((p) => ({ ...p, oreOrdinarie: e.target.value }))} required />
        <Input type="number" value={form.oreStraordinario} onChange={(e) => setForm((p) => ({ ...p, oreStraordinario: e.target.value }))} />
        <Input placeholder="Causale" value={form.causale} onChange={(e) => setForm((p) => ({ ...p, causale: e.target.value }))} required />
        <Button className="md:col-span-3" type="submit" disabled={saving}>{saving ? 'Salvataggio...' : 'Salva presenza'}</Button>
      </form>

      {!selectedContractId ? <EmptyState title="Seleziona un contratto" description="Scegli un contratto per visualizzare le presenze mensili." /> : !entries.length ? <EmptyState title="Nessuna presenza" description="Registra una presenza per popolare l'elenco." /> : (
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-50 text-left text-slate-500"><tr><th className="px-4 py-3">Data</th><th className="px-4 py-3">Contratto</th><th className="px-4 py-3">Ore ord.</th><th className="px-4 py-3">Straord.</th><th className="px-4 py-3">Causale</th></tr></thead>
            <tbody>{entries.map((entry) => <tr key={entry.id} className="border-t border-slate-200"><td className="px-4 py-3">{new Date(entry.data).toLocaleDateString('it-IT')}</td><td className="px-4 py-3">#{entry.contractId}</td><td className="px-4 py-3">{entry.oreOrdinarie}</td><td className="px-4 py-3">{entry.oreStraordinario}</td><td className="px-4 py-3">{entry.causale}</td></tr>)}</tbody>
          </table>
        </div>
      )}

      {loading && <p className="rounded-lg bg-slate-100 px-3 py-2 text-sm text-slate-700">Caricamento presenze...</p>}
    </div>
  );
}
