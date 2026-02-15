import { useEffect, useMemo, useState } from 'react';
import { Button } from '../components/ui/Button';
import { EmptyState } from '../components/ui/EmptyState';
import { Input } from '../components/ui/Input';
import { LoadingSkeleton } from '../components/ui/LoadingSkeleton';
import { Modal } from '../components/ui/Modal';
import { apiFetch } from '../lib/api';

function initialState(fields, source = {}) {
  return fields.reduce((acc, field) => ({ ...acc, [field.name]: source[field.name] ?? field.defaultValue ?? '' }), {});
}

export function EntityManagementPage({ title, endpoint, fields, columns, schema }) {
  const [items, setItems] = useState([]);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeItem, setActiveItem] = useState(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [form, setForm] = useState(() => initialState(fields));

  const load = async () => {
    setLoading(true);
    try {
      const data = await apiFetch(endpoint);
      setItems(data);
      setError('');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [endpoint]);

  const filteredItems = useMemo(() => {
    if (!query.trim()) return items;
    const lower = query.toLowerCase();
    return items.filter((item) => fields.some((field) => String(item[field.name] ?? '').toLowerCase().includes(lower)));
  }, [fields, items, query]);

  const openCreate = () => {
    setEditingItem(null);
    setForm(initialState(fields));
    setIsFormOpen(true);
  };

  const openEdit = (item) => {
    setEditingItem(item);
    setForm(initialState(fields, item));
    setIsFormOpen(true);
  };

  const onSubmit = async (event) => {
    event.preventDefault();
    try {
      const payload = schema.parse(form);
      if (editingItem) {
        await apiFetch(`${endpoint}/${editingItem.id}`, { method: 'PUT', body: JSON.stringify(payload) });
      } else {
        await apiFetch(endpoint, { method: 'POST', body: JSON.stringify(payload) });
      }
      setIsFormOpen(false);
      setForm(initialState(fields));
      await load();
    } catch (err) {
      setError(err.message);
    }
  };

  const onDelete = async (item) => {
    await apiFetch(`${endpoint}/${item.id}`, { method: 'DELETE' });
    await load();
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4 md:flex-row md:items-center">
        <Input placeholder={`Cerca ${title.toLowerCase()}...`} value={query} onChange={(event) => setQuery(event.target.value)} />
        <Button onClick={openCreate}>Nuovo</Button>
      </div>

      {error && <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>}

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        {loading ? (
          <div className="space-y-2 p-4">
            <LoadingSkeleton className="h-10" />
            <LoadingSkeleton className="h-10" />
            <LoadingSkeleton className="h-10" />
          </div>
        ) : !filteredItems.length ? (
          <div className="p-4">
            <EmptyState title="Nessun risultato" description="Prova a modificare la ricerca o crea un nuovo elemento." />
          </div>
        ) : (
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className="bg-slate-50 text-left text-slate-500">
              <tr>
                {columns.map((column) => <th key={column.key} className="px-4 py-3 font-medium">{column.label}</th>)}
                <th className="px-4 py-3 font-medium">Azioni</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredItems.map((item) => (
                <tr key={item.id} className="text-slate-700">
                  {columns.map((column) => <td key={column.key} className="px-4 py-3">{column.render ? column.render(item) : item[column.key] || '-'}</td>)}
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <Button variant="secondary" onClick={() => { setActiveItem(item); setIsDetailOpen(true); }}>Dettaglio</Button>
                      <Button variant="ghost" onClick={() => openEdit(item)}>Modifica</Button>
                      <Button variant="danger" onClick={() => onDelete(item)}>Elimina</Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <Modal isOpen={isDetailOpen} title="Dettaglio" onClose={() => setIsDetailOpen(false)}>
        {!activeItem ? null : (
          <dl className="grid grid-cols-1 gap-2 md:grid-cols-2">
            {fields.map((field) => (
              <div key={field.name}>
                <dt className="text-xs uppercase text-slate-400">{field.label}</dt>
                <dd className="text-sm text-slate-800">{String(activeItem[field.name] ?? '-')}</dd>
              </div>
            ))}
          </dl>
        )}
      </Modal>

      <Modal isOpen={isFormOpen} title={editingItem ? 'Modifica elemento' : 'Nuovo elemento'} onClose={() => setIsFormOpen(false)}>
        <form onSubmit={onSubmit} className="grid gap-3 md:grid-cols-2">
          {fields.map((field) => (
            <label key={field.name} className="space-y-1">
              <span className="text-xs font-semibold uppercase text-slate-500">{field.label}</span>
              <Input
                type={field.type || 'text'}
                value={form[field.name]}
                onChange={(event) => setForm((prev) => ({ ...prev, [field.name]: event.target.value }))}
                required={field.required}
              />
            </label>
          ))}
          <div className="md:col-span-2 flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setIsFormOpen(false)}>Annulla</Button>
            <Button type="submit">Salva</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
