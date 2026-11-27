import { geoPath } from 'd3-geo';
import { useMemo, useState } from 'react';
import { ParticipationPill } from '../components/participation';
import { Segmented } from '../components/ui';
import { fmt } from '../data/dates';
import { countryName } from '../data/dimensions';
import { participationKey, type ParticipationKey } from '../data/meta';
import { cityCoordinates, type LngLat } from '../data/places';
import type { Item } from '../data/types';
import { itemText, itemTitle, t } from '../i18n';
import { useUi } from '../ui-context';
import { CENTROIDS, COUNTRIES, REGIONS, W, frameFor, type Region } from './worldMap';

/** The marker of a place takes the colour of its most committed event; the most committed markers are drawn on top. */
const STRONGEST: ParticipationKey[] = ['exposant', 'bezoeker', 'campagne', 'geen', 'open'];

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
          .map((p) => ({ p, xy: projection(p.at), rank: STRONGEST.indexOf(strongest(p.events)) }))
          .filter((m): m is { p: Place; xy: [number, number]; rank: number } => !!m.xy)
          .sort((a, b) => b.rank - a.rank || b.p.events.length - a.p.events.length)
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
