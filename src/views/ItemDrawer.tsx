import { useEffect, useState } from 'react';
import { DimensionFields } from '../components/dimensions';
import { Button, Checkbox, Drawer, Field, Icon, LateBadge, Segmented } from '../components/ui';
import { fmt, shiftIso } from '../data/dates';
import { CHANNELS, HAS_PERIOD, ITEM_TYPES, OWNERS, STATUSES, TYPE_META } from '../data/meta';
import { newId } from '../data/repository';
import { rollForward } from '../data/schedule';
import { useStore, type ItemDraft } from '../data/store';
import type { ItemType, Todo } from '../data/types';
import { channelLabel, statusLabel, t, todoLabel, typeLabel } from '../i18n';
import { ParticipationPicker } from '../components/participation';
import { useUi } from '../ui-context';

const blank = (date: string): ItemDraft => ({
  type: 'social', title: '', description: '', channel: CHANNELS.social[0], date, time: '', status: 'idee',
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
  const setType = (type: ItemType) => setDraft((d) => ({ ...d, type, channel: CHANNELS[type][0], endDate: HAS_PERIOD.includes(type) ? d.endDate ?? d.date : undefined, participation: type === 'event' ? d.participation : undefined }));
  const hasPeriod = HAS_PERIOD.includes(draft.type);
  const media = [...new Set(store.items.map((i) => i.medium).filter((m): m is string => !!m))].sort();
  const euro = (v: string) => (v === '' ? undefined : Math.max(0, Number(v)));
  const campaigns = [...new Set(store.items.map((i) => i.campaign).filter(Boolean))].sort();
  const preview = offerTemplate && applyTemplate && draft.date ? store.templateTodos(draft) : [];

  const save = async () => {
    if (!draft.title.trim()) return setError(t.drawer.errTitle);
    if (!draft.date) return setError(t.drawer.errDate);
    if (draft.endDate && draft.endDate < draft.date) return setError(t.drawer.errEnd);
    const saved = await store.saveItem({ ...draft, title: draft.title.trim(), time: draft.time || undefined }, todos, { applyTemplate: offerTemplate && applyTemplate });
    notify(isNew ? t.drawer.added(saved.title) : t.drawer.saved);
    closeItem();
  };

  const remove = async () => {
    if (!draft.id) return;
    await store.deleteItem(draft.id);
    notify(t.drawer.deleted(draft.title));
    closeItem();
  };

  const addTodo = () => {
    if (!newTodo.trim()) return;
    const due = draft.date ? shiftIso(draft.date, -1) : store.today;
    setTodos((list) => [...list, { id: newId(), itemId: draft.id ?? '', title: newTodo.trim(), dueDate: due, done: false, offsetDays: -1, owner: draft.owner }]);
    setNewTodo('');
  };

  const updateTodo = (id: string, patch: Partial<Todo>) => setTodos((list) => list.map((todo) => (todo.id === id ? { ...todo, ...patch } : todo)));

  return (
    <Drawer
      open={!!editing}
      onClose={closeItem}
      title={isNew ? t.drawer.newTitle : t.drawer.editTitle}
      footer={
        <>
          {!isNew && (confirmDelete ? (
            <span className="mc-confirm">
              {t.drawer.confirmDelete}
              <Button variant="contained" intent="destructive" size="small" onClick={remove}>{t.drawer.delete}</Button>
              <Button variant="text" intent="secondary" size="small" onClick={() => setConfirmDelete(false)}>{t.drawer.no}</Button>
            </span>
          ) : (
            <Button variant="text" intent="destructive" startIcon="delete" onClick={() => setConfirmDelete(true)}>{t.drawer.delete}</Button>
          ))}
          <span className="mc-spacer" />
          <Button variant="text" intent="secondary" onClick={closeItem}>{t.drawer.cancel}</Button>
          <Button onClick={save}>{isNew ? t.drawer.add : t.drawer.save}</Button>
        </>
      }
    >
      <div className="mc-form">
        <Segmented
          label={t.drawer.type}
          value={draft.type}
          onChange={setType}
          options={ITEM_TYPES.map((type) => ({ value: type, label: t.types[type].short, icon: TYPE_META[type].icon }))}
        />
        <Field label={t.drawer.title}>{(id) => <input id={id} className="mc-input" value={draft.title} onChange={(e) => set('title', e.target.value)} placeholder={t.drawer.titlePlaceholder} />}</Field>
        <Field label={t.drawer.description} optional>{(id) => <textarea id={id} className="mc-input" rows={3} value={draft.description} onChange={(e) => set('description', e.target.value)} />}</Field>
        <div className="mc-form-row">
          <Field label={t.drawer.channel}>{(id) => (
            <select id={id} className="mc-input" value={draft.channel} onChange={(e) => set('channel', e.target.value)}>
              {[...new Set([...CHANNELS[draft.type], draft.channel])].map((c) => <option key={c} value={c}>{channelLabel(c)}</option>)}
            </select>
          )}</Field>
          <Field label={t.drawer.status}>{(id) => (
            <select id={id} className="mc-input" value={draft.status} onChange={(e) => set('status', e.target.value as ItemDraft['status'])}>
              {STATUSES.map((s) => <option key={s} value={s}>{statusLabel(s)}</option>)}
            </select>
          )}</Field>
        </div>
        <div className="mc-form-row">
          <Field label={hasPeriod ? t.drawer.startDate : draft.type === 'pr' ? t.drawer.publicationDate : t.drawer.date}>{(id) => <input id={id} type="date" className="mc-input" value={draft.date} onChange={(e) => set('date', e.target.value)} />}</Field>
          {hasPeriod ? (
            <Field label={t.drawer.endDate}>{(id) => <input id={id} type="date" className="mc-input" value={draft.endDate ?? ''} min={draft.date} onChange={(e) => set('endDate', e.target.value)} />}</Field>
          ) : (
            <Field label={t.drawer.time} optional>{(id) => <input id={id} type="time" className="mc-input" value={draft.time ?? ''} onChange={(e) => set('time', e.target.value)} />}</Field>
          )}
        </div>
        {draft.type === 'pr' && (
          <Field label={t.drawer.medium} optional>{(id) => (
            <>
              <input id={id} className="mc-input" list={`${id}-list`} value={draft.medium ?? ''} onChange={(e) => set('medium', e.target.value)} placeholder={t.drawer.mediumPlaceholder} />
              <datalist id={`${id}-list`}>{media.map((m) => <option key={m} value={m} />)}</datalist>
            </>
          )}</Field>
        )}
        {draft.type === 'event' && (
          <div className="mc-field" role="group" aria-label={t.participationTitle}>
            <span className="mc-field-label">{t.participationTitle}</span>
            <ParticipationPicker value={draft.participation} onChange={(p) => set('participation', p)} />
          </div>
        )}
        {draft.type === 'event' && (
          <Field label={t.drawer.location} optional>{(id) => <input id={id} className="mc-input" value={draft.location ?? ''} onChange={(e) => set('location', e.target.value)} placeholder={t.drawer.locationPlaceholder} />}</Field>
        )}
        <div className="mc-form-row">
          <Field label={t.drawer.owner}>{(id) => (
            <select id={id} className="mc-input" value={draft.owner} onChange={(e) => set('owner', e.target.value)}>
              <option value="">{t.drawer.nobodyYet}</option>
              {OWNERS.map((o) => <option key={o}>{o}</option>)}
            </select>
          )}</Field>
          <Field label={t.drawer.theme} optional>{(id) => (
            <>
              <input id={id} className="mc-input" list={`${id}-list`} value={draft.campaign} onChange={(e) => set('campaign', e.target.value)} />
              <datalist id={`${id}-list`}>{campaigns.map((c) => <option key={c} value={c} />)}</datalist>
            </>
          )}</Field>
        </div>

        <section className="mc-form-section" aria-label={t.drawer.budget}>
          <h3>{t.drawer.budget}</h3>
          <div className="mc-form-row">
            <Field label={t.drawer.planned} optional>{(id) => (
              <input id={id} type="number" min={0} step={50} inputMode="decimal" className="mc-input" value={draft.budgetPlanned ?? ''} onChange={(e) => set('budgetPlanned', euro(e.target.value))} />
            )}</Field>
            <Field label={t.drawer.actual} optional>{(id) => (
              <input id={id} type="number" min={0} step={50} inputMode="decimal" className="mc-input" value={draft.budgetActual ?? ''} onChange={(e) => set('budgetActual', euro(e.target.value))} />
            )}</Field>
          </div>
        </section>

        <section className="mc-form-section" aria-label={t.drawer.enrichment}>
          <h3>{t.drawer.enrichment}</h3>
          <DimensionFields value={draft} onChange={(patch) => setDraft((d) => ({ ...d, ...patch }))} />
        </section>

        <section className="mc-form-section" aria-label={t.drawer.todos}>
          <h3>{t.drawer.todos}</h3>
          {offerTemplate && (
            <label className="mc-switch-row">
              <Checkbox checked={applyTemplate} onChange={() => setApplyTemplate((v) => !v)} label={t.drawer.addTemplate} />
              <span>{t.drawer.addTemplateFor(typeLabel(draft.type).toLowerCase())}</span>
            </label>
          )}
          {preview.length > 0 && (
            <ul className="mc-template-list">
              {preview.map((todo) => (
                <li key={todo.id}><Icon name="checklist" size={16} /><span>{todoLabel(todo.title)}</span><span className="mc-muted">{fmt(todo.dueDate, 'EEE d MMM')}</span></li>
              ))}
            </ul>
          )}
          {todos.length > 0 && (
            <ul className="mc-todo-edit">
              {todos.map((todo) => {
                const late = rollForward(todo, store.today).lateDays;
                return (
                  <li key={todo.id} data-done={todo.done || undefined}>
                    <Checkbox checked={todo.done} onChange={() => updateTodo(todo.id, { done: !todo.done, doneAt: todo.done ? undefined : new Date().toISOString() })} label={t.common.check(todoLabel(todo.title))} />
                    <input className="mc-input mc-input-inline" aria-label={t.drawer.todo} value={todoLabel(todo.title)} onChange={(e) => updateTodo(todo.id, { title: e.target.value })} />
                    <LateBadge days={late} />
                    <input type="date" className="mc-input mc-input-date" aria-label={t.drawer.dueDate} value={todo.dueDate} onChange={(e) => updateTodo(todo.id, { dueDate: e.target.value })} />
                    <Button variant="text" intent="secondary" size="small" icon="delete" label={t.drawer.removeTodo} onClick={() => setTodos((list) => list.filter((x) => x.id !== todo.id))} />
                  </li>
                );
              })}
            </ul>
          )}
          <div className="mc-add-todo">
            <input className="mc-input" aria-label={t.drawer.newTodo} placeholder={t.drawer.newTodoPlaceholder} value={newTodo} onChange={(e) => setNewTodo(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && addTodo()} />
            <Button variant="outlined" intent="secondary" startIcon="add" onClick={addTodo}>{t.drawer.addTodo}</Button>
          </div>
        </section>
        {error && <p className="mc-error" role="alert"><Icon name="warning" size={16} />{error}</p>}
      </div>
    </Drawer>
  );
}
