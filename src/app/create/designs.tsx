import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';

import { AppText, Card, Chip, Screen, tap } from '@/components/ui';
import { Colors, Spacing } from '@/constants/theme';
import { designsFor } from '@/domain/catalog';
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
      {designs.map((d, i) => (
        <Animated.View key={d.id} entering={FadeInUp.delay(i * 50).duration(220)}>
          <Pressable
            accessibilityRole="button"
            onPress={() => {
              tap();
              startDesign(d.id);
              router.push('/create/editor');
            }}>
            <Card>
              <View style={styles.titleRow}>
                <AppText variant="title" style={{ flex: 1 }}>
                  {d.name}
                </AppText>
                {d.supportsMedal && <AppText style={styles.badge}>MEDAL</AppText>}
              </View>
              <AppText muted>{d.description}</AppText>
            </Card>
          </Pressable>
        </Animated.View>
      ))}
    </Screen>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  badge: {
    color: Colors.accent,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1,
  },
});
