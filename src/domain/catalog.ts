/**
 * Product catalogue and availability rules (PRD §6.3, §6.4, §7.1, §7.7, §7.8).
 * Prices are placeholders until the print-shop quotes and cost sheet are in.
 */

export type PaperSize = 'A4' | 'A3' | 'A2';
export type Format = 'print' | 'framed' | 'deep';
export type RunnerCount = 1 | 2 | 3 | 4 | 5 | 6;
export type FrameColour = 'black' | 'oak' | 'white';
export type FilamentColour = 'white' | 'black' | 'orange' | 'neon-yellow' | 'silver' | 'gold';
export type BackgroundKind = 'photo' | 'map';

export const PAPER_SIZES: readonly PaperSize[] = ['A4', 'A3', 'A2'];
export const FORMATS: readonly Format[] = ['print', 'framed', 'deep'];
export const RUNNER_COUNTS: readonly RunnerCount[] = [1, 2, 3, 4, 5, 6];
export const FRAME_COLOURS: readonly FrameColour[] = ['black', 'oak', 'white'];

export const FILAMENT_COLOURS: Record<FilamentColour, { label: string; hex: string }> = {
  white: { label: 'White', hex: '#F4F4F2' },
  black: { label: 'Black', hex: '#111111' },
  orange: { label: 'Signal orange', hex: '#F5A623' },
  'neon-yellow': { label: 'Neon yellow', hex: '#E4FF1A' },
  silver: { label: 'Silver', hex: '#C0C4C8' },
  gold: { label: 'Gold', hex: '#D4AF37' },
};

export const PAPER_MM: Record<PaperSize, { w: number; h: number }> = {
  A4: { w: 210, h: 297 },
  A3: { w: 297, h: 420 },
  A2: { w: 420, h: 594 },
};

export const PRINT_DPI = 300;

export const FORMAT_LABEL: Record<Format, string> = {
  print: 'Print',
  framed: 'Framed',
  deep: 'Deep Frame',
};

/** A2 is a print-only poster: no frames, so no medal slot or 3D route either. */
const FORMATS_BY_SIZE: Record<PaperSize, readonly Format[]> = {
  A4: ['print', 'framed', 'deep'],
  A3: ['print', 'framed', 'deep'],
  A2: ['print'],
};

/** Largest medal diameter the slot takes, per size. A2 has no medal slot. */
export const MEDAL_MAX_MM: Record<PaperSize, number | null> = {
  A4: 85,
  A3: 110,
  A2: null,
};

/**
 * 3D route bounding box cap in mm. Bambu Lab P2S plate is ~256 mm, minus margin;
 * on A4 the paper itself is the limit.
 */
export const ROUTE_3D_MAX_MM: Record<PaperSize, number | null> = {
  A4: 170,
  A3: 240,
  A2: null,
};

export function formatsFor(size: PaperSize): readonly Format[] {
  return FORMATS_BY_SIZE[size];
}

export function isFormatAvailable(size: PaperSize, format: Format): boolean {
  return FORMATS_BY_SIZE[size].includes(format);
}

/** Both 3D and medal stand off the paper, so they need the Deep Frame. */
export function canAdd3D(size: PaperSize, format: Format): boolean {
  return format === 'deep' && ROUTE_3D_MAX_MM[size] !== null;
}

export function canAddMedal(size: PaperSize, format: Format, design: Design): boolean {
  return format === 'deep' && design.supportsMedal && MEDAL_MAX_MM[size] !== null;
}

export type MedalFit = { ok: true } | { ok: false; reason: string; suggestSize?: PaperSize };

export function checkMedalFit(size: PaperSize, diameterMm: number): MedalFit {
  const max = MEDAL_MAX_MM[size];
  if (max === null) return { ok: false, reason: 'Medal slot is available on A4 and A3 only.' };
  if (diameterMm <= max) return { ok: true };
  const bigger = PAPER_SIZES.find((s) => {
    const m = MEDAL_MAX_MM[s];
    return m !== null && m >= diameterMm;
  });
  return {
    ok: false,
    reason: `Medals up to ${max} mm fit ${size}.`,
    suggestSize: bigger,
  };
}

/** One-line reason shown on greyed-out options in the format picker. */
export function unavailableReason(size: PaperSize, format: Format): string | null {
  if (isFormatAvailable(size, format)) return null;
  return 'A2 is available as an unframed print only.';
}

// ---------------------------------------------------------------------------
// Designs (PRD §7.1)
// ---------------------------------------------------------------------------

export type Design = {
  id: string;
  name: string;
  description: string;
  supportsRunners: readonly RunnerCount[];
  supportsMedal: boolean;
  supports3D: boolean;
  orientation: 'portrait' | 'landscape';
};

export const DESIGNS: readonly Design[] = [
  {
    id: 'poster-classic',
    name: 'Poster Classic',
    description: 'Title and date on top, square map or photo, name, bib and stats below.',
    supportsRunners: [1],
    supportsMedal: false,
    supports3D: true,
    orientation: 'portrait',
  },
  {
    id: 'big-time',
    name: 'Big Time',
    description: 'An oversized ghosted finish time over your photo.',
    supportsRunners: [1],
    supportsMedal: false,
    supports3D: true,
    orientation: 'portrait',
  },
  {
    id: 'editorial',
    name: 'Editorial',
    description: 'Stacked date and race title with a bottom stat bar.',
    supportsRunners: [1],
    supportsMedal: false,
    supports3D: true,
    orientation: 'portrait',
  },
  {
    id: 'mono-tech',
    name: 'Mono Tech',
    description: 'Black-and-white photo, neon route, monospace stats.',
    supportsRunners: [1],
    supportsMedal: false,
    supports3D: true,
    orientation: 'portrait',
  },
  {
    id: 'duo',
    name: 'Duo',
    description: 'Two names and times side by side.',
    supportsRunners: [2],
    supportsMedal: false,
    supports3D: true,
    orientation: 'portrait',
  },
  {
    id: 'race-bib',
    name: 'Race Bib',
    description: 'Your bib number, huge, with the route along the bottom.',
    supportsRunners: [1],
    supportsMedal: false,
    supports3D: true,
    orientation: 'portrait',
  },
  {
    id: 'swiss',
    name: 'Swiss',
    description: 'A giant distance, a map and a clean three-column grid.',
    supportsRunners: [1],
    supportsMedal: false,
    supports3D: true,
    orientation: 'portrait',
  },
  {
    id: 'headline',
    name: 'Headline',
    description: 'Front-page news: your name in the headline over a black-and-white photo.',
    supportsRunners: [1],
    supportsMedal: false,
    supports3D: true,
    orientation: 'portrait',
  },
  {
    id: 'stack',
    name: 'Stack',
    description: 'Distance, time and pace stacked big over your photo.',
    supportsRunners: [1],
    supportsMedal: false,
    supports3D: true,
    orientation: 'portrait',
  },
  {
    id: 'crew-grid',
    name: 'Crew Grid',
    description: 'Shared route on top, a stat grid for the whole crew below.',
    supportsRunners: [3, 4, 5, 6],
    supportsMedal: false,
    supports3D: true,
    orientation: 'portrait',
  },
  {
    id: 'medal-classic',
    name: 'Medal Classic',
    description: 'Your print above, a slot for your medal below.',
    supportsRunners: [1, 2],
    supportsMedal: true,
    supports3D: true,
    orientation: 'portrait',
  },
  {
    id: 'medal-side',
    name: 'Medal Side',
    description: 'Landscape: route or photo on the left, medal slot on the right.',
    supportsRunners: [1],
    supportsMedal: true,
    supports3D: true,
    orientation: 'landscape',
  },
  {
    id: 'medal-crew',
    name: 'Medal Crew',
    description: 'Shared route, crew stats, one medal slot. Each runner orders their own copy.',
    supportsRunners: [2, 3, 4, 5, 6],
    supportsMedal: true,
    supports3D: true,
    orientation: 'portrait',
  },
];

export function designsFor(runnerCount: RunnerCount): Design[] {
  return DESIGNS.filter((d) => d.supportsRunners.includes(runnerCount));
}

/**
 * The editor and gallery show designs at the social-media crop for now (owner's call):
 * Instagram post, 1080 × 1350 (4:5), or 5:4 for landscape designs. Print sizes are
 * still the A-series; their own layout pass comes with the print render.
 */
export const SOCIAL_ASPECT = 4 / 5;

export function editorAspect(design: Design | undefined): number {
  return design?.orientation === 'landscape' ? 1 / SOCIAL_ASPECT : SOCIAL_ASPECT;
}

export function getDesign(id: string): Design | undefined {
  return DESIGNS.find((d) => d.id === id);
}

// ---------------------------------------------------------------------------
// Pricing (MYR, placeholders, PRD §6.4)
// ---------------------------------------------------------------------------

const BASE_PRICE: Record<PaperSize, Partial<Record<Format, number>>> = {
  A4: { print: 49, framed: 129, deep: 179 },
  A3: { print: 79, framed: 189, deep: 249 },
  A2: { print: 119 },
};

const ROUTE_3D_PRICE: Record<PaperSize, number | null> = { A4: 79, A3: 99, A2: null };
const MEDAL_SLOT_PRICE = 39;
const HERO_BUNDLE_DISCOUNT = 28;

export type PriceInput = {
  size: PaperSize;
  format: Format;
  route3d: boolean;
  medal: boolean;
};

export type PriceBreakdown = {
  base: number;
  route3d: number;
  medal: number;
  discount: number;
  total: number;
};

export function priceFor({ size, format, route3d, medal }: PriceInput): PriceBreakdown {
  const base = BASE_PRICE[size][format];
  if (base === undefined) throw new Error(`${format} is not available in ${size}`);
  const r3d = route3d && format === 'deep' ? (ROUTE_3D_PRICE[size] ?? 0) : 0;
  const m = medal && format === 'deep' && MEDAL_MAX_MM[size] !== null ? MEDAL_SLOT_PRICE : 0;
  const discount = r3d > 0 && m > 0 ? HERO_BUNDLE_DISCOUNT : 0;
  return { base, route3d: r3d, medal: m, discount, total: base + r3d + m - discount };
}

export function formatRM(amount: number): string {
  return `RM ${amount.toLocaleString('en-MY')}`;
}
