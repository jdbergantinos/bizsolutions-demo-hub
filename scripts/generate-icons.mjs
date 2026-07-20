// Generates simple placeholder PWA icons (solid navy background with a
// light "bar chart" mark) as real PNG files, using only Node built-ins.
// Run automatically before `npm run build`, or manually via `npm run icons`.
import { deflateSync } from "node:zlib";
import { writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const outDir = join(dirname(fileURLToPath(import.meta.url)), "..", "public", "icons");
mkdirSync(outDir, { recursive: true });

const CRC_TABLE = (() => {
  const t = new Int32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c;
  }
  return t;
})();

function crc32(buf) {
  let c = -1;
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ -1) >>> 0;
}

function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const body = Buffer.concat([Buffer.from(type, "ascii"), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body));
  return Buffer.concat([len, body, crc]);
}

const NAVY = [15, 76, 129];
const BARS = [
  [125, 211, 252],
  [186, 230, 253],
  [224, 242, 254],
];

function pixel(x, y, size, padded) {
  // Three vertical bars of increasing height, roughly centered.
  const pad = padded ? size * 0.22 : size * 0.12; // maskable icons need a safe zone
  const inner = size - pad * 2;
  const barW = inner * 0.2;
  const gap = (inner - barW * 3) / 2;
  const baseline = pad + inner;
  const heights = [0.45, 0.68, 0.95];
  for (let i = 0; i < 3; i++) {
    const bx = pad + i * (barW + gap);
    const h = inner * heights[i];
    if (x >= bx && x < bx + barW && y >= baseline - h && y < baseline) return BARS[i];
  }
  return NAVY;
}

function makePng(size, padded) {
  const raw = Buffer.alloc(size * (size * 3 + 1));
  let p = 0;
  for (let y = 0; y < size; y++) {
    raw[p++] = 0; // filter byte: none
    for (let x = 0; x < size; x++) {
      const [r, g, b] = pixel(x, y, size, padded);
      raw[p++] = r;
      raw[p++] = g;
      raw[p++] = b;
    }
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 2; // color type: RGB
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk("IHDR", ihdr),
    chunk("IDAT", deflateSync(raw)),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

writeFileSync(join(outDir, "icon-192.png"), makePng(192, false));
writeFileSync(join(outDir, "icon-512.png"), makePng(512, false));
writeFileSync(join(outDir, "icon-maskable-512.png"), makePng(512, true));
console.log("PWA icons generated in public/icons");
