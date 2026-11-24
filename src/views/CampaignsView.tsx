import { useState } from 'react';
import { PlanTable } from '../components/PlanTable';
import { Button, EmptyState, Segmented, Stat } from '../components/ui';
import { euro, yearOf } from '../data/budget';
import { shiftIso } from '../data/dates';
import { CHANNELS } from '../data/meta';
import { useStore } from '../data/store';
import type { Item } from '../data/types';
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
        title="Campagnes"
        subtitle="Betalende advertenties en campagnes op LinkedIn, Google en ChatGPT."
        actions={<Button startIcon="add" onClick={create}>Nieuwe campagne</Button>}
      />
      <Segmented
        label="Kanaal"
        value={channel}
        onChange={setChannel}
        options={[{ value: ALL, label: 'Alle kanalen' }, ...channels.map((c) => ({ value: c, label: c }))]}
      />
      <div className="mc-stats">
        <Stat label="Lopend" value={running.length} tone="brand" icon="ads_click" hint="campagnes die nu draaien" />
        <Stat label="Gepland" value={upcoming.length} tone="neutral" icon="schedule" hint="starten later" />
        <Stat label={`Budget ${year}`} value={euro(planned)} tone="neutral" icon="payments" hint="gepland, excl. btw" />
        <Stat label={`Besteed ${year}`} value={euro(spent)} tone={spent > planned ? 'error' : 'neutral'} icon="history" hint={planned ? `${Math.round((spent / planned) * 100)}% van gepland` : 'nog geen budget gepland'} />
      </div>
      {shown.length === 0 ? (
        <EmptyState icon="ads_click" title="Nog geen campagnes">
          Plan een betalende campagne op LinkedIn, Google of ChatGPT, met looptijd, doelgroep en budget.
        </EmptyState>
      ) : (
        <>
          <Group title="Lopend" items={running} />
          <Group title="Komend" items={upcoming} />
          <Group title="Afgelopen" items={past} />
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
      <PlanTable items={items} label={`${title} campagnes`} showElapsed />
    </section>
  );
}
