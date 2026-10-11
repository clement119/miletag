/**
 * Full-bleed photo layouts, matched to the owner's samples in docs/samples:
 * Big Time, Editorial, Mono Tech and Duo. The photo (or map) and route fill the
 * sheet; text sits on an overlay that lets gestures through to the canvas.
 */

import { StyleSheet, Text, View } from 'react-native';

import { alpha, fitFont, Overlay, PosterFonts, posterData, Sheet, splitTitle, type PosterProps } from './common';

/** Shades of the chosen text colour. */
type Palette = { ink: string; soft: string; rule: string; ghost: string };
const paletteFor = (ink: string): Palette => ({
  ink,
  soft: alpha(ink, 0.82),
  rule: alpha(ink, 0.55),
  ghost: alpha(ink, 0.55),
});

/** Name + bib top-left, two lines top-right. Shared by Big Time and Editorial. */
function TopRow({ w, c, left, right }: { w: number; c: Palette; left: [string, string]; right: [string, string] }) {
  const big = { fontSize: w * 0.036, fontFamily: PosterFonts.medium, color: c.ink };
  const small = { fontSize: w * 0.03, fontFamily: PosterFonts.regular, color: c.soft };
  return (
    <View style={styles.topRow}>
      <View style={styles.flex}>
        <Text numberOfLines={1} style={big}>
          {left[0]}
        </Text>
        <Text numberOfLines={1} style={small}>
          {left[1]}
        </Text>
      </View>
      <View style={[styles.flex, styles.alignEnd]}>
        <Text numberOfLines={1} style={big}>
          {right[0]}
        </Text>
        <Text numberOfLines={1} style={small}>
          {right[1]}
        </Text>
      </View>
    </View>
  );
}

/** Hairline, then label/value columns: left, (centre), right. */
function StatBar({ w, c, stats }: { w: number; c: Palette; stats: { label: string; value: string }[] }) {
  return (
    <View>
      <View style={[{ backgroundColor: c.rule }, { height: Math.max(1, w * 0.0015), marginBottom: w * 0.025 }]} />
      <View style={styles.statRow}>
        {stats.map((s, i) => {
          const align = i === 0 ? 'flex-start' : i === stats.length - 1 ? 'flex-end' : 'center';
          return (
            <View key={s.label} style={[styles.flex, { alignItems: align }]}>
              <Text style={{ fontSize: w * 0.032, fontFamily: PosterFonts.light, color: c.soft }}>{s.label}</Text>
              <Text style={{ fontSize: w * 0.036, fontFamily: PosterFonts.medium, color: c.ink, marginTop: w * 0.006 }}>
                {s.value}
              </Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}

function km(distanceKm: number | undefined): string {
  return distanceKm ? `${Number(distanceKm.toFixed(1))}km` : '0km';
}

/** Big Time (sample: big-time.webp): ghosted oversized finish time over the photo. */
export function BigTime({ doc, aspectRatio, children, footnote }: PosterProps) {
  const p = posterData(doc);
  const c = paletteFor(doc.ink);
  const r = p.runners[0];
  return (
    <Sheet aspectRatio={aspectRatio} style={children ? styles.dark : undefined} footnote={footnote}>
      {(w) => (
        <>
          {children}
          <Overlay style={{ padding: w * 0.08, paddingTop: w * 0.07 }}>
            <TopRow w={w} c={c} left={[r.name, r.bib ? `#${r.bib}` : '']} right={[p.location, p.dateDots]} />
            <View style={[styles.flex, styles.center, { paddingTop: w * 0.55 }]}>
              <Text
                numberOfLines={1}
                style={{
                  fontSize: fitFont(r.time, 0.18, 0.86, 0.6) * w,
                  fontFamily: PosterFonts.semibold,
                  color: c.ghost,
                  letterSpacing: -w * 0.003,
                }}>
                {r.time}
              </Text>
              <View
                style={[
                  {
                    backgroundColor: c.rule,
                    width: w * 0.62,
                    height: Math.max(1, w * 0.0015),
                    marginVertical: w * 0.02,
                  },
                ]}
              />
              <Text
                numberOfLines={1}
                style={{
                  fontSize: fitFont(p.title, 0.05, 0.84, 0.66) * w,
                  fontFamily: PosterFonts.regular,
                  color: c.ink,
                  letterSpacing: w * 0.002,
                }}>
                {p.title.toUpperCase()}
              </Text>
            </View>
            <StatBar
              w={w}
              c={c}
              stats={[
                { label: 'Distance', value: km(p.distanceKm) },
                { label: 'Pace', value: `${r.pace}/km` },
              ]}
            />
          </Overlay>
        </>
      )}
    </Sheet>
  );
}

/** Editorial (sample: editorial.webp): stacked date and race title, bottom stat bar. */
export function Editorial({ doc, aspectRatio, children, footnote }: PosterProps) {
  const p = posterData(doc);
  const c = paletteFor(doc.ink);
  const r = p.runners[0];
  // "LONDON / MARATHON": the second line sits right-aligned.
  const [line1, line2] = splitTitle(p.title.toUpperCase());
  const titleSize = Math.min(fitFont(line1, 0.12, 0.84, 0.66), line2 ? fitFont(line2, 0.12, 0.84, 0.66) : 1);
  // The date never outsizes the title.
  const dateSize = Math.min(0.075, titleSize * 0.7);
  return (
    <Sheet aspectRatio={aspectRatio} style={children ? styles.dark : undefined} footnote={footnote}>
      {(w) => (
        <>
          {children}
          <Overlay style={{ padding: w * 0.08, paddingTop: w * 0.07 }}>
            <TopRow w={w} c={c} left={[r.name, r.bib ? `#${r.bib}` : '']} right={[p.country || p.city, p.year]} />
            <View style={[styles.flex, { justifyContent: 'center', paddingTop: w * 0.12 }]}>
              <View style={styles.dateRow}>
                <View
                  style={[
                    { backgroundColor: c.rule },
                    styles.flex,
                    { height: Math.max(1, w * 0.002), marginRight: w * 0.025 },
                  ]}
                />
                <Text numberOfLines={1} style={[styles.editorialText, { color: c.ink }, { fontSize: w * dateSize }]}>
                  {p.dayMonth.toUpperCase()}
                </Text>
              </View>
              <Text
                numberOfLines={1}
                style={[
                  styles.editorialText,
                  { color: c.ink },
                  { fontSize: titleSize * w, lineHeight: titleSize * w * 1.05 },
                ]}>
                {line1}
              </Text>
              {line2 ? (
                <Text
                  numberOfLines={1}
                  style={[
                    styles.editorialText,
                    { color: c.ink },
                    styles.alignRight,
                    { fontSize: titleSize * w, lineHeight: titleSize * w * 1.05 },
                  ]}>
                  {line2}
                </Text>
              ) : null}
            </View>
            <StatBar
              w={w}
              c={c}
              stats={[
                { label: 'Distance', value: km(p.distanceKm) },
                { label: 'Pace', value: `${r.pace}/km` },
                { label: 'Time', value: r.time },
              ]}
            />
          </Overlay>
        </>
      )}
    </Sheet>
  );
}

/** Mono Tech (sample: mono-tech.png): B&W photo, neon route, monospace text. */
export function MonoTech({ doc, aspectRatio, children, footnote }: PosterProps) {
  const p = posterData(doc);
  const r = p.runners[0];
  const neon = doc.ink;
  const lines = [
    `RACE: ${p.title.toUpperCase()}`,
    `PARTICIPANT: ${r.name.toUpperCase()}${r.bib ? ` | BIB: ${r.bib}` : ''}`,
    `DISTANCE: ${km(p.distanceKm).toUpperCase()} | TIME: ${r.time} | PACE: ${r.pace}/KM`,
  ];
  return (
    <Sheet aspectRatio={aspectRatio} style={children ? styles.dark : undefined} footnote={footnote}>
      {(w) => {
        const mono = {
          fontFamily: PosterFonts.mono,
          color: neon,
          textAlign: 'center' as const,
          letterSpacing: w * 0.002,
        };
        // One size for all three lines so they read as a block; the longest line sets it.
        // Space Mono advances 0.6 em per character, plus the letter spacing.
        const size = Math.min(...lines.map((l) => fitFont(l, 0.026, 0.84, 0.7))) * w;
        return (
          <>
            {children}
            <Overlay style={{ padding: w * 0.08, paddingTop: w * 0.08 }}>
              <Text style={[mono, { fontSize: w * 0.026 }]}>LOCATION:</Text>
              <Text numberOfLines={1} style={[mono, { fontSize: w * 0.026 }]}>
                {(p.location || p.dateDots).toUpperCase()}
              </Text>
              <View style={[styles.flex, { justifyContent: 'flex-end', paddingBottom: w * 0.16, gap: w * 0.006 }]}>
                {lines.map((l) => (
                  <Text key={l} numberOfLines={1} style={[mono, { fontSize: size }]}>
                    {l}
                  </Text>
                ))}
              </View>
              <Text style={[mono, { fontSize: w * 0.022, fontFamily: PosterFonts.monoBold }]}>
                {p.date.toUpperCase()}
              </Text>
            </Overlay>
          </>
        );
      }}
    </Sheet>
  );
}

/** Duo (sample: duo.webp): two runners, names and times in columns under a big title. */
export function Duo({ doc, aspectRatio, children, footnote }: PosterProps) {
  const p = posterData(doc);
  const c = paletteFor(doc.ink);
  const [a, b] = p.runners;
  const [line1, line2] = splitTitle(p.title.toUpperCase());
  const titleSize = Math.min(fitFont(line1, 0.12, 0.84, 0.68), line2 ? fitFont(line2, 0.12, 0.84, 0.68) : 1);
  const column = (r: (typeof p.runners)[number] | undefined, right: boolean, w: number) =>
    r ? (
      <View style={[styles.flex, right && styles.alignEnd]}>
        <Text numberOfLines={1} style={{ fontSize: w * 0.034, fontFamily: PosterFonts.light, color: c.soft }}>
          {r.name}
        </Text>
        <Text style={{ fontSize: w * 0.075, fontFamily: PosterFonts.medium, color: c.ink, letterSpacing: -w * 0.001 }}>
          {r.time}
        </Text>
        <Text style={{ fontSize: w * 0.03, fontFamily: PosterFonts.regular, color: c.soft }}>{r.pace}/km</Text>
      </View>
    ) : null;

  return (
    <Sheet aspectRatio={aspectRatio} style={children ? styles.dark : undefined} footnote={footnote}>
      {(w) => (
        <>
          {children}
          <Overlay style={{ padding: w * 0.08, paddingTop: w * 0.07 }}>
            <View style={styles.topRow}>
              <View style={styles.flex}>
                <Text numberOfLines={1} style={{ fontSize: w * 0.036, fontFamily: PosterFonts.medium, color: c.ink }}>
                  {p.city}
                </Text>
                <Text numberOfLines={1} style={{ fontSize: w * 0.03, fontFamily: PosterFonts.regular, color: c.soft }}>
                  {p.country}
                </Text>
              </View>
              <View style={[styles.flex, styles.alignEnd]}>
                <Text numberOfLines={1} style={{ fontSize: w * 0.036, fontFamily: PosterFonts.medium, color: c.ink }}>
                  {p.dayMonth}
                </Text>
                <Text numberOfLines={1} style={{ fontSize: w * 0.03, fontFamily: PosterFonts.regular, color: c.soft }}>
                  {p.year}
                </Text>
              </View>
            </View>
            <View style={[styles.flex, { justifyContent: 'flex-end' }]}>
              {[line1, line2].filter(Boolean).map((l) => (
                <Text
                  key={l}
                  numberOfLines={1}
                  style={{
                    fontSize: titleSize * w,
                    lineHeight: titleSize * w * 1.02,
                    fontFamily: PosterFonts.semibold,
                    color: alpha(doc.ink, 0.85),
                  }}>
                  {l}
                </Text>
              ))}
              <View
                style={[{ backgroundColor: c.rule }, { height: Math.max(1, w * 0.0015), marginVertical: w * 0.015 }]}
              />
              <View style={styles.statRow}>
                {column(a, false, w)}
                {column(b, true, w)}
              </View>
            </View>
          </Overlay>
        </>
      )}
    </Sheet>
  );
}

const styles = StyleSheet.create({
  dark: { backgroundColor: '#1A1A1C' },
  flex: { flex: 1 },
  center: { alignItems: 'center', justifyContent: 'center' },
  alignEnd: { alignItems: 'flex-end' },
  alignRight: { textAlign: 'right' },
  topRow: { flexDirection: 'row', gap: 12 },
  statRow: { flexDirection: 'row' },
  dateRow: { flexDirection: 'row', alignItems: 'center' },
  editorialText: { fontFamily: PosterFonts.regular },
});
