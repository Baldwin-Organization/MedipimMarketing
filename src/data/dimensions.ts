import { audienceLabel, productLabel, t } from '../i18n';
import type { Audience, Item, ProductType } from './types';

export const AUDIENCES: Audience[] = ['groothandels', 'producenten', 'apothekers', 'ziekenhuizen'];
export const PRODUCT_TYPES: ProductType[] = ['geneesmiddelen', 'cannabis', 'cosmetica', 'voeding', 'baby'];

export const audienceOptions = () => AUDIENCES.map((value) => ({ value, label: audienceLabel(value) }));
export const productOptions = () => PRODUCT_TYPES.map((value) => ({ value, label: productLabel(value) }));

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

const regionNames = new Map<string, Intl.DisplayNames>();
function namesFor(locale: string) {
  if (!regionNames.has(locale)) regionNames.set(locale, new Intl.DisplayNames(locale, { type: 'region' }));
  return regionNames.get(locale)!;
}

/** Country name in the current language. */
export const countryName = (code: string) => namesFor(t.regionLocale).of(code) ?? code;

export const byCountryName = (a: string, b: string) => countryName(a).localeCompare(countryName(b), t.regionLocale);

export const isExistingMarket = (code: string) => EXISTING_MARKETS.includes(code);

export const newMarkets = () => ISO_CODES.filter((c) => !isExistingMarket(c)).sort(byCountryName);

export const existingMarketsSorted = () => [...EXISTING_MARKETS].sort(byCountryName);

/** Country name (as `Intl.DisplayNames` writes it in `locale`, Dutch by default) to ISO code; used to read seed locations and map data. */
export function countryCode(name: string, locale = 'nl'): string | undefined {
  const n = name.trim().toLocaleLowerCase(locale);
  return ISO_CODES.find((c) => (namesFor(locale).of(c) ?? '').toLocaleLowerCase(locale) === n);
}

/** Filter values for the country filter: a single ISO code or one of the two market groups. */
export type CountryFilter = '' | 'markt:bestaand' | 'markt:nieuw' | string;

export function matchesCountry(item: Item, filter: CountryFilter): boolean {
  if (!filter) return true;
  if (filter === 'markt:bestaand') return item.countries.some(isExistingMarket);
  if (filter === 'markt:nieuw') return item.countries.some((c) => !isExistingMarket(c));
  return item.countries.includes(filter);
}
