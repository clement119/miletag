/**
 * Direct text editing on the poster. In edit mode every editable piece of text
 * shows a small pencil badge, and the text itself is tappable too; either starts
 * editing that field. The field blanks out (a fresh start, with a blinking caret),
 * the editor focuses a hidden input so only the keyboard appears, and the poster
 * text updates as you type. Outside edit mode this renders just its children.
 */

import Ionicons from '@expo/vector-icons/Ionicons';
import { createContext, useContext, useEffect, useRef, type ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View, type FlexAlignType, type StyleProp, type TextStyle } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withRepeat, withTiming } from 'react-native-reanimated';

/**
 * A text field on the poster. Every field is its own piece of text, even where a design
 * runs several together on one line (see `InlineFields`). Time, pace and distance are
 * edited with a dial instead of the keyboard.
 */
export type TextField =
  | 'title'
  | 'date'
  | 'city'
  | 'country'
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
  /** Where the tapped field sits on screen, so the editor can zoom to it. */
  onLocate?: (rect: { x: number; y: number; width: number; height: number }) => void;
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
  const { editing, active, activeEmpty, onEdit, onLocate } = useContext(EditableContext);
  const isActive = editing && active === field;
  const ref = useRef<View>(null);
  // Editing starts synchronously in the tap (mobile browsers only open the keyboard then);
  // the position follows, for the zoom.
  const start = () => {
    onEdit(field);
    ref.current?.measureInWindow((x, y, width, height) => onLocate?.({ x, y, width, height }));
  };
  return (
    <Pressable
      ref={ref}
      // The text itself is a tap target in edit mode, not just the badge.
      disabled={!editing}
      accessibilityRole={editing ? 'button' : undefined}
      onPress={start}
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
          onPress={start}
          style={[styles.badge, active === field && styles.badgeActive]}>
          <Ionicons name="pencil" size={10} color={active === field ? '#fff' : '#111'} />
        </Pressable>
      )}
    </Pressable>
  );
}

/** A piece of a one-line run of text: fixed words, or a field the user edits on its own. */
export type InlinePart = string | { text: string; field: TextField };

/**
 * One line of text made of separate fields, e.g. "CITY, COUNTRY" or "PARTICIPANT: NAME |
 * BIB: 123". It reads as one line, but each field is tapped and edited on its own.
 */
export function InlineFields({
  parts,
  style,
  align = 'flex-start',
}: {
  parts: InlinePart[];
  style: StyleProp<TextStyle>;
  align?: FlexAlignType;
}) {
  return (
    <View style={[styles.inline, { alignSelf: align }]}>
      {parts.map((part, i) =>
        typeof part === 'string' ? (
          // Non-breaking spaces: a plain space at the end of a piece would be dropped.
          // Fixed words never squeeze; a long field shrinks instead.
          <Text key={i} numberOfLines={1} style={[style, styles.fixed]}>
            {part.replace(/ /g, '\u00A0')}
          </Text>
        ) : (
          <Editable key={i} field={part.field}>
            <Text numberOfLines={1} style={style}>
              {part.text}
            </Text>
          </Editable>
        ),
      )}
    </View>
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
  fixed: { flexShrink: 0 },
  inline: { flexDirection: 'row', alignItems: 'center', maxWidth: '100%', pointerEvents: 'box-none' },
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
