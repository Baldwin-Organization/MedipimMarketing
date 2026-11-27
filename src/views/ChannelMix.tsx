import { useLayoutEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, Icon } from '../components/ui';
import { budgetYear, euro } from '../data/budget';
import { CHANNEL_MIX, TARGETS, type ChannelId, type Target } from '../data/channels';
import { useStore } from '../data/store';
import { t } from '../i18n';

type Active = { channel: ChannelId } | { target: Target } | undefined;

/** Vertical middle of each node, relative to the diagram, keyed by `data-id`. */
interface Layout { channels: Record<string, number>; targets: Record<string, number>; height: number }

/** High-level diagram: the channels in the marketing mix on the left, the groups they reach on the right. */
export function ChannelMix() {
  const { budgets, today } = useStore();
  const year = budgetYear(budgets, today);
  const [active, setActive] = useState<Active>();
  const [layout, setLayout] = useState<Layout>();
  const box = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const el = box.current;
    if (!el) return;
    const measure = () => {
      const top = el.getBoundingClientRect().top;
      const middles = (side: string) =>
        Object.fromEntries([...el.querySelectorAll<HTMLElement>(`[data-side="${side}"]`)].map((n) => {
          const r = n.getBoundingClientRect();
          return [n.dataset.id!, r.top + r.height / 2 - top];
        }));
      setLayout({ channels: middles('channel'), targets: middles('target'), height: el.clientHeight });
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const budgetOf = (lines: string[]) => budgets.filter((b) => b.year === year && lines.includes(b.line)).reduce((n, b) => n + b.amount, 0);
  const linked = (channel: ChannelId, target: Target) =>
    !active || ('channel' in active ? active.channel === channel : active.target === target);
  const reaches = (target: Target) => CHANNEL_MIX.filter((c) => c.targets.includes(target));
  const list = new Intl.ListFormat(t.regionLocale, { type: 'conjunction' });
  const hover = (a: Active) => ({ onMouseEnter: () => setActive(a), onMouseLeave: () => setActive(undefined), onFocus: () => setActive(a), onBlur: () => setActive(undefined) });

  return (
    <Card title={t.dashboard.mix.title} icon="groups" action={<Link className="mc-card-link" to="/budget">{t.dashboard.mix.toBudget}</Link>}>
      <p className="mc-muted mc-chan-hint">{t.dashboard.mix.hint(year)}</p>
      <div className="mc-chan" ref={box}>
        <ul className="mc-chan-col">
          {CHANNEL_MIX.map((c) => {
            const budget = budgetOf(c.lines);
            const label = t.dashboard.mix.channels[c.id];
            const dim = active && !c.targets.some((target) => linked(c.id, target));
            return (
              <li key={c.id}>
                <Link
                  to={c.to}
                  className="mc-chan-node"
                  data-side="channel"
                  data-id={c.id}
                  data-dim={dim || undefined}
                  aria-label={t.dashboard.mix.reaches(label, list.format(c.targets.map((x) => t.dashboard.mix.targets[x])))}
                  {...hover({ channel: c.id })}
                >
                  <Icon name={c.icon} size={18} />
                  <span className="mc-chan-label">
                    {label}
                    <span className="mc-muted">{budget > 0 ? euro(budget) : t.dashboard.mix.noBudget}</span>
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
        <div className="mc-chan-gutter">
          <svg className="mc-chan-links" viewBox={`0 0 100 ${layout?.height ?? 1}`} preserveAspectRatio="none" aria-hidden="true">
            {layout &&
              CHANNEL_MIX.flatMap((c) =>
                c.targets.map((target) => {
                  const y1 = layout.channels[c.id];
                  const y2 = layout.targets[target];
                  const accent = TARGETS.find((x) => x.id === target)!.accent;
                  return (
                    <path
                      key={`${c.id}-${target}`}
                      d={`M0 ${y1} C50 ${y1} 50 ${y2} 100 ${y2}`}
                      data-accent={accent}
                      data-state={active ? (linked(c.id, target) ? 'on' : 'off') : undefined}
                    />
                  );
                }),
              )}
          </svg>
        </div>
        <ul className="mc-chan-col mc-chan-targets">
          {TARGETS.map((x) => {
            const label = t.dashboard.mix.targets[x.id];
            const channels = reaches(x.id);
            const dim = active && !channels.some((c) => linked(c.id, x.id));
            return (
              <li key={x.id}>
                <div
                  className="mc-chan-node mc-chan-target"
                  data-side="target"
                  data-id={x.id}
                  data-accent={x.accent}
                  data-dim={dim || undefined}
                  tabIndex={0}
                  aria-label={`${label}: ${list.format(channels.map((c) => t.dashboard.mix.channels[c.id]))}`}
                  {...hover({ target: x.id })}
                >
                  <Icon name={x.icon} size={18} />
                  <span className="mc-chan-label">
                    {label}
                    <span className="mc-muted">{t.dashboard.mix.channelCount(channels.length)}</span>
                  </span>
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </Card>
  );
}
