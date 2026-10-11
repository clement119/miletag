/**
 * The design document (PRD §8.2): one JSON object rendered identically by the
 * device preview, the server print render and the 3D model generator.
 */

import type { FilamentColour, Format, FrameColour, PaperSize, RunnerCount } from './catalog';
import { getLook } from './design-looks';
import { DEFAULT_LAYER_TOGGLES, type MapLayerToggles, type MapStyleId } from './map-styles';
import { DEFAULT_PHOTO_CROP } from './photo';
import type { PhotoAsset, PhotoCrop } from './photo';
import type { LngLat, XY } from './route/geometry';

export const SCHEMA_VERSION = 7;

export type Runner = {
  name: string;
  bib?: string;
  /** Chip time in seconds. */
  timeSeconds?: number;
  distanceKm?: number;
};

/** Position of the route on the canvas, in canvas-relative units (0..1). */
export type RouteTransform = {
  x: number;
  y: number;
  scale: number;
  rotation: number; // radians
};

/** Saved map view. Null until the user has framed the map (we auto-fit to the route). */
export type MapCamera = { center: LngLat; zoom: number; bearing: number };

export type Background =
  | { type: 'map'; styleId: MapStyleId; camera: MapCamera | null; layers: MapLayerToggles }
  | {
      type: 'photo';
      photo: PhotoAsset | null;
      crop: PhotoCrop;
      /** Dark wash over the photo, 0..1. */
      scrim: number;
      /** Black-and-white. */
      mono: boolean;
      /** The user accepted a low-resolution print at this DPI (or better). */
      lowResAckDpi: number | null;
    };

export type DesignDocument = {
  schemaVersion: typeof SCHEMA_VERSION;
  designId: string;
  runnerCount: RunnerCount;
  crew: { shareId: string | null; highlightRunner: number };
  order: {
    format: Format;
    size: PaperSize;
    frame: FrameColour;
    route3d: { enabled: boolean; color: FilamentColour; printedLineBelow: boolean };
    medal: { enabled: boolean; diameterMm?: number; ribbon: 'visible' | 'folded' | 'removed' };
  };
  background: Background;
  /** The background not in use, kept so switching Photo ↔ Map never loses the user's photo or map view. */
  backgroundStash: { photo?: Extract<Background, { type: 'photo' }>; map?: Extract<Background, { type: 'map' }> };
  /** Text colour, one of the design's recommended inks (design-looks.ts). */
  ink: string;
  runners: Runner[];
  route: {
    points: XY[] | null; // normalised 0..1, used in photo mode
    geo: LngLat[] | null; // geographic, used in map mode (route is locked to the map)
    transform: RouteTransform;
    stroke: { width: number; color: string };
    markers: boolean;
  };
  text: {
    title: string;
    /** Free text as typed ("5 October 2026", "05/10/2026"); each design formats it. */
    date: string;
    city: string;
    country: string;
  };
  export: { watermark: boolean };
};

export const DEFAULT_ROUTE_TRANSFORM: RouteTransform = { x: 0.5, y: 0.42, scale: 0.75, rotation: 0 };

/**
 * Switches the background type, keeping the one being left in the stash and
 * restoring the stashed one if there is one (so a photo is never lost).
 */
export function switchBackground(doc: DesignDocument, type: Background['type']): DesignDocument {
  if (doc.background.type === type) return doc;
  const current = doc.background;
  const stash = { ...doc.backgroundStash, [current.type]: current };
  const restored = type === 'photo' ? doc.backgroundStash.photo : doc.backgroundStash.map;
  return { ...doc, background: restored ?? defaultBackground(doc.designId, type), backgroundStash: stash };
}

/** A fresh background of the given type, styled for the design. */
export function defaultBackground(designId: string, type: Background['type']): Background {
  const look = getLook(designId);
  return type === 'map'
    ? { type: 'map', styleId: 'graphite', camera: null, layers: { ...DEFAULT_LAYER_TOGGLES } }
    : {
        type: 'photo',
        photo: null,
        crop: { ...DEFAULT_PHOTO_CROP },
        scrim: look.scrim,
        mono: look.mono,
        lowResAckDpi: null,
      };
}

export function createDesignDocument(designId: string, runnerCount: RunnerCount): DesignDocument {
  const look = getLook(designId);
  return {
    schemaVersion: SCHEMA_VERSION,
    designId,
    runnerCount,
    crew: { shareId: null, highlightRunner: 0 },
    order: {
      format: 'framed',
      size: 'A3',
      frame: 'black',
      route3d: { enabled: false, color: 'orange', printedLineBelow: true },
      medal: { enabled: false, ribbon: 'visible' },
    },
    background: defaultBackground(designId, look.background),
    backgroundStash: {},
    ink: look.inks[0].hex,
    runners: Array.from({ length: runnerCount }, () => ({ name: '' })),
    route: {
      points: null,
      geo: null,
      transform: { ...look.route },
      stroke: { width: 2.5, color: look.routeColor },
      markers: true,
    },
    text: { title: '', date: '', city: '', country: '' },
    export: { watermark: true },
  };
}
