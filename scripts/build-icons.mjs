// Generates every Sous icon from one vector source.   npm run build-icons
//
// Mark: a bold "S" whose top terminal sprouts a saffron leaf: Sous, your second-in-command
// for fresh, healthy cooking. Herb-green background, cream mark.

import { Resvg } from '@resvg/resvg-js';
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

export const BRAND = {
  green: '#2F7D4F',
  greenLight: '#3A8F5C',
  greenDark: '#1B5034',
  cream: '#FFF6E6',
  saffron: '#F2B544',
};

const gradient = (id) => `<defs><linearGradient id="${id}" x1="0" y1="0" x2="1" y2="1">
  <stop offset="0" stop-color="${BRAND.greenLight}"/><stop offset="1" stop-color="${BRAND.greenDark}"/></linearGradient></defs>`;

/** The S + leaf on a 1024 canvas, optically centred. `scale` shrinks it about the centre. */
function mark({ s = BRAND.cream, leaf = BRAND.saffron, rib = BRAND.greenDark, scale = 1 } = {}) {
  return `<g transform="translate(512 512) scale(${scale}) translate(-512 -512) translate(-44 -6)">
  <path d="M 630 338 A 128 128 0 1 0 512 530 A 128 128 0 1 1 394 722"
        fill="none" stroke="${s}" stroke-width="104" stroke-linecap="round"/>
  <path d="M 704 300 C 716 236 764 196 830 190 C 826 256 782 300 704 300 Z" fill="${leaf}"/>
  <path d="M 716 288 C 752 258 784 230 812 206" fill="none" stroke="${rib}" stroke-width="9"
        stroke-linecap="round" opacity="${rib === 'none' ? 0 : 0.5}"/>
</g>`;
}

const svg = (body) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 1024">${body}</svg>`;

const SOURCES = {
  // Rounded "app tile": favicons, the in-app logo.
  rounded: svg(`${gradient('g')}<rect width="1024" height="1024" rx="232" fill="url(#g)"/>${mark()}`),
  // Full-bleed square: iOS and stores mask the corners themselves.
  square: svg(`${gradient('g')}<rect width="1024" height="1024" fill="url(#g)"/>${mark()}`),
  // Maskable web icon / Android adaptive foreground: keep the mark inside the ~66% safe zone.
  maskable: svg(`${gradient('g')}<rect width="1024" height="1024" fill="url(#g)"/>${mark({ scale: 0.78 })}`),
  adaptiveForeground: svg(mark({ scale: 0.62 })),
  adaptiveBackground: svg(`${gradient('g')}<rect width="1024" height="1024" fill="url(#g)"/>`),
  monochrome: svg(mark({ s: '#FFFFFF', leaf: '#FFFFFF', rib: 'none', scale: 0.62 })),
  splash: svg(mark()),
};

function png(source, size) {
  return new Resvg(source, { fitTo: { mode: 'width', value: size } }).render().asPng();
}

const OUTPUTS = [
  ['assets/brand/sous-icon.svg', SOURCES.rounded],
  ['assets/brand/sous-mark.svg', svg(mark({ s: BRAND.green, leaf: BRAND.saffron, rib: '#FFFFFF' }))],
  ['assets/images/icon.png', SOURCES.square, 1024],
  ['assets/images/android-icon-foreground.png', SOURCES.adaptiveForeground, 1024],
  ['assets/images/android-icon-background.png', SOURCES.adaptiveBackground, 1024],
  ['assets/images/android-icon-monochrome.png', SOURCES.monochrome, 1024],
  ['assets/images/splash-icon.png', SOURCES.splash, 1024],
  ['assets/images/sous-logo.png', SOURCES.rounded, 512],
  ['assets/images/favicon.png', SOURCES.rounded, 96],
  ['public/icons/icon-192.png', SOURCES.rounded, 192],
  ['public/icons/icon-512.png', SOURCES.rounded, 512],
  ['public/icons/maskable-512.png', SOURCES.maskable, 512],
  ['public/icons/apple-touch-icon.png', SOURCES.square, 180],
];

for (const [rel, source, size] of OUTPUTS) {
  const file = join(root, rel);
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, size ? png(source, size) : source);
  console.log(`wrote ${rel}${size ? ` (${size}px)` : ''}`);
}
