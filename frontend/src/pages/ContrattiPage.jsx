import { useEffect, useState } from 'react';
import { apiFetch } from '../lib/api';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { EmptyState } from '../components/ui/EmptyState';

const initialForm = { employerId: '', workerId: '', tipoRapporto: 'Tempo indeterminato', livello: 'BS', mansione: '', oreSettimanali: 25, retribuzioneBase: 1100, dataInizio: '', dataFine: '', statoContratto: 'attivo' };

export function ContrattiPage() {
  const [contracts, setContracts] = useState([]);
  const [employers, setEmployers] = useState([]);
  const [workers, setWorkers] = useState([]);
  const [form, setForm] = useState(initialForm);

  const load = async () => {
    const [c, e, w] = await Promise.all([apiFetch('/api/contracts'), apiFetch('/api/employers'), apiFetch('/api/workers')]);
    setContracts(c);
    setEmployers(e);
    setWorkers(w);
  };

  useEffect(() => { load(); }, []);

  const onSubmit = async (event) => {
    event.preventDefault();
    await apiFetch('/api/contracts', {
      method: 'POST',
      body: JSON.stringify({ ...form, employerId: Number(form.employerId), workerId: Number(form.workerId), oreSettimanali: Number(form.oreSettimanali), retribuzioneBase: Number(form.retribuzioneBase), convivenzaFlag: false, dataFine: form.dataFine || null })
    });
    setForm(initialForm);
    await load();
  };

  return (
    <div className="space-y-4">
      <form onSubmit={onSubmit} className="grid gap-3 rounded-xl border border-slate-200 bg-white p-4 md:grid-cols-3">
        <Select value={form.employerId} onChange={(e) => setForm((p) => ({ ...p, employerId: e.target.value }))} required>
          <option value="">Datore</option>
          {employers.map((employer) => <option key={employer.id} value={employer.id}>{employer.nome} {employer.cognomeRagione}</option>)}
        </Select>
        <Select value={form.workerId} onChange={(e) => setForm((p) => ({ ...p, workerId: e.target.value }))} required>
          <option value="">Lavoratore</option>
          {workers.map((worker) => <option key={worker.id} value={worker.id}>{worker.nome} {worker.cognome}</option>)}
        </Select>
        <Input placeholder="Mansione" value={form.mansione} onChange={(e) => setForm((p) => ({ ...p, mansione: e.target.value }))} required />
        <Input type="number" placeholder="Ore settimanali" value={form.oreSettimanali} onChange={(e) => setForm((p) => ({ ...p, oreSettimanali: e.target.value }))} required />
        <Input type="number" placeholder="Retribuzione base" value={form.retribuzioneBase} onChange={(e) => setForm((p) => ({ ...p, retribuzioneBase: e.target.value }))} required />
        <Input type="date" value={form.dataInizio} onChange={(e) => setForm((p) => ({ ...p, dataInizio: e.target.value }))} required />
        <Button className="md:col-span-3" type="submit">Crea contratto</Button>
      </form>

      {!contracts.length ? <EmptyState title="Nessun contratto" description="Crea il primo contratto con il form qui sopra." /> : (
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-50 text-left text-slate-500"><tr><th className="px-4 py-3">Datore</th><th className="px-4 py-3">Lavoratore</th><th className="px-4 py-3">Mansione</th><th className="px-4 py-3">Stato</th><th className="px-4 py-3">Azioni</th></tr></thead>
            <tbody>
              {contracts.map((contract) => <tr key={contract.id} className="border-t border-slate-200"><td className="px-4 py-3">#{contract.employerId}</td><td className="px-4 py-3">#{contract.workerId}</td><td className="px-4 py-3">{contract.mansione}</td><td className="px-4 py-3">{contract.statoContratto}</td><td className="px-4 py-3"><Button variant="danger" onClick={async () => { await apiFetch(`/api/contracts/${contract.id}`, { method: 'DELETE' }); load(); }}>Elimina</Button></td></tr>)}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
