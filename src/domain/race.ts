/** Race stat helpers (PRD §7.3: chip time is the default, pace is derived). */

/** Parses "h:mm:ss" or "mm:ss" into seconds. Returns undefined if malformed. */
export function parseDuration(text: string): number | undefined {
  const parts = text.trim().split(':');
  if (parts.length < 2 || parts.length > 3) return undefined;
  if (!parts.every((p) => /^\d{1,2}$/.test(p))) return undefined;
  const nums = parts.map(Number);
  const [h, m, s] = nums.length === 3 ? nums : [0, nums[0], nums[1]];
  if (m > 59 || s > 59) return undefined;
  return h * 3600 + m * 60 + s;
}

export function formatDuration(totalSeconds: number): string {
  const s = Math.round(totalSeconds);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  const pad = (n: number) => n.toString().padStart(2, '0');
  return `${pad(h)}:${pad(m)}:${pad(sec)}`;
}

/** Pace as "m:ss /km". */
export function formatPace(totalSeconds: number, distanceKm: number): string {
  if (distanceKm <= 0) return '–';
  const perKm = Math.round(totalSeconds / distanceKm);
  const m = Math.floor(perKm / 60);
  const s = perKm % 60;
  return `${m}:${s.toString().padStart(2, '0')}/km`;
}

const MONTHS = [
  'january',
  'february',
  'march',
  'april',
  'may',
  'june',
  'july',
  'august',
  'september',
  'october',
  'november',
  'december',
];

export type RaceDate = { day: number; month: number; year: number };

/**
 * Reads the date the way people type it: "5 October 2026", "Oct 5, 2026",
 * "05/10/2026" (day first, as in Malaysia), "26.04.26", "2026-10-05".
 * Returns null if it can't tell; designs then show the text as typed.
 */
export function parseRaceDate(text: string): RaceDate | null {
  const t = text.trim().toLowerCase().replace(/,/g, ' ');
  const valid = (day: number, month: number, year: number): RaceDate | null => {
    const y = year < 100 ? 2000 + year : year;
    if (month < 1 || month > 12 || day < 1 || day > 31 || y < 1900 || y > 2100) return null;
    return { day, month, year: y };
  };

  let m = t.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
  if (m) return valid(+m[3], +m[2], +m[1]);
  m = t.match(/^(\d{1,2})[/.-](\d{1,2})[/.-](\d{2}|\d{4})$/);
  if (m) return valid(+m[1], +m[2], +m[3]);

  // Day and month name in either order, then the year.
  const monthIndex = (word: string) => MONTHS.findIndex((name) => word.length >= 3 && name.startsWith(word));
  m = t.match(/^(\d{1,2})(?:st|nd|rd|th)?\s+([a-z]+)\.?\s+(\d{4})$/);
  if (m && monthIndex(m[2]) >= 0) return valid(+m[1], monthIndex(m[2]) + 1, +m[3]);
  m = t.match(/^([a-z]+)\.?\s+(\d{1,2})(?:st|nd|rd|th)?\s+(\d{4})$/);
  if (m && monthIndex(m[1]) >= 0) return valid(+m[2], monthIndex(m[1]) + 1, +m[3]);
  return null;
}

export function monthName(month: number): string {
  const name = MONTHS[month - 1] ?? '';
  return name.charAt(0).toUpperCase() + name.slice(1);
}

/** "13 April 2025" */
export function formatDateLong(d: RaceDate): string {
  return `${d.day} ${monthName(d.month)} ${d.year}`;
}

/** "26.04.26" */
export function formatDateDots(d: RaceDate): string {
  const pad = (n: number) => n.toString().padStart(2, '0');
  return `${pad(d.day)}.${pad(d.month)}.${pad(d.year % 100)}`;
}

/** Distance as the samples show it: "42.2km", trimming needless zeros. */
export function formatKm(km: number, decimals = 1): string {
  return `${Number(km.toFixed(decimals))}km`;
}
