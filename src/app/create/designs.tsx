import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';

import { DesignPreview } from '@/components/design-preview';
import { AppText, Chip, Screen, tap } from '@/components/ui';
import { Colors, Spacing } from '@/constants/theme';
import { designsFor } from '@/domain/catalog';
import { getLook, hasLayout } from '@/domain/design-looks';
import { useDesign } from '@/state/design-store';

type Filter = 'all' | 'medal' | '3d';

const FILTERS: { key: Filter; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'medal', label: 'Medal' },
  { key: '3d', label: '3D-ready' },
];

export default function Designs() {
  const { runnerCount, startDesign } = useDesign();
  const [filter, setFilter] = useState<Filter>('all');

  const designs = designsFor(runnerCount).filter(
    (d) => filter === 'all' || (filter === 'medal' ? d.supportsMedal : d.supports3D),
  );

  return (
    <Screen>
      <View style={styles.row}>
        {FILTERS.map((f) => (
          <Chip key={f.key} label={f.label} selected={f.key === filter} onPress={() => setFilter(f.key)} />
        ))}
      </View>
      {designs.length === 0 && <AppText muted>No designs match this filter.</AppText>}
      <View style={styles.grid}>
        {designs.map((d, i) => (
          <Animated.View key={d.id} entering={FadeInUp.delay(i * 50).duration(220)} style={styles.cell}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`${d.name}. ${d.description}`}
              onPress={() => {
                tap();
                startDesign(d.id);
                router.push('/create/editor');
              }}
              style={({ pressed }) => [styles.card, pressed && styles.pressed]}>
              <DesignPreview design={d} runnerCount={runnerCount} />
              <View style={styles.titleRow}>
                <AppText style={styles.name} numberOfLines={1}>
                  {d.name}
                </AppText>
                {d.supportsMedal && <AppText style={styles.badge}>MEDAL</AppText>}
              </View>
              <AppText variant="caption" numberOfLines={2}>
                {hasLayout(d.id)
                  ? `${getLook(d.id).background === 'photo' ? 'Your photo. ' : 'Map or photo. '}${d.description}`
                  : `Layout in progress. ${d.description}`}
              </AppText>
            </Pressable>
          </Animated.View>
        ))}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', rowGap: Spacing.four },
  cell: { width: '47%' },
  card: { gap: Spacing.one },
  pressed: { opacity: 0.85, transform: [{ scale: 0.98 }] },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two, marginTop: Spacing.one },
  name: { flex: 1, fontWeight: '700' },
  badge: { color: Colors.accent, fontSize: 11, fontWeight: '800', letterSpacing: 1 },
});
