/**
 * Picks the layout for a design. Designs without their own layout yet (crew and
 * medal designs) use a simple full-bleed preview with the title underneath.
 */

import { StyleSheet, Text, View } from 'react-native';

import { getLook } from '@/domain/design-looks';

import { PosterFonts, type PosterProps } from './common';
import { BigTime, Duo, Editorial, MonoTech } from './photo-layouts';
import { PosterClassic } from './poster-classic';

export type { PosterProps } from './common';

const LAYOUTS: Record<string, (props: PosterProps) => React.ReactNode> = {
  'poster-classic': PosterClassic,
  'big-time': BigTime,
  editorial: Editorial,
  'mono-tech': MonoTech,
  duo: Duo,
};

export function Poster(props: PosterProps) {
  const Layout = LAYOUTS[props.doc.designId];
  return Layout ? <Layout {...props} /> : <GenericPoster {...props} />;
}

/** Width / height of the map or photo canvas inside the sheet. */
export function canvasAspect(designId: string, sheetAspect: number): number {
  return getLook(designId).slot === 'square' ? 1 : sheetAspect;
}

function GenericPoster({ doc, children }: PosterProps) {
  return (
    <View style={styles.generic}>
      {children}
      {doc.text.title !== '' && (
        <Text style={styles.genericTitle} numberOfLines={1}>
          {doc.text.title.toUpperCase()}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  generic: { backgroundColor: '#F4F2EE', padding: 8, borderRadius: 4, gap: 4 },
  genericTitle: { color: '#111', fontFamily: PosterFonts.condensedBold, fontSize: 14, letterSpacing: 1 },
});
