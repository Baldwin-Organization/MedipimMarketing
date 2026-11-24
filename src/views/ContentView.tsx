import { useState } from 'react';
import { FilterSelect } from '../components/filters';
import { Button, Card, EmptyState, Icon, Segmented } from '../components/ui';
import { contentMix, countBy, inPeriod, targetTotal, type ContentPeriod } from '../data/content';
import { fmt } from '../data/dates';
import { AUDIENCES } from '../data/dimensions';
import { CONTENT_FORMATS, CONTENT_FORMAT_ICONS, CONTENT_STATUSES, PILLAR_ACCENTS } from '../data/meta';
import { newId } from '../data/repository';
import { useStore } from '../data/store';
import type { ContentFormat, ContentPiece, ContentPillar } from '../data/types';
import { audienceLabel, contentStatusLabel, formatLabel, lang, local, localIn, t } from '../i18n';
import { ContentDrawer, type ContentEditing } from './ContentDrawer';
import { PageHeader } from './PageHeader';

export const monthLabel = (month: string) => fmt(`${month}-01`, 'MMM yyyy');

export function ContentView() {
  const store = useStore();
  const [period, setPeriod] = useState<ContentPeriod>('all');
  const [pillar, setPillar] = useState('');
  const [format, setFormat] = useState<ContentFormat | ''>('');
  const [editing, setEditing] = useState<ContentEditing | null>(null);

  const years = [...new Set([store.today.slice(0, 4), ...store.content.flatMap((p) => (p.month ? [p.month.slice(0, 4)] : []))])].sort();
  const inScope = store.content.filter((p) => inPeriod(p, period));
  const shown = inScope
    .filter((p) => (!pillar || p.pillarId === pillar) && (!format || p.format === format))
    .sort((a, b) => (a.month ?? '9999').localeCompare(b.month ?? '9999') || local(a, 'title').localeCompare(local(b, 'title')));

  return (
    <div className="mc-page">
      <PageHeader
        title={t.content.title}
        subtitle={t.content.subtitle}
        actions={<Button startIcon="add" onClick={() => setEditing({ defaults: { pillarId: pillar || store.pillars[0]?.id, format: format || 'post' } })}>{t.content.newPiece}</Button>}
      />
      <Segmented
        label={t.content.period}
        value={period}
        onChange={setPeriod}
        options={[{ value: 'all' as ContentPeriod, label: t.content.allPeriods }, ...years.map((y) => ({ value: y as ContentPeriod, label: y }))]}
      />

      <div className="mc-content-grid">
        <MixCard pieces={inScope} />
        <div className="mc-content-side">
          <Card title={t.content.perFormat} icon="grid_view">
            <Counts rows={CONTENT_FORMATS.map((f) => ({ key: f, label: formatLabel(f), icon: CONTENT_FORMAT_ICONS[f] }))} counts={countBy(inScope, (p) => [p.format])} />
          </Card>
          <Card title={t.content.perAudience} icon="person">
            <Counts rows={AUDIENCES.map((a) => ({ key: a, label: audienceLabel(a) }))} counts={countBy(inScope, (p) => p.audiences)} />
          </Card>
        </div>
      </div>

      <section className="mc-plan-group">
        <div className="mc-section-bar">
          <h2>{t.content.board} <span className="mc-muted">· {shown.length}</span></h2>
          <div className="mc-filters">
            <FilterSelect label={t.content.pillar} value={pillar} onChange={setPillar} options={store.pillars.map((p) => ({ value: p.id, label: local(p, 'name') }))} />
            <FilterSelect label={t.content.format} value={format} onChange={setFormat} options={CONTENT_FORMATS.map((f) => ({ value: f, label: formatLabel(f) }))} />
          </div>
        </div>
        {shown.length === 0 ? (
          <EmptyState icon="lightbulb" title={store.content.length ? t.content.noneFound : t.content.empty}>
            {store.content.length ? t.content.noneFoundHint : t.content.emptyHint}
          </EmptyState>
        ) : (
          <div className="mc-content-board">
            {CONTENT_STATUSES.map((status) => {
              const column = shown.filter((p) => p.status === status);
              return (
                <section key={status} className="mc-content-column" aria-label={contentStatusLabel(status)} data-status={status}>
                  <h3>{contentStatusLabel(status)} <span className="mc-muted">{column.length}</span></h3>
                  {column.length === 0 ? <p className="mc-muted mc-content-empty">{t.content.emptyColumn}</p> : column.map((p) => (
                    <PieceCard key={p.id} piece={p} onOpen={() => setEditing({ id: p.id })} />
                  ))}
                </section>
              );
            })}
          </div>
        )}
      </section>

      <ContentDrawer editing={editing} onClose={() => setEditing(null)} />
    </div>
  );
}

function MixCard({ pieces }: { pieces: ContentPiece[] }) {
  const store = useStore();
  const [edit, setEdit] = useState(false);
  const mix = contentMix(pieces, store.pillars);
  const total = targetTotal(store.pillars);
  const inUse = (id: string) => store.content.filter((p) => p.pillarId === id).length;

  const update = (p: ContentPillar, patch: Partial<ContentPillar>) => store.savePillars([{ ...p, ...patch }]);
  const setText = (p: ContentPillar, field: 'name' | 'description', value: string) =>
    update(p, lang === 'nl' ? { [field]: value } : { translations: { en: { ...p.translations?.en, [field]: value } } });
  const add = () => {
    const order = Math.max(-1, ...store.pillars.map((p) => p.order)) + 1;
    const accent = PILLAR_ACCENTS.find((a) => !store.pillars.some((p) => p.accent === a)) ?? PILLAR_ACCENTS[order % PILLAR_ACCENTS.length];
    store.savePillars([{ id: newId(), name: lang === 'nl' ? t.content.newPillar : '', description: '', target: Math.max(0, 100 - total), accent, order, ...(lang === 'en' && { translations: { en: { name: t.content.newPillar } } }) }]);
  };

  return (
    <Card
      title={t.content.mix}
      icon="flag"
      className="mc-mix-card"
      action={<Button variant="text" intent="secondary" size="small" startIcon={edit ? 'check' : 'edit'} onClick={() => setEdit((v) => !v)}>{edit ? t.content.donePillars : t.content.editPillars}</Button>}
    >
      <div className="mc-table-wrap">
        <table className="mc-table mc-mix-table" aria-label={t.content.mix}>
          <thead>
            <tr>
              <th>{t.content.pillar}</th>
              <th className="mc-num">{t.content.target}</th>
              {!edit && <th className="mc-num">{t.content.planned}</th>}
              {!edit && <th className="mc-num">{t.content.shared}</th>}
              {!edit && <th aria-hidden="true" />}
              {edit && <th aria-hidden="true" />}
            </tr>
          </thead>
          <tbody>
            {mix.rows.map((r) => (
              <tr key={r.pillar.id} data-accent={r.pillar.accent}>
                <td>
                  {edit ? (
                    <div className="mc-pillar-edit">
                      <input className="mc-input" aria-label={t.content.pillarName} value={localIn(r.pillar, lang, 'name')} placeholder={local(r.pillar, 'name')} onChange={(e) => setText(r.pillar, 'name', e.target.value)} />
                      <input className="mc-input" aria-label={t.content.pillarDescription} value={localIn(r.pillar, lang, 'description')} placeholder={local(r.pillar, 'description') || t.content.pillarDescription} onChange={(e) => setText(r.pillar, 'description', e.target.value)} />
                    </div>
                  ) : (
                    <span className="mc-pillar">
                      <span className="mc-pillar-dot" />
                      <span>
                        <span className="mc-pillar-name">{local(r.pillar, 'name')}</span>
                        <span className="mc-pillar-desc">{local(r.pillar, 'description')}</span>
                      </span>
                    </span>
                  )}
                </td>
                <td className="mc-num">
                  {edit ? (
                    <input
                      type="number" min={0} max={100} step={5} className="mc-input mc-target-input"
                      aria-label={t.content.targetLabel(local(r.pillar, 'name'))}
                      value={r.pillar.target}
                      onChange={(e) => update(r.pillar, { target: Math.max(0, Math.min(100, Number(e.target.value) || 0)) })}
                    />
                  ) : `${r.pillar.target}%`}
                </td>
                {!edit && <td className="mc-num">{r.planned} <span className="mc-muted">· {Math.round(r.plannedShare)}%</span></td>}
                {!edit && <td className="mc-num">{r.shared} <span className="mc-muted">· {Math.round(r.sharedShare)}%</span></td>}
                {!edit && (
                  <td className="mc-mix-bar-cell">
                    <span className="mc-mix-bar" title={`${Math.round(r.plannedShare)}% / ${r.pillar.target}%`}>
                      <span data-kind="planned" style={{ width: `${Math.min(100, r.plannedShare)}%` }} />
                      <span className="mc-mix-target" style={{ left: `${Math.min(100, r.pillar.target)}%` }} />
                    </span>
                  </td>
                )}
                {edit && (
                  <td className="mc-num">
                    <span title={inUse(r.pillar.id) ? t.content.pillarInUse(inUse(r.pillar.id)) : undefined}>
                      <Button variant="text" intent="destructive" size="small" icon="delete" label={t.content.removePillar(local(r.pillar, 'name'))} disabled={inUse(r.pillar.id) > 0} onClick={() => store.deletePillar(r.pillar.id)} />
                    </span>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr>
              <th>{edit ? <Button variant="text" intent="secondary" size="small" startIcon="add" onClick={add}>{t.content.addPillar}</Button> : t.budget.total}</th>
              <th className="mc-num" data-over={total !== 100 || undefined}>{t.content.targetTotal(total)}</th>
              {!edit && <th className="mc-num">{t.content.pieces(mix.planned)}</th>}
              {!edit && <th className="mc-num">{mix.shared}</th>}
              <th />
            </tr>
          </tfoot>
        </table>
      </div>
      {total !== 100 && <p className="mc-error" role="status"><Icon name="warning" size={16} />{t.content.targetOff(total)}</p>}
      <p className="mc-muted">{t.content.mixNote}</p>
    </Card>
  );
}

function Counts<K extends string>({ rows, counts }: { rows: { key: K; label: string; icon?: Parameters<typeof Icon>[0]['name'] }[]; counts: Map<K, number> }) {
  const max = Math.max(1, ...counts.values());
  return (
    <ul className="mc-breakdown">
      {rows.map((r) => {
        const n = counts.get(r.key) ?? 0;
        return (
          <li key={r.key} data-empty={!n || undefined}>
            <span className="mc-breakdown-label">{r.icon && <Icon name={r.icon} size={16} />}{r.label}</span>
            <span className="mc-num">{n}</span>
            <span className="mc-budget-bar"><span data-kind="actual" style={{ width: `${(n / max) * 100}%` }} /></span>
          </li>
        );
      })}
    </ul>
  );
}

function PieceCard({ piece, onOpen }: { piece: ContentPiece; onOpen: () => void }) {
  const store = useStore();
  const pillar = store.pillars.find((p) => p.id === piece.pillarId);
  const linked = store.items.filter((i) => i.contentId === piece.id).length;
  return (
    <button type="button" className="mc-piece" data-accent={pillar?.accent} onClick={onOpen}>
      <span className="mc-piece-pillar">{pillar ? local(pillar, 'name') : t.content.noPillar}</span>
      <span className="mc-piece-title">{local(piece, 'title')}</span>
      <span className="mc-piece-meta">
        <span><Icon name={CONTENT_FORMAT_ICONS[piece.format]} size={14} />{formatLabel(piece.format)}</span>
        <span>{piece.month ? monthLabel(piece.month) : t.content.noMonth}</span>
        {piece.owner && <span>{piece.owner}</span>}
        {linked > 0 && <span className="mc-piece-linked"><Icon name="calendar_month" size={14} />{t.content.linked(linked)}</span>}
      </span>
    </button>
  );
}
