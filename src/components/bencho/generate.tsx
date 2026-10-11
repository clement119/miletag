/**
 * Native stand-in for Bencho's Generate (generate.web.tsx is the real one; it's DOM,
 * SVG filters and CSS). Same props: a centred pill that runs `onRequest` and hands
 * the picture straight to `onDone`, without the forming animation.
 */

import Ionicons from '@expo/vector-icons/Ionicons';
import { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

import { tap } from '@/components/ui';

import type { GenerateProps } from './generate.web';

export type { GenerateProps } from './generate.web';

export function Generate({ label = 'Generate', onRequest, onDone, src }: GenerateProps) {
  const [busy, setBusy] = useState(false);
  const press = async () => {
    if (busy) return;
    tap();
    setBusy(true);
    try {
      const next = onRequest ? await onRequest() : (src ?? null);
      if (next) onDone?.(next);
    } finally {
      setBusy(false);
    }
  };
  return (
    <View style={styles.root} pointerEvents="box-none">
      <Pressable accessibilityRole="button" accessibilityLabel={label} onPress={press} style={styles.pill}>
        {busy ? <ActivityIndicator color="#111" /> : <Ionicons name="sparkles-outline" size={16} color="#111" />}
        <Text style={styles.label}>{label}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, alignItems: 'center', justifyContent: 'center' },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    height: 42,
    paddingLeft: 16,
    paddingRight: 19,
    borderRadius: 21,
    backgroundColor: 'rgba(255,255,255,0.85)',
  },
  label: { fontSize: 14.5, fontWeight: '500', color: '#111' },
});
