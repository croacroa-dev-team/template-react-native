const sharp = require('sharp');
const path = require('path');

const BRAND_COLOR = '#3b82f6'; // Primary blue
const WHITE = '#ffffff';

const images = [
  { name: 'icon.png', width: 1024, height: 1024, bg: BRAND_COLOR },
  { name: 'adaptive-icon.png', width: 1024, height: 1024, bg: BRAND_COLOR },
  { name: 'splash.png', width: 1284, height: 2778, bg: WHITE },
  { name: 'favicon.png', width: 48, height: 48, bg: BRAND_COLOR },
  { name: 'notification-icon.png', width: 96, height: 96, bg: WHITE },
];

async function generateImages() {
  const outputDir = path.join(__dirname, '..', 'assets', 'images');

  for (const img of images) {
    const outputPath = path.join(outputDir, img.name);

    await sharp({
      create: {
        width: img.width,
        height: img.height,
        channels: 4,
        background: img.bg,
      },
    })
      .png()
      .toFile(outputPath);

    console.log(`✓ Generated ${img.name} (${img.width}x${img.height})`);
  }

  console.log('\nDone! Replace these placeholders with your actual assets.');
}

generateImages().catch(console.error);
