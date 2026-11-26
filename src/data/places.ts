/** [longitude, latitude] */
export type LngLat = [number, number];

/** Cities in the event calendar, by Dutch and English name. */
const CITIES: [names: string[], at: LngLat][] = [
  [['montréal', 'montreal'], [-73.57, 45.5]],
  [['schladming'], [13.69, 47.39]],
  [['parijs', 'paris'], [2.35, 48.86]],
  [['dubai'], [55.27, 25.2]],
  [['abu dhabi'], [54.37, 24.45]],
  [['athene', 'athens'], [23.73, 37.98]],
  [['brussel', 'brussels', 'bruxelles'], [4.35, 50.85]],
  [['singapore'], [103.82, 1.35]],
  [['mexico-stad', 'mexico city'], [-99.13, 19.43]],
  [['warschau', 'warsaw'], [21.01, 52.23]],
  [['palm desert'], [-116.37, 33.72]],
  [['gold coast'], [153.4, -28.02]],
  [['bilbao'], [-2.93, 43.26]],
  [['basel', 'bazel'], [7.59, 47.56]],
  [['barcelona'], [2.17, 41.39]],
  [['wenen', 'vienna'], [16.37, 48.21]],
  [['charlotte'], [-80.84, 35.23]],
  [['zürich', 'zurich'], [8.54, 47.37]],
  [['londen', 'london'], [-0.13, 51.51]],
  [['münchen', 'munich'], [11.58, 48.14]],
  [['utrecht'], [5.12, 52.09]],
  [['amsterdam'], [4.9, 52.37]],
  [['berlijn', 'berlin'], [13.4, 52.52]],
  [['bologna'], [11.34, 44.49]],
  [['palm beach'], [-80.04, 26.71]],
  [['penang'], [100.33, 5.41]],
  [['toronto'], [-79.38, 43.65]],
  [['riyad', 'riyadh'], [46.68, 24.71]],
  [['québec city', 'quebec city', 'québec'], [-71.21, 46.81]],
  [['sofia'], [23.32, 42.7]],
  [['são paulo', 'sao paulo'], [-46.63, -23.55]],
  [['orlando'], [-81.38, 28.54]],
  [['denver'], [-104.99, 39.74]],
  [['san antonio'], [-98.49, 29.42]],
  [['shanghai'], [121.47, 31.23]],
  [['banff'], [-115.57, 51.18]],
  [['kuala lumpur'], [101.69, 3.14]],
  [['tokio', 'tokyo'], [139.69, 35.68]],
  [['san diego'], [-117.16, 32.72]],
  [['park city'], [-111.5, 40.65]],
  [['angus glen'], [-79.32, 43.9]],
  [['bangkok'], [100.5, 13.76]],
  [['düsseldorf', 'dusseldorf'], [6.77, 51.23]],
  [['birmingham'], [-1.89, 52.49]],
  [['antwerpen', 'antwerp'], [4.4, 51.22]],
  [["st julian's", 'saint julian’s'], [14.49, 35.92]],
  [["ta' qali"], [14.42, 35.89]],
  [['sydney'], [151.21, -33.87]],
  [['washington'], [-77.04, 38.91]],
  [['frankfurt'], [8.68, 50.11]],
  [['madrid'], [-3.7, 40.42]],
  [['milaan', 'milan'], [9.19, 45.46]],
  [['lissabon', 'lisbon'], [-9.14, 38.72]],
  [['kopenhagen', 'copenhagen'], [12.57, 55.68]],
  [['new york'], [-74.01, 40.71]],
];

const BY_NAME = new Map(CITIES.flatMap(([names, at]) => names.map((n) => [n, at] as const)));
const normalise = (s: string) => s.trim().toLocaleLowerCase('nl').replace(/’/g, "'");

/** Where a `City, Country` location lies, when the city is known. */
export function cityCoordinates(location?: string): LngLat | undefined {
  if (!location) return undefined;
  return BY_NAME.get(normalise(location.split(',')[0]));
}
