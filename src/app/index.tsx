import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppText, Button, Card } from '@/components/ui';
import { Colors, MaxContentWidth, Spacing } from '@/constants/theme';

const STEPS = [
  ['01', 'Pick your runners and a design'],
  ['02', 'Drop in your GPX or connect Strava'],
  ['03', 'Move the route exactly where you want it'],
  ['04', 'Export free, or get it printed, framed and delivered'],
] as const;

export default function Home() {
  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.content}>
        <Animated.View entering={FadeInUp.duration(260)} style={{ gap: Spacing.two }}>
          <AppText variant="mono" style={{ color: Colors.accent }}>
            MILETAG
          </AppText>
          <AppText variant="display">Turn your race into wall art.</AppText>
          <AppText muted>See it before you buy it. Free to design and share.</AppText>
        </Animated.View>

        <Card>
          {STEPS.map(([n, label], i) => (
            <Animated.View
              key={n}
              entering={FadeInUp.delay(80 + i * 60).duration(240)}
              style={styles.step}>
              <AppText variant="mono" muted>
                {n}
              </AppText>
              <AppText style={{ flex: 1 }}>{label}</AppText>
            </Animated.View>
          ))}
        </Card>

        <View style={{ flex: 1 }} />
        <Button label="Create" onPress={() => router.push('/create/runners')} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.background },
  content: {
    flex: 1,
    width: '100%',
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
    padding: Spacing.three,
    paddingTop: Spacing.five,
    gap: Spacing.four,
  },
  step: { flexDirection: 'row', gap: Spacing.three, paddingVertical: Spacing.one },
});
