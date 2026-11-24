import type { Audience, Item, ProductType } from './types';

export const AUDIENCES: { value: Audience; label: string }[] = [
  { value: 'groothandels', label: 'Groothandels' },
  { value: 'producenten', label: 'Producenten' },
  { value: 'apothekers', label: 'Apothekers' },
  { value: 'ziekenhuizen', label: 'Ziekenhuizen' },
];

export const PRODUCT_TYPES: { value: ProductType; label: string }[] = [
  { value: 'geneesmiddelen', label: 'Geneesmiddelen' },
  { value: 'cannabis', label: 'Medicinale cannabis' },
  { value: 'cosmetica', label: 'Cosmetica' },
  { value: 'voeding', label: 'Voeding & supplementen' },
  { value: 'baby', label: 'Baby' },
];

export const audienceLabel = (a: Audience) => AUDIENCES.find((x) => x.value === a)?.label ?? a;
export const productLabel = (p: ProductType) => PRODUCT_TYPES.find((x) => x.value === p)?.label ?? p;

/** Countries where Medipim is already active; every other country is a new market. */
export const EXISTING_MARKETS = ['BE', 'FR', 'DE', 'GB', 'LU', 'AT', 'ES', 'US', 'AU'];

const ISO_CODES = (
  'AD AE AF AG AI AL AM AO AR AS AT AU AW AX AZ BA BB BD BE BF BG BH BI BJ BL BM BN BO BQ BR BS BT BW BY BZ ' +
  'CA CC CD CF CG CH CI CK CL CM CN CO CR CU CV CW CX CY CZ DE DJ DK DM DO DZ EC EE EG EH ER ES ET FI FJ FK FM FO FR ' +
  'GA GB GD GE GF GG GH GI GL GM GN GP GQ GR GT GU GW GY HK HN HR HT HU ID IE IL IM IN IQ IR IS IT JE JM JO JP ' +
  'KE KG KH KI KM KN KP KR KW KY KZ LA LB LC LI LK LR LS LT LU LV LY MA MC MD ME MF MG MH MK ML MM MN MO MP MQ MR MS MT ' +
  'MU MV MW MX MY MZ NA NC NE NF NG NI NL NO NP NR NU NZ OM PA PE PF PG PH PK PL PM PN PR PS PT PW PY QA RE RO RS RU RW ' +
  'SA SB SC SD SE SG SH SI SJ SK SL SM SN SO SR SS ST SV SX SY SZ TC TD TG TH TJ TK TL TM TN TO TR TT TV TW TZ UA UG US ' +
  'UY UZ VA VC VE VG VI VN VU WF WS XK YE YT ZA ZM ZW'
).split(' ');

const regionNames = new Intl.DisplayNames('nl', { type: 'region' });
export const countryName = (code: string) => regionNames.of(code) ?? code;

const byName = (a: string, b: string) => countryName(a).localeCompare(countryName(b), 'nl');

export const isExistingMarket = (code: string) => EXISTING_MARKETS.includes(code);

export const NEW_MARKETS = ISO_CODES.filter((c) => !isExistingMarket(c)).sort(byName);

export const EXISTING_MARKETS_SORTED = [...EXISTING_MARKETS].sort(byName);

/** Dutch country name (as `Intl.DisplayNames` writes it) to ISO code. */
export function countryCode(name: string): string | undefined {
  const n = name.trim().toLocaleLowerCase('nl');
  return ISO_CODES.find((c) => countryName(c).toLocaleLowerCase('nl') === n);
}

/** Filter values for the country filter: a single ISO code or one of the two market groups. */
export type CountryFilter = '' | 'markt:bestaand' | 'markt:nieuw' | string;

export function matchesCountry(item: Item, filter: CountryFilter): boolean {
  if (!filter) return true;
  if (filter === 'markt:bestaand') return item.countries.some(isExistingMarket);
  if (filter === 'markt:nieuw') return item.countries.some((c) => !isExistingMarket(c));
  return item.countries.includes(filter);
}
