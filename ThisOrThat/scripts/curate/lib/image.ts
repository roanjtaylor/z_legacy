import fs from 'node:fs';
import crypto from 'node:crypto';
import sharp from 'sharp';
import { ensureDir } from './io.ts';
import path from 'node:path';

export interface ImageMeta {
  width: number;
  height: number;
  format: string;
  bytes: number;
  sha256: string;
}

// Probe an image file. Returns null if sharp cannot decode it (not a real image).
export async function probeImage(file: string): Promise<ImageMeta | null> {
  try {
    const buf = fs.readFileSync(file);
    const meta = await sharp(buf).metadata();
    if (!meta.width || !meta.height || !meta.format) return null;
    return {
      width: meta.width,
      height: meta.height,
      format: meta.format,
      bytes: buf.length,
      sha256: crypto.createHash('sha256').update(buf).digest('hex'),
    };
  } catch {
    return null;
  }
}

// Re-encode the chosen image: strip metadata (EXIF), cap long edge, write JPEG.
export async function writeFullImage(srcFile: string, destFile: string, maxLongEdge = 2000) {
  ensureDir(path.dirname(destFile));
  await sharp(srcFile)
    .rotate() // apply EXIF orientation before stripping
    .resize({ width: maxLongEdge, height: maxLongEdge, fit: 'inside', withoutEnlargement: true })
    .jpeg({ quality: 86, mozjpeg: true })
    .toFile(destFile);
}

// Generate a WebP thumbnail.
export async function writeThumb(srcFile: string, destFile: string, longEdge = 400) {
  ensureDir(path.dirname(destFile));
  await sharp(srcFile)
    .rotate()
    .resize({ width: longEdge, height: longEdge, fit: 'inside', withoutEnlargement: true })
    .webp({ quality: 80 })
    .toFile(destFile);
}
