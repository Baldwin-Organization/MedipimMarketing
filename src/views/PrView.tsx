import { Suspense, lazy, useState } from 'react';
import { PlanTable } from '../components/PlanTable';
import { Button, EmptyState, Icon, Pill, Segmented, Stat } from '../components/ui';
import { euro, yearOf } from '../data/budget';
import { fmt } from '../data/dates';
import { TRADE_MEDIA, isInMedium, type MediaPriority } from '../data/media';
import { CHANNELS } from '../data/meta';
import { useStore } from '../data/store';
import type { Item } from '../data/types';
import { audienceLabel, channelLabel, lang, t } from '../i18n';
import { useUi } from '../ui-context';
import { PageHeader } from './PageHeader';

const ALL = 'alle';

const MediaMap = lazy(() => import('./MediaMap'));

const cardId = (medium: string) => `medium-${medium.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;

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
      <MediaShortlist items={all} />
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

const PRIORITY_TONE: Record<MediaPriority, 'success' | 'info' | 'neutral'> = { eerste_keuze: 'success', interessant: 'info', selectief: 'neutral' };

function MediaShortlist({ items }: { items: Item[] }) {
  const { openItem } = useUi();
  const { today } = useStore();
  const [view, setView] = useState<'lijst' | 'kaart'>('lijst');
  const show = (medium: string) => {
    setView('lijst');
    requestAnimationFrame(() => {
      const card = document.getElementById(cardId(medium));
      card?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      card?.focus({ preventScroll: true });
    });
  };
  return (
    <section className="mc-plan-group" aria-label={t.pr.shortlist}>
      <div className="mc-view-bar">
        <div>
          <h2>{t.pr.shortlist}</h2>
          <p className="mc-muted">{t.pr.shortlistHint}</p>
        </div>
        <Segmented
          label={t.pr.views.label}
          value={view}
          onChange={setView}
          options={[{ value: 'lijst', label: t.pr.views.list, icon: 'view_list' }, { value: 'kaart', label: t.pr.views.map, icon: 'language' }]}
        />
      </div>
      {view === 'kaart' ? (
        <Suspense fallback={<p className="mc-muted">{t.events.map.loading}</p>}>
          <MediaMap onShow={show} />
        </Suspense>
      ) : (
        <ul className="mc-media-grid">
          {TRADE_MEDIA.map((m) => {
            const planned = items.filter((i) => isInMedium(m, i.medium)).length;
            return (
              <li key={m.medium} id={cardId(m.medium)} tabIndex={-1} className="mc-card mc-media-card">
                <header className="mc-media-head">
                  <div>
                    <h3>{m.medium}</h3>
                    <p className="mc-muted">{[m.publisher, m.market[lang]].filter(Boolean).join(' · ')}</p>
                  </div>
                  <Pill tone={PRIORITY_TONE[m.priority]}>{t.pr.priority[m.priority]}</Pill>
                </header>
                {!m.audiences.includes('producenten') && (
                  <p className="mc-media-audience">
                    {m.audiences.map((a) => <span key={a} className="mc-pill" data-accent="2">{t.pr.audienceOther(audienceLabel(a))}</span>)}
                  </p>
                )}
                <p className="mc-media-text">{m.assessment[lang]}</p>
                <section className="mc-media-section" aria-label={`${t.pr.reach}: ${m.medium}`}>
                  <h4>{t.pr.reach}</h4>
                  <dl className="mc-media-facts">
                    {m.reach.map((f) => (
                      <div key={f.label.nl}>
                        <dt>{f.label[lang]}</dt>
                        <dd>{f.value[lang]}</dd>
                      </div>
                    ))}
                  </dl>
                </section>
                <section className="mc-media-section">
                  <h4>{t.pr.readers}</h4>
                  <p className="mc-media-text">{m.readers[lang]}</p>
                </section>
                {m.rates && <p className="mc-media-text"><strong>{t.pr.rates}:</strong> {m.rates[lang]}</p>}
                {m.ask && <p className="mc-media-text"><strong>{t.pr.ask}:</strong> {m.ask[lang]}</p>}
                <p className="mc-muted">
                  {t.pr.checked(fmt(`${m.checked}-01`, 'MMMM yyyy'))} {t.pr.sources}:{' '}
                  {m.sources.map((s, i) => (
                    <span key={s.url}>
                      {i > 0 && ', '}
                      <a className="mc-card-link" href={s.url} target="_blank" rel="noreferrer">{s.label[lang]}</a>
                    </span>
                  ))}
                </p>
                <footer className="mc-media-foot">
                  <a className="mc-card-link mc-media-link" href={m.url} target="_blank" rel="noreferrer" title={m.url} aria-label={`${t.pr.website}: ${m.medium}`}>{t.pr.website}<Icon name="open_in_new" size={14} /></a>
                  {planned > 0 && <span className="mc-muted">{t.pr.plannedFor(planned)}</span>}
                  <Button
                    variant="outlined"
                    size="small"
                    startIcon="add"
                    aria-label={`${t.pr.plan}: ${m.medium}`}
                    onClick={() => openItem(undefined, { type: 'pr', medium: m.medium, audiences: m.audiences, countries: m.countries, date: today })}
                  >
                    {t.pr.plan}
                  </Button>
                </footer>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
