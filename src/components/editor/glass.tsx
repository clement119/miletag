/**
 * Glass: the editor's floating controls. See-through and blurred over the photo
 * (backdrop blur on web; a plain translucent tint on native until a blur view is
 * added), never a solid tray.
 */

import Ionicons from '@expo/vector-icons/Ionicons';
import type { ComponentProps, ReactNode } from 'react';
import { Platform, Pressable, StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';

import { tap } from '@/components/ui';

const blur = Platform.OS === 'web' ? ({ backdropFilter: 'blur(18px) saturate(1.4)' } as ViewStyle) : null;

export function Glass({ children, style }: { children?: ReactNode; style?: StyleProp<ViewStyle> }) {
  return <View style={[styles.glass, blur, style]}>{children}</View>;
}

/** A round glass icon button with a small label under it. */
export function GlassButton({
  icon,
  label,
  selected,
  onPress,
}: {
  icon: ComponentProps<typeof Ionicons>['name'];
  label: string;
  selected?: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ selected: !!selected }}
      hitSlop={6}
      onPress={() => {
        tap();
        onPress();
      }}
      style={styles.item}>
      <View style={[styles.circle, blur, selected && styles.circleOn]}>
        <Ionicons name={icon} size={22} color={selected ? '#111' : '#fff'} />
      </View>
      <Text style={styles.label} numberOfLines={1}>
        {label}
      </Text>
    </Pressable>
  );
}

/** A round colour/style swatch on glass. */
export function GlassSwatch({
  label,
  fill,
  ring,
  selected,
  onPress,
  showLabel = true,
}: {
  label: string;
  fill: string;
  /** A second colour shown as an inner ring (e.g. a map style's route colour). */
  ring?: string;
  selected?: boolean;
  onPress: () => void;
  showLabel?: boolean;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ selected: !!selected }}
      hitSlop={6}
      onPress={() => {
        tap();
        onPress();
      }}
      style={styles.item}>
      <View style={[styles.swatch, { backgroundColor: fill }, selected && styles.swatchOn]}>
        {ring ? <View style={[styles.ring, { borderColor: ring }]} /> : null}
      </View>
      {showLabel && (
        <Text style={styles.label} numberOfLines={1}>
          {label}
        </Text>
      )}
    </Pressable>
  );
}

/** A centred row of glass controls. */
export function GlassRow({ children }: { children: ReactNode }) {
  return <View style={styles.row}>{children}</View>;
}

const shadow = { textShadowColor: 'rgba(0,0,0,0.6)', textShadowRadius: 5, textShadowOffset: { width: 0, height: 1 } };

const styles = StyleSheet.create({
  glass: {
    backgroundColor: Platform.OS === 'web' ? 'rgba(20,20,22,0.28)' : 'rgba(20,20,22,0.45)',
    borderRadius: 22,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.22)',
  },
  row: { flexDirection: 'row', justifyContent: 'center', alignItems: 'flex-start', gap: 14, flexWrap: 'wrap' },
  item: { alignItems: 'center', gap: 5, minWidth: 56 },
  circle: {
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Platform.OS === 'web' ? 'rgba(255,255,255,0.16)' : 'rgba(20,20,22,0.45)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.35)',
  },
  circleOn: { backgroundColor: '#fff', borderColor: '#fff' },
  swatch: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.55)',
  },
  swatchOn: { borderColor: '#fff', borderWidth: 3, transform: [{ scale: 1.12 }] },
  ring: { width: 20, height: 14, borderRadius: 7, borderWidth: 2.5 },
  label: { color: '#fff', fontSize: 11, fontWeight: '600', ...shadow },
});
