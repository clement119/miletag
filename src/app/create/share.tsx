/**
 * Share, step 1: before the social export, offer the poster printed and framed.
 * The finished design hangs on a wall (lifestyle mockup) in the size and format
 * picked here, with the price. "Yes" goes to the print crop (the editor at the
 * A-series shape) and then to "Get it made"; "No thanks" carries on to the export.
 */

import { Redirect, router } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, useWindowDimensions, View } from 'react-native';

import { FormatMockup } from '@/components/format-mockup';
import { AppText, Button, Chip, Screen } from '@/components/ui';
import { Colors, Spacing } from '@/constants/theme';
import {
  FORMAT_LABEL,
  FORMATS,
  formatRM,
  isFormatAvailable,
  PAPER_SIZES,
  priceFor,
  type Format,
  type PaperSize,
} from '@/domain/catalog';
import { withSamples } from '@/domain/demo';
import { useDesign } from '@/state/design-store';

export default function Share() {
  const { doc, update } = useDesign();
  const { height } = useWindowDimensions();
  const [declined, setDeclined] = useState(false);
  if (!doc) return <Redirect href="/create/runners" />;

  const { size, format } = doc.order;
  const price = priceFor({ size, format, route3d: false, medal: false });
  const setOrder = (patch: Partial<typeof doc.order>) =>
    update((d) => {
      const order = { ...d.order, ...patch };
      // A2 is print only.
      if (!isFormatAvailable(order.size, order.format)) order.format = 'print';
      return { ...d, order };
    });

  return (
    <Screen scroll={false}>
      <FormatMockup doc={withSamples(doc).doc} maxHeight={height * 0.42} />
      <View style={styles.copy}>
        <AppText variant="title">Want it on your wall?</AppText>
        <AppText muted>Printed on 200 gsm fine-art paper with fade-resistant inks, framed and delivered.</AppText>
      </View>
      <View style={styles.row}>
        {PAPER_SIZES.map((s: PaperSize) => (
          <Chip key={s} label={s} selected={s === size} onPress={() => setOrder({ size: s })} />
        ))}
      </View>
      <View style={styles.row}>
        {FORMATS.map((f: Format) => (
          <Chip
            key={f}
            label={FORMAT_LABEL[f]}
            selected={f === format}
            disabled={!isFormatAvailable(size, f)}
            onPress={() => setOrder({ format: f })}
          />
        ))}
      </View>
      <View style={styles.actions}>
        <Button
          label={`Yes, get it made · ${formatRM(price.total)}`}
          // Next: fit the design to the print shape, then frame, add-ons and checkout.
          onPress={() => router.push({ pathname: '/create/editor', params: { fit: 'print' } })}
        />
        <Pressable accessibilityRole="button" onPress={() => setDeclined(true)} hitSlop={8} style={styles.skip}>
          <AppText muted style={styles.skipText}>
            No thanks, just share it
          </AppText>
        </Pressable>
        {declined && (
          // TODO: the watermarked social export (IG post / story / wallpaper) is the next build.
          <AppText variant="caption" style={styles.soon}>
            Sharing to Instagram arrives in the next update.
          </AppText>
        )}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  copy: { gap: Spacing.one },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two },
  actions: { marginTop: 'auto', gap: Spacing.two },
  skip: { alignSelf: 'center', paddingVertical: Spacing.two },
  skipText: { textDecorationLine: 'underline' },
  soon: { textAlign: 'center', color: Colors.accent },
});
