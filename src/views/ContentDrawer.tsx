import { useEffect, useState } from 'react';
import { Button, Checkbox, Drawer, Field, Icon, ToggleChipGroup, TypeBadge } from '../components/ui';
import { fmt } from '../data/dates';
import { AUDIENCES } from '../data/dimensions';
import { CONTENT_FORMATS, CONTENT_FORMAT_ICONS, CONTENT_STATUSES, OWNERS } from '../data/meta';
import { useStore, type ContentDraft } from '../data/store';
import type { ContentPiece } from '../data/types';
import { audienceLabel, contentStatusLabel, formatLabel, itemTitle, lang, local, localIn, otherLang, statusLabel, t, type Lang } from '../i18n';
import { useUi } from '../ui-context';

export interface ContentEditing {
  id?: string;
  defaults?: Partial<ContentDraft>;
}

const blank = (): ContentDraft => ({ title: '', description: '', pillarId: '', format: 'post', status: 'idee', audiences: [], owner: '' });

type Text = 'title' | 'description';

export function ContentDrawer({ editing, onClose }: { editing: ContentEditing | null; onClose: () => void }) {
  const store = useStore();
  const { openItem, notify } = useUi();
  const [draft, setDraft] = useState<ContentDraft>(blank());
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isNew = !editing?.id;
  const other = otherLang();

  useEffect(() => {
    if (!editing) return;
    setConfirmDelete(false);
    setError(null);
    const existing = editing.id && store.content.find((c) => c.id === editing.id);
    setDraft(existing ? { ...existing } : { ...blank(), ...editing.defaults });
    // Only re-seed the form when another piece opens.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editing]);

  const set = <K extends keyof ContentDraft>(key: K, value: ContentDraft[K]) => setDraft((d) => ({ ...d, [key]: value }));
  const text = (l: Lang, field: Text) => localIn(draft, l, field);
  const setText = (l: Lang, field: Text, value: string) =>
    setDraft((d) => (l === 'nl' ? { ...d, [field]: value } : { ...d, translations: { en: { ...d.translations?.en, [field]: value } } }));
  const linked = draft.id ? store.items.filter((i) => i.contentId === draft.id).sort((a, b) => a.date.localeCompare(b.date)) : [];

  /** Validates and stores the draft; returns the saved piece, or null when something is missing. */
  const persist = async (): Promise<ContentPiece | null> => {
    if (!draft.title.trim() && !draft.translations?.en?.title?.trim()) return setError(t.content.errTitle), null;
    if (!draft.pillarId) return setError(t.content.errPillar), null;
    const en = Object.fromEntries(Object.entries(draft.translations?.en ?? {}).map(([k, v]) => [k, v?.trim()]).filter(([, v]) => v));
    return store.saveContent({ ...draft, title: draft.title.trim(), month: draft.month || undefined, translations: Object.keys(en).length ? { en } : undefined });
  };

  const save = async () => {
    const saved = await persist();
    if (!saved) return;
    notify(isNew ? t.content.added(local(saved, 'title')) : t.content.saved);
    onClose();
  };

  const schedule = async () => {
    const saved = await persist();
    if (!saved) return;
    const month = saved.month && `${saved.month}-01` > store.today ? `${saved.month}-01` : store.today;
    onClose();
    openItem(undefined, {
      type: saved.format === 'nieuwsbrief' ? 'email' : 'social',
      title: saved.title,
      translations: saved.translations?.en?.title ? { en: { title: saved.translations.en.title } } : undefined,
      date: month,
      owner: saved.owner,
      audiences: saved.audiences,
      contentId: saved.id,
    });
  };

  const remove = async () => {
    if (!draft.id) return;
    await store.deleteContent(draft.id);
    notify(t.content.deleted(local(draft, 'title')));
    onClose();
  };

  return (
    <Drawer
      open={!!editing}
      onClose={onClose}
      title={isNew ? t.content.newTitle : t.content.editTitle}
      footer={
        <>
          {!isNew && (confirmDelete ? (
            <span className="mc-confirm">
              {t.content.confirmDelete}
              <Button variant="contained" intent="destructive" size="small" onClick={remove}>{t.drawer.delete}</Button>
              <Button variant="text" intent="secondary" size="small" onClick={() => setConfirmDelete(false)}>{t.drawer.no}</Button>
            </span>
          ) : (
            <Button variant="text" intent="destructive" startIcon="delete" onClick={() => setConfirmDelete(true)}>{t.drawer.delete}</Button>
          ))}
          <span className="mc-spacer" />
          <Button variant="text" intent="secondary" onClick={onClose}>{t.drawer.cancel}</Button>
          <Button onClick={save}>{isNew ? t.drawer.add : t.drawer.save}</Button>
        </>
      }
    >
      <div className="mc-form">
        <Field label={t.drawer.title}>{(id) => <input id={id} className="mc-input" value={text(lang, 'title')} onChange={(e) => setText(lang, 'title', e.target.value)} placeholder={text(other, 'title') || t.content.titlePlaceholder} />}</Field>
        <Field label={t.content.description} optional>{(id) => <textarea id={id} className="mc-input" rows={3} value={text(lang, 'description')} onChange={(e) => setText(lang, 'description', e.target.value)} placeholder={text(other, 'description')} />}</Field>
        <div className="mc-form-row">
          <Field label={t.content.pillar}>{(id) => (
            <select id={id} className="mc-input" value={draft.pillarId} onChange={(e) => set('pillarId', e.target.value)}>
              {!draft.pillarId && <option value="">–</option>}
              {store.pillars.map((p) => <option key={p.id} value={p.id}>{local(p, 'name')}</option>)}
            </select>
          )}</Field>
          <Field label={t.content.format}>{(id) => (
            <select id={id} className="mc-input" value={draft.format} onChange={(e) => set('format', e.target.value as ContentDraft['format'])}>
              {CONTENT_FORMATS.map((f) => <option key={f} value={f}>{formatLabel(f)}</option>)}
            </select>
          )}</Field>
        </div>
        <label className="mc-switch-row">
          <Checkbox checked={!!draft.recurring} onChange={() => set('recurring', draft.recurring ? undefined : true)} label={t.content.recurring} />
          <span>{t.content.recurring} <span className="mc-muted">· {t.content.recurringHint}</span></span>
        </label>
        <div className="mc-form-row">
          <Field label={t.content.status}>{(id) => (
            <select id={id} className="mc-input" value={draft.status} onChange={(e) => set('status', e.target.value as ContentDraft['status'])}>
              {CONTENT_STATUSES.map((s) => <option key={s} value={s}>{contentStatusLabel(s)}</option>)}
            </select>
          )}</Field>
          <Field label={t.content.month} optional>{(id) => <input id={id} type="month" className="mc-input" value={draft.month ?? ''} onChange={(e) => set('month', e.target.value || undefined)} />}</Field>
        </div>
        <Field label={t.content.owner}>{(id) => (
          <select id={id} className="mc-input" value={draft.owner} onChange={(e) => set('owner', e.target.value)}>
            <option value="">{t.drawer.nobodyYet}</option>
            {OWNERS.map((o) => <option key={o}>{o}</option>)}
          </select>
        )}</Field>
        <div className="mc-field" role="group" aria-label={t.content.audience}>
          <span className="mc-field-label">{t.content.audience}</span>
          <ToggleChipGroup label={t.content.audience} value={draft.audiences} onChange={(v) => set('audiences', v)} options={AUDIENCES.map((a) => ({ value: a, label: audienceLabel(a) }))} />
        </div>

        <section className="mc-form-section" aria-label={t.drawer.translation}>
          <h3>{t.drawer.translation}</h3>
          <p className="mc-muted">{t.drawer.translationHint}</p>
          <Field label={t.drawer.title} optional>{(id) => <input id={id} className="mc-input" lang={other} value={text(other, 'title')} onChange={(e) => setText(other, 'title', e.target.value)} placeholder={text(lang, 'title')} />}</Field>
          <Field label={t.content.description} optional>{(id) => <textarea id={id} className="mc-input" lang={other} rows={3} value={text(other, 'description')} onChange={(e) => setText(other, 'description', e.target.value)} placeholder={text(lang, 'description')} />}</Field>
        </section>

        <section className="mc-form-section" aria-label={t.content.inCalendar}>
          <h3>{t.content.inCalendar}</h3>
          <p className="mc-muted">{t.content.inCalendarHint}</p>
          {linked.length === 0 ? <p className="mc-muted">{t.content.notInCalendar}</p> : (
            <ul className="mc-linked-items">
              {linked.map((i) => (
                <li key={i.id}>
                  <button type="button" onClick={() => { onClose(); openItem(i.id); }}>
                    <TypeBadge type={i.type} />
                    <span className="mc-linked-title">{itemTitle(i)}</span>
                    <span className="mc-muted">{fmt(i.date, 'd MMM yyyy')} · {statusLabel(i.status)}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
          <div>
            <Button variant="outlined" intent="secondary" startIcon={CONTENT_FORMAT_ICONS[draft.format] === 'mail' ? 'mail' : 'calendar_month'} onClick={schedule}>{t.content.schedule}</Button>
          </div>
        </section>
        {error && <p className="mc-error" role="alert"><Icon name="warning" size={16} />{error}</p>}
      </div>
    </Drawer>
  );
}
