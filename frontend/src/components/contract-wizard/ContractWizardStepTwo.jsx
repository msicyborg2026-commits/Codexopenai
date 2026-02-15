import { Input } from '../ui/Input';
import { Select } from '../ui/Select';

const PAY_TYPES = [
  { value: 'HOURLY', label: 'Oraria' },
  { value: 'MONTHLY', label: 'Mensile' }
];

const dayFields = [
  { key: 'monHours', label: 'Lun' },
  { key: 'tueHours', label: 'Mar' },
  { key: 'wedHours', label: 'Mer' },
  { key: 'thuHours', label: 'Gio' },
  { key: 'friHours', label: 'Ven' },
  { key: 'satHours', label: 'Sab' },
  { key: 'sunHours', label: 'Dom' }
];

export function ContractWizardStepTwo({ form, errors, onChange, showConvivente }) {
  return (
    <div className="space-y-6">
      <section className="space-y-4 rounded-xl border border-slate-200 bg-slate-50/60 p-4">
        <div>
          <h3 className="text-base font-semibold text-slate-900">Orario</h3>
          <p className="text-sm text-slate-600">Definisci il monte ore settimanale e, se disponibile, la distribuzione giornaliera.</p>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-700">Ore settimanali *</label>
          <Input
            type="number"
            step="0.1"
            min="0"
            value={form.weeklyHours}
            onChange={(event) => onChange('weeklyHours', event.target.value)}
            placeholder="Es. 40"
          />
          {errors.weeklyHours && <p className="text-xs text-red-600">{errors.weeklyHours}</p>}
        </div>

        <div className="space-y-2">
          <p className="text-sm font-medium text-slate-700">Ore per giorno (opzionale)</p>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4 xl:grid-cols-7">
            {dayFields.map((field) => (
              <div key={field.key} className="space-y-1">
                <label className="text-xs font-medium uppercase tracking-wide text-slate-500">{field.label}</label>
                <Input
                  type="number"
                  step="0.1"
                  min="0"
                  value={form[field.key]}
                  onChange={(event) => onChange(field.key, event.target.value)}
                  placeholder="0"
                />
              </div>
            ))}
          </div>
          <p className="text-xs text-slate-500">Se non compili i giorni, useremo solo ore settimanali.</p>
        </div>
      </section>

      <section className="space-y-4 rounded-xl border border-slate-200 bg-slate-50/60 p-4">
        <div>
          <h3 className="text-base font-semibold text-slate-900">Retribuzione</h3>
          <p className="text-sm text-slate-600">Imposta la tipologia e le principali voci economiche del contratto.</p>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">Tipologia paga</label>
            <Select value={form.payType} onChange={(event) => onChange('payType', event.target.value)}>
              {PAY_TYPES.map((type) => (
                <option key={type.value} value={type.value}>{type.label}</option>
              ))}
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">Retribuzione base *</label>
            <Input
              type="number"
              step="0.01"
              min="0"
              value={form.baseSalary}
              onChange={(event) => onChange('baseSalary', event.target.value)}
              placeholder="Es. 1200"
            />
            {errors.baseSalary && <p className="text-xs text-red-600">{errors.baseSalary}</p>}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">Superminimo</label>
            <Input type="number" step="0.01" min="0" value={form.superminimo} onChange={(event) => onChange('superminimo', event.target.value)} />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">Indennità vitto</label>
            <Input type="number" step="0.01" min="0" value={form.foodAllowance} onChange={(event) => onChange('foodAllowance', event.target.value)} />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">Indennità alloggio</label>
            <Input
              type="number"
              step="0.01"
              min="0"
              value={form.accommodationAllowance}
              onChange={(event) => onChange('accommodationAllowance', event.target.value)}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">Livello</label>
            <Input type="text" value={form.level} onChange={(event) => onChange('level', event.target.value)} placeholder="Es. CS" />
          </div>
        </div>

        <div className="flex flex-wrap gap-4">
          <label className="inline-flex items-center gap-2 text-sm font-medium text-slate-700">
            <input
              type="checkbox"
              className="h-4 w-4 rounded border-slate-300 text-slate-900 focus:ring-slate-400"
              checked={form.thirteenth}
              onChange={(event) => onChange('thirteenth', event.target.checked)}
            />
            Tredicesima
          </label>

          {showConvivente && (
            <label className="inline-flex items-center gap-2 text-sm font-medium text-slate-700">
              <input
                type="checkbox"
                className="h-4 w-4 rounded border-slate-300 text-slate-900 focus:ring-slate-400"
                checked={form.convivente}
                onChange={(event) => onChange('convivente', event.target.checked)}
              />
              Convivente
            </label>
          )}
        </div>
      </section>
    </div>
  );
}
