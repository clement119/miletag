/**
 * "See it on your wall": the finished poster hung in a room, in the chosen format
 * (print / framed / Deep Frame), frame colour and size, to scale. The room is our own
 * generated backdrop (assets/images/mockup/room.jpg).
 */

import { useState } from 'react';
import { Image, StyleSheet, View, type LayoutChangeEvent } from 'react-native';

import { PosterRender, posterAspect } from '@/components/poster-render';
import { PAPER_MM, type FrameColour } from '@/domain/catalog';
import type { DesignDocument } from '@/domain/design-document';

const ROOM = require('../../assets/images/mockup/room.jpg') as number;
/** The backdrop is 1200 × 1500. */
const ROOM_ASPECT = 1200 / 1500;
/** How much wall the backdrop shows, in metres across. Sets the poster's scale. */
const WALL_WIDTH_M = 0.8;
/** Where the poster hangs: its centre, as a fraction of the room's height. */
const HANG_Y = 0.38;

const FRAME: Record<FrameColour, string> = { black: '#1C1C1C', oak: '#A9784A', white: '#F3F3F0' };
const MAT = '#FAFAF7';

export function FormatMockup({ doc, maxHeight }: { doc: DesignDocument; maxHeight: number }) {
  const [available, setAvailable] = useState(0);
  const onLayout = (e: LayoutChangeEvent) => setAvailable(e.nativeEvent.layout.width);
  // As wide as the space allows, but never taller than maxHeight (it stays on screen).
  const w = Math.min(available, maxHeight * ROOM_ASPECT);
  const h = w / ROOM_ASPECT;

  const { size, format, frame } = doc.order;
  const aspect = posterAspect(doc);
  const paperW = aspect < 1 ? PAPER_MM[size].w : PAPER_MM[size].h;
  const pw = Math.round((w * paperW) / 1000 / WALL_WIDTH_M);
  // Frame and mat widths, relative to the poster: a Deep Frame is chunkier and deeper.
  const moulding = format === 'print' ? 0 : Math.round(pw * (format === 'deep' ? 0.075 : 0.045));
  const mat = format === 'print' ? 0 : Math.round(pw * 0.07);
  const outerW = pw + 2 * (moulding + mat);
  const outerH = pw / aspect + 2 * (moulding + mat);
  const left = (w - outerW) / 2;
  const top = Math.max(h * 0.05, h * HANG_Y - outerH / 2);

  return (
    <View onLayout={onLayout} style={styles.slot}>
      <View testID="format-mockup" style={[styles.room, { width: w, height: h }]}>
        <Image source={ROOM} style={[styles.fill, { width: w, height: h }]} resizeMode="cover" />
        {w > 0 && pw > 0 && (
          <View
            style={[
              styles.hung,
              format === 'deep' ? styles.deepShadow : styles.shadow,
              { left, top, width: outerW, height: outerH },
              format !== 'print' && { padding: moulding, backgroundColor: FRAME[frame] },
            ]}>
            <View style={format !== 'print' && { padding: mat, backgroundColor: MAT }}>
              <PosterRender doc={doc} width={pw} />
              {/* Deep Frame: the gap between glass and print reads as an inner shadow. */}
              {format === 'deep' && <View style={styles.depth} />}
            </View>
            {/* A white frame needs a faint edge to read against a light wall. */}
            {format !== 'print' && frame === 'white' && <View style={styles.edge} />}
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  slot: { width: '100%', alignItems: 'center' },
  room: { borderRadius: 14, overflow: 'hidden', backgroundColor: '#E6E0D6' },
  fill: { position: 'absolute', left: 0, top: 0 },
  hung: { position: 'absolute' },
  edge: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    borderWidth: 1,
    borderColor: '#D3D1CB',
    pointerEvents: 'none',
  },
  shadow: {
    shadowColor: '#000',
    shadowOpacity: 0.28,
    shadowRadius: 10,
    shadowOffset: { width: 4, height: 8 },
    elevation: 8,
  },
  deepShadow: {
    shadowColor: '#000',
    shadowOpacity: 0.38,
    shadowRadius: 18,
    shadowOffset: { width: 8, height: 14 },
    elevation: 14,
  },
  depth: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    pointerEvents: 'none',
    borderWidth: 5,
    borderTopColor: '#BDB8AE',
    borderLeftColor: '#CBC6BC',
    borderRightColor: '#EDEAE4',
    borderBottomColor: '#F2F0EB',
  },
});
