/**
 * Map background (PRD §7.5), native. The route is a line layer on the map, so
 * it stays geographically locked while the user pans, zooms and rotates.
 */

import { Camera, GeoJSONSource, Layer, Map, type CameraRef, type MapProps } from '@maplibre/maplibre-react-native';
import { useEffect, useMemo, useRef, useState } from 'react';
import { StyleSheet, View, type LayoutChangeEvent } from 'react-native';

import { buildMapStyle } from '@/domain/map-styles';
import { geoBounds } from '@/domain/route/geometry';

import { DEFAULT_CENTER, DEFAULT_ZOOM, FIT_PADDING, routeFeature, type MapCanvasProps } from './types';

export type { MapCanvasProps } from './types';

export function MapCanvas({
  styleId,
  layers,
  geo,
  routeColor,
  camera,
  onCameraChange,
  aspectRatio,
  fitInsets,
}: MapCanvasProps) {
  const cameraRef = useRef<CameraRef>(null);
  const [width, setWidth] = useState(0);
  // maplibre-react-native pins an older copy of the style-spec types; the JSON is identical.
  const style = useMemo(() => buildMapStyle(styleId, layers) as unknown as MapProps['mapStyle'], [styleId, layers]);

  const padding = width * FIT_PADDING;
  const fitPadding = {
    top: padding + (fitInsets?.top ?? 0),
    right: padding,
    bottom: padding + (fitInsets?.bottom ?? 0),
    left: padding,
  };
  const bounds = useMemo(() => {
    if (!geo) return null;
    const [[w, s], [e, n]] = geoBounds(geo);
    return [w, s, e, n] as [number, number, number, number];
  }, [geo]);

  // A newly imported route re-frames the map unless the user has set a view.
  useEffect(() => {
    if (bounds && !camera && width > 0) {
      cameraRef.current?.fitBounds(bounds, { padding: fitPadding, duration: 600 });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- fitPadding is derived from padding/fitInsets
  }, [bounds, camera, padding, width, fitInsets?.top, fitInsets?.bottom]);

  const onLayout = (e: LayoutChangeEvent) => setWidth(e.nativeEvent.layout.width);

  return (
    <View onLayout={onLayout} style={[styles.wrapper, { aspectRatio }]}>
      {width > 0 && (
        <Map
          style={StyleSheet.absoluteFill}
          mapStyle={style}
          attribution={false}
          logo={false}
          compass={false}
          touchPitch={false}
          onRegionDidChange={(e) => {
            const { center, zoom, bearing, userInteraction } = e.nativeEvent;
            if (userInteraction) onCameraChange({ center, zoom, bearing });
          }}>
          <Camera
            ref={cameraRef}
            initialViewState={
              camera
                ? { center: camera.center, zoom: camera.zoom, bearing: camera.bearing }
                : bounds
                  ? { bounds, padding: fitPadding }
                  : { center: DEFAULT_CENTER, zoom: DEFAULT_ZOOM }
            }
          />
          {geo && (
            <GeoJSONSource id="route" data={routeFeature(geo)}>
              <Layer
                id="route-line"
                type="line"
                layout={{ 'line-cap': 'round', 'line-join': 'round' }}
                paint={{ 'line-color': routeColor, 'line-width': 3 }}
              />
            </GeoJSONSource>
          )}
        </Map>
      )}
    </View>
  );
}

const styles = StyleSheet.create({ wrapper: { width: '100%', overflow: 'hidden' } });
