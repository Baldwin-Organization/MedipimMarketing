import { useState } from 'react';
import { PlanTable } from '../components/PlanTable';
import { Button, EmptyState, Segmented, Stat } from '../components/ui';
import { euro, yearOf } from '../data/budget';
import { fmt } from '../data/dates';
import { CHANNELS } from '../data/meta';
import { useStore } from '../data/store';
import type { Item } from '../data/types';
import { channelLabel, t } from '../i18n';
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
        title={t.pr.title}
        subtitle={t.pr.subtitle}
        actions={<Button startIcon="add" onClick={() => openItem(undefined, { type: 'pr', channel: format === ALL ? CHANNELS.pr[0] : format, medium: medium === ALL ? '' : medium, date: today })}>{t.pr.newItem}</Button>}
      />
      <div className="mc-stats">
        <Stat label={t.pr.upcoming} value={upcoming.length} tone="brand" icon="article" hint={t.pr.upcomingHint} />
        <Stat label={t.pr.media} value={new Set(upcoming.map((i) => i.medium).filter(Boolean)).size} tone="neutral" icon="forum" hint={t.pr.mediaHint} />
        <Stat label={t.plan.budgetYear(year)} value={euro(planned)} tone="neutral" icon="payments" hint={t.plan.plannedHint} />
        <Stat label={t.plan.spentYear(year)} value={euro(spent)} tone={spent > planned ? 'error' : 'neutral'} icon="history" hint={planned ? t.plan.ofPlanned(Math.round((spent / planned) * 100)) : t.plan.noBudget} />
      </div>
      <div className="mc-section-bar mc-filters">
        <div className="mc-filters">
          <select className="mc-input mc-filter-select" aria-label={t.pr.format} value={format} data-active={format !== ALL || undefined} onChange={(e) => setFormat(e.target.value)}>
            <option value={ALL}>{t.common.filterAll(t.pr.format)}</option>
            {formats.map((f) => <option key={f} value={f}>{t.common.filterValue(t.pr.format, channelLabel(f))}</option>)}
          </select>
          <select className="mc-input mc-filter-select" aria-label={t.pr.medium} value={medium} data-active={medium !== ALL || undefined} onChange={(e) => setMedium(e.target.value)}>
            <option value={ALL}>{t.common.filterAll(t.pr.medium)}</option>
            {media.map((m) => <option key={m} value={m}>{t.common.filterValue(t.pr.medium, m)}</option>)}
          </select>
        </div>
        <Segmented label={t.common.show} value={scope} onChange={setScope} options={[{ value: 'komend', label: t.common.upcoming }, { value: 'alle', label: t.common.all }]} />
      </div>
      {shown.length === 0 ? (
        <EmptyState icon="article" title={all.length ? t.pr.noneFound : t.pr.nonePlanned}>
          {all.length ? t.pr.noneFoundHint : t.pr.nonePlannedHint}
        </EmptyState>
      ) : (
        [...months].map(([month, items]) => (
          <section key={month} className="mc-plan-group">
            <div className="mc-section-bar"><h2 className="mc-capitalize">{fmt(`${month}-01`, 'MMMM yyyy')} <span className="mc-muted">· {items.length}</span></h2></div>
            <PlanTable items={items} label={t.pr.tableLabel(fmt(`${month}-01`, 'MMMM yyyy'))} showMedium />
          </section>
        ))
      )}
    </div>
  );
}
