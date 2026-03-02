/**
 * Generate favicon-48x48.png and favicon-96x96.png from android-chrome-192x192.png
 * so Google Search can show the favicon in results (requires 48x48 minimum).
 * Run once: node scripts/generate-favicon-sizes.js
 */

const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

const publicDir = path.join(__dirname, '..', 'public');
const source = path.join(publicDir, 'android-chrome-192x192.png');
const sizes = [48, 96];

if (!fs.existsSync(source)) {
  console.error('Source not found:', source);
  console.error('Ensure public/android-chrome-192x192.png exists.');
  process.exit(1);
}

async function run() {
  for (const size of sizes) {
    const out = path.join(publicDir, `favicon-${size}x${size}.png`);
    await sharp(source).resize(size, size).png().toFile(out);
    console.log('Created', out);
  }
  console.log('Done. Favicons for search results are ready.');
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
