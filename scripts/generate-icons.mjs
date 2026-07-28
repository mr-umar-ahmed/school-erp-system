// Generates the PWA icon set + manifest screenshots from inline SVG art.
// Run: node scripts/generate-icons.mjs
import sharp from "sharp";
import { mkdir } from "node:fs/promises";
import path from "node:path";

const ICON_SIZES = [72, 96, 128, 144, 152, 192, 384, 512];

/** Green-gradient rounded square with a white graduation cap. */
function iconSvg({ maskable = false } = {}) {
  // Maskable icons need ~20% safe-zone padding around the glyph.
  const glyphScale = maskable ? 0.72 : 0.92;
  const g = (n) => 256 + (n - 256) * glyphScale;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#4CAF50"/>
      <stop offset="1" stop-color="#1B5E20"/>
    </linearGradient>
    <linearGradient id="shine" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#FFFFFF" stop-opacity="0.28"/>
      <stop offset="1" stop-color="#FFFFFF" stop-opacity="0"/>
    </linearGradient>
  </defs>
  <rect width="512" height="512" rx="${maskable ? 0 : 112}" fill="url(#bg)"/>
  <rect width="512" height="256" rx="${maskable ? 0 : 112}" fill="url(#shine)"/>
  <!-- graduation cap -->
  <g fill="#FFFFFF">
    <path d="M${g(256)} ${g(140)} L${g(452)} ${g(224)} L${g(256)} ${g(308)} L${g(60)} ${g(224)} Z"/>
    <path d="M${g(150)} ${g(268)} L${g(150)} ${g(340)} Q ${g(256)} ${g(400)} ${g(362)} ${g(340)} L${g(362)} ${g(268)} L${g(256)} ${g(314)} Z" opacity="0.92"/>
    <rect x="${g(430)}" y="${g(228)}" width="${10 * glyphScale}" height="${86 * glyphScale}" rx="${5 * glyphScale}"/>
    <circle cx="${g(435)}" cy="${g(330)}" r="${14 * glyphScale}"/>
  </g>
</svg>`;
}

function screenshotSvg({ width, height, label }) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#E8F5E9"/>
      <stop offset="1" stop-color="#F1F8E9"/>
    </linearGradient>
    <linearGradient id="chip" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#4CAF50"/>
      <stop offset="1" stop-color="#1B5E20"/>
    </linearGradient>
  </defs>
  <rect width="${width}" height="${height}" fill="url(#bg)"/>
  <rect x="${width * 0.08}" y="${height * 0.12}" width="${width * 0.84}" height="${height * 0.2}" rx="24" fill="#FFFFFF" opacity="0.85"/>
  <rect x="${width * 0.08}" y="${height * 0.38}" width="${width * 0.4}" height="${height * 0.34}" rx="24" fill="#FFFFFF" opacity="0.85"/>
  <rect x="${width * 0.52}" y="${height * 0.38}" width="${width * 0.4}" height="${height * 0.34}" rx="24" fill="#FFFFFF" opacity="0.85"/>
  <rect x="${width * 0.11}" y="${height * 0.16}" width="${height * 0.12}" height="${height * 0.12}" rx="${height * 0.03}" fill="url(#chip)"/>
  <text x="${width / 2}" y="${height * 0.85}" font-family="Arial, sans-serif" font-size="${Math.round(height * 0.045)}" font-weight="bold" fill="#1B5E20" text-anchor="middle">${label}</text>
</svg>`;
}

const root = path.resolve(import.meta.dirname, "..");
const iconsDir = path.join(root, "public", "icons");
const shotsDir = path.join(root, "public", "screenshots");
await mkdir(iconsDir, { recursive: true });
await mkdir(shotsDir, { recursive: true });

const base = Buffer.from(iconSvg());
for (const size of ICON_SIZES) {
  await sharp(base).resize(size, size).png().toFile(
    path.join(iconsDir, `icon-${size}x${size}.png`)
  );
}
await sharp(Buffer.from(iconSvg({ maskable: true })))
  .resize(512, 512)
  .png()
  .toFile(path.join(iconsDir, "maskable-icon-512x512.png"));

// Favicon (32px) into app/ as favicon override + apple touch icon
await sharp(base).resize(180, 180).png().toFile(
  path.join(iconsDir, "apple-touch-icon.png")
);

await sharp(
  Buffer.from(screenshotSvg({ width: 1280, height: 720, label: "EduNexus — Admin Dashboard" }))
)
  .png()
  .toFile(path.join(shotsDir, "dashboard.png"));
await sharp(
  Buffer.from(screenshotSvg({ width: 390, height: 844, label: "EduNexus Mobile" }))
)
  .png()
  .toFile(path.join(shotsDir, "mobile.png"));

console.log("Icons and screenshots generated.");
