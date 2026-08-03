#!/usr/bin/env node
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { deflateSync } from "node:zlib";

const repoRoot = new URL("..", import.meta.url).pathname;
const iconDir = join(repoRoot, "public", "icons");
mkdirSync(iconDir, { recursive: true });

const indigo = "#4d41c8";
const white = "#ffffff";
const scale = 0.88;

const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" role="img" aria-label="DueNow App Icon">
  <rect width="100" height="100" fill="${indigo}"/>
  <g transform="translate(50 50) scale(${scale}) translate(-50 -50)" fill="${white}" stroke="${white}" stroke-linecap="round" stroke-linejoin="round">
    <path d="M16 30 L25 39 L40 21" fill="none" stroke-width="7"/>
    <path d="M16 62 L25 71 L40 53" fill="none" stroke-width="7"/>
    <path fill-rule="evenodd" stroke="none" d="M58 18H68C78 18 85 23 85 30.5C85 38 78 43 68 43H58ZM65 25V36H68C73 36 78 34 78 30.5C78 27 73 25 68 25Z"/>
    <path stroke="none" d="M58 57H65L76 74V57H83V82H76L65 65V82H58Z"/>
  </g>
</svg>
`;

for (const name of ["app-icon.svg", "favicon.svg"]) {
  writeFileSync(join(iconDir, name), svg);
}

writePng(join(iconDir, "app-icon-192.png"), 192);
writePng(join(iconDir, "app-icon-512.png"), 512);
writePng(join(iconDir, "app-icon-maskable-512.png"), 512);
writePng(join(iconDir, "apple-touch-icon-180.png"), 180);
writePng(join(iconDir, "apple-touch-icon-167.png"), 167);
writePng(join(iconDir, "apple-touch-icon-152.png"), 152);

function writePng(path, size) {
  const rgba = Buffer.alloc(size * size * 4);
  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      const point = toDesignPoint(x, y, size);
      const fill = isWhite(point.x, point.y) ? [255, 255, 255] : [77, 65, 200];
      const offset = (y * size + x) * 4;
      rgba[offset] = fill[0];
      rgba[offset + 1] = fill[1];
      rgba[offset + 2] = fill[2];
      rgba[offset + 3] = 255;
    }
  }

  const rawRows = Buffer.alloc((size * 4 + 1) * size);
  for (let y = 0; y < size; y += 1) {
    const rowStart = y * (size * 4 + 1);
    rawRows[rowStart] = 0;
    rgba.copy(rawRows, rowStart + 1, y * size * 4, (y + 1) * size * 4);
  }

  writeFileSync(path, Buffer.concat([pngSignature(), chunk("IHDR", ihdr(size)), chunk("IDAT", deflateSync(rawRows)), chunk("IEND", Buffer.alloc(0))]));
}

function toDesignPoint(x, y, size) {
  const unitX = ((x + 0.5) / size) * 100;
  const unitY = ((y + 0.5) / size) * 100;
  return {
    x: 50 + (unitX - 50) / scale,
    y: 50 + (unitY - 50) / scale,
  };
}

function isWhite(x, y) {
  return onPolyline(x, y, [[16, 30], [25, 39], [40, 21]], 7)
    || onPolyline(x, y, [[16, 62], [25, 71], [40, 53]], 7)
    || inLetterD(x, y)
    || inLetterN(x, y);
}

function onPolyline(x, y, points, width) {
  return points.slice(1).some((point, index) => distanceToSegment(x, y, points[index], point) <= width / 2);
}

function distanceToSegment(x, y, [x1, y1], [x2, y2]) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const t = Math.max(0, Math.min(1, ((x - x1) * dx + (y - y1) * dy) / (dx * dx + dy * dy)));
  return Math.hypot(x - (x1 + t * dx), y - (y1 + t * dy));
}

function inLetterD(x, y) {
  const inBar = x >= 58 && x <= 65 && y >= 18 && y <= 43;
  const outer = x >= 62 && ((x - 68) ** 2) / (17 ** 2) + ((y - 30.5) ** 2) / (12.5 ** 2) <= 1;
  const inner = x >= 65 && ((x - 68) ** 2) / (10 ** 2) + ((y - 30.5) ** 2) / (5.5 ** 2) <= 1;
  return inBar || (outer && !inner);
}

function inLetterN(x, y) {
  return (x >= 58 && x <= 65 && y >= 57 && y <= 82)
    || (x >= 76 && x <= 83 && y >= 57 && y <= 82)
    || pointInPolygon([x, y], [[64, 57], [70, 57], [79, 82], [73, 82]]);
}

function pointInPolygon([x, y], polygon) {
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i, i += 1) {
    const [xi, yi] = polygon[i];
    const [xj, yj] = polygon[j];
    if ((yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}

function pngSignature() {
  return Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
}

function ihdr(size) {
  const buffer = Buffer.alloc(13);
  buffer.writeUInt32BE(size, 0);
  buffer.writeUInt32BE(size, 4);
  buffer[8] = 8;
  buffer[9] = 6;
  return buffer;
}

function chunk(type, data) {
  const typeBuffer = Buffer.from(type);
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length);
  const crcBuffer = Buffer.alloc(4);
  crcBuffer.writeUInt32BE(crc32(Buffer.concat([typeBuffer, data])));
  return Buffer.concat([length, typeBuffer, data, crcBuffer]);
}

function crc32(buffer) {
  let crc = 0xffffffff;
  for (const byte of buffer) {
    crc ^= byte;
    for (let bit = 0; bit < 8; bit += 1) {
      crc = (crc >>> 1) ^ (0xedb88320 & -(crc & 1));
    }
  }
  return (crc ^ 0xffffffff) >>> 0;
}
