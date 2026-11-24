import { EXISTING_MARKETS_SORTED, countryName, isExistingMarket, type CountryFilter } from '../data/dimensions';
import type { Item } from '../data/types';

export function FilterSelect<T extends string>({ label, value, options, onChange }: {
  label: string;
  value: T | '';
  options: (T | { value: T; label: string })[];
  onChange: (v: T | '') => void;
}) {
  return (
    <select className="mc-input mc-filter-select" aria-label={label} value={value} data-active={!!value || undefined} onChange={(e) => onChange(e.target.value as T | '')}>
      <option value="">{label}: alle</option>
      {options.map((o) => {
        const { value: v, label: l } = typeof o === 'string' ? { value: o, label: o } : o;
        return <option key={v} value={v}>{label}: {l}</option>;
      })}
    </select>
  );
}

/** Existing markets are always offered; new markets only when some item uses them. */
export function CountrySelect({ value, onChange, items }: { value: CountryFilter; onChange: (v: CountryFilter) => void; items: Item[] }) {
  const newMarkets = [...new Set(items.flatMap((i) => i.countries))]
    .filter((c) => !isExistingMarket(c))
    .sort((a, b) => countryName(a).localeCompare(countryName(b), 'nl'));
  return (
    <select className="mc-input mc-filter-select" aria-label="Land" value={value} data-active={!!value || undefined} onChange={(e) => onChange(e.target.value)}>
      <option value="">Land: alle</option>
      <option value="markt:bestaand">Alle bestaande markten</option>
      <option value="markt:nieuw">Alle nieuwe markten</option>
      <optgroup label="Bestaande markten">
        {EXISTING_MARKETS_SORTED.map((c) => <option key={c} value={c}>Land: {countryName(c)}</option>)}
      </optgroup>
      {newMarkets.length > 0 && (
        <optgroup label="Nieuwe markten">
          {newMarkets.map((c) => <option key={c} value={c}>Land: {countryName(c)}</option>)}
        </optgroup>
      )}
    </select>
  );
}
