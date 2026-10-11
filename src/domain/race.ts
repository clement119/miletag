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
