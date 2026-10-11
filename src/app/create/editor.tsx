import { Redirect, router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, TextInput, View } from 'react-native';

import { AnimatedTabs } from '@/components/animated-tabs';
import { AnimatedToggle } from '@/components/animated-toggle';
import { MapCanvas } from '@/components/map-canvas';
import { MapStyleCarousel } from '@/components/map-style-carousel';
import { getPhotoQuality, PhotoQualityNotice } from '@/components/photo-quality';
import { PosterClassic } from '@/components/posters/poster-classic';
import { RouteCanvas } from '@/components/route-canvas';
import { AppText, Button, Card, Chip, Screen } from '@/components/ui';
import { Colors, Radius, Spacing } from '@/constants/theme';
import { getDesign, PAPER_MM } from '@/domain/catalog';
import type { Background } from '@/domain/design-document';
import { pickPhoto } from '@/domain/import-photo';
import {
  DEFAULT_LAYER_TOGGLES,
  getMapStyle,
  MAP_ATTRIBUTION,
  type MapLayerToggles,
  type MapStyleId,
} from '@/domain/map-styles';
import { DEFAULT_PHOTO_CROP, SCRIM_LEVELS } from '@/domain/photo';
import { formatDuration, formatPace, parseDuration } from '@/domain/race';
import { GpxParseError } from '@/domain/route/gpx';
import { pickGpxRoute } from '@/domain/route/import-gpx';
import { useDesign } from '@/state/design-store';

export default function Editor() {
  const { doc, update } = useDesign();
  const [error, setError] = useState<string | null>(null);
  const [timeText, setTimeText] = useState<Record<number, string>>({});
  const [adjust, setAdjust] = useState<'photo' | 'route'>('photo');

  if (!doc) return <Redirect href="/create/runners" />;
  const design = getDesign(doc.designId);
  const paper = PAPER_MM[doc.order.size];
  const aspect = design?.orientation === 'landscape' ? paper.h / paper.w : paper.w / paper.h;
  const isPosterClassic = doc.designId === 'poster-classic';
  // Poster Classic frames the map or photo in a square; other designs are full-bleed for now.
  const slotAspect = isPosterClassic ? 1 : aspect;
  const quality = getPhotoQuality(doc);
  const blockedReason = !doc.route.geo
    ? 'Upload your GPX route to continue.'
    : doc.background.type === 'photo' && !doc.background.photo
      ? 'Choose a photo, or switch to a map background.'
      : quality?.blocked
        ? 'Your photo is low resolution for this size. Confirm "Print it anyway" or adjust it above.'
        : null;

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
          : { type: 'photo', photo: null, crop: { ...DEFAULT_PHOTO_CROP }, scrim: 0, mono: false, lowResAckDpi: null };
      return { ...d, background };
    });

  const choosePhoto = async () => {
    setError(null);
    try {
      const photo = await pickPhoto();
      if (!photo) return;
      setAdjust('photo');
      update((d) =>
        d.background.type === 'photo'
          ? { ...d, background: { ...d.background, photo, crop: { ...DEFAULT_PHOTO_CROP }, lowResAckDpi: null } }
          : d,
      );
    } catch {
      setError('Could not open that photo.');
    }
  };

  const setPhotoOptions = (patch: Partial<Extract<Background, { type: 'photo' }>>) =>
    update((d) => (d.background.type === 'photo' ? { ...d, background: { ...d.background, ...patch } } : d));

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

  const canvas =
    bg.type === 'map' ? (
      <MapCanvas
        styleId={bg.styleId}
        layers={bg.layers}
        geo={doc.route.geo}
        routeColor={doc.route.stroke.color}
        camera={bg.camera}
        aspectRatio={slotAspect}
        onCameraChange={(camera) =>
          update((d) => (d.background.type === 'map' ? { ...d, background: { ...d.background, camera } } : d))
        }
      />
    ) : (
      <RouteCanvas
        points={doc.route.points}
        transform={doc.route.transform}
        strokeColor={doc.route.stroke.color}
        aspectRatio={slotAspect}
        onTransformEnd={(transform) => update((d) => ({ ...d, route: { ...d.route, transform } }))}
        photo={
          bg.photo
            ? {
                uri: bg.photo.previewUri,
                width: bg.photo.width,
                height: bg.photo.height,
                crop: bg.crop,
                scrim: bg.scrim,
                mono: bg.mono,
              }
            : null
        }
        onPhotoCropEnd={(crop) => setPhotoOptions({ crop })}
        adjust={adjust}
      />
    );

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

      {isPosterClassic ? (
        <PosterClassic doc={doc} aspectRatio={aspect} footnote={bg.type === 'map' ? MAP_ATTRIBUTION : undefined}>
          {canvas}
        </PosterClassic>
      ) : (
        <View style={styles.poster}>
          {canvas}
          {doc.text.title !== '' && (
            <AppText style={[styles.posterTitle, mapStyle && { color: mapStyle.inkColor }]} numberOfLines={1}>
              {doc.text.title.toUpperCase()}
            </AppText>
          )}
          {bg.type === 'map' && <AppText style={styles.attribution}>{MAP_ATTRIBUTION}</AppText>}
        </View>
      )}
      <AppText variant="caption">
        {bg.type === 'map'
          ? 'Drag to move the map · pinch to zoom · twist to rotate. The route stays on the streets.'
          : bg.photo && adjust === 'photo'
            ? 'Drag to position the photo · pinch to zoom · double-tap to reset'
            : 'Drag to move the route · pinch to resize · twist to rotate · double-tap to reset'}
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
        <Card>
          <Button
            label={bg.photo ? 'Replace photo' : 'Choose photo'}
            variant={bg.photo ? 'secondary' : 'primary'}
            onPress={choosePhoto}
          />
          {bg.photo && (
            <>
              <AnimatedTabs
                accessibilityLabel="Gestures move"
                items={[
                  { value: 'photo', label: 'Move photo' },
                  { value: 'route', label: 'Move route' },
                ]}
                value={adjust}
                onChange={setAdjust}
              />
              <PhotoQualityNotice doc={doc} onAcknowledge={(lowResAckDpi) => setPhotoOptions({ lowResAckDpi })} />
              <AppText variant="caption">Darken (helps the route stand out)</AppText>
              <View style={styles.row}>
                {SCRIM_LEVELS.map((level) => (
                  <Chip
                    key={level.value}
                    label={level.label}
                    selected={bg.scrim === level.value}
                    onPress={() => setPhotoOptions({ scrim: level.value })}
                  />
                ))}
              </View>
              <AnimatedToggle label="Black & white" value={bg.mono} onChange={(mono) => setPhotoOptions({ mono })} />
            </>
          )}
          <AppText variant="caption">
            Use a photo you took or have permission to use. The original file is used for the print.
          </AppText>
        </Card>
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

      {blockedReason && <AppText variant="caption">{blockedReason}</AppText>}
      <Button label="Get it made" disabled={!!blockedReason} onPress={() => router.push('/create/format')} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  poster: { backgroundColor: '#F4F2EE', padding: Spacing.three, borderRadius: Radius.sm, gap: Spacing.two },
  posterTitle: { color: '#111', fontWeight: '800', fontSize: 18, letterSpacing: 1 },
  attribution: { color: '#8A8780', fontSize: 9 },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two },
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
