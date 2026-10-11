/**
 * The editor, Instagram style: poster in the middle, a row of icon tools at the
 * bottom and the selected tool's controls just above it. Fits one screen; no scrolling.
 */

import Ionicons from '@expo/vector-icons/Ionicons';
import { Redirect, router } from 'expo-router';
import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
  type LayoutChangeEvent,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AnimatedTabs } from '@/components/animated-tabs';
import { ToolBar, type ToolItem } from '@/components/editor/tool-bar';
import { MapCanvas } from '@/components/map-canvas';
import { GRADE_COLOUR, getPhotoQuality, PhotoQualityNotice } from '@/components/photo-quality';
import { PosterClassic } from '@/components/posters/poster-classic';
import { RouteCanvas } from '@/components/route-canvas';
import { AppText, Button, Chip, tap } from '@/components/ui';
import { Colors, Radius, Spacing } from '@/constants/theme';
import { getDesign, PAPER_MM } from '@/domain/catalog';
import type { Background } from '@/domain/design-document';
import { pickPhoto } from '@/domain/import-photo';
import {
  DEFAULT_LAYER_TOGGLES,
  getMapStyle,
  MAP_ATTRIBUTION,
  MAP_STYLES,
  type MapLayerToggles,
  type MapStyleId,
} from '@/domain/map-styles';
import { DEFAULT_PHOTO_CROP, SCRIM_LEVELS } from '@/domain/photo';
import { formatDuration, parseDuration } from '@/domain/race';
import { GpxParseError } from '@/domain/route/gpx';
import { pickGpxRoute } from '@/domain/route/import-gpx';
import { useDesign } from '@/state/design-store';

type ToolId = 'background' | 'adjust' | 'layers' | 'route' | 'race' | 'runner' | 'quality';

const ROUTE_COLOURS = ['#F5A623', '#E4572E', '#E4FF1A', '#FFFFFF', '#111111', '#2F80ED'];
const PANEL_HEIGHT = 168;

export default function Editor() {
  const { doc, update } = useDesign();
  const [tool, setTool] = useState<ToolId>('background');
  const [notice, setNotice] = useState<string | null>(null);
  const [timeText, setTimeText] = useState<Record<number, string>>({});
  const [adjust, setAdjust] = useState<'photo' | 'route'>('photo');
  const [runnerIndex, setRunnerIndex] = useState(0);
  const [stage, setStage] = useState({ width: 0, height: 0 });

  if (!doc) return <Redirect href="/create/runners" />;
  const design = getDesign(doc.designId);
  const paper = PAPER_MM[doc.order.size];
  const aspect = design?.orientation === 'landscape' ? paper.h / paper.w : paper.w / paper.h;
  const isPosterClassic = doc.designId === 'poster-classic';
  // Poster Classic frames the map or photo in a square; other designs are full-bleed for now.
  const slotAspect = isPosterClassic ? 1 : aspect;
  const bg = doc.background;
  const quality = getPhotoQuality(doc);

  // Largest poster that fits the stage.
  const posterWidth = Math.max(0, Math.min(stage.width - Spacing.four, (stage.height - Spacing.three) * aspect));

  const tools: ToolItem<ToolId>[] = [
    { id: 'background', label: 'Background', icon: bg.type === 'photo' ? 'image-outline' : 'map-outline' },
    bg.type === 'photo'
      ? { id: 'adjust', label: 'Adjust', icon: 'options-outline' }
      : { id: 'layers', label: 'Layers', icon: 'layers-outline' },
    { id: 'route', label: 'Route', icon: 'navigate-outline', dot: doc.route.geo ? undefined : Colors.accent },
    { id: 'race', label: 'Race', icon: 'text-outline' },
    { id: 'runner', label: doc.runners.length > 1 ? 'Runners' : 'Runner', icon: 'person-outline' },
    ...(quality
      ? [
          {
            id: 'quality' as const,
            label: 'Quality',
            icon: 'aperture-outline' as const,
            dot: GRADE_COLOUR[quality.grade],
          },
        ]
      : []),
  ];
  // The Adjust/Layers/Quality tools come and go with the background; fall back sensibly.
  const activeTool = tools.some((t) => t.id === tool) ? tool : 'background';

  const openTool = (id: ToolId) => {
    setNotice(null);
    setTool(id);
  };

  // ---- Updates -------------------------------------------------------------

  const importGpx = async () => {
    setNotice(null);
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
      setNotice(e instanceof GpxParseError ? e.message : 'Could not read that file.');
    }
  };

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
    setNotice(null);
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
      setNotice('Could not open that photo.');
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

  // Next never sits greyed out: it opens whichever tool fixes what's missing.
  const next = () => {
    if (!doc.route.geo) {
      setTool('route');
      setNotice('Add your GPX route first.');
    } else if (bg.type === 'photo' && !bg.photo) {
      setTool('background');
      setNotice('Choose a photo, or switch to Map.');
    } else if (quality?.blocked) {
      setTool('quality');
      setNotice('This photo is low resolution for the size. Confirm below or adjust it.');
    } else {
      router.push('/create/format');
    }
  };

  // ---- Poster --------------------------------------------------------------

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

  const mapStyle = bg.type === 'map' ? getMapStyle(bg.styleId) : null;
  const poster = isPosterClassic ? (
    <PosterClassic doc={doc} aspectRatio={aspect} footnote={bg.type === 'map' ? MAP_ATTRIBUTION : undefined}>
      {canvas}
    </PosterClassic>
  ) : (
    <View style={styles.genericPoster}>
      {canvas}
      {doc.text.title !== '' && (
        <AppText style={[styles.genericTitle, mapStyle && { color: mapStyle.inkColor }]} numberOfLines={1}>
          {doc.text.title.toUpperCase()}
        </AppText>
      )}
    </View>
  );

  const hint =
    bg.type === 'map'
      ? 'Drag, pinch or twist the map'
      : bg.photo && adjust === 'photo'
        ? 'Drag to frame · pinch to zoom · double-tap resets'
        : 'Drag, pinch or twist the route · double-tap resets';

  // ---- Panels --------------------------------------------------------------

  const panels: Record<ToolId, () => React.ReactNode> = {
    background: () => (
      <>
        <AnimatedTabs
          accessibilityLabel="Background"
          items={[
            { value: 'photo', label: 'Photo' },
            { value: 'map', label: 'Map' },
          ]}
          value={bg.type}
          onChange={setBackgroundType}
        />
        {bg.type === 'photo' ? (
          <>
            <Button
              label={bg.photo ? 'Replace photo' : 'Choose photo'}
              variant={bg.photo ? 'secondary' : 'primary'}
              onPress={choosePhoto}
            />
            <AppText variant="caption">Use a photo you took or have permission to use.</AppText>
          </>
        ) : (
          <View style={styles.row}>
            {MAP_STYLES.map((s) => (
              <Swatch
                key={s.id}
                label={s.name}
                selected={bg.styleId === s.id}
                onPress={() => setMapStyle(s.id)}
                fill={s.palette.background}
                line={s.routeColor}
              />
            ))}
          </View>
        )}
      </>
    ),
    adjust: () =>
      bg.type === 'photo' ? (
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
          <View style={styles.row}>
            {SCRIM_LEVELS.map((level) => (
              <Chip
                key={level.value}
                label={level.value === 0 ? 'No darken' : level.label}
                selected={bg.scrim === level.value}
                onPress={() => setPhotoOptions({ scrim: level.value })}
              />
            ))}
            <Chip label="B&W" selected={bg.mono} onPress={() => setPhotoOptions({ mono: !bg.mono })} />
          </View>
        </>
      ) : null,
    layers: () =>
      bg.type === 'map' ? (
        <>
          <AppText variant="caption">Show on the map</AppText>
          <View style={styles.row}>
            {(['water', 'parks', 'roads'] as const).map((key) => (
              <Chip
                key={key}
                label={key[0].toUpperCase() + key.slice(1)}
                selected={bg.layers[key]}
                onPress={() => setLayer(key, !bg.layers[key])}
              />
            ))}
          </View>
        </>
      ) : null,
    route: () => (
      <>
        <Button
          label={doc.route.geo ? 'Replace GPX route' : 'Upload GPX route'}
          variant={doc.route.geo ? 'secondary' : 'primary'}
          onPress={importGpx}
        />
        <AppText variant="caption">Route colour</AppText>
        <View style={styles.row}>
          {ROUTE_COLOURS.map((c) => (
            <Pressable
              key={c}
              accessibilityRole="button"
              accessibilityLabel={`Route colour ${c}`}
              accessibilityState={{ selected: doc.route.stroke.color === c }}
              onPress={() => {
                tap();
                update((d) => ({ ...d, route: { ...d.route, stroke: { ...d.route.stroke, color: c } } }));
              }}
              style={[styles.colour, { backgroundColor: c }, doc.route.stroke.color === c && styles.colourSelected]}
            />
          ))}
        </View>
      </>
    ),
    race: () => (
      <>
        <Input
          placeholder="Race name, e.g. KL Marathon"
          value={doc.text.title}
          onChangeText={(title) => update((d) => ({ ...d, text: { ...d.text, title } }))}
        />
        <Input
          placeholder="Date, e.g. 5 October 2026"
          value={doc.text.subtitle}
          onChangeText={(subtitle) => update((d) => ({ ...d, text: { ...d.text, subtitle } }))}
        />
      </>
    ),
    runner: () => {
      const i = Math.min(runnerIndex, doc.runners.length - 1);
      const runner = doc.runners[i];
      const shownTime = timeText[i] ?? (runner.timeSeconds ? formatDuration(runner.timeSeconds) : '');
      return (
        <>
          {doc.runners.length > 1 && (
            <View style={styles.row}>
              {doc.runners.map((r, n) => (
                <Chip
                  key={n}
                  label={r.name || `Runner ${n + 1}`}
                  selected={n === i}
                  onPress={() => setRunnerIndex(n)}
                />
              ))}
            </View>
          )}
          <Input placeholder="Name" value={runner.name} onChangeText={(name) => setRunner(i, { name })} />
          <View style={styles.inputRow}>
            <Input
              placeholder="Bib"
              value={runner.bib ?? ''}
              onChangeText={(bib) => setRunner(i, { bib })}
              style={styles.flex}
            />
            <Input
              placeholder="Chip time h:mm:ss"
              value={shownTime}
              onChangeText={(text) => {
                setTimeText((t) => ({ ...t, [i]: text }));
                const seconds = parseDuration(text);
                if (seconds !== undefined) setRunner(i, { timeSeconds: seconds });
              }}
              style={styles.flex}
            />
          </View>
        </>
      );
    },
    quality: () => <PhotoQualityNotice doc={doc} onAcknowledge={(lowResAckDpi) => setPhotoOptions({ lowResAckDpi })} />,
  };

  return (
    <SafeAreaView style={styles.screen} edges={['top', 'bottom', 'left', 'right']}>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.topBar}>
          <Pressable accessibilityRole="button" accessibilityLabel="Back" onPress={() => router.back()} hitSlop={12}>
            <Ionicons name="chevron-back" size={26} color={Colors.text} />
          </Pressable>
          <AppText style={styles.topTitle} numberOfLines={1}>
            {design?.name}
          </AppText>
          <Pressable accessibilityRole="button" onPress={next} style={styles.nextButton}>
            <AppText style={styles.nextLabel}>Next</AppText>
          </Pressable>
        </View>

        <View
          style={styles.stage}
          onLayout={(e: LayoutChangeEvent) => setStage(e.nativeEvent.layout)}
          accessibilityHint={hint}>
          {posterWidth > 0 && <View style={{ width: posterWidth }}>{poster}</View>}
        </View>
        <AppText variant="caption" style={styles.hint} numberOfLines={1}>
          {hint}
        </AppText>

        <ScrollView style={styles.panel} contentContainerStyle={styles.panelContent} bounces={false}>
          {notice && (
            <View style={styles.notice}>
              <AppText style={styles.noticeText}>{notice}</AppText>
            </View>
          )}
          {panels[activeTool]()}
        </ScrollView>

        <ToolBar tools={tools} value={activeTool} onChange={openTool} />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function Input(props: React.ComponentProps<typeof TextInput>) {
  return <TextInput placeholderTextColor={Colors.textMuted} {...props} style={[styles.input, props.style]} />;
}

function Swatch({
  label,
  selected,
  onPress,
  fill,
  line,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
  fill: string;
  line: string;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      onPress={() => {
        tap();
        onPress();
      }}
      style={styles.swatch}>
      <View style={[styles.swatchTile, { backgroundColor: fill }, selected && styles.swatchSelected]}>
        <View style={[styles.swatchRoute, { borderColor: line }]} />
      </View>
      <AppText style={[styles.swatchLabel, selected && { color: Colors.text }]}>{label}</AppText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.background },
  flex: { flex: 1 },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    paddingHorizontal: Spacing.three,
    height: 52,
  },
  topTitle: { flex: 1, fontWeight: '700', fontSize: 17 },
  nextButton: {
    backgroundColor: Colors.accent,
    borderRadius: Radius.pill,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
  },
  nextLabel: { color: Colors.accentText, fontWeight: '700' },
  stage: { flex: 1, alignItems: 'center', justifyContent: 'center', minHeight: 120 },
  hint: { textAlign: 'center', paddingHorizontal: Spacing.three, paddingVertical: Spacing.one },
  panel: { height: PANEL_HEIGHT, flexGrow: 0, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: Colors.border },
  panelContent: { paddingHorizontal: Spacing.three, paddingVertical: Spacing.two, gap: Spacing.two },
  notice: { backgroundColor: Colors.surfaceRaised, borderRadius: Radius.sm, padding: Spacing.two },
  noticeText: { color: Colors.accent, fontWeight: '600' },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two },
  inputRow: { flexDirection: 'row', gap: Spacing.two },
  input: {
    backgroundColor: Colors.surfaceRaised,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    color: Colors.text,
    paddingHorizontal: Spacing.three,
    height: 44,
    fontSize: 16,
  },
  colour: { width: 34, height: 34, borderRadius: 17, borderWidth: 2, borderColor: Colors.border },
  colourSelected: { borderColor: Colors.text, transform: [{ scale: 1.12 }] },
  swatch: { alignItems: 'center', gap: 4 },
  swatchTile: {
    width: 52,
    height: 52,
    borderRadius: Radius.sm,
    borderWidth: 2,
    borderColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
  },
  swatchSelected: { borderColor: Colors.text },
  swatchRoute: { width: 26, height: 18, borderRadius: 9, borderWidth: 2.5 },
  swatchLabel: { fontSize: 11, color: Colors.textMuted },
  genericPoster: { backgroundColor: '#F4F2EE', padding: Spacing.two, borderRadius: 4, gap: Spacing.one },
  genericTitle: { color: '#111', fontWeight: '800', fontSize: 14, letterSpacing: 1 },
});
