/**
 * Direct text editing on the poster. In edit mode every editable piece of text
 * shows a small pencil badge; tapping it starts editing that field (the editor
 * focuses a hidden input, so only the keyboard appears and the poster text
 * updates as you type). Outside edit mode this renders just its children.
 */

import Ionicons from '@expo/vector-icons/Ionicons';
import { createContext, useContext, type ReactNode } from 'react';
import { Pressable, StyleSheet, View, type FlexAlignType } from 'react-native';

/** A text field on the poster. `location` is "City, Country" in one line. */
export type TextField =
  | 'title'
  | 'date'
  | 'city'
  | 'country'
  | 'location'
  | 'distance'
  | `name:${number}`
  | `bib:${number}`
  | `time:${number}`;

type EditableState = { editing: boolean; active: TextField | null; onEdit: (field: TextField) => void };

export const EditableContext = createContext<EditableState>({ editing: false, active: null, onEdit: () => {} });

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
  const { editing, active, onEdit } = useContext(EditableContext);
  return (
    <View style={[styles.wrap, { alignSelf: align }]}>
      {children}
      {editing && active === field && <View style={styles.outline} />}
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
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { maxWidth: '100%' },
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
