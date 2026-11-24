import type { DragEvent } from 'react';
import { TYPE_META } from '../data/meta';
import { itemTitle, participationLabel, t, todoText, typeLabel } from '../i18n';
import type { ScheduledTodo } from '../data/schedule';
import { useStore } from '../data/store';
import type { IsoDate, Item } from '../data/types';
import { useUi } from '../ui-context';
import { ParticipationDot } from './participation';
import { Checkbox, Icon, LateBadge } from './ui';

const MIME = 'application/x-mc-entry';

type DragPayload = { kind: 'item' | 'todo'; id: string };

function startDrag(e: DragEvent, payload: DragPayload) {
  e.dataTransfer.setData(MIME, JSON.stringify(payload));
  e.dataTransfer.setData('text/plain', payload.id);
  e.dataTransfer.effectAllowed = 'move';
}

/** Drop target props for a calendar day. */
export function useDayDrop(day: IsoDate) {
  const store = useStore();
  const { notify } = useUi();
  return {
    onDragOver: (e: DragEvent) => {
      if (!e.dataTransfer.types.includes(MIME)) return;
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
      (e.currentTarget as HTMLElement).dataset.dropping = 'true';
    },
    onDragLeave: (e: DragEvent) => {
      delete (e.currentTarget as HTMLElement).dataset.dropping;
    },
    onDrop: async (e: DragEvent) => {
      delete (e.currentTarget as HTMLElement).dataset.dropping;
      const raw = e.dataTransfer.getData(MIME);
      if (!raw) return;
      e.preventDefault();
      const p = JSON.parse(raw) as DragPayload;
      if (p.kind === 'item') {
        const item = store.itemsById.get(p.id);
        if (!item || item.date === day) return;
        const n = await store.moveItemTo(p.id, day);
        notify(t.entries.moved(itemTitle(item), n));
      } else {
        await store.moveTodoTo(p.id, day);
        notify(t.entries.todoMoved);
      }
    },
  };
}

export function ItemChip({ item, day, compact }: { item: Item; day?: IsoDate; compact?: boolean }) {
  const { openItem } = useUi();
  const m = TYPE_META[item.type];
  const span = item.endDate && item.endDate !== item.date;
  const continued = span && day && day !== item.date;
  return (
    <button
      type="button"
      className="mc-entry mc-item-chip"
      data-accent={m.accent}
      data-status={item.status}
      data-continued={continued || undefined}
      draggable
      onDragStart={(e) => startDrag(e, { kind: 'item', id: item.id })}
      onClick={() => openItem(item.id)}
      title={`${typeLabel(item.type)}: ${itemTitle(item)}${item.type === 'event' ? ` · ${participationLabel(item.participation)}` : ''}`}
    >
      <Icon name={m.icon} size={14} />
      {item.type === 'event' && <ParticipationDot value={item.participation} />}
      {!compact && item.time && !continued && <span className="mc-entry-time">{item.time}</span>}
      <span className="mc-entry-title">{continued ? `↳ ${itemTitle(item)}` : itemTitle(item)}</span>
    </button>
  );
}

export function TodoEntry({ todo, showItem = true, compact }: { todo: ScheduledTodo; showItem?: boolean; compact?: boolean }) {
  const store = useStore();
  const { openItem } = useUi();
  const item = store.itemsById.get(todo.itemId);
  const accent = item ? TYPE_META[item.type].accent : undefined;
  return (
    <div
      className="mc-entry mc-todo"
      data-done={todo.done || undefined}
      data-late={todo.lateDays > 0 || undefined}
      data-accent={accent}
      draggable={!todo.done}
      onDragStart={(e) => startDrag(e, { kind: 'todo', id: todo.id })}
    >
      <Checkbox checked={todo.done} onChange={() => store.toggleTodo(todo.id)} label={t.common.check(todoText(todo))} />
      <button type="button" className="mc-todo-body" onClick={() => item && openItem(item.id)}>
        <span className="mc-entry-title">{todoText(todo)}</span>
        {showItem && item && <span className="mc-todo-item">{itemTitle(item)}</span>}
      </button>
      <LateBadge days={todo.lateDays} compact={compact} />
    </div>
  );
}
