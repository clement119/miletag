// Copies runtime files the web build loads by URL into /public:
// - Skia's CanvasKit WASM (route canvas)
// - MapLibre's worker script (map backgrounds); Metro can't bundle it.
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const assets = [
  ['node_modules/canvaskit-wasm/bin/full/canvaskit.wasm', 'public/canvaskit.wasm'],
  ['node_modules/maplibre-gl/dist/maplibre-gl-worker.mjs', 'public/maplibre/maplibre-gl-worker.mjs'],
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
