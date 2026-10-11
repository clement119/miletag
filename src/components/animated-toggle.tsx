/**
 * Switch, ported from SmoothUI Animated Toggle ("default" variant): a spring
 * sliding thumb. role="switch" + aria-checked; reduced motion jumps instantly.
 */

import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
  interpolateColor,
  useAnimatedStyle,
  useDerivedValue,
  useReducedMotion,
  withSpring,
} from 'react-native-reanimated';

import { Colors, Motion } from '@/constants/theme';

import { tap } from './ui';

type Props = {
  label: string;
  value: boolean;
  onChange: (value: boolean) => void;
  disabled?: boolean;
};

const TRACK_W = 44;
const TRACK_H = 26;
const THUMB = 20;
const PAD = 3;

export function AnimatedToggle({ label, value, onChange, disabled }: Props) {
  const reduceMotion = useReducedMotion();
  const progress = useDerivedValue(() =>
    reduceMotion ? (value ? 1 : 0) : withSpring(value ? 1 : 0, Motion.spring),
  );

  const track = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(progress.get(), [0, 1], [Colors.surfaceRaised, Colors.accent]),
  }));
  const thumb = useAnimatedStyle(() => ({
    transform: [{ translateX: progress.get() * (TRACK_W - THUMB - PAD * 2) }],
  }));

  return (
    <Pressable
      role="switch"
      aria-checked={value}
      aria-label={label}
      disabled={disabled}
      onPress={() => {
        tap();
        onChange(!value);
      }}
      style={[styles.row, disabled && { opacity: 0.4 }]}>
      <Text style={styles.label}>{label}</Text>
      <View>
        <Animated.View style={[styles.track, track]}>
          <Animated.View style={[styles.thumb, thumb]} />
        </Animated.View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 6 },
  label: { color: Colors.text, fontSize: 16 },
  track: {
    width: TRACK_W,
    height: TRACK_H,
    borderRadius: TRACK_H / 2,
    padding: PAD,
    borderWidth: 1,
    borderColor: Colors.border,
    justifyContent: 'center',
  },
  thumb: { width: THUMB, height: THUMB, borderRadius: THUMB / 2, backgroundColor: Colors.text },
});
