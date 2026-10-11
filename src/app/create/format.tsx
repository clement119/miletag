import { Redirect } from 'expo-router';
import { ScrollView, StyleSheet, TextInput, useWindowDimensions, View } from 'react-native';

import { FormatMockup } from '@/components/format-mockup';
import { getPhotoQuality, PhotoQualityNotice } from '@/components/photo-quality';
import { AppText, Button, Card, Chip, Screen } from '@/components/ui';
import { Colors, Radius, Spacing } from '@/constants/theme';
import {
  canAdd3D,
  canAddMedal,
  checkMedalFit,
  FILAMENT_COLOURS,
  FORMAT_LABEL,
  FORMATS,
  formatRM,
  FRAME_COLOURS,
  getDesign,
  isFormatAvailable,
  PAPER_SIZES,
  priceFor,
  unavailableReason,
  type FilamentColour,
  type Format,
  type PaperSize,
} from '@/domain/catalog';
import { withSamples } from '@/domain/demo';
import { useDesign } from '@/state/design-store';

export default function FormatPicker() {
  const { doc, update } = useDesign();
  const { height: screenH } = useWindowDimensions();
  if (!doc) return <Redirect href="/create/runners" />;
  const design = getDesign(doc.designId);
  if (!design) return <Redirect href="/create/designs" />;

  const { size, format, route3d, medal } = doc.order;
  const allow3D = design.supports3D && canAdd3D(size, format);
  const allowMedal = canAddMedal(size, format, design);
  const fit = medal.enabled && allowMedal && medal.diameterMm ? checkMedalFit(size, medal.diameterMm) : null;
  const price = priceFor({ size, format, route3d: route3d.enabled && allow3D, medal: medal.enabled && allowMedal });

  const setOrder = (patch: Partial<typeof doc.order>) =>
    update((d) => {
      const order = { ...d.order, ...patch };
      // Keep the order valid when size changes make the format or add-ons unavailable.
      if (!isFormatAvailable(order.size, order.format)) order.format = 'print';
      if (!canAdd3D(order.size, order.format)) order.route3d = { ...order.route3d, enabled: false };
      if (!canAddMedal(order.size, order.format, design)) order.medal = { ...order.medal, enabled: false };
      return { ...d, order };
    });

  return (
    <Screen scroll={false}>
      {/* The finished poster on a wall, in the chosen size, format and frame colour. Pinned
          above the options so every change shows straight away. */}
      <FormatMockup doc={withSamples(doc).doc} maxHeight={screenH * 0.42} />
      <ScrollView style={styles.options} contentContainerStyle={styles.optionsContent}>
        <Card>
          <AppText variant="title">Size</AppText>
          <View style={styles.row}>
            {PAPER_SIZES.map((s: PaperSize) => (
              <Chip key={s} label={s} selected={s === size} onPress={() => setOrder({ size: s })} />
            ))}
          </View>
          <PhotoQualityNotice
            doc={doc}
            onAcknowledge={(lowResAckDpi) =>
              update((d) =>
                d.background.type === 'photo' ? { ...d, background: { ...d.background, lowResAckDpi } } : d,
              )
            }
          />
        </Card>

        <Card>
          <AppText variant="title">Format</AppText>
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
          {size === 'A2' && <AppText variant="caption">{unavailableReason('A2', 'framed')}</AppText>}
          {format !== 'print' && (
            <View style={styles.row}>
              {FRAME_COLOURS.map((c) => (
                <Chip
                  key={c}
                  label={c[0].toUpperCase() + c.slice(1)}
                  selected={c === doc.order.frame}
                  onPress={() => setOrder({ frame: c })}
                />
              ))}
            </View>
          )}
        </Card>

        <Card>
          <AppText variant="title">3D raised route</AppText>
          {allow3D ? (
            <>
              <View style={styles.row}>
                <Chip
                  label={route3d.enabled ? 'Added' : 'Add'}
                  selected={route3d.enabled}
                  onPress={() => setOrder({ route3d: { ...route3d, enabled: !route3d.enabled } })}
                />
              </View>
              {route3d.enabled && (
                <View style={styles.row}>
                  {(Object.keys(FILAMENT_COLOURS) as FilamentColour[]).map((c) => (
                    <Chip
                      key={c}
                      label={FILAMENT_COLOURS[c].label}
                      selected={c === route3d.color}
                      onPress={() => setOrder({ route3d: { ...route3d, color: c } })}
                    />
                  ))}
                </View>
              )}
            </>
          ) : (
            <AppText variant="caption">Available with a Deep Frame on A4 and A3.</AppText>
          )}
        </Card>

        {design.supportsMedal && (
          <Card>
            <AppText variant="title">Medal slot</AppText>
            {allowMedal ? (
              <>
                <View style={styles.row}>
                  <Chip
                    label={medal.enabled ? 'Added' : 'Add'}
                    selected={medal.enabled}
                    onPress={() => setOrder({ medal: { ...medal, enabled: !medal.enabled } })}
                  />
                </View>
                {medal.enabled && (
                  <>
                    <TextInput
                      placeholder="Medal diameter (mm)"
                      placeholderTextColor={Colors.textMuted}
                      keyboardType="number-pad"
                      value={medal.diameterMm ? String(medal.diameterMm) : ''}
                      onChangeText={(t) => {
                        const n = Number(t.replace(/\D/g, ''));
                        setOrder({ medal: { ...medal, diameterMm: n > 0 ? n : undefined } });
                      }}
                      style={styles.input}
                    />
                    {fit && !fit.ok && (
                      <AppText style={{ color: Colors.danger }}>
                        {fit.reason}
                        {fit.suggestSize ? ` Try ${fit.suggestSize}.` : ''}
                      </AppText>
                    )}
                    <AppText variant="caption">You put your own medal in. It opens from the back.</AppText>
                  </>
                )}
              </>
            ) : (
              <AppText variant="caption">Available with a Deep Frame on A4 and A3.</AppText>
            )}
          </Card>
        )}

        <Card>
          <AppText variant="title">{formatRM(price.total)}</AppText>
          <AppText variant="caption">
            {FORMAT_LABEL[format]} {size} {formatRM(price.base)}
            {price.route3d ? ` · 3D route ${formatRM(price.route3d)}` : ''}
            {price.medal ? ` · Medal slot ${formatRM(price.medal)}` : ''}
            {price.discount ? ` · Bundle −${formatRM(price.discount)}` : ''}
          </AppText>
        </Card>

        <Button
          label="Continue to checkout"
          disabled={(fit !== null && !fit.ok) || !!getPhotoQuality(doc)?.blocked}
          onPress={() => {
            // Checkout (address + MY payment methods) is the next build step.
          }}
        />
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  options: { flex: 1, marginHorizontal: -Spacing.three, marginBottom: -Spacing.three },
  optionsContent: { padding: Spacing.three, paddingTop: 0, gap: Spacing.three },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two },
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
