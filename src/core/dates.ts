// Calendar helpers on local YYYY-MM-DD strings (no time zones involved).

function parse(iso: string): Date {
  const [y, m, d] = iso.slice(0, 10).split('-').map(Number);
  return new Date(y, m - 1, d);
}

function format(d: Date): string {
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

export function addDays(iso: string, n: number): string {
  const d = parse(iso);
  d.setDate(d.getDate() + n);
  return format(d);
}

/** 0 = Sunday … 6 = Saturday. */
export function weekdayOf(iso: string): number {
  return parse(iso).getDay();
}

export function isWeekend(iso: string): boolean {
  const w = weekdayOf(iso);
  return w === 0 || w === 6;
}

export type PrepDay = 'saturday' | 'sunday';
export const PREP_WEEKDAY: Record<PrepDay, number> = { saturday: 6, sunday: 0 };

/** The given weekday on or after `iso`. */
export function nextWeekdayOnOrAfter(iso: string, weekday: number): string {
  const diff = (weekday - weekdayOf(iso) + 7) % 7;
  return addDays(iso, diff);
}

export function dayName(iso: string, style: 'long' | 'short' = 'short'): string {
  return parse(iso).toLocaleDateString('en-GB', { weekday: style });
}

export function dayLabel(iso: string): string {
  return parse(iso).toLocaleDateString('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'short',
  });
}
