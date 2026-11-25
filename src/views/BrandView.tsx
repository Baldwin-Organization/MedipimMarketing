import { useEffect, useState, type ReactNode } from 'react';
import { useSearchParams } from 'react-router-dom';
import { MedipimLogo, MedipimMark } from '../components/logo';
import { Icon, Segmented } from '../components/ui';
import type { IconName } from '../icons.generated';
import { lang, t } from '../i18n';
import { PageHeader } from './PageHeader';

/** The styleguide's showcase product, so the visuals here match the ones on medipim.com. */
const PRODUCT = {
  id: 'MFB1145ADD',
  brand: 'Eucerin',
  name: 'Eucerin Sun Spray Transparent Ip30 200ml',
  cnk: '2734275',
  ean: '4005800005596',
  content: '200 ml',
  weight: '208 g',
  languages: ['NL', 'FR'],
  image: '/brand/eucerin-sun-spray.webp',
};

const STYLEGUIDE = 'https://www.medipim.com/styleguide/';
const STYLEGUIDE_LINKS = [
  `${STYLEGUIDE}molecules/#c-sheet_card`,
  `${STYLEGUIDE}organisms/`,
  `${STYLEGUIDE}molecules/#c-provide_board`,
  `${STYLEGUIDE}molecules/#c-sheet_pair`,
];

const MOMENT_ICONS: IconName[] = ['inventory_2', 'local_shipping', 'code', 'medication'];
const WEEKLY_ICONS: IconName[] = ['description', 'code', 'photo_camera', 'groups'];
const EXTRA_ICONS: IconName[] = ['smart_toy', 'storefront'];
const SLIDE_ICONS: IconName[] = ['local_shipping', 'help', 'category'];

/** The audiences in the order of `t.brand.moments`, with their photo. */
const PEOPLE = ['manufacturer', 'wholesaler', 'software', 'pharmacy'] as const;
type Person = (typeof PEOPLE)[number];
const photo = (p: Person) => `/brand/audience-${p}.webp`;

type Direction = 'product' | 'audience';
const DIRECTION_PARAM = 'richting';

export function BrandView() {
  const b = t.brand;
  const [params, setParams] = useSearchParams();
  const direction: Direction = params.get(DIRECTION_PARAM) === 'doelgroep' ? 'audience' : 'product';
  const choose = (d: Direction) => setParams(d === 'audience' ? { [DIRECTION_PARAM]: 'doelgroep' } : {}, { replace: true });
  return (
    <div className="mc-page mc-brand" data-direction={direction}>
      <PageHeader title={b.title} subtitle={b.subtitle} />

      <div className="mc-brand-direction">
        <Segmented
          label={b.directionLabel}
          value={direction}
          onChange={choose}
          options={[
            { value: 'product', label: b.directions.product, icon: 'inventory_2' },
            { value: 'audience', label: b.directions.audience, icon: 'groups' },
          ]}
        />
        <p>{b.directionNotes[direction]}</p>
      </div>

      {direction === 'product' ? <ProductDirection /> : <AudienceDirection />}
    </div>
  );
}

function Hero({ tone }: { tone?: 'navy' }) {
  const b = t.brand;
  return (
    <Ground className="mc-brand-hero" tone={tone}>
      <div className="mc-brand-hero-copy">
        <p className="mc-eyebrow">{b.kicker}</p>
        <p className="mc-brand-promise">{b.promise}</p>
        <p className="mc-brand-story">{b.story}</p>
      </div>
      <div className="mc-brand-hero-proof">
        <dl className="mc-brand-figures">
          {b.proof.map((p) => (
            <div key={p.label}>
              <dt>{p.label}</dt>
              <dd>{p.value}</dd>
            </div>
          ))}
        </dl>
        <p className="mc-brand-note">{b.proofNote}</p>
      </div>
    </Ground>
  );
}

function ProductDirection() {
  const b = t.brand;
  return (
    <>
      <Hero />

      <Section title={b.momentsTitle} intro={b.momentsIntro}>
        <div className="mc-brand-moments">
          {b.moments.map((m, i) => (
            <figure key={m.audience} className="mc-brand-moment">
              <span className="mc-brand-moment-icon"><Icon name={MOMENT_ICONS[i]} size={20} /></span>
              <figcaption>{m.audience}</figcaption>
              <blockquote>‘{m.quote}’</blockquote>
            </figure>
          ))}
        </div>
      </Section>

      <Section title={b.dbaTitle} intro={b.dbaIntro}>
        <ol className="mc-brand-principles">
          {b.dba.map((d, i) => (
            <li key={d.title}>
              <span className="mc-brand-step">{i + 1}</span>
              <div>
                <h3>{d.title}</h3>
                <p>{d.text}</p>
              </div>
            </li>
          ))}
        </ol>

        <SubTitle title={b.compositionTitle} note={b.compositionNote} />
        <div className="mc-brand-formats">
          {(['square', 'wide', 'tall'] as const).map((f) => (
            <figure key={f} className="mc-brand-format" data-format={f}>
              <Composition format={f} />
              <figcaption>{b.formats[f]}</figcaption>
            </figure>
          ))}
        </div>

        <SubTitle title={b.whereTitle} />
        <div className="mc-brand-places">
          <figure><WholesalerCatalogue /><figcaption>{b.places.wholesaler}</figcaption></figure>
          <figure><PharmacyScreen /><figcaption>{b.places.pharmacy}</figcaption></figure>
          <figure><WebshopTile /><figcaption>{b.places.webshop}</figcaption></figure>
        </div>

        <div className="mc-brand-taglines">
          <div>
            <span className="mc-eyebrow">{b.taglineLocal}</span>
            <p className="mc-brand-tagline">{b.tagline}</p>
          </div>
          <div>
            <span className="mc-eyebrow">{b.taglineTest}</span>
            <p className="mc-brand-tagline" lang="en">{b.taglineIntl}</p>
          </div>
        </div>
      </Section>

      <Section title={b.styleguideTitle} intro={b.styleguideIntro}>
        <div className="mc-brand-uses">
          <Use index={0}>
            <Ground className="mc-brand-stage" logo>
              <div className="mc-brand-callout-wrap">
                <Sheet highlight="ean" />
                <span className="mc-brand-callout">{b.highlight} · EAN-13</span>
              </div>
            </Ground>
          </Use>
          <Use index={1}>
            <Carousel />
          </Use>
          <Use index={2}>
            <Ground className="mc-brand-stage" logo><TaskBoard /></Ground>
          </Use>
          <Use index={3}>
            <Ground className="mc-brand-stage mc-brand-pair" logo>
              <Sheet />
              <JsonCard />
            </Ground>
          </Use>
        </div>
      </Section>

      <Section title={b.campaignsTitle}>
        <div className="mc-brand-campaigns">
          <Campaign index={0}>
            <Ground className="mc-brand-stage mc-brand-packs" logo>
              <figure className="mc-brand-pack" data-old>
                <img src={PRODUCT.image} alt="" />
                <figcaption>{b.oldPack}</figcaption>
              </figure>
              <Icon name="arrow_forward" size={28} />
              <figure className="mc-brand-pack">
                <img src={PRODUCT.image} alt="" />
                <figcaption>{b.newPack}</figcaption>
                <span className="mc-pill" data-tone="success"><span className="mc-pill-dot" />{b.availableToCustomers}</span>
              </figure>
            </Ground>
          </Campaign>
          <Campaign index={1}>
            <Ground className="mc-brand-stage mc-brand-before-after" logo>
              <figure><span className="mc-eyebrow">{b.before}</span><Sheet bare /></figure>
              <figure><span className="mc-eyebrow">{b.after}</span><Sheet /></figure>
            </Ground>
          </Campaign>
        </div>

        <SubTitle title={b.weeklyTitle} note={b.weeklyIntro} />
        <div className="mc-brand-weekly">
          {b.weekly.map((w, i) => (
            <div key={w.title} className="mc-brand-weekly-item">
              <span className="mc-brand-moment-icon"><Icon name={WEEKLY_ICONS[i]} size={20} /></span>
              <h3>{w.title}</h3>
              <p>{w.text}</p>
            </div>
          ))}
        </div>
        <div className="mc-brand-extras">
          {b.extras.map((e, i) => (
            <div key={e.title} className="mc-brand-extra">
              <Icon name={EXTRA_ICONS[i]} size={20} />
              <p><strong>{e.title}.</strong> {e.text}</p>
            </div>
          ))}
        </div>
      </Section>

      <p className="mc-muted mc-brand-footnote">{b.exampleProduct}: {PRODUCT.name}.</p>
    </>
  );
}

const COMPOSITION_PEOPLE: Record<'square' | 'wide' | 'tall', Person> = { square: 'pharmacy', wide: 'wholesaler', tall: 'manufacturer' };

function AudienceDirection() {
  const b = t.brand;
  const a = b.audience;
  return (
    <>
      <Hero tone="navy" />

      <Section title={a.peopleTitle} intro={a.peopleIntro}>
        <div className="mc-brand-people">
          {PEOPLE.map((p, i) => (
            <figure key={p} className="mc-brand-person">
              <Scene person={p} />
              <figcaption>
                <span className="mc-brand-person-audience"><Icon name={MOMENT_ICONS[i]} size={16} />{b.moments[i].audience}</span>
                <blockquote>‘{b.moments[i].quote}’</blockquote>
              </figcaption>
            </figure>
          ))}
        </div>
      </Section>

      <Section title={a.dbaTitle} intro={a.dbaIntro}>
        <ol className="mc-brand-principles">
          {a.dba.map((d, i) => (
            <li key={d.title}>
              <span className="mc-brand-step" data-tone="navy">{i + 1}</span>
              <div>
                <h3>{d.title}</h3>
                <p>{d.text}</p>
              </div>
            </li>
          ))}
        </ol>

        <SubTitle title={a.compositionTitle} note={a.compositionNote} />
        <div className="mc-brand-formats">
          {(['square', 'wide', 'tall'] as const).map((f) => (
            <figure key={f} className="mc-brand-format" data-format={f}>
              <AudienceComposition format={f} person={COMPOSITION_PEOPLE[f]} />
              <figcaption>{b.formats[f]}</figcaption>
            </figure>
          ))}
        </div>

        <div className="mc-brand-taglines">
          <div data-tone="navy">
            <span className="mc-eyebrow">{b.taglineLocal}</span>
            <p className="mc-brand-tagline">{b.tagline}</p>
          </div>
          <div data-tone="navy">
            <span className="mc-eyebrow">{b.taglineTest}</span>
            <p className="mc-brand-tagline" lang="en">{b.taglineIntl}</p>
          </div>
        </div>
      </Section>

      <Section title={b.campaignsTitle}>
        <div className="mc-brand-campaigns">
          {(['manufacturer', 'wholesaler'] as const).map((p, i) => (
            <article key={p} className="mc-brand-campaign">
              <Ground className="mc-brand-campaign-scene" tone="navy" logo>
                <Scene person={p} />
              </Ground>
              <div className="mc-brand-use-copy">
                <span className="mc-eyebrow">{b.campaigns[i].audience}</span>
                <p className="mc-brand-headline">‘{b.campaigns[i].headline}’</p>
                <p>{a.campaignTexts[i]}</p>
              </div>
            </article>
          ))}
        </div>
      </Section>

      <Section title={a.compareTitle} intro={a.compareIntro}>
        <div className="mc-brand-compare">
          {a.compare.map((c, i) => (
            <div key={c.title} data-tone={i === 1 ? 'navy' : undefined}>
              <h3>{c.title}</h3>
              <dl>
                <div><dt>{a.strengthsLabel}</dt><dd>{c.strengths}</dd></div>
                <div><dt>{a.watchLabel}</dt><dd>{c.watch}</dd></div>
              </dl>
            </div>
          ))}
        </div>
      </Section>

      <p className="mc-muted mc-brand-footnote">{a.photoNote}</p>
    </>
  );
}

/** A person at work, with the one data card from the product sheet they need at that moment. */
function Scene({ person }: { person: Person }) {
  const chip = t.brand.audience.chips[PEOPLE.indexOf(person)];
  return (
    <div className="mc-scene" data-person={person}>
      <img src={photo(person)} alt="" />
      <DataChip label={chip.label} value={chip.value} code={person === 'software'} />
    </div>
  );
}

function DataChip({ label, value, code }: { label: string; value: string; code?: boolean }) {
  return (
    <div className="mc-data-chip" aria-hidden="true">
      <img src={PRODUCT.image} alt="" />
      <div>
        <span className="mc-data-chip-label" data-code={code || undefined}>{label}</span>
        <span className="mc-data-chip-value">{value}</span>
      </div>
    </div>
  );
}

/** The audience composition: the scene, then the dark blue panel with their question and the closing line. */
function AudienceComposition({ format, person }: { format: 'square' | 'wide' | 'tall'; person: Person }) {
  const b = t.brand;
  const i = PEOPLE.indexOf(person);
  return (
    <Ground className="mc-composition mc-audience-composition" tone="navy">
      <div className="mc-audience-body" data-format={format}>
        <Scene person={person} />
        <div className="mc-audience-panel">
          <span className="mc-audience-who">{b.moments[i].audience}</span>
          <p className="mc-audience-quote">‘{b.moments[i].quote}’</p>
        </div>
      </div>
      <footer className="mc-composition-foot">
        <span>{lang === 'en' ? b.taglineIntl : b.tagline}</span>
        <div className="mc-logo-label"><MedipimLogo height={format === 'wide' ? 'max(14px, 3.2cqi)' : 'max(14px, 4.8cqi)'} /></div>
      </footer>
    </Ground>
  );
}

function Section({ title, intro, children }: { title: string; intro?: string; children: ReactNode }) {
  return (
    <section className="mc-brand-section">
      <header>
        <h2>{title}</h2>
        {intro && <p>{intro}</p>}
      </header>
      {children}
    </section>
  );
}

function SubTitle({ title, note }: { title: string; note?: string }) {
  return (
    <div className="mc-brand-subtitle">
      <h3>{title}</h3>
      {note && <p>{note}</p>}
    </div>
  );
}

/** The brand ground of medipim.com: brand blur on a faint grid; `navy` carries it on Medipim dark blue. */
function Ground({ className, logo, tone, children }: { className?: string; logo?: boolean; tone?: 'navy'; children: ReactNode }) {
  return (
    <div className={`mc-ground ${className ?? ''}`} data-logo={logo || undefined} data-tone={tone}>
      <div className="mc-ground-frame" aria-hidden="true" />
      {children}
      {logo && <div className="mc-logo-label mc-ground-logo"><MedipimLogo height={13} /></div>}
    </div>
  );
}

function Use({ index, children }: { index: number; children: ReactNode }) {
  const use = t.brand.uses[index];
  return (
    <article className="mc-brand-use">
      {children}
      <div className="mc-brand-use-copy">
        <h3>{use.name}</h3>
        <p>{use.use}</p>
        <a href={STYLEGUIDE_LINKS[index]} target="_blank" rel="noreferrer">
          {t.brand.styleguideLink}<Icon name="open_in_new" size={14} />
        </a>
      </div>
    </article>
  );
}

function Campaign({ index, children }: { index: number; children: ReactNode }) {
  const c = t.brand.campaigns[index];
  return (
    <article className="mc-brand-campaign">
      {children}
      <div className="mc-brand-use-copy">
        <span className="mc-eyebrow">{c.audience}</span>
        <p className="mc-brand-headline">‘{c.headline}’</p>
        <p>{c.text}</p>
      </div>
    </article>
  );
}

function Pills({ items }: { items: string[] }) {
  return <>{items.map((p) => <span key={p} className="mc-pill">{p}</span>)}</>;
}

/** The product sheet as the platform shows it; `bare` is the sheet before enrichment. */
function Sheet({ bare, highlight }: { bare?: boolean; highlight?: 'ean' }) {
  const b = t.brand;
  return (
    <div className="mc-sheet" aria-hidden="true">
      <div className="mc-sheet-bar">
        <span className="mc-sheet-id">{PRODUCT.id}</span>
        <span className="mc-pill" data-tone="success"><span className="mc-pill-dot" />active</span>
      </div>
      <div className="mc-sheet-main">
        <div className="mc-sheet-media" data-empty={bare || undefined}>
          {bare ? <><Icon name="photo_camera" size={18} /><span>{b.missingPhoto}</span></> : <img src={PRODUCT.image} alt="" />}
        </div>
        <div>
          <p className="mc-sheet-brand">{PRODUCT.brand}</p>
          <p className="mc-sheet-name">{PRODUCT.name}</p>
          <div className="mc-sheet-pills">
            {bare ? <span className="mc-pill" data-tone="warning">{b.missingDescription}</span> : <Pills items={b.categories} />}
          </div>
        </div>
      </div>
      <dl className="mc-sheet-codes">
        <div><dt>CNK</dt><dd>{PRODUCT.cnk}</dd></div>
        <div data-highlight={highlight === 'ean' || undefined}><dt>EAN-13</dt><dd>{PRODUCT.ean}</dd></div>
        <div><dt><Icon name="language" size={12} /></dt><dd>{PRODUCT.languages.map((l) => <span key={l} className="mc-pill" data-quiet>{l}</span>)}</dd></div>
      </dl>
    </div>
  );
}

const JSON_LINES: [string, string?][] = [
  ['{'],
  ['  "id": ', `"${PRODUCT.id}",`],
  ['  "status": ', '"active",'],
  ['  "cnk": ', `"${PRODUCT.cnk}",`],
  ['  "eanGtin13": ', `"${PRODUCT.ean}",`],
  ['  "name": {'],
  ['    "nl": ', `"${PRODUCT.name}",`],
  ['    "fr": ', `"${PRODUCT.name}"`],
  ['  },'],
  ['  "brands": [{ "id": 179, "name": ', '"Eucerin" }]'],
  ['}'],
];

function JsonCard() {
  return (
    <div className="mc-code-card" aria-hidden="true">
      <div className="mc-code-card-bar"><span className="mc-pill" data-tone="brand">GET</span><span>/v4/products/query</span></div>
      <pre>
        {JSON_LINES.map(([key, value], i) => (
          <span key={i}>{key.replace(/"[^"]+"/, (k) => `\u0000${k}\u0000`).split('\u0000').map((part, j) => (j === 1 ? <b key={j}>{part}</b> : part))}{value && <i>{value}</i>}{'\n'}</span>
        ))}
      </pre>
    </div>
  );
}

/** The fixed Medipim composition: packshot left, three sheet fields right, the closing line below. */
function Composition({ format }: { format: 'square' | 'wide' | 'tall' }) {
  const b = t.brand;
  return (
    <Ground className="mc-composition">
      <div className="mc-composition-body" data-format={format}>
        <div className="mc-composition-pack"><img src={PRODUCT.image} alt="" /></div>
        <dl className="mc-composition-fields">
          <div><dt>{b.fields.brand}</dt><dd>{PRODUCT.brand}</dd></div>
          <div><dt>{b.fields.id}</dt><dd>{PRODUCT.id}</dd></div>
          <div><dt>CNK</dt><dd>{PRODUCT.cnk}</dd></div>
          <div><dt>{b.fields.content}</dt><dd>{PRODUCT.content}</dd></div>
          <div data-wide><dt>EAN-13</dt><dd>{PRODUCT.ean}</dd></div>
          <div><dt>{b.fields.weight}</dt><dd>{PRODUCT.weight}</dd></div>
          <div><dt>{b.fields.language}</dt><dd>{PRODUCT.languages.join(' · ')}</dd></div>
          <div data-wide><dt>{b.fields.storage}</dt><dd>{b.storage}</dd></div>
          <div data-wide><dt>{b.fields.category}</dt><dd>{b.categories.join(' › ')}</dd></div>
        </dl>
      </div>
      <footer className="mc-composition-foot">
        <span>{lang === 'en' ? b.taglineIntl : b.tagline}</span>
        <div className="mc-logo-label"><MedipimLogo height={format === 'wide' ? 'max(14px, 3.2cqi)' : 'max(14px, 4.8cqi)'} /></div>
      </footer>
    </Ground>
  );
}

function Window({ address, children }: { address: string; children: ReactNode }) {
  return (
    <div className="mc-window" aria-hidden="true">
      <div className="mc-window-bar"><i /><i /><i /><span>{address}</span></div>
      {children}
    </div>
  );
}

function WholesalerCatalogue() {
  const c = t.brand.wholesalerCols;
  return (
    <Window address="catalogus.groothandel.be">
      <table className="mc-catalogue">
        <thead><tr><th>{c.product}</th><th>{c.code}</th><th>{c.stock}</th></tr></thead>
        <tbody>
          <tr data-ghost><td><span className="mc-ghost-thumb" /><span className="mc-ghost-line" /></td><td><span className="mc-ghost-line" data-short /></td><td /></tr>
          <tr>
            <td><img src={PRODUCT.image} alt="" /><span>{PRODUCT.name}</span></td>
            <td className="mc-mono">{PRODUCT.cnk}</td>
            <td><span className="mc-pill" data-tone="success"><span className="mc-pill-dot" />{t.brand.inStock}</span></td>
          </tr>
          <tr data-ghost><td><span className="mc-ghost-thumb" /><span className="mc-ghost-line" /></td><td><span className="mc-ghost-line" data-short /></td><td /></tr>
        </tbody>
      </table>
    </Window>
  );
}

function PharmacyScreen() {
  const b = t.brand;
  return (
    <div className="mc-screen" aria-hidden="true">
      <div className="mc-screen-display">
        <img src={PRODUCT.image} alt="" />
        <div>
          <p className="mc-sheet-brand">{PRODUCT.brand}</p>
          <p className="mc-sheet-name">{PRODUCT.name}</p>
          <dl>
            <div><dt>{b.fields.content}</dt><dd>{PRODUCT.content}</dd></div>
            <div><dt>{b.fields.weight}</dt><dd>{PRODUCT.weight}</dd></div>
            <div><dt>{b.fields.storage}</dt><dd>{b.storage}</dd></div>
          </dl>
        </div>
      </div>
      <span className="mc-screen-stand" />
    </div>
  );
}

function WebshopTile() {
  const b = t.brand;
  return (
    <Window address="webshop.be">
      <div className="mc-tile">
        <div className="mc-tile-media"><img src={PRODUCT.image} alt="" /></div>
        <p className="mc-sheet-brand">{PRODUCT.brand}</p>
        <p className="mc-sheet-name">{PRODUCT.name}</p>
        <div className="mc-sheet-pills"><Pills items={b.categories} /></div>
        <span className="mc-tile-button">{b.addToCart}</span>
      </div>
    </Window>
  );
}

function Carousel() {
  const b = t.brand;
  const facts = [`EAN ${PRODUCT.ean}`, `${b.fields.storage} · ${b.storage}`, b.categories.join(' › ')];
  return (
    <div className="mc-carousel">
      <p className="mc-carousel-title">{b.carouselTitle}</p>
      <div className="mc-carousel-slides">
        {b.slides.map((s, i) => (
          <Ground key={s.title} className="mc-carousel-slide">
            <div className="mc-logo-label mc-carousel-logo"><MedipimLogo height={12} /></div>
            <span className="mc-carousel-count">{i + 1}/{b.slides.length}</span>
            <div className="mc-carousel-card">
              <span className="mc-brand-moment-icon"><Icon name={SLIDE_ICONS[i]} size={18} /></span>
              <p className="mc-carousel-card-title">{s.title}</p>
              <img src={PRODUCT.image} alt="" />
              <span className="mc-pill" data-tone="brand">{facts[i]}</span>
              <p className="mc-carousel-card-text">{s.text}</p>
            </div>
          </Ground>
        ))}
      </div>
    </div>
  );
}

const reducedMotion = () => typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

/** Tasks move from the manufacturer to Medipim one by one, then start over. */
function TaskBoard() {
  const board = t.brand.board;
  const count = board.tasks.length;
  const [step, setStep] = useState(() => (reducedMotion() ? 3 : 0));
  useEffect(() => {
    if (reducedMotion()) return;
    const timer = window.setInterval(() => setStep((s) => (s + 1) % (count + 2)), 1400);
    return () => window.clearInterval(timer);
  }, [count]);
  const toMedipim = Math.min(step, count);
  return (
    <div className="mc-board" aria-hidden="true">
      <div className="mc-board-head">
        <img src={PRODUCT.image} alt="" />
        <div><b>{PRODUCT.name}</b><span>CNK {PRODUCT.cnk}</span></div>
      </div>
      <p className="mc-board-kicker">{board.sheet}</p>
      <ul className="mc-board-tasks">
        {board.tasks.map((task, i) => {
          const mp = i < toMedipim;
          return (
            <li key={task} data-mp={mp || undefined}>
              <span className="mc-board-check"><Icon name="check" size={12} /></span>
              <span>{task}</span>
              <span className="mc-board-who">{mp && <MedipimMark />}{mp ? board.medipim : board.you}</span>
            </li>
          );
        })}
      </ul>
      <div className="mc-board-split">
        <span className="mc-board-bar"><i style={{ width: `${((count - toMedipim) / count) * 100}%` }} /></span>
        <span className="mc-board-legend"><span>{board.you}</span><span>{board.medipim}</span></span>
      </div>
    </div>
  );
}
