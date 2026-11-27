import { useState } from 'react';
import { PlanTable } from '../components/PlanTable';
import { Button, EmptyState, Segmented, Stat } from '../components/ui';
import { euro, yearOf } from '../data/budget';
import { shiftIso } from '../data/dates';
import { CHANNELS } from '../data/meta';
import { useStore } from '../data/store';
import type { Item } from '../data/types';
import { channelLabel, t } from '../i18n';
import { useUi } from '../ui-context';
import { PageHeader } from './PageHeader';

const ALL = 'alle';

export function CampaignsView() {
  const store = useStore();
  const { openItem } = useUi();
  const { today } = store;
  const year = Number(today.slice(0, 4));
  const [channel, setChannel] = useState<string>(ALL);

  const campaigns = store.items.filter((i) => i.type === 'campaign').sort((a, b) => a.date.localeCompare(b.date));
  const channels = [...new Set([...CHANNELS.campaign, ...campaigns.map((c) => c.channel)])];
  const shown = campaigns.filter((c) => channel === ALL || c.channel === channel);
  const end = (c: Item) => c.endDate ?? c.date;
  const running = shown.filter((c) => c.date <= today && end(c) >= today);
  const upcoming = shown.filter((c) => c.date > today);
  const past = shown.filter((c) => end(c) < today).reverse();
  const thisYear = shown.filter((c) => yearOf(c) === year);
  const planned = thisYear.reduce((n, c) => n + (c.budgetPlanned ?? 0), 0);
  const spent = thisYear.reduce((n, c) => n + (c.budgetActual ?? 0), 0);

  const create = () => openItem(undefined, {
    type: 'campaign',
    channel: channel === ALL ? CHANNELS.campaign[0] : channel,
    date: today,
    endDate: shiftIso(today, 29),
  });

  return (
    <div className="mc-page">
      <PageHeader
        title={t.campaigns.title}
        subtitle={t.campaigns.subtitle}
        actions={<Button startIcon="add" onClick={create}>{t.campaigns.newCampaign}</Button>}
      />
      <Segmented
        label={t.campaigns.channel}
        value={channel}
        onChange={setChannel}
        options={[{ value: ALL, label: t.campaigns.allChannels }, ...channels.map((c) => ({ value: c, label: channelLabel(c) }))]}
      />
      <div className="mc-stats">
        <Stat label={t.campaigns.running} value={running.length} tone="brand" icon="ads_click" hint={t.campaigns.runningHint} />
        <Stat label={t.campaigns.planned} value={upcoming.length} tone="neutral" icon="schedule" hint={t.campaigns.plannedHint} />
        <Stat label={t.plan.budgetYear(year)} value={euro(planned)} tone="neutral" icon="payments" hint={t.plan.plannedHint} />
        <Stat label={t.plan.spentYear(year)} value={euro(spent)} tone={spent > planned ? 'error' : 'neutral'} icon="history" hint={planned ? t.plan.ofPlanned(Math.round((spent / planned) * 100)) : t.plan.noBudget} />
      </div>
      {shown.length === 0 ? (
        <EmptyState icon="ads_click" title={t.campaigns.empty}>
          {t.campaigns.emptyHint}
        </EmptyState>
      ) : (
        <>
          <Group title={t.campaigns.groups.running} items={running} />
          <Group title={t.campaigns.groups.upcoming} items={upcoming} />
          <Group title={t.campaigns.groups.past} items={past} />
        </>
      )}
    </div>
  );
}

function Group({ title, items }: { title: string; items: Item[] }) {
  if (items.length === 0) return null;
  return (
    <section className="mc-plan-group">
      <div className="mc-section-bar"><h2>{title} <span className="mc-muted">· {items.length}</span></h2></div>
      <PlanTable items={items} label={t.campaigns.tableLabel(title)} showElapsed />
    </section>
  );
}
