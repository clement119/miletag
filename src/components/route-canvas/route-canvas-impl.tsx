/**
 * Live poster canvas with the movable route (PRD §7.4).
 * One-finger drag = move, pinch = scale, twist = rotate, double-tap = reset.
 * Gestures run on the UI thread; the transform is committed back to the
 * design document when a gesture ends.
 */

import { Canvas, DashPathEffect, Group, Line, Path, Rect, Skia, vec } from '@shopify/react-native-skia';
import { useMemo, useState } from 'react';
import { StyleSheet, View, type LayoutChangeEvent } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { useDerivedValue, useSharedValue, withSpring } from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';

import { Colors, Motion } from '@/constants/theme';
import { DEFAULT_ROUTE_TRANSFORM, type RouteTransform } from '@/domain/design-document';
import type { XY } from '@/domain/route/geometry';

export type RouteCanvasProps = {
  points: XY[] | null;
  transform: RouteTransform;
  onTransformEnd: (t: RouteTransform) => void;
  strokeColor: string;
  /** Width / height of the poster. A-series portrait is 1/√2. */
  aspectRatio: number;
  /** Optional dashed square (fraction of poster width) showing the 3D-printable area. */
  printableArea?: number | null;
};

const MIN_SCALE = 0.15;
const MAX_SCALE = 1.6;
const GRID_LINES = 12;

export default function RouteCanvas({
  points,
  transform,
  onTransformEnd,
  strokeColor,
  aspectRatio,
  printableArea,
}: RouteCanvasProps) {
  const [size, setSize] = useState({ width: 0, height: 0 });
  const { width, height } = size;

  const x = useSharedValue(transform.x);
  const y = useSharedValue(transform.y);
  const scale = useSharedValue(transform.scale);
  const rotation = useSharedValue(transform.rotation);
  const start = useSharedValue({ ...transform });

  const path = useMemo(() => {
    const p = Skia.Path.Make();
    if (!points || points.length < 2) return p;
    // Route lives in a unit box; centre it on the origin so scale/rotate pivot on its middle.
    p.moveTo(points[0].x - 0.5, points[0].y - 0.5);
    for (let i = 1; i < points.length; i++) p.lineTo(points[i].x - 0.5, points[i].y - 0.5);
    return p;
  }, [points]);

  const routeTransform = useDerivedValue(() => [
    { translateX: x.get() * width },
    { translateY: y.get() * height },
    { rotate: rotation.get() },
    { scale: scale.get() * width },
  ]);

  // Stroke is in route-local units; keep it ~3px on screen whatever the scale.
  const strokeWidth = useDerivedValue(() => 3 / Math.max(1, width * scale.get()));

  const commit = () => {
    'worklet';
    scheduleOnRN(onTransformEnd, {
      x: x.get(),
      y: y.get(),
      scale: scale.get(),
      rotation: rotation.get(),
    });
  };

  const begin = () => {
    'worklet';
    start.set({ x: x.get(), y: y.get(), scale: scale.get(), rotation: rotation.get() });
  };

  const pan = Gesture.Pan()
    .averageTouches(true)
    .onStart(begin)
    .onUpdate((e) => {
      if (width === 0) return;
      x.set(start.get().x + e.translationX / width);
      y.set(start.get().y + e.translationY / height);
    })
    .onEnd(commit);

  const pinch = Gesture.Pinch()
    .onStart(begin)
    .onUpdate((e) => {
      scale.set(Math.min(MAX_SCALE, Math.max(MIN_SCALE, start.get().scale * e.scale)));
    })
    .onEnd(commit);

  const rotate = Gesture.Rotation()
    .onStart(begin)
    .onUpdate((e) => {
      rotation.set(start.get().rotation + e.rotation);
    })
    .onEnd(commit);

  const reset = Gesture.Tap()
    .numberOfTaps(2)
    .onEnd(() => {
      x.set(withSpring(DEFAULT_ROUTE_TRANSFORM.x, Motion.spring));
      y.set(withSpring(DEFAULT_ROUTE_TRANSFORM.y, Motion.spring));
      scale.set(withSpring(DEFAULT_ROUTE_TRANSFORM.scale, Motion.spring));
      rotation.set(withSpring(DEFAULT_ROUTE_TRANSFORM.rotation, Motion.spring));
      scheduleOnRN(onTransformEnd, { ...DEFAULT_ROUTE_TRANSFORM });
    });

  const gesture = Gesture.Simultaneous(pan, pinch, rotate, reset);

  const onLayout = (e: LayoutChangeEvent) => {
    const w = e.nativeEvent.layout.width;
    setSize({ width: w, height: w / aspectRatio });
  };

  const area = printableArea ? printableArea * width : 0;

  return (
    <View onLayout={onLayout} style={styles.wrapper}>
      {width > 0 && (
        <GestureDetector gesture={gesture}>
          <Canvas style={{ width, height }}>
            <Rect x={0} y={0} width={width} height={height} color="#2A2A2D" />
            {/* Placeholder street grid until MapLibre map styles are wired in. */}
            {Array.from({ length: GRID_LINES }, (_, i) => {
              const gx = ((i + 1) / (GRID_LINES + 1)) * width;
              const gy = ((i + 1) / (GRID_LINES + 1)) * height;
              return (
                <Group key={i}>
                  <Line p1={vec(gx, 0)} p2={vec(gx, height)} color="#38383C" strokeWidth={1} />
                  <Line p1={vec(0, gy)} p2={vec(width, gy)} color="#38383C" strokeWidth={1} />
                </Group>
              );
            })}
            {area > 0 && (
              <Rect
                x={(width - area) / 2}
                y={(height - area) / 2}
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
        </GestureDetector>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { width: '100%', borderRadius: 4, overflow: 'hidden' },
});
