import { useMemo, useState } from 'react';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';
import { PageContainer } from './PageContainer';

export const sections = [
  { key: 'Panoramica', label: 'Panoramica' },
  { key: 'Datori', label: 'Datori' },
  { key: 'Lavoratori', label: 'Lavoratori' },
  { key: 'Contratti', label: 'Contratti' },
  { key: 'Presenze', label: 'Presenze' },
  { key: 'Paghe', label: 'Paghe' }
];

export function AppShell({ section, onChangeSection, children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const title = useMemo(() => sections.find((item) => item.key === section)?.label || 'Gestionale COLF', [section]);

  return (
    <div className="min-h-screen bg-slate-50 lg:flex">
      <Sidebar
        sections={sections}
        activeSection={section}
        onChangeSection={onChangeSection}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />
      <div className="flex-1">
        <Topbar title={title} onOpenSidebar={() => setSidebarOpen(true)} />
        <PageContainer>{children}</PageContainer>
      </div>
    </div>
  );
}
