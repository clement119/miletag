/**
 * Poster Classic (sample: docs/samples/poster-classic.png). Condensed title and
 * date on top, a square map or photo, then name + bib and three stats aligned
 * right under a rule.
 */

import { StyleSheet, Text, View } from 'react-native';

import { getLook } from '@/domain/design-looks';
import { POSTER_CLASSIC_SQUARE } from '@/domain/photo';

import { alpha, fitFont, PosterFonts, posterData, Sheet, type PosterProps } from './common';
import { Editable } from './editable';

export function PosterClassic({ doc, aspectRatio, children, footnote }: PosterProps) {
  const p = posterData(doc);
  const runner = p.runners[0];
  const ink = { color: doc.ink };
  const muted = { color: alpha(doc.ink, 0.72) };
  const stats = [
    { value: p.distanceKm ? p.distanceKm.toFixed(2) : '0.00', label: 'KM', field: 'distance' as const },
    { value: runner.time, label: 'TIME', field: 'time:0' as const },
    { value: runner.pace, label: '/KM', field: undefined },
  ];

  return (
    <Sheet aspectRatio={aspectRatio} style={{ backgroundColor: getLook(doc.designId).paper ?? undefined }}>
      {(w) => {
        const margin = w * ((1 - POSTER_CLASSIC_SQUARE) / 2);
        const inner = POSTER_CLASSIC_SQUARE;
        const nameLine = `${runner.name}${runner.bib ? `#${runner.bib}` : ''}`;
        const nameSize = fitFont(nameLine, 0.05, inner * 0.75, 0.5) * w;
        return (
          <View style={[styles.fill, { paddingHorizontal: margin, paddingTop: margin * 0.85 }]}>
            <Editable field="title">
              <Text
                numberOfLines={1}
                style={[
                  styles.title,
                  ink,
                  { fontSize: fitFont(p.title, 0.085, inner, 0.5) * w, letterSpacing: w * 0.003 },
                ]}>
                {p.title.toUpperCase()}
              </Text>
            </Editable>
            <Editable field="date">
              <Text numberOfLines={1} style={[styles.date, muted, { fontSize: w * 0.034, letterSpacing: w * 0.002 }]}>
                {p.date.toUpperCase()}
              </Text>
            </Editable>

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
              {/* Name and bib share one size (set by the combined line) but are edited separately. */}
              <View style={styles.nameRow}>
                <Editable field="name:0">
                  <Text numberOfLines={1} style={[styles.name, ink, { fontSize: nameSize, letterSpacing: w * 0.002 }]}>
                    {runner.name.toUpperCase()}
                  </Text>
                </Editable>
                <Editable field="bib:0">
                  <Text numberOfLines={1} style={[styles.bib, muted, { fontSize: nameSize, letterSpacing: w * 0.002, marginLeft: nameSize * 0.3 }]}>
                    {runner.bib ? `#${runner.bib}` : ''}
                  </Text>
                </Editable>
              </View>
              <View
                style={[
                  { backgroundColor: doc.ink },
                  { width: inner * w * 0.62, height: Math.max(1, w * 0.003), marginVertical: w * 0.012 },
                ]}
              />
              <View style={[styles.stats, { gap: w * 0.06 }]}>
                {stats.map((s) => (
                  <View key={s.label} style={styles.stat}>
                    {s.field ? (
                      <Editable field={s.field} align="center">
                        <Text style={[styles.statValue, ink, { fontSize: w * 0.045 }]}>{s.value}</Text>
                      </Editable>
                    ) : (
                      <Text style={[styles.statValue, ink, { fontSize: w * 0.045 }]}>{s.value}</Text>
                    )}
                    <Text style={[styles.statLabel, muted, { fontSize: w * 0.019, letterSpacing: w * 0.002 }]}>
                      {s.label}
                    </Text>
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
  title: { fontFamily: PosterFonts.condensedBold },
  date: { fontFamily: PosterFonts.condensed },
  square: { width: '100%', aspectRatio: 1, overflow: 'hidden' },
  footnote: { position: 'absolute', right: 0, bottom: 0, color: '#333', backgroundColor: 'rgba(255,255,255,0.7)' },
  bottom: { flex: 1, justifyContent: 'flex-end', alignItems: 'flex-end' },
  name: { fontFamily: PosterFonts.condensedBold },
  bib: { fontFamily: PosterFonts.condensed },
  stats: { flexDirection: 'row' },
  nameRow: { flexDirection: 'row', alignItems: 'baseline' },
  stat: { alignItems: 'center' },
  statValue: { fontFamily: PosterFonts.condensedBold },
  statLabel: { fontFamily: PosterFonts.condensed },
});
