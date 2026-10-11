/**
 * Map background (PRD §7.5), web. Same style JSON as native, rendered with
 * maplibre-gl. Drag to pan, scroll or pinch to zoom, right-drag or
 * two-finger twist to rotate.
 */

import 'maplibre-gl/dist/maplibre-gl.css';

import { Map as MapLibreMap, setWorkerUrl } from 'maplibre-gl';
import { useEffect, useMemo, useRef } from 'react';
import { StyleSheet, View } from 'react-native';

import { buildMapStyle } from '@/domain/map-styles';
import { geoBounds } from '@/domain/route/geometry';

import { DEFAULT_CENTER, DEFAULT_ZOOM, FIT_PADDING, routeFeature, type MapCanvasProps } from './types';

export type { MapCanvasProps } from './types';

// Metro can't bundle MapLibre's worker; it's copied to /public on install.
setWorkerUrl('/maplibre/maplibre-gl-worker.mjs');

const ROUTE_SOURCE = 'route';
const ROUTE_LAYER = 'route-line';

export function MapCanvas({
  styleId,
  layers,
  geo,
  routeColor,
  camera,
  onCameraChange,
  aspectRatio,
}: MapCanvasProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<MapLibreMap | null>(null);
  const style = useMemo(() => buildMapStyle(styleId, layers), [styleId, layers]);

  // Latest values for map event handlers, which are bound once.
  const latest = useRef({ geo, routeColor, onCameraChange });
  useEffect(() => {
    latest.current = { geo, routeColor, onCameraChange };
  });

  // Re-adds the route after every style load: setStyle() drops custom layers.
  const syncRoute = (map: MapLibreMap) => {
    const { geo: g, routeColor: color } = latest.current;
    if (map.getLayer(ROUTE_LAYER)) map.removeLayer(ROUTE_LAYER);
    if (map.getSource(ROUTE_SOURCE)) map.removeSource(ROUTE_SOURCE);
    if (!g) return;
    map.addSource(ROUTE_SOURCE, { type: 'geojson', data: routeFeature(g) });
    map.addLayer({
      id: ROUTE_LAYER,
      type: 'line',
      source: ROUTE_SOURCE,
      layout: { 'line-cap': 'round', 'line-join': 'round' },
      paint: { 'line-color': color, 'line-width': 3 },
    });
  };

  const fitToRoute = (map: MapLibreMap, animate: boolean) => {
    const g = latest.current.geo;
    if (!g) return;
    const { clientWidth, clientHeight } = map.getContainer();
    map.fitBounds(geoBounds(g), {
      padding: Math.min(clientWidth, clientHeight) * FIT_PADDING,
      bearing: map.getBearing(),
      animate,
      duration: 600,
    });
  };

  // Create the map once.
  useEffect(() => {
    if (!containerRef.current) return;
    const map = new MapLibreMap({
      container: containerRef.current,
      style,
      center: camera?.center ?? DEFAULT_CENTER,
      zoom: camera?.zoom ?? DEFAULT_ZOOM,
      bearing: camera?.bearing ?? 0,
      pitchWithRotate: false,
      attributionControl: false,
      // Keeps the frame readable for poster export later.
      canvasContextAttributes: { preserveDrawingBuffer: true },
    });
    map.touchPitch.disable();
    map.on('style.load', () => syncRoute(map));
    map.once('load', () => {
      if (!camera) fitToRoute(map, false);
    });
    map.on('moveend', (e: { originalEvent?: unknown }) => {
      // Only user gestures save a view; programmatic fits don't.
      if (!e.originalEvent) return;
      const c = map.getCenter();
      latest.current.onCameraChange({ center: [c.lng, c.lat], zoom: map.getZoom(), bearing: map.getBearing() });
    });
    mapRef.current = map;
    return () => {
      map.remove();
      mapRef.current = null;
    };
    // Style, camera and route changes are applied by the effects below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    mapRef.current?.setStyle(style);
  }, [style]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !map.isStyleLoaded()) return;
    syncRoute(map);
    if (!camera) fitToRoute(map, true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [geo]);

  useEffect(() => {
    const map = mapRef.current;
    if (map?.getLayer(ROUTE_LAYER)) map.setPaintProperty(ROUTE_LAYER, 'line-color', routeColor);
  }, [routeColor]);

  return (
    <View style={[styles.wrapper, { aspectRatio }]}>
      <div ref={containerRef} style={{ position: 'absolute', inset: 0 }} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { width: '100%', overflow: 'hidden', borderRadius: 4 },
});
