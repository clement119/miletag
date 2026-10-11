/**
 * What each design starts with (PRD §7.1, matched to the owner's samples in
 * docs/samples). The user can change all of it in the editor.
 */

import type { RouteTransform } from './design-document';

export type DesignLook = {
  background: 'photo' | 'map';
  /** 'square': map/photo in a square window (Poster Classic). 'sheet': full-bleed under the text. */
  slot: 'square' | 'sheet';
  routeColor: string;
  scrim: number;
  mono: boolean;
  /** Where the route starts on the canvas (photo mode). */
  route: RouteTransform;
};

const SHEET_PHOTO: DesignLook = {
  background: 'photo',
  slot: 'sheet',
  routeColor: '#FFFFFF',
  scrim: 0.2,
  mono: false,
  route: { x: 0.5, y: 0.32, scale: 0.62, rotation: 0 },
};

const LOOKS: Record<string, DesignLook> = {
  'poster-classic': {
    background: 'map',
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
    routeColor: '#E4FF1A',
    mono: true,
    scrim: 0.25,
    route: { x: 0.5, y: 0.36, scale: 0.6, rotation: 0 },
  },
  duo: { ...SHEET_PHOTO, route: { x: 0.5, y: 0.28, scale: 0.6, rotation: 0 } },
};

/** Designs without their own layout yet use the generic full-bleed preview. */
const GENERIC: DesignLook = {
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
