import { useState } from 'react';
import { PlanTable } from '../components/PlanTable';
import { Button, EmptyState, Segmented, Stat } from '../components/ui';
import { euro, yearOf } from '../data/budget';
import { fmt } from '../data/dates';
import { CHANNELS } from '../data/meta';
import { useStore } from '../data/store';
import type { Item } from '../data/types';
import { useUi } from '../ui-context';
import { PageHeader } from './PageHeader';

const ALL = 'alle';

export function PrView() {
  const store = useStore();
  const { openItem } = useUi();
  const { today } = store;
  const year = Number(today.slice(0, 4));
  const [scope, setScope] = useState<'komend' | 'alle'>('komend');
  const [format, setFormat] = useState<string>(ALL);
  const [medium, setMedium] = useState<string>(ALL);

  const all = store.items.filter((i) => i.type === 'pr').sort((a, b) => a.date.localeCompare(b.date));
  const formats = [...new Set([...CHANNELS.pr, ...all.map((i) => i.channel)])];
  const media = [...new Set(all.map((i) => i.medium).filter((m): m is string => !!m))].sort();
  const filtered = all.filter((i) => (format === ALL || i.channel === format) && (medium === ALL || i.medium === medium));
  const shown = filtered.filter((i) => scope === 'alle' || i.date >= today);
  const upcoming = filtered.filter((i) => i.date >= today);
  const thisYear = filtered.filter((i) => yearOf(i) === year);
  const planned = thisYear.reduce((n, i) => n + (i.budgetPlanned ?? 0), 0);
  const spent = thisYear.reduce((n, i) => n + (i.budgetActual ?? 0), 0);

  const months = new Map<string, Item[]>();
  shown.forEach((i) => months.set(i.date.slice(0, 7), [...(months.get(i.date.slice(0, 7)) ?? []), i]));

  return (
    <div className="mc-page">
      <PageHeader
        title="PR & vakmedia"
        subtitle="Advertenties, advertorials, persberichten en artikels in vakmedia."
        actions={<Button startIcon="add" onClick={() => openItem(undefined, { type: 'pr', channel: format === ALL ? CHANNELS.pr[0] : format, medium: medium === ALL ? '' : medium, date: today })}>Nieuw PR-item</Button>}
      />
      <div className="mc-stats">
        <Stat label="Komend" value={upcoming.length} tone="brand" icon="article" hint="publicaties gepland" />
        <Stat label="Media" value={new Set(upcoming.map((i) => i.medium).filter(Boolean)).size} tone="neutral" icon="forum" hint="verschillende titels" />
        <Stat label={`Budget ${year}`} value={euro(planned)} tone="neutral" icon="payments" hint="gepland, excl. btw" />
        <Stat label={`Besteed ${year}`} value={euro(spent)} tone={spent > planned ? 'error' : 'neutral'} icon="history" hint={planned ? `${Math.round((spent / planned) * 100)}% van gepland` : 'nog geen budget gepland'} />
      </div>
      <div className="mc-section-bar mc-filters">
        <div className="mc-filters">
          <select className="mc-input mc-filter-select" aria-label="Formaat" value={format} data-active={format !== ALL || undefined} onChange={(e) => setFormat(e.target.value)}>
            <option value={ALL}>Formaat: alle</option>
            {formats.map((f) => <option key={f} value={f}>Formaat: {f}</option>)}
          </select>
          <select className="mc-input mc-filter-select" aria-label="Medium" value={medium} data-active={medium !== ALL || undefined} onChange={(e) => setMedium(e.target.value)}>
            <option value={ALL}>Medium: alle</option>
            {media.map((m) => <option key={m} value={m}>Medium: {m}</option>)}
          </select>
        </div>
        <Segmented label="Toon" value={scope} onChange={setScope} options={[{ value: 'komend', label: 'Komend' }, { value: 'alle', label: 'Alle' }]} />
      </div>
      {shown.length === 0 ? (
        <EmptyState icon="article" title={all.length ? 'Niets gevonden' : 'Nog geen PR gepland'}>
          {all.length ? 'Pas de filters aan of toon ook afgelopen items.' : 'Plan een advertentie, advertorial, persbericht of artikel in een vakmedium.'}
        </EmptyState>
      ) : (
        [...months].map(([month, items]) => (
          <section key={month} className="mc-plan-group">
            <div className="mc-section-bar"><h2 className="mc-capitalize">{fmt(`${month}-01`, 'MMMM yyyy')} <span className="mc-muted">· {items.length}</span></h2></div>
            <PlanTable items={items} label={`PR in ${fmt(`${month}-01`, 'MMMM yyyy')}`} showMedium />
          </section>
        ))
      )}
    </div>
  );
}
