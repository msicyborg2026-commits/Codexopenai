import { Input } from '../ui/Input';
import { Select } from '../ui/Select';

const PAY_TYPES = [
  { value: 'HOURLY', label: 'Oraria' },
  { value: 'MONTHLY', label: 'Mensile' }
];

export function ContractWizardStepTwo({ form, errors, onChange, showConvivente, disabled = false }) {
  const isHourly = form.payType === 'HOURLY';

  return (
    <div className="space-y-6">
      <section className="space-y-4 rounded-xl border border-slate-200 bg-slate-50/60 p-4">
        <div>
          <h3 className="text-base font-semibold text-slate-900">Retribuzione</h3>
          <p className="text-sm text-slate-600">Imposta la tipologia e le principali voci economiche del contratto.</p>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">Tipo paga</label>
            <Select value={form.payType} onChange={(event) => onChange('payType', event.target.value)} disabled={disabled}>
              {PAY_TYPES.map((type) => (
                <option key={type.value} value={type.value}>{type.label}</option>
              ))}
            </Select>
          </div>

          {isHourly ? (
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Paga oraria (€/h) *</label>
              <Input
                type="number"
                step="0.01"
                min="0"
                value={form.hourlyRate}
                onChange={(event) => onChange('hourlyRate', event.target.value)}
                placeholder="Es. 10"
                disabled={disabled}
              />
              {errors.hourlyRate && <p className="text-xs text-red-600">{errors.hourlyRate}</p>}
            </div>
          ) : (
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Paga mensile (€) *</label>
              <Input
                type="number"
                step="0.01"
                min="0"
                value={form.monthlySalary}
                onChange={(event) => onChange('monthlySalary', event.target.value)}
                placeholder="Es. 1200"
                disabled={disabled}
              />
              {errors.monthlySalary && <p className="text-xs text-red-600">{errors.monthlySalary}</p>}
            </div>
          )}

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">Maggiorazione straordinario</label>
            <Input
              type="number"
              step="0.01"
              min="1"
              value={form.overtimeMultiplier}
              onChange={(event) => onChange('overtimeMultiplier', event.target.value)}
              placeholder="Es. 1.25"
              disabled={disabled}
            />
            {errors.overtimeMultiplier && <p className="text-xs text-red-600">{errors.overtimeMultiplier}</p>}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">Superminimo</label>
            <Input
              type="number"
              step="0.01"
              min="0"
              value={form.superminimo}
              onChange={(event) => onChange('superminimo', event.target.value)}
              disabled={disabled}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">Indennità vitto</label>
            <Input
              type="number"
              step="0.01"
              min="0"
              value={form.foodAllowance}
              onChange={(event) => onChange('foodAllowance', event.target.value)}
              disabled={disabled}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">Indennità alloggio</label>
            <Input
              type="number"
              step="0.01"
              min="0"
              value={form.accommodationAllowance}
              onChange={(event) => onChange('accommodationAllowance', event.target.value)}
              disabled={disabled}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">Livello</label>
            <Input
              type="text"
              value={form.level}
              onChange={(event) => onChange('level', event.target.value)}
              placeholder="Es. CS"
              disabled={disabled}
            />
          </div>
        </div>

        <div className="flex flex-wrap gap-4">
          <label className="inline-flex items-center gap-2 text-sm font-medium text-slate-700">
            <input
              type="checkbox"
              className="h-4 w-4 rounded border-slate-300 text-slate-900 focus:ring-slate-400"
              checked={form.thirteenth}
              onChange={(event) => onChange('thirteenth', event.target.checked)}
              disabled={disabled}
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
                disabled={disabled}
              />
              Convivente
            </label>
          )}
        </div>
      </section>
    </div>
  );
}
