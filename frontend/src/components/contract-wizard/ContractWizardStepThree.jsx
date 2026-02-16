import { Input } from '../ui/Input';

const dayFields = [
  { key: 'monHours', label: 'Lunedì' },
  { key: 'tueHours', label: 'Martedì' },
  { key: 'wedHours', label: 'Mercoledì' },
  { key: 'thuHours', label: 'Giovedì' },
  { key: 'friHours', label: 'Venerdì' },
  { key: 'satHours', label: 'Sabato' },
  { key: 'sunHours', label: 'Domenica' }
];

export function ContractWizardStepThree({ form, weeklyHours, onChange, disabled = false }) {
  return (
    <section className="space-y-4 rounded-xl border border-slate-200 bg-slate-50/60 p-4">
      <div>
        <h3 className="text-base font-semibold text-slate-900">Orari settimanali</h3>
        <p className="text-sm text-slate-600">Inserisci le ore giornaliere: il totale settimanale viene calcolato automaticamente.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {dayFields.map((field) => (
          <div key={field.key} className="space-y-2">
            <label className="text-sm font-medium text-slate-700">{field.label}</label>
            <Input
              type="number"
              min="0"
              step="0.5"
              value={form[field.key]}
              onChange={(event) => onChange(field.key, event.target.value)}
              placeholder="0"
              disabled={disabled}
            />
          </div>
        ))}
      </div>

      <div className="space-y-2 border-t border-slate-200 pt-4">
        <label className="text-sm font-medium text-slate-700">Ore settimanali (calcolate)</label>
        <Input type="number" min="0" step="0.5" value={weeklyHours} readOnly disabled />
      </div>
    </section>
  );
}
