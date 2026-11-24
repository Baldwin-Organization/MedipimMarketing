import { urgencyOf, type ScheduledTodo, type Urgency } from '../data/schedule';
import { useStore } from '../data/store';
import { TodoEntry } from './entries';
import { Icon } from './ui';

const COLUMNS: { key: Urgency; label: string; empty: string }[] = [
  { key: 'late', label: 'Te laat', empty: 'Niets te laat.' },
  { key: 'today', label: 'Vandaag', empty: 'Niets meer voor vandaag.' },
  { key: 'week', label: 'Deze week', empty: 'Geen to do\u2019s de komende 7 dagen.' },
];

export function groupByUrgency(todos: ScheduledTodo[], today: string) {
  const groups: Record<Urgency, ScheduledTodo[]> = { late: [], today: [], week: [], later: [], done: [] };
  for (const t of todos) groups[urgencyOf(t, today)].push(t);
  groups.late.sort((a, b) => b.lateDays - a.lateDays);
  groups.week.sort((a, b) => a.dueDate.localeCompare(b.dueDate));
  return groups;
}

/** "Vandaag / Deze week": open to-dos by urgency; overdue ones have rolled forward to today. */
export function TodayPanel({ todos }: { todos: ScheduledTodo[] }) {
  const { today } = useStore();
  const groups = groupByUrgency(todos, today);
  return (
    <section className="mc-today-panel" aria-label="Vandaag en deze week">
      {COLUMNS.map((c) => (
        <div key={c.key} className="mc-today-col" data-urgency={c.key}>
          <h3>
            {c.key === 'late' && <Icon name="warning" size={16} />}
            {c.label}
            <span className="mc-count">{groups[c.key].length}</span>
          </h3>
          {groups[c.key].length ? (
            <div className="mc-today-list">
              {groups[c.key].map((t) => <TodoEntry key={t.id} todo={t} />)}
            </div>
          ) : (
            <p className="mc-muted mc-today-empty">{c.empty}</p>
          )}
        </div>
      ))}
    </section>
  );
}
