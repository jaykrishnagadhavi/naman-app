const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const ASSETS_DIR = path.join(__dirname, '..', 'assets', 'photos');
const OUTPUT_DIR = path.join(__dirname, '..', 'packages', 'ui', 'assets', 'img');

const TARGET_WIDTHS = [480, 960, 1600, 2400];

// Custom metadata / focal point / alt text overrides
const METADATA_OVERRIDES = {
  'brand/logo': {
    alt: 'ABrainoConscious emblem featuring Naman with a vibrant saffron circular badge',
    focalPoint: '50% 50%',
    role: 'brand-logo'
  },
  'naman/naman-header': {
    alt: 'Naman, creator of ABrainoConscious, holding a marker ready to teach against a dark studio background',
    focalPoint: '50% 32%',
    role: 'creator-hero'
  }
};

function getAllImageFiles(dir, baseDir = dir) {
  if (!fs.existsSync(dir)) return [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  let files = [];
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files = files.concat(getAllImageFiles(fullPath, baseDir));
    } else if (/\.(jpe?g|png|webp)$/i.test(entry.name)) {
      files.push({
        fullPath,
        relPath: path.relative(baseDir, fullPath).replace(/\\/g, '/')
      });
    }
  }
  return files;
}

async function processImage(imageInfo) {
  const { fullPath, relPath } = imageInfo;
  const parsed = path.parse(relPath);
  const imageKey = path.join(parsed.dir, parsed.name).replace(/\\/g, '/');

  console.log(`Processing image: ${relPath} (key: ${imageKey})`);

  const metadata = await sharp(fullPath).metadata();
  const originalWidth = metadata.width || 1280;
  const originalHeight = metadata.height || 720;
  const aspectRatio = +(originalWidth / originalHeight).toFixed(4);

  // Tiny blurred placeholder
  const placeholderBuffer = await sharp(fullPath)
    .resize(20, Math.round(20 / aspectRatio), { fit: 'inside' })
    .webp({ quality: 20 })
    .toBuffer();
  const placeholderDataUrl = `data:image/webp;base64,${placeholderBuffer.toString('base64')}`;

  // Filter widths: never upscale
  const validWidths = TARGET_WIDTHS.filter(w => w <= originalWidth);
  // Ensure we at least have one rendition at the original width if it's smaller than any target
  if (validWidths.length === 0) {
    validWidths.push(originalWidth);
  }

  const renditions = [];

  const subDir = path.join(OUTPUT_DIR, parsed.dir);
  if (!fs.existsSync(subDir)) {
    fs.mkdirSync(subDir, { recursive: true });
  }

  for (const width of validWidths) {
    const height = Math.round(width / aspectRatio);

    // 1. AVIF
    const avifFileName = `${parsed.name}-${width}.avif`;
    const avifOutPath = path.join(subDir, avifFileName);
    const avifRelSrc = `/img/${parsed.dir ? parsed.dir + '/' : ''}${avifFileName}`;

    await sharp(fullPath)
      .resize(width, height, { fit: 'inside' })
      .avif({ quality: 75, effort: 4 })
      .toFile(avifOutPath);

    const avifStat = fs.statSync(avifOutPath);
    renditions.push({
      width,
      height,
      format: 'avif',
      src: avifRelSrc,
      sizeBytes: avifStat.size
    });

    // 2. WebP
    const webpFileName = `${parsed.name}-${width}.webp`;
    const webpOutPath = path.join(subDir, webpFileName);
    const webpRelSrc = `/img/${parsed.dir ? parsed.dir + '/' : ''}${webpFileName}`;

    await sharp(fullPath)
      .resize(width, height, { fit: 'inside' })
      .webp({ quality: 80, effort: 4 })
      .toFile(webpOutPath);

    const webpStat = fs.statSync(webpOutPath);
    renditions.push({
      width,
      height,
      format: 'webp',
      src: webpRelSrc,
      sizeBytes: webpStat.size
    });
  }

  const override = METADATA_OVERRIDES[imageKey] || {};

  return {
    id: imageKey,
    filename: parsed.base,
    originalWidth,
    originalHeight,
    aspectRatio,
    focalPoint: override.focalPoint || '50% 50%',
    alt: override.alt || `ABrainoConscious visual: ${parsed.name}`,
    placeholder: placeholderDataUrl,
    renditions
  };
}

async function main() {
  console.log('--- Starting Image Optimization Pipeline ---');
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  const imageFiles = getAllImageFiles(ASSETS_DIR);
  console.log(`Found ${imageFiles.length} source images in ${ASSETS_DIR}`);

  const index = {};

  for (const img of imageFiles) {
    try {
      const result = await processImage(img);
      index[result.id] = result;
      console.log(`  ✓ ${result.id} -> ${result.renditions.length} renditions generated.`);
    } catch (err) {
      console.error(`  ✗ Error processing ${img.relPath}:`, err.message);
    }
  }

  const indexPath = path.join(OUTPUT_DIR, 'index.json');
  fs.writeFileSync(indexPath, JSON.stringify(index, null, 2), 'utf-8');
  console.log(`\nGenerated index at ${indexPath} with ${Object.keys(index).length} entries.`);

  // Also write a TypeScript module for direct typed imports in packages/ui
  const tsModulePath = path.join(__dirname, '..', 'packages', 'ui', 'src', 'generated-images.ts');
  const tsContent = `// Auto-generated by scripts/optimize-images.cjs. Do not edit directly.
export interface ImageRendition {
  width: number;
  height: number;
  format: 'avif' | 'webp';
  src: string;
  sizeBytes: number;
}

export interface ImageManifestEntry {
  id: string;
  filename: string;
  originalWidth: number;
  originalHeight: number;
  aspectRatio: number;
  focalPoint: string;
  alt: string;
  placeholder: string;
  renditions: ImageRendition[];
}

export const IMAGES_INDEX: Record<string, ImageManifestEntry> = ${JSON.stringify(index, null, 2)};
`;
  const uiSrcDir = path.dirname(tsModulePath);
  if (!fs.existsSync(uiSrcDir)) {
    fs.mkdirSync(uiSrcDir, { recursive: true });
  }
  fs.writeFileSync(tsModulePath, tsContent, 'utf-8');
  console.log(`Generated typed manifest at ${tsModulePath}.`);

  // Copy optimized outputs to each app's public/img directory so dev and production builds serve them statically
  const appPublicDirs = [
    path.join(__dirname, '..', 'apps', 'landing', 'public', 'img'),
    path.join(__dirname, '..', 'apps', 'web', 'public', 'img'),
    path.join(__dirname, '..', 'apps', 'admin', 'public', 'img')
  ];

  for (const targetDir of appPublicDirs) {
    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
    }
    fs.cpSync(OUTPUT_DIR, targetDir, { recursive: true });
    console.log(`Synced optimized images to ${targetDir}`);
  }

  console.log('--- Image Optimization Pipeline Complete ---');
}

main().catch(err => {
  console.error('Fatal error in image pipeline:', err);
  process.exit(1);
});

