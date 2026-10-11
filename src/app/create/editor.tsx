/**
 * The editor, Instagram Stories style: the poster fills the screen edge to edge,
 * tool icons sit in a column over its top right, and tapping one opens that tool's
 * controls at the bottom (the poster shrinks to stay fully visible). Until the user
 * adds their own content, the design shows sample content so it looks like its
 * gallery preview. Fits one screen; no scrolling.
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
  useWindowDimensions,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AnimatedTabs } from '@/components/animated-tabs';
import { ToolRail, type ToolItem } from '@/components/editor/tool-bar';
import { MapCanvas } from '@/components/map-canvas';
import { GRADE_COLOUR, getPhotoQuality, PhotoQualityNotice } from '@/components/photo-quality';
import { canvasAspect, Poster } from '@/components/posters';
import { RouteCanvas } from '@/components/route-canvas';
import { AppText, Button, Chip, tap } from '@/components/ui';
import { Colors, Radius, Spacing } from '@/constants/theme';
import { getDesign, PAPER_MM } from '@/domain/catalog';
import { defaultBackground, type Background } from '@/domain/design-document';
import { getLook } from '@/domain/design-looks';
import { DEMO_PHOTO, withSamples } from '@/domain/demo';
import { pickPhoto } from '@/domain/import-photo';
import { getMapStyle, MAP_ATTRIBUTION, MAP_STYLES, type MapLayerToggles, type MapStyleId } from '@/domain/map-styles';
import { DEFAULT_PHOTO_CROP, SCRIM_LEVELS } from '@/domain/photo';
import { formatDuration, parseDuration } from '@/domain/race';
import { GpxParseError } from '@/domain/route/gpx';
import { pickGpxRoute } from '@/domain/route/import-gpx';
import { useDesign } from '@/state/design-store';

type ToolId = 'background' | 'adjust' | 'layers' | 'route' | 'race' | 'runner' | 'quality';

const ROUTE_COLOURS = ['#F5A623', '#E4572E', '#E4FF1A', '#FFFFFF', '#111111', '#2F80ED'];
/** Height of the toolkit sheet when a tool is open. */
const SHEET_HEIGHT = 236;
/** Hint + Next row under the poster when no tool is open. */
const BOTTOM_BAR = 76;

export default function Editor() {
  const { doc, update } = useDesign();
  const [tool, setTool] = useState<ToolId | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [timeText, setTimeText] = useState<Record<number, string>>({});
  const [adjust, setAdjust] = useState<'photo' | 'route'>('photo');
  const [runnerIndex, setRunnerIndex] = useState(0);
  const window = useWindowDimensions();
  const insets = useSafeAreaInsets();

  if (!doc) return <Redirect href="/create/runners" />;
  const design = getDesign(doc.designId);
  const paper = PAPER_MM[doc.order.size];
  const aspect = design?.orientation === 'landscape' ? paper.h / paper.w : paper.w / paper.h;
  const slotAspect = canvasAspect(doc.designId, aspect);
  const bg = doc.background;
  const quality = getPhotoQuality(doc);

  // Edge to edge: full screen width, unless the height (minus the open toolkit) runs out first.
  // Sized from the window, not onLayout, so it can never collapse to zero.
  const sheetOpen = tool !== null;
  const availableHeight = window.height - insets.top - insets.bottom - (sheetOpen ? SHEET_HEIGHT : BOTTOM_BAR);
  const posterWidth = Math.max(120, Math.min(window.width, availableHeight * aspect));
  // What the poster shows: the user's content, with samples filling the gaps.
  const display = withSamples(doc);

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
  // The Adjust/Layers/Quality tools come and go with the background.
  const activeTool = tools.some((t) => t.id === tool) ? tool : null;

  const openTool = (id: ToolId | null) => {
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
    update((d) => (d.background.type === type ? d : { ...d, background: defaultBackground(d.designId, type) }));

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

  const setText = (patch: Partial<typeof doc.text>) => update((d) => ({ ...d, text: { ...d.text, ...patch } }));

  const setRunner = (index: number, patch: Partial<(typeof doc.runners)[number]>) =>
    update((d) => ({ ...d, runners: d.runners.map((r, i) => (i === index ? { ...r, ...patch } : r)) }));

  // Next never sits greyed out: it opens whichever tool fixes what's missing.
  const next = () => {
    // Every design prints each runner's name and time.
    const firstRunner = doc.runners.findIndex((r) => r.name.trim() === '' || !r.timeSeconds);
    if (!doc.route.geo) {
      setTool('route');
      setNotice('Add your GPX route first.');
    } else if (!doc.text.title.trim() || !doc.text.date.trim()) {
      setTool('race');
      setNotice('Add the race name and date. They print on the poster.');
    } else if (firstRunner >= 0) {
      setTool('runner');
      setRunnerIndex(firstRunner);
      setNotice('Add the name and chip time. They print on the poster.');
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
        geo={display.doc.route.geo}
        routeColor={doc.route.stroke.color}
        camera={bg.camera}
        aspectRatio={slotAspect}
        onCameraChange={(camera) =>
          update((d) => (d.background.type === 'map' ? { ...d, background: { ...d.background, camera } } : d))
        }
      />
    ) : (
      <RouteCanvas
        points={display.doc.route.points}
        transform={doc.route.transform}
        strokeColor={doc.route.stroke.color}
        aspectRatio={slotAspect}
        onTransformEnd={(transform) => update((d) => ({ ...d, route: { ...d.route, transform } }))}
        defaultTransform={getLook(doc.designId).route}
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
            : // Sample photo until they choose theirs.
              { ...DEMO_PHOTO, crop: bg.crop, scrim: bg.scrim, mono: bg.mono }
        }
        onPhotoCropEnd={(crop) => setPhotoOptions({ crop })}
        adjust={adjust}
      />
    );

  const poster = (
    <Poster doc={display.doc} aspectRatio={aspect} footnote={bg.type === 'map' ? MAP_ATTRIBUTION : undefined}>
      {canvas}
    </Poster>
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
          onChangeText={(title) => setText({ title })}
        />
        <View style={styles.inputRow}>
          <Input
            placeholder="Date"
            value={doc.text.date}
            onChangeText={(date) => setText({ date })}
            style={styles.flex}
          />
          <Input
            placeholder="City"
            value={doc.text.city}
            onChangeText={(city) => setText({ city })}
            style={styles.flex}
          />
          <Input
            placeholder="Country"
            value={doc.text.country}
            onChangeText={(country) => setText({ country })}
            style={styles.flex}
          />
        </View>
        <AppText variant="caption">Date like 5 October 2026 or 05/10/2026. City and country are optional.</AppText>
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

  const toolTitle = tools.find((t) => t.id === activeTool)?.label;

  return (
    <View style={[styles.screen, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={[styles.stage, { height: availableHeight }]} accessibilityHint={hint}>
          <View style={{ width: posterWidth }}>{poster}</View>

          {/* Overlays: back top-left, tool rail top-right. */}
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Back"
            onPress={() => router.back()}
            hitSlop={8}
            style={[styles.roundButton, styles.back]}>
            <Ionicons name="chevron-back" size={22} color="#fff" />
          </Pressable>
          <ToolRail tools={tools} value={activeTool} onChange={openTool} style={styles.rail} />
        </View>

        {activeTool ? (
          <View style={styles.sheet}>
            <View style={styles.sheetHeader}>
              <AppText style={styles.sheetTitle}>{toolTitle}</AppText>
              <Pressable accessibilityRole="button" onPress={() => openTool(null)} hitSlop={10}>
                <AppText style={styles.done}>Done</AppText>
              </Pressable>
            </View>
            <ScrollView contentContainerStyle={styles.panelContent} bounces={false} keyboardShouldPersistTaps="handled">
              {notice && (
                <View style={styles.notice}>
                  <AppText style={styles.noticeText}>{notice}</AppText>
                </View>
              )}
              {panels[activeTool]()}
            </ScrollView>
          </View>
        ) : (
          <View style={styles.bottomBar}>
            <AppText variant="caption" style={styles.hint} numberOfLines={2}>
              {display.usingSamples ? 'Showing sample content. Tap the icons to make it yours.' : hint}
            </AppText>
            <Pressable accessibilityRole="button" onPress={next} style={styles.nextButton}>
              <AppText style={styles.nextLabel}>Next</AppText>
            </Pressable>
          </View>
        )}
      </KeyboardAvoidingView>
    </View>
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
  // minWidth 0 lets inputs share a row (web inputs otherwise keep a default width).
  flex: { flex: 1, minWidth: 0 },
  stage: { alignItems: 'center', justifyContent: 'center' },
  roundButton: {
    position: 'absolute',
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  back: { top: Spacing.three, left: Spacing.three },
  rail: { position: 'absolute', top: Spacing.three, right: Spacing.three },
  bottomBar: {
    height: BOTTOM_BAR,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    paddingHorizontal: Spacing.three,
  },
  hint: { flex: 1 },
  nextButton: {
    backgroundColor: Colors.accent,
    borderRadius: Radius.pill,
    paddingHorizontal: Spacing.four,
    paddingVertical: 12,
  },
  nextLabel: { color: Colors.accentText, fontWeight: '700', fontSize: 16 },
  sheet: {
    height: SHEET_HEIGHT,
    backgroundColor: Colors.surface,
    borderTopLeftRadius: Radius.lg,
    borderTopRightRadius: Radius.lg,
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.three,
    paddingTop: Spacing.three,
    paddingBottom: Spacing.one,
  },
  sheetTitle: { fontWeight: '700', fontSize: 16 },
  done: { color: Colors.accent, fontWeight: '700', fontSize: 16 },
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
});
