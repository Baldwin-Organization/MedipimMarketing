import { addDays, differenceInCalendarDays, format, parseISO } from 'date-fns';
import { nl } from 'date-fns/locale';
import type { IsoDate } from './types';

export const toIso = (d: Date): IsoDate => format(d, 'yyyy-MM-dd');
export const fromIso = (iso: IsoDate): Date => parseISO(iso);
export const todayIso = (): IsoDate => toIso(new Date());
export const shiftIso = (iso: IsoDate, days: number): IsoDate => toIso(addDays(fromIso(iso), days));
export const daysBetween = (from: IsoDate, to: IsoDate): number =>
  differenceInCalendarDays(fromIso(to), fromIso(from));

export const fmt = (iso: IsoDate, pattern: string): string => format(fromIso(iso), pattern, { locale: nl });
export const fmtDate = (d: Date, pattern: string): string => format(d, pattern, { locale: nl });

/** "vandaag", "morgen", "over 3 dagen", "2 dagen geleden". */
export function relativeDay(iso: IsoDate, today: IsoDate = todayIso()): string {
  const n = daysBetween(today, iso);
  if (n === 0) return 'vandaag';
  if (n === 1) return 'morgen';
  if (n === -1) return 'gisteren';
  if (n > 1) return n < 14 ? `over ${n} dagen` : `over ${Math.round(n / 7)} weken`;
  return `${-n} dagen geleden`;
}
