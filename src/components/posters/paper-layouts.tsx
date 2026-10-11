/**
 * Miletag's own paper designs (no outside sample): Race Bib, Swiss and Headline.
 * Text on a plain sheet with the map or photo in a window (`look.slot`). Like the
 * other layouts, every size is a fraction of the sheet width `w`, text is one line
 * per field and shrinks to fit, and every field is its own tap target.
 */

import { StyleSheet, Text, View } from 'react-native';

import { getLook } from '@/domain/design-looks';

import { alpha, fitFont, PosterFonts, posterData, Sheet, type PosterProps } from './common';
import { Editable, InlineFields } from './editable';

const km = (distanceKm: number | undefined) => (distanceKm ? `${Number(distanceKm.toFixed(1))}` : '0');

/** The map/photo window: the design's slot aspect, centred; map credit in its corner. */
function Window({
  designId,
  w,
  footnote,
  children,
}: {
  designId: string;
  w: number;
  footnote?: string;
  children?: React.ReactNode;
}) {
  const slot = getLook(designId).slot;
  const box = typeof slot === 'object' ? slot : { aspect: 1, width: 0.8 };
  return (
    <View style={[styles.window, { width: box.width * w, aspectRatio: box.aspect }]}>
      {children}
      {footnote ? (
        <Text numberOfLines={1} style={[styles.footnote, { fontSize: w * 0.013, paddingHorizontal: w * 0.006 }]}>
          {footnote}
        </Text>
      ) : null}
    </View>
  );
}

/**
 * Race Bib: the poster is the bib. A colour band with the race, the bib number as big
 * as it goes, the name under it, pin holes in the corners, and the route along the bottom.
 */
export function RaceBib({ doc, aspectRatio, children, footnote }: PosterProps) {
  const p = posterData(doc);
  const r = p.runners[0];
  const ink = doc.ink;
  const look = getLook(doc.designId);
  const number = r.bib || '000';
  return (
    <Sheet aspectRatio={aspectRatio} style={{ backgroundColor: look.paper ?? undefined }}>
      {(w) => {
        const pad = w * 0.06;
        const hole = w * 0.032;
        const holes = [
          { left: pad * 0.6, top: pad * 0.6 },
          { right: pad * 0.6, top: pad * 0.6 },
          { left: pad * 0.6, bottom: pad * 0.6 },
          { right: pad * 0.6, bottom: pad * 0.6 },
        ];
        return (
          <View style={[styles.fill, styles.boxNone]}>
            {/* The colour band: race name, date and place. */}
            <View
              style={[
                styles.boxNone,
                {
                  backgroundColor: ink,
                  paddingHorizontal: pad * 1.6,
                  paddingTop: pad * 0.9,
                  paddingBottom: pad * 0.7,
                  alignItems: 'center',
                },
              ]}>
              <Editable field="title" align="center">
                <Text
                  numberOfLines={1}
                  style={{
                    fontFamily: PosterFonts.condensedBold,
                    color: '#FFFFFF',
                    fontSize: fitFont(p.title, 0.075, 0.74, 0.5) * w,
                    letterSpacing: w * 0.004,
                  }}>
                  {p.title.toUpperCase()}
                </Text>
              </Editable>
              <InlineFields
                align="center"
                style={{
                  fontFamily: PosterFonts.condensed,
                  color: alpha('#FFFFFF', 0.85),
                  fontSize: w * 0.03,
                  letterSpacing: w * 0.003,
                }}
                parts={[
                  { text: p.date.toUpperCase(), field: 'date' },
                  ...(p.city ? ['  ·  ', { text: p.city.toUpperCase(), field: 'city' as const }] : []),
                ]}
              />
            </View>

            {/* The number, as big as the width allows. */}
            <View style={[styles.fill, styles.center, { paddingHorizontal: pad }]}>
              <Editable field="bib:0" align="center">
                <Text
                  numberOfLines={1}
                  style={{
                    fontFamily: PosterFonts.condensedBold,
                    color: ink,
                    fontSize: fitFont(number, 0.4, 0.86, 0.48) * w,
                    lineHeight: fitFont(number, 0.4, 0.86, 0.48) * w * 1.02,
                    letterSpacing: -w * 0.004,
                  }}>
                  {number}
                </Text>
              </Editable>
              <Editable field="name:0" align="center">
                <Text
                  numberOfLines={1}
                  style={{
                    fontFamily: PosterFonts.condensedBold,
                    color: '#141414',
                    fontSize: fitFont(r.name, 0.075, 0.8, 0.5) * w,
                    letterSpacing: w * 0.006,
                  }}>
                  {r.name.toUpperCase()}
                </Text>
              </Editable>
            </View>

            {/* Route along the bottom, stats under it. */}
            <View style={[styles.boxNone, { paddingHorizontal: pad, paddingBottom: pad * 1.3, alignItems: 'center' }]}>
              <Window designId={doc.designId} w={w} footnote={footnote}>
                {children}
              </Window>
              <View style={[styles.row, styles.boxNone, { marginTop: w * 0.025, width: w * 0.88 }]}>
                {[
                  { label: 'KM', value: km(p.distanceKm), field: 'distance' as const },
                  { label: 'TIME', value: r.time, field: 'time:0' as const },
                  { label: 'PACE /KM', value: r.pace, field: 'pace:0' as const },
                ].map((s, i) => (
                  <View
                    key={s.label}
                    style={[
                      styles.fill,
                      styles.boxNone,
                      { alignItems: i === 0 ? 'flex-start' : i === 2 ? 'flex-end' : 'center' },
                    ]}>
                    <Editable field={s.field} align={i === 0 ? 'flex-start' : i === 2 ? 'flex-end' : 'center'}>
                      <Text style={{ fontFamily: PosterFonts.condensedBold, color: '#141414', fontSize: w * 0.05 }}>
                        {s.value}
                      </Text>
                    </Editable>
                    <Text
                      style={{
                        fontFamily: PosterFonts.condensed,
                        color: alpha('#141414', 0.6),
                        fontSize: w * 0.022,
                        letterSpacing: w * 0.003,
                      }}>
                      {s.label}
                    </Text>
                  </View>
                ))}
              </View>
            </View>

            {/* Safety-pin holes. */}
            {holes.map((pos, i) => (
              <View
                key={i}
                style={[
                  styles.hole,
                  pos,
                  { width: hole, height: hole, borderRadius: hole / 2, borderWidth: Math.max(1, w * 0.003) },
                ]}
              />
            ))}
          </View>
        );
      }}
    </Sheet>
  );
}

/**
 * Swiss: International Typographic Style. A giant distance in the accent colour, the
 * map in a wide window, and a three-column grid of facts under a hairline.
 */
export function Swiss({ doc, aspectRatio, children, footnote }: PosterProps) {
  const p = posterData(doc);
  const r = p.runners[0];
  const accent = doc.ink;
  const black = '#111111';
  const look = getLook(doc.designId);
  const distance = km(p.distanceKm);
  return (
    <Sheet aspectRatio={aspectRatio} style={{ backgroundColor: look.paper ?? undefined }}>
      {(w) => {
        const pad = w * 0.07;
        const label = {
          fontFamily: PosterFonts.medium,
          color: alpha(black, 0.55),
          fontSize: w * 0.02,
          letterSpacing: w * 0.003,
        };
        const value = { fontFamily: PosterFonts.semibold, color: black, fontSize: w * 0.034 };
        const bigSize = fitFont(distance, 0.3, 0.7, 0.58) * w;
        return (
          <View style={[styles.fill, styles.boxNone, { padding: pad }]}>
            {/* Top line: race left, date right. */}
            <View style={[styles.row, styles.boxNone, { alignItems: 'flex-start' }]}>
              <View style={[styles.fill, styles.boxNone]}>
                <Editable field="title">
                  <Text
                    numberOfLines={1}
                    style={{ ...value, fontSize: fitFont(p.title, 0.04, 0.5, 0.56) * w, color: black }}>
                    {p.title}
                  </Text>
                </Editable>
                <InlineFields
                  style={label}
                  parts={[
                    { text: p.city.toUpperCase(), field: 'city' },
                    ...(p.city && p.country ? [', '] : []),
                    { text: p.country.toUpperCase(), field: 'country' },
                  ]}
                />
              </View>
              <Editable field="date" align="flex-end">
                <Text numberOfLines={1} style={{ ...value, fontFamily: PosterFonts.regular }}>
                  {p.dateDots}
                </Text>
              </Editable>
            </View>

            {/* The distance, huge, with its unit hung on the top right. */}
            <View style={[styles.fill, styles.boxNone, { justifyContent: 'center' }]}>
              <View style={[styles.row, styles.boxNone, { alignItems: 'flex-start' }]}>
                <Editable field="distance">
                  <Text
                    numberOfLines={1}
                    style={{
                      fontFamily: PosterFonts.semibold,
                      color: accent,
                      fontSize: bigSize,
                      lineHeight: bigSize * 1.0,
                      letterSpacing: -bigSize * 0.05,
                    }}>
                    {distance}
                  </Text>
                </Editable>
                <Text
                  style={{
                    fontFamily: PosterFonts.semibold,
                    color: accent,
                    fontSize: w * 0.045,
                    marginLeft: w * 0.015,
                    marginTop: bigSize * 0.12,
                  }}>
                  KM
                </Text>
              </View>
            </View>

            <Window designId={doc.designId} w={w} footnote={footnote}>
              {children}
            </Window>

            {/* Three columns under a hairline. */}
            <View style={[styles.boxNone, { marginTop: w * 0.03 }]}>
              <View style={{ height: Math.max(1, w * 0.002), backgroundColor: black, marginBottom: w * 0.018 }} />
              <View style={[styles.row, styles.boxNone, { gap: w * 0.03 }]}>
                <View style={[styles.fill, styles.boxNone]}>
                  <Text style={label}>RUNNER</Text>
                  <Editable field="name:0">
                    <Text numberOfLines={1} style={{ ...value, fontSize: fitFont(r.name, 0.034, 0.3, 0.58) * w }}>
                      {r.name}
                    </Text>
                  </Editable>
                  <InlineFields style={label} parts={['BIB ', { text: r.bib, field: 'bib:0' }]} />
                </View>
                <View style={[styles.fill, styles.boxNone]}>
                  <Text style={label}>TIME</Text>
                  <Editable field="time:0">
                    <Text style={value}>{r.time}</Text>
                  </Editable>
                </View>
                <View style={[styles.fill, styles.boxNone]}>
                  <Text style={label}>PACE</Text>
                  <Editable field="pace:0">
                    <Text style={value}>{r.pace}/km</Text>
                  </Editable>
                </View>
              </View>
            </View>
          </View>
        );
      }}
    </Sheet>
  );
}

/**
 * Headline: the race as front-page news. Masthead, dateline, the runner's name as the
 * headline, a black-and-white photo with the route, and a caption with the result.
 */
export function Headline({ doc, aspectRatio, children, footnote }: PosterProps) {
  const p = posterData(doc);
  const r = p.runners[0];
  const ink = doc.ink;
  const look = getLook(doc.designId);
  return (
    <Sheet aspectRatio={aspectRatio} style={{ backgroundColor: look.paper ?? undefined }}>
      {(w) => {
        const pad = w * 0.06;
        const rule = (thick: number) => (
          <View style={{ height: Math.max(1, w * thick), backgroundColor: ink, marginVertical: w * 0.006 }} />
        );
        const small = {
          fontFamily: PosterFonts.medium,
          color: alpha(ink, 0.8),
          fontSize: w * 0.022,
          letterSpacing: w * 0.003,
        };
        const caption = { fontFamily: PosterFonts.serifItalic, color: ink, fontSize: w * 0.03 };
        return (
          <View style={[styles.fill, styles.boxNone, { padding: pad }]}>
            <Text
              numberOfLines={1}
              style={{
                fontFamily: PosterFonts.serifBlack,
                color: ink,
                fontSize: w * 0.085,
                textAlign: 'center',
                letterSpacing: -w * 0.001,
              }}>
              The Finish Line
            </Text>
            {rule(0.006)}
            {rule(0.0015)}
            <View style={[styles.row, styles.boxNone, { marginVertical: w * 0.008 }]}>
              <View style={[styles.fill, styles.boxNone]}>
                <Editable field="date">
                  <Text numberOfLines={1} style={small}>
                    {p.date.toUpperCase()}
                  </Text>
                </Editable>
              </View>
              <InlineFields
                align="flex-end"
                style={small}
                parts={[
                  { text: p.city.toUpperCase(), field: 'city' },
                  ...(p.city && p.country ? [', '] : []),
                  { text: p.country.toUpperCase(), field: 'country' },
                ]}
              />
            </View>
            {rule(0.0015)}

            {/* The headline: NAME / conquers the / RACE. */}
            <View style={[styles.fill, styles.center]}>
              <Editable field="name:0" align="center">
                <Text
                  numberOfLines={1}
                  style={{
                    fontFamily: PosterFonts.serifBlack,
                    color: ink,
                    fontSize: fitFont(r.name, 0.11, 0.86, 0.78) * w,
                    lineHeight: fitFont(r.name, 0.11, 0.86, 0.78) * w * 1.1,
                  }}>
                  {r.name.toUpperCase()}
                </Text>
              </Editable>
              <Text style={{ fontFamily: PosterFonts.serifItalic, color: ink, fontSize: w * 0.042 }}>conquers the</Text>
              <Editable field="title" align="center">
                <Text
                  numberOfLines={1}
                  style={{
                    fontFamily: PosterFonts.serifBlack,
                    color: ink,
                    fontSize: fitFont(p.title, 0.08, 0.86, 0.78) * w,
                    lineHeight: fitFont(p.title, 0.08, 0.86, 0.78) * w * 1.15,
                  }}>
                  {p.title.toUpperCase()}
                </Text>
              </Editable>
            </View>

            <Window designId={doc.designId} w={w} footnote={footnote}>
              {children}
            </Window>
            <View style={[styles.boxNone, { marginTop: w * 0.015, alignItems: 'center' }]}>
              <InlineFields
                align="center"
                style={caption}
                parts={[
                  'Finished in ',
                  { text: r.time, field: 'time:0' },
                  ' · ',
                  { text: `${km(p.distanceKm)} km`, field: 'distance' },
                  ' · ',
                  { text: `${r.pace}/km`, field: 'pace:0' },
                ]}
              />
            </View>
          </View>
        );
      }}
    </Sheet>
  );
}

// Containers never take a touch (box-none): in edit mode only the text does.
const styles = StyleSheet.create({
  fill: { flex: 1 },
  boxNone: { pointerEvents: 'box-none' },
  center: { alignItems: 'center', justifyContent: 'center', pointerEvents: 'box-none' },
  row: { flexDirection: 'row' },
  window: { alignSelf: 'center', overflow: 'hidden' },
  footnote: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    color: '#333',
    backgroundColor: 'rgba(255,255,255,0.7)',
    pointerEvents: 'none',
  },
  hole: { position: 'absolute', backgroundColor: '#E4E0D7', borderColor: 'rgba(0,0,0,0.18)', pointerEvents: 'none' },
});
