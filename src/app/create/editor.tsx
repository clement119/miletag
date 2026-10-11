/**
 * The editor, Instagram Stories style. The photo or map fills the whole screen; the
 * print area sits in the middle with the design's text laid out exactly as it
 * prints, and the bleed around it is lightly dimmed. Tool icons float over the top
 * right; tapping one opens its toolkit at the bottom and the print area shrinks to
 * stay in view. Every overlay is see-through. Until the user adds their own
 * content, the design shows sample content so it looks like its gallery preview.
 */

import Ionicons from '@expo/vector-icons/Ionicons';
import { Redirect, router } from 'expo-router';
import { useRef, useState } from 'react';
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
import { EditableContext, type TextField } from '@/components/posters/editable';
import { RouteCanvas } from '@/components/route-canvas';
import { AppText, Button, Chip, tap } from '@/components/ui';
import { Colors, Radius, Spacing } from '@/constants/theme';
import { getDesign, PAPER_MM } from '@/domain/catalog';
import { switchBackground, type Background } from '@/domain/design-document';
import { getLook, hasLayout } from '@/domain/design-looks';
import { DEMO_PHOTO, withSamples } from '@/domain/demo';
import { pickPhoto } from '@/domain/import-photo';
import { LiftUnavailableError, liftSubject } from '@/domain/lift-subject';
import { getMapStyle, MAP_ATTRIBUTION, MAP_STYLES, type MapLayerToggles, type MapStyleId } from '@/domain/map-styles';
import { DEFAULT_PHOTO_CROP, SCRIM_LEVELS } from '@/domain/photo';
import { formatDuration, parseDuration } from '@/domain/race';
import { GpxParseError } from '@/domain/route/gpx';
import { pickGpxRoute } from '@/domain/route/import-gpx';
import { useDesign } from '@/state/design-store';

/** 'text' is a mode, not a sheet: pencil badges on the poster, colours along the bottom. */
/** 'wand' is an on/off switch: lifts the photo's subject above the text. */
type ToolId = 'background' | 'adjust' | 'layers' | 'route' | 'text' | 'runner' | 'wand' | 'quality';

const ROUTE_COLOURS = ['#F5A623', '#E4572E', '#E4FF1A', '#FFFFFF', '#111111', '#2F80ED'];
/** Height of the toolkit sheet when a tool is open. */
const SHEET_HEIGHT = 236;
/** Dim over the bleed: the part of the screen outside the print area. */
const BLEED_DIM = 'rgba(0,0,0,0.35)';

export default function Editor() {
  const { doc, update } = useDesign();
  const [tool, setTool] = useState<ToolId | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [timeText, setTimeText] = useState<Record<number, string>>({});
  // Direct text editing: the field being edited and what's typed so far.
  const [editField, setEditField] = useState<TextField | null>(null);
  const [draft, setDraft] = useState('');
  const inputRef = useRef<TextInput>(null);
  const [lifting, setLifting] = useState(false);
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

  // The print area: as big as the screen allows (full width on a phone), centred.
  // With a toolkit open it fits in the space above it. Sized from the window, never onLayout.
  const screenW = window.width;
  const screenH = window.height;
  const sheetOpen = tool !== null && tool !== 'text';
  const top = sheetOpen ? insets.top + Spacing.two : 0;
  const room = sheetOpen ? screenH - SHEET_HEIGHT - insets.bottom - top - Spacing.two : screenH;
  const frameW = Math.max(120, Math.min(screenW, room * aspect));
  const frameH = frameW / aspect;
  const frame = { x: (screenW - frameW) / 2, y: top + (room - frameH) / 2, width: frameW, height: frameH };
  // What the poster shows: the user's content, with samples filling the gaps.
  const display = withSamples(doc);

  const tools: ToolItem<ToolId>[] = [
    { id: 'background', label: 'Background', icon: bg.type === 'photo' ? 'image-outline' : 'map-outline' },
    bg.type === 'photo'
      ? { id: 'adjust', label: 'Adjust', icon: 'options-outline' }
      : { id: 'layers', label: 'Layers', icon: 'layers-outline' },
    { id: 'route', label: 'Route', icon: 'navigate-outline', dot: doc.route.geo ? undefined : Colors.accent },
    { id: 'text', label: 'Edit text', icon: 'text-outline' },
    { id: 'runner', label: doc.runners.length > 1 ? 'Runners' : 'Runner', icon: 'person-outline' },
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

  const openTool = (id: ToolId | null) => {
    if (id === 'wand') {
      toggleWand();
      return;
    }
    if (id !== 'text') {
      inputRef.current?.blur();
      setEditField(null);
    }
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

  const choosePhoto = async () => {
    setNotice(null);
    try {
      const photo = await pickPhoto();
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

  // ---- Magic wand ----------------------------------------------------------

  /** Lifts the subject above the text (first tap detects it; later taps switch it on/off). */
  const toggleWand = async () => {
    if (bg.type !== 'photo' || lifting) return;
    setNotice(null);
    if (bg.cutout) {
      setPhotoOptions({ cutout: { ...bg.cutout, enabled: !bg.cutout.enabled } });
      return;
    }
    if (!bg.photo) {
      setTool('background');
      setNotice('Choose your photo first, then tap the wand.');
      return;
    }
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
    }
  };

  // ---- Direct text editing -------------------------------------------------

  /** The real value of a field (never a sample), as the user types it. */
  const fieldValue = (field: TextField): string => {
    const [key, index] = field.split(':');
    const runner = doc.runners[Number(index) || 0];
    switch (key) {
      case 'title':
      case 'date':
      case 'city':
      case 'country':
        return doc.text[key];
      case 'location':
        return [doc.text.city, doc.text.country].filter(Boolean).join(', ');
      case 'distance':
        return doc.runners[0]?.distanceKm ? String(doc.runners[0].distanceKm) : '';
      case 'name':
        return runner?.name ?? '';
      case 'bib':
        return runner?.bib ?? '';
      case 'time':
        return runner?.timeSeconds ? formatDuration(runner.timeSeconds) : '';
      default:
        return '';
    }
  };

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
        setTimeText((t) => ({ ...t, [i]: value }));
        const seconds = parseDuration(value);
        if (seconds !== undefined) setRunner(i, { timeSeconds: seconds });
        return;
      }
    }
  };

  /**
   * Starts editing a field: focuses the hidden input so only the keyboard appears and
   * the poster text updates as you type. Called straight from a tap, so mobile
   * browsers allow the keyboard to open.
   */
  const beginEdit = (field: TextField) => {
    setTool('text');
    setEditField(field);
    setDraft(fieldValue(field));
    inputRef.current?.focus();
  };

  const keyboardFor = (field: TextField | null) =>
    field === 'distance' ? 'decimal-pad' : field?.startsWith('time') ? 'numbers-and-punctuation' : 'default';

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
      setNotice('Choose a photo, or switch to Map.');
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
      <EditableContext.Provider value={{ editing: textMode, active: editField, onEdit: beginEdit }}>
        <View style={[styles.frame, { left: frame.x, top: frame.y, width: frame.width }]}>
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
        : // Sample photo until they choose theirs.
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
        between={fullBleed ? printLayer() : undefined}
      />
    );

  // Full-bleed layouts get no canvas child: they render just their text, transparent, over the frame.

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
    // Text editing happens on the poster itself; no sheet.
    text: () => null,
    // The wand is a switch on the rail, not a sheet.
    wand: () => null,
    quality: () => <PhotoQualityNotice doc={doc} onAcknowledge={(lowResAckDpi) => setPhotoOptions({ lowResAckDpi })} />,
  };

  const toolTitle = tools.find((t) => t.id === activeTool)?.label;

  const iconColour = tone === 'light' ? '#fff' : '#111';
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

      {/* The print area. Over a full-bleed photo it's drawn inside the canvas, under the lifted subject. */}
      {fullBleed ? bg.type === 'map' && printLayer() : printLayer(canvas)}

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
        keyboardType={keyboardFor(editField)}
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
        <Ionicons name="chevron-back" size={28} color={iconColour} style={tone === 'light' && styles.shadow} />
      </Pressable>
      <ToolRail
        tools={tools}
        value={activeTool}
        onChange={openTool}
        tone={tone}
        style={[styles.rail, { top: insets.top + Spacing.two }]}
      />

      <KeyboardAvoidingView
        style={styles.bottom}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        pointerEvents="box-none">
        {textMode ? (
          // Text mode: colours straight on the poster, no tray.
          <View style={[styles.textBar, { paddingBottom: insets.bottom + Spacing.three }]} pointerEvents="box-none">
            <AppText
              variant="caption"
              style={[{ color: notice ? Colors.accent : iconColour }, tone === 'light' && styles.shadow]}
              numberOfLines={2}>
              {notice ?? 'Tap a ✎ to edit that text. Pick a colour below.'}
            </AppText>
            <View style={styles.swatchRow} pointerEvents="box-none">
              {look.inks.map((ink) => (
                <Pressable
                  key={ink.hex}
                  accessibilityRole="button"
                  accessibilityLabel={`Text colour ${ink.name}`}
                  accessibilityState={{ selected: doc.ink === ink.hex }}
                  hitSlop={6}
                  onPress={() => {
                    tap();
                    update((d) => ({ ...d, ink: ink.hex }));
                  }}
                  style={[
                    styles.inkDot,
                    { backgroundColor: ink.hex, borderColor: iconColour },
                    doc.ink === ink.hex && styles.inkDotSelected,
                  ]}
                />
              ))}
              <Pressable accessibilityRole="button" onPress={() => openTool(null)} hitSlop={10} style={styles.textDone}>
                <AppText style={[styles.done, tone === 'light' && styles.shadow]}>Done</AppText>
              </Pressable>
            </View>
          </View>
        ) : activeTool ? (
          <View style={[styles.sheet, { height: SHEET_HEIGHT + insets.bottom, paddingBottom: insets.bottom }]}>
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
          <View style={[styles.bottomBar, { paddingBottom: insets.bottom + Spacing.three }]} pointerEvents="box-none">
            <AppText
              variant="caption"
              style={[styles.hint, { color: iconColour }, tone === 'light' && styles.shadow]}
              numberOfLines={2}>
              {notice ?? hintText}
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
  frame: { position: 'absolute', pointerEvents: 'box-none' },
  back: { position: 'absolute', left: Spacing.two, padding: Spacing.one },
  rail: { position: 'absolute', right: Spacing.three },
  shadow: { textShadowColor: 'rgba(0,0,0,0.6)', textShadowRadius: 6, textShadowOffset: { width: 0, height: 1 } },
  bottom: { position: 'absolute', left: 0, right: 0, bottom: 0 },
  bottomBar: { flexDirection: 'row', alignItems: 'center', gap: Spacing.three, paddingHorizontal: Spacing.three },
  hint: { flex: 1 },
  nextButton: {
    backgroundColor: Colors.accent,
    borderRadius: Radius.pill,
    paddingHorizontal: Spacing.four,
    paddingVertical: 12,
  },
  nextLabel: { color: Colors.accentText, fontWeight: '700', fontSize: 16 },
  // See-through: the design stays visible behind the controls.
  sheet: { backgroundColor: 'rgba(10,10,11,0.72)' },
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
  textBar: { paddingHorizontal: Spacing.three, gap: Spacing.two },
  swatchRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.three },
  inkDot: { width: 30, height: 30, borderRadius: 15, borderWidth: 2 },
  inkDotSelected: { transform: [{ scale: 1.2 }], borderWidth: 3 },
  textDone: { marginLeft: 'auto' },
  // Kept on screen (mobile browsers won't open the keyboard for hidden inputs) but invisible.
  hiddenInput: { position: 'absolute', left: 0, top: 0, width: 1, height: 1, opacity: 0.01, fontSize: 16 },
  notice: { paddingVertical: Spacing.one },
  noticeText: { color: Colors.accent, fontWeight: '600' },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two },
  inputRow: { flexDirection: 'row', gap: Spacing.two },
  input: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
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
