// Copies runtime files the web build loads by URL into /public:
// - Skia's CanvasKit WASM (route canvas)
// - MapLibre's worker script (map backgrounds); Metro can't bundle it.
// - ONNX Runtime Web (magic wand: MODNet portrait matting).
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const assets = [
  ['node_modules/canvaskit-wasm/bin/full/canvaskit.wasm', 'public/canvaskit.wasm'],
  ['node_modules/maplibre-gl/dist/maplibre-gl-worker.mjs', 'public/maplibre/maplibre-gl-worker.mjs'],
  // ONNX Runtime Web (magic wand: MODNet portrait matting). Loaded at runtime from /onnx:
  // Metro can't bundle it. The single-thread SIMD build is enough (no cross-origin isolation).
  ['node_modules/onnxruntime-web/dist/ort.wasm.bundle.min.mjs', 'public/onnx/ort.wasm.bundle.min.mjs'],
  ['node_modules/onnxruntime-web/dist/ort-wasm-simd-threaded.wasm', 'public/onnx/ort-wasm-simd-threaded.wasm'],
  ['node_modules/onnxruntime-web/dist/ort-wasm-simd-threaded.mjs', 'public/onnx/ort-wasm-simd-threaded.mjs'],
];

for (const [from, to] of assets) {
  const src = path.join(root, from);
  if (!fs.existsSync(src)) {
    console.warn(`${from} not found; skipping.`);
    continue;
  }
  const dest = path.join(root, to);
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.copyFileSync(src, dest);
}
