/**
 * Direct text editing on the poster. In edit mode every editable piece of text
 * shows a small pencil badge, and the text itself is tappable too; either starts
 * editing that field. The field blanks out (a fresh start, with a blinking caret),
 * the editor focuses a hidden input so only the keyboard appears, and the poster
 * text updates as you type. Outside edit mode this renders just its children.
 */

import Ionicons from '@expo/vector-icons/Ionicons';
import { createContext, useContext, useEffect, type ReactNode } from 'react';
import { Pressable, StyleSheet, View, type FlexAlignType } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withRepeat, withTiming } from 'react-native-reanimated';

/**
 * A text field on the poster. `location` is "City, Country" in one line. Time, pace
 * and distance are edited with a dial instead of the keyboard.
 */
export type TextField =
  | 'title'
  | 'date'
  | 'city'
  | 'country'
  | 'location'
  | 'distance'
  | `name:${number}`
  | `bib:${number}`
  | `time:${number}`
  | `pace:${number}`;

type EditableState = {
  editing: boolean;
  active: TextField | null;
  /** Nothing typed yet in the active field: hide its placeholder, show just the caret. */
  activeEmpty: boolean;
  onEdit: (field: TextField) => void;
};

export const EditableContext = createContext<EditableState>({
  editing: false,
  active: null,
  activeEmpty: false,
  onEdit: () => {},
});

export function useEditing() {
  return useContext(EditableContext).editing;
}

/**
 * Wraps one piece of poster text. The wrapper is always there (so the layout is
 * identical in and out of edit mode); `align` keeps the text where the layout put it.
 */
export function Editable({
  field,
  align = 'flex-start',
  badge = true,
  children,
}: {
  field: TextField;
  align?: FlexAlignType;
  /** False for a second line of the same field (e.g. a two-line title): one badge is enough. */
  badge?: boolean;
  children: ReactNode;
}) {
  const { editing, active, activeEmpty, onEdit } = useContext(EditableContext);
  const isActive = editing && active === field;
  return (
    <Pressable
      // The text itself is a tap target in edit mode, not just the badge.
      disabled={!editing}
      accessibilityRole={editing ? 'button' : undefined}
      onPress={() => onEdit(field)}
      style={[styles.wrap, { alignSelf: align }]}>
      {/* Kept in the layout (so nothing shifts) but hidden while the field is blank. */}
      <View style={isActive && activeEmpty ? styles.hidden : undefined}>{children}</View>
      {isActive && <View style={styles.outline} />}
      {isActive && activeEmpty && <Caret align={align} />}
      {editing && badge && (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Edit ${field.split(':')[0]}`}
          hitSlop={10}
          onPress={() => onEdit(field)}
          style={[styles.badge, active === field && styles.badgeActive]}>
          <Ionicons name="pencil" size={10} color={active === field ? '#fff' : '#111'} />
        </Pressable>
      )}
    </Pressable>
  );
}

/** Blinking caret in a blank field, where the first letter will go. */
function Caret({ align }: { align: FlexAlignType }) {
  const opacity = useSharedValue(1);
  useEffect(() => {
    opacity.set(withRepeat(withTiming(0, { duration: 520 }), -1, true));
  }, [opacity]);
  const style = useAnimatedStyle(() => ({ opacity: opacity.get() }));
  const side = align === 'flex-end' ? { right: 0 } : align === 'center' ? { left: '50%' as const } : { left: 0 };
  return <Animated.View style={[styles.caret, side, style]} />;
}

const styles = StyleSheet.create({
  wrap: { maxWidth: '100%' },
  hidden: { opacity: 0 },
  caret: { position: 'absolute', top: '12%', bottom: '12%', width: 2, borderRadius: 1, backgroundColor: '#F5A623' },
  outline: {
    position: 'absolute',
    top: -3,
    bottom: -3,
    left: -4,
    right: -4,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: '#F5A623',
    borderRadius: 4,
    pointerEvents: 'none',
  },
  badge: {
    position: 'absolute',
    top: -8,
    right: -10,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.4,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 1 },
    elevation: 3,
  },
  badgeActive: { backgroundColor: '#F5A623' },
});

/** Fields edited with a dial (Bencho's scrubber) rather than typed. */
export function isDialField(field: TextField | null): boolean {
  return !!field && (field === 'distance' || field.startsWith('time:') || field.startsWith('pace:'));
}
