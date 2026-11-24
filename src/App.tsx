import { useEffect, useRef, useState } from 'react';
import { HashRouter, NavLink, Navigate, Route, Routes } from 'react-router-dom';
import { MedipimLogo } from './components/logo';
import { Button, Icon, Segmented } from './components/ui';
import { useStore } from './data/store';
import type { IconName } from './icons.generated';
import { LANGS, lang, setLang, t, type Lang } from './i18n';
import { useUi } from './ui-context';
import { BudgetView } from './views/BudgetView';
import { CalendarView } from './views/CalendarView';
import { CampaignsView } from './views/CampaignsView';
import { ContentView } from './views/ContentView';
import { Dashboard } from './views/Dashboard';
import { EventsView } from './views/EventsView';
import { ItemDrawer } from './views/ItemDrawer';
import { PrView } from './views/PrView';

const NAV: { to: string; key: keyof typeof t.app.nav; icon: IconName }[] = [
  { to: '/dashboard', key: 'dashboard', icon: 'space_dashboard' },
  { to: '/kalender', key: 'calendar', icon: 'calendar_month' },
  { to: '/beurzen', key: 'events', icon: 'storefront' },
  { to: '/campagnes', key: 'campaigns', icon: 'ads_click' },
  { to: '/pr', key: 'pr', icon: 'article' },
  { to: '/content', key: 'content', icon: 'lightbulb' },
  { to: '/budget', key: 'budget', icon: 'payments' },
];

function useLanguage() {
  const [current, setCurrent] = useState<Lang>(lang);
  useEffect(() => { document.documentElement.lang = current; }, [current]);
  const change = (next: Lang) => {
    setLang(next);
    setCurrent(next);
  };
  return [current, change] as const;
}

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
    a.download = `${t.app.exportFile}-${store.today}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
    notify(t.app.exported);
  };
  const upload = async (f: File | undefined) => {
    if (!f) return;
    try {
      await store.importJson(await f.text());
      notify(t.app.imported);
    } catch (err) {
      notify(err instanceof Error ? err.message : t.app.importFailed);
    }
    if (file.current) file.current.value = '';
  };
  return (
    <div className="mc-sidebar-actions">
      <Button variant="text" intent="secondary" size="small" startIcon="download" onClick={download}>{t.app.export}</Button>
      <Button variant="text" intent="secondary" size="small" startIcon="upload" onClick={() => file.current?.click()}>{t.app.import}</Button>
      <Button variant="text" intent="secondary" size="small" startIcon="restart_alt" onClick={async () => { await store.resetToSeed(); notify(t.app.resetDone); }}>{t.app.reset}</Button>
      <input ref={file} type="file" accept="application/json" hidden onChange={(e) => upload(e.target.files?.[0])} />
    </div>
  );
}

export function App() {
  const store = useStore();
  const { toast } = useUi();
  const [mode, setMode] = useColorMode();
  const [language, setLanguage] = useLanguage();
  return (
    <HashRouter key={language}>
      <div className="mc-app">
        <aside className="mc-sidebar">
          <div className="mc-brand">
            <MedipimLogo />
            <span className="mc-brand-sub">{t.app.brandSub}</span>
          </div>
          <nav className="mc-nav" aria-label={t.app.mainNav}>
            {NAV.map((n) => (
              <NavLink key={n.to} to={n.to} className="mc-nav-link">
                <Icon name={n.icon} size={20} />
                {t.app.nav[n.key]}
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
              {mode === 'dark' ? t.app.lightMode : t.app.darkMode}
            </Button>
            <Segmented
              label={t.app.language}
              value={language}
              onChange={setLanguage}
              options={LANGS.map((l) => ({ value: l, label: l.toUpperCase() }))}
            />
            <p className="mc-sidebar-note">{t.app.localNote}</p>
          </div>
        </aside>
        <main className="mc-main" aria-label={t.app.content}>
          {store.ready ? (
            <Routes>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/kalender" element={<CalendarView />} />
              <Route path="/beurzen" element={<EventsView />} />
              <Route path="/campagnes" element={<CampaignsView />} />
              <Route path="/pr" element={<PrView />} />
              <Route path="/content" element={<ContentView />} />
              <Route path="/budget" element={<BudgetView />} />
              <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Routes>
          ) : (
            <div className="mc-loading" aria-busy="true">
              {store.blocked && <p role="alert">{t.app.blocked}</p>}
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
