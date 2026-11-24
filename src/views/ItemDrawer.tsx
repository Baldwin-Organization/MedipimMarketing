import { useEffect, useState } from 'react';
import { DimensionFields } from '../components/dimensions';
import { Button, Checkbox, Drawer, Field, Icon, LateBadge, Segmented } from '../components/ui';
import { fmt, shiftIso } from '../data/dates';
import { CHANNELS, HAS_PERIOD, ITEM_TYPES, OWNERS, STATUSES, STATUS_META, TYPE_META } from '../data/meta';
import { newId } from '../data/repository';
import { rollForward } from '../data/schedule';
import { useStore, type ItemDraft } from '../data/store';
import type { ItemType, Todo } from '../data/types';
import { useUi } from '../ui-context';

const blank = (date: string): ItemDraft => ({
  type: 'social', title: '', description: '', channel: 'LinkedIn', date, time: '', status: 'idee',
  owner: '', campaign: '', audiences: [], productTypes: [], countries: [],
});

export function ItemDrawer() {
  const store = useStore();
  const { editing, closeItem, notify } = useUi();
  const [draft, setDraft] = useState<ItemDraft>(blank(store.today));
  const [todos, setTodos] = useState<Todo[]>([]);
  const [applyTemplate, setApplyTemplate] = useState(true);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [newTodo, setNewTodo] = useState('');
  const [error, setError] = useState<string | null>(null);

  const isNew = !editing?.id;
  const offerTemplate = isNew || todos.length === 0;

  useEffect(() => {
    if (!editing) return;
    setConfirmDelete(false);
    setError(null);
    setNewTodo('');
    if (editing.id) {
      const item = store.itemsById.get(editing.id);
      if (!item) return;
      setDraft({ ...item });
      setTodos(store.todosFor(item.id));
      setApplyTemplate(false);
    } else {
      const base = { ...blank(store.today), ...editing.defaults };
      setDraft({ ...base, channel: editing.defaults?.channel ?? CHANNELS[base.type][0] });
      setTodos([]);
      setApplyTemplate(true);
    }
    // Only re-seed the form when another item opens.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editing]);

  const set = <K extends keyof ItemDraft>(key: K, value: ItemDraft[K]) => setDraft((d) => ({ ...d, [key]: value }));
  const setType = (type: ItemType) => setDraft((d) => ({ ...d, type, channel: CHANNELS[type][0], endDate: HAS_PERIOD.includes(type) ? d.endDate ?? d.date : undefined }));
  const hasPeriod = HAS_PERIOD.includes(draft.type);
  const media = [...new Set(store.items.map((i) => i.medium).filter((m): m is string => !!m))].sort();
  const euro = (v: string) => (v === '' ? undefined : Math.max(0, Number(v)));
  const campaigns = [...new Set(store.items.map((i) => i.campaign).filter(Boolean))].sort();
  const preview = offerTemplate && applyTemplate && draft.date ? store.templateTodos(draft) : [];

  const save = async () => {
    if (!draft.title.trim()) return setError('Geef het item een titel.');
    if (!draft.date) return setError('Kies een datum.');
    if (draft.endDate && draft.endDate < draft.date) return setError('De einddatum ligt voor de startdatum.');
    const saved = await store.saveItem({ ...draft, title: draft.title.trim(), time: draft.time || undefined }, todos, { applyTemplate: offerTemplate && applyTemplate });
    notify(isNew ? `"${saved.title}" toegevoegd.` : 'Wijzigingen bewaard.');
    closeItem();
  };

  const remove = async () => {
    if (!draft.id) return;
    await store.deleteItem(draft.id);
    notify(`"${draft.title}" verwijderd.`);
    closeItem();
  };

  const addTodo = () => {
    if (!newTodo.trim()) return;
    const due = draft.date ? shiftIso(draft.date, -1) : store.today;
    setTodos((t) => [...t, { id: newId(), itemId: draft.id ?? '', title: newTodo.trim(), dueDate: due, done: false, offsetDays: -1, owner: draft.owner }]);
    setNewTodo('');
  };

  const updateTodo = (id: string, patch: Partial<Todo>) => setTodos((list) => list.map((t) => (t.id === id ? { ...t, ...patch } : t)));

  return (
    <Drawer
      open={!!editing}
      onClose={closeItem}
      title={isNew ? 'Nieuw item' : 'Item bewerken'}
      footer={
        <>
          {!isNew && (confirmDelete ? (
            <span className="mc-confirm">
              Item en to do's verwijderen?
              <Button variant="contained" intent="destructive" size="small" onClick={remove}>Verwijderen</Button>
              <Button variant="text" intent="secondary" size="small" onClick={() => setConfirmDelete(false)}>Nee</Button>
            </span>
          ) : (
            <Button variant="text" intent="destructive" startIcon="delete" onClick={() => setConfirmDelete(true)}>Verwijderen</Button>
          ))}
          <span className="mc-spacer" />
          <Button variant="text" intent="secondary" onClick={closeItem}>Annuleren</Button>
          <Button onClick={save}>{isNew ? 'Toevoegen' : 'Bewaren'}</Button>
        </>
      }
    >
      <div className="mc-form">
        <Segmented
          label="Type"
          value={draft.type}
          onChange={setType}
          options={ITEM_TYPES.map((t) => ({ value: t, label: TYPE_META[t].label.split(' /')[0], icon: TYPE_META[t].icon }))}
        />
        <Field label="Titel">{(id) => <input id={id} className="mc-input" value={draft.title} onChange={(e) => set('title', e.target.value)} placeholder="Bv. Nieuwsbrief december" />}</Field>
        <Field label="Beschrijving" optional>{(id) => <textarea id={id} className="mc-input" rows={3} value={draft.description} onChange={(e) => set('description', e.target.value)} />}</Field>
        <div className="mc-form-row">
          <Field label="Kanaal">{(id) => (
            <select id={id} className="mc-input" value={draft.channel} onChange={(e) => set('channel', e.target.value)}>
              {[...new Set([...CHANNELS[draft.type], draft.channel])].map((c) => <option key={c}>{c}</option>)}
            </select>
          )}</Field>
          <Field label="Status">{(id) => (
            <select id={id} className="mc-input" value={draft.status} onChange={(e) => set('status', e.target.value as ItemDraft['status'])}>
              {STATUSES.map((s) => <option key={s} value={s}>{STATUS_META[s].label}</option>)}
            </select>
          )}</Field>
        </div>
        <div className="mc-form-row">
          <Field label={hasPeriod ? 'Startdatum' : draft.type === 'pr' ? 'Publicatiedatum' : 'Datum'}>{(id) => <input id={id} type="date" className="mc-input" value={draft.date} onChange={(e) => set('date', e.target.value)} />}</Field>
          {hasPeriod ? (
            <Field label="Einddatum">{(id) => <input id={id} type="date" className="mc-input" value={draft.endDate ?? ''} min={draft.date} onChange={(e) => set('endDate', e.target.value)} />}</Field>
          ) : (
            <Field label="Tijd" optional>{(id) => <input id={id} type="time" className="mc-input" value={draft.time ?? ''} onChange={(e) => set('time', e.target.value)} />}</Field>
          )}
        </div>
        {draft.type === 'pr' && (
          <Field label="Medium" optional>{(id) => (
            <>
              <input id={id} className="mc-input" list={`${id}-list`} value={draft.medium ?? ''} onChange={(e) => set('medium', e.target.value)} placeholder="Bv. Farmaceutisch Weekblad" />
              <datalist id={`${id}-list`}>{media.map((m) => <option key={m} value={m} />)}</datalist>
            </>
          )}</Field>
        )}
        {draft.type === 'event' && (
          <Field label="Locatie" optional>{(id) => <input id={id} className="mc-input" value={draft.location ?? ''} onChange={(e) => set('location', e.target.value)} placeholder="Stad, locatie · standnummer" />}</Field>
        )}
        <div className="mc-form-row">
          <Field label="Eigenaar">{(id) => (
            <select id={id} className="mc-input" value={draft.owner} onChange={(e) => set('owner', e.target.value)}>
              <option value="">Nog niemand</option>
              {OWNERS.map((o) => <option key={o}>{o}</option>)}
            </select>
          )}</Field>
          <Field label="Thema" optional>{(id) => (
            <>
              <input id={id} className="mc-input" list={`${id}-list`} value={draft.campaign} onChange={(e) => set('campaign', e.target.value)} />
              <datalist id={`${id}-list`}>{campaigns.map((c) => <option key={c} value={c} />)}</datalist>
            </>
          )}</Field>
        </div>

        <section className="mc-form-section" aria-label="Budget">
          <h3>Budget</h3>
          <div className="mc-form-row">
            <Field label="Gepland (€, excl. btw)" optional>{(id) => (
              <input id={id} type="number" min={0} step={50} inputMode="decimal" className="mc-input" value={draft.budgetPlanned ?? ''} onChange={(e) => set('budgetPlanned', euro(e.target.value))} />
            )}</Field>
            <Field label="Werkelijk besteed (€)" optional>{(id) => (
              <input id={id} type="number" min={0} step={50} inputMode="decimal" className="mc-input" value={draft.budgetActual ?? ''} onChange={(e) => set('budgetActual', euro(e.target.value))} />
            )}</Field>
          </div>
        </section>

        <section className="mc-form-section" aria-label="Verrijking">
          <h3>Verrijking</h3>
          <DimensionFields value={draft} onChange={(patch) => setDraft((d) => ({ ...d, ...patch }))} />
        </section>

        <section className="mc-form-section" aria-label="To do's">
          <h3>To do's</h3>
          {offerTemplate && (
            <label className="mc-switch-row">
              <Checkbox checked={applyTemplate} onChange={() => setApplyTemplate((v) => !v)} label="Standaard to do's toevoegen" />
              <span>Standaard to do's voor {TYPE_META[draft.type].label.toLowerCase()} toevoegen</span>
            </label>
          )}
          {preview.length > 0 && (
            <ul className="mc-template-list">
              {preview.map((t) => (
                <li key={t.id}><Icon name="checklist" size={16} /><span>{t.title}</span><span className="mc-muted">{fmt(t.dueDate, 'EEE d MMM')}</span></li>
              ))}
            </ul>
          )}
          {todos.length > 0 && (
            <ul className="mc-todo-edit">
              {todos.map((t) => {
                const late = rollForward(t, store.today).lateDays;
                return (
                  <li key={t.id} data-done={t.done || undefined}>
                    <Checkbox checked={t.done} onChange={() => updateTodo(t.id, { done: !t.done, doneAt: t.done ? undefined : new Date().toISOString() })} label={`${t.title} afvinken`} />
                    <input className="mc-input mc-input-inline" aria-label="To do" value={t.title} onChange={(e) => updateTodo(t.id, { title: e.target.value })} />
                    <LateBadge days={late} />
                    <input type="date" className="mc-input mc-input-date" aria-label="Vervaldatum" value={t.dueDate} onChange={(e) => updateTodo(t.id, { dueDate: e.target.value })} />
                    <Button variant="text" intent="secondary" size="small" icon="delete" label="To do verwijderen" onClick={() => setTodos((list) => list.filter((x) => x.id !== t.id))} />
                  </li>
                );
              })}
            </ul>
          )}
          <div className="mc-add-todo">
            <input className="mc-input" aria-label="Nieuwe to do" placeholder="Nieuwe to do…" value={newTodo} onChange={(e) => setNewTodo(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && addTodo()} />
            <Button variant="outlined" intent="secondary" startIcon="add" onClick={addTodo}>To do toevoegen</Button>
          </div>
        </section>
        {error && <p className="mc-error" role="alert"><Icon name="warning" size={16} />{error}</p>}
      </div>
    </Drawer>
  );
}
