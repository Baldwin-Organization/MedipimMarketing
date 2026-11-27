import { Fragment, useEffect, useState } from 'react';
import { PlanTable, periodText } from '../components/PlanTable';
import { Button, Card, EmptyState, Icon, Pill, Stat } from '../components/ui';
import { budgetLineOf, budgetYear, byAudience, byCountry, byLine, byMarket, byQuarter, euro, yearOf, type Totals } from '../data/budget';
import { BENCHMARK, PHARMACIES } from '../data/potential';
import { AUDIENCES, countryName, isExistingMarket } from '../data/dimensions';
import { BUDGET_LINES } from '../data/meta';
import { useStore } from '../data/store';
import type { BudgetLine, Item } from '../data/types';
import { audienceLabel, budgetLineLabel, itemText, itemTitle, t } from '../i18n';
import { useUi } from '../ui-context';
import { PageHeader } from './PageHeader';

const TOP_ITEMS = 10;

export function BudgetView() {
  const store = useStore();
  const { openItem } = useUi();
  const [year, setYear] = useState(() => budgetYear(store.budgets, store.today));

  const { rows, unassigned } = byLine(store.items, store.budgets, year);
  const total = rows.reduce(
    (sum, r) => ({ budget: sum.budget + r.budget, planned: sum.planned + r.planned, actual: sum.actual + r.actual }),
    { budget: 0, planned: unassigned.planned, actual: unassigned.actual },
  );
  const withBudget = store.items
    .filter((i) => yearOf(i) === year && (i.budgetPlanned || i.budgetActual))
    .sort((a, b) => Math.max(b.budgetPlanned ?? 0, b.budgetActual ?? 0) - Math.max(a.budgetPlanned ?? 0, a.budgetActual ?? 0));
  const paidWithoutBudget = store.items.filter((i) => yearOf(i) === year && (i.type === 'campaign' || i.type === 'pr' || i.type === 'event') && i.budgetPlanned == null);

  const itemsOf = (line: BudgetLine) => store.items
    .filter((i) => yearOf(i) === year && budgetLineOf(i) === line)
    .sort((a, b) => a.date.localeCompare(b.date));
  // Until someone folds a line open or shut, the lines with amounts are open.
  const [toggled, setToggled] = useState<Set<BudgetLine> | null>(null);
  const isOpen = (line: BudgetLine) => toggled
    ? toggled.has(line)
    : itemsOf(line).some((i) => i.budgetPlanned || i.budgetActual);
  const toggle = (line: BudgetLine) => setToggled(new Set(BUDGET_LINES.filter((l) => (l === line ? !isOpen(l) : isOpen(l)))));

  const audiences = byAudience(store.items, year);
  const markets = byMarket(store.items, year);
  const free = total.budget - total.planned;

  return (
    <div className="mc-page">
      <PageHeader
        title={t.budget.title}
        subtitle={t.budget.subtitle}
        actions={
          <div className="mc-period-nav">
            <Button variant="text" intent="secondary" icon="chevron_left" label={t.budget.prevYear} onClick={() => setYear((y) => y - 1)} />
            <span className="mc-period-label">{year}</span>
            <Button variant="text" intent="secondary" icon="chevron_right" label={t.budget.nextYear} onClick={() => setYear((y) => y + 1)} />
          </div>
        }
      />
      <div className="mc-stats">
        <Stat label={t.budget.annual} value={euro(total.budget)} tone="brand" icon="payments" hint={t.budget.annualHint(year)} />
        <Stat label={t.budget.planned} value={euro(total.planned)} tone="neutral" icon="schedule" hint={total.budget ? t.budget.plannedHint(pct(total.planned, total.budget)) : t.budget.setBudget} />
        <Stat label={t.budget.spent} value={euro(total.actual)} tone="neutral" icon="history" hint={total.planned ? t.budget.spentHint(pct(total.actual, total.planned)) : t.budget.nothingPlanned} />
        <Stat label={t.budget.free} value={total.budget ? euro(free) : '–'} tone={total.budget && free < 0 ? 'error' : 'neutral'} icon="flag" hint={!total.budget ? t.budget.noAnnual : free < 0 ? t.budget.overBudget : t.budget.freeHint} />
      </div>

      <Card title={t.budget.perLine} icon="payments">
        <div className="mc-table-wrap">
          <table className="mc-table mc-budget-table" aria-label={t.budget.perLine}>
            <thead>
              <tr>
                <th>{t.budget.line}</th>
                <th className="mc-num">{t.budget.annual}</th>
                <th className="mc-num">{t.budget.share}</th>
                <th className="mc-num">{t.budget.planned}</th>
                <th className="mc-num">{t.budget.spent}</th>
                <th className="mc-num">{t.budget.free}</th>
                <th>{t.budget.usage}</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => {
                const lineItems = itemsOf(r.line);
                const expanded = isOpen(r.line);
                return (
                  <Fragment key={r.line}>
                    <tr data-expanded={expanded || undefined}>
                      <td>
                        {lineItems.length ? (
                          <button type="button" className="mc-budget-toggle" aria-expanded={expanded} onClick={() => toggle(r.line)}>
                            <Icon name="chevron_right" size={18} />
                            <span>
                              <span className="mc-budget-line">{budgetLineLabel(r.line)}</span>
                              <span className="mc-budget-line-hint">{t.budgetLines[r.line].hint} · {t.budget.actions(lineItems.length)}</span>
                            </span>
                          </button>
                        ) : (
                          <>
                            <span className="mc-budget-line">{budgetLineLabel(r.line)}</span>
                            <span className="mc-budget-line-hint">{t.budgetLines[r.line].hint}</span>
                          </>
                        )}
                      </td>
                      <td className="mc-num"><BudgetInput year={year} line={r.line} amount={r.budget} /></td>
                      <td className="mc-num mc-muted">{total.budget && r.budget ? pct(r.budget, total.budget) : '–'}</td>
                      <td className="mc-num">{euro(r.planned)}</td>
                      <td className="mc-num">{euro(r.actual)}</td>
                      <td className="mc-num" data-over={(r.budget > 0 && r.planned > r.budget) || undefined}>{r.budget ? euro(r.budget - r.planned) : <span className="mc-muted">{r.planned ? t.budget.noBudget : '–'}</span>}</td>
                      <td><BudgetBar {...r} /></td>
                    </tr>
                    {expanded && lineItems.map((i) => (
                      <tr key={i.id} data-detail tabIndex={0} onClick={() => openItem(i.id)} onKeyDown={(e) => e.key === 'Enter' && openItem(i.id)}>
                        <td>
                          <span className="mc-budget-item">{itemTitle(i)}</span>
                          <span className="mc-budget-line-hint">{[periodText(i), itemText(i, 'location')].filter(Boolean).join(' · ')}</span>
                          <ItemScope item={i} />
                        </td>
                        <td className="mc-num mc-muted">–</td>
                        <td className="mc-num mc-muted">{r.budget && i.budgetPlanned ? pct(i.budgetPlanned, r.budget) : '–'}</td>
                        <td className="mc-num">{i.budgetPlanned != null ? euro(i.budgetPlanned) : <span className="mc-muted">–</span>}</td>
                        <td className="mc-num">{i.budgetActual != null ? euro(i.budgetActual) : <span className="mc-muted">–</span>}</td>
                        <td className="mc-num mc-muted">–</td>
                        <td><BudgetBar budget={i.budgetPlanned ?? 0} planned={i.budgetPlanned ?? 0} actual={i.budgetActual ?? 0} /></td>
                      </tr>
                    ))}
                  </Fragment>
                );
              })}
              {(unassigned.planned > 0 || unassigned.actual > 0) && (
                <tr data-unassigned>
                  <td>
                    <span className="mc-budget-line">{t.budget.unassigned}</span>
                    <span className="mc-budget-line-hint">{t.budget.unassignedHint}</span>
                  </td>
                  <td className="mc-num mc-muted">–</td>
                  <td className="mc-num mc-muted">–</td>
                  <td className="mc-num">{euro(unassigned.planned)}</td>
                  <td className="mc-num">{euro(unassigned.actual)}</td>
                  <td className="mc-num mc-muted">–</td>
                  <td><BudgetBar budget={0} {...unassigned} /></td>
                </tr>
              )}
            </tbody>
            <tfoot>
              <tr>
                <th>{t.budget.total}</th>
                <th className="mc-num">{euro(total.budget)}</th>
                <th className="mc-num">{total.budget ? '100%' : '–'}</th>
                <th className="mc-num">{euro(total.planned)}</th>
                <th className="mc-num">{euro(total.actual)}</th>
                <th className="mc-num" data-over={(total.budget > 0 && free < 0) || undefined}>{total.budget ? euro(free) : '–'}</th>
                <th><BudgetBar {...total} /></th>
              </tr>
            </tfoot>
          </table>
        </div>
        <p className="mc-muted mc-budget-legend">
          <span className="mc-legend-swatch" data-kind="planned" /> {t.budget.legendPlanned}
          <span className="mc-legend-swatch" data-kind="actual" /> {t.budget.legendSpent}
          {' '}{t.budget.legendBar}
        </p>
        <p className="mc-muted">{t.budget.linesNote}</p>
      </Card>

      <CountryCard year={year} />

      <div className="mc-budget-grid">
        <Card title={t.budget.perQuarter} icon="calendar_month">
          <Breakdown rows={byQuarter(store.items, year).map((q) => ({ label: `${t.dates.quarter}${q.quarter}`, ...q }))} />
        </Card>
        <Card title={t.budget.perAudience} icon="person">
          <Breakdown rows={[
            ...AUDIENCES.map((a) => ({ label: audienceLabel(a), ...(audiences.get(a) ?? ZERO) })),
            ...(audiences.has('geen') ? [{ label: t.budget.noAudience, ...audiences.get('geen')! }] : []),
          ]} />
        </Card>
        <Card title={t.budget.perMarket} icon="flag">
          <Breakdown rows={[
            { label: t.budget.existing, ...(markets.get('bestaand') ?? ZERO) },
            { label: t.budget.new, ...(markets.get('nieuw') ?? ZERO) },
            ...(markets.has('geen') ? [{ label: t.budget.noCountry, ...markets.get('geen')! }] : []),
          ]} />
        </Card>
      </div>
      <p className="mc-muted">{t.budget.splitNote}</p>

      <section className="mc-plan-group">
        <div className="mc-section-bar"><h2>{t.budget.biggest(year)}</h2></div>
        {withBudget.length === 0 ? (
          <EmptyState icon="payments" title={t.budget.noAmounts}>
            {t.budget.noAmountsHint}
          </EmptyState>
        ) : (
          <PlanTable items={withBudget.slice(0, TOP_ITEMS)} label={t.budget.biggest(year)} showType />
        )}
        {paidWithoutBudget.length > 0 && (
          <p className="mc-muted">
            {t.budget.withoutBudget(paidWithoutBudget.length)}
          </p>
        )}
      </section>
    </div>
  );
}

const ZERO: Totals = { planned: 0, actual: 0 };

const pct = (part: number, whole: number) => `${Math.round((part / whole) * 100)}%`;

function BudgetInput({ year, line, amount }: { year: number; line: BudgetLine; amount: number }) {
  const store = useStore();
  return (
    <AmountInput
      amount={amount || undefined}
      label={t.budget.inputLabel(budgetLineLabel(line), year)}
      onCommit={(next) => store.setBudget(year, line, next ?? 0)}
    />
  );
}

/** An amount in euro that saves on blur or Enter; emptying it clears the amount. */
function AmountInput({ amount, label, onCommit }: { amount?: number; label: string; onCommit: (next: number | undefined) => void }) {
  const shown = amount ? String(amount) : '';
  const [value, setValue] = useState(shown);
  useEffect(() => setValue(shown), [shown]);
  const commit = () => {
    const next = value.trim() ? Math.max(0, Number(value) || 0) : undefined;
    if ((next || undefined) !== amount) onCommit(next);
  };
  return (
    <input
      type="number"
      min={0}
      step={500}
      inputMode="decimal"
      className="mc-input mc-budget-input"
      aria-label={label}
      placeholder="0"
      value={value}
      onChange={(e) => setValue(e.target.value)}
      onBlur={commit}
      onKeyDown={(e) => e.key === 'Enter' && (e.target as HTMLInputElement).blur()}
    />
  );
}

/** The audiences and countries an item's costs count for; a missing country stands out, since its costs count for none. */
function ItemScope({ item }: { item: Item }) {
  return (
    <span className="mc-tags mc-budget-scope">
      {item.audiences.length
        ? item.audiences.map((a) => <span key={a} className="mc-pill" data-accent="2">{audienceLabel(a)}</span>)
        : <Pill>{t.budget.noAudienceTag}</Pill>}
      {item.countries.length
        ? item.countries.map((c) => <Pill key={c} tone={isExistingMarket(c) ? 'neutral' : 'warning'}>{countryName(c)}</Pill>)
        : <Pill tone="warning">{t.budget.noCountryTag}</Pill>}
    </span>
  );
}

/** Marketing costs per country next to last year's revenue and this year's target, both entered here. */
function CountryCard({ year }: { year: number }) {
  const store = useStore();
  const { rows, none } = byCountry(store.items, store.revenues, year);
  const sumOf = (key: 'revenueBefore' | 'target' | 'potentialBefore' | 'potential', of = rows) => of.reduce((n, r) => n + (r[key] ?? 0), 0);
  const reached = rows.filter((r) => r.potential && (r.revenueBefore || r.target));
  const total = {
    planned: rows.reduce((n, r) => n + r.planned, none.planned),
    actual: rows.reduce((n, r) => n + r.actual, none.actual),
    revenueBefore: sumOf('revenueBefore'),
    target: sumOf('target'),
    potential: sumOf('potential'),
  };
  const totalReach = {
    revenueBefore: sumOf('revenueBefore', reached),
    target: sumOf('target', reached),
    potentialBefore: sumOf('potentialBefore', reached),
    potential: sumOf('potential', reached),
  };
  return (
    <Card title={t.budget.perCountry} icon="language">
      <div className="mc-table-wrap">
        <table className="mc-table mc-budget-table mc-country-table" aria-label={t.budget.perCountry}>
          <thead>
            <tr>
              <th>{t.budget.country}</th>
              <th className="mc-num">{t.budget.planned}</th>
              <th className="mc-num">{t.budget.spent}</th>
              <th className="mc-num">{t.budget.revenueBefore(year - 1)}</th>
              <th className="mc-num">{t.budget.target(year)}</th>
              <th className="mc-num">{t.budget.growth}</th>
              <th className="mc-num">{t.budget.potential(year)}</th>
              <th className="mc-num">{t.budget.potentialShare(year - 1, year)}</th>
              <th className="mc-num">{t.budget.marketingShare}</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.country}>
                <td>
                  <span className="mc-budget-line">{countryName(r.country)}</span>
                  {!isExistingMarket(r.country) && <span className="mc-budget-line-hint">{t.budget.newMarket}</span>}
                </td>
                <td className="mc-num">{r.planned ? euro(r.planned) : <span className="mc-muted">–</span>}</td>
                <td className="mc-num">{r.actual ? euro(r.actual) : <span className="mc-muted">–</span>}</td>
                <td className="mc-num">
                  <AmountInput
                    amount={r.revenueBefore}
                    label={t.budget.revenueLabel(countryName(r.country), year - 1)}
                    onCommit={(next) => store.setRevenue(year - 1, r.country, 'revenue', next)}
                  />
                </td>
                <td className="mc-num">
                  <AmountInput
                    amount={r.target}
                    label={t.budget.targetLabel(countryName(r.country), year)}
                    onCommit={(next) => store.setRevenue(year, r.country, 'target', next)}
                  />
                </td>
                <td className="mc-num">{growth(r.revenueBefore, r.target)}</td>
                <td className="mc-num">{r.potential ? euro(r.potential) : <span className="mc-muted">–</span>}</td>
                <td className="mc-num"><Reach {...r} /></td>
                <td className="mc-num">{share(r.planned, r.target)}</td>
              </tr>
            ))}
            {(none.planned > 0 || none.actual > 0) && (
              <tr data-unassigned>
                <td>
                  <span className="mc-budget-line">{t.budget.noCountry}</span>
                  <span className="mc-budget-line-hint">{t.budget.noCountryHint}</span>
                </td>
                <td className="mc-num">{euro(none.planned)}</td>
                <td className="mc-num">{euro(none.actual)}</td>
                <td className="mc-num mc-muted">–</td>
                <td className="mc-num mc-muted">–</td>
                <td className="mc-num mc-muted">–</td>
                <td className="mc-num mc-muted">–</td>
                <td className="mc-num mc-muted">–</td>
                <td className="mc-num mc-muted">–</td>
              </tr>
            )}
          </tbody>
          <tfoot>
            <tr>
              <th>{t.budget.total}</th>
              <th className="mc-num">{euro(total.planned)}</th>
              <th className="mc-num">{euro(total.actual)}</th>
              <th className="mc-num">{total.revenueBefore ? euro(total.revenueBefore) : '–'}</th>
              <th className="mc-num">{total.target ? euro(total.target) : '–'}</th>
              <th className="mc-num">{growth(total.revenueBefore, total.target)}</th>
              <th className="mc-num">{total.potential ? euro(total.potential) : '–'}</th>
              <th className="mc-num"><Reach {...totalReach} /></th>
              <th className="mc-num">{share(total.planned, total.target)}</th>
            </tr>
          </tfoot>
        </table>
      </div>
      <p className="mc-muted">{t.budget.countryNote}</p>
      <p className="mc-muted">
        {t.budget.potentialNote(year - 1, PHARMACIES[BENCHMARK.country].toLocaleString(t.numberLocale), percent(BENCHMARK.penetration))}
      </p>
    </Card>
  );
}

/** How much of each year's potential last year's revenue and this year's target reach. */
function Reach({ revenueBefore, target, potentialBefore, potential }: { revenueBefore?: number; target?: number; potentialBefore?: number; potential?: number }) {
  if (!potentialBefore || !potential || (!revenueBefore && !target)) return <span className="mc-muted">–</span>;
  const part = (n: number | undefined, of: number) => (n ? percent(n / of) : '–');
  return <span className="mc-reach">{part(revenueBefore, potentialBefore)} → {part(target, potential)}</span>;
}

const percent = (n: number, signed = false) =>
  new Intl.NumberFormat(t.numberLocale, { style: 'percent', maximumFractionDigits: 1, ...(signed && { signDisplay: 'exceptZero' as const }) }).format(n);

const growth = (before?: number, target?: number) => (before && target ? percent(target / before - 1, true) : '–');

const share = (planned: number, target?: number) => (planned && target ? percent(planned / target) : '–');

/** Planned and actual against the budget; without a budget, scaled to the larger of the two. */
function BudgetBar({ budget, planned, actual }: Totals & { budget: number }) {
  const scale = Math.max(budget, planned, actual);
  if (!scale) return <span className="mc-muted">–</span>;
  return (
    <span className="mc-budget-bar" data-over={(budget > 0 && planned > budget) || undefined} title={t.budget.barTitle(euro(planned), euro(actual), euro(budget))}>
      <span data-kind="planned" style={{ width: `${(planned / scale) * 100}%` }} />
      <span data-kind="actual" style={{ width: `${(actual / scale) * 100}%` }} />
      {budget > 0 && budget < scale && <span className="mc-budget-limit" style={{ left: `${(budget / scale) * 100}%` }} />}
    </span>
  );
}

function Breakdown({ rows }: { rows: (Totals & { label: string })[] }) {
  const max = Math.max(...rows.map((r) => Math.max(r.planned, r.actual)));
  if (!max) return <p className="mc-muted">{t.budget.noPeriodAmounts}</p>;
  return (
    <ul className="mc-breakdown">
      {rows.map((r) => (
        <li key={r.label}>
          <span className="mc-breakdown-label">{r.label}</span>
          <span className="mc-num">{euro(r.planned)}</span>
          <span className="mc-budget-bar" title={t.budget.barTitleShort(euro(r.planned), euro(r.actual))}>
            <span data-kind="planned" style={{ width: `${(r.planned / max) * 100}%` }} />
            <span data-kind="actual" style={{ width: `${(r.actual / max) * 100}%` }} />
          </span>
        </li>
      ))}
    </ul>
  );
}
