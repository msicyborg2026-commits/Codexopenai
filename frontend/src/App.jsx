import { useMemo, useState } from 'react';
import { AppShell } from './components/layout/AppShell';
import { PanoramicaPage } from './pages/PanoramicaPage';
import { DatoriPage } from './pages/DatoriPage';
import { LavoratoriPage } from './pages/LavoratoriPage';
import { ContrattiPage } from './pages/ContrattiPage';
import { PresenzePage } from './pages/PresenzePage';

export default function App() {
  const [section, setSection] = useState('Panoramica');

  const page = useMemo(() => {
    if (section === 'Datori') return <DatoriPage />;
    if (section === 'Lavoratori') return <LavoratoriPage />;
    if (section === 'Contratti') return <ContrattiPage />;
    if (section === 'Presenze') return <PresenzePage />;
    return <PanoramicaPage />;
  }, [section]);

  return (
    <AppShell section={section} onChangeSection={setSection}>
      {page}
    </AppShell>
  );
}
