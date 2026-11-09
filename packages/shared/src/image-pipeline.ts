import type { TypedSupabaseClient } from './supabase';
import { detectImageMimeType } from './utils';

export type ProgramImageKind = 'thumbnail' | 'poster' | 'cover';

export const TARGET_WIDTHS_BY_KIND: Record<ProgramImageKind, number[]> = {
  thumbnail: [480, 960, 1600], // 16:9
  poster: [320, 640, 1000],    // 2:3
  cover: [480, 960, 1600],     // 16:9 or wide hero
};

export const PRIMARY_WIDTH_BY_KIND: Record<ProgramImageKind, number> = {
  thumbnail: 960,
  poster: 640,
  cover: 960,
};

export const ASPECT_RATIO_BY_KIND: Record<ProgramImageKind, number> = {
  thumbnail: 16 / 9,
  poster: 2 / 3,
  cover: 16 / 9,
};

export interface ImageCropParams {
  zoom: number; // e.g. 1.0 to 3.0
  position: { x: number; y: number }; // 0 to 100 percentage coordinates
}

/**
 * Validates a file's size and real binary magic bytes.
 * Blocks files exceeding 10 MB and files with spoofed extensions.
 */
export async function validateImageFile(file: File): Promise<{
  valid: boolean;
  error?: string;
  mimeType?: string;
}> {
  if (file.size > 10 * 1024 * 1024) {
    return { valid: false, error: 'File size exceeds the 10 MB maximum limit.' };
  }

  try {
    const slice = file.slice(0, 16);
    const buffer = await slice.arrayBuffer();
    const mime = detectImageMimeType(buffer);

    if (!mime) {
      return {
        valid: false,
        error: 'Invalid file contents. Only authentic JPEG, PNG, or WebP images are permitted.',
      };
    }

    return { valid: true, mimeType: mime };
  } catch (err) {
    return {
      valid: false,
      error: `Could not verify file: ${err instanceof Error ? err.message : String(err)}`,
    };
  }
}

/**
 * Creates an image element from a file for canvas operations.
 */
function loadImageElement(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Failed to decode image data into browser canvas'));
    };
    img.src = url;
  });
}

/**
 * Renders and re-encodes an image at target width & ratio through an off-screen HTML5 canvas.
 * This inherently strips all EXIF, GPS, and camera metadata and converts to WebP.
 */
export async function renderWebpRendition(
  img: HTMLImageElement,
  targetWidth: number,
  aspectRatio: number,
  crop: ImageCropParams = { zoom: 1, position: { x: 50, y: 50 } },
  quality = 0.88
): Promise<Blob> {
  const targetHeight = Math.round(targetWidth / aspectRatio);
  const canvas = document.createElement('canvas');
  canvas.width = targetWidth;
  canvas.height = targetHeight;

  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Canvas 2D context is not available');
  }

  // Clear canvas
  ctx.fillStyle = '#040C0E';
  ctx.fillRect(0, 0, targetWidth, targetHeight);

  // Calculate source aspect ratio vs target aspect ratio
  const srcWidth = img.naturalWidth;
  const srcHeight = img.naturalHeight;
  const srcRatio = srcWidth / srcHeight;

  let baseDrawWidth = targetWidth;
  let baseDrawHeight = targetHeight;

  if (srcRatio > aspectRatio) {
    // Source is wider than target ratio
    baseDrawHeight = targetHeight;
    baseDrawWidth = targetHeight * srcRatio;
  } else {
    // Source is taller than target ratio
    baseDrawWidth = targetWidth;
    baseDrawHeight = targetWidth / srcRatio;
  }

  // Apply zoom
  const drawWidth = baseDrawWidth * Math.max(1, crop.zoom);
  const drawHeight = baseDrawHeight * Math.max(1, crop.zoom);

  // Calculate centered offsets modified by crop.position (0-100)
  // At position 50%, offset is centered
  const posX = crop.position.x / 100;
  const posY = crop.position.y / 100;

  const maxOffsetX = drawWidth - targetWidth;
  const maxOffsetY = drawHeight - targetHeight;

  const drawX = -maxOffsetX * posX;
  const drawY = -maxOffsetY * posY;

  // Draw image on canvas
  ctx.drawImage(img, drawX, drawY, drawWidth, drawHeight);

  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) {
          resolve(blob);
        } else {
          reject(new Error('Failed to encode canvas to WebP format'));
        }
      },
      'image/webp',
      quality
    );
  });
}

export interface UploadProgramImageOptions {
  supabase: TypedSupabaseClient;
  programId: string;
  kind: ProgramImageKind;
  file: File;
  crop?: ImageCropParams;
  onProgress?: (progressPercent: number) => void;
}

export interface UploadProgramImageResult {
  primaryUrl: string;
  srcset: Record<string, string>;
  uploadedPaths: string[];
}

/**
 * End-to-end program image pipeline:
 * 1. Validates magic bytes & file size (<=10MB).
 * 2. Renders 3 responsive WebP sizes via canvas (stripping EXIF).
 * 3. Uploads files to Supabase Storage bucket 'program-images'.
 * 4. Returns primary public URL and responsive srcset map.
 */
export async function processAndUploadProgramImage({
  supabase,
  programId,
  kind,
  file,
  crop = { zoom: 1, position: { x: 50, y: 50 } },
  onProgress,
}: UploadProgramImageOptions): Promise<UploadProgramImageResult> {
  // 1. Validate magic bytes
  const validation = await validateImageFile(file);
  if (!validation.valid) {
    throw new Error(validation.error || 'Invalid image file');
  }

  onProgress?.(15);

  // 2. Decode image and generate renditions
  const img = await loadImageElement(file);
  onProgress?.(30);

  const widths = TARGET_WIDTHS_BY_KIND[kind];
  const ratio = ASPECT_RATIO_BY_KIND[kind];
  const primaryWidth = PRIMARY_WIDTH_BY_KIND[kind];

  const blobs: { width: number; blob: Blob }[] = [];
  for (const w of widths) {
    const blob = await renderWebpRendition(img, w, ratio, crop);
    blobs.push({ width: w, blob });
  }

  onProgress?.(55);

  // 3. Upload all renditions under programs/<programId>/<kind>-<timestamp>-<width>.webp
  const timestamp = Date.now();
  const srcset: Record<string, string> = {};
  const uploadedPaths: string[] = [];

  const totalRenditions = blobs.length;
  let completedRenditions = 0;

  for (const item of blobs) {
    const storagePath = `programs/${programId}/${kind}-${timestamp}-${item.width}.webp`;

    const { error: uploadError } = await supabase.storage
      .from('program-images')
      .upload(storagePath, item.blob, {
        contentType: 'image/webp',
        cacheControl: '31536000', // 1 year immutable cache
        upsert: false,
      });

    if (uploadError) {
      throw new Error(`Failed to upload ${kind} image (${item.width}w): ${uploadError.message}`);
    }

    uploadedPaths.push(storagePath);

    const { data: { publicUrl } } = supabase.storage
      .from('program-images')
      .getPublicUrl(storagePath);

    srcset[item.width.toString()] = publicUrl;

    completedRenditions++;
    const progress = Math.round(55 + (completedRenditions / totalRenditions) * 45);
    onProgress?.(progress);
  }

  const primaryUrl = srcset[primaryWidth.toString()] || srcset[widths[0].toString()];

  return {
    primaryUrl,
    srcset,
    uploadedPaths,
  };
}

/**
 * Removes old storage files when an image is replaced or removed.
 */
export async function deleteStorageFiles(
  supabase: TypedSupabaseClient,
  bucket: string,
  paths: string[]
): Promise<void> {
  if (!paths || paths.length === 0) return;
  try {
    await supabase.storage.from(bucket).remove(paths);
  } catch (err) {
    console.warn('Could not remove stale storage files:', err);
  }
}

/**
 * Extracts storage paths from public URLs belonging to the program-images bucket.
 */
export function extractStoragePathsFromUrls(
  urls: (string | null | undefined)[],
  bucket = 'program-images'
): string[] {
  const paths: string[] = [];
  const searchPattern = `/${bucket}/`;

  for (const url of urls) {
    if (!url) continue;
    const idx = url.indexOf(searchPattern);
    if (idx !== -1) {
      const pathWithQuery = url.slice(idx + searchPattern.length);
      const cleanPath = pathWithQuery.split('?')[0];
      if (cleanPath && !paths.includes(cleanPath)) {
        paths.push(cleanPath);
      }
    }
  }

  return paths;
}
