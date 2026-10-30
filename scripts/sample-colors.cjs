const sharp = require('sharp');

async function sampleColors(filePath) {
  const { data, info } = await sharp(filePath)
    .resize(100, 100, { fit: 'inside' })
    .raw()
    .toBuffer({ resolveWithObject: true });

  const colorCounts = {};
  for (let i = 0; i < data.length; i += info.channels) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    // Quantize to reduce noise
    const qr = Math.round(r / 16) * 16;
    const qg = Math.round(g / 16) * 16;
    const qb = Math.round(b / 16) * 16;
    const hex = `#${((1 << 24) + (qr << 16) + (qg << 8) + qb).toString(16).slice(1)}`;
    colorCounts[hex] = (colorCounts[hex] || 0) + 1;
  }

  const sorted = Object.entries(colorCounts).sort((a, b) => b[1] - a[1]);
  return sorted.slice(0, 10);
}

async function main() {
  console.log('Dominant colors for logo.jpg:');
  const logoColors = await sampleColors('assets/photos/brand/logo.jpg');
  console.log(logoColors);

  console.log('\nDominant colors for naman-header.jpg:');
  const photoColors = await sampleColors('assets/photos/naman/naman-header.jpg');
  console.log(photoColors);
}

main();

