import { readFile, access } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const routes = ['', 'experience', 'about', 'bento', 'sticker-llama', 'letterbox', 'poly-vita'];
let checked = 0;
for (const route of routes) {
  const html = await readFile(path.join(root, route, 'index.html'), 'utf8');
  if ((html.match(/<h1\b/g)||[]).length !== 1) throw new Error(`${route}: expected one main heading`);
  if (html.includes('class="profile-card"') !== (route === '')) throw new Error(`${route}: misplaced contact card`);
  if ((html.match(/aria-current="page"/g)||[]).length !== 1) throw new Error(`${route}: incorrect active navigation`);
  for (const [, url] of html.matchAll(/(?:href|src|poster)="(\/[^"#]*)"/g)) {
    const file = url.endsWith('/') ? `${url}index.html` : url;
    await access(path.join(root, decodeURIComponent(file.split('?')[0])));
    checked++;
  }
  if (html.includes('<video') && (!html.includes('controls playsinline preload="none"') || html.includes(' autoplay'))) throw new Error(`${route}: unexpected video behavior`);
}
const experience = await readFile(path.join(root, 'experience/index.html'), 'utf8');
for (const name of ['Spirea','GLO','GuideAlong','Ora Organic','Ridwell','Zipline','RBC Mobile','Optimity','Teleport']) if (!experience.includes(name)) throw new Error(`Missing professional app: ${name}`);
console.log(`Verified ${routes.length} routes, ${checked} local references, all nine professional apps, video controls, and overview-only profile card.`);
