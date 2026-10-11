/**
 * Minimal GPX track parser (PRD §7.3). Runs on-device; no XML dependency.
 * Reads <trkpt> (falls back to <rtept>) with optional <ele> and <time>.
 */

export type TrackPoint = {
  lat: number;
  lon: number;
  ele?: number;
  time?: number; // epoch ms
};

export class GpxParseError extends Error {}

const POINT_RE = /<(trkpt|rtept)\b([^>]*?)(\/>|>([\s\S]*?)<\/\1>)/g;
const ATTR_RE = (name: string) => new RegExp(`\\b${name}\\s*=\\s*["']([^"']+)["']`);
const ELE_RE = /<ele>\s*([^<]+?)\s*<\/ele>/;
const TIME_RE = /<time>\s*([^<]+?)\s*<\/time>/;

export function parseGpx(xml: string): TrackPoint[] {
  if (!/<gpx[\s>]/i.test(xml)) throw new GpxParseError('This file is not a GPX file.');

  const points: TrackPoint[] = [];
  for (const match of xml.matchAll(POINT_RE)) {
    const attrs = match[2];
    const body = match[4] ?? '';
    const lat = Number(attrs.match(ATTR_RE('lat'))?.[1]);
    const lon = Number(attrs.match(ATTR_RE('lon'))?.[1]);
    if (!Number.isFinite(lat) || !Number.isFinite(lon)) continue;

    const point: TrackPoint = { lat, lon };
    const ele = Number(body.match(ELE_RE)?.[1]);
    if (Number.isFinite(ele)) point.ele = ele;
    const time = Date.parse(body.match(TIME_RE)?.[1] ?? '');
    if (Number.isFinite(time)) point.time = time;
    points.push(point);
  }

  if (points.length < 2) throw new GpxParseError('No route found in this GPX file.');
  return points;
}
