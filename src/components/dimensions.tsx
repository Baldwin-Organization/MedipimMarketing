import { useId, type ReactNode } from 'react';
import { LANGUAGES, audienceOptions, countryName, existingMarketsSorted, isExistingMarket, languageName, newMarkets, productOptions, withCountryLanguages } from '../data/dimensions';
import { audienceLabel, productLabel, t } from '../i18n';
import type { Audience, Item, ProductType } from '../data/types';
import { Icon, Pill, ToggleChipGroup } from './ui';

export function DimensionTags({ item }: { item: Pick<Item, 'audiences' | 'productTypes' | 'countries' | 'languages'> }) {
  const languages = item.languages ?? [];
  if (!item.audiences.length && !item.productTypes.length && !item.countries.length && !languages.length) return null;
  return (
    <div className="mc-tags" aria-label={t.dims.region}>
      {item.audiences.map((a) => <span key={a} className="mc-pill" data-accent="2">{audienceLabel(a)}</span>)}
      {item.productTypes.map((p) => <span key={p} className="mc-pill" data-accent="7">{productLabel(p)}</span>)}
      {item.countries.map((c) => (
        <Pill key={c} tone={isExistingMarket(c) ? 'neutral' : 'warning'}>
          {countryName(c)}{isExistingMarket(c) ? '' : t.dims.newMarketSuffix}
        </Pill>
      ))}
      {languages.map((l) => <Pill key={l} tone="info">{languageName(l)}</Pill>)}
    </div>
  );
}

function Group({ label, children }: { label: string; children: ReactNode }) {
  const id = useId();
  return (
    <div className="mc-field" role="group" aria-labelledby={id}>
      <span id={id} className="mc-field-label">{label}</span>
      {children}
    </div>
  );
}

interface Value { audiences: Audience[]; productTypes: ProductType[]; countries: string[]; languages: string[] }

export function DimensionFields({ value, onChange: change }: { value: Value; onChange: (patch: Partial<Value>) => void }) {
  const existing = value.countries.filter(isExistingMarket);
  const added = value.countries.filter((c) => !isExistingMarket(c));
  const onChange = (patch: Partial<Value>) =>
    change(patch.countries ? { ...patch, languages: withCountryLanguages(value.countries, patch.countries, value.languages) } : patch);
  return (
    <>
      <Group label={t.dims.audience}>
        <ToggleChipGroup label={t.dims.audience} value={value.audiences} onChange={(audiences) => onChange({ audiences })} options={audienceOptions()} />
      </Group>
      <Group label={t.dims.product}>
        <ToggleChipGroup label={t.dims.product} value={value.productTypes} onChange={(productTypes) => onChange({ productTypes })} options={productOptions()} />
      </Group>
      <Group label={t.dims.existingMarkets}>
        <ToggleChipGroup
          label={t.dims.existingMarkets}
          value={existing}
          onChange={(next) => onChange({ countries: [...next, ...added] })}
          options={existingMarketsSorted().map((c) => ({ value: c, label: countryName(c) }))}
        />
      </Group>
      <Group label={t.dims.newMarkets}>
        <div className="mc-chip-group">
          {added.map((c) => (
            <button
              key={c}
              type="button"
              className="mc-toggle-chip"
              aria-pressed="true"
              aria-label={t.dims.remove(countryName(c))}
              onClick={() => onChange({ countries: value.countries.filter((x) => x !== c) })}
            >
              {countryName(c)}
              <Icon name="close" size={14} />
            </button>
          ))}
          <select
            className="mc-input mc-filter-select"
            aria-label={t.dims.addNewMarket}
            value=""
            onChange={(e) => e.target.value && onChange({ countries: [...value.countries, e.target.value] })}
          >
            <option value="">{t.dims.addCountry}</option>
            {newMarkets().filter((c) => !added.includes(c)).map((c) => <option key={c} value={c}>{countryName(c)}</option>)}
          </select>
        </div>
      </Group>
      <Group label={t.dims.languages}>
        <ToggleChipGroup
          label={t.dims.languages}
          value={value.languages}
          onChange={(languages) => onChange({ languages })}
          options={[...new Set([...LANGUAGES, ...value.languages])].map((l) => ({ value: l, label: languageName(l) }))}
        />
        <span className="mc-muted">{t.dims.languagesHint}</span>
      </Group>
    </>
  );
}
