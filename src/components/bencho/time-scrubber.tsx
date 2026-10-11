/**
 * Native stand-in for Bencho's TimeScrubber (time-scrubber.web.tsx is the real one;
 * it's DOM + CSS). Same props; a readout with − / + steps. Porting the ruler's drag
 * and spring to Reanimated is a follow-up.
 */

import Ionicons from '@expo/vector-icons/Ionicons';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { tap } from '@/components/ui';
import { Colors, Fonts } from '@/constants/theme';

import type { TimeScrubberProps } from './time-scrubber.web';

export type { TimeScrubberProps } from './time-scrubber.web';

const DAY = 1440;

export function TimeScrubber({
  step = '15',
  start = 570,
  min,
  max,
  format = '12h',
  formatValue,
  value,
  onChange,
  ariaLabel = 'Time',
  tone,
}: TimeScrubberProps) {
  // Dark ink on paper designs, light ink everywhere else.
  const ink = tone === 'paper' ? '#111' : Colors.text;
  const s = Number(step) || 15;
  const [pos, setPos] = useState(value ?? start);
  const bounded = min !== undefined && max !== undefined;
  const move = (d: number) => {
    tap();
    const next = bounded ? Math.min(max!, Math.max(min!, pos + d)) : (((pos + d) % DAY) + DAY) % DAY;
    setPos(next);
    onChange?.(next);
  };
  const readout = formatValue
    ? formatValue(pos)
    : (() => {
        const h = Math.floor(pos / 60);
        const mm = String(pos % 60).padStart(2, '0');
        return format === '24h'
          ? { time: `${String(h).padStart(2, '0')}:${mm}`, mer: '' }
          : { time: `${h % 12 || 12}:${mm}`, mer: h < 12 ? 'AM' : 'PM' };
      })();

  return (
    <View style={styles.root} accessibilityRole="adjustable" accessibilityLabel={ariaLabel}>
      <Pressable accessibilityLabel="Less" hitSlop={8} onPress={() => move(-s)} style={styles.step}>
        <Ionicons name="remove" size={22} color={ink} />
      </Pressable>
      <Text style={[styles.value, { color: ink }]}>
        {readout.time}
        {readout.mer ? ` ${readout.mer}` : ''}
      </Text>
      <Pressable accessibilityLabel="More" hitSlop={8} onPress={() => move(s)} style={styles.step}>
        <Ionicons name="add" size={22} color={ink} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 20, paddingVertical: 8 },
  step: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.14)',
  },
  value: {
    color: Colors.text,
    fontSize: 28,
    fontWeight: '500',
    fontFamily: Fonts?.sans,
    minWidth: 90,
    textAlign: 'center',
  },
});
