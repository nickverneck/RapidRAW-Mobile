/**
 * Generate PWA icons for development
 * This creates simple colored squares as placeholders
 */

import { createCanvas } from 'canvas';
import fs from 'fs';
import path from 'path';

const sizes = [192, 512];
const staticDir = path.join(process.cwd(), 'static');

// Ensure static directory exists
if (!fs.existsSync(staticDir)) {
  fs.mkdirSync(staticDir, { recursive: true });
}

sizes.forEach(size => {
  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext('2d');
  
  // Create gradient background
  const gradient = ctx.createLinearGradient(0, 0, size, size);
  gradient.addColorStop(0, '#1e1b4b'); // theme color
  gradient.addColorStop(1, '#3730a3');
  
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, size, size);
  
  // Add text
  ctx.fillStyle = 'white';
  ctx.font = `${size / 8}px Arial`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('RD', size / 2, size / 2);
  
  // Save as PNG
  const buffer = canvas.toBuffer('image/png');
  fs.writeFileSync(path.join(staticDir, `pwa-${size}x${size}.png`), buffer);
  
  console.log(`Generated pwa-${size}x${size}.png`);
});

// Create apple-touch-icon
const appleCanvas = createCanvas(180, 180);
const appleCtx = appleCanvas.getContext('2d');

const appleGradient = appleCtx.createLinearGradient(0, 0, 180, 180);
appleGradient.addColorStop(0, '#1e1b4b');
appleGradient.addColorStop(1, '#3730a3');

appleCtx.fillStyle = appleGradient;
appleCtx.fillRect(0, 0, 180, 180);

appleCtx.fillStyle = 'white';
appleCtx.font = '22px Arial';
appleCtx.textAlign = 'center';
appleCtx.textBaseline = 'middle';
appleCtx.fillText('RD', 90, 90);

const appleBuffer = appleCanvas.toBuffer('image/png');
fs.writeFileSync(path.join(staticDir, 'apple-touch-icon.png'), appleBuffer);

console.log('Generated apple-touch-icon.png');
console.log('PWA icons generated successfully!');