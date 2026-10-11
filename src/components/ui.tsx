/**
 * Core UI primitives. Motion follows PRD §10: spring press-scale + haptic on
 * CTAs (Amicro magnetic-button / SmoothUI DotMorphButton language, ported to Reanimated).
 */

import * as Haptics from 'expo-haptics';
import type { ReactNode } from 'react';
import {
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type TextProps,
  type ViewStyle,
} from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Colors, Fonts, MaxContentWidth, Motion, Radius, Spacing } from '@/constants/theme';

export function tap() {
  if (Platform.OS !== 'web') Haptics.selectionAsync();
}

export function Screen({ children, scroll = true }: { children: ReactNode; scroll?: boolean }) {
  const content = <View style={styles.content}>{children}</View>;
  return (
    <SafeAreaView style={styles.screen} edges={['bottom', 'left', 'right']}>
      {scroll ? <ScrollView contentContainerStyle={styles.scroll}>{content}</ScrollView> : content}
    </SafeAreaView>
  );
}

type AppTextProps = TextProps & {
  variant?: 'display' | 'title' | 'body' | 'caption' | 'mono';
  muted?: boolean;
};

export function AppText({ variant = 'body', muted, style, ...rest }: AppTextProps) {
  return (
    <Text
      style={[styles.text, styles[variant], muted && { color: Colors.textSecondary }, style]}
      {...rest}
    />
  );
}

type ButtonProps = {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary';
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
};

export function Button({ label, onPress, variant = 'primary', disabled, style }: ButtonProps) {
  const scale = useSharedValue(1);
  const animated = useAnimatedStyle(() => ({ transform: [{ scale: scale.get() }] }));
  const primary = variant === 'primary';

  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      onPressIn={() => scale.set(withSpring(0.96, Motion.spring))}
      onPressOut={() => scale.set(withSpring(1, Motion.spring))}
      onPress={() => {
        tap();
        onPress();
      }}
      style={style}>
      <Animated.View
        style={[
          styles.button,
          primary ? styles.buttonPrimary : styles.buttonSecondary,
          disabled && styles.disabled,
          animated,
        ]}>
        <Text style={[styles.buttonLabel, { color: primary ? Colors.accentText : Colors.text }]}>
          {label}
        </Text>
      </Animated.View>
    </Pressable>
  );
}

type ChipProps = {
  label: string;
  selected?: boolean;
  disabled?: boolean;
  onPress?: () => void;
};

export function Chip({ label, selected, disabled, onPress }: ChipProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected, disabled }}
      disabled={disabled}
      onPress={() => {
        tap();
        onPress?.();
      }}
      style={[styles.chip, selected && styles.chipSelected, disabled && styles.disabled]}>
      <Text style={[styles.chipLabel, selected && { color: Colors.accentText }]}>{label}</Text>
    </Pressable>
  );
}

export function Card({ children, style }: { children: ReactNode; style?: StyleProp<ViewStyle> }) {
  return <View style={[styles.card, style]}>{children}</View>;
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.background },
  scroll: { flexGrow: 1 },
  content: {
    flex: 1,
    width: '100%',
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
    padding: Spacing.three,
    gap: Spacing.three,
  },
  text: { color: Colors.text, fontFamily: Fonts?.sans },
  display: { fontSize: 40, lineHeight: 44, fontWeight: '800', letterSpacing: -1 },
  title: { fontSize: 22, lineHeight: 28, fontWeight: '700' },
  body: { fontSize: 16, lineHeight: 24 },
  caption: { fontSize: 13, lineHeight: 18, color: Colors.textSecondary },
  mono: { fontFamily: Fonts?.mono, fontSize: 14, letterSpacing: 0.5 },
  button: {
    minHeight: 52,
    borderRadius: Radius.pill,
    paddingHorizontal: Spacing.four,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonPrimary: { backgroundColor: Colors.accent },
  buttonSecondary: { backgroundColor: Colors.surfaceRaised, borderWidth: 1, borderColor: Colors.border },
  buttonLabel: { fontSize: 16, fontWeight: '700' },
  disabled: { opacity: 0.4 },
  chip: {
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    borderRadius: Radius.pill,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  chipSelected: { backgroundColor: Colors.accent, borderColor: Colors.accent },
  chipLabel: { color: Colors.text, fontWeight: '600' },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.three,
    gap: Spacing.two,
  },
});
