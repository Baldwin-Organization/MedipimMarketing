import { useId, type ReactNode } from 'react';
import {
  AUDIENCES, EXISTING_MARKETS_SORTED, NEW_MARKETS, PRODUCT_TYPES,
  audienceLabel, countryName, isExistingMarket, productLabel,
} from '../data/dimensions';
import type { Audience, Item, ProductType } from '../data/types';
import { Icon, Pill, ToggleChipGroup } from './ui';

export function DimensionTags({ item }: { item: Pick<Item, 'audiences' | 'productTypes' | 'countries'> }) {
  if (!item.audiences.length && !item.productTypes.length && !item.countries.length) return null;
  return (
    <div className="mc-tags" aria-label="Verrijking">
      {item.audiences.map((a) => <span key={a} className="mc-pill" data-accent="2">{audienceLabel(a)}</span>)}
      {item.productTypes.map((p) => <span key={p} className="mc-pill" data-accent="7">{productLabel(p)}</span>)}
      {item.countries.map((c) => (
        <Pill key={c} tone={isExistingMarket(c) ? 'neutral' : 'warning'}>
          {countryName(c)}{isExistingMarket(c) ? '' : ' · nieuwe markt'}
        </Pill>
      ))}
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

interface Value { audiences: Audience[]; productTypes: ProductType[]; countries: string[] }

export function DimensionFields({ value, onChange }: { value: Value; onChange: (patch: Partial<Value>) => void }) {
  const existing = value.countries.filter(isExistingMarket);
  const added = value.countries.filter((c) => !isExistingMarket(c));
  return (
    <>
      <Group label="Doelgroep">
        <ToggleChipGroup label="Doelgroep" value={value.audiences} onChange={(audiences) => onChange({ audiences })} options={AUDIENCES} />
      </Group>
      <Group label="Type product">
        <ToggleChipGroup label="Type product" value={value.productTypes} onChange={(productTypes) => onChange({ productTypes })} options={PRODUCT_TYPES} />
      </Group>
      <Group label="Bestaande markten">
        <ToggleChipGroup
          label="Bestaande markten"
          value={existing}
          onChange={(next) => onChange({ countries: [...next, ...added] })}
          options={EXISTING_MARKETS_SORTED.map((c) => ({ value: c, label: countryName(c) }))}
        />
      </Group>
      <Group label="Nieuwe markten">
        <div className="mc-chip-group">
          {added.map((c) => (
            <button
              key={c}
              type="button"
              className="mc-toggle-chip"
              aria-pressed="true"
              aria-label={`${countryName(c)} verwijderen`}
              onClick={() => onChange({ countries: value.countries.filter((x) => x !== c) })}
            >
              {countryName(c)}
              <Icon name="close" size={14} />
            </button>
          ))}
          <select
            className="mc-input mc-filter-select"
            aria-label="Nieuwe markt toevoegen"
            value=""
            onChange={(e) => e.target.value && onChange({ countries: [...value.countries, e.target.value] })}
          >
            <option value="">Land toevoegen…</option>
            {NEW_MARKETS.filter((c) => !added.includes(c)).map((c) => <option key={c} value={c}>{countryName(c)}</option>)}
          </select>
        </div>
      </Group>
    </>
  );
}
