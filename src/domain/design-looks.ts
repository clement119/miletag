/**
 * What each design starts with (PRD §7.1, matched to the owner's samples in
 * docs/samples). The user can change all of it in the editor.
 */

import type { RouteTransform } from './design-document';

export type Ink = { name: string; hex: string };

export type DesignLook = {
  /** Recommended text colours; the first is the default. */
  inks: readonly Ink[];
  background: 'photo' | 'map';
  /** Paper colour for designs printed on a plain sheet (null = full-bleed photo/map). */
  paper: string | null;
  /** 'square': map/photo in a square window (Poster Classic). 'sheet': full-bleed under the text. */
  slot: 'square' | 'sheet';
  routeColor: string;
  scrim: number;
  mono: boolean;
  /** Where the route starts on the canvas (photo mode). */
  route: RouteTransform;
};

// Text over photos: white reads on most shots, cream is softer, neon pops on dark
// or B&W photos, black is for bright daylight photos.
const PHOTO_INKS: readonly Ink[] = [
  { name: 'White', hex: '#FFFFFF' },
  { name: 'Cream', hex: '#F3E6CC' },
  { name: 'Neon', hex: '#E4FF1A' },
  { name: 'Black', hex: '#111111' },
];

const SHEET_PHOTO: DesignLook = {
  inks: PHOTO_INKS,
  paper: null,
  background: 'photo',
  slot: 'sheet',
  routeColor: '#FFFFFF',
  scrim: 0.2,
  mono: false,
  route: { x: 0.5, y: 0.32, scale: 0.62, rotation: 0 },
};

const LOOKS: Record<string, DesignLook> = {
  'poster-classic': {
    // Ink on off-white paper.
    inks: [
      { name: 'Black', hex: '#141414' },
      { name: 'Navy', hex: '#1F3A5F' },
      { name: 'Brick', hex: '#8A2D1C' },
      { name: 'Forest', hex: '#2F4A3A' },
    ],
    background: 'map',
    paper: '#FAFAF7',
    slot: 'square',
    routeColor: '#F5A623',
    scrim: 0,
    mono: false,
    route: { x: 0.5, y: 0.5, scale: 0.75, rotation: 0 },
  },
  'big-time': SHEET_PHOTO,
  editorial: { ...SHEET_PHOTO, route: { x: 0.7, y: 0.28, scale: 0.4, rotation: 0 } },
  'mono-tech': {
    ...SHEET_PHOTO,
    // Terminal colours that hold up on a black-and-white photo.
    inks: [
      { name: 'Neon', hex: '#E4FF1A' },
      { name: 'White', hex: '#FFFFFF' },
      { name: 'Signal', hex: '#FF6B35' },
      { name: 'Cyan', hex: '#7CF7FF' },
    ],
    routeColor: '#E4FF1A',
    mono: true,
    scrim: 0.25,
    route: { x: 0.5, y: 0.36, scale: 0.6, rotation: 0 },
  },
  duo: { ...SHEET_PHOTO, route: { x: 0.5, y: 0.28, scale: 0.6, rotation: 0 } },
};

/** Designs without their own layout yet use the generic full-bleed preview. */
const GENERIC: DesignLook = {
  inks: [{ name: 'Black', hex: '#111111' }],
  paper: '#F4F2EE',
  background: 'map',
  slot: 'sheet',
  routeColor: '#F5A623',
  scrim: 0,
  mono: false,
  route: { x: 0.5, y: 0.42, scale: 0.75, rotation: 0 },
};

export function getLook(designId: string): DesignLook {
  return LOOKS[designId] ?? GENERIC;
}

/** True when the design has a finished layout matching its sample. */
export function hasLayout(designId: string): boolean {
  return designId in LOOKS;
}
