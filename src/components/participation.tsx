import { PARTICIPATIONS, UNDECIDED, participationKey, type ParticipationKey } from '../data/meta';
import type { Participation } from '../data/types';
import { participationLabel, participationShort, t } from '../i18n';

const KEYS: ParticipationKey[] = [...PARTICIPATIONS, UNDECIDED];

export const participationOptions = () => KEYS.map((k) => ({ value: k, label: t.participation[k].short }));

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

export function ParticipationPicker({ value, onChange }: { value?: Participation; onChange: (value?: Participation) => void }) {
  const current = participationKey(value);
  return (
    <div className="mc-chip-group" role="radiogroup" aria-label={t.participationTitle}>
      {KEYS.map((k) => (
        <button
          key={k}
          type="button"
          role="radio"
          aria-checked={current === k}
          aria-pressed={current === k}
          className="mc-toggle-chip"
          data-participation={k}
          onClick={() => onChange(k === UNDECIDED ? undefined : k)}
        >
          <span className="mc-participation-dot" aria-hidden="true" />
          {t.participation[k].label}
        </button>
      ))}
    </div>
  );
}

/** Colour key with counts; clicking an entry filters on it, clicking it again clears the filter. */
export function ParticipationLegend({ counts, active, onSelect }: { counts: Map<ParticipationKey, number>; active: string; onSelect: (key: string) => void }) {
  return (
    <div className="mc-participation-legend" role="group" aria-label={t.participationTitle}>
      {KEYS.map((k) => (
        <button
          key={k}
          type="button"
          className="mc-participation-legend-item"
          data-participation={k}
          aria-pressed={active === k}
          onClick={() => onSelect(active === k ? '' : k)}
        >
          <span className="mc-participation-dot" aria-hidden="true" />
          {t.participation[k].short}
          <span className="mc-muted">{counts.get(k) ?? 0}</span>
        </button>
      ))}
    </div>
  );
}
