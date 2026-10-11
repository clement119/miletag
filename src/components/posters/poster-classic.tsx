/**
 * Poster Classic (PRD §7.1): title and date on top, a square map or photo,
 * then the runner's name, bib and three stats. All sizes are fractions of the
 * poster width so the preview scales exactly like the printed sheet.
 */

import { useState, type ReactNode } from 'react';
import { StyleSheet, Text, View, type LayoutChangeEvent } from 'react-native';

import { Fonts } from '@/constants/theme';
import type { DesignDocument } from '@/domain/design-document';
import { POSTER_CLASSIC_SQUARE } from '@/domain/photo';
import { formatDuration, formatPace } from '@/domain/race';

const PAPER = '#F4F2EE';
const INK = '#111111';
const INK_MUTED = '#77746D';
const PLACEHOLDER = '#BDB9B0';

type Props = {
  doc: DesignDocument;
  /** Width / height of the sheet. */
  aspectRatio: number;
  /** The square map or photo. */
  children: ReactNode;
  /** Small print in the image corner, e.g. map attribution. */
  footnote?: string;
};

export function PosterClassic({ doc, aspectRatio, children, footnote }: Props) {
  const [w, setW] = useState(0);
  const onLayout = (e: LayoutChangeEvent) => setW(e.nativeEvent.layout.width);

  const runner = doc.runners[0];
  const margin = w * ((1 - POSTER_CLASSIC_SQUARE) / 2);
  const inner = POSTER_CLASSIC_SQUARE;
  const stats = [
    { label: 'DISTANCE', value: runner?.distanceKm ? `${runner.distanceKm.toFixed(2)} KM` : '' },
    { label: 'TIME', value: runner?.timeSeconds ? formatDuration(runner.timeSeconds) : '' },
    {
      label: 'PACE',
      value: runner?.timeSeconds && runner.distanceKm ? formatPace(runner.timeSeconds, runner.distanceKm) : '',
    },
  ];

  return (
    <View
      onLayout={onLayout}
      style={[styles.sheet, { aspectRatio, paddingHorizontal: margin, paddingTop: margin * 0.7 }]}>
      {w > 0 && (
        <>
          <Field
            value={doc.text.title.toUpperCase()}
            placeholder="RACE NAME"
            style={{ fontSize: fitFont(doc.text.title, 0.072, inner) * w, fontWeight: '900', letterSpacing: w * 0.002 }}
          />
          <Field
            value={doc.text.subtitle.toUpperCase()}
            placeholder="RACE DATE"
            style={{ fontSize: w * 0.03, letterSpacing: w * 0.004, marginTop: w * 0.012, color: INK_MUTED }}
          />

          <View style={[styles.square, { marginTop: w * 0.035 }]}>
            {children}
            {/* In the corner of the image, like map apps: takes no layout space. */}
            {footnote ? (
              <Text
                pointerEvents="none"
                numberOfLines={1}
                style={[styles.footnote, { fontSize: w * 0.013, paddingHorizontal: w * 0.006 }]}>
                {footnote}
              </Text>
            ) : null}
          </View>

          <View style={[styles.bottom, { paddingBottom: margin * 0.7 }]}>
            <Field
              value={runner?.name.toUpperCase() ?? ''}
              placeholder="YOUR NAME"
              style={{
                fontSize: fitFont(runner?.name ?? '', 0.058, inner) * w,
                fontWeight: '800',
                letterSpacing: w * 0.002,
              }}
            />
            <Field
              value={runner?.bib ? `BIB ${runner.bib}` : ''}
              placeholder="BIB"
              style={{ fontSize: w * 0.026, letterSpacing: w * 0.004, color: INK_MUTED, marginTop: w * 0.006 }}
            />
            <View
              style={[
                styles.stats,
                { marginTop: w * 0.025, borderTopWidth: Math.max(1, w * 0.002), paddingTop: w * 0.02 },
              ]}>
              {stats.map((s) => (
                <View key={s.label} style={styles.stat}>
                  <Text style={[styles.statLabel, { fontSize: w * 0.02, letterSpacing: w * 0.003 }]}>{s.label}</Text>
                  <Field
                    value={s.value}
                    placeholder="–"
                    mono
                    style={{ fontSize: w * 0.04, fontWeight: '700', marginTop: w * 0.006 }}
                  />
                </View>
              ))}
            </View>
          </View>
        </>
      )}
    </View>
  );
}

/**
 * One-line text that shrinks to fit the column instead of wrapping, so the
 * layout (and the print) never reflows. Sizes are fractions of the sheet width.
 */
function fitFont(text: string, max: number, columnWidth: number): number {
  // Heavy uppercase averages ~0.8 em per character (with letter spacing); err on the small side.
  const chars = Math.max(1, text.trim().length);
  return Math.min(max, columnWidth / (chars * 0.8));
}

function Field({
  value,
  placeholder,
  style,
  mono,
}: {
  value: string;
  placeholder: string;
  style: object;
  mono?: boolean;
}) {
  const empty = value.trim() === '';
  return (
    <Text
      numberOfLines={1}
      style={[styles.text, mono && { fontFamily: Fonts?.mono }, style, empty && { color: PLACEHOLDER }]}>
      {empty ? placeholder : value}
    </Text>
  );
}

const styles = StyleSheet.create({
  sheet: { width: '100%', backgroundColor: PAPER, borderRadius: 4, overflow: 'hidden' },
  square: { width: '100%', aspectRatio: 1, overflow: 'hidden' },
  footnote: { position: 'absolute', right: 0, bottom: 0, color: '#333', backgroundColor: 'rgba(255,255,255,0.7)' },
  bottom: { flex: 1, justifyContent: 'flex-end' },
  text: { color: INK, fontFamily: Fonts?.sans },
  stats: { flexDirection: 'row', borderTopColor: INK },
  stat: { flex: 1 },
  statLabel: { color: INK_MUTED, fontFamily: Fonts?.sans, fontWeight: '600' },
});
