import { Redirect, router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, TextInput, View } from 'react-native';

import { AnimatedTabs } from '@/components/animated-tabs';
import { AnimatedToggle } from '@/components/animated-toggle';
import { MapCanvas } from '@/components/map-canvas';
import { MapStyleCarousel } from '@/components/map-style-carousel';
import { RouteCanvas } from '@/components/route-canvas';
import { AppText, Button, Card, Screen } from '@/components/ui';
import { Colors, Radius, Spacing } from '@/constants/theme';
import { getDesign, PAPER_MM } from '@/domain/catalog';
import type { Background } from '@/domain/design-document';
import {
  DEFAULT_LAYER_TOGGLES,
  getMapStyle,
  MAP_ATTRIBUTION,
  type MapLayerToggles,
  type MapStyleId,
} from '@/domain/map-styles';
import { formatDuration, formatPace, parseDuration } from '@/domain/race';
import { GpxParseError } from '@/domain/route/gpx';
import { pickGpxRoute } from '@/domain/route/import-gpx';
import { useDesign } from '@/state/design-store';

export default function Editor() {
  const { doc, update } = useDesign();
  const [error, setError] = useState<string | null>(null);
  const [timeText, setTimeText] = useState<Record<number, string>>({});

  if (!doc) return <Redirect href="/create/runners" />;
  const design = getDesign(doc.designId);
  const paper = PAPER_MM[doc.order.size];
  const aspect = design?.orientation === 'landscape' ? paper.h / paper.w : paper.w / paper.h;

  const importGpx = async () => {
    setError(null);
    try {
      const route = await pickGpxRoute();
      if (!route) return;
      update((d) => ({
        ...d,
        route: { ...d.route, points: route.points, geo: route.geo },
        // A new route re-frames the map.
        background: d.background.type === 'map' ? { ...d.background, camera: null } : d.background,
        runners: d.runners.map((r, i) =>
          i === 0
            ? {
                ...r,
                distanceKm: r.distanceKm ?? Math.round(route.distanceKm * 100) / 100,
                timeSeconds: r.timeSeconds ?? route.elapsedSeconds,
              }
            : r,
        ),
      }));
    } catch (e) {
      setError(e instanceof GpxParseError ? e.message : 'Could not read that file.');
    }
  };

  const bg = doc.background;
  const mapStyle = bg.type === 'map' ? getMapStyle(bg.styleId) : null;

  const setBackgroundType = (type: Background['type']) =>
    update((d) => {
      if (d.background.type === type) return d;
      const background: Background =
        type === 'map'
          ? { type: 'map', styleId: 'graphite', camera: null, layers: { ...DEFAULT_LAYER_TOGGLES } }
          : { type: 'photo' };
      return { ...d, background };
    });

  const setMapStyle = (styleId: MapStyleId) =>
    update((d) =>
      d.background.type === 'map'
        ? {
            ...d,
            background: { ...d.background, styleId },
            // Each style ships with a route colour that reads on it.
            route: { ...d.route, stroke: { ...d.route.stroke, color: getMapStyle(styleId).routeColor } },
          }
        : d,
    );

  const setLayer = (key: keyof MapLayerToggles, on: boolean) =>
    update((d) =>
      d.background.type === 'map'
        ? { ...d, background: { ...d.background, layers: { ...d.background.layers, [key]: on } } }
        : d,
    );

  const setRunner = (index: number, patch: Partial<(typeof doc.runners)[number]>) =>
    update((d) => ({ ...d, runners: d.runners.map((r, i) => (i === index ? { ...r, ...patch } : r)) }));

  return (
    <Screen>
      <AppText variant="caption">{design?.name}</AppText>

      <AnimatedTabs
        accessibilityLabel="Background"
        items={[
          { value: 'map', label: 'Map' },
          { value: 'photo', label: 'Photo' },
        ]}
        value={bg.type}
        onChange={setBackgroundType}
      />

      <View style={styles.poster}>
        {bg.type === 'map' ? (
          <MapCanvas
            styleId={bg.styleId}
            layers={bg.layers}
            geo={doc.route.geo}
            routeColor={doc.route.stroke.color}
            camera={bg.camera}
            aspectRatio={aspect}
            onCameraChange={(camera) =>
              update((d) => (d.background.type === 'map' ? { ...d, background: { ...d.background, camera } } : d))
            }
          />
        ) : (
          <RouteCanvas
            points={doc.route.points}
            transform={doc.route.transform}
            strokeColor={doc.route.stroke.color}
            aspectRatio={aspect}
            onTransformEnd={(transform) => update((d) => ({ ...d, route: { ...d.route, transform } }))}
          />
        )}
        {doc.text.title !== '' && (
          <AppText style={[styles.posterTitle, mapStyle && { color: mapStyle.inkColor }]} numberOfLines={1}>
            {doc.text.title.toUpperCase()}
          </AppText>
        )}
        {bg.type === 'map' && <AppText style={styles.attribution}>{MAP_ATTRIBUTION}</AppText>}
      </View>
      <AppText variant="caption">
        {bg.type === 'map'
          ? 'Drag to move the map · pinch to zoom · twist to rotate. The route stays on the streets.'
          : 'Drag to move · pinch to resize · twist to rotate · double-tap to reset'}
      </AppText>

      {bg.type === 'map' && (
        <Card>
          <MapStyleCarousel value={bg.styleId} onChange={setMapStyle} />
          <AnimatedToggle label="Water" value={bg.layers.water} onChange={(on) => setLayer('water', on)} />
          <AnimatedToggle label="Parks" value={bg.layers.parks} onChange={(on) => setLayer('parks', on)} />
          <AnimatedToggle label="Roads" value={bg.layers.roads} onChange={(on) => setLayer('roads', on)} />
        </Card>
      )}
      {bg.type === 'photo' && (
        <AppText variant="caption">Photo upload is coming next. For now the route sits on a placeholder.</AppText>
      )}

      {error && <AppText style={{ color: Colors.danger }}>{error}</AppText>}
      <Button
        label={doc.route.points ? 'Replace GPX route' : 'Upload GPX route'}
        variant={doc.route.points ? 'secondary' : 'primary'}
        onPress={importGpx}
      />

      <Card>
        <AppText variant="title">Race</AppText>
        <TextInput
          placeholder="Race name, e.g. KL Marathon"
          placeholderTextColor={Colors.textMuted}
          value={doc.text.title}
          onChangeText={(title) => update((d) => ({ ...d, text: { ...d.text, title } }))}
          style={styles.input}
        />
        <TextInput
          placeholder="Date, e.g. 5 October 2026"
          placeholderTextColor={Colors.textMuted}
          value={doc.text.subtitle}
          onChangeText={(subtitle) => update((d) => ({ ...d, text: { ...d.text, subtitle } }))}
          style={styles.input}
        />
      </Card>

      {doc.runners.map((runner, i) => {
        const shownTime = timeText[i] ?? (runner.timeSeconds ? formatDuration(runner.timeSeconds) : '');
        return (
          <Card key={i}>
            <AppText variant="title">Runner {doc.runners.length > 1 ? i + 1 : ''}</AppText>
            <TextInput
              placeholder="Name"
              placeholderTextColor={Colors.textMuted}
              value={runner.name}
              onChangeText={(name) => setRunner(i, { name })}
              style={styles.input}
            />
            <TextInput
              placeholder="Bib (optional)"
              placeholderTextColor={Colors.textMuted}
              value={runner.bib ?? ''}
              onChangeText={(bib) => setRunner(i, { bib })}
              style={styles.input}
            />
            <TextInput
              placeholder="Chip time hh:mm:ss"
              placeholderTextColor={Colors.textMuted}
              value={shownTime}
              onChangeText={(text) => {
                setTimeText((t) => ({ ...t, [i]: text }));
                const seconds = parseDuration(text);
                if (seconds !== undefined) setRunner(i, { timeSeconds: seconds });
              }}
              style={styles.input}
            />
            {runner.timeSeconds && runner.distanceKm ? (
              <AppText variant="mono" muted>
                {runner.distanceKm} KM · {formatPace(runner.timeSeconds, runner.distanceKm)}
              </AppText>
            ) : null}
          </Card>
        );
      })}

      <Button
        label="Get it made"
        disabled={!doc.route.geo}
        onPress={() => router.push('/create/format')}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  poster: {
    backgroundColor: '#F4F2EE',
    padding: Spacing.three,
    borderRadius: Radius.sm,
    gap: Spacing.two,
  },
  posterTitle: { color: '#111', fontWeight: '800', fontSize: 18, letterSpacing: 1 },
  attribution: { color: '#8A8780', fontSize: 9 },
  input: {
    backgroundColor: Colors.surfaceRaised,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    color: Colors.text,
    paddingHorizontal: Spacing.three,
    paddingVertical: 12,
    fontSize: 16,
  },
});
