import { Directory, File, Paths } from 'expo-file-system';
import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';

import { newId } from '@/lib/ids';

export interface PreparedPhoto {
  /** Temporary file in the cache directory. */
  uri: string;
  width: number;
  height: number;
}

const MAX_SIDE = 2000;
const THUMB_WIDTH = 360;
const PHOTO_DIR = 'vouchers';

/**
 * Re-encodes a captured or picked photo: bakes in the EXIF rotation and caps the long side at 2000px.
 * OCR frames and the saved photo then share one upright coordinate space.
 */
export async function preparePhoto(uri: string, width: number, height: number): Promise<PreparedPhoto> {
  const context = ImageManipulator.manipulate(uri);
  if (Math.max(width, height) > MAX_SIDE) {
    context.resize(width >= height ? { width: MAX_SIDE } : { height: MAX_SIDE });
  }
  const image = await context.renderAsync();
  const saved = await image.saveAsync({ compress: 0.85, format: SaveFormat.JPEG });
  return { uri: saved.uri, width: saved.width, height: saved.height };
}

/**
 * Copies the photo into the document directory and writes a small thumbnail beside it.
 * Returns paths relative to the document directory: on iOS the app container's absolute path
 * changes between installs, so absolute URIs would break. Read them back with `photoFileUri`.
 */
export async function persistPhoto(uri: string): Promise<{ photoUri: string; thumbnailUri: string }> {
  const dir = new Directory(Paths.document, PHOTO_DIR);
  dir.create({ intermediates: true, idempotent: true });

  const id = newId();
  const photoName = `${id}.jpg`;
  const thumbName = `${id}-thumb.jpg`;
  const photo = new File(dir, photoName);
  const thumbFile = new File(dir, thumbName);

  try {
    await new File(uri).copy(photo);
    const thumb = await ImageManipulator.manipulate(uri).resize({ width: THUMB_WIDTH }).renderAsync();
    const savedThumb = await thumb.saveAsync({ compress: 0.7, format: SaveFormat.JPEG });
    await new File(savedThumb.uri).move(thumbFile);
  } catch (error) {
    // Don't leave half a voucher's files behind: nothing references them once the save fails.
    deletePhotos([photo, thumbFile]);
    throw error;
  }

  return { photoUri: `${PHOTO_DIR}/${photoName}`, thumbnailUri: `${PHOTO_DIR}/${thumbName}` };
}

/** Best-effort removal of a voucher's photo files. Phase 4 calls this when a voucher is deleted. */
export function deletePhotos(files: (File | string | undefined)[]): void {
  for (const entry of files) {
    if (!entry) continue;
    const uri = typeof entry === 'string' ? photoFileUri(entry) : entry.uri;
    if (!uri) continue;
    try {
      const file = new File(uri);
      if (file.exists) file.delete();
    } catch (error) {
      console.warn('Clippr: could not delete photo', error);
    }
  }
}

/** Absolute file URI for a stored photo path. Returns null for vouchers without a photo (the samples). */
export function photoFileUri(stored: string | undefined): string | null {
  if (!stored) return null;
  if (stored.startsWith('file://')) return stored;
  return new File(Paths.document, stored).uri;
}
