import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { PNG } from 'pngjs';

/** Shield + check — green/safety signal */
const A = { r: 22, g: 163, b: 74 };
const B = { r: 21, g: 128, b: 61 };
const PAPER = { r: 255, g: 255, b: 255, a: 255 };

function setRgba(data, w, x, y, c) {
  if (x < 0 || y < 0 || x >= w || y >= w) return;
  const i = (w * y + x) << 2;
  data[i] = c.r;
  data[i + 1] = c.g;
  data[i + 2] = c.b;
  data[i + 3] = c.a ?? 255;
}

function lerp(a, b, t) {
  return Math.round(a + (b - a) * t);
}

function inRoundedRect(x, y, x0, y0, x1, y1, r) {
  if (x < x0 || x > x1 || y < y0 || y > y1) return false;
  const rl = x0 + r;
  const rr = x1 - r;
  const rt = y0 + r;
  const rb = y1 - r;
  if (x >= rl && x <= rr) return true;
  if (y >= rt && y <= rb) return true;
  const cx = x < rl ? rl : rr;
  const cy = y < rt ? rt : rb;
  const dx = x - cx;
  const dy = y - cy;
  return dx * dx + dy * dy <= r * r;
}

function inShield(x, y, W) {
  const cx = W / 2;
  const top = W * 0.18;
  const bot = W * 0.82;
  const half = W * 0.32;
  if (y < top || y > bot) return false;
  const t = (y - top) / (bot - top);
  const hw = half * (1 - t * 0.55);
  return Math.abs(x - cx) <= hw;
}

function renderIcon(W) {
  const png = new PNG({ width: W, height: W, colorType: 6, inputColorType: 6, bitDepth: 8 });
  const bgR = Math.max(2, Math.round(W * 0.16));
  const bgPad = Math.max(0, Math.round(W * 0.04));

  for (let y = 0; y < W; y++) {
    for (let x = 0; x < W; x++) {
      if (!inRoundedRect(x, y, bgPad, bgPad, W - bgPad - 1, W - bgPad - 1, bgR)) continue;
      const t = (x + y) / (2 * (W - 1));
      setRgba(png.data, W, x, y, {
        r: lerp(A.r, B.r, t),
        g: lerp(A.g, B.g, t),
        b: lerp(A.b, B.b, t),
        a: 255,
      });
    }
  }

  for (let y = 0; y < W; y++) {
    for (let x = 0; x < W; x++) {
      if (inShield(x, y, W)) setRgba(png.data, W, x, y, PAPER);
    }
  }

  // simple check mark
  if (W >= 24) {
    const ink = { r: 22, g: 163, b: 74, a: 255 };
    const thick = Math.max(2, Math.round(W * 0.06));
    for (let i = 0; i < W * 0.22; i++) {
      const x = Math.round(W * 0.32 + i);
      const y = Math.round(W * 0.52 + i * 0.55);
      for (let t = -thick; t <= thick; t++) setRgba(png.data, W, x, y + t, ink);
    }
    for (let i = 0; i < W * 0.28; i++) {
      const x = Math.round(W * 0.48 + i);
      const y = Math.round(W * 0.64 - i * 0.85);
      for (let t = -thick; t <= thick; t++) setRgba(png.data, W, x, y + t, ink);
    }
  }

  return png;
}

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const outDir = path.join(root, 'public', 'icons');
fs.mkdirSync(outDir, { recursive: true });
for (const size of [16, 32, 48, 128]) {
  const png = renderIcon(size);
  fs.writeFileSync(path.join(outDir, `icon${size}.png`), PNG.sync.write(png));
}
console.log('[icons] Is this site safe PNGs → public/icons');
