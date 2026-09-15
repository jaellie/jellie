// Self-contained PNG icon generator (no external deps) for the Pawprint
// extension toolbar/store icons. Draws a simple rounded-square badge with a
// white pawprint glyph, at the sizes Chrome expects.
import { deflateSync } from "node:zlib";
import { writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const outDir = join(__dirname, "..", "public", "icons");
mkdirSync(outDir, { recursive: true });

const CRC_TABLE = (() => {
  const table = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) {
      c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    }
    table[n] = c >>> 0;
  }
  return table;
})();

function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  }
  return (c ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const typeBuf = Buffer.from(type, "ascii");
  const lenBuf = Buffer.alloc(4);
  lenBuf.writeUInt32BE(data.length, 0);
  const crcBuf = Buffer.alloc(4);
  crcBuf.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])), 0);
  return Buffer.concat([lenBuf, typeBuf, data, crcBuf]);
}

function encodePNG(width, height, rgba) {
  const stride = width * 4;
  const raw = Buffer.alloc((stride + 1) * height);
  for (let y = 0; y < height; y++) {
    raw[y * (stride + 1)] = 0; // filter type: none
    rgba.copy(raw, y * (stride + 1) + 1, y * stride, y * stride + stride);
  }
  const idat = deflateSync(raw, { level: 9 });

  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // color type RGBA
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;

  return Buffer.concat([
    signature,
    chunk("IHDR", ihdr),
    chunk("IDAT", idat),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

function setPixel(rgba, size, x, y, r, g, b, a) {
  if (x < 0 || y < 0 || x >= size || y >= size) return;
  const i = (y * size + x) * 4;
  rgba[i] = r;
  rgba[i + 1] = g;
  rgba[i + 2] = b;
  rgba[i + 3] = a;
}

function drawPawIcon(size) {
  const rgba = Buffer.alloc(size * size * 4, 0); // transparent
  const bg = { r: 217, g: 119, b: 6 }; // amber-600
  const fg = { r: 255, g: 251, b: 235 }; // near-white

  const cx = size / 2;
  const cy = size / 2;
  const radius = size * 0.46;
  const cornerR = size * 0.22;

  // rounded-square background
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const dx = x - cx + 0.5;
      const dy = y - cy + 0.5;
      const inCircleBounds = Math.abs(dx) <= radius && Math.abs(dy) <= radius;
      if (!inCircleBounds) continue;
      // superellipse-ish rounded square via clamped corner circles
      const ax = Math.abs(dx) - (radius - cornerR);
      const ay = Math.abs(dy) - (radius - cornerR);
      let inside = true;
      if (ax > 0 && ay > 0) {
        inside = ax * ax + ay * ay <= cornerR * cornerR;
      }
      if (inside) setPixel(rgba, size, x, y, bg.r, bg.g, bg.b, 255);
    }
  }

  const drawCircle = (ox, oy, r, color) => {
    const minX = Math.floor(ox - r);
    const maxX = Math.ceil(ox + r);
    const minY = Math.floor(oy - r);
    const maxY = Math.ceil(oy + r);
    for (let y = minY; y <= maxY; y++) {
      for (let x = minX; x <= maxX; x++) {
        const dx = x - ox + 0.5;
        const dy = y - oy + 0.5;
        if (dx * dx + dy * dy <= r * r) {
          setPixel(rgba, size, x, y, color.r, color.g, color.b, 255);
        }
      }
    }
  };

  // main pad (large oval, approximated with a circle stretched via two passes)
  const padR = size * 0.19;
  drawCircle(cx, cy + size * 0.09, padR, fg);

  // four toes
  const toeR = size * 0.095;
  const toeOffsets = [
    { x: -0.24, y: -0.16 },
    { x: -0.085, y: -0.26 },
    { x: 0.085, y: -0.26 },
    { x: 0.24, y: -0.16 },
  ];
  for (const t of toeOffsets) {
    drawCircle(cx + size * t.x, cy + size * t.y, toeR, fg);
  }

  return rgba;
}

for (const size of [16, 32, 48, 128]) {
  const rgba = drawPawIcon(size);
  const png = encodePNG(size, size, rgba);
  writeFileSync(join(outDir, `icon${size}.png`), png);
  console.log(`wrote icon${size}.png`);
}
