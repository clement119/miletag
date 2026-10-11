/**
 * Shared pieces for the poster layouts. Every size is a fraction of the sheet
 * width `w`, so the phone preview, the gallery thumbnail and (later) the print
 * render all lay out identically.
 */

import { useState, type ReactNode } from 'react';
import { StyleSheet, Text, View, type LayoutChangeEvent, type StyleProp, type ViewStyle } from 'react-native';

import type { DesignDocument } from '@/domain/design-document';
import { formatDateDots, formatDateLong, formatDuration, formatPace, monthName, parseRaceDate } from '@/domain/race';

import { useEditing } from './editable';

/** Font families, loaded in the root layout. Keys match `useFonts` in src/app/_layout.tsx. */
export const PosterFonts = {
  condensed: 'BarlowCondensed_500Medium',
  condensedBold: 'BarlowCondensed_600SemiBold',
  light: 'Inter_300Light',
  regular: 'Inter_400Regular',
  medium: 'Inter_500Medium',
  semibold: 'Inter_600SemiBold',
  mono: 'SpaceMono_400Regular',
  monoBold: 'SpaceMono_700Bold',
} as const;

export type PosterProps = {
  doc: DesignDocument;
  /** Width / height of the sheet. */
  aspectRatio: number;
  /**
   * The map or photo canvas. Omitted by the full-screen editor, which draws the
   * canvas behind the whole screen; the layout is then just its text, transparent.
   */
  children?: ReactNode;
  /** Small print in the image corner, e.g. map attribution. */
  footnote?: string;
};

/** Measures the sheet and hands its width to the layout. */
export function Sheet({
  aspectRatio,
  style,
  footnote,
  children,
}: {
  aspectRatio: number;
  style?: StyleProp<ViewStyle>;
  /** Corner credit over a full-bleed map (OpenStreetMap requires it). */
  footnote?: string;
  children: (w: number) => ReactNode;
}) {
  const [w, setW] = useState(0);
  const onLayout = (e: LayoutChangeEvent) => setW(e.nativeEvent.layout.width);
  return (
    <View onLayout={onLayout} style={[styles.sheet, { aspectRatio }, style]}>
      {w > 0 && children(w)}
      {w > 0 && footnote ? (
        <Text numberOfLines={1} style={[styles.footnote, { fontSize: w * 0.013, paddingHorizontal: w * 0.006 }]}>
          {footnote}
        </Text>
      ) : null}
    </View>
  );
}

/** `#RRGGBB` at the given opacity, for shades derived from the chosen ink. */
export function alpha(hex: string, opacity: number): string {
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${opacity})`;
}

/**
 * Text layer over a full-bleed canvas. Touches pass through to the canvas below,
 * except in text edit mode, when the pencil badges on the text need them.
 */
export function Overlay({ children, style }: { children: ReactNode; style?: StyleProp<ViewStyle> }) {
  const editing = useEditing();
  return (
    <View style={[StyleSheet.absoluteFill, editing ? styles.boxNone : styles.passThrough, style]}>{children}</View>
  );
}

/**
 * Font size (as a fraction of sheet width) that keeps one line of text inside
 * `columnWidth`, so the layout never reflows. `em` is the font's average
 * character width.
 */
export function fitFont(text: string, max: number, columnWidth: number, em = 0.62): number {
  const chars = Math.max(1, text.trim().length);
  return Math.min(max, columnWidth / (chars * em));
}

/**
 * Splits a title into two lines of similar length ("STANDARD CHARTERED" / "KL MARATHON"),
 * so big two-line titles stay big. One word stays on the first line.
 */
export function splitTitle(title: string): [string, string] {
  const words = title.trim().split(/\s+/);
  if (words.length < 2) return [words[0] ?? '', ''];
  let best: [string, string] = [words.slice(0, -1).join(' '), words[words.length - 1]];
  for (let i = 1; i < words.length; i++) {
    const pair: [string, string] = [words.slice(0, i).join(' '), words.slice(i).join(' ')];
    if (Math.max(pair[0].length, pair[1].length) < Math.max(best[0].length, best[1].length)) best = pair;
  }
  return best;
}

/**
 * Everything a layout shows, formatted once. Required fields (title, date, name)
 * show a placeholder until filled in; the editor won't continue without them.
 */
export function posterData(doc: DesignDocument) {
  const { title, date, city, country } = doc.text;
  const d = parseRaceDate(date);
  // All runners ran the same route.
  const distanceKm = doc.runners[0]?.distanceKm;
  return {
    title: title.trim() || 'Race name',
    date: d ? formatDateLong(d) : date.trim() || '5 October 2026',
    dateDots: d ? formatDateDots(d) : date.trim() || '05.10.26',
    dayMonth: d ? `${d.day} ${monthName(d.month)}` : date.trim() || '5 October',
    year: d ? String(d.year) : '',
    // Optional: shown only when filled in, never as a placeholder.
    city: city.trim(),
    country: country.trim(),
    location: [city.trim(), country.trim()].filter(Boolean).join(', '),
    distanceKm,
    runners: doc.runners.map((r, i) => ({
      name: r.name.trim() || (doc.runners.length > 1 ? `Runner ${i + 1}` : 'Your name'),
      bib: r.bib?.trim() ?? '',
      time: r.timeSeconds ? formatDuration(r.timeSeconds) : '00:00:00',
      /** "4:06" with no unit. */
      pace: r.timeSeconds && distanceKm ? formatPace(r.timeSeconds, distanceKm).replace('/km', '') : '0:00',
    })),
  };
}

const styles = StyleSheet.create({
  // box-none: the sheet itself never takes touches, so gestures reach the canvas.
  sheet: { width: '100%', overflow: 'hidden', pointerEvents: 'box-none' },
  passThrough: { pointerEvents: 'none' },
  boxNone: { pointerEvents: 'box-none' },
  footnote: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    color: '#333',
    backgroundColor: 'rgba(255,255,255,0.7)',
    pointerEvents: 'none',
  },
});
