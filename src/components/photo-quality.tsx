import { StyleSheet, View } from 'react-native';

import { AnimatedToggle } from '@/components/animated-toggle';
import { AppText } from '@/components/ui';
import { Colors, Radius, Spacing } from '@/constants/theme';
import type { DesignDocument } from '@/domain/design-document';
import { gradeDpi, photoDpi, photoSlotMm, type DpiGrade } from '@/domain/photo';

const GRADE_COLOUR: Record<DpiGrade, string> = { good: '#34C77B', fair: '#F5A623', low: Colors.danger };

export type PhotoQuality = { dpi: number; grade: DpiGrade; blocked: boolean };

/** Print quality of the current photo at the chosen size, or null in map mode / without a photo. */
export function getPhotoQuality(doc: DesignDocument): PhotoQuality | null {
  const bg = doc.background;
  if (bg.type !== 'photo' || !bg.photo) return null;
  const dpi = photoDpi(bg.photo, bg.crop, photoSlotMm(doc.designId, doc.order.size));
  const grade = gradeDpi(dpi);
  // A low-res print needs an explicit OK, and the OK covers that DPI or better.
  const blocked = grade === 'low' && (bg.lowResAckDpi === null || dpi < bg.lowResAckDpi);
  return { dpi, grade, blocked };
}

const MESSAGE: Record<DpiGrade, string> = {
  good: 'Sharp',
  fair: 'Acceptable, may look slightly soft up close',
  low: 'Likely to look blurry',
};

/** Only suggests fixes that are actually available. */
function tips(doc: DesignDocument): string {
  const options: string[] = [];
  if (doc.background.type === 'photo' && doc.background.crop.scale > 1.05) options.push('zoom out of the photo');
  if (doc.order.size !== 'A4') options.push('pick a smaller size');
  options.push('use the original photo (not a screenshot or a social media download)');
  const last = options.pop();
  return ` Try to ${options.length ? `${options.join(', ')} or ` : ''}${last}.`;
}

/** Traffic-light print quality for the photo (PRD §7.2), with the low-res acknowledgement. */
export function PhotoQualityNotice({
  doc,
  onAcknowledge,
}: {
  doc: DesignDocument;
  onAcknowledge: (dpi: number | null) => void;
}) {
  const q = getPhotoQuality(doc);
  if (!q) return null;
  const colour = GRADE_COLOUR[q.grade];

  return (
    <View style={[styles.box, { borderColor: colour }]}>
      <View style={styles.row}>
        <View style={[styles.dot, { backgroundColor: colour }]} />
        <AppText style={styles.title}>
          Print quality at {doc.order.size}: {MESSAGE[q.grade]}
        </AppText>
      </View>
      <AppText variant="caption">
        {q.dpi} DPI (200+ is ideal{q.grade === 'low' ? ', under 150 looks soft' : ''}).
        {q.grade !== 'good' && tips(doc)}
      </AppText>
      {q.grade === 'low' && (
        <AnimatedToggle
          label="Print it anyway"
          value={!q.blocked}
          onChange={(on) => onAcknowledge(on ? q.dpi : null)}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  box: { borderWidth: 1, borderRadius: Radius.md, padding: Spacing.three, gap: Spacing.two },
  row: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  dot: { width: 10, height: 10, borderRadius: 5 },
  title: { fontWeight: '600', flexShrink: 1 },
});
