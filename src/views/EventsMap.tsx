import { geoCentroid, geoNaturalEarth1, geoPath, type GeoProjection } from 'd3-geo';
import type { Feature, Geometry, MultiPoint } from 'geojson';
import { useMemo, useState } from 'react';
import { feature } from 'topojson-client';
import type { GeometryCollection, Topology } from 'topojson-specification';
import world from 'world-atlas/countries-110m.json';
import { ParticipationPill } from '../components/participation';
import { Segmented } from '../components/ui';
import { fmt } from '../data/dates';
import { countryCode, countryName } from '../data/dimensions';
import { participationKey, type ParticipationKey } from '../data/meta';
import { cityCoordinates, type LngLat } from '../data/places';
import type { Item } from '../data/types';
import { itemText, itemTitle, t } from '../i18n';
import { useUi } from '../ui-context';

const W = 1000;
const H_MAX = 480;

type Region = keyof typeof t.events.map.regions;
/** South-west and north-east corner of what each region shows; the world leaves out Antarctica. */
const REGIONS: Record<Region, [LngLat, LngLat]> = {
  wereld: [[-180, -56], [180, 82]],
  europa: [[-11, 35], [31, 61]],
  amerika: [[-128, 17], [-62, 56]],
  azie: [[38, -42], [156, 42]],
};

/** The marker of a place takes the colour of its most committed event. */
const STRONGEST: ParticipationKey[] = ['exposant', 'bezoeker', 'campagne', 'geen', 'open'];

/** Natural Earth names that `Intl.DisplayNames` writes differently. */
const NAME_TO_CODE: Record<string, string> = {
  'United States of America': 'US', 'Dem. Rep. Congo': 'CD', 'Central African Rep.': 'CF', 'Bosnia and Herz.': 'BA',
  'Czechia': 'CZ', 'Macedonia': 'MK', "Côte d'Ivoire": 'CI', 'S. Sudan': 'SS', 'Dominican Rep.': 'DO', 'Eq. Guinea': 'GQ',
  'eSwatini': 'SZ', 'Solomon Is.': 'SB', 'Falkland Is.': 'FK', 'W. Sahara': 'EH', 'Kosovo': 'XK',
};

type Country = Feature<Geometry, { name: string }> & { code?: string };
const topology = world as unknown as Topology<{ countries: GeometryCollection<{ name: string }> }>;
const COUNTRIES: Country[] = feature(topology, topology.objects.countries).features.map((f) => ({
  ...f,
  code: NAME_TO_CODE[f.properties.name] ?? countryCode(f.properties.name, 'en'),
}));
const CENTROIDS = new Map(COUNTRIES.filter((c) => c.code).map((c) => [c.code!, geoCentroid(c) as LngLat]));

interface Place {
  key: string;
  at: LngLat;
  label: string;
  countryOnly: boolean;
  events: Item[];
}

function placesOf(events: Item[]): { places: Place[]; unplaced: Item[] } {
  const places = new Map<string, Place>();
  const unplaced: Item[] = [];
  for (const e of events) {
    const city = cityCoordinates(e.location);
    const at = city ?? (e.countries[0] ? CENTROIDS.get(e.countries[0]) : undefined);
    if (!at) {
      unplaced.push(e);
      continue;
    }
    const key = at.join(',');
    const label = city ? itemText(e, 'location').split(',')[0] : countryName(e.countries[0]);
    const place = places.get(key) ?? { key, at, label, countryOnly: !city, events: [] };
    place.events.push(e);
    places.set(key, place);
  }
  return { places: [...places.values()], unplaced };
}

/**
 * The projection fills the width with the region and the map gets the region's height, up to `H_MAX`.
 * The corners and the middle of both sides are fitted, since the projection is widest at the equator.
 */
function frameFor(region: Region): { projection: GeoProjection; height: number } {
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

const strongest = (events: Item[]) => STRONGEST.find((k) => events.some((e) => participationKey(e.participation) === k))!;

/** The events as points on a world map, one per place, with the events of the chosen place listed underneath. */
export default function EventsMap({ events }: { events: Item[] }) {
  const { openItem } = useUi();
  const [region, setRegion] = useState<Region>('wereld');
  const [selected, setSelected] = useState<string>();
  const { projection, height } = useMemo(() => frameFor(region), [region]);
  const path = useMemo(() => geoPath(projection), [projection]);
  const { places, unplaced } = useMemo(() => placesOf(events), [events]);
  const withEvents = useMemo(() => new Set(events.flatMap((e) => e.countries)), [events]);
  const current = places.find((p) => p.key === selected);
  const scale = region === 'wereld' ? 1 : 1.25;

  return (
    <section className="mc-map" aria-label={t.events.map.title}>
      <div className="mc-map-bar">
        <Segmented
          label={t.events.map.region}
          value={region}
          onChange={setRegion}
          options={(Object.keys(REGIONS) as Region[]).map((r) => ({ value: r, label: t.events.map.regions[r] }))}
        />
      </div>
      <svg className="mc-map-canvas" viewBox={`0 0 ${W} ${Math.round(height)}`} role="group" aria-label={t.events.map.title}>
        <path className="mc-map-sphere" d={path({ type: 'Sphere' }) ?? undefined} />
        {COUNTRIES.map((c, n) => (
          <path key={n} className="mc-map-country" data-events={(c.code && withEvents.has(c.code)) || undefined} d={path(c) ?? undefined} />
        ))}
        {places
          .map((p) => ({ p, xy: projection(p.at) }))
          .filter((m): m is { p: Place; xy: [number, number] } => !!m.xy)
          .sort((a, b) => b.p.events.length - a.p.events.length)
          .map(({ p, xy: [x, y] }) => {
            const r = (6 + 2.5 * Math.sqrt(p.events.length - 1)) * scale;
            const name = `${p.label}: ${p.events.map(itemTitle).join(', ')}`;
            return (
              <g
                key={p.key}
                className="mc-map-marker"
                data-participation={strongest(p.events)}
                data-selected={p.key === selected || undefined}
                transform={`translate(${x} ${y})`}
                role="button"
                tabIndex={0}
                aria-label={name}
                aria-pressed={p.key === selected}
                onClick={() => setSelected(p.key === selected ? undefined : p.key)}
                onKeyDown={(ev) => {
                  if (ev.key !== 'Enter' && ev.key !== ' ') return;
                  ev.preventDefault();
                  setSelected(p.key === selected ? undefined : p.key);
                }}
              >
                <title>{name}</title>
                <circle r={r} />
                {p.events.length > 1 && <text dy="0.35em">{p.events.length}</text>}
              </g>
            );
          })}
      </svg>
      {current ? (
        <div className="mc-map-place">
          <h3>
            {current.label}
            <span className="mc-muted"> · {t.events.map.eventsHere(current.events.length)}</span>
          </h3>
          {current.countryOnly && <p className="mc-muted">{t.events.map.countryOnly}</p>}
          <ul>
            {[...current.events].sort((a, b) => a.date.localeCompare(b.date)).map((e) => (
              <li key={e.id}>
                <button type="button" onClick={() => openItem(e.id)}>
                  <span className="mc-map-date">{fmt(e.date, 'd MMM yyyy')}</span>
                  <span className="mc-map-title">{itemTitle(e)}</span>
                  <ParticipationPill value={e.participation} />
                </button>
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <p className="mc-muted mc-map-hint">{t.events.map.hint}</p>
      )}
      {unplaced.length > 0 && (
        <p className="mc-muted mc-map-hint">
          {t.events.map.unplaced(unplaced.length)}{' '}
          {unplaced.map((e, n) => (
            <span key={e.id}>
              {n > 0 && ', '}
              <button type="button" className="mc-link-button" onClick={() => openItem(e.id)}>{itemTitle(e)}</button>
            </span>
          ))}
        </p>
      )}
    </section>
  );
}
