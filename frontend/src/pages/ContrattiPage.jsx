import { useEffect, useState } from 'react';
import { apiFetch } from '../lib/api';
import { Button } from '../components/ui/Button';
import { EmptyState } from '../components/ui/EmptyState';

export function ContrattiPage({ onCreateContract }) {
  const [contracts, setContracts] = useState([]);

  const loadContracts = async () => {
    const loadedContracts = await apiFetch('/api/contracts');
    setContracts(loadedContracts);
  };

  useEffect(() => {
    loadContracts();
  }, []);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-end">
        <Button onClick={onCreateContract}>Crea contratto</Button>
      </div>

      {!contracts.length ? <EmptyState title="Nessun contratto" description="Premi “Crea contratto” per avviare il wizard." /> : (
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-50 text-left text-slate-500"><tr><th className="px-4 py-3">Datore</th><th className="px-4 py-3">Lavoratore</th><th className="px-4 py-3">Mansione</th><th className="px-4 py-3">Stato</th><th className="px-4 py-3">Azioni</th></tr></thead>
            <tbody>
              {contracts.map((contract) => <tr key={contract.id} className="border-t border-slate-200"><td className="px-4 py-3">#{contract.employerId}</td><td className="px-4 py-3">#{contract.workerId}</td><td className="px-4 py-3">{contract.mansione}</td><td className="px-4 py-3">{contract.statoContratto}</td><td className="px-4 py-3"><Button variant="danger" onClick={async () => { await apiFetch(`/api/contracts/${contract.id}`, { method: 'DELETE' }); loadContracts(); }}>Elimina</Button></td></tr>)}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
