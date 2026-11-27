import { byCountryName, countryName, existingMarketsSorted, isExistingMarket, type CountryFilter } from '../data/dimensions';
import { t } from '../i18n';
import type { Item } from '../data/types';

export function FilterSelect<T extends string>({ label, value, options, onChange }: {
  label: string;
  value: T | '';
  options: (T | { value: T; label: string })[];
  onChange: (v: T | '') => void;
}) {
  return (
    <select className="mc-input mc-filter-select" aria-label={label} value={value} data-active={!!value || undefined} onChange={(e) => onChange(e.target.value as T | '')}>
      <option value="">{t.common.filterAll(label)}</option>
      {options.map((o) => {
        const { value: v, label: l } = typeof o === 'string' ? { value: o, label: o } : o;
        return <option key={v} value={v}>{t.common.filterValue(label, l)}</option>;
      })}
    </select>
  );
}

/** Existing markets are always offered; new markets only when some item uses them. */
export function CountrySelect({ value, onChange, items }: { value: CountryFilter; onChange: (v: CountryFilter) => void; items: Item[] }) {
  const newMarkets = [...new Set(items.flatMap((i) => i.countries))]
    .filter((c) => !isExistingMarket(c))
    .sort(byCountryName);
  const country = t.dims.country;
  return (
    <select className="mc-input mc-filter-select" aria-label={country} value={value} data-active={!!value || undefined} onChange={(e) => onChange(e.target.value)}>
      <option value="">{t.common.filterAll(country)}</option>
      <option value="markt:bestaand">{t.dims.allExisting}</option>
      <option value="markt:nieuw">{t.dims.allNew}</option>
      <optgroup label={t.dims.existingMarkets}>
        {existingMarketsSorted().map((c) => <option key={c} value={c}>{t.common.filterValue(country, countryName(c))}</option>)}
      </optgroup>
      {newMarkets.length > 0 && (
        <optgroup label={t.dims.newMarkets}>
          {newMarkets.map((c) => <option key={c} value={c}>{t.common.filterValue(country, countryName(c))}</option>)}
        </optgroup>
      )}
    </select>
  );
}
