import { PARTICIPATIONS, UNDECIDED, participationKey, type ParticipationKey } from '../data/meta';
import type { Participation } from '../data/types';
import { participationLabel, participationShort, t } from '../i18n';

const KEYS: ParticipationKey[] = [...PARTICIPATIONS, UNDECIDED];

export function ParticipationDot({ value }: { value?: Participation }) {
  return <span className="mc-participation-dot" data-participation={participationKey(value)} aria-hidden="true" />;
}

export function ParticipationPill({ value }: { value?: Participation }) {
  return (
    <span className="mc-pill mc-participation-pill" data-participation={participationKey(value)} title={participationLabel(value)}>
      <ParticipationDot value={value} />
      {participationShort(value)}
    </span>
  );
}

export function ParticipationPicker({ value, onChange, compact, label = t.participationTitle }: {
  value?: Participation;
  onChange: (value?: Participation) => void;
  /** Short labels and small chips, for choosing straight from a list. */
  compact?: boolean;
  label?: string;
}) {
  const current = participationKey(value);
  return (
    <div className="mc-chip-group" data-compact={compact || undefined} role="radiogroup" aria-label={label}>
      {KEYS.map((k) => (
        <button
          key={k}
          type="button"
          role="radio"
          aria-checked={current === k}
          aria-pressed={current === k}
          className="mc-toggle-chip"
          data-participation={k}
          title={compact ? t.participation[k].label : undefined}
          onClick={() => onChange(k === UNDECIDED ? undefined : k)}
        >
          <span className="mc-participation-dot" aria-hidden="true" />
          {compact ? t.participation[k].short : t.participation[k].label}
        </button>
      ))}
    </div>
  );
}

/** Colour key with counts; every entry toggles on its own, so several can filter at once. */
export function ParticipationLegend({ counts, active, onToggle }: { counts: Map<ParticipationKey, number>; active: ParticipationKey[]; onToggle: (key: ParticipationKey) => void }) {
  return (
    <div className="mc-participation-legend" role="group" aria-label={t.participationTitle}>
      {KEYS.map((k) => (
        <button
          key={k}
          type="button"
          className="mc-participation-legend-item"
          data-participation={k}
          aria-pressed={active.includes(k)}
          onClick={() => onToggle(k)}
        >
          <span className="mc-participation-dot" aria-hidden="true" />
          {t.participation[k].short}
          <span className="mc-muted">{counts.get(k) ?? 0}</span>
        </button>
      ))}
    </div>
  );
}
