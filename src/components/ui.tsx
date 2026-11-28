import { useEffect, useId, useRef, type ButtonHTMLAttributes, type ReactNode } from 'react';
import { ICON_PATHS, type IconName } from '../icons.generated';
import { STATUS_META, TYPE_META } from '../data/meta';
import { statusLabel, t, typeLabel } from '../i18n';
import type { ItemStatus, ItemType, JiraLink, TodoPhase } from '../data/types';

export function Icon({ name, size = 20, className }: { name: IconName; size?: number; className?: string }) {
  return (
    <svg className={`mc-icon ${className ?? ''}`} width={size} height={size} viewBox="0 -960 960 960" aria-hidden="true" focusable="false">
      <path d={ICON_PATHS[name]} fill="currentColor" />
    </svg>
  );
}

type ButtonVariant = 'contained' | 'outlined' | 'text';
type ButtonIntent = 'primary' | 'secondary' | 'destructive';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  intent?: ButtonIntent;
  size?: 'xs' | 'small' | 'medium';
  startIcon?: IconName;
  /** Icon-only button; the label becomes its accessible name and tooltip. */
  icon?: IconName;
  label?: string;
}

export function Button({ variant = 'contained', intent = 'primary', size = 'medium', startIcon, icon, label, children, className, ...rest }: ButtonProps) {
  const iconOnly = !!icon;
  return (
    <button
      type="button"
      className={`mc-button ${className ?? ''}`}
      data-variant={variant}
      data-intent={intent}
      data-size={size}
      data-icon-only={iconOnly || undefined}
      aria-label={iconOnly ? label : undefined}
      data-tooltip={iconOnly ? label : undefined}
      {...rest}
    >
      {startIcon && <Icon name={startIcon} size={size === 'medium' ? 18 : 16} />}
      {icon && <Icon name={icon} size={size === 'medium' ? 20 : 18} />}
      {children}
    </button>
  );
}

export function Pill({ tone = 'neutral', children }: { tone?: 'neutral' | 'info' | 'warning' | 'success' | 'error' | 'brand'; children: ReactNode }) {
  return <span className="mc-pill" data-tone={tone}>{children}</span>;
}

export const StatusPill = ({ status }: { status: ItemStatus }) => (
  <Pill tone={STATUS_META[status].tone}>{statusLabel(status)}</Pill>
);

export function TypeBadge({ type, withLabel = false }: { type: ItemType; withLabel?: boolean }) {
  const m = TYPE_META[type];
  return (
    <span className="mc-type" data-accent={m.accent} title={withLabel ? undefined : typeLabel(type)}>
      <Icon name={m.icon} size={16} />
      {withLabel && <span>{typeLabel(type)}</span>}
    </span>
  );
}

export function LateBadge({ days, compact }: { days: number; compact?: boolean }) {
  if (days <= 0) return null;
  const full = t.late.full(days);
  return (
    <span className="mc-late" title={t.late.title(days)} aria-label={full}>
      <Icon name="history" size={12} />
      {compact ? `${days} ${t.dates.dayShort}` : full}
    </span>
  );
}

/** Whether a to-do makes content or distributes it. */
export function PhaseBadge({ phase }: { phase?: TodoPhase }) {
  if (!phase) return null;
  return <span className="mc-phase" title={t.phase.title[phase]}><Pill tone={phase === 'maken' ? 'brand' : 'info'}>{t.phase[phase]}</Pill></span>;
}

const JIRA_TONE = { new: 'neutral', indeterminate: 'info', done: 'success' } as const;

/** The Jira issue that carries out a to-do, with the status Jira reported. */
export function JiraBadge({ jira }: { jira?: JiraLink }) {
  if (!jira) return null;
  const label = jira.status ? `${jira.key} · ${jira.status}` : jira.key;
  const pill = <Pill tone={jira.statusCategory ? JIRA_TONE[jira.statusCategory] : 'neutral'}>{label}</Pill>;
  return jira.url ? <a className="mc-jira" href={jira.url} target="_blank" rel="noreferrer" title={t.jira.open}>{pill}</a> : pill;
}

export function ToggleChipGroup<T extends string>({ options, value, onChange, label }: {
  options: { value: T; label: string; icon?: IconName; accent?: string }[];
  value: T[];
  onChange: (v: T[]) => void;
  label: string;
}) {
  return (
    <div className="mc-chip-group" role="group" aria-label={label}>
      {options.map((o) => {
        const on = value.includes(o.value);
        return (
          <button
            key={o.value}
            type="button"
            className="mc-toggle-chip"
            aria-pressed={on}
            data-accent={o.accent}
            onClick={() => onChange(on ? value.filter((v) => v !== o.value) : [...value, o.value])}
          >
            {o.icon && <Icon name={o.icon} size={16} />}
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

export function Segmented<T extends string>({ options, value, onChange, label }: {
  options: { value: T; label: string; icon?: IconName }[];
  value: T;
  onChange: (v: T) => void;
  label: string;
}) {
  return (
    <div className="mc-segmented" role="radiogroup" aria-label={label}>
      {options.map((o) => (
        <button key={o.value} type="button" role="radio" aria-checked={o.value === value} onClick={() => onChange(o.value)}>
          {o.icon && <Icon name={o.icon} size={16} />}
          {o.label}
        </button>
      ))}
    </div>
  );
}

export function Field({ label, optional, children, className }: { label: string; optional?: boolean; children: (id: string) => ReactNode; className?: string }) {
  const id = useId();
  return (
    <div className={`mc-field ${className ?? ''}`}>
      <label htmlFor={id}>
        {label}
        {optional && <span className="mc-optional"> {t.common.optional}</span>}
      </label>
      {children(id)}
    </div>
  );
}

export function Checkbox({ checked, onChange, label }: { checked: boolean; onChange: () => void; label: string }) {
  return (
    <button type="button" role="checkbox" aria-checked={checked} aria-label={label} className="mc-check" onClick={(e) => { e.stopPropagation(); onChange(); }}>
      {checked && <Icon name="check" size={14} />}
    </button>
  );
}

export function Card({ children, className, title, action, icon }: { children: ReactNode; className?: string; title?: ReactNode; action?: ReactNode; icon?: IconName }) {
  return (
    <section className={`mc-card ${className ?? ''}`}>
      {title && (
        <header className="mc-card-header">
          <h2>{icon && <Icon name={icon} size={18} />}{title}</h2>
          {action}
        </header>
      )}
      {children}
    </section>
  );
}

export function EmptyState({ icon, title, children }: { icon: IconName; title: string; children?: ReactNode }) {
  return (
    <div className="mc-empty">
      <Icon name={icon} size={24} />
      <p className="mc-empty-title">{title}</p>
      {children && <p>{children}</p>}
    </div>
  );
}

export function Drawer({ open, onClose, title, children, footer }: { open: boolean; onClose: () => void; title: string; children: ReactNode; footer: ReactNode }) {
  const panel = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    panel.current?.querySelector<HTMLElement>('input, select, textarea')?.focus();
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="mc-drawer-root">
      <div className="mc-scrim" onClick={onClose} />
      <div className="mc-drawer" role="dialog" aria-modal="true" aria-label={title} ref={panel}>
        <header className="mc-drawer-header">
          <h2>{title}</h2>
          <Button variant="text" intent="secondary" icon="close" label={t.common.close} onClick={onClose} />
        </header>
        <div className="mc-drawer-body">{children}</div>
        <footer className="mc-drawer-footer">{footer}</footer>
      </div>
    </div>
  );
}

export function Stat({ label, value, tone, icon, hint }: { label: string; value: ReactNode; tone: 'error' | 'brand' | 'neutral'; icon: IconName; hint: string }) {
  return (
    <div className="mc-stat" data-tone={tone}>
      <span className="mc-stat-icon"><Icon name={icon} size={20} /></span>
      <span className="mc-stat-label">{label}</span>
      <span className="mc-stat-value">{value}</span>
      <span className="mc-muted">{hint}</span>
    </div>
  );
}
