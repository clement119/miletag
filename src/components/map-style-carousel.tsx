/**
 * Map style picker, ported from SmoothUI Coverflow Carousel: pure transform
 * math (rotateY, depth via scale, zIndex), swipe with a velocity-based commit,
 * tap a side card or use the arrows / arrow keys to move. Announces
 * "Slide N of M". Reduced motion: flat cards, no rotation, instant moves.
 */

import { useEffect } from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  Extrapolation,
  interpolate,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withSpring,
  type SharedValue,
} from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';

import { Colors, Motion, Radius, Spacing } from '@/constants/theme';
import { MAP_STYLES, type MapStyleId, type MapStyleMeta } from '@/domain/map-styles';

import { tap } from './ui';

const CARD_W = 132;
const CARD_H = 176;
const SPACING = 96; // horizontal distance between card centres
const MAX_ROTATE = 45; // degrees
const VELOCITY_COMMIT = 500; // px/s that commits a move even on a short drag

type Props = {
  value: MapStyleId;
  onChange: (id: MapStyleId) => void;
};

export function MapStyleCarousel({ value, onChange }: Props) {
  const reduceMotion = useReducedMotion();
  const index = Math.max(0, MAP_STYLES.findIndex((s) => s.id === value));
  const position = useSharedValue(index);
  const dragStart = useSharedValue(index);
  const last = MAP_STYLES.length - 1;

  useEffect(() => {
    position.set(reduceMotion ? index : withSpring(index, Motion.spring));
  }, [index, reduceMotion, position]);

  const go = (i: number) => {
    const next = Math.max(0, Math.min(last, i));
    if (next !== index) {
      tap();
      onChange(MAP_STYLES[next].id);
    }
  };

  const pan = Gesture.Pan()
    .enabled(!reduceMotion)
    .activeOffsetX([-8, 8])
    .onStart(() => {
      dragStart.set(position.get());
    })
    .onUpdate((e) => {
      position.set(Math.max(-0.4, Math.min(last + 0.4, dragStart.get() - e.translationX / SPACING)));
    })
    .onEnd((e) => {
      let target = Math.round(position.get());
      if (target === Math.round(dragStart.get()) && Math.abs(e.velocityX) > VELOCITY_COMMIT) {
        target += e.velocityX < 0 ? 1 : -1;
      }
      target = Math.max(0, Math.min(last, target));
      position.set(withSpring(target, Motion.spring));
      scheduleOnRN(go, target);
    });

  const onKeyDown = (e: { nativeEvent: { key: string } }) => {
    if (e.nativeEvent.key === 'ArrowRight') go(index + 1);
    if (e.nativeEvent.key === 'ArrowLeft') go(index - 1);
  };

  const active = MAP_STYLES[index];

  return (
    <View
      role="region"
      aria-roledescription="carousel"
      aria-label="Map style"
      {...(Platform.OS === 'web' ? { tabIndex: 0, onKeyDown } : {})}
      style={styles.region}>
      <GestureDetector gesture={pan}>
        <View style={styles.stage}>
          {MAP_STYLES.map((style, i) => (
            <CoverCard
              key={style.id}
              style={style}
              i={i}
              position={position}
              reduceMotion={reduceMotion}
              active={i === index}
              onPress={() => go(i)}
            />
          ))}
        </View>
      </GestureDetector>

      <View style={styles.footer}>
        <Pressable
          aria-label="Previous style"
          disabled={index === 0}
          onPress={() => go(index - 1)}
          style={[styles.arrow, index === 0 && styles.arrowDisabled]}>
          <Text style={styles.arrowText}>‹</Text>
        </Pressable>
        <View style={{ flex: 1, alignItems: 'center' }}>
          <Text style={styles.name}>{active.name}</Text>
          <Text style={styles.tagline}>{active.tagline}</Text>
        </View>
        <Pressable
          aria-label="Next style"
          disabled={index === last}
          onPress={() => go(index + 1)}
          style={[styles.arrow, index === last && styles.arrowDisabled]}>
          <Text style={styles.arrowText}>›</Text>
        </Pressable>
      </View>

      {/* Visually hidden live region. */}
      <Text aria-live="polite" style={styles.srOnly}>
        {`${active.name}, slide ${index + 1} of ${MAP_STYLES.length}`}
      </Text>
    </View>
  );
}

type CardProps = {
  style: MapStyleMeta;
  i: number;
  position: SharedValue<number>;
  reduceMotion: boolean;
  active: boolean;
  onPress: () => void;
};

function CoverCard({ style, i, position, reduceMotion, active, onPress }: CardProps) {
  const animated = useAnimatedStyle(() => {
    const offset = i - position.get();
    const abs = Math.abs(offset);
    if (reduceMotion) {
      return {
        opacity: interpolate(abs, [0, 1], [1, 0], Extrapolation.CLAMP),
        zIndex: abs < 0.5 ? 1 : 0,
        transform: [{ translateX: 0 }],
      };
    }
    return {
      opacity: interpolate(abs, [0, 2, 3], [1, 0.75, 0], Extrapolation.CLAMP),
      zIndex: Math.round(100 - abs * 10),
      transform: [
        { perspective: 800 },
        { translateX: offset * SPACING },
        { rotateY: `${interpolate(offset, [-1, 0, 1], [MAX_ROTATE, 0, -MAX_ROTATE], Extrapolation.CLAMP)}deg` },
        { scale: interpolate(abs, [0, 1, 2], [1, 0.82, 0.7], Extrapolation.CLAMP) },
      ],
    };
  });

  return (
    <Animated.View style={[styles.card, animated]} aria-hidden={!active}>
      <Pressable onPress={onPress} aria-label={style.name} style={{ flex: 1 }}>
        <StyleSwatch style={style} />
      </Pressable>
    </Animated.View>
  );
}

/** A tiny abstract map in the style's palette, cheaper than five live maps. */
function StyleSwatch({ style }: { style: MapStyleMeta }) {
  const p = style.palette;
  const road = (s: object, major = false) => (
    <View
      style={[
        styles.road,
        { backgroundColor: major ? p.roadMajor : p.roadMinor, opacity: p.roadOpacity, height: major ? 3 : 1.5 },
        s,
      ]}
    />
  );
  return (
    <View style={[styles.swatch, { backgroundColor: p.background }]}>
      {p.hillshade && <View style={[styles.hill, { backgroundColor: '#CFC6B2' }]} />}
      <View style={[styles.park, { backgroundColor: p.park }]} />
      <View style={[styles.water, { backgroundColor: p.water }]} />
      {road({ top: 40, transform: [{ rotate: '-8deg' }] }, true)}
      {road({ top: 92, transform: [{ rotate: '12deg' }] })}
      {road({ top: 130, transform: [{ rotate: '-3deg' }] })}
      {road({ top: 70, left: -40, width: 240, transform: [{ rotate: '72deg' }] }, true)}
      {road({ top: 90, left: -10, width: 240, transform: [{ rotate: '100deg' }] })}
      <View style={[styles.route, { borderColor: style.routeColor }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  region: { gap: Spacing.two },
  stage: { height: CARD_H + 8, alignItems: 'center', justifyContent: 'center' },
  card: {
    position: 'absolute',
    width: CARD_W,
    height: CARD_H,
    borderRadius: Radius.md,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  swatch: { flex: 1, overflow: 'hidden' },
  park: { position: 'absolute', width: 60, height: 44, borderRadius: 10, top: 16, right: 10 },
  water: { position: 'absolute', width: 180, height: 50, borderRadius: 40, bottom: -14, left: -30 },
  hill: { position: 'absolute', width: 140, height: 140, borderRadius: 70, top: -40, left: -50, opacity: 0.6 },
  road: { position: 'absolute', left: -20, width: CARD_W + 40 },
  route: {
    position: 'absolute',
    top: 54,
    left: 30,
    width: 70,
    height: 60,
    borderWidth: 3,
    borderRadius: 30,
    transform: [{ rotate: '-20deg' }],
  },
  footer: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  arrow: {
    width: 40,
    height: 40,
    borderRadius: Radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.surfaceRaised,
  },
  arrowDisabled: { opacity: 0.3 },
  arrowText: { color: Colors.text, fontSize: 24, lineHeight: 26 },
  name: { color: Colors.text, fontWeight: '700', fontSize: 16 },
  tagline: { color: Colors.textSecondary, fontSize: 13 },
  srOnly: { position: 'absolute', width: 1, height: 1, opacity: 0, overflow: 'hidden' },
});
