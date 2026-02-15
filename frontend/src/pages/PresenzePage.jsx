import { useEffect, useState } from 'react';
import { apiFetch } from '../lib/api';
import { Button } from '../components/ui/Button';
import { EmptyState } from '../components/ui/EmptyState';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';

const initialForm = { contractId: '', data: '', oreOrdinarie: 8, oreStraordinario: 0, causale: 'ordinaria', note: '', validatoFlag: false };

export function PresenzePage() {
  const [contracts, setContracts] = useState([]);
  const [entries, setEntries] = useState([]);
  const [form, setForm] = useState(initialForm);

  const load = async () => {
    const [contractData, attendanceData] = await Promise.all([apiFetch('/api/contracts'), apiFetch('/api/attendances')]);
    setContracts(contractData);
    setEntries(attendanceData);
  };

  useEffect(() => { load(); }, []);

  const save = async (event) => {
    event.preventDefault();
    await apiFetch('/api/attendances', {
      method: 'POST',
      body: JSON.stringify({ ...form, contractId: Number(form.contractId), oreOrdinarie: Number(form.oreOrdinarie), oreStraordinario: Number(form.oreStraordinario), note: form.note || null })
    });
    setForm(initialForm);
    await load();
  };

  return (
    <div className="space-y-4">
      <form onSubmit={save} className="grid gap-3 rounded-xl border border-slate-200 bg-white p-4 md:grid-cols-3">
        <Select value={form.contractId} onChange={(e) => setForm((p) => ({ ...p, contractId: e.target.value }))} required>
          <option value="">Contratto</option>
          {contracts.map((contract) => <option key={contract.id} value={contract.id}>Contratto #{contract.id}</option>)}
        </Select>
        <Input type="date" value={form.data} onChange={(e) => setForm((p) => ({ ...p, data: e.target.value }))} required />
        <Input type="number" value={form.oreOrdinarie} onChange={(e) => setForm((p) => ({ ...p, oreOrdinarie: e.target.value }))} required />
        <Input type="number" value={form.oreStraordinario} onChange={(e) => setForm((p) => ({ ...p, oreStraordinario: e.target.value }))} />
        <Input placeholder="Causale" value={form.causale} onChange={(e) => setForm((p) => ({ ...p, causale: e.target.value }))} required />
        <Button className="md:col-span-3" type="submit">Salva presenza</Button>
      </form>

      {!entries.length ? <EmptyState title="Nessuna presenza" description="Registra una presenza per popolare l'elenco." /> : (
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-50 text-left text-slate-500"><tr><th className="px-4 py-3">Data</th><th className="px-4 py-3">Contratto</th><th className="px-4 py-3">Ore ord.</th><th className="px-4 py-3">Straord.</th><th className="px-4 py-3">Causale</th></tr></thead>
            <tbody>{entries.map((entry) => <tr key={entry.id} className="border-t border-slate-200"><td className="px-4 py-3">{new Date(entry.data).toLocaleDateString('it-IT')}</td><td className="px-4 py-3">#{entry.contractId}</td><td className="px-4 py-3">{entry.oreOrdinarie}</td><td className="px-4 py-3">{entry.oreStraordinario}</td><td className="px-4 py-3">{entry.causale}</td></tr>)}</tbody>
          </table>
        </div>
      )}
    </div>
  );
}
