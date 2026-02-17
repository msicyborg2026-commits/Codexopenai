import { useMemo, useState } from 'react';
import { AppShell } from './components/layout/AppShell';
import { PanoramicaPage } from './pages/PanoramicaPage';
import { DatoriPage } from './pages/DatoriPage';
import { LavoratoriPage } from './pages/LavoratoriPage';
import { ContrattiPage } from './pages/ContrattiPage';
import { PresenzePage } from './pages/PresenzePage';
import { ContractWizardPage } from './pages/ContractWizardPage';
import { PaghePage } from './pages/PaghePage';

export default function App() {
  const [section, setSection] = useState('Panoramica');
  const [contractsView, setContractsView] = useState('list');

  const onChangeSection = (nextSection) => {
    setSection(nextSection);
    if (nextSection !== 'Contratti') {
      setContractsView('list');
    }
  };

  const page = useMemo(() => {
    if (section === 'Datori') return <DatoriPage />;
    if (section === 'Lavoratori') return <LavoratoriPage />;
    if (section === 'Contratti') {
      if (contractsView === 'wizard') {
        return <ContractWizardPage onCancel={() => setContractsView('list')} />;
      }
      return <ContrattiPage onCreateContract={() => setContractsView('wizard')} />;
    }
    if (section === 'Presenze') return <PresenzePage />;
    if (section === 'Paghe') return <PaghePage />;
    return <PanoramicaPage />;
  }, [section, contractsView]);

  return (
    <AppShell section={section} onChangeSection={onChangeSection}>
      {page}
    </AppShell>
  );
}
