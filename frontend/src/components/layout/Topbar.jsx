import { Button } from '../ui/Button';
import { Input } from '../ui/Input';

export function Topbar({ title, onOpenSidebar }) {
  return (
    <header className="sticky top-0 z-10 border-b border-slate-200 bg-white/95 backdrop-blur">
      <div className="flex items-center gap-3 px-4 py-3 lg:px-6">
        <Button className="lg:hidden" variant="secondary" onClick={onOpenSidebar}>Menu</Button>
        <h1 className="text-lg font-semibold text-slate-900">{title}</h1>
        <div className="ml-auto hidden w-full max-w-xs lg:block">
          <Input placeholder="Ricerca contestuale (prossimamente)" disabled />
        </div>
      </div>
    </header>
  );
}
