// Genera los iconos PNG de la PWA sin dependencias: tres líneas apiladas, trazo fino, sobre carbón.
import { deflateSync } from "node:zlib";
import { mkdirSync, writeFileSync } from "node:fs";

const BG = [0x1b, 0x17, 0x13];
const FG = [0xb8, 0x6a, 0x48];

function crc32(buf) {
  let crc = ~0;
  for (const b of buf) {
    let c = (crc ^ b) & 0xff;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    crc = (crc >>> 8) ^ c;
  }
  return ~crc >>> 0;
}

function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const body = Buffer.concat([Buffer.from(type), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body));
  return Buffer.concat([len, body, crc]);
}

function png(size) {
  const stride = size * 3 + 1;
  const raw = Buffer.alloc(stride * size);
  // Dentro de la zona segura central (60 %) para que valga como icono maskable.
  const lines = [
    [0.3, 0.7, 0.34],
    [0.3, 0.62, 0.5],
    [0.3, 0.54, 0.66],
  ];
  const half = Math.max(1, Math.round(size * 0.008));
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const on = lines.some(([x0, x1, ly]) => x >= x0 * size && x <= x1 * size && Math.abs(y - ly * size) <= half);
      const [r, g, b] = on ? FG : BG;
      const o = y * stride + 1 + x * 3;
      raw[o] = r;
      raw[o + 1] = g;
      raw[o + 2] = b;
    }
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8;
  ihdr[9] = 2;
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk("IHDR", ihdr),
    chunk("IDAT", deflateSync(raw)),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

mkdirSync("public/icons", { recursive: true });
for (const s of [192, 512]) writeFileSync(`public/icons/icon-${s}.png`, png(s));
writeFileSync("src/app/icon.png", png(192));
writeFileSync("src/app/apple-icon.png", png(180));
