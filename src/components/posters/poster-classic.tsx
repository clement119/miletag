/**
 * Poster Classic (sample: docs/samples/poster-classic.png). Condensed title and
 * date on top, a square map or photo, then name + bib and three stats aligned
 * right under a rule.
 */

import { StyleSheet, Text, View } from 'react-native';

import { POSTER_CLASSIC_SQUARE } from '@/domain/photo';

import { fitFont, PosterFonts, posterData, Sheet, type PosterProps } from './common';

const PAPER = '#FAFAF7';
const INK = '#141414';
const INK_MUTED = '#55524C';

export function PosterClassic({ doc, aspectRatio, children, footnote }: PosterProps) {
  const p = posterData(doc);
  const runner = p.runners[0];
  const stats = [
    { value: p.distanceKm ? p.distanceKm.toFixed(2) : '0.00', label: 'KM' },
    { value: runner.time, label: 'TIME' },
    { value: runner.pace, label: '/KM' },
  ];

  return (
    <Sheet aspectRatio={aspectRatio} style={{ backgroundColor: PAPER }}>
      {(w) => {
        const margin = w * ((1 - POSTER_CLASSIC_SQUARE) / 2);
        const inner = POSTER_CLASSIC_SQUARE;
        const nameLine = `${runner.name}${runner.bib ? ` #${runner.bib}` : ''}`;
        return (
          <View style={[styles.fill, { paddingHorizontal: margin, paddingTop: margin * 0.85 }]}>
            <Text
              numberOfLines={1}
              style={[styles.title, { fontSize: fitFont(p.title, 0.085, inner, 0.5) * w, letterSpacing: w * 0.003 }]}>
              {p.title.toUpperCase()}
            </Text>
            <Text numberOfLines={1} style={[styles.date, { fontSize: w * 0.034, letterSpacing: w * 0.002 }]}>
              {p.date.toUpperCase()}
            </Text>

            <View style={[styles.square, { marginTop: w * 0.025 }]}>
              {children}
              {/* In the corner of the image, like map apps: takes no layout space. */}
              {footnote ? (
                <Text
                  numberOfLines={1}
                  style={[styles.footnote, { fontSize: w * 0.013, paddingHorizontal: w * 0.006 }]}>
                  {footnote}
                </Text>
              ) : null}
            </View>

            <View style={[styles.bottom, { paddingBottom: margin * 0.85 }]}>
              <Text
                numberOfLines={1}
                style={[
                  styles.name,
                  { fontSize: fitFont(nameLine, 0.05, inner * 0.75, 0.5) * w, letterSpacing: w * 0.002 },
                ]}>
                {runner.name.toUpperCase()}
                {runner.bib ? <Text style={styles.bib}>{` #${runner.bib}`}</Text> : null}
              </Text>
              <View
                style={[
                  styles.rule,
                  { width: inner * w * 0.62, height: Math.max(1, w * 0.003), marginVertical: w * 0.012 },
                ]}
              />
              <View style={[styles.stats, { gap: w * 0.06 }]}>
                {stats.map((s) => (
                  <View key={s.label} style={styles.stat}>
                    <Text style={[styles.statValue, { fontSize: w * 0.045 }]}>{s.value}</Text>
                    <Text style={[styles.statLabel, { fontSize: w * 0.019, letterSpacing: w * 0.002 }]}>{s.label}</Text>
                  </View>
                ))}
              </View>
            </View>
          </View>
        );
      }}
    </Sheet>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  title: { color: INK, fontFamily: PosterFonts.condensedBold },
  date: { color: INK_MUTED, fontFamily: PosterFonts.condensed },
  square: { width: '100%', aspectRatio: 1, overflow: 'hidden' },
  footnote: { position: 'absolute', right: 0, bottom: 0, color: '#333', backgroundColor: 'rgba(255,255,255,0.7)' },
  bottom: { flex: 1, justifyContent: 'flex-end', alignItems: 'flex-end' },
  name: { color: INK, fontFamily: PosterFonts.condensedBold },
  bib: { color: INK_MUTED, fontFamily: PosterFonts.condensed },
  rule: { backgroundColor: INK },
  stats: { flexDirection: 'row' },
  stat: { alignItems: 'center' },
  statValue: { color: INK, fontFamily: PosterFonts.condensedBold },
  statLabel: { color: INK_MUTED, fontFamily: PosterFonts.condensed },
});
