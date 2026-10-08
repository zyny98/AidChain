const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const ffmpegPath = require('@ffmpeg-installer/ffmpeg').path;
const inputJpg = path.resolve(__dirname, '../public/brand/aidchain-logo.jpg');
const outputPng = path.resolve(__dirname, '../public/brand/aidchain-logo.png');

const W = 1024;
const H = 1024;

// 1. Extract raw RGBA
const proc = spawn(ffmpegPath, [
  '-i', inputJpg,
  '-f', 'rawvideo',
  '-pix_fmt', 'rgba',
  'pipe:1'
]);

const chunks = [];
proc.stdout.on('data', chunk => chunks.push(chunk));
proc.stdout.on('end', () => {
  const buf = Buffer.concat(chunks);
  console.log('Got raw RGBA bytes:', buf.length);

  // We have W * H * 4 bytes
  // Flood fill from all perimeter pixels
  const visited = new Uint8Array(W * H);
  const queue = new Int32Array(W * H * 2);
  let qHead = 0;
  let qTail = 0;

  function pushQueue(x, y) {
    const idx = y * W + x;
    if (visited[idx]) return;
    visited[idx] = 1;
    queue[qTail++] = x;
    queue[qTail++] = y;
  }

  // Push all borders
  for (let x = 0; x < W; x++) {
    pushQueue(x, 0);
    pushQueue(x, H - 1);
  }
  for (let y = 0; y < H; y++) {
    pushQueue(0, y);
    pushQueue(W - 1, y);
  }

  // Threshold for background black (handles JPEG artifacts)
  const THRESHOLD = 24;

  while (qHead < qTail) {
    const cx = queue[qHead++];
    const cy = queue[qHead++];
    const cidx = (cy * W + cx) * 4;

    const r = buf[cidx];
    const g = buf[cidx + 1];
    const b = buf[cidx + 2];
    const brightness = Math.max(r, g, b);

    if (brightness <= THRESHOLD) {
      // It's background: set alpha to 0
      buf[cidx + 3] = 0;

      // Expand to 4 neighbors
      if (cx > 0) pushQueue(cx - 1, cy);
      if (cx < W - 1) pushQueue(cx + 1, cy);
      if (cy > 0) pushQueue(cx, cy - 1);
      if (cy < H - 1) pushQueue(cx, cy + 1);
    } else {
      // Smooth edge antialiasing: if it's near threshold (24 to 50), soften alpha
      if (brightness < 55) {
        const factor = (brightness - THRESHOLD) / (55 - THRESHOLD);
        buf[cidx + 3] = Math.round(factor * 255);
      }
    }
  }

  // Calculate bounding box of non-transparent content
  let minX = W, maxX = 0, minY = H, maxY = 0;
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const a = buf[(y * W + x) * 4 + 3];
      if (a > 5) {
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }

  console.log(`Content bounding box: [${minX}, ${minY}] to [${maxX}, ${maxY}]`);
  const pad = 10;
  minX = Math.max(0, minX - pad);
  minY = Math.max(0, minY - pad);
  maxX = Math.min(W - 1, maxX + pad);
  maxY = Math.min(H - 1, maxY + pad);

  const cropW = maxX - minX + 1;
  const cropH = maxY - minY + 1;
  console.log(`Cropped dimensions: ${cropW} x ${cropH}`);

  const cropBuf = Buffer.alloc(cropW * cropH * 4);
  for (let y = 0; y < cropH; y++) {
    for (let x = 0; x < cropW; x++) {
      const srcIdx = ((minY + y) * W + (minX + x)) * 4;
      const dstIdx = (y * cropW + x) * 4;
      cropBuf[dstIdx] = buf[srcIdx];
      cropBuf[dstIdx + 1] = buf[srcIdx + 1];
      cropBuf[dstIdx + 2] = buf[srcIdx + 2];
      cropBuf[dstIdx + 3] = buf[srcIdx + 3];
    }
  }

  // 2. Feed cropped raw RGBA back to ffmpeg to encode PNG
  const enc = spawn(ffmpegPath, [
    '-y',
    '-f', 'rawvideo',
    '-pix_fmt', 'rgba',
    '-s', `${cropW}x${cropH}`,
    '-i', 'pipe:0',
    outputPng
  ]);

  enc.stdin.write(cropBuf);
  enc.stdin.end();

  enc.on('close', code => {
    console.log('PNG encoding finished with code:', code);
  });
});
