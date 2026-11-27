import { geoPath } from 'd3-geo';
import { useMemo, useState } from 'react';
import { Pill, Segmented } from '../components/ui';
import { countryName, isExistingMarket } from '../data/dimensions';
import { TRADE_MEDIA, type MediaPriority, type TradeMedium } from '../data/media';
import { audienceLabel, lang, t } from '../i18n';
import { COUNTRIES, REGIONS, W, frameFor, type Region } from './worldMap';

const PRIORITIES: MediaPriority[] = ['eerste_keuze', 'interessant', 'selectief'];
const PRIORITY_TONE: Record<MediaPriority, 'success' | 'info' | 'neutral'> = { eerste_keuze: 'success', interessant: 'info', selectief: 'neutral' };

interface Reach { medium: TradeMedium; share?: number; home: boolean }

/** Per country the titles that reach it, strongest priority first, then home market, then share. */
function reachByCountry(): Map<string, Reach[]> {
  const byCountry = new Map<string, Reach[]>();
  for (const medium of TRADE_MEDIA) {
    for (const { code, share } of medium.geo) {
      byCountry.set(code, [...(byCountry.get(code) ?? []), { medium, share, home: medium.countries.includes(code) }]);
    }
  }
  const rank = (r: Reach) => [PRIORITIES.indexOf(r.medium.priority), r.home ? 0 : 1, -(r.share ?? 100)];
  for (const list of byCountry.values()) {
    list.sort((a, b) => {
      const [x, y] = [rank(a), rank(b)];
      return x[0] - y[0] || x[1] - y[1] || x[2] - y[2];
    });
  }
  return byCountry;
}

/** The trade media on a world map: each country coloured by the strongest title that reaches it. */
export default function MediaMap({ onShow }: { onShow: (medium: string) => void }) {
  const [region, setRegion] = useState<Region>('europa');
  const [selected, setSelected] = useState<string>();
  const { projection, height } = useMemo(() => frameFor(region), [region]);
  const path = useMemo(() => geoPath(projection), [projection]);
  const byCountry = useMemo(reachByCountry, []);
  const countries = [...byCountry.keys()].sort((a, b) => byCountry.get(b)!.length - byCountry.get(a)!.length || countryName(a).localeCompare(countryName(b)));
  const noSplit = TRADE_MEDIA.filter((m) => m.geo.length === 0);
  const toggle = (code: string) => setSelected(code === selected ? undefined : code);
  const shown = selected ? [selected] : countries;

  return (
    <section className="mc-map" aria-label={t.pr.map.title}>
      <div className="mc-map-bar mc-section-bar">
        <Segmented
          label={t.events.map.region}
          value={region}
          onChange={setRegion}
          options={(Object.keys(REGIONS) as Region[]).map((r) => ({ value: r, label: t.events.map.regions[r] }))}
        />
        <ul className="mc-map-legend">
          {PRIORITIES.map((p) => <li key={p}><span className="mc-map-swatch" data-priority={p} />{t.pr.priority[p]}</li>)}
          <li><span className="mc-map-swatch" data-existing />{t.pr.map.existing}</li>
        </ul>
      </div>
      <svg className="mc-map-canvas" viewBox={`0 0 ${W} ${Math.round(height)}`} role="group" aria-label={t.pr.map.title}>
        <path className="mc-map-sphere" d={path({ type: 'Sphere' }) ?? undefined} />
        {COUNTRIES.map((c, n) => {
          const reach = c.code ? byCountry.get(c.code) : undefined;
          const d = path(c) ?? undefined;
          if (!reach) return <path key={n} className="mc-map-country" data-existing={(c.code && isExistingMarket(c.code)) || undefined} d={d} />;
          const name = `${countryName(c.code!)}: ${reach.map((r) => r.medium.medium).join(', ')}`;
          return (
            <path
              key={n}
              className="mc-map-country mc-map-reached"
              data-priority={reach[0].medium.priority}
              data-existing={isExistingMarket(c.code!) || undefined}
              data-selected={c.code === selected || undefined}
              d={d}
              role="button"
              tabIndex={0}
              aria-label={name}
              aria-pressed={c.code === selected}
              onClick={() => toggle(c.code!)}
              onKeyDown={(ev) => {
                if (ev.key !== 'Enter' && ev.key !== ' ') return;
                ev.preventDefault();
                toggle(c.code!);
              }}
            >
              <title>{name}</title>
            </path>
          );
        })}
      </svg>
      <div className="mc-map-place">
        <div className="mc-section-bar">
          <h3>{selected ? <>{countryName(selected)}<span className="mc-muted"> · {t.pr.map.mediaHere(byCountry.get(selected)!.length)}</span></> : t.pr.map.byCountry}</h3>
          {selected && <button type="button" className="mc-link-button" onClick={() => setSelected(undefined)}>{t.pr.map.showAll}</button>}
        </div>
        {!selected && <p className="mc-muted mc-map-hint">{t.pr.map.hint}</p>}
        <ul className="mc-map-reach">
          {shown.map((code) => (
            <li key={code}>
              {!selected && (
                <button type="button" className="mc-map-reach-country" onClick={() => setSelected(code)}>
                  {countryName(code)}
                  {isExistingMarket(code) && <span className="mc-muted"> · {t.pr.map.existing}</span>}
                </button>
              )}
              <ul>
                {byCountry.get(code)!.map(({ medium, share, home }) => (
                  <li key={medium.medium}>
                    <button type="button" onClick={() => onShow(medium.medium)}>
                      <span className="mc-map-title">{medium.medium}</span>
                      <span className="mc-muted">
                        {[home && t.pr.map.home, share != null && t.pr.map.share(share), !medium.audiences.includes('producenten') && medium.audiences.map(audienceLabel).join(', ')].filter(Boolean).join(' · ')}
                      </span>
                      <Pill tone={PRIORITY_TONE[medium.priority]}>{t.pr.priority[medium.priority]}</Pill>
                    </button>
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ul>
        {selected && byCountry.get(selected)!.some((r) => r.medium.geoNote) && (
          <p className="mc-muted mc-map-hint">
            {byCountry.get(selected)!.filter((r) => r.medium.geoNote).map((r) => `${r.medium.medium}: ${r.medium.geoNote![lang]}`).join(' ')}
          </p>
        )}
      </div>
      {noSplit.length > 0 && (
        <p className="mc-muted mc-map-hint">
          {t.pr.map.noSplit}{' '}
          {noSplit.map((m, n) => (
            <span key={m.medium}>
              {n > 0 && ', '}
              <button type="button" className="mc-link-button" onClick={() => onShow(m.medium)}>{m.medium}</button>
              {m.geoNote && ` (${m.geoNote[lang].replace(/\.$/, '').toLocaleLowerCase(lang)})`}
            </span>
          ))}
        </p>
      )}
    </section>
  );
}
