/**
 * Magic wand (web): finds the subject in a photo and returns it as a cut-out PNG
 * with a transparent background, so the editor can draw it above the text and
 * route. Uses MediaPipe's DeepLab v3 segmenter in the browser.
 *
 * People win: if the photo has a person, only people are lifted (a van or bike
 * behind a runner stays put). Otherwise any detected object is lifted.
 *
 * Preview quality only: the mask is computed on the preview image. The print
 * render must redo this on the original, server side.
 */

import type * as Vision from '@mediapipe/tasks-vision';

import type { SubjectCutout } from './subject-cutout';

type MediaPipeVision = typeof Vision;
type ImageSegmenter = Vision.ImageSegmenter;

export { LiftUnavailableError, type SubjectCutout } from './subject-cutout';

// Library + WASM are copied to /public/mediapipe by scripts/copy-web-assets.js.
const WASM_PATH = '/mediapipe';
// TODO: self-host the model before launch.
const MODEL_URL =
  'https://storage.googleapis.com/mediapipe-models/image_segmenter/deeplab_v3/float32/1/deeplab_v3.tflite';
const PERSON = 'person';

let segmenter: Promise<ImageSegmenter> | null = null;

function getSegmenter(): Promise<ImageSegmenter> {
  segmenter ??= (async () => {
    // Loaded on first use only (the library and model are a few MB), straight from our
    // own /public: Metro can't bundle this library, and `Function` keeps Metro from
    // trying to resolve the URL at build time.
    const load = new Function('url', 'return import(url)') as (url: string) => Promise<MediaPipeVision>;
    const { FilesetResolver, ImageSegmenter } = await load(`${WASM_PATH}/vision_bundle.mjs`);
    const files = await FilesetResolver.forVisionTasks(WASM_PATH);
    return ImageSegmenter.createFromOptions(files, {
      baseOptions: { modelAssetPath: MODEL_URL },
      runningMode: 'IMAGE',
      outputConfidenceMasks: true,
      outputCategoryMask: false,
    });
  })().catch((e) => {
    segmenter = null; // let the next tap retry
    throw e;
  });
  return segmenter;
}

function loadImage(uri: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Could not load the photo.'));
    img.src = uri;
  });
}

export async function liftSubject(uri: string): Promise<SubjectCutout | null> {
  const [seg, img] = await Promise.all([getSegmenter(), loadImage(uri)]);
  const result = seg.segment(img);
  try {
    const labels = seg.getLabels();
    const masks = result.confidenceMasks ?? [];
    const background = labels.indexOf('background');
    const person = labels.indexOf(PERSON);
    const personMask = person >= 0 ? masks[person]?.getAsFloat32Array() : undefined;
    const backgroundMask = masks[background >= 0 ? background : 0]?.getAsFloat32Array();
    if (!backgroundMask) return null;

    const hasPerson = !!personMask && personMask.some((v) => v > 0.6);
    // How "subject" each pixel is: the person class, or anything that isn't background.
    const subject = hasPerson ? personMask! : backgroundMask.map((v) => 1 - v);
    if (!subject.some((v) => v > 0.6)) return null;

    const { width, height } = masks[0];
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;
    ctx.drawImage(img, 0, 0, width, height);
    const pixels = ctx.getImageData(0, 0, width, height);
    for (let i = 0; i < subject.length; i++) {
      // Soft threshold so the edge feathers instead of stair-stepping.
      const a = Math.min(1, Math.max(0, (subject[i] - 0.35) / 0.3));
      pixels.data[i * 4 + 3] = Math.round(a * 255);
    }
    ctx.putImageData(pixels, 0, 0);

    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/png'));
    if (!blob) return null;
    return { uri: URL.createObjectURL(blob), width, height, kind: hasPerson ? 'person' : 'object' };
  } finally {
    result.close();
  }
}
