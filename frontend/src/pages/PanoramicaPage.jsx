import { useEffect, useState } from 'react';
import { apiFetch } from '../lib/api';
import { Badge } from '../components/ui/Badge';
import { EmptyState } from '../components/ui/EmptyState';
import { LoadingSkeleton } from '../components/ui/LoadingSkeleton';

function Euro({ value }) {
  return new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR' }).format(value || 0);
}

export function PanoramicaPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const result = await apiFetch('/api/dashboard');
        setData(result);
        setError('');
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) {
    return <div className="grid gap-4 md:grid-cols-3"><LoadingSkeleton className="h-28" /><LoadingSkeleton className="h-28" /><LoadingSkeleton className="h-28" /></div>;
  }

  if (error) {
    return <EmptyState title="Errore nel caricamento" description={error} />;
  }

  const alerts = data?.alerts || [];
  const monthly = data?.totalEstimatedMonthlyCost || 0;

  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <p className="text-sm text-slate-500">Costo mese stimato</p>
          <p className="mt-2 text-2xl font-bold text-slate-900">{Euro({ value: monthly })}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <p className="text-sm text-slate-500">Alert attivi</p>
          <p className="mt-2 text-2xl font-bold text-slate-900">{alerts.length}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <p className="text-sm text-slate-500">Stato operativo</p>
          <Badge variant={alerts.length ? 'warning' : 'success'}>{alerts.length ? 'Attenzione richiesta' : 'Regolare'}</Badge>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="rounded-xl border border-slate-200 bg-white p-4">
          <h2 className="font-semibold text-slate-900">Alert</h2>
          {!alerts.length ? <EmptyState title="Nessun alert" description="Ottimo, non risultano segnalazioni." /> : (
            <ul className="mt-3 space-y-2 text-sm text-slate-700">
              {alerts.map((alert, idx) => <li className="rounded-lg bg-amber-50 p-2" key={`${alert}-${idx}`}>{alert}</li>)}
            </ul>
          )}
        </section>

        <section className="rounded-xl border border-slate-200 bg-white p-4">
          <h2 className="font-semibold text-slate-900">Prossime azioni</h2>
          <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-slate-700">
            <li>Verificare presenze della settimana corrente.</li>
            <li>Controllare scadenze contratti in arrivo.</li>
            <li>Confermare dati anagrafici datori e lavoratori.</li>
          </ul>
        </section>
      </div>
    </div>
  );
}
