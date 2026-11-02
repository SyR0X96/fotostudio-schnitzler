// Wandelt die Originale aus quelle/ in optimierte AVIF- und WebP-Dateien (mehrere Breiten, nie
// größer als das Original) und schreibt src/data/images.json mit Maßen, Breiten, Schwarzweiß-Erkennung
// und Grundfarbe (Platzhalter ohne Springen). Dazu Favicons, Open-Graph-Bild und die Büste für den Planer.
// Aufruf: npm run images
import sharp from 'sharp';
import { mkdir, readdir, readFile, writeFile, rm, copyFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { categories, hero } from '../src/data/gallery.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SRC = path.join(root, 'quelle');
const PUB = path.join(root, 'public');
const OUT = path.join(PUB, 'img');

// Zielbreiten: Sobald bessere Originale kommen, entstehen automatisch die großen Varianten.
const GALLERY_W = [480, 960, 1600];
const STUDIO_W = [650, 1200, 2000];
const HERO_W = [1200, 2400];

const folders = categories.flatMap((c) => c.folders ?? c.subs.map((s) => s.folder));
const gated = new Set(categories.filter((c) => c.gated).flatMap((c) => c.folders));

const meta = { gallery: {}, studio: {}, hero: null };

// Breiten erzeugen: jede Zielbreite, gedeckelt auf die Originalbreite, doppelte entfernt
const widthsFor = (native, targets) => [...new Set(targets.map((t) => Math.min(t, native)))].sort((a, b) => a - b);

async function encode(input, dir, slug, targets, { quality = 80, grayscale = false } = {}) {
  await mkdir(dir, { recursive: true });
  const base = sharp(input).rotate();
  const { width, height } = await base.metadata();
  const widths = widthsFor(width, targets);
  for (const w of widths) {
    let img = base.clone().resize({ width: w, withoutEnlargement: true });
    if (grayscale) img = img.grayscale();
    await img.clone().webp({ quality, effort: 5 }).toFile(path.join(dir, `${slug}-${w}.webp`));
    await img.clone().avif({ quality: quality - 22, effort: 5 }).toFile(path.join(dir, `${slug}-${w}.avif`));
  }
  return { w: width, h: height, widths };
}

// Schwarzweiß-Erkennung: mittlere Buntheit (max−min der Kanäle) auf 32×32 Pixeln.
// Getonte Abzüge (Sepia, Selen) haben wenig Buntheit und zählen als Schwarzweiß.
async function analyse(input) {
  const { data } = await sharp(input).resize(32, 32, { fit: 'fill' }).removeAlpha().raw().toBuffer({ resolveWithObject: true });
  let chroma = 0, r = 0, g = 0, b = 0;
  const n = data.length / 3;
  for (let i = 0; i < data.length; i += 3) {
    chroma += Math.max(data[i], data[i + 1], data[i + 2]) - Math.min(data[i], data[i + 1], data[i + 2]);
    r += data[i];
    g += data[i + 1];
    b += data[i + 2];
  }
  const hex = (v) => Math.round(v / n).toString(16).padStart(2, '0');
  return { chroma: chroma / n, color: `#${hex(r)}${hex(g)}${hex(b)}` };
}

// ---------------------------------------------------------------------------
//  Galerie
// ---------------------------------------------------------------------------
await rm(path.join(OUT, 'g'), { recursive: true, force: true });
for (const folder of folders) {
  const dir = path.join(SRC, 'fotos', folder);
  const files = (await readdir(dir)).filter((f) => /\.(jpe?g|png|webp|tiff?)$/i.test(f)).sort();
  for (const f of files) {
    const name = f.replace(/\.[^.]+$/, '');
    const input = path.join(dir, f);
    const out = path.join(OUT, 'g', folder);
    const info = await encode(input, out, name, GALLERY_W);
    const { chroma, color } = await analyse(input);
    const entry = { ...info, bw: chroma < 16, color };
    if (gated.has(folder)) {
      // Vorschau für den gesperrten Bereich: winzig und unscharf, das echte Bild lädt erst nach dem Hinweis-Klick
      await sharp(input).resize({ width: 24 }).blur(1.2).webp({ quality: 40 }).toFile(path.join(out, `${name}-blur.webp`));
      entry.blur = true;
    }
    meta.gallery[`${folder}/${name}`] = entry;
  }
  console.log(`galerie/${folder}: ${files.length}`);
}

// ---------------------------------------------------------------------------
//  Studio
// ---------------------------------------------------------------------------
for (const f of ['Studioraum', 'Studio-Verkauf', 'Studio-vorne']) {
  meta.studio[f] = await encode(path.join(SRC, 'fotos/studio', `${f}.jpeg`), path.join(OUT, 'studio'), f, STUDIO_W);
  meta.studio[f].color = (await analyse(path.join(SRC, 'fotos/studio', `${f}.jpeg`))).color;
}

// ---------------------------------------------------------------------------
//  Hero-Portrait (Graustufen, als Textur für den WebGL-Hero und als statischer Fallback)
// ---------------------------------------------------------------------------
const [hf, hn] = hero.id.split('/');
// Die alten Galeriebilder haben einen 1-px-Rahmen in Weiß: 6 px rundum abschneiden, damit das Bild
// im Hero nahtlos ins Dunkel übergeht
const heroRaw = sharp(path.join(SRC, 'fotos', hf, `${hn}.jpg`));
const hm = await heroRaw.metadata();
const inset = hm.width < 800 ? 6 : 0;
const heroSrc = await heroRaw.extract({ left: inset, top: inset, width: hm.width - inset * 2, height: hm.height - inset * 2 }).toBuffer();
meta.hero = await encode(heroSrc, path.join(OUT, 'hero'), 'portrait', HERO_W, { quality: 86, grayscale: true });

// ---------------------------------------------------------------------------
//  Favicons: Kamerablende (7 Lamellen) in Platin auf Schwarz
// ---------------------------------------------------------------------------
function apertureSvg(size, { bg = '#0e0e0d', fg = '#d8ccb6', round = 0.22 } = {}) {
  const n = 7, c = size / 2, R = size * 0.4, r = size * 0.15;
  const pts = Array.from({ length: n }, (_, i) => {
    const a = (i / n) * Math.PI * 2 - Math.PI / 2;
    return [c + Math.cos(a) * r, c + Math.sin(a) * r];
  });
  // Jede Lamelle: Kante des Blendenpolygons, verlängert bis zum Außenkreis
  const blades = pts
    .map(([x, y], i) => {
      const [nx, ny] = pts[(i + 1) % n];
      const ex = nx - x, ey = ny - y, len = Math.hypot(ex, ey);
      const ux = ex / len, uy = ey / len;
      const ox = uy, oy = -ux; // nach außen
      const L = R * 2.2;
      return `<path d="M${x.toFixed(2)} ${y.toFixed(2)} L${(x + ux * L).toFixed(2)} ${(y + uy * L).toFixed(2)} L${(x + ux * L + ox * L).toFixed(2)} ${(y + uy * L + oy * L).toFixed(2)} L${(x + ox * L).toFixed(2)} ${(y + oy * L).toFixed(2)}Z" fill="${fg}" fill-opacity="${(0.55 + (i % 3) * 0.15).toFixed(2)}" stroke="${bg}" stroke-width="${(size * 0.012).toFixed(2)}"/>`;
    })
    .join('');
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}" width="${size}" height="${size}">
<rect width="${size}" height="${size}" rx="${size * round}" fill="${bg}"/>
<clipPath id="o"><circle cx="${c}" cy="${c}" r="${R}"/></clipPath>
<g clip-path="url(#o)">${blades}</g>
<circle cx="${c}" cy="${c}" r="${R}" fill="none" stroke="${fg}" stroke-width="${(size * 0.03).toFixed(2)}"/>
</svg>`;
}
await writeFile(path.join(PUB, 'favicon.svg'), apertureSvg(64));
for (const [file, s] of [['favicon-32.png', 32], ['apple-touch-icon.png', 180], ['icon-512.png', 512]]) {
  await sharp(Buffer.from(apertureSvg(s, { round: file === 'apple-touch-icon.png' ? 0 : 0.22 }))).png().toFile(path.join(PUB, file));
}

// ---------------------------------------------------------------------------
//  Open-Graph-Bild (WhatsApp-/Social-Vorschau): Hero-Portrait in Originalgröße, nie Boudoir
// ---------------------------------------------------------------------------
const portrait = await sharp(heroSrc).grayscale().toBuffer();
const pm = await sharp(portrait).metadata();
const ogText = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630">
<rect width="1200" height="630" fill="#0e0e0d"/>
<text x="520" y="268" font-family="Georgia, 'Times New Roman', serif" font-size="64" fill="#f2efe9">Fotostudio</text>
<text x="520" y="344" font-family="Georgia, 'Times New Roman', serif" font-size="64" fill="#f2efe9">Schnitzler</text>
<text x="522" y="408" font-family="Arial, Helvetica, sans-serif" font-size="22" letter-spacing="5" fill="#cdbfa8">INS RECHTE LICHT GERÜCKT</text>
<text x="522" y="446" font-family="Arial, Helvetica, sans-serif" font-size="22" letter-spacing="2" fill="#8e887d">Portrait · Bewerbung · Passbilder · Hürth-Gleuel</text>
<rect x="${300 - pm.width / 2 - 14}" y="${315 - pm.height / 2 - 14}" width="${pm.width + 28}" height="${pm.height + 28}" fill="#1b1a18"/>
</svg>`;
await sharp(Buffer.from(ogText))
  .composite([{ input: portrait, left: Math.round(300 - pm.width / 2), top: Math.round(315 - pm.height / 2) }])
  .jpeg({ quality: 86 })
  .toFile(path.join(PUB, 'og-image.jpg'));

// ---------------------------------------------------------------------------
//  Büste für die Licht-Vorschau im Planer (Poly Haven „Marble Bust 01“, CC0)
//  Rauheits-Textur entfällt (wird im Material als Wert gesetzt), spart Ladezeit.
// ---------------------------------------------------------------------------
const bustSrc = path.join(SRC, 'modelle/marble_bust_01');
const bustOut = path.join(PUB, 'models/bust');
await mkdir(path.join(bustOut, 'textures'), { recursive: true });
const gltf = JSON.parse(await readFile(path.join(bustSrc, 'marble_bust_01_1k.gltf'), 'utf8'));
delete gltf.materials[0].pbrMetallicRoughness.metallicRoughnessTexture;
gltf.materials[0].pbrMetallicRoughness.roughnessFactor = 0.55;
gltf.images = gltf.images.slice(0, 2).map((im) => ({ ...im, mimeType: 'image/webp', uri: im.uri.replace('.jpg', '.webp') }));
gltf.textures = gltf.textures.slice(0, 2);
await writeFile(path.join(bustOut, 'bust.gltf'), JSON.stringify(gltf));
await copyFile(path.join(bustSrc, 'marble_bust_01.bin'), path.join(bustOut, 'marble_bust_01.bin'));
for (const t of ['diff', 'nor_gl']) {
  await sharp(path.join(bustSrc, `textures/marble_bust_01_${t}_1k.jpg`))
    .webp({ quality: t === 'diff' ? 76 : 88 })
    .toFile(path.join(bustOut, `textures/marble_bust_01_${t}_1k.webp`));
}

await writeFile(path.join(root, 'src/data/images.json'), JSON.stringify(meta));
const n = Object.keys(meta.gallery).length;
const bw = Object.values(meta.gallery).filter((g) => g.bw).length;
console.log(`fertig: ${n} Galeriebilder (${bw} Schwarzweiß), Hero ${meta.hero.w}×${meta.hero.h}`);
