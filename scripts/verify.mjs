import { readFile, access } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const routes = ['', 'experience', 'about', 'bento', 'sticker-llama', 'letterbox', 'poly-vita'];
let checked = 0;
async function checkLocalReference(url) {
  const file = url.endsWith('/') ? `${url}index.html` : url;
  await access(path.join(root, decodeURIComponent(file.split('?')[0])));
  checked++;
}
for (const route of routes) {
  const html = await readFile(path.join(root, route, 'index.html'), 'utf8');
  if ((html.match(/<h1\b/g)||[]).length !== 1) throw new Error(`${route}: expected one main heading`);
  if (html.includes('class="profile-card"') !== (route === '')) throw new Error(`${route}: misplaced contact card`);
  if ((html.match(/aria-current="page"/g)||[]).length !== 1) throw new Error(`${route}: incorrect active navigation`);
  const meta = Object.fromEntries([...html.matchAll(/<meta (?:property|name)="([^"]+)" content="([^"]*)">/g)].map(([, key, value]) => [key, value]));
  for (const key of ['og:title','og:type','og:url','og:image','og:image:alt','og:image:width','og:image:height','twitter:image:alt']) {
    if (!meta[key]) throw new Error(`${route}: missing sharing metadata ${key}`);
  }
  const shareImage = new URL(meta['og:image']);
  if (shareImage.origin !== 'https://aziolabs.com' || meta['twitter:image'] !== shareImage.href || meta['twitter:card'] !== 'summary_large_image') throw new Error(`${route}: inconsistent sharing image`);
  await checkLocalReference(shareImage.pathname);
  const png = await readFile(path.join(root, shareImage.pathname));
  if (png.subarray(0, 8).toString('hex') !== '89504e470d0a1a0a') throw new Error(`${route}: sharing image must be PNG`);
  if (png.readUInt32BE(16) !== Number(meta['og:image:width']) || png.readUInt32BE(20) !== Number(meta['og:image:height'])) throw new Error(`${route}: sharing image dimensions mismatch`);
  for (const [, url] of html.matchAll(/(?:href|src|poster)="(\/[^"#]*)"/g)) {
    await checkLocalReference(url);
  }
  for (const [, srcset] of html.matchAll(/srcset="([^"]+)"/g)) {
    for (const candidate of srcset.split(',')) {
      const [url, descriptor] = candidate.trim().split(/\s+/);
      if (!/^\d+w$/.test(descriptor) || !url.startsWith('/')) throw new Error(`${route}: invalid responsive image`);
      await checkLocalReference(url);
    }
  }
  if (html.includes('<video') && (!html.includes('controls playsinline preload="none"') || html.includes(' autoplay'))) throw new Error(`${route}: unexpected video behavior`);
}
const experience = await readFile(path.join(root, 'experience/index.html'), 'utf8');
const css = await readFile(path.join(root, 'css/portfolio.css'), 'utf8');
for (const [, url] of css.matchAll(/url\(['"]?(\/[^'"\)]+)['"]?\)/g)) await checkLocalReference(url);
for (const name of ['Spirea','GLO','GuideAlong','Ora Organic','Ridwell','Zipline','RBC Mobile','Optimity','Teleport']) if (!experience.includes(name)) throw new Error(`Missing professional app: ${name}`);
console.log(`Verified ${routes.length} routes, ${checked} local references, all nine professional apps, video controls, and overview-only profile card.`);
