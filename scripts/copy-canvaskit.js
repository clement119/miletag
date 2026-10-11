// Copies Skia's CanvasKit WASM into /public so the web build can load it.
const fs = require('fs');
const path = require('path');

const src = path.join(__dirname, '..', 'node_modules', 'canvaskit-wasm', 'bin', 'full', 'canvaskit.wasm');
const destDir = path.join(__dirname, '..', 'public');

if (!fs.existsSync(src)) {
  console.warn('canvaskit.wasm not found; skipping web Skia setup.');
  process.exit(0);
}
fs.mkdirSync(destDir, { recursive: true });
fs.copyFileSync(src, path.join(destDir, 'canvaskit.wasm'));
