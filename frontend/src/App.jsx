import { useEffect, useMemo, useState } from 'react';
import { z } from 'zod';
import { apiFetch } from './lib/api';

const sections = ['Panoramica', 'Datori', 'Lavoratori', 'Contratti', 'Presenze'];

const cardStyle = 'bg-white rounded-2xl shadow-sm border border-slate-200 p-4';

const emptyState = (message) => <p className="text-slate-500 text-sm">{message}</p>;

function CrudSection({ title, endpoint, schema, fields }) {
  const [items, setItems] = useState([]);
  const [form, setForm] = useState(fields.reduce((acc, f) => ({ ...acc, [f.name]: f.default || '' }), {}));
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      setItems(await apiFetch(endpoint));
      setError('');
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [endpoint]);

  const submit = async (e) => {
    e.preventDefault();
    try {
      const parsed = schema.parse(form);
      if (editingId) await apiFetch(`${endpoint}/${editingId}`, { method: 'PUT', body: JSON.stringify(parsed) });
      else await apiFetch(endpoint, { method: 'POST', body: JSON.stringify(parsed) });
      setForm(fields.reduce((acc, f) => ({ ...acc, [f.name]: f.default || '' }), {}));
      setEditingId(null);
      load();
    } catch (err) {
      setError(err.message);
    }
  };

  const edit = (item) => {
    setForm(fields.reduce((acc, f) => ({ ...acc, [f.name]: item[f.name] ?? '' }), {}));
    setEditingId(item.id);
  };

  return (
    <div className="grid md:grid-cols-2 gap-4">
      <div className={cardStyle}>
        <h2 className="text-lg font-semibold mb-3">{title}</h2>
        <form onSubmit={submit} className="space-y-2">
          {fields.map((field) => (
            <input
              key={field.name}
              type={field.type || 'text'}
              value={form[field.name]}
              onChange={(e) => setForm({ ...form, [field.name]: field.type === 'checkbox' ? e.target.checked : e.target.value })}
              placeholder={field.label}
              className="w-full border rounded-lg px-3 py-2"
            />
          ))}
          <button className="bg-slate-900 text-white px-4 py-2 rounded-lg">{editingId ? 'Aggiorna' : 'Crea'}</button>
        </form>
      </div>
      <div className={cardStyle}>
        {loading && <p>Caricamento...</p>}
        {error && <p className="text-red-600 text-sm">Errore: {error}</p>}
        {!loading && !items.length && emptyState('Nessun elemento presente, aggiungine uno.')}
        <ul className="space-y-2 max-h-[480px] overflow-auto">
          {items.map((item) => (
            <li key={item.id} className="border rounded-lg p-3 flex justify-between items-start gap-2">
              <pre className="text-xs whitespace-pre-wrap">{JSON.stringify(item, null, 2)}</pre>
              <div className="space-y-2">
                <button onClick={() => edit(item)} className="text-sm bg-slate-200 px-2 py-1 rounded">Modifica</button>
                <button onClick={async () => { await apiFetch(`${endpoint}/${item.id}`, { method: 'DELETE' }); load(); }} className="text-sm bg-red-100 text-red-700 px-2 py-1 rounded">Elimina</button>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function ContractWizard({ employers, workers, onCreated }) {
  const steps = ['Associazioni', 'Dettagli rapporto', 'Orario e paga', 'Date e stato', 'Riepilogo'];
  const [step, setStep] = useState(0);
  const [error, setError] = useState('');
  const [form, setForm] = useState({ employerId: '', workerId: '', tipoRapporto: 'Tempo indeterminato', livello: 'BS', mansione: '', convivenzaFlag: false, oreSettimanali: 25, retribuzioneBase: 1100, dataInizio: '', dataFine: '', statoContratto: 'attivo' });

  const submit = async () => {
    try {
      await apiFetch('/api/contracts', {
        method: 'POST',
        body: JSON.stringify({ ...form, employerId: Number(form.employerId), workerId: Number(form.workerId), oreSettimanali: Number(form.oreSettimanali), retribuzioneBase: Number(form.retribuzioneBase), dataFine: form.dataFine || null })
      });
      setStep(0);
      setError('');
      onCreated();
    } catch (e) {
      setError(e.message);
    }
  };

  return (
    <div className={cardStyle}>
      <h3 className="font-semibold mb-2">Wizard Contratto guidato</h3>
      <div className="h-2 bg-slate-100 rounded-full mb-4">
        <div className="h-2 bg-emerald-500 rounded-full" style={{ width: `${((step + 1) / steps.length) * 100}%` }} />
      </div>
      <p className="text-sm mb-3">Step {step + 1}/{steps.length}: {steps[step]}</p>
      {step === 0 && <div className="grid gap-2"><select className="border rounded-lg p-2" value={form.employerId} onChange={(e) => setForm({ ...form, employerId: e.target.value })}><option value="">Seleziona datore</option>{employers.map((e) => <option key={e.id} value={e.id}>{e.nome} {e.cognomeRagione}</option>)}</select><select className="border rounded-lg p-2" value={form.workerId} onChange={(e) => setForm({ ...form, workerId: e.target.value })}><option value="">Seleziona lavoratore</option>{workers.map((w) => <option key={w.id} value={w.id}>{w.nome} {w.cognome}</option>)}</select></div>}
      {step === 1 && <div className="grid gap-2"><input className="border rounded-lg p-2" value={form.tipoRapporto} onChange={(e) => setForm({ ...form, tipoRapporto: e.target.value })} placeholder="Tipo rapporto" /><input className="border rounded-lg p-2" value={form.livello} onChange={(e) => setForm({ ...form, livello: e.target.value })} placeholder="Livello" /><input className="border rounded-lg p-2" value={form.mansione} onChange={(e) => setForm({ ...form, mansione: e.target.value })} placeholder="Mansione" /><label className="text-sm"><input type="checkbox" checked={form.convivenzaFlag} onChange={(e) => setForm({ ...form, convivenzaFlag: e.target.checked })} /> Convivenza</label></div>}
      {step === 2 && <div className="grid gap-2"><input type="number" className="border rounded-lg p-2" value={form.oreSettimanali} onChange={(e) => setForm({ ...form, oreSettimanali: e.target.value })} placeholder="Ore settimanali" /><input type="number" className="border rounded-lg p-2" value={form.retribuzioneBase} onChange={(e) => setForm({ ...form, retribuzioneBase: e.target.value })} placeholder="Retribuzione base" /></div>}
      {step === 3 && <div className="grid gap-2"><input type="date" className="border rounded-lg p-2" value={form.dataInizio} onChange={(e) => setForm({ ...form, dataInizio: e.target.value })} /><input type="date" className="border rounded-lg p-2" value={form.dataFine} onChange={(e) => setForm({ ...form, dataFine: e.target.value })} /><input className="border rounded-lg p-2" value={form.statoContratto} onChange={(e) => setForm({ ...form, statoContratto: e.target.value })} placeholder="Stato contratto" /></div>}
      {step === 4 && <pre className="text-xs bg-slate-50 border rounded-lg p-3">{JSON.stringify(form, null, 2)}</pre>}
      {error && <p className="text-red-600 text-sm mt-2">{error}</p>}
      <div className="flex gap-2 mt-4">
        <button disabled={step === 0} onClick={() => setStep((s) => s - 1)} className="px-3 py-2 rounded-lg border disabled:opacity-50">Indietro</button>
        {step < steps.length - 1 ? (
          <button onClick={() => setStep((s) => s + 1)} className="px-3 py-2 rounded-lg bg-slate-900 text-white">Avanti</button>
        ) : (
          <button onClick={submit} className="px-3 py-2 rounded-lg bg-emerald-600 text-white">Conferma e crea</button>
        )}
      </div>
    </div>
  );
}

function AttendanceSection() {
  const [contracts, setContracts] = useState([]);
  const [selectedContract, setSelectedContract] = useState('');
  const [month, setMonth] = useState(new Date().toISOString().slice(0, 7));
  const [entries, setEntries] = useState([]);
  const [form, setForm] = useState({ date: '', oreOrdinarie: 0, oreStraordinario: 0, causale: 'presenza', note: '', validatoFlag: false });
  const [message, setMessage] = useState('');

  useEffect(() => { apiFetch('/api/contracts').then(setContracts); }, []);

  const load = async (contractId = selectedContract) => {
    if (!contractId) return;
    const rows = await apiFetch(`/api/contracts/${contractId}/attendances?month=${month}`);
    setEntries(rows);
  };

  useEffect(() => { load(); }, [selectedContract, month]);

  return <div className="grid md:grid-cols-2 gap-4"><div className={cardStyle}><h2 className="font-semibold mb-3">Presenze mensili</h2><select className="border rounded-lg p-2 w-full mb-2" value={selectedContract} onChange={(e) => setSelectedContract(e.target.value)}><option value="">Seleziona contratto</option>{contracts.map((c) => <option key={c.id} value={c.id}>Contratto #{c.id}</option>)}</select><input type="month" className="border rounded-lg p-2 w-full mb-2" value={month} onChange={(e) => setMonth(e.target.value)} /><div className="space-y-2"><input type="date" className="border rounded-lg p-2 w-full" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} /><input type="number" className="border rounded-lg p-2 w-full" value={form.oreOrdinarie} onChange={(e) => setForm({ ...form, oreOrdinarie: Number(e.target.value) })} placeholder="Ore ordinarie" /><input type="number" className="border rounded-lg p-2 w-full" value={form.oreStraordinario} onChange={(e) => setForm({ ...form, oreStraordinario: Number(e.target.value) })} placeholder="Ore straordinario" /><select className="border rounded-lg p-2 w-full" value={form.causale} onChange={(e) => setForm({ ...form, causale: e.target.value })}><option>presenza</option><option>ferie</option><option>malattia</option><option>permesso</option><option>festività</option><option>altro</option></select><input className="border rounded-lg p-2 w-full" value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} placeholder="Note" /><label className="text-sm"><input type="checkbox" checked={form.validatoFlag} onChange={(e) => setForm({ ...form, validatoFlag: e.target.checked })} /> Validata</label><button className="bg-slate-900 text-white rounded-lg px-3 py-2" onClick={async () => { await apiFetch('/api/attendances', { method: 'POST', body: JSON.stringify({ ...form, contractId: Number(selectedContract), data: form.date, note: form.note || null }) }); setMessage('Presenza salvata'); load(); }}>Salva presenza</button>{message && <p className="text-emerald-700 text-sm">{message}</p>}</div></div><div className={cardStyle}><h3 className="font-semibold mb-3">Vista mese</h3>{!entries.length ? emptyState('Nessuna presenza per questo mese.') : <div className="space-y-2 max-h-[420px] overflow-auto">{entries.map((e) => <div className="border rounded-lg p-2 text-sm" key={e.id}>{new Date(e.data).toLocaleDateString('it-IT')}: {e.oreOrdinarie}h + {e.oreStraordinario}h ({e.causale})</div>)}</div>}</div></div>;
}

export default function App() {
  const [section, setSection] = useState('Panoramica');
  const [dashboard, setDashboard] = useState({ totalEstimatedMonthlyCost: 0, alerts: [] });
  const [employers, setEmployers] = useState([]);
  const [workers, setWorkers] = useState([]);
  const [refreshKey, setRefreshKey] = useState(0);

  const refreshContractsDeps = () => setRefreshKey((v) => v + 1);

  useEffect(() => { apiFetch('/api/dashboard').then(setDashboard).catch(() => {}); apiFetch('/api/employers').then(setEmployers).catch(() => {}); apiFetch('/api/workers').then(setWorkers).catch(() => {}); }, [refreshKey]);

  const employerSchema = useMemo(() => z.object({ tipoSoggetto: z.string().min(2), nome: z.string().min(2), cognomeRagione: z.string().min(2), codiceFiscale: z.string().min(16), email: z.string().email(), telefono: z.string().min(6), indirizzoLavoro: z.string().min(5), preferenzeNotifica: z.string().min(2) }), []);
  const workerSchema = useMemo(() => z.object({ nome: z.string().min(2), cognome: z.string().min(2), codiceFiscale: z.string().min(16), dataNascita: z.string().min(8), email: z.string().email(), telefono: z.string().min(6), documentiIdentita: z.string().min(3), iban: z.string().optional().nullable() }), []);
  const contractSchema = useMemo(() => z.object({ employerId: z.coerce.number().positive(), workerId: z.coerce.number().positive(), tipoRapporto: z.string().min(2), livello: z.string().min(1), mansione: z.string().min(2), convivenzaFlag: z.coerce.boolean(), oreSettimanali: z.coerce.number().positive(), retribuzioneBase: z.coerce.number().positive(), dataInizio: z.string().min(8), dataFine: z.string().optional().nullable(), statoContratto: z.string().min(2) }), []);

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-3 flex justify-between items-center">
          <h1 className="font-bold text-xl">Gestionale COLF</h1>
          <nav className="flex gap-2 flex-wrap">{sections.map((s) => <button key={s} onClick={() => setSection(s)} className={`px-3 py-1 rounded-full text-sm ${section === s ? 'bg-slate-900 text-white' : 'bg-slate-100'}`}>{s}</button>)}</nav>
        </div>
      </header>

      <main className="max-w-6xl mx-auto p-4 space-y-4">
        {section === 'Panoramica' && <div className="grid md:grid-cols-3 gap-4"><div className={cardStyle}><p className="text-sm text-slate-500">Costo mese stimato</p><p className="text-3xl font-semibold">€ {dashboard.totalEstimatedMonthlyCost.toFixed(2)}</p></div><div className={`${cardStyle} md:col-span-2`}><p className="font-semibold mb-2">Alert base</p>{dashboard.alerts.length ? <ul className="list-disc list-inside text-sm space-y-1">{dashboard.alerts.map((a, i) => <li key={i}>{a}</li>)}</ul> : emptyState('Nessun alert al momento, ottimo lavoro!')}</div></div>}

        {section === 'Datori' && <CrudSection title="Gestione datori" endpoint="/api/employers" schema={employerSchema} fields={[{ name: 'tipoSoggetto', label: 'Tipo soggetto' }, { name: 'nome', label: 'Nome' }, { name: 'cognomeRagione', label: 'Cognome/Ragione sociale' }, { name: 'codiceFiscale', label: 'Codice fiscale' }, { name: 'email', label: 'Email' }, { name: 'telefono', label: 'Telefono' }, { name: 'indirizzoLavoro', label: 'Indirizzo lavoro' }, { name: 'preferenzeNotifica', label: 'Preferenze notifica' }]} />}

        {section === 'Lavoratori' && <CrudSection title="Gestione lavoratori" endpoint="/api/workers" schema={workerSchema} fields={[{ name: 'nome', label: 'Nome' }, { name: 'cognome', label: 'Cognome' }, { name: 'codiceFiscale', label: 'Codice fiscale' }, { name: 'dataNascita', label: 'Data nascita', type: 'date' }, { name: 'email', label: 'Email' }, { name: 'telefono', label: 'Telefono' }, { name: 'documentiIdentita', label: 'Documenti identità' }, { name: 'iban', label: 'IBAN (opzionale)' }]} />}

        {section === 'Contratti' && <div className="space-y-4"><ContractWizard employers={employers} workers={workers} onCreated={refreshContractsDeps} /><CrudSection title="CRUD contratti" endpoint="/api/contracts" schema={contractSchema} fields={[{ name: 'employerId', label: 'Employer ID', type: 'number' }, { name: 'workerId', label: 'Worker ID', type: 'number' }, { name: 'tipoRapporto', label: 'Tipo rapporto' }, { name: 'livello', label: 'Livello' }, { name: 'mansione', label: 'Mansione' }, { name: 'convivenzaFlag', label: 'Convivenza true/false' }, { name: 'oreSettimanali', label: 'Ore settimanali', type: 'number' }, { name: 'retribuzioneBase', label: 'Retribuzione base', type: 'number' }, { name: 'dataInizio', label: 'Data inizio', type: 'date' }, { name: 'dataFine', label: 'Data fine', type: 'date' }, { name: 'statoContratto', label: 'Stato contratto' }]} /></div>}

        {section === 'Presenze' && <AttendanceSection />}
      </main>
    </div>
  );
}
