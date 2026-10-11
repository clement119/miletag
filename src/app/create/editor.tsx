import { Redirect, router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, TextInput, View } from 'react-native';

import { RouteCanvas } from '@/components/route-canvas';
import { AppText, Button, Card, Screen } from '@/components/ui';
import { Colors, Radius, Spacing } from '@/constants/theme';
import { getDesign, PAPER_MM } from '@/domain/catalog';
import { formatDuration, formatPace, parseDuration } from '@/domain/race';
import { GpxParseError } from '@/domain/route/gpx';
import { pickGpxRoute } from '@/domain/route/import-gpx';
import { useDesign } from '@/state/design-store';

export default function Editor() {
  const { doc, update } = useDesign();
  const [error, setError] = useState<string | null>(null);
  const [timeText, setTimeText] = useState<Record<number, string>>({});

  if (!doc) return <Redirect href="/create/runners" />;
  const design = getDesign(doc.designId);
  const paper = PAPER_MM[doc.order.size];
  const aspect = design?.orientation === 'landscape' ? paper.h / paper.w : paper.w / paper.h;

  const importGpx = async () => {
    setError(null);
    try {
      const route = await pickGpxRoute();
      if (!route) return;
      update((d) => ({
        ...d,
        route: { ...d.route, points: route.points },
        runners: d.runners.map((r, i) =>
          i === 0
            ? {
                ...r,
                distanceKm: r.distanceKm ?? Math.round(route.distanceKm * 100) / 100,
                timeSeconds: r.timeSeconds ?? route.elapsedSeconds,
              }
            : r,
        ),
      }));
    } catch (e) {
      setError(e instanceof GpxParseError ? e.message : 'Could not read that file.');
    }
  };

  const setRunner = (index: number, patch: Partial<(typeof doc.runners)[number]>) =>
    update((d) => ({ ...d, runners: d.runners.map((r, i) => (i === index ? { ...r, ...patch } : r)) }));

  return (
    <Screen>
      <AppText variant="caption">{design?.name}</AppText>

      <View style={styles.poster}>
        <RouteCanvas
          points={doc.route.points}
          transform={doc.route.transform}
          strokeColor={doc.route.stroke.color}
          aspectRatio={aspect}
          onTransformEnd={(transform) => update((d) => ({ ...d, route: { ...d.route, transform } }))}
        />
        {doc.text.title !== '' && (
          <AppText style={styles.posterTitle} numberOfLines={1}>
            {doc.text.title.toUpperCase()}
          </AppText>
        )}
      </View>
      <AppText variant="caption">Drag to move · pinch to resize · twist to rotate · double-tap to reset</AppText>

      {error && <AppText style={{ color: Colors.danger }}>{error}</AppText>}
      <Button
        label={doc.route.points ? 'Replace GPX route' : 'Upload GPX route'}
        variant={doc.route.points ? 'secondary' : 'primary'}
        onPress={importGpx}
      />

      <Card>
        <AppText variant="title">Race</AppText>
        <TextInput
          placeholder="Race name, e.g. KL Marathon"
          placeholderTextColor={Colors.textMuted}
          value={doc.text.title}
          onChangeText={(title) => update((d) => ({ ...d, text: { ...d.text, title } }))}
          style={styles.input}
        />
        <TextInput
          placeholder="Date, e.g. 5 October 2026"
          placeholderTextColor={Colors.textMuted}
          value={doc.text.subtitle}
          onChangeText={(subtitle) => update((d) => ({ ...d, text: { ...d.text, subtitle } }))}
          style={styles.input}
        />
      </Card>

      {doc.runners.map((runner, i) => {
        const shownTime = timeText[i] ?? (runner.timeSeconds ? formatDuration(runner.timeSeconds) : '');
        return (
          <Card key={i}>
            <AppText variant="title">Runner {doc.runners.length > 1 ? i + 1 : ''}</AppText>
            <TextInput
              placeholder="Name"
              placeholderTextColor={Colors.textMuted}
              value={runner.name}
              onChangeText={(name) => setRunner(i, { name })}
              style={styles.input}
            />
            <TextInput
              placeholder="Bib (optional)"
              placeholderTextColor={Colors.textMuted}
              value={runner.bib ?? ''}
              onChangeText={(bib) => setRunner(i, { bib })}
              style={styles.input}
            />
            <TextInput
              placeholder="Chip time hh:mm:ss"
              placeholderTextColor={Colors.textMuted}
              value={shownTime}
              onChangeText={(text) => {
                setTimeText((t) => ({ ...t, [i]: text }));
                const seconds = parseDuration(text);
                if (seconds !== undefined) setRunner(i, { timeSeconds: seconds });
              }}
              style={styles.input}
            />
            {runner.timeSeconds && runner.distanceKm ? (
              <AppText variant="mono" muted>
                {runner.distanceKm} KM · {formatPace(runner.timeSeconds, runner.distanceKm)}
              </AppText>
            ) : null}
          </Card>
        );
      })}

      <Button
        label="Get it made"
        disabled={!doc.route.points}
        onPress={() => router.push('/create/format')}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  poster: {
    backgroundColor: '#F4F2EE',
    padding: Spacing.three,
    borderRadius: Radius.sm,
    gap: Spacing.two,
  },
  posterTitle: { color: '#111', fontWeight: '800', fontSize: 18, letterSpacing: 1 },
  input: {
    backgroundColor: Colors.surfaceRaised,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    color: Colors.text,
    paddingHorizontal: Spacing.three,
    paddingVertical: 12,
    fontSize: 16,
  },
});
