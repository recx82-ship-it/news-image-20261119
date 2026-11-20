// news-image-20261119 entry (Node 22, standard library only).
// The entry image is entry.png beside this file: a newspaper front page
// summing up Thursday 19 November 2026 — ICJ Myanmar genocide ruling,
// Trump/Xi/Putin Shenzhen summit, COP31 Antalya, Gaza ceasefire strain,
// Hormuz tanker mines. This program checks it is a whole PNG or JPEG
// within the gate's limits (at most 1 MiB, at most 1024 by 1024 pixels)
// and copies it to /output/entry.png.
//
// Outside the grader's container, MAKEFUN_OUTPUT_DIR stands in for /output:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts

import { copyFileSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

const source = new URL('./entry.png', import.meta.url);
const bytes = readFileSync(source);

const isPng = bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47;
const isJpeg = bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
if (!isPng && !isJpeg) {
  throw new Error('entry.png is neither a PNG nor a JPEG (checked by its first bytes)');
}

const size = statSync(source).size;
if (size > 1048576) {
  throw new Error(`entry.png is ${size} bytes, over the 1 MiB limit`);
}

// Dimensions from the header bytes: PNG IHDR at offset 16, JPEG SOF0
// marker (0xffc0/0xffc2) holding height then width as big-endian u16s.
let width = 0;
let height = 0;
if (isPng) {
  width = bytes.readUInt32BE(16);
  height = bytes.readUInt32BE(20);
} else {
  for (let i = 2; i + 9 < bytes.length; i += 1) {
    if (bytes[i] === 0xff && (bytes[i + 1] === 0xc0 || bytes[i + 1] === 0xc2)) {
      height = bytes.readUInt16BE(i + 5);
      width = bytes.readUInt16BE(i + 7);
      break;
    }
  }
}
if (width > 1024 || height > 1024) {
  throw new Error(`entry.png is ${width}x${height}, over the 1024x1024 limit`);
}

const outDir = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';
const dest = join(outDir, 'entry.png');
copyFileSync(source, dest);
console.log(`Entry image: ${size} bytes, ${isPng ? 'PNG' : 'JPEG'} -> ${dest}`);
