// Finishes a web export for static hosts that serve the site from a sub-path and have no
// single-page-app rewrites (GitHub Pages):
// - points the manifest, icon and service-worker links in index.html at the sub-path
//   (Expo already prefixes its own bundles);
// - makes manifest.json start/scope/icons relative to the sub-path;
// - copies index.html to 404.html so deep links such as /Sous/plan still open the app.
//
// Usage: SOUS_BASE_PATH=/Sous node scripts/prepare-pages.mjs [dist]
import { copyFileSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const dist = process.argv[2] ?? 'dist';
const base = (process.env.SOUS_BASE_PATH ?? '').replace(/\/+$/, ''); // "" or "/Sous"

const htmlPath = join(dist, 'index.html');
let html = readFileSync(htmlPath, 'utf8');
if (base) {
  html = html
    .replace(/(href|src)="\/(manifest\.json|icons\/)/g, `$1="${base}/$2`)
    .replace("register('/sw.js')", `register('${base}/sw.js')`);
}
writeFileSync(htmlPath, html);

const manifestPath = join(dist, 'manifest.json');
const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
const prefix = (p) => (p.startsWith('/') ? `${base}${p}` : p);
manifest.id = prefix(manifest.id);
manifest.start_url = prefix(manifest.start_url);
manifest.scope = prefix(manifest.scope);
manifest.icons = manifest.icons.map((i) => ({ ...i, src: prefix(i.src) }));
writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + '\n');

copyFileSync(htmlPath, join(dist, '404.html'));
console.log(`Prepared ${dist} for ${base || '/'}`);
