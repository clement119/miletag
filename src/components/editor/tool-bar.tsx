/**
 * Instagram Stories-style tool rail: a column of round icon buttons over the top
 * right of the preview. Tapping one opens its toolkit at the bottom; tapping the
 * open one again closes it.
 */

import Ionicons from '@expo/vector-icons/Ionicons';
import type { ComponentProps } from 'react';
import { Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { tap } from '@/components/ui';

export type ToolItem<T extends string> = {
  id: T;
  label: string;
  icon: ComponentProps<typeof Ionicons>['name'];
  /** Small status dot, e.g. the print-quality traffic light. */
  dot?: string;
};

type Props<T extends string> = {
  tools: readonly ToolItem<T>[];
  /** The open tool, or null when the toolkit is closed. */
  value: T | null;
  onChange: (id: T | null) => void;
  style?: StyleProp<ViewStyle>;
};

export function ToolRail<T extends string>({ tools, value, onChange, style }: Props<T>) {
  return (
    <View style={[styles.rail, style]} accessibilityRole="tablist">
      {tools.map((tool) => {
        const selected = tool.id === value;
        return (
          <Pressable
            key={tool.id}
            accessibilityRole="tab"
            accessibilityState={{ selected }}
            accessibilityLabel={tool.label}
            hitSlop={6}
            onPress={() => {
              tap();
              onChange(selected ? null : tool.id);
            }}
            style={[styles.button, selected && styles.selected]}>
            <Ionicons name={tool.icon} size={20} color={selected ? '#000' : '#fff'} />
            {tool.dot && <View style={[styles.dot, { backgroundColor: tool.dot }]} />}
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  rail: { gap: 10, alignItems: 'center' },
  button: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  selected: { backgroundColor: '#fff' },
  dot: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 11,
    height: 11,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#000',
  },
});
