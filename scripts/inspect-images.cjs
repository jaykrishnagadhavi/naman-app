const fs = require('fs');

function getJpgDimensions(filePath) {
  const buffer = fs.readFileSync(filePath);
  let offset = 2;
  while (offset < buffer.length) {
    if (buffer[offset] !== 0xff) break;
    const marker = buffer[offset + 1];
    if (marker === 0xc0 || marker === 0xc2) {
      const height = buffer.readUInt16BE(offset + 5);
      const width = buffer.readUInt16BE(offset + 7);
      return { width, height };
    }
    const length = buffer.readUInt16BE(offset + 2);
    offset += 2 + length;
  }
  return null;
}

const images = [
  'assets/photos/brand/logo.jpg',
  'assets/photos/naman/naman-header.jpg'
];

for (const img of images) {
  const stat = fs.statSync(img);
  const dims = getJpgDimensions(img);
  console.log(`${img}: ${dims ? dims.width + 'x' + dims.height : 'unknown'}, size: ${(stat.size / 1024).toFixed(1)} KB`);
}

