import { useEffect, useRef, useState } from 'react';
import { HashRouter, NavLink, Navigate, Route, Routes } from 'react-router-dom';
import { Button, Icon } from './components/ui';
import { useStore } from './data/store';
import type { IconName } from './icons.generated';
import { useUi } from './ui-context';
import { BudgetView } from './views/BudgetView';
import { CalendarView } from './views/CalendarView';
import { CampaignsView } from './views/CampaignsView';
import { Dashboard } from './views/Dashboard';
import { EventsView } from './views/EventsView';
import { ItemDrawer } from './views/ItemDrawer';
import { PrView } from './views/PrView';

const NAV: { to: string; label: string; icon: IconName }[] = [
  { to: '/dashboard', label: 'Dashboard', icon: 'space_dashboard' },
  { to: '/kalender', label: 'Kalender', icon: 'calendar_month' },
  { to: '/beurzen', label: 'Beurzen & conferenties', icon: 'storefront' },
  { to: '/campagnes', label: 'Campagnes', icon: 'ads_click' },
  { to: '/pr', label: 'PR & vakmedia', icon: 'article' },
  { to: '/budget', label: 'Budget', icon: 'payments' },
];

function useColorMode() {
  const [mode, setMode] = useState<'light' | 'dark'>(() => (localStorage.getItem('mc-color-mode') as 'dark' | null) ?? 'light');
  useEffect(() => {
    document.documentElement.dataset.colorMode = mode;
    localStorage.setItem('mc-color-mode', mode);
  }, [mode]);
  return [mode, setMode] as const;
}

function DataActions() {
  const store = useStore();
  const { notify } = useUi();
  const file = useRef<HTMLInputElement>(null);
  const download = () => {
    const blob = new Blob([store.exportJson()], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `marketingkalender-${store.today}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
    notify('Export gedownload.');
  };
  const upload = async (f: File | undefined) => {
    if (!f) return;
    try {
      await store.importJson(await f.text());
      notify('Gegevens geïmporteerd.');
    } catch (err) {
      notify(err instanceof Error ? err.message : 'Import mislukt.');
    }
    if (file.current) file.current.value = '';
  };
  return (
    <div className="mc-sidebar-actions">
      <Button variant="text" intent="secondary" size="small" startIcon="download" onClick={download}>Exporteren (JSON)</Button>
      <Button variant="text" intent="secondary" size="small" startIcon="upload" onClick={() => file.current?.click()}>Importeren</Button>
      <Button variant="text" intent="secondary" size="small" startIcon="restart_alt" onClick={async () => { await store.resetToSeed(); notify('Startinhoud hersteld.'); }}>Startinhoud herstellen</Button>
      <input ref={file} type="file" accept="application/json" hidden onChange={(e) => upload(e.target.files?.[0])} />
    </div>
  );
}

export function App() {
  const store = useStore();
  const { toast } = useUi();
  const [mode, setMode] = useColorMode();
  return (
    <HashRouter>
      <div className="mc-app">
        <aside className="mc-sidebar">
          <div className="mc-brand">
            <span className="mc-brand-mark"><Icon name="calendar_month" size={20} /></span>
            <span>
              <span className="mc-brand-name">medipim</span>
              <span className="mc-brand-sub">Marketingkalender</span>
            </span>
          </div>
          <nav className="mc-nav" aria-label="Hoofdnavigatie">
            {NAV.map((n) => (
              <NavLink key={n.to} to={n.to} className="mc-nav-link">
                <Icon name={n.icon} size={20} />
                {n.label}
              </NavLink>
            ))}
          </nav>
          <div className="mc-sidebar-foot">
            <DataActions />
            <Button
              variant="text"
              intent="secondary"
              size="small"
              startIcon={mode === 'dark' ? 'light_mode' : 'dark_mode'}
              onClick={() => setMode(mode === 'dark' ? 'light' : 'dark')}
            >
              {mode === 'dark' ? 'Lichte modus' : 'Donkere modus'}
            </Button>
            <p className="mc-sidebar-note">Gegevens blijven lokaal in deze browser (IndexedDB).</p>
          </div>
        </aside>
        <main className="mc-main" aria-label="Inhoud">
          {store.ready ? (
            <Routes>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/kalender" element={<CalendarView />} />
              <Route path="/beurzen" element={<EventsView />} />
              <Route path="/campagnes" element={<CampaignsView />} />
              <Route path="/pr" element={<PrView />} />
              <Route path="/budget" element={<BudgetView />} />
              <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Routes>
          ) : (
            <div className="mc-loading" aria-busy="true">
              <div className="mc-skeleton" /><div className="mc-skeleton" /><div className="mc-skeleton" />
            </div>
          )}
        </main>
        <ItemDrawer />
        <div className="mc-toast" role="status" aria-live="polite" data-open={!!toast || undefined}>
          {toast && <><Icon name="check_circle" size={18} />{toast}</>}
        </div>
      </div>
    </HashRouter>
  );
}
