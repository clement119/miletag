/**
 * The finished poster at a given width, drawn the same way as the editor (layout,
 * photo or map, route, lifted subject) but static: for previews like the format
 * mockup. Pass a document with samples already filled in if it should look complete.
 */

import { View } from 'react-native';

import { MapCanvas } from '@/components/map-canvas';
import { canvasAspect, Poster } from '@/components/posters';
import { RouteCanvas } from '@/components/route-canvas';
import { getDesign, PAPER_MM } from '@/domain/catalog';
import type { DesignDocument } from '@/domain/design-document';
import { getLook, hasLayout } from '@/domain/design-looks';
import { DEMO_PHOTO } from '@/domain/demo';
import { MAP_ATTRIBUTION } from '@/domain/map-styles';

export function posterAspect(doc: DesignDocument): number {
  const paper = PAPER_MM[doc.order.size];
  return getDesign(doc.designId)?.orientation === 'landscape' ? paper.h / paper.w : paper.w / paper.h;
}

export function PosterRender({ doc, width }: { doc: DesignDocument; width: number }) {
  const aspect = posterAspect(doc);
  const height = width / aspect;
  const look = getLook(doc.designId);
  const fullBleed = look.paper === null && hasLayout(doc.designId);
  const slot = canvasAspect(doc.designId, aspect);
  const bg = doc.background;
  const footnote = bg.type === 'map' ? MAP_ATTRIBUTION : undefined;

  const photo =
    bg.type === 'photo'
      ? {
          ...(bg.photo ? { uri: bg.photo.previewUri, width: bg.photo.width, height: bg.photo.height } : DEMO_PHOTO),
          crop: bg.crop,
          scrim: bg.scrim,
          mono: bg.mono,
        }
      : null;

  // Previews fit the map to the route (the editor's saved view is for its own screen size).
  const map = (aspectRatio: number) =>
    bg.type === 'map' ? (
      <MapCanvas
        styleId={bg.styleId}
        layers={bg.layers}
        geo={doc.route.geo}
        routeColor={doc.route.stroke.color}
        camera={null}
        aspectRatio={aspectRatio}
        onCameraChange={() => {}}
      />
    ) : null;

  const routeCanvas = (aspectRatio: number, overlay?: React.ReactNode) => (
    <RouteCanvas
      interactive={false}
      points={doc.route.points}
      transform={doc.route.transform}
      strokeColor={doc.route.stroke.color}
      aspectRatio={aspectRatio}
      onTransformEnd={() => {}}
      photo={photo}
      subjectUri={bg.type === 'photo' && bg.cutout?.enabled ? bg.cutout.uri : null}
      overlay={overlay}
    />
  );

  // Static: nothing in a preview takes a touch.
  return (
    <View style={{ width, height, pointerEvents: 'none' }}>
      {fullBleed ? (
        <View style={{ width, height }}>
          {bg.type === 'map' ? (
            <>
              {map(aspect)}
              <View style={{ position: 'absolute', left: 0, top: 0, width }}>
                <Poster doc={doc} aspectRatio={aspect} footnote={footnote} />
              </View>
            </>
          ) : (
            // Text on top, the lifted subject under it and over the route, as in the editor.
            routeCanvas(
              aspect,
              <View style={{ position: 'absolute', left: 0, top: 0, width }}>
                <Poster doc={doc} aspectRatio={aspect} />
              </View>,
            )
          )}
        </View>
      ) : (
        <Poster doc={doc} aspectRatio={aspect} footnote={footnote}>
          {bg.type === 'map' ? map(slot) : routeCanvas(slot)}
        </Poster>
      )}
    </View>
  );
}
