/**
 * The design document (PRD §8.2): one JSON object rendered identically by the
 * device preview, the server print render and the 3D model generator.
 */

import type {
  BackgroundKind,
  FilamentColour,
  Format,
  FrameColour,
  PaperSize,
  RunnerCount,
} from './catalog';
import type { XY } from './route/geometry';

export const SCHEMA_VERSION = 3;

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
  background: { type: BackgroundKind; styleId?: string; photoUri?: string };
  runners: Runner[];
  route: {
    points: XY[] | null; // normalised 0..1
    transform: RouteTransform;
    stroke: { width: number; color: string };
    markers: boolean;
  };
  text: { title: string; subtitle: string };
  export: { watermark: boolean };
};

export const DEFAULT_ROUTE_TRANSFORM: RouteTransform = { x: 0.5, y: 0.42, scale: 0.75, rotation: 0 };

export function createDesignDocument(designId: string, runnerCount: RunnerCount): DesignDocument {
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
    background: { type: 'map', styleId: 'graphite' },
    runners: Array.from({ length: runnerCount }, () => ({ name: '' })),
    route: {
      points: null,
      transform: { ...DEFAULT_ROUTE_TRANSFORM },
      stroke: { width: 2.5, color: '#F5A623' },
      markers: true,
    },
    text: { title: '', subtitle: '' },
    export: { watermark: true },
  };
}
