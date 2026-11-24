import { useEffect, useState } from 'react';
import { PlanTable } from '../components/PlanTable';
import { Button, Card, EmptyState, Stat, TypeBadge } from '../components/ui';
import { byAudience, byMarket, byQuarter, byType, euro, yearOf, type Totals } from '../data/budget';
import { AUDIENCES } from '../data/dimensions';
import { TYPE_META } from '../data/meta';
import { useStore } from '../data/store';
import type { ItemType } from '../data/types';
import { PageHeader } from './PageHeader';

const TOP_ITEMS = 10;

export function BudgetView() {
  const store = useStore();
  const [year, setYear] = useState(() => Number(store.today.slice(0, 4)));

  const rows = byType(store.items, store.budgets, year);
  const total = rows.reduce((t, r) => ({ budget: t.budget + r.budget, planned: t.planned + r.planned, actual: t.actual + r.actual }), { budget: 0, planned: 0, actual: 0 });
  const withBudget = store.items
    .filter((i) => yearOf(i) === year && (i.budgetPlanned || i.budgetActual))
    .sort((a, b) => Math.max(b.budgetPlanned ?? 0, b.budgetActual ?? 0) - Math.max(a.budgetPlanned ?? 0, a.budgetActual ?? 0));
  const paidWithoutBudget = store.items.filter((i) => yearOf(i) === year && (i.type === 'campaign' || i.type === 'pr' || i.type === 'event') && i.budgetPlanned == null);

  const audiences = byAudience(store.items, year);
  const markets = byMarket(store.items, year);
  const free = total.budget - total.planned;

  return (
    <div className="mc-page">
      <PageHeader
        title="Budget"
        subtitle="Jaarbudget per soort actie, tegenover wat gepland en besteed is. Bedragen excl. btw."
        actions={
          <div className="mc-period-nav">
            <Button variant="text" intent="secondary" icon="chevron_left" label="Vorig jaar" onClick={() => setYear((y) => y - 1)} />
            <span className="mc-period-label">{year}</span>
            <Button variant="text" intent="secondary" icon="chevron_right" label="Volgend jaar" onClick={() => setYear((y) => y + 1)} />
          </div>
        }
      />
      <div className="mc-stats">
        <Stat label="Jaarbudget" value={euro(total.budget)} tone="brand" icon="payments" hint={`totaal voor ${year}`} />
        <Stat label="Gepland" value={euro(total.planned)} tone="neutral" icon="schedule" hint={total.budget ? `${pct(total.planned, total.budget)} van het budget` : 'stel een jaarbudget in'} />
        <Stat label="Besteed" value={euro(total.actual)} tone="neutral" icon="history" hint={total.planned ? `${pct(total.actual, total.planned)} van gepland` : 'nog niets gepland'} />
        <Stat label="Nog vrij" value={total.budget ? euro(free) : '–'} tone={total.budget && free < 0 ? 'error' : 'neutral'} icon="flag" hint={!total.budget ? 'nog geen jaarbudget' : free < 0 ? 'meer gepland dan budget' : 'budget min gepland'} />
      </div>

      <Card title="Per soort actie" icon="payments">
        <div className="mc-table-wrap">
          <table className="mc-table mc-budget-table" aria-label="Budget per soort actie">
            <thead>
              <tr>
                <th>Soort</th>
                <th className="mc-num">Jaarbudget</th>
                <th className="mc-num">Gepland</th>
                <th className="mc-num">Besteed</th>
                <th className="mc-num">Nog vrij</th>
                <th>Verbruik</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.type}>
                  <td><span className="mc-table-title"><TypeBadge type={r.type} />{TYPE_META[r.type].plural}</span></td>
                  <td className="mc-num"><BudgetInput year={year} type={r.type} amount={r.budget} /></td>
                  <td className="mc-num">{euro(r.planned)}</td>
                  <td className="mc-num">{euro(r.actual)}</td>
                  <td className="mc-num" data-over={(r.budget > 0 && r.planned > r.budget) || undefined}>{r.budget ? euro(r.budget - r.planned) : <span className="mc-muted">{r.planned ? 'geen budget' : '–'}</span>}</td>
                  <td><BudgetBar {...r} /></td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr>
                <th>Totaal</th>
                <th className="mc-num">{euro(total.budget)}</th>
                <th className="mc-num">{euro(total.planned)}</th>
                <th className="mc-num">{euro(total.actual)}</th>
                <th className="mc-num" data-over={(total.budget > 0 && free < 0) || undefined}>{total.budget ? euro(free) : '–'}</th>
                <th><BudgetBar {...total} /></th>
              </tr>
            </tfoot>
          </table>
        </div>
        <p className="mc-muted mc-budget-legend">
          <span className="mc-legend-swatch" data-kind="planned" /> gepland
          <span className="mc-legend-swatch" data-kind="actual" /> besteed
          · de balk is het jaarbudget
        </p>
      </Card>

      <div className="mc-budget-grid">
        <Card title="Per kwartaal" icon="calendar_month">
          <Breakdown rows={byQuarter(store.items, year).map((q) => ({ label: `K${q.quarter}`, ...q }))} />
        </Card>
        <Card title="Per doelgroep" icon="person">
          <Breakdown rows={[
            ...AUDIENCES.map(({ value, label }) => ({ label, ...(audiences.get(value) ?? ZERO) })),
            ...(audiences.has('geen') ? [{ label: 'Geen doelgroep', ...audiences.get('geen')! }] : []),
          ]} />
        </Card>
        <Card title="Per markt" icon="flag">
          <Breakdown rows={[
            { label: 'Bestaande markten', ...(markets.get('bestaand') ?? ZERO) },
            { label: 'Nieuwe markten', ...(markets.get('nieuw') ?? ZERO) },
            ...(markets.has('geen') ? [{ label: 'Geen land', ...markets.get('geen')! }] : []),
          ]} />
        </Card>
      </div>
      <p className="mc-muted">Een actie met meerdere doelgroepen of markten wordt gelijk over die groepen verdeeld.</p>

      <section className="mc-plan-group">
        <div className="mc-section-bar"><h2>Grootste posten {year}</h2></div>
        {withBudget.length === 0 ? (
          <EmptyState icon="payments" title="Nog geen bedragen ingevuld">
            Vul bij een actie onder "Budget" het geplande en het werkelijke bedrag in.
          </EmptyState>
        ) : (
          <PlanTable items={withBudget.slice(0, TOP_ITEMS)} label={`Grootste posten ${year}`} showType />
        )}
        {paidWithoutBudget.length > 0 && (
          <p className="mc-muted">
            {paidWithoutBudget.length} {paidWithoutBudget.length === 1 ? 'beurs, campagne of PR-item heeft' : 'beurzen, campagnes en PR-items hebben'} nog geen gepland bedrag.
          </p>
        )}
      </section>
    </div>
  );
}

const ZERO: Totals = { planned: 0, actual: 0 };

const pct = (part: number, whole: number) => `${Math.round((part / whole) * 100)}%`;

function BudgetInput({ year, type, amount }: { year: number; type: ItemType; amount: number }) {
  const store = useStore();
  const [value, setValue] = useState(amount ? String(amount) : '');
  useEffect(() => setValue(amount ? String(amount) : ''), [amount, year]);
  const commit = () => {
    const next = Math.max(0, Number(value) || 0);
    if (next !== amount) store.setBudget(year, type, next);
  };
  return (
    <input
      type="number"
      min={0}
      step={500}
      inputMode="decimal"
      className="mc-input mc-budget-input"
      aria-label={`Jaarbudget ${TYPE_META[type].plural} ${year}`}
      placeholder="0"
      value={value}
      onChange={(e) => setValue(e.target.value)}
      onBlur={commit}
      onKeyDown={(e) => e.key === 'Enter' && (e.target as HTMLInputElement).blur()}
    />
  );
}

/** Planned and actual against the budget; without a budget, scaled to the larger of the two. */
function BudgetBar({ budget, planned, actual }: Totals & { budget: number }) {
  const scale = Math.max(budget, planned, actual);
  if (!scale) return <span className="mc-muted">–</span>;
  return (
    <span className="mc-budget-bar" data-over={(budget > 0 && planned > budget) || undefined} title={`${euro(planned)} gepland, ${euro(actual)} besteed van ${euro(budget)}`}>
      <span data-kind="planned" style={{ width: `${(planned / scale) * 100}%` }} />
      <span data-kind="actual" style={{ width: `${(actual / scale) * 100}%` }} />
      {budget > 0 && budget < scale && <span className="mc-budget-limit" style={{ left: `${(budget / scale) * 100}%` }} />}
    </span>
  );
}

function Breakdown({ rows }: { rows: (Totals & { label: string })[] }) {
  const max = Math.max(...rows.map((r) => Math.max(r.planned, r.actual)));
  if (!max) return <p className="mc-muted">Nog geen bedragen voor deze periode.</p>;
  return (
    <ul className="mc-breakdown">
      {rows.map((r) => (
        <li key={r.label}>
          <span className="mc-breakdown-label">{r.label}</span>
          <span className="mc-num">{euro(r.planned)}</span>
          <span className="mc-budget-bar" title={`${euro(r.planned)} gepland, ${euro(r.actual)} besteed`}>
            <span data-kind="planned" style={{ width: `${(r.planned / max) * 100}%` }} />
            <span data-kind="actual" style={{ width: `${(r.actual / max) * 100}%` }} />
          </span>
        </li>
      ))}
    </ul>
  );
}
