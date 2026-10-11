import type { MapCamera } from '@/domain/design-document';
import type { MapLayerToggles, MapStyleId } from '@/domain/map-styles';
import type { LngLat } from '@/domain/route/geometry';

export type MapCanvasProps = {
  styleId: MapStyleId;
  layers: MapLayerToggles;
  geo: LngLat[] | null;
  routeColor: string;
  /** Saved view; null means fit the map to the route. */
  camera: MapCamera | null;
  onCameraChange: (camera: MapCamera) => void;
  /** Width / height of the poster. */
  aspectRatio: number;
};

/** Breathing room around the route when auto-fitting, as a fraction of the shorter side. */
export const FIT_PADDING = 0.12;

/** Kuala Lumpur, shown before a route is imported. */
export const DEFAULT_CENTER: LngLat = [101.6869, 3.139];
export const DEFAULT_ZOOM = 11.5;

export function routeFeature(geo: LngLat[]): GeoJSON.Feature<GeoJSON.LineString> {
  return { type: 'Feature', properties: {}, geometry: { type: 'LineString', coordinates: geo } };
}
