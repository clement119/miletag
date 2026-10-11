/**
 * Magic wand (web): lifts the person out of a photo as a cut-out PNG with a
 * transparent background, so the editor can draw them above the text and route.
 *
 * Uses MODNet (portrait matting, Apache-2.0: github.com/ZHKKKe/MODNet) through
 * ONNX Runtime Web. Matting gives a soft alpha with real hair and edge detail,
 * which is what makes text "behind" a runner look believable. It is trained on
 * people: it lifts runners, not bikes or medals.
 *
 * Preview quality: it runs on the preview photo. The print render must redo this on
 * the original, server side.
 */

import type { SubjectCutout } from './subject-cutout';

export { LiftUnavailableError, type SubjectCutout } from './subject-cutout';

// Inline type import: eslint-plugin-import can't read onnxruntime-web's declarations.
type Ort = typeof import('onnxruntime-web');

// ONNX Runtime (JS + WASM) is copied to /public/onnx by scripts/copy-web-assets.js.
const ORT_PATH = '/onnx/';
// MODNet, photographic portrait matting, exported to ONNX (Apache-2.0; Xenova/modnet on
// Hugging Face). The 8-bit build: 6.6 MB instead of 25 MB, and on a side-by-side test the
// edges matched the full-precision model. Re-check on long or flyaway hair; switch to
// onnx/model.onnx if it frays. TODO: self-host before launch.
const MODEL_URL = 'https://huggingface.co/Xenova/modnet/resolve/main/onnx/model_quantized.onnx';
/** MODNet's input: shortest side 512, both sides a multiple of 32. */
const REF_SIZE = 512;

let session: Promise<{ ort: Ort; session: Awaited<ReturnType<Ort['InferenceSession']['create']>> }> | null = null;

function getSession() {
  session ??= (async () => {
    // Loaded on first use only, straight from our /public: Metro can't bundle ONNX
    // Runtime, and `Function` keeps Metro from trying to resolve the URL at build time.
    const load = new Function('url', 'return import(url)') as (url: string) => Promise<Ort>;
    const ort = await load(`${ORT_PATH}ort.wasm.bundle.min.mjs`);
    ort.env.wasm.wasmPaths = ORT_PATH;
    // Threads need cross-origin isolation, which the site doesn't have.
    ort.env.wasm.numThreads = 1;
    return { ort, session: await ort.InferenceSession.create(MODEL_URL, { executionProviders: ['wasm'] }) };
  })().catch((e) => {
    session = null; // let the next tap retry
    throw e;
  });
  return session;
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

function canvas(width: number, height: number) {
  const c = document.createElement('canvas');
  c.width = width;
  c.height = height;
  const ctx = c.getContext('2d', { willReadFrequently: true });
  if (!ctx) throw new Error('No 2D canvas.');
  return { c, ctx };
}

/** MODNet's input size for a photo: shortest side 512, rounded to multiples of 32. */
function inputSize(width: number, height: number) {
  const scale = REF_SIZE / Math.min(width, height);
  const round32 = (v: number) => Math.max(32, Math.round((v * scale) / 32) * 32);
  return { w: round32(width), h: round32(height) };
}

export async function liftSubject(uri: string): Promise<SubjectCutout | null> {
  const [{ ort, session: model }, img] = await Promise.all([getSession(), loadImage(uri)]);
  const { naturalWidth: W, naturalHeight: H } = img;
  const { w, h } = inputSize(W, H);

  // Photo → 1×3×h×w float tensor, normalised to −1…1 (MODNet's mean 0.5, std 0.5).
  const small = canvas(w, h);
  small.ctx.drawImage(img, 0, 0, w, h);
  const rgba = small.ctx.getImageData(0, 0, w, h).data;
  const input = new Float32Array(3 * w * h);
  for (let i = 0, plane = w * h; i < plane; i++) {
    input[i] = rgba[i * 4] / 127.5 - 1;
    input[i + plane] = rgba[i * 4 + 1] / 127.5 - 1;
    input[i + 2 * plane] = rgba[i * 4 + 2] / 127.5 - 1;
  }
  const feeds = { [model.inputNames[0]]: new ort.Tensor('float32', input, [1, 3, h, w]) };
  const out = await model.run(feeds);
  const matte = out[model.outputNames[0]].data as Float32Array; // 1×1×h×w, 0..1

  // No one in the photo: nothing to lift.
  let strong = 0;
  for (let i = 0; i < matte.length; i++) if (matte[i] > 0.6) strong++;
  if (strong < matte.length * 0.01) return null;

  // The matte as an alpha mask at model size…
  const mask = canvas(w, h);
  const maskPixels = mask.ctx.createImageData(w, h);
  for (let i = 0; i < matte.length; i++) {
    maskPixels.data[i * 4] = maskPixels.data[i * 4 + 1] = maskPixels.data[i * 4 + 2] = 255;
    maskPixels.data[i * 4 + 3] = Math.round(Math.min(1, Math.max(0, matte[i])) * 255);
  }
  mask.ctx.putImageData(maskPixels, 0, 0);

  // …scaled up (smoothly) onto the full preview photo: keep the photo only where the matte is.
  const cut = canvas(W, H);
  cut.ctx.drawImage(img, 0, 0, W, H);
  cut.ctx.globalCompositeOperation = 'destination-in';
  cut.ctx.imageSmoothingQuality = 'high';
  cut.ctx.drawImage(mask.c, 0, 0, W, H);

  const blob = await new Promise<Blob | null>((resolve) => cut.c.toBlob(resolve, 'image/png'));
  if (!blob) return null;
  return { uri: URL.createObjectURL(blob), width: W, height: H, kind: 'person' };
}
