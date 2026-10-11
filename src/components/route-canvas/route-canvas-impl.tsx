/**
 * Live canvas for photo mode (PRD §7.2, §7.4): the user's photo with a movable route on top.
 * Gestures drive either the route (drag / pinch / twist / double-tap reset) or the
 * photo crop (drag / pinch), picked by `adjust`. They run on the UI thread and are
 * committed back to the design document when a gesture ends.
 */

import {
  Blur,
  Canvas,
  ColorMatrix,
  DashPathEffect,
  Group,
  Image,
  Line,
  Path,
  Rect,
  Skia,
  useImage,
  vec,
} from '@shopify/react-native-skia';
import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { StyleSheet, View, type LayoutChangeEvent } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { useDerivedValue, useSharedValue, withSpring } from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';

import { Colors, Motion } from '@/constants/theme';
import { DEFAULT_ROUTE_TRANSFORM, type RouteTransform } from '@/domain/design-document';
import { clampCrop, DEFAULT_PHOTO_CROP, type PhotoCrop } from '@/domain/photo';
import type { XY } from '@/domain/route/geometry';

export type CanvasPhoto = {
  /** File URI, or a bundled asset (`require`) for gallery demos. */
  uri: string | number;
  width: number;
  height: number;
  crop: PhotoCrop;
  scrim: number;
  mono: boolean;
};

export type RouteCanvasProps = {
  points: XY[] | null;
  transform: RouteTransform;
  onTransformEnd: (t: RouteTransform) => void;
  strokeColor: string;
  /** Width / height of the poster. A-series portrait is 1/√2. */
  aspectRatio: number;
  /** Optional dashed square (fraction of poster width) showing the 3D-printable area. */
  printableArea?: number | null;
  photo?: CanvasPhoto | null;
  onPhotoCropEnd?: (crop: PhotoCrop) => void;
  /** What gestures move. Falls back to the route when there is no photo. */
  adjust?: 'route' | 'photo';
  /** Where double-tap puts the route back. */
  defaultTransform?: RouteTransform;
  /** False for static thumbnails (the design gallery): no gestures, so lists scroll. */
  interactive?: boolean;
  /** Explicit canvas size (the full-screen editor). Otherwise: full width, height from aspectRatio. */
  size?: { width: number; height: number };
  /**
   * The print area inside the canvas, in canvas pixels. The photo covers it and the
   * route is positioned relative to it; the canvas around it is the bleed shown on
   * screen. Defaults to the whole canvas.
   */
  frame?: { x: number; y: number; width: number; height: number };
  /** Magic wand: the lifted subject (transparent PNG, same framing as the photo), drawn on top of `between`. */
  subjectUri?: string | null;
  /** Layer between the photo/route and the lifted subject: the design's text. */
  between?: ReactNode;
};

const MIN_SCALE = 0.15;
const MAX_SCALE = 1.6;
const GRID_LINES = 12;
/** Route line width as a fraction of the canvas width. */
const ROUTE_STROKE = 0.008;

/**
 * Colour matrix for the lifted subject: it sits above the photo's darken layer, so
 * it gets the same darkening (and black-and-white) applied directly.
 */
function subjectMatrix(mono: boolean, scrim: number): number[] {
  const k = 1 - scrim;
  const row = (r: number, g: number, b: number) => [r * k, g * k, b * k, 0, 0];
  const grey = row(0.2126, 0.7152, 0.0722);
  return mono
    ? [...grey, ...grey, ...grey, 0, 0, 0, 1, 0]
    : [...row(1, 0, 0), ...row(0, 1, 0), ...row(0, 0, 1), 0, 0, 0, 1, 0];
}

// Rec. 709 luminance, for the black-and-white option.
const GREYSCALE = [
  0.2126, 0.7152, 0.0722, 0, 0, 0.2126, 0.7152, 0.0722, 0, 0, 0.2126, 0.7152, 0.0722, 0, 0, 0, 0, 0, 1, 0,
];

export default function RouteCanvas({
  points,
  transform,
  onTransformEnd,
  strokeColor,
  aspectRatio,
  printableArea,
  photo,
  onPhotoCropEnd,
  adjust = 'route',
  defaultTransform = DEFAULT_ROUTE_TRANSFORM,
  interactive = true,
  size: fixedSize,
  frame,
  subjectUri,
  between,
}: RouteCanvasProps) {
  const subject = useImage(subjectUri ?? null);
  const [measured, setMeasured] = useState({ width: 0, height: 0 });
  const { width, height } = fixedSize ?? measured;
  // Everything is laid out relative to the print area (fx, fy, fw, fh).
  const fx = frame?.x ?? 0;
  const fy = frame?.y ?? 0;
  const fw = frame?.width ?? width;
  const fh = frame?.height ?? height;
  const image = useImage(photo?.uri);
  const movingPhoto = adjust === 'photo' && !!photo && !!image;
  const photoDims = { width: photo?.width ?? 1, height: photo?.height ?? 1 };
  const crop = photo?.crop ?? DEFAULT_PHOTO_CROP;

  const px = useSharedValue(crop.x);
  const py = useSharedValue(crop.y);
  const pscale = useSharedValue(crop.scale);
  const pstart = useSharedValue({ ...crop });

  // A new photo (or a reset) arrives as props; sync the gesture state to it.
  useEffect(() => {
    px.set(crop.x);
    py.set(crop.y);
    pscale.set(crop.scale);
  }, [crop.x, crop.y, crop.scale, px, py, pscale]);

  // Drawn photo rect: cover the print area, then zoom and offset. It carries on past
  // the print area into the on-screen bleed.
  const photoRect = useDerivedValue(() => {
    const photoAspect = photoDims.width / photoDims.height;
    const frameAspect = fw / Math.max(1, fh);
    const coverW = photoAspect >= frameAspect ? fh * photoAspect : fw;
    const coverH = photoAspect >= frameAspect ? fh : fw / photoAspect;
    const w = coverW * pscale.get();
    const h = coverH * pscale.get();
    return { x: fx + fw / 2 + px.get() * fw - w / 2, y: fy + fh / 2 + py.get() * fh - h / 2, w, h };
  });
  const photoX = useDerivedValue(() => photoRect.get().x);
  const photoY = useDerivedValue(() => photoRect.get().y);
  const photoW = useDerivedValue(() => photoRect.get().w);
  const photoH = useDerivedValue(() => photoRect.get().h);

  const x = useSharedValue(transform.x);
  const y = useSharedValue(transform.y);
  const scale = useSharedValue(transform.scale);
  const rotation = useSharedValue(transform.rotation);
  const start = useSharedValue({ ...transform });

  useEffect(() => {
    x.set(transform.x);
    y.set(transform.y);
    scale.set(transform.scale);
    rotation.set(transform.rotation);
  }, [transform.x, transform.y, transform.scale, transform.rotation, x, y, scale, rotation]);

  const path = useMemo(() => {
    const p = Skia.Path.Make();
    if (!points || points.length < 2) return p;
    // Route lives in a unit box; centre it on the origin so scale/rotate pivot on its middle.
    p.moveTo(points[0].x - 0.5, points[0].y - 0.5);
    for (let i = 1; i < points.length; i++) p.lineTo(points[i].x - 0.5, points[i].y - 0.5);
    return p;
  }, [points]);

  const routeTransform = useDerivedValue(() => [
    { translateX: fx + x.get() * fw },
    { translateY: fy + y.get() * fh },
    { rotate: rotation.get() },
    { scale: scale.get() * fw },
  ]);

  // Stroke is in route-local units. Make it a fixed share of the canvas width (like the
  // samples) so thumbnails, the editor and the print all show the same line weight.
  const strokeWidth = useDerivedValue(() => ROUTE_STROKE / Math.max(0.01, scale.get()));

  const commit = () => {
    'worklet';
    scheduleOnRN(onTransformEnd, { x: x.get(), y: y.get(), scale: scale.get(), rotation: rotation.get() });
  };

  const begin = () => {
    'worklet';
    start.set({ x: x.get(), y: y.get(), scale: scale.get(), rotation: rotation.get() });
    pstart.set({ x: px.get(), y: py.get(), scale: pscale.get() });
  };

  const setCrop = (next: PhotoCrop) => {
    'worklet';
    const c = clampCrop(next, photoDims, fw / Math.max(1, fh));
    px.set(c.x);
    py.set(c.y);
    pscale.set(c.scale);
  };

  const commitPhoto = () => {
    'worklet';
    if (onPhotoCropEnd) scheduleOnRN(onPhotoCropEnd, { x: px.get(), y: py.get(), scale: pscale.get() });
  };

  const pan = Gesture.Pan()
    .averageTouches(true)
    .onStart(begin)
    .onUpdate((e) => {
      if (fw === 0) return;
      if (movingPhoto) {
        const s0 = pstart.get();
        setCrop({ x: s0.x + e.translationX / fw, y: s0.y + e.translationY / fh, scale: s0.scale });
        return;
      }
      x.set(start.get().x + e.translationX / fw);
      y.set(start.get().y + e.translationY / fh);
    })
    .onEnd(() => (movingPhoto ? commitPhoto() : commit()));

  const pinch = Gesture.Pinch()
    .onStart(begin)
    .onUpdate((e) => {
      if (movingPhoto) {
        const s0 = pstart.get();
        setCrop({ ...s0, x: px.get(), y: py.get(), scale: s0.scale * e.scale });
        return;
      }
      scale.set(Math.min(MAX_SCALE, Math.max(MIN_SCALE, start.get().scale * e.scale)));
    })
    .onEnd(() => (movingPhoto ? commitPhoto() : commit()));

  const rotate = Gesture.Rotation()
    .onStart(begin)
    .onUpdate((e) => {
      // Photos don't rotate; a slight twist while pinching shouldn't move the route.
      if (movingPhoto) return;
      rotation.set(start.get().rotation + e.rotation);
    })
    .onEnd(() => {
      if (!movingPhoto) commit();
    });

  const reset = Gesture.Tap()
    .numberOfTaps(2)
    .onEnd(() => {
      if (movingPhoto) {
        px.set(withSpring(0, Motion.spring));
        py.set(withSpring(0, Motion.spring));
        pscale.set(withSpring(1, Motion.spring));
        if (onPhotoCropEnd) scheduleOnRN(onPhotoCropEnd, { ...DEFAULT_PHOTO_CROP });
        return;
      }
      x.set(withSpring(defaultTransform.x, Motion.spring));
      y.set(withSpring(defaultTransform.y, Motion.spring));
      scale.set(withSpring(defaultTransform.scale, Motion.spring));
      rotation.set(withSpring(defaultTransform.rotation, Motion.spring));
      scheduleOnRN(onTransformEnd, { ...defaultTransform });
    });

  const gesture = Gesture.Simultaneous(pan, pinch, rotate, reset);

  const onLayout = (e: LayoutChangeEvent) => {
    if (fixedSize) return;
    const w = e.nativeEvent.layout.width;
    setMeasured({ width: w, height: w / aspectRatio });
  };

  const area = printableArea ? printableArea * fw : 0;

  const canvas = (
    <Canvas style={{ width, height }}>
      <Rect x={0} y={0} width={width} height={height} color="#2A2A2D" />
      {image ? (
        <Group>
          {frame && (
            // Full-screen editor: a blurred, enlarged copy fills any screen the photo doesn't reach.
            <Image image={image} x={0} y={0} width={width} height={height} fit="cover">
              <Blur blur={28} />
              {photo?.mono && <ColorMatrix matrix={GREYSCALE} />}
            </Image>
          )}
          <Image image={image} x={photoX} y={photoY} width={photoW} height={photoH} fit="fill">
            {photo?.mono && <ColorMatrix matrix={GREYSCALE} />}
          </Image>
          {!!photo?.scrim && <Rect x={0} y={0} width={width} height={height} color={`rgba(0,0,0,${photo.scrim})`} />}
        </Group>
      ) : (
        // Placeholder grid until a photo is chosen.
        Array.from({ length: GRID_LINES }, (_, i) => {
          const gx = ((i + 1) / (GRID_LINES + 1)) * width;
          const gy = ((i + 1) / (GRID_LINES + 1)) * height;
          return (
            <Group key={i}>
              <Line p1={vec(gx, 0)} p2={vec(gx, height)} color="#38383C" strokeWidth={1} />
              <Line p1={vec(0, gy)} p2={vec(width, gy)} color="#38383C" strokeWidth={1} />
            </Group>
          );
        })
      )}
      {area > 0 && (
        <Rect
          x={fx + (fw - area) / 2}
          y={fy + (fh - area) / 2}
          width={area}
          height={area}
          color={Colors.textMuted}
          style="stroke"
          strokeWidth={1}>
          <DashPathEffect intervals={[6, 6]} />
        </Rect>
      )}
      <Group transform={routeTransform}>
        <Path
          path={path}
          color={strokeColor}
          style="stroke"
          strokeWidth={strokeWidth}
          strokeJoin="round"
          strokeCap="round"
        />
      </Group>
    </Canvas>
  );

  return (
    <View onLayout={onLayout} style={fixedSize ?? styles.wrapper}>
      {width > 0 && (interactive ? <GestureDetector gesture={gesture}>{canvas}</GestureDetector> : canvas)}
      {between}
      {subject && width > 0 && (
        // Above the text; touches fall through to the photo canvas.
        <View style={[StyleSheet.absoluteFill, styles.passThrough]}>
          <Canvas style={{ width, height }}>
            <Image image={subject} x={photoX} y={photoY} width={photoW} height={photoH} fit="fill">
              <ColorMatrix matrix={subjectMatrix(!!photo?.mono, photo?.scrim ?? 0)} />
            </Image>
          </Canvas>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { width: '100%', overflow: 'hidden' },
  passThrough: { pointerEvents: 'none' },
});
