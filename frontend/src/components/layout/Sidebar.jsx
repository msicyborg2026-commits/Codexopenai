import { Button } from '../ui/Button';
import { cn } from '../../lib/cn';

export function Sidebar({ sections, activeSection, onChangeSection, isOpen, onClose }) {
  return (
    <>
      {isOpen && <button className="fixed inset-0 z-20 bg-slate-900/50 lg:hidden" onClick={onClose} aria-label="Chiudi menu" />}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-30 w-72 transform border-r border-slate-200 bg-white p-4 transition-transform lg:static lg:translate-x-0',
          isOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="mb-6">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Gestionale</p>
          <p className="text-lg font-bold text-slate-900">COLF</p>
        </div>
        <nav className="space-y-2">
          {sections.map((item) => (
            <Button
              key={item.key}
              variant={activeSection === item.key ? 'primary' : 'ghost'}
              className="w-full justify-start"
              onClick={() => {
                onChangeSection(item.key);
                onClose();
              }}
            >
              {item.label}
            </Button>
          ))}
        </nav>
      </aside>
    </>
  );
}
