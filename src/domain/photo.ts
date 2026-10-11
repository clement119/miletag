/**
 * Photo backgrounds (PRD §7.2): the crop model, the print-quality (DPI) gate and
 * the size of the photo slot each design prints.
 */

import { getDesign, PAPER_MM, type PaperSize } from './catalog';
import { getLook } from './design-looks';

export type PhotoAsset = {
  /** Original file. This is what gets uploaded for the print render. */
  uri: string;
  /** Downsized copy for the live preview (keeps memory sane on phones). */
  previewUri: string;
  /** Original pixel size, used for the DPI gate. */
  width: number;
  height: number;
};

/**
 * Photo position inside its slot. The photo first "covers" the slot, then is
 * zoomed by `scale` (>= 1) and its centre offset by `x`/`y` (fractions of the
 * slot's width/height).
 */
export type PhotoCrop = { x: number; y: number; scale: number };

export const DEFAULT_PHOTO_CROP: PhotoCrop = { x: 0, y: 0, scale: 1 };
export const MAX_PHOTO_ZOOM = 5;

/** Scrim presets: a dark wash over the photo so the route reads on busy shots. */
export const SCRIM_LEVELS = [
  { value: 0, label: 'None' },
  { value: 0.2, label: 'Light' },
  { value: 0.4, label: 'Medium' },
  { value: 0.6, label: 'Strong' },
] as const;

/** Poster Classic: the square image is this fraction of the paper width. */
export const POSTER_CLASSIC_SQUARE = 0.8;

/** Printed size of the photo slot, in mm. */
export function photoSlotMm(designId: string, size: PaperSize): { w: number; h: number } {
  const paper = PAPER_MM[size];
  const slot = getLook(designId).slot;
  if (slot === 'square') {
    const side = paper.w * POSTER_CLASSIC_SQUARE;
    return { w: side, h: side };
  }
  if (slot !== 'sheet') return { w: paper.w * slot.width, h: (paper.w * slot.width) / slot.aspect };
  // Other designs are full-bleed until their own layouts land.
  return getDesign(designId)?.orientation === 'landscape' ? { w: paper.h, h: paper.w } : paper;
}

/**
 * Keeps the photo covering the slot: no empty edges at any zoom.
 * `slotAspect` is slot width / height.
 */
export function clampCrop(crop: PhotoCrop, photo: { width: number; height: number }, slotAspect: number): PhotoCrop {
  'worklet';
  const scale = Math.min(MAX_PHOTO_ZOOM, Math.max(1, crop.scale));
  // Drawn photo size in slot units (slot = 1 × 1) at this zoom.
  const photoAspect = photo.width / photo.height;
  const coverW = photoAspect >= slotAspect ? photoAspect / slotAspect : 1;
  const coverH = photoAspect >= slotAspect ? 1 : slotAspect / photoAspect;
  const maxX = (coverW * scale - 1) / 2;
  const maxY = (coverH * scale - 1) / 2;
  return { scale, x: Math.min(maxX, Math.max(-maxX, crop.x)), y: Math.min(maxY, Math.max(-maxY, crop.y)) };
}

/** Effective print resolution of the cropped photo in its slot. */
export function photoDpi(
  photo: { width: number; height: number },
  crop: PhotoCrop,
  slotMm: { w: number; h: number },
): number {
  // Photo pixels visible across the slot width.
  const slotAspect = slotMm.w / slotMm.h;
  const visiblePx = Math.min(photo.width, photo.height * slotAspect) / Math.max(1, crop.scale);
  return Math.round(visiblePx / (slotMm.w / 25.4));
}

export type DpiGrade = 'good' | 'fair' | 'low';

/** PRD §7.2: green ≥ 200, amber 150–199, red < 150. */
export function gradeDpi(dpi: number): DpiGrade {
  if (dpi >= 200) return 'good';
  if (dpi >= 150) return 'fair';
  return 'low';
}
