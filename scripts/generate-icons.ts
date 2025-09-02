// scripts/generate-icons.ts
import sharp from 'sharp';
import { mkdir, rm } from 'fs/promises';
import path from 'path';

const SIZES = [192, 256, 384, 512];
const OUTPUT_DIR = path.join(process.cwd(), 'public', 'icons');

// Simple SVG with a running figure emoji and a gradient background
const svg = `
<svg width="512" height="512" viewBox="0 0 512 512" fill="none" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#0ea5e9;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#22d3ee;stop-opacity:1" />
    </linearGradient>
  </defs>
  <rect width="512" height="512" rx="100" fill="url(#grad)"/>
  <image 
    x="102" 
    y="102" 
    width="308" 
    height="308" 
    href="data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAxMDAgMTAwIj48dGV4dCB5PSIuOWVtIiBmb250LXNpemU9IjkwIj7in5Q8L3RleHQ+PC9zdmc+"
  />
</svg>`;

const svgBuffer = Buffer.from(svg);

async function generateIcons() {
  console.log('--- Generating PWA Icons ---');
  await rm(OUTPUT_DIR, { recursive: true, force: true });
  await mkdir(OUTPUT_DIR, { recursive: true });

  // Generate standard icons
  for (const size of SIZES) {
    const filePath = path.join(OUTPUT_DIR, `icon-${size}.png`);
    await sharp(svgBuffer).resize(size, size).toFile(filePath);
    console.log(`✅ Generated ${filePath}`);
  }

  // Generate maskable icons (no rounded corners)
  const maskableSvg = svg.replace(`rx="100"`, `rx="0"`);
  for (const size of SIZES) {
    const filePath = path.join(OUTPUT_DIR, `icon-${size}-maskable.png`);
    await sharp(Buffer.from(maskableSvg)).resize(size, size).toFile(filePath);
    console.log(`✅ Generated ${filePath}`);
  }
  
  // Generate Apple touch icon
  const appleTouchIconPath = path.join(OUTPUT_DIR, 'apple-touch-icon.png');
  await sharp(svgBuffer).resize(180, 180).toFile(appleTouchIconPath);
  console.log(`✅ Generated ${appleTouchIconPath}`);

  // Generate favicon.ico
  const faviconPath = path.join(process.cwd(), 'public', 'favicon.ico');
  await sharp(svgBuffer).resize(48, 48).toFile(faviconPath);
  console.log(`✅ Generated ${faviconPath}`);
  
  console.log('--- Icon generation complete ---');
}

generateIcons().catch(console.error);
