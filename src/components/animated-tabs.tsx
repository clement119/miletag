/**
 * Segmented control, ported from SmoothUI Animated Tabs ("segment" variant):
 * the indicator fills the active cell and slides between items. Arrow keys,
 * Home and End move selection on web; reduced motion jumps instantly.
 */

import { useEffect, useState } from 'react';
import { Platform, Pressable, StyleSheet, Text, View, type LayoutChangeEvent } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';

import { Colors, Motion, Radius } from '@/constants/theme';

import { tap } from './ui';

export type TabItem<T extends string> = { value: T; label: string };

type Props<T extends string> = {
  items: readonly TabItem<T>[];
  value: T;
  onChange: (value: T) => void;
  accessibilityLabel: string;
};

const INSET = 4;

export function AnimatedTabs<T extends string>({ items, value, onChange, accessibilityLabel }: Props<T>) {
  const reduceMotion = useReducedMotion();
  const [width, setWidth] = useState(0);
  const index = Math.max(0, items.findIndex((i) => i.value === value));
  const cell = width > 0 ? (width - INSET * 2) / items.length : 0;

  const x = useSharedValue(0);
  const target = index * cell;
  useEffect(() => {
    x.set(reduceMotion ? target : withSpring(target, Motion.spring));
  }, [target, reduceMotion, x]);
  const indicator = useAnimatedStyle(() => ({ transform: [{ translateX: x.get() }] }));

  const select = (i: number) => {
    const next = items[(i + items.length) % items.length];
    if (next.value !== value) {
      tap();
      onChange(next.value);
    }
  };

  const onKeyDown = (e: { nativeEvent: { key: string } }) => {
    const key = e.nativeEvent.key;
    if (key === 'ArrowRight') select(index + 1);
    else if (key === 'ArrowLeft') select(index - 1);
    else if (key === 'Home') select(0);
    else if (key === 'End') select(items.length - 1);
  };

  return (
    <View
      role="tablist"
      aria-label={accessibilityLabel}
      onLayout={(e: LayoutChangeEvent) => setWidth(e.nativeEvent.layout.width)}
      style={styles.track}>
      {cell > 0 && <Animated.View style={[styles.indicator, { width: cell }, indicator]} />}
      {items.map((item, i) => {
        const selected = i === index;
        return (
          <Pressable
            key={item.value}
            role="tab"
            aria-selected={selected}
            // Roving tabindex: only the active tab is in the tab order.
            {...(Platform.OS === 'web' ? { tabIndex: selected ? 0 : -1, onKeyDown } : {})}
            onPress={() => select(i)}
            style={styles.tab}>
            <Text style={[styles.label, selected && styles.labelSelected]}>{item.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    flexDirection: 'row',
    backgroundColor: Colors.surface,
    borderRadius: Radius.pill,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: INSET,
  },
  indicator: {
    position: 'absolute',
    top: INSET,
    bottom: INSET,
    left: INSET,
    borderRadius: Radius.pill,
    backgroundColor: Colors.text,
  },
  tab: { flex: 1, paddingVertical: 10, alignItems: 'center' },
  label: { color: Colors.textSecondary, fontWeight: '700', fontSize: 15 },
  labelSelected: { color: Colors.background },
});
