/**
 * The 5 curated map backgrounds (PRD §7.5), built as MapLibre style documents
 * over OpenMapTiles-schema vector tiles. The same style JSON drives the
 * on-device map and, later, the server print render.
 */

import type {
  ExpressionSpecification,
  LayerSpecification,
  StyleSpecification,
} from '@maplibre/maplibre-gl-style-spec';

export type MapStyleId = 'graphite' | 'paper' | 'blueprint' | 'noir' | 'terrain';

export type MapLayerToggles = {
  water: boolean;
  parks: boolean;
  roads: boolean;
};

export const DEFAULT_LAYER_TOGGLES: MapLayerToggles = { water: true, parks: true, roads: true };

type Palette = {
  background: string;
  water: string;
  park: string;
  roadMajor: string;
  roadMinor: string;
  roadOpacity: number;
  building?: string;
  hillshade?: boolean;
};

export type MapStyleMeta = {
  id: MapStyleId;
  name: string;
  tagline: string;
  palette: Palette;
  /** Default route colour on this background. */
  routeColor: string;
  /** Poster text colour that reads on this background. */
  inkColor: string;
};

export const MAP_STYLES: readonly MapStyleMeta[] = [
  {
    id: 'graphite',
    name: 'Graphite',
    tagline: 'Dark grey streets, bright route',
    palette: {
      background: '#3B3B3E',
      water: '#2A2A2C',
      park: '#424245',
      roadMajor: '#9A9AA0',
      roadMinor: '#5E5E63',
      roadOpacity: 1,
    },
    routeColor: '#F5A623',
    inkColor: '#111111',
  },
  {
    id: 'paper',
    name: 'Paper',
    tagline: 'Off-white, fine black lines',
    palette: {
      background: '#F4F1EA',
      water: '#DAD6CC',
      park: '#E9E6DD',
      roadMajor: '#1C1C1C',
      roadMinor: '#9C988F',
      roadOpacity: 1,
      building: '#ECE8DF',
    },
    routeColor: '#E4572E',
    inkColor: '#111111',
  },
  {
    id: 'blueprint',
    name: 'Blueprint',
    tagline: 'Navy with cyan linework',
    palette: {
      background: '#0F2742',
      water: '#0A1E35',
      park: '#12304F',
      roadMajor: '#8ED8FF',
      roadMinor: '#3D7DAF',
      roadOpacity: 1,
    },
    routeColor: '#FFFFFF',
    inkColor: '#0F2742',
  },
  {
    id: 'noir',
    name: 'Noir',
    tagline: 'Black, faint white streets',
    palette: {
      background: '#000000',
      water: '#0B0B0B',
      park: '#060606',
      roadMajor: '#FFFFFF',
      roadMinor: '#FFFFFF',
      roadOpacity: 0.45,
    },
    routeColor: '#E4FF1A',
    inkColor: '#000000',
  },
  {
    id: 'terrain',
    name: 'Terrain',
    tagline: 'Muted hillshade for trail runs',
    palette: {
      background: '#E8E3D6',
      water: '#B7C8CE',
      park: '#D5DBC4',
      roadMajor: '#7E776A',
      roadMinor: '#ADA697',
      roadOpacity: 1,
      hillshade: true,
    },
    routeColor: '#C2410C',
    inkColor: '#2B2620',
  },
];

export function getMapStyle(id: string | undefined): MapStyleMeta {
  return MAP_STYLES.find((s) => s.id === id) ?? MAP_STYLES[0];
}

/**
 * Vector tiles in the OpenMapTiles schema. Defaults to the free OpenFreeMap
 * planet tiles for development; production should point at our own
 * self-hosted tiles via EXPO_PUBLIC_MAP_TILES_URL (PRD §8.4).
 */
export const VECTOR_TILES_URL =
  process.env.EXPO_PUBLIC_MAP_TILES_URL ?? 'https://tiles.openfreemap.org/planet';

/** Terrarium-encoded elevation tiles (AWS Open Data), used for Terrain hillshade. */
const TERRAIN_TILES = 'https://s3.amazonaws.com/elevation-tiles-prod/terrarium/{z}/{x}/{y}.png';

export const MAP_ATTRIBUTION = '© OpenStreetMap contributors · © OpenMapTiles';

const visibility = (on: boolean) => (on ? 'visible' : 'none') as 'visible' | 'none';

/** Line width that scales with zoom: `base` px at z12, doubling every zoom level up to z18. */
const width = (base: number): ExpressionSpecification => [
  'interpolate',
  ['exponential', 1.6],
  ['zoom'],
  8,
  base * 0.15,
  12,
  base,
  18,
  base * 12,
];

const MAJOR: ExpressionSpecification = ['match', ['get', 'class'], ['motorway', 'trunk', 'primary'], true, false];
const MID: ExpressionSpecification = ['match', ['get', 'class'], ['secondary', 'tertiary'], true, false];
const MINOR: ExpressionSpecification = ['match', ['get', 'class'], ['minor', 'service', 'track'], true, false];

export function buildMapStyle(id: MapStyleId, toggles: MapLayerToggles = DEFAULT_LAYER_TOGGLES): StyleSpecification {
  const { palette: p } = getMapStyle(id);
  const layers: LayerSpecification[] = [
    { id: 'background', type: 'background', paint: { 'background-color': p.background } },
  ];

  if (p.hillshade) {
    layers.push({
      id: 'hillshade',
      type: 'hillshade',
      source: 'terrain',
      paint: {
        'hillshade-shadow-color': '#8A8170',
        'hillshade-highlight-color': '#F7F3EA',
        'hillshade-accent-color': '#A69C88',
        'hillshade-exaggeration': 0.35,
      },
    });
  }

  layers.push(
    {
      id: 'parks',
      type: 'fill',
      source: 'omt',
      'source-layer': 'park',
      layout: { visibility: visibility(toggles.parks) },
      paint: { 'fill-color': p.park },
    },
    {
      id: 'landcover-green',
      type: 'fill',
      source: 'omt',
      'source-layer': 'landcover',
      filter: ['match', ['get', 'class'], ['grass', 'wood'], true, false],
      layout: { visibility: visibility(toggles.parks) },
      paint: { 'fill-color': p.park, 'fill-opacity': 0.8 },
    },
    {
      id: 'water',
      type: 'fill',
      source: 'omt',
      'source-layer': 'water',
      layout: { visibility: visibility(toggles.water) },
      paint: { 'fill-color': p.water },
    },
    {
      id: 'waterway',
      type: 'line',
      source: 'omt',
      'source-layer': 'waterway',
      layout: { visibility: visibility(toggles.water) },
      paint: { 'line-color': p.water, 'line-width': width(1) },
    },
  );

  if (p.building) {
    layers.push({
      id: 'buildings',
      type: 'fill',
      source: 'omt',
      'source-layer': 'building',
      minzoom: 14,
      paint: { 'fill-color': p.building },
    });
  }

  const road = (layerId: string, filter: ExpressionSpecification, color: string, w: number, opacity: number) =>
    ({
      id: layerId,
      type: 'line',
      source: 'omt',
      'source-layer': 'transportation',
      filter,
      layout: { visibility: visibility(toggles.roads), 'line-cap': 'round', 'line-join': 'round' },
      paint: { 'line-color': color, 'line-width': width(w), 'line-opacity': opacity },
    }) satisfies LayerSpecification;

  layers.push(
    road('roads-minor', MINOR, p.roadMinor, 0.5, p.roadOpacity * 0.6),
    road('roads-mid', MID, p.roadMinor, 0.9, p.roadOpacity),
    road('roads-major', MAJOR, p.roadMajor, 1.4, p.roadOpacity),
  );

  return {
    version: 8,
    name: `miletag-${id}`,
    sources: {
      omt: { type: 'vector', url: VECTOR_TILES_URL, attribution: MAP_ATTRIBUTION },
      ...(p.hillshade
        ? {
            terrain: {
              type: 'raster-dem',
              tiles: [TERRAIN_TILES],
              encoding: 'terrarium',
              tileSize: 256,
              maxzoom: 14,
            },
          }
        : {}),
    },
    layers,
  } satisfies StyleSpecification;
}
