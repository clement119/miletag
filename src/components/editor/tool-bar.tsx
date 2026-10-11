/**
 * Instagram-style editor toolbar: a row of icon tools along the bottom. The
 * selected tool's panel sits directly above it, so editing never needs scrolling.
 */

import Ionicons from '@expo/vector-icons/Ionicons';
import type { ComponentProps } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { tap } from '@/components/ui';
import { Colors, Spacing } from '@/constants/theme';

export type ToolItem<T extends string> = {
  id: T;
  label: string;
  icon: ComponentProps<typeof Ionicons>['name'];
  /** Small status dot, e.g. the print-quality traffic light. */
  dot?: string;
};

type Props<T extends string> = { tools: readonly ToolItem<T>[]; value: T; onChange: (id: T) => void };

export function ToolBar<T extends string>({ tools, value, onChange }: Props<T>) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={styles.bar}
      contentContainerStyle={styles.row}
      accessibilityRole="tablist">
      {tools.map((tool) => {
        const selected = tool.id === value;
        const colour = selected ? Colors.text : Colors.textMuted;
        return (
          <Pressable
            key={tool.id}
            accessibilityRole="tab"
            accessibilityState={{ selected }}
            accessibilityLabel={tool.label}
            onPress={() => {
              tap();
              onChange(tool.id);
            }}
            style={styles.tool}>
            <View style={[styles.iconWrap, selected && styles.iconSelected]}>
              <Ionicons name={tool.icon} size={20} color={colour} />
              {tool.dot && <View style={[styles.dot, { backgroundColor: tool.dot }]} />}
            </View>
            <Text style={[styles.label, { color: colour }]} numberOfLines={1}>
              {tool.label}
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  // Don't stretch: on web a ScrollView grows to fill its parent.
  bar: { flexGrow: 0 },
  row: { paddingHorizontal: Spacing.two, gap: Spacing.one, flexGrow: 1, justifyContent: 'space-around' },
  tool: { alignItems: 'center', minWidth: 54, paddingVertical: Spacing.one, gap: 4 },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  iconSelected: { borderColor: Colors.text },
  dot: {
    position: 'absolute',
    top: 2,
    right: 2,
    width: 10,
    height: 10,
    borderRadius: 5,
    borderWidth: 2,
    borderColor: Colors.background,
  },
  label: { fontSize: 11, fontWeight: '600' },
});
