import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { AppText, Button, Chip, Screen } from '@/components/ui';
import { Spacing } from '@/constants/theme';
import { designsFor, RUNNER_COUNTS } from '@/domain/catalog';
import { useDesign } from '@/state/design-store';

export default function Runners() {
  const { runnerCount, setRunnerCount } = useDesign();
  const available = designsFor(runnerCount).length;

  return (
    <Screen>
      <AppText variant="title">How many runners?</AppText>
      <AppText muted>
        Crew designs fit up to 6. With medal designs, each runner orders their own copy for their own
        medal.
      </AppText>
      <View style={styles.row}>
        {RUNNER_COUNTS.map((n) => (
          <Chip key={n} label={String(n)} selected={n === runnerCount} onPress={() => setRunnerCount(n)} />
        ))}
      </View>
      <AppText variant="caption">
        {available} design{available === 1 ? '' : 's'} for {runnerCount} runner{runnerCount === 1 ? '' : 's'}
      </AppText>
      <View style={{ flex: 1 }} />
      <Button label="See designs" onPress={() => router.push('/create/designs')} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two },
});
