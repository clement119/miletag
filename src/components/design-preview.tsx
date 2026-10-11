/**
 * Gallery thumbnail: the real layout for a design, rendered with demo data
 * (src/domain/demo.ts). Static, so the gallery scrolls freely.
 */

import { canvasAspect, Poster } from '@/components/posters';
import { RouteCanvas } from '@/components/route-canvas';
import { PAPER_MM, type Design, type RunnerCount } from '@/domain/catalog';
import { getLook } from '@/domain/design-looks';
import { DEMO_MAP, DEMO_PHOTO, demoDocument } from '@/domain/demo';
import { DEFAULT_PHOTO_CROP } from '@/domain/photo';

export function DesignPreview({ design, runnerCount }: { design: Design; runnerCount: RunnerCount }) {
  const doc = demoDocument(design.id, runnerCount);
  const look = getLook(design.id);
  const paper = PAPER_MM.A3;
  const aspect = design.orientation === 'landscape' ? paper.h / paper.w : paper.w / paper.h;
  const usesPhoto = look.background === 'photo';
  // The map thumbnail already has the route drawn on it.
  const image = usesPhoto ? DEMO_PHOTO : DEMO_MAP;

  return (
    <Poster doc={doc} aspectRatio={aspect}>
      <RouteCanvas
        interactive={false}
        points={usesPhoto ? doc.route.points : null}
        transform={doc.route.transform}
        strokeColor={doc.route.stroke.color}
        aspectRatio={canvasAspect(design.id, aspect)}
        onTransformEnd={() => {}}
        photo={{ ...image, crop: DEFAULT_PHOTO_CROP, scrim: look.scrim, mono: look.mono }}
      />
    </Poster>
  );
}
