import { addDays, differenceInCalendarDays, format, parseISO } from 'date-fns';
import { dateLocale, t } from '../i18n';
import type { IsoDate } from './types';

export const toIso = (d: Date): IsoDate => format(d, 'yyyy-MM-dd');
export const fromIso = (iso: IsoDate): Date => parseISO(iso);
export const todayIso = (): IsoDate => toIso(new Date());
export const shiftIso = (iso: IsoDate, days: number): IsoDate => toIso(addDays(fromIso(iso), days));
/** Saturday and Sunday move to the Friday before, so the work is done before the weekend. */
export const beforeWeekend = (iso: IsoDate): IsoDate => ({ 6: shiftIso(iso, -1), 0: shiftIso(iso, -2) } as Record<number, IsoDate>)[fromIso(iso).getDay()] ?? iso;
/** Belgian public holidays in the planning period; no to-do falls on one. */
export const HOLIDAYS: IsoDate[] = [
  '2026-12-25', '2027-01-01', '2027-03-29', '2027-05-01', '2027-05-06', '2027-05-17',
  '2027-07-21', '2027-08-15', '2027-11-01', '2027-11-11', '2027-12-25',
];
const isWorkday = (iso: IsoDate) => ![0, 6].includes(fromIso(iso).getDay()) && !HOLIDAYS.includes(iso);
/** The day itself when it is a working day, otherwise the working day before it. */
export const workdayBefore = (iso: IsoDate): IsoDate => (isWorkday(iso) ? iso : workdayBefore(shiftIso(iso, -1)));
/** The day itself when it is a working day, otherwise the working day after it. */
export const workdayAfter = (iso: IsoDate): IsoDate => (isWorkday(iso) ? iso : workdayAfter(shiftIso(iso, 1)));
export const daysBetween = (from: IsoDate, to: IsoDate): number =>
  differenceInCalendarDays(fromIso(to), fromIso(from));

export const fmt = (iso: IsoDate, pattern: string): string => format(fromIso(iso), pattern, { locale: dateLocale() });
export const fmtDate = (d: Date, pattern: string): string => format(d, pattern, { locale: dateLocale() });

/** "today", "tomorrow", "in 3 days", "2 days ago", in the current language. */
export function relativeDay(iso: IsoDate, today: IsoDate = todayIso()): string {
  const n = daysBetween(today, iso);
  if (n === 0) return t.dates.today;
  if (n === 1) return t.dates.tomorrow;
  if (n === -1) return t.dates.yesterday;
  if (n > 1) return n < 14 ? t.dates.inDays(n) : t.dates.inWeeks(Math.round(n / 7));
  return t.dates.daysAgo(-n);
}

/** Short weekday names, Monday first. */
export const weekdayNames = (pattern: 'EEEEEE' | 'EEEEE') =>
  Array.from({ length: 7 }, (_, k) => fmtDate(new Date(2024, 0, 1 + k), pattern));
