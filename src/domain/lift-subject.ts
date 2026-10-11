/**
 * Magic wand: lifts the subject out of a photo so text and route can sit behind it.
 *
 * The web build runs MODNet portrait matting in the browser (lift-subject.web.ts). On iOS and
 * Android this needs the platform's own subject detection (Apple Vision's
 * foreground mask on iOS 17+, ML Kit subject segmentation on Android) in a native
 * module; until that lands the wand reports it isn't available.
 */

import { LiftUnavailableError, type SubjectCutout } from './subject-cutout';

export { LiftUnavailableError, type SubjectCutout } from './subject-cutout';

export async function liftSubject(_uri: string): Promise<SubjectCutout | null> {
  throw new LiftUnavailableError('The magic wand works on the web version for now; the phone app version is next.');
}
