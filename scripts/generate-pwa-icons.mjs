import sharp from 'sharp'
import { readFileSync } from 'node:fs'

const svg = readFileSync('public/favicon.svg')

await sharp(svg, { density: 256 })
  .resize(32, 32, { fit: 'contain', background: { r: 29, g: 52, b: 52, alpha: 1 } })
  .png()
  .toFile('public/favicon.png')

await sharp(svg, { density: 256 })
  .resize(48, 48, { fit: 'contain', background: { r: 29, g: 52, b: 52, alpha: 1 } })
  .png()
  .toFile('public/favicon-48.png')

await sharp(svg, { density: 512 })
  .resize(180, 180, { fit: 'contain', background: { r: 29, g: 52, b: 52, alpha: 1 } })
  .png()
  .toFile('public/apple-touch-icon.png')

await sharp(svg, { density: 512 })
  .resize(192, 192, { fit: 'contain', background: { r: 29, g: 52, b: 52, alpha: 1 } })
  .png()
  .toFile('public/pwa-192.png')

await sharp(svg, { density: 1024 })
  .resize(512, 512, { fit: 'contain', background: { r: 29, g: 52, b: 52, alpha: 1 } })
  .png()
  .toFile('public/pwa-512.png')

// Maskable: same website wallet mark with safe padding for Android adaptive icons
const padded = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <rect width="512" height="512" fill="#1d3434"/>
  <g transform="translate(96 96) scale(10)">
    <rect x="11" y="6.5" width="11" height="7" rx="1.4" fill="#7fb84a"/>
    <rect x="13" y="5" width="11" height="7" rx="1.4" fill="#c9e75b"/>
    <rect x="5.5" y="11.5" width="21" height="14.5" rx="3.5" fill="#2f6f8a"/>
    <path fill="#3d88a6" d="M5.5 11.5h21a3.5 3.5 0 0 1 3.5 3.5v1.2H5.5z"/>
    <circle cx="22.2" cy="20.2" r="2.1" fill="#c9e75b"/>
  </g>
</svg>`)

await sharp(padded).resize(512, 512).png().toFile('public/pwa-512-maskable.png')
await sharp(padded).resize(192, 192).png().toFile('public/pwa-192-maskable.png')

console.log('PWA icons restored to previous wallet mark')
