import { geoCentroid, geoNaturalEarth1, geoPath, type GeoProjection } from 'd3-geo';
import type { Feature, Geometry, MultiPoint } from 'geojson';
import { feature } from 'topojson-client';
import type { GeometryCollection, Topology } from 'topojson-specification';
import world from 'world-atlas/countries-110m.json';
import { countryCode } from '../data/dimensions';
import type { LngLat } from '../data/places';
import type { t } from '../i18n';

export const W = 1000;
const H_MAX = 480;

export type Region = keyof typeof t.events.map.regions;
/** South-west and north-east corner of what each region shows; the world leaves out Antarctica. */
export const REGIONS: Record<Region, [LngLat, LngLat]> = {
  wereld: [[-180, -56], [180, 82]],
  europa: [[-11, 35], [31, 61]],
  amerika: [[-128, 17], [-62, 56]],
  azie: [[38, -42], [156, 42]],
};

/** Natural Earth names that `Intl.DisplayNames` writes differently. */
const NAME_TO_CODE: Record<string, string> = {
  'United States of America': 'US', 'Dem. Rep. Congo': 'CD', 'Central African Rep.': 'CF', 'Bosnia and Herz.': 'BA',
  'Czechia': 'CZ', 'Macedonia': 'MK', "Côte d'Ivoire": 'CI', 'S. Sudan': 'SS', 'Dominican Rep.': 'DO', 'Eq. Guinea': 'GQ',
  'eSwatini': 'SZ', 'Solomon Is.': 'SB', 'Falkland Is.': 'FK', 'W. Sahara': 'EH', 'Kosovo': 'XK',
  'Turkey': 'TR', 'Myanmar': 'MM', 'Congo': 'CG', 'Trinidad and Tobago': 'TT',
};

export type Country = Feature<Geometry, { name: string }> & { code?: string };
const topology = world as unknown as Topology<{ countries: GeometryCollection<{ name: string }> }>;
export const COUNTRIES: Country[] = feature(topology, topology.objects.countries).features.map((f) => ({
  ...f,
  code: NAME_TO_CODE[f.properties.name] ?? countryCode(f.properties.name, 'en'),
}));
export const CENTROIDS = new Map(COUNTRIES.filter((c) => c.code).map((c) => [c.code!, geoCentroid(c) as LngLat]));

/**
 * The projection fills the width with the region and the map gets the region's height, up to `H_MAX`.
 * The corners and the middle of both sides are fitted, since the projection is widest at the equator.
 */
export function frameFor(region: Region): { projection: GeoProjection; height: number } {
  const [[w, s], [e, n]] = REGIONS[region];
  const equator = Math.max(s, Math.min(n, 0));
  const box: MultiPoint = { type: 'MultiPoint', coordinates: [[w, s], [e, s], [w, n], [e, n], [w, (s + n) / 2], [e, (s + n) / 2], [w, equator], [e, equator]] };
  const pad = region === 'wereld' ? 8 : 24;
  const projection = geoNaturalEarth1().fitWidth(W - 2 * pad, box);
  const [[x0, y0], [, y1]] = geoPath(projection).bounds(box);
  const height = y1 - y0 + 2 * pad;
  if (height > H_MAX) return { projection: projection.fitExtent([[pad, pad], [W - pad, H_MAX - pad]], box), height: H_MAX };
  const [tx, ty] = projection.translate();
  return { projection: projection.translate([tx + pad - x0, ty + pad - y0]), height };
}
