/**
 * Route geometry pipeline (PRD §7.3): privacy trim → simplify → project → normalise.
 */

import type { TrackPoint } from './gpx';

export type XY = { x: number; y: number };

const EARTH_RADIUS_M = 6_371_008.8;
const toRad = (deg: number) => (deg * Math.PI) / 180;

export function haversineMeters(a: TrackPoint, b: TrackPoint): number {
  const dLat = toRad(b.lat - a.lat);
  const dLon = toRad(b.lon - a.lon);
  const h =
    Math.sin(dLat / 2) ** 2 + Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLon / 2) ** 2;
  return 2 * EARTH_RADIUS_M * Math.asin(Math.min(1, Math.sqrt(h)));
}

export function totalDistanceMeters(points: readonly TrackPoint[]): number {
  let d = 0;
  for (let i = 1; i < points.length; i++) d += haversineMeters(points[i - 1], points[i]);
  return d;
}

/** Elapsed time from first to last timestamped point, in seconds. */
export function elapsedSeconds(points: readonly TrackPoint[]): number | undefined {
  const first = points.find((p) => p.time !== undefined)?.time;
  const last = points.findLast((p) => p.time !== undefined)?.time;
  if (first === undefined || last === undefined || last <= first) return undefined;
  return Math.round((last - first) / 1000);
}

/**
 * Drops the first and last `meters` of the track so a run that starts at home
 * doesn't reveal the address. Returns the input unchanged if trimming would
 * leave fewer than 2 points.
 */
export function trimPrivacyZone(points: readonly TrackPoint[], meters: number): TrackPoint[] {
  if (meters <= 0) return [...points];
  let start = 0;
  for (let d = 0; start < points.length - 1 && d < meters; start++) {
    d += haversineMeters(points[start], points[start + 1]);
  }
  let end = points.length - 1;
  for (let d = 0; end > start && d < meters; end--) {
    d += haversineMeters(points[end], points[end - 1]);
  }
  const trimmed = points.slice(start, end + 1);
  return trimmed.length >= 2 ? trimmed : [...points];
}

/** Web Mercator, in unitless world coordinates (y grows downward like screen space). */
export function project(points: readonly TrackPoint[]): XY[] {
  return points.map(({ lat, lon }) => {
    const x = (lon + 180) / 360;
    const s = Math.sin(toRad(Math.max(-85.0511, Math.min(85.0511, lat))));
    const y = 0.5 - Math.log((1 + s) / (1 - s)) / (4 * Math.PI);
    return { x, y };
  });
}

function perpendicularDistance(p: XY, a: XY, b: XY): number {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const len2 = dx * dx + dy * dy;
  if (len2 === 0) return Math.hypot(p.x - a.x, p.y - a.y);
  const t = Math.max(0, Math.min(1, ((p.x - a.x) * dx + (p.y - a.y) * dy) / len2));
  return Math.hypot(p.x - (a.x + t * dx), p.y - (a.y + t * dy));
}

/**
 * Ramer–Douglas–Peucker, iterative to avoid deep recursion on long tracks.
 * Returns the indices of the points to keep, so callers can apply the same
 * selection to the geographic coordinates.
 */
export function simplifyIndices(points: readonly XY[], tolerance: number): number[] {
  if (points.length <= 2) return points.map((_, i) => i);
  const keep = new Uint8Array(points.length);
  keep[0] = keep[points.length - 1] = 1;
  const stack: [number, number][] = [[0, points.length - 1]];
  while (stack.length) {
    const [first, last] = stack.pop()!;
    let maxDist = 0;
    let index = -1;
    for (let i = first + 1; i < last; i++) {
      const d = perpendicularDistance(points[i], points[first], points[last]);
      if (d > maxDist) {
        maxDist = d;
        index = i;
      }
    }
    if (index !== -1 && maxDist > tolerance) {
      keep[index] = 1;
      stack.push([first, index], [index, last]);
    }
  }
  const out: number[] = [];
  keep.forEach((k, i) => k && out.push(i));
  return out;
}

export function simplify(points: readonly XY[], tolerance: number): XY[] {
  return simplifyIndices(points, tolerance).map((i) => points[i]);
}

/**
 * Fits points into a unit box (0..1 on the longer axis), centred, preserving
 * aspect ratio. The design document stores routes in this space.
 */
export function normalise(points: readonly XY[]): { points: XY[]; aspect: number } {
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (const p of points) {
    minX = Math.min(minX, p.x);
    minY = Math.min(minY, p.y);
    maxX = Math.max(maxX, p.x);
    maxY = Math.max(maxY, p.y);
  }
  const w = maxX - minX;
  const h = maxY - minY;
  const span = Math.max(w, h) || 1;
  const offX = (span - w) / 2;
  const offY = (span - h) / 2;
  return {
    points: points.map((p) => ({ x: (p.x - minX + offX) / span, y: (p.y - minY + offY) / span })),
    aspect: h === 0 ? 1 : w / h,
  };
}

export type LngLat = [longitude: number, latitude: number];

export type ProcessedRoute = {
  points: XY[]; // normalised 0..1
  geo: LngLat[]; // same points, geographic, for map backgrounds
  distanceKm: number;
  elapsedSeconds?: number;
};

export function processTrack(
  raw: readonly TrackPoint[],
  { privacyMeters = 200, maxPoints = 2000 }: { privacyMeters?: number; maxPoints?: number } = {},
): ProcessedRoute {
  const trimmed = trimPrivacyZone(raw, privacyMeters);
  const projected = normalise(project(trimmed)).points;
  // Tighten tolerance until we're under the point budget.
  let tolerance = 0.0005;
  let kept = simplifyIndices(projected, tolerance);
  while (kept.length > maxPoints) {
    tolerance *= 2;
    kept = simplifyIndices(projected, tolerance);
  }
  return {
    points: kept.map((i) => projected[i]),
    geo: kept.map((i) => [trimmed[i].lon, trimmed[i].lat] as LngLat),
    // Stats use the untrimmed track: the trim is a display privacy measure.
    distanceKm: totalDistanceMeters(raw) / 1000,
    elapsedSeconds: elapsedSeconds(raw),
  };
}

export type GeoBounds = [southWest: LngLat, northEast: LngLat];

export function geoBounds(geo: readonly LngLat[]): GeoBounds {
  let minLon = Infinity, minLat = Infinity, maxLon = -Infinity, maxLat = -Infinity;
  for (const [lon, lat] of geo) {
    minLon = Math.min(minLon, lon);
    minLat = Math.min(minLat, lat);
    maxLon = Math.max(maxLon, lon);
    maxLat = Math.max(maxLat, lat);
  }
  return [
    [minLon, minLat],
    [maxLon, maxLat],
  ];
}
