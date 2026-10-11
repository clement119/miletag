/** Shared by lift-subject.ts (native) and lift-subject.web.ts. */

export type SubjectCutout = {
  /** PNG with a transparent background, same size and framing as the preview photo. */
  uri: string;
  width: number;
  height: number;
  kind: 'person' | 'object';
};

/** The wand isn't available on this platform yet. */
export class LiftUnavailableError extends Error {}
