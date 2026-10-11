/**
 * The editor, Instagram Stories style. The photo or map fills the whole screen; the
 * print area sits in the middle with the design's text laid out exactly as it
 * prints, and the bleed around it is lightly dimmed. Tool icons float over the top
 * right; tapping one shows its controls on a see-through blurred band laid OVER the
 * bottom of the preview. The preview never shrinks or moves, nothing ever opens
 * below it, and there are no Done buttons: tapping anywhere outside the controls
 * closes them. Until the user adds their own content, the design shows sample
 * content so it looks like its gallery preview.
 */

import Ionicons from '@expo/vector-icons/Ionicons';
import { Redirect, router } from 'expo-router';
import { useRef, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  TextInput,
  useWindowDimensions,
  View,
} from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Generate } from '@/components/bencho/generate';
import { TimeScrubber } from '@/components/bencho/time-scrubber';
import { Glass, GlassButton, GlassRow, GlassSwatch } from '@/components/editor/glass';
import { ToolRail, type ToolItem } from '@/components/editor/tool-bar';
import { MapCanvas } from '@/components/map-canvas';
import { GRADE_COLOUR, getPhotoQuality, PhotoQualityNotice } from '@/components/photo-quality';
import { canvasAspect, Poster } from '@/components/posters';
import { EditableContext, isDialField, type TextField } from '@/components/posters/editable';
import { RouteCanvas } from '@/components/route-canvas';
import { AppText } from '@/components/ui';
import { Colors, Radius, Spacing } from '@/constants/theme';
import { getDesign, PAPER_MM } from '@/domain/catalog';
import { switchBackground, type Background } from '@/domain/design-document';
import { getLook, hasLayout } from '@/domain/design-looks';
import { DEMO_PHOTO, withSamples } from '@/domain/demo';
import { pickPhoto } from '@/domain/import-photo';
import { LiftUnavailableError, liftSubject } from '@/domain/lift-subject';
import { getMapStyle, MAP_ATTRIBUTION, MAP_STYLES, type MapLayerToggles, type MapStyleId } from '@/domain/map-styles';
import { DEFAULT_PHOTO_CROP, type PhotoAsset } from '@/domain/photo';
import { formatDuration, parseDuration } from '@/domain/race';
import { GpxParseError } from '@/domain/route/gpx';
import { pickGpxRoute } from '@/domain/route/import-gpx';
import { useDesign } from '@/state/design-store';

/**
 * 'text' is a mode (pencils on the poster, colours along the bottom); 'wand' is a
 * switch (with a one-off intro). The rest show floating glass controls.
 */
type ToolId = 'background' | 'adjust' | 'layers' | 'route' | 'text' | 'runner' | 'wand' | 'quality';

/** Pace seconds per km as "5:02". */
const formatPaceValue = (v: number) =>
  `${Math.floor(Math.round(v) / 60)}:${String(Math.round(v) % 60).padStart(2, '0')}`;

const ROUTE_COLOURS = ['#F5A623', '#E4572E', '#E4FF1A', '#FFFFFF', '#111111', '#2F80ED'];
/** Darken scale, in % of black over the photo. */
const DARKEN_MAX = 80;
/** Dim over the bleed: the part of the screen outside the print area. */
const BLEED_DIM = 'rgba(0,0,0,0.35)';

export default function Editor() {
  const { doc, update } = useDesign();
  const [tool, setTool] = useState<ToolId | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  // Direct text editing: the field being edited and what's typed so far.
  const [editField, setEditField] = useState<TextField | null>(null);
  const [draft, setDraft] = useState('');
  const inputRef = useRef<TextInput>(null);
  const [lifting, setLifting] = useState(false);
  const [wandIntro, setWandIntro] = useState(false);
  // "New photo" was tapped: show the upload pill over the print area.
  const [replacing, setReplacing] = useState(false);
  const pendingPhoto = useRef<PhotoAsset | null>(null);
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

  const look = getLook(doc.designId);
  // Full-bleed designs draw the photo/map across the whole screen; paper designs
  // (Poster Classic, and designs without a layout yet) fill the screen with paper.
  const fullBleed = look.paper === null && hasLayout(doc.designId);
  const paperColour = look.paper ?? '#000';
  // Light icons over photos and maps, dark icons over paper.
  const tone: 'light' | 'dark' = fullBleed ? 'light' : 'dark';

  const tools: ToolItem<ToolId>[] = [
    { id: 'background', label: 'Background', icon: bg.type === 'photo' ? 'image-outline' : 'map-outline' },
    bg.type === 'photo'
      ? { id: 'adjust', label: 'Adjust', icon: 'options-outline' }
      : { id: 'layers', label: 'Layers', icon: 'layers-outline' },
    { id: 'route', label: 'Route', icon: 'navigate-outline', dot: doc.route.geo ? undefined : Colors.accent },
    { id: 'text', label: 'Edit text', icon: 'text-outline' },
    // Layouts edit names and times on the poster; designs without a layout yet still need a form.
    ...(hasLayout(doc.designId) ? [] : [{ id: 'runner' as const, label: 'Runners', icon: 'person-outline' as const }]),
    // Magic wand: only where text sits over the photo.
    ...(fullBleed && bg.type === 'photo'
      ? [
          {
            id: 'wand' as const,
            label: 'Magic wand: put text behind the subject',
            icon: lifting ? ('hourglass-outline' as const) : ('color-wand-outline' as const),
            on: !!bg.cutout?.enabled,
          },
        ]
      : []),
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
  const textMode = activeTool === 'text';

  // The print area: as big as the screen allows (full width on a phone), centred, and
  // it never changes size when tools open. Sized from the window, never onLayout.
  const screenW = window.width;
  const screenH = window.height;
  const frameW = Math.max(120, Math.min(screenW, screenH * aspect));
  const frameH = frameW / aspect;
  const frame = { x: (screenW - frameW) / 2, y: (screenH - frameH) / 2, width: frameW, height: frameH };
  const dialing = textMode && isDialField(editField);
  // What the poster shows: the user's content, with samples filling the gaps (but never
  // in the field being edited, which reads blank).
  const display = withSamples(doc, textMode && !dialing ? editField : null);

  const openTool = (id: ToolId | null) => {
    if (id === 'wand') {
      startWand();
      return;
    }
    if (id !== 'text') {
      inputRef.current?.blur();
      setEditField(null);
    }
    setReplacing(false);
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

  // The background being left is kept, so switching back restores the same photo or map view.
  const setBackgroundType = (type: Background['type']) => update((d) => switchBackground(d, type));

  /** Upload, step 1 (Generate's press): pick a photo and hand its preview to the forming animation. */
  const requestPhoto = async (): Promise<string | null> => {
    setNotice(null);
    try {
      const photo = await pickPhoto();
      pendingPhoto.current = photo;
      return photo?.previewUri ?? null;
    } catch {
      setNotice('Could not open that photo.');
      return null;
    }
  };

  /** Upload, step 2 (the picture has formed): it becomes the background. */
  const commitPhoto = () => {
    const photo = pendingPhoto.current;
    pendingPhoto.current = null;
    setReplacing(false);
    if (!photo) return;
    setAdjust('photo');
    update((d) =>
      d.background.type === 'photo'
        ? {
            ...d,
            // A new photo starts fresh: no crop, no low-res OK, no lifted subject.
            background: { ...d.background, photo, crop: { ...DEFAULT_PHOTO_CROP }, lowResAckDpi: null, cutout: null },
          }
        : d,
    );
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

  // ---- Magic wand ----------------------------------------------------------

  /**
   * The wand icon: switches a lifted subject on/off. The first time, it explains
   * itself in the middle of the screen and waits for a tap there before running.
   */
  const startWand = () => {
    if (bg.type !== 'photo' || lifting) return;
    setNotice(null);
    if (bg.cutout) {
      setPhotoOptions({ cutout: { ...bg.cutout, enabled: !bg.cutout.enabled } });
      return;
    }
    if (!bg.photo) {
      setTool('background');
      setNotice('Upload your photo first, then tap the wand.');
      return;
    }
    setTool(null);
    setWandIntro(true);
  };

  const runWand = async () => {
    if (bg.type !== 'photo' || !bg.photo || lifting) return;
    setLifting(true);
    try {
      const cutout = await liftSubject(bg.photo.previewUri);
      if (cutout) setPhotoOptions({ cutout: { ...cutout, enabled: true } });
      else setNotice('Couldn’t find a person or object to lift in this photo.');
    } catch (e) {
      setNotice(
        e instanceof LiftUnavailableError
          ? e.message
          : 'The magic wand couldn’t run. Check your connection and try again.',
      );
    } finally {
      setLifting(false);
      setWandIntro(false);
    }
  };

  // ---- Direct text editing -------------------------------------------------

  const setFieldValue = (field: TextField, value: string) => {
    const [key, index] = field.split(':');
    const i = Number(index) || 0;
    switch (key) {
      case 'title':
      case 'date':
      case 'city':
      case 'country':
        return setText({ [key]: value });
      case 'location': {
        // "City, Country": everything after the first comma is the country.
        const [city, ...rest] = value.split(',');
        return setText({ city: city.trim(), country: rest.join(',').trim() });
      }
      case 'distance': {
        const km = parseFloat(value.replace(/[^\d.]/g, ''));
        return setRunner(0, { distanceKm: km > 0 ? km : undefined });
      }
      case 'name':
        return setRunner(i, { name: value });
      case 'bib':
        return setRunner(i, { bib: value.replace(/^#/, '') });
      case 'time': {
        if (!value.trim()) return setRunner(i, { timeSeconds: undefined });
        const seconds = parseDuration(value);
        if (seconds !== undefined) setRunner(i, { timeSeconds: seconds });
        return;
      }
    }
  };

  /**
   * Starts editing a field: it blanks out for a fresh start, and the hidden input takes
   * focus so only the keyboard appears and the poster text updates as you type. Called
   * straight from a tap, so mobile browsers allow the keyboard to open.
   */
  const beginEdit = (field: TextField) => {
    setTool('text');
    setNotice(null);
    setEditField(field);
    // Time, pace and distance use a dial: no keyboard, and the value stays to scrub from.
    if (isDialField(field)) {
      inputRef.current?.blur();
      return;
    }
    setDraft('');
    setFieldValue(field, '');
    inputRef.current?.focus();
  };

  /** Tapping anywhere outside the controls closes whatever is open. */
  const closeAll = () => openTool(null);

  /** The dial for time, pace or distance: Bencho's scrubber, like the darken ruler. */
  const fieldDial = (field: TextField) => {
    const [key, index] = field.split(':');
    const i = Number(index) || 0;
    // Start from what the poster shows (samples included), so the dial and poster agree.
    const shown = display.doc.runners[i];
    const km = display.doc.runners[0]?.distanceKm ?? 42.2;
    const common = { tone: 'glass' as const, corner: 22, step: '1', momentum: 60 };
    if (key === 'distance')
      return (
        <TimeScrubber
          key={field}
          {...common}
          ariaLabel="Distance"
          min={0}
          max={30000}
          pxPerUnit={2}
          ticks={{ minor: 10, mid: 50, major: 100 }}
          value={Math.round(km * 100)}
          formatValue={(v) => ({ time: (v / 100).toFixed(2), mer: 'KM' })}
          formatTick={(v) => `${v / 100}`}
          onChange={(v) => setRunner(0, { distanceKm: v > 0 ? Math.round(v) / 100 : undefined })}
        />
      );
    const seconds = shown?.timeSeconds ?? 0;
    if (key === 'pace')
      return (
        <TimeScrubber
          key={field}
          {...common}
          ariaLabel="Pace"
          min={120}
          max={1200}
          pxPerUnit={3}
          ticks={{ minor: 5, mid: 15, major: 60 }}
          value={Math.round(seconds / km)}
          formatValue={(v) => ({ time: formatPaceValue(v), mer: '/KM' })}
          formatTick={(v) => formatPaceValue(v)}
          // Pace isn't stored: it sets the finish time for this distance.
          onChange={(v) => setRunner(i, { timeSeconds: Math.round(Math.round(v) * km) })}
        />
      );
    return (
      <TimeScrubber
        key={field}
        {...common}
        ariaLabel="Finish time"
        min={0}
        max={12 * 3600}
        pxPerUnit={1}
        ticks={{ minor: 10, mid: 30, major: 60 }}
        value={seconds}
        formatValue={(v) => ({ time: formatDuration(v), mer: '' })}
        formatTick={(v) => formatDuration(v).replace(/:00$/, '')}
        onChange={(v) => setRunner(i, { timeSeconds: Math.round(v) || undefined })}
      />
    );
  };

  // Next never sits greyed out: it opens whichever tool fixes what's missing.
  const next = () => {
    // Every design prints each runner's name and time.
    const missingName = doc.runners.findIndex((r) => r.name.trim() === '');
    const missingTime = doc.runners.findIndex((r) => !r.timeSeconds);
    if (!doc.route.geo) {
      setTool('route');
      setNotice('Add your GPX route first.');
    } else if (!doc.text.title.trim()) {
      setNotice('Add the race name. It prints on the poster.');
      beginEdit('title');
    } else if (!doc.text.date.trim()) {
      setNotice('Add the race date. It prints on the poster.');
      beginEdit('date');
    } else if (missingName >= 0) {
      setNotice('Add the runner’s name. It prints on the poster.');
      beginEdit(`name:${missingName}`);
    } else if (missingTime >= 0) {
      setNotice('Add the chip time, like 3:41:09. It prints on the poster.');
      beginEdit(`time:${missingTime}`);
    } else if (bg.type === 'photo' && !bg.photo) {
      setTool('background');
      setNotice('Upload your photo, or switch to Map.');
    } else if (quality?.blocked) {
      setTool('quality');
      setNotice('This photo is low resolution for the size. Confirm below or adjust it.');
    } else {
      router.push('/create/format');
    }
  };

  // ---- Poster --------------------------------------------------------------

  /**
   * The design's layout, exactly as it prints, on the print area. Full-bleed layouts get
   * no canvas child (the canvas fills the screen behind them); paper layouts hold it.
   * A function so the full-bleed canvas can take it as its `between` layer.
   */
  function printLayer(child?: React.ReactNode) {
    return (
      <EditableContext.Provider
        value={{ editing: textMode, active: editField, activeEmpty: !dialing && draft === '', onEdit: beginEdit }}>
        <View testID="print-frame" style={[styles.frame, { left: frame.x, top: frame.y, width: frame.width }]}>
          <Poster doc={display.doc} aspectRatio={aspect} footnote={bg.type === 'map' ? MAP_ATTRIBUTION : undefined}>
            {child}
          </Poster>
        </View>
      </EditableContext.Provider>
    );
  }

  const photoForCanvas =
    bg.type === 'photo'
      ? bg.photo
        ? {
            uri: bg.photo.previewUri,
            width: bg.photo.width,
            height: bg.photo.height,
            crop: bg.crop,
            scrim: bg.scrim,
            mono: bg.mono,
          }
        : // Sample photo until they upload theirs.
          { ...DEMO_PHOTO, crop: bg.crop, scrim: bg.scrim, mono: bg.mono }
      : null;

  // Full-bleed: canvas fills the screen, framed to the print area. Paper: canvas sits in the design's slot.
  const canvasSize = fullBleed ? { width: screenW, height: screenH } : undefined;
  const canvas =
    bg.type === 'map' ? (
      <MapCanvas
        styleId={bg.styleId}
        layers={bg.layers}
        geo={display.doc.route.geo}
        routeColor={doc.route.stroke.color}
        camera={bg.camera}
        aspectRatio={fullBleed ? screenW / screenH : slotAspect}
        fitInsets={fullBleed ? { top: frame.y, bottom: screenH - frame.y - frame.height } : undefined}
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
        size={canvasSize}
        frame={fullBleed ? frame : undefined}
        onTransformEnd={(transform) => update((d) => ({ ...d, route: { ...d.route, transform } }))}
        defaultTransform={look.route}
        photo={photoForCanvas}
        onPhotoCropEnd={(crop) => setPhotoOptions({ crop })}
        adjust={adjust}
        subjectUri={bg.type === 'photo' && bg.cutout?.enabled ? bg.cutout.uri : null}
        // In text mode the text sits on top (above the tap-outside layer), so it isn't passed in here.
        between={fullBleed && !textMode ? printLayer() : undefined}
      />
    );

  const hint =
    bg.type === 'map'
      ? 'Drag, pinch or twist the map'
      : bg.photo && adjust === 'photo'
        ? 'Drag to frame · pinch to zoom · double-tap resets'
        : 'Drag, pinch or twist the route · double-tap resets';

  // The upload pill (Bencho's Generate) sits in the middle of the print area when
  // there's no photo yet, or "New photo" was tapped.
  const showUpload = activeTool === 'background' && bg.type === 'photo' && (!bg.photo || replacing);

  // ---- Floating controls (glass, no tray) ----------------------------------

  const controls: Partial<Record<ToolId, () => React.ReactNode>> = {
    background: () => (
      <>
        <GlassRow>
          <GlassButton
            icon="image-outline"
            label="Photo"
            selected={bg.type === 'photo'}
            onPress={() => setBackgroundType('photo')}
          />
          <GlassButton
            icon="map-outline"
            label="Map"
            selected={bg.type === 'map'}
            onPress={() => setBackgroundType('map')}
          />
          {bg.type === 'photo' && bg.photo && (
            <GlassButton
              icon="cloud-upload-outline"
              label="New photo"
              selected={replacing}
              onPress={() => setReplacing((r) => !r)}
            />
          )}
        </GlassRow>
        {bg.type === 'map' && (
          <GlassRow>
            {MAP_STYLES.map((s) => (
              <GlassSwatch
                key={s.id}
                label={s.name}
                fill={s.palette.background}
                ring={s.routeColor}
                selected={bg.styleId === s.id}
                onPress={() => setMapStyle(s.id)}
              />
            ))}
          </GlassRow>
        )}
      </>
    ),
    adjust: () =>
      bg.type === 'photo' ? (
        <>
          <GlassRow>
            <GlassButton
              icon="scan-outline"
              label="Move photo"
              selected={adjust === 'photo'}
              onPress={() => setAdjust('photo')}
            />
            <GlassButton
              icon="navigate-outline"
              label="Move route"
              selected={adjust === 'route'}
              onPress={() => setAdjust('route')}
            />
            <GlassButton
              icon="contrast-outline"
              label="B&W"
              selected={bg.mono}
              onPress={() => setPhotoOptions({ mono: !bg.mono })}
            />
          </GlassRow>
          {/* Darken: Bencho's time scrubber, run as a 0–80 % ruler. */}
          <View style={styles.center}>
            <TimeScrubber
              key={bg.photo?.uri ?? 'sample'}
              tone="glass"
              corner={22}
              min={0}
              max={DARKEN_MAX}
              step="5"
              pxPerUnit={4}
              ticks={{ minor: 5, mid: 10, major: 20 }}
              value={Math.round(bg.scrim * 100)}
              formatValue={(v) => ({ time: `${Math.round(v)}%`, mer: 'DARKEN' })}
              formatTick={(v) => `${v}%`}
              ariaLabel="Darken"
              onChange={(v) => setPhotoOptions({ scrim: Math.round(v) / 100 })}
            />
          </View>
        </>
      ) : null,
    layers: () =>
      bg.type === 'map' ? (
        <GlassRow>
          <GlassButton
            icon="water-outline"
            label="Water"
            selected={bg.layers.water}
            onPress={() => setLayer('water', !bg.layers.water)}
          />
          <GlassButton
            icon="leaf-outline"
            label="Parks"
            selected={bg.layers.parks}
            onPress={() => setLayer('parks', !bg.layers.parks)}
          />
          <GlassButton
            icon="git-network-outline"
            label="Roads"
            selected={bg.layers.roads}
            onPress={() => setLayer('roads', !bg.layers.roads)}
          />
        </GlassRow>
      ) : null,
    route: () => (
      <>
        <GlassRow>
          <GlassButton
            icon="cloud-upload-outline"
            label={doc.route.geo ? 'New GPX' : 'Upload GPX'}
            onPress={importGpx}
          />
        </GlassRow>
        <GlassRow>
          {ROUTE_COLOURS.map((c) => (
            <GlassSwatch
              key={c}
              label={`Route colour ${c}`}
              fill={c}
              showLabel={false}
              selected={doc.route.stroke.color === c}
              onPress={() => update((d) => ({ ...d, route: { ...d.route, stroke: { ...d.route.stroke, color: c } } }))}
            />
          ))}
        </GlassRow>
      </>
    ),
    quality: () => (
      <Glass style={styles.card}>
        <PhotoQualityNotice doc={doc} onAcknowledge={(lowResAckDpi) => setPhotoOptions({ lowResAckDpi })} />
      </Glass>
    ),
    runner: () => {
      const i = Math.min(runnerIndex, doc.runners.length - 1);
      const runner = doc.runners[i];
      return (
        <Glass style={styles.card}>
          {doc.runners.length > 1 && (
            <View style={styles.row}>
              {doc.runners.map((r, n) => (
                <Pressable
                  key={n}
                  onPress={() => setRunnerIndex(n)}
                  style={[styles.runnerTab, n === i && styles.runnerTabOn]}>
                  <AppText style={styles.runnerTabText}>{r.name || `Runner ${n + 1}`}</AppText>
                </Pressable>
              ))}
            </View>
          )}
          <Input placeholder="Name" value={runner.name} onChangeText={(name) => setRunner(i, { name })} />
          <View style={styles.row}>
            <Input
              placeholder="Bib"
              value={runner.bib ?? ''}
              onChangeText={(bib) => setRunner(i, { bib })}
              style={styles.flex}
            />
            <Input
              placeholder="Chip time h:mm:ss"
              defaultValue={runner.timeSeconds ? formatDuration(runner.timeSeconds) : ''}
              onChangeText={(text) => {
                const seconds = parseDuration(text);
                if (seconds !== undefined) setRunner(i, { timeSeconds: seconds });
              }}
              style={styles.flex}
            />
          </View>
        </Glass>
      );
    },
  };

  const iconColour = tone === 'light' ? '#fff' : '#111';
  const shadow = tone === 'light' ? styles.shadow : undefined;
  const hintText = display.usingSamples ? 'Showing sample content. Tap the icons to make it yours.' : hint;

  return (
    <View style={[styles.screen, { backgroundColor: paperColour }]} accessibilityHint={hint}>
      {/* Full-bleed: the photo or map across the whole screen, then the dimmed bleed. */}
      {fullBleed && (
        <>
          <View style={StyleSheet.absoluteFill}>{canvas}</View>
          <BleedMask frame={frame} screenW={screenW} screenH={screenH} />
        </>
      )}

      {/*
        The print area, and the tap-outside layer. Over a full-bleed photo the print area is
        drawn inside the canvas (under the lifted subject). In text mode the text must stay
        tappable, so it goes ABOVE the tap-outside layer; with any other tool open, the layer
        goes on top so a tap anywhere outside the controls closes them.
      */}
      {textMode ? (
        <>
          <Pressable style={StyleSheet.absoluteFill} onPress={closeAll} accessibilityLabel="Finish editing" />
          {/* The map/photo ignores taps here, so tapping it counts as "outside". */}
          {fullBleed ? printLayer() : printLayer(<View style={styles.noTouch}>{canvas}</View>)}
        </>
      ) : (
        <>
          {fullBleed ? bg.type === 'map' && printLayer() : printLayer(canvas)}
          {activeTool && (
            <Pressable style={StyleSheet.absoluteFill} onPress={closeAll} accessibilityLabel="Close controls" />
          )}
        </>
      )}

      {/* Upload: Bencho's Generate pill in the middle of the print area; the photo forms in. */}
      {showUpload && (
        <View style={[styles.uploadLayer, { left: frame.x, top: frame.y, width: frame.width, height: frame.height }]}>
          <Generate
            cover
            corner={0}
            pace={3}
            label={bg.photo ? 'Choose a new photo' : 'Upload your photo'}
            onRequest={requestPhoto}
            onDone={commitPhoto}
          />
        </View>
      )}

      {/* Hidden input behind direct text editing: only the keyboard shows; the poster is the text box. */}
      <TextInput
        ref={inputRef}
        value={draft}
        onChangeText={(value) => {
          setDraft(value);
          if (editField) setFieldValue(editField, value);
        }}
        onBlur={() => setEditField(null)}
        onSubmitEditing={() => inputRef.current?.blur()}
        returnKeyType="done"
        autoCapitalize={editField === 'title' || editField?.startsWith('name') ? 'words' : 'sentences'}
        autoCorrect={false}
        style={styles.hiddenInput}
        accessibilityLabel={editField ? `Editing ${editField.split(':')[0]}` : 'Poster text'}
      />

      {/* See-through overlays. */}
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Back"
        onPress={() => router.back()}
        hitSlop={10}
        style={[styles.back, { top: insets.top + Spacing.two }]}>
        <Ionicons name="chevron-back" size={28} color={iconColour} style={shadow} />
      </Pressable>
      {/* Hidden while a dial is open: the dial sits up here (see below). */}
      {!dialing && (
        <ToolRail
          tools={tools}
          value={activeTool}
          onChange={openTool}
          tone={tone}
          style={[styles.rail, { top: insets.top + Spacing.two }]}
        />
      )}

      {/*
        Text mode: its controls float at the TOP. Time, pace and distance sit in the lower
        half of every design, so the field being edited stays visible and tappable.
      */}
      {textMode && (
        <View
          style={[styles.topControls, dialing && styles.topControlsWide, { top: insets.top + Spacing.two }]}
          pointerEvents="box-none">
          {dialing && editField ? (
            fieldDial(editField)
          ) : (
            <View style={styles.inkRow} pointerEvents="box-none">
              {look.inks.map((ink) => (
                <GlassSwatch
                  key={ink.hex}
                  label={`Text colour ${ink.name}`}
                  fill={ink.hex}
                  showLabel={false}
                  selected={doc.ink === ink.hex}
                  onPress={() => update((d) => ({ ...d, ink: ink.hex }))}
                />
              ))}
            </View>
          )}
          <AppText
            variant="caption"
            style={[styles.message, notice ? { color: Colors.accent } : null, styles.shadow]}
            numberOfLines={2}>
            {notice ??
              (dialing
                ? 'Drag or flick the dial. Tap outside to finish.'
                : 'Tap any text to change it. Tap outside to finish.')}
          </AppText>
        </View>
      )}

      <KeyboardAvoidingView
        style={styles.bottom}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        pointerEvents="box-none">
        {textMode ? null : activeTool ? (
          // Controls on a see-through blurred band laid over the bottom of the preview.
          // The preview behind it never moves or shrinks. No Done: tap outside to close.
          <Glass style={[styles.tray, { paddingBottom: insets.bottom + Spacing.three }]}>
            {notice && (
              <AppText
                variant="caption"
                style={[styles.message, { color: Colors.accent }, styles.shadow]}
                numberOfLines={2}>
                {notice}
              </AppText>
            )}
            {controls[activeTool]?.()}
          </Glass>
        ) : (
          <View style={[styles.bottomBar, { paddingBottom: insets.bottom + Spacing.three }]} pointerEvents="box-none">
            <AppText
              variant="caption"
              style={[styles.hint, { color: notice ? Colors.accent : iconColour }, shadow]}
              numberOfLines={2}>
              {notice ?? hintText}
            </AppText>
            <Pressable accessibilityRole="button" onPress={next} style={styles.nextButton}>
              <AppText style={styles.nextLabel}>Next</AppText>
            </Pressable>
          </View>
        )}
      </KeyboardAvoidingView>

      {/* Magic wand intro: what it does, over a blurred screen; the button in the middle runs it. */}
      {wandIntro && (
        <Animated.View entering={FadeIn.duration(180)} exiting={FadeOut.duration(160)} style={styles.intro}>
          <Pressable
            style={StyleSheet.absoluteFill}
            onPress={() => !lifting && setWandIntro(false)}
            accessibilityLabel="Close"
          />
          <Glass style={styles.introCard}>
            <Ionicons name="color-wand-outline" size={30} color="#fff" />
            <AppText style={styles.introTitle}>Magic wand</AppText>
            <AppText style={styles.introBody}>
              Finds you in the photo and lifts you to the front, so the route and the text sit behind you, like a
              magazine cover. Tap the wand again any time to switch it off.
            </AppText>
            <Pressable accessibilityRole="button" onPress={runWand} disabled={lifting} style={styles.introGo}>
              {lifting ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Ionicons name="sparkles-outline" size={16} color="#fff" />
              )}
              <AppText style={styles.introGoText}>{lifting ? 'Finding you…' : 'Lift me out'}</AppText>
            </Pressable>
            {!lifting && (
              <Pressable accessibilityRole="button" onPress={() => setWandIntro(false)} hitSlop={8}>
                <AppText style={styles.introLater}>Not now</AppText>
              </Pressable>
            )}
          </Glass>
        </Animated.View>
      )}
    </View>
  );
}

/** Dims everything outside the print area, so it's clear what prints. Touches pass through. */
function BleedMask({
  frame,
  screenW,
  screenH,
}: {
  frame: { x: number; y: number; width: number; height: number };
  screenW: number;
  screenH: number;
}) {
  const band = { position: 'absolute' as const, backgroundColor: BLEED_DIM, pointerEvents: 'none' as const };
  const bottom = frame.y + frame.height;
  return (
    <>
      <View style={[band, { left: 0, top: 0, width: screenW, height: Math.max(0, frame.y) }]} />
      <View style={[band, { left: 0, top: bottom, width: screenW, height: Math.max(0, screenH - bottom) }]} />
      <View style={[band, { left: 0, top: frame.y, width: Math.max(0, frame.x), height: frame.height }]} />
      <View
        style={[
          band,
          {
            left: frame.x + frame.width,
            top: frame.y,
            width: Math.max(0, screenW - frame.x - frame.width),
            height: frame.height,
          },
        ]}
      />
    </>
  );
}

function Input(props: React.ComponentProps<typeof TextInput>) {
  return <TextInput placeholderTextColor="rgba(255,255,255,0.6)" {...props} style={[styles.input, props.style]} />;
}

const blur = Platform.OS === 'web' ? { backdropFilter: 'blur(24px) saturate(1.3)' } : null;

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.background },
  // minWidth 0 lets inputs share a row (web inputs otherwise keep a default width).
  flex: { flex: 1, minWidth: 0 },
  center: { alignItems: 'center' },
  frame: { position: 'absolute', pointerEvents: 'box-none' },
  // Only Generate's pill takes a touch; the rest of the print area stays tap-outside.
  uploadLayer: { position: 'absolute', pointerEvents: 'box-none' },
  back: { position: 'absolute', left: Spacing.two, padding: Spacing.one },
  rail: { position: 'absolute', right: Spacing.three },
  shadow: { textShadowColor: 'rgba(0,0,0,0.6)', textShadowRadius: 6, textShadowOffset: { width: 0, height: 1 } },
  bottom: { position: 'absolute', left: 0, right: 0, bottom: 0 },
  tray: {
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
    borderWidth: 0,
    paddingTop: Spacing.three,
    paddingHorizontal: Spacing.three,
    gap: Spacing.three,
  },
  message: { color: '#fff', textAlign: 'center' },
  noTouch: { pointerEvents: 'none' },
  topControls: { position: 'absolute', left: 56, right: 56, alignItems: 'center', gap: Spacing.two },
  inkRow: { flexDirection: 'row', gap: Spacing.three, pointerEvents: 'box-none' },
  // The dial is 300 wide; the rail hides while it's open, so it can use the full width.
  topControlsWide: { left: Spacing.three, right: Spacing.three },
  bottomBar: { flexDirection: 'row', alignItems: 'center', gap: Spacing.three, paddingHorizontal: Spacing.three },
  hint: { flex: 1 },
  nextButton: {
    backgroundColor: Colors.accent,
    borderRadius: Radius.pill,
    paddingHorizontal: Spacing.four,
    paddingVertical: 12,
  },
  nextLabel: { color: Colors.accentText, fontWeight: '700', fontSize: 16 },
  card: { padding: Spacing.three, gap: Spacing.two },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two },
  runnerTab: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: Radius.pill,
    backgroundColor: 'rgba(255,255,255,0.12)',
  },
  runnerTabOn: { backgroundColor: 'rgba(255,255,255,0.4)' },
  runnerTabText: { color: '#fff', fontSize: 13, fontWeight: '600' },
  input: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: Radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.3)',
    color: '#fff',
    paddingHorizontal: Spacing.three,
    height: 44,
    fontSize: 16,
  },
  // Kept on screen (mobile browsers won't open the keyboard for hidden inputs) but invisible.
  hiddenInput: { position: 'absolute', left: 0, top: 0, width: 1, height: 1, opacity: 0.01, fontSize: 16 },
  intro: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.35)',
    padding: Spacing.four,
    ...blur,
  },
  introCard: { width: '100%', maxWidth: 360, padding: Spacing.four, gap: Spacing.three, alignItems: 'center' },
  introTitle: { color: '#fff', fontSize: 22, fontWeight: '700' },
  introBody: { color: 'rgba(255,255,255,0.88)', textAlign: 'center', lineHeight: 21 },
  introGo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    height: 46,
    paddingLeft: 18,
    paddingRight: 22,
    borderRadius: 23,
    backgroundColor: 'rgba(255,255,255,0.22)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.45)',
    marginTop: Spacing.two,
  },
  introGoText: { color: '#fff', fontSize: 15, fontWeight: '600' },
  introLater: { color: 'rgba(255,255,255,0.7)', fontSize: 14 },
});
