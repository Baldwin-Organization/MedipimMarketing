import { describe, expect, it } from 'vitest';
import { NEW_MARKETS, countryCode, countryName, isExistingMarket, matchesCountry } from './dimensions';
import { normalizeItem } from './repository';
import { buildSeed } from './seed';
import type { Item } from './types';

const withCountries = (countries: string[]) => ({ countries }) as Item;

describe('markets', () => {
  it('treats the nine current countries as existing and every other one as new', () => {
    expect(['BE', 'FR', 'DE', 'GB', 'LU', 'AT', 'ES', 'US', 'AU'].every(isExistingMarket)).toBe(true);
    expect(isExistingMarket('NL')).toBe(false);
    expect(NEW_MARKETS).toContain('NL');
    expect(NEW_MARKETS).not.toContain('BE');
  });

  it('maps Dutch country names to ISO codes and back', () => {
    expect(countryCode('Verenigd Koninkrijk')).toBe('GB');
    expect(countryCode(' België ')).toBe('BE');
    expect(countryName('US')).toBe('Verenigde Staten');
    expect(countryCode('Atlantis')).toBeUndefined();
  });

  it('filters on a single country or on a market group', () => {
    const item = withCountries(['BE', 'NL']);
    expect(matchesCountry(item, '')).toBe(true);
    expect(matchesCountry(item, 'NL')).toBe(true);
    expect(matchesCountry(item, 'FR')).toBe(false);
    expect(matchesCountry(item, 'markt:bestaand')).toBe(true);
    expect(matchesCountry(withCountries(['BE']), 'markt:nieuw')).toBe(false);
    expect(matchesCountry(withCountries([]), 'markt:bestaand')).toBe(false);
  });
});

describe('enrichment', () => {
  it('gives every seeded event an audience, a product type and its country', () => {
    let n = 0;
    const { items } = buildSeed(() => `id${n++}`);
    expect(items.every((i) => i.audiences.length > 0 && i.productTypes.length > 0 && i.countries.length === 1)).toBe(true);
    expect(items.find((i) => i.title === 'Cann-Reg 2027')).toMatchObject({ countries: ['BE'], productTypes: ['cannabis'] });
    expect(items.find((i) => i.title === 'GIRP PharmaConnect 2027')).toMatchObject({ countries: ['BG'], audiences: ['groothandels'] });
  });

  it('fills missing dimension fields on older items', () => {
    const old = { id: 'x', title: 'Oud' } as Item;
    expect(normalizeItem(old)).toMatchObject({ audiences: [], productTypes: [], countries: [] });
  });
});
