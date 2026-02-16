import { useEffect, useMemo, useState } from 'react';
import { apiFetch } from '../lib/api';
import { Button } from '../components/ui/Button';
import { EmptyState } from '../components/ui/EmptyState';
import { Badge } from '../components/ui/Badge';
import { Select } from '../components/ui/Select';

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
            <p><span className="font-medium text-slate-700">Paga:</span> {formatCurrency(selectedContract.baseSalary)}</p>
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
    </div>
  );
}
