import sharp from 'sharp';
import { readFileSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = join(__dirname, '..');
const publicDir = join(rootDir, 'public');
const iconsDir = join(publicDir, 'icons');

// Ensure icons directory exists
mkdirSync(iconsDir, { recursive: true });

// Read the SVG
const svgPath = join(publicDir, 'favicon.svg');
const svgBuffer = readFileSync(svgPath);

// Icon sizes to generate
const icons = [
  { name: 'icon-32.png', size: 32 },
  { name: 'icon-192.png', size: 192 },
  { name: 'icon-512.png', size: 512 },
  { name: 'apple-touch-icon.png', size: 180 },
];

// Maskable icons (with padding for safe zone)
const maskableIcons = [
  { name: 'icon-192-maskable.png', size: 192 },
  { name: 'icon-512-maskable.png', size: 512 },
];

console.log('Generating icons from favicon.svg...\n');

// Generate regular icons
for (const icon of icons) {
  const outputPath = join(iconsDir, icon.name);

  await sharp(svgBuffer)
    .resize(icon.size, icon.size)
    .png()
    .toFile(outputPath);

  console.log(`  Created: ${icon.name} (${icon.size}x${icon.size})`);
}

// Generate maskable icons (logo at 60% size with cream background for safe zone)
const backgroundColor = { r: 250, g: 247, b: 242, alpha: 1 }; // #FAF7F2 cream

for (const icon of maskableIcons) {
  const outputPath = join(iconsDir, icon.name);
  const logoSize = Math.round(icon.size * 0.6); // Logo at 60% to fit in safe zone
  const padding = Math.round((icon.size - logoSize) / 2);

  // Resize the SVG to the smaller size first
  const resizedLogo = await sharp(svgBuffer)
    .resize(logoSize, logoSize)
    .png()
    .toBuffer();

  // Create the maskable icon with background and centered logo
  await sharp({
    create: {
      width: icon.size,
      height: icon.size,
      channels: 4,
      background: backgroundColor,
    },
  })
    .composite([
      {
        input: resizedLogo,
        top: padding,
        left: padding,
      },
    ])
    .png()
    .toFile(outputPath);

  console.log(`  Created: ${icon.name} (${icon.size}x${icon.size}, maskable)`);
}

// Also create a favicon.ico in public root
const faviconIcoPath = join(publicDir, 'favicon.ico');
await sharp(svgBuffer)
  .resize(32, 32)
  .png()
  .toFile(faviconIcoPath);
console.log(`  Created: favicon.ico (32x32)`);

console.log('\nDone! Icons generated successfully.');
