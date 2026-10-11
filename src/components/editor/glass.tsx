/**
 * Glass: the editor's floating controls. Small glass circles for buttons (backdrop
 * blur on web; a translucent tint on native), never a solid tray. `Clear` is the
 * fully transparent layer the controls sit on: no tint, no blur, the image shows
 * through untouched, and text keeps a soft shadow so it reads on any photo.
 */

import Ionicons from '@expo/vector-icons/Ionicons';
import type { ComponentProps, ReactNode } from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';

import { tap } from '@/components/ui';

const blur = Platform.OS === 'web' ? ({ backdropFilter: 'blur(18px) saturate(1.4)' } as ViewStyle) : null;

export function Glass({ children, style }: { children?: ReactNode; style?: StyleProp<ViewStyle> }) {
  return <View style={[styles.glass, blur, style]}>{children}</View>;
}

/** Fully transparent container for controls laid over the preview. */
export function Clear({ children, style }: { children?: ReactNode; style?: StyleProp<ViewStyle> }) {
  return <View style={[styles.clear, style]}>{children}</View>;
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

/**
 * Colour or style swatches: always ONE row. It never wraps; if a phone is too narrow
 * for every swatch, the row scrolls sideways instead.
 */
export function GlassSwatchRow({ children }: { children: ReactNode }) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={styles.swatchScroll}
      contentContainerStyle={styles.swatchRow}>
      {children}
    </ScrollView>
  );
}

const shadow = { textShadowColor: 'rgba(0,0,0,0.6)', textShadowRadius: 5, textShadowOffset: { width: 0, height: 1 } };

const styles = StyleSheet.create({
  glass: {
    backgroundColor: Platform.OS === 'web' ? 'rgba(20,20,22,0.28)' : 'rgba(20,20,22,0.45)',
    borderRadius: 22,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.22)',
  },
  clear: { backgroundColor: 'transparent' },
  row: { flexDirection: 'row', justifyContent: 'center', alignItems: 'flex-start', gap: 14, flexWrap: 'wrap' },
  item: { alignItems: 'center', gap: 5, minWidth: 44 },
  swatchScroll: { flexGrow: 0 },
  swatchRow: { flexGrow: 1, justifyContent: 'center', alignItems: 'flex-start', gap: 10, paddingHorizontal: 4 },
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
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.55)',
  },
  swatchOn: { borderColor: '#fff', borderWidth: 3, transform: [{ scale: 1.12 }] },
  ring: { width: 20, height: 14, borderRadius: 7, borderWidth: 2.5 },
  label: { color: '#fff', fontSize: 11, fontWeight: '600', ...shadow },
});
