// Génère les icônes PNG de l'application à partir du logo (deux cercles qui se recouvrent).
// Usage ponctuel : node scripts/make-icons.mjs   (nécessite Playwright, non installé par défaut)
import { createRequire } from "node:module";
import { mkdirSync } from "node:fs";
const require = createRequire(import.meta.url);
const { chromium } = require("playwright");

const logo = (scale, tx, ty) => `
  <defs><clipPath id="l"><circle cx="62" cy="52" r="44"/></clipPath></defs>
  <g transform="translate(${tx} ${ty}) scale(${scale})">
    <circle cx="62" cy="52" r="44" fill="#ffaebb"/><circle cx="106" cy="52" r="44" fill="#dcbdef"/>
    <circle cx="106" cy="52" r="44" fill="#ffffff" clip-path="url(#l)"/>
  </g>`;

// « any » : coins arrondis. « maskable » et Apple : plein cadre, logo dans la zone sûre (80 %).
const variants = [
  { file: "public/icon-192.png", size: 192, svg: `<rect width="512" height="512" rx="112" fill="#8f52ba"/>${logo(2.4, 54, 131)}` },
  { file: "public/icon-512.png", size: 512, svg: `<rect width="512" height="512" rx="112" fill="#8f52ba"/>${logo(2.4, 54, 131)}` },
  { file: "public/icon-maskable-512.png", size: 512, svg: `<rect width="512" height="512" fill="#8f52ba"/>${logo(1.9, 96, 157)}` },
  { file: "src/app/apple-icon.png", size: 180, svg: `<rect width="512" height="512" fill="#8f52ba"/>${logo(2.1, 79, 147)}` },
];

mkdirSync("public", { recursive: true });
const browser = await chromium.launch();
for (const v of variants) {
  const page = await browser.newPage({ viewport: { width: v.size, height: v.size }, deviceScaleFactor: 1 });
  await page.setContent(`<body style="margin:0;background:transparent"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="${v.size}" height="${v.size}">${v.svg}</svg></body>`);
  await page.screenshot({ path: v.file, omitBackground: true });
  await page.close();
  console.log("écrit", v.file);
}
await browser.close();
