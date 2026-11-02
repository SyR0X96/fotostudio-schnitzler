// Holt alle Inhalte der alten Seite (fotostudio-schnitzler.de, Joomla/YOOtheme):
// Texte nach quelle/texte/, Fotos in der größten verfügbaren Auflösung nach quelle/fotos/<kategorie>/
// und eine Übersicht nach quelle/manifest.json (Grundlage für docs/bestandsaufnahme.md).
// Aufruf: npm run bestand
import sharp from 'sharp';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const ORIGIN = 'https://fotostudio-schnitzler.de';
const OUT = path.join(root, 'quelle');
const UA = { 'User-Agent': 'Mozilla/5.0 (Bestandsaufnahme Fotostudio Schnitzler)' };

// Alte URL → Ordnername der Kategorie
const galleries = {
  portrait: 'portrait',
  bewerbung: 'bewerbung',
  passbilder: 'passbilder',
  familie: 'familie',
  kinder: 'kinder',
  schwanger: 'schwanger',
  'hochzeits-reportage1': 'hochzeit-reportage-1',
  'hochzeits-reportage-2': 'hochzeit-reportage-2',
  'hochzeits-reportage-3': 'hochzeit-reportage-3',
  'hochzeits-portrait': 'hochzeit-portrait',
  'gruppen-und-vereine': 'gruppen-vereine',
  tiere: 'tiere',
  erotik: 'erotik',
};
const textPages = ['', 'service', 'studio', 'kontakt', 'impressum', 'datenschutz'];

async function get(url, binary = false) {
  for (let i = 0; i < 3; i++) {
    try {
      const r = await fetch(url, { headers: UA, redirect: 'follow' });
      if (!r.ok) return { status: r.status };
      return { status: r.status, body: binary ? Buffer.from(await r.arrayBuffer()) : await r.text(), type: r.headers.get('content-type') };
    } catch (e) {
      if (i === 2) throw e;
      await new Promise((res) => setTimeout(res, 800));
    }
  }
}

const decode = (s) =>
  s
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;|&apos;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&auml;/g, 'ä').replace(/&ouml;/g, 'ö').replace(/&uuml;/g, 'ü')
    .replace(/&Auml;/g, 'Ä').replace(/&Ouml;/g, 'Ö').replace(/&Uuml;/g, 'Ü')
    .replace(/&szlig;/g, 'ß').replace(/&euro;/g, '€').replace(/&copy;/g, '©')
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(+n));

// Hauptinhalt (<main id="tm-main">) als einfaches Markdown
function mainText(html) {
  const m = html.match(/<main id="tm-main"[^>]*>([\s\S]*?)<\/main>/);
  let s = m ? m[1] : html;
  s = s.replace(/<div id="phocagallery"[\s\S]*$/, '');
  s = s.replace(/<(script|style|svg|noscript|form)[\s\S]*?<\/\1>/gi, '');
  s = s.replace(/<h([1-6])[^>]*>([\s\S]*?)<\/h\1>/gi, (_, n, t) => `\n\n${'#'.repeat(+n)} ${t.replace(/<[^>]+>/g, '').trim()}\n\n`);
  s = s.replace(/<li[^>]*>/gi, '\n- ');
  s = s.replace(/<br\s*\/?>/gi, '\n');
  s = s.replace(/<\/(p|div|ul|ol|li|tr|table|section)>/gi, '\n');
  s = s.replace(/<a [^>]*href="(mailto:[^"]+|tel:[^"]+)"[^>]*>([\s\S]*?)<\/a>/gi, '$2 ($1)');
  s = s.replace(/<[^>]+>/g, '');
  s = decode(s);
  return s
    .split('\n')
    .map((l) => l.replace(/[ \t]+/g, ' ').trim())
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

const meta = (html, name) => decode(html.match(new RegExp(`<meta name="${name}" content="([^"]*)"`))?.[1] ?? '');
const title = (html) => decode(html.match(/<title>([^<]*)<\/title>/)?.[1] ?? '');

async function dims(buf) {
  try {
    const m = await sharp(buf).metadata();
    return { w: m.width, h: m.height };
  } catch {
    return null;
  }
}

const manifest = { geholt: new Date().toISOString(), quelle: ORIGIN, seiten: [], galerien: {}, bilder: [] };

await mkdir(path.join(OUT, 'texte'), { recursive: true });

// ---------------------------------------------------------------------------
//  Textseiten
// ---------------------------------------------------------------------------
for (const p of textPages) {
  const url = `${ORIGIN}/${p}`;
  const r = await get(url);
  const slug = p || 'home';
  if (!r.body) {
    manifest.seiten.push({ url, status: r.status });
    continue;
  }
  const text = mainText(r.body);
  await writeFile(path.join(OUT, 'texte', `${slug}.md`), `<!-- Quelle: ${url} -->\n# ${title(r.body)}\n\n${text}\n`);
  manifest.seiten.push({ url, slug, title: title(r.body), description: meta(r.body, 'description'), zeichen: text.length });
  console.log('Seite', slug, text.length, 'Zeichen');

  // Bilder aus dem YOOtheme-Cache: jeweils die größte Variante (src oder srcset) sichern
  const imgs = [...r.body.matchAll(/<img[^>]*>/g)].map((x) => x[0]);
  for (const tag of imgs) {
    const src = tag.match(/src="([^"]+)"/)?.[1];
    if (!src || !src.includes('/templates/yootheme/cache/')) continue;
    const base = src.split('/').pop().replace(/-[0-9a-f]{8}\.\w+$/, '');
    if (manifest.bilder.some((b) => b.kategorie === 'studio' && b.name === base)) continue;
    const srcset = [...(r.body.matchAll(new RegExp(`/templates/yootheme/cache/\\w+/${base}-[0-9a-f]{8}\\.webp (\\d+)w`, 'g')))].map((x) => ({ url: x[0].split(' ')[0], w: +x[1] }));
    const cand = [{ url: src }, ...srcset.sort((a, b) => b.w - a.w).slice(0, 1)];
    let best = null;
    for (const c of cand) {
      const d = await get(ORIGIN + c.url, true);
      if (!d.body) continue;
      const wh = await dims(d.body);
      if (!wh) continue;
      if (!best || wh.w * wh.h > best.w * best.h || (wh.w * wh.h === best.w * best.h && c.url.endsWith('.jpeg'))) best = { ...wh, buf: d.body, url: c.url };
    }
    if (!best) continue;
    const ext = path.extname(best.url);
    const dir = path.join(OUT, 'fotos', 'studio');
    await mkdir(dir, { recursive: true });
    await writeFile(path.join(dir, base + ext), best.buf);
    manifest.bilder.push({ kategorie: 'studio', seite: slug, name: base, datei: `fotos/studio/${base}${ext}`, url: ORIGIN + best.url, w: best.w, h: best.h, bytes: best.buf.length });
    console.log('  Bild', base, `${best.w}x${best.h}`);
  }
}

// Favicon, Apple-Touch-Icon, Deko-Grafik
for (const [name, u] of [
  ['favicon', '/templates/yootheme/packages/theme-joomla/assets/images/favicon.png'],
  ['apple-touch-icon', '/templates/yootheme/packages/theme-joomla/assets/images/apple-touch-icon.png'],
  ['favicon-ico', '/favicon.ico'],
  ['pageglare', '/images/pageglare.png'],
  ['object583966068', '/images/object583966068.png'],
]) {
  const d = await get(ORIGIN + u, true);
  if (!d.body) continue;
  const ext = path.extname(u);
  const dir = path.join(OUT, 'fotos', 'marke');
  await mkdir(dir, { recursive: true });
  await writeFile(path.join(dir, name + ext), d.body);
  const wh = (await dims(d.body)) ?? {};
  manifest.bilder.push({ kategorie: 'marke', name, datei: `fotos/marke/${name}${ext}`, url: ORIGIN + u, ...wh, bytes: d.body.length });
}

// ---------------------------------------------------------------------------
//  Galerien (Phoca Gallery, 20 Bilder je Seite über ?start=)
// ---------------------------------------------------------------------------
for (const [page, cat] of Object.entries(galleries)) {
  const items = [];
  let pageText = '';
  for (let start = 0; start < 2000; start += 20) {
    const url = `${ORIGIN}/${page}${start ? `?start=${start}` : ''}`;
    const r = await get(url);
    if (!r.body) break;
    if (!start) {
      pageText = mainText(r.body);
      manifest.seiten.push({ url: `${ORIGIN}/${page}`, slug: page, title: title(r.body), description: meta(r.body, 'description'), galerie: cat });
    }
    const found = [...r.body.matchAll(/href="(\/images\/phocagallery\/[^"]+\/thumbs\/phoca_thumb_l_[^"]+)"[^>]*data-img-title="([^"]*)"/g)].map((x) => ({ l: x[1], titel: decode(x[2]) }));
    // Phoca listet manche Bilder doppelt (z. B. Kinder), deshalb auch innerhalb der Seite entdoppeln
    const fresh = found.filter((f, k) => !items.some((i) => i.l === f.l) && found.findIndex((x) => x.l === f.l) === k);
    if (!fresh.length) break;
    items.push(...fresh);
  }
  await writeFile(path.join(OUT, 'texte', `galerie-${cat}.md`), `<!-- Quelle: ${ORIGIN}/${page} -->\n${pageText}\n`);

  const dir = path.join(OUT, 'fotos', cat);
  await mkdir(dir, { recursive: true });
  const stats = { seite: `${ORIGIN}/${page}`, anzahl: items.length, varianten: {}, minW: Infinity, maxW: 0, minH: Infinity, maxH: 0 };
  for (const it of items) {
    const file = it.l.replace('/thumbs/phoca_thumb_l_', '/');
    const cands = [
      ['original', file],
      ['l', it.l],
      ['m', it.l.replace('phoca_thumb_l_', 'phoca_thumb_m_')],
    ];
    let best = null;
    for (const [variant, u] of cands) {
      const d = await get(ORIGIN + encodeURI(decodeURI(u)), true);
      if (!d.body || !String(d.type).startsWith('image')) continue;
      const wh = await dims(d.body);
      if (!wh) continue;
      // Größte Pixelzahl gewinnt, bei Gleichstand das Original (bzw. die größere Datei)
      if (!best || wh.w * wh.h > best.w * best.h || (wh.w * wh.h === best.w * best.h && d.body.length > best.buf.length)) best = { variant, u, buf: d.body, ...wh };
    }
    if (!best) {
      manifest.bilder.push({ kategorie: cat, name: path.basename(file), fehler: 'nicht ladbar', url: ORIGIN + file });
      continue;
    }
    const name = path.basename(file);
    await writeFile(path.join(dir, name), best.buf);
    stats.varianten[best.variant] = (stats.varianten[best.variant] ?? 0) + 1;
    stats.minW = Math.min(stats.minW, best.w);
    stats.maxW = Math.max(stats.maxW, best.w);
    stats.minH = Math.min(stats.minH, best.h);
    stats.maxH = Math.max(stats.maxH, best.h);
    manifest.bilder.push({ kategorie: cat, name, titel: it.titel, datei: `fotos/${cat}/${name}`, url: ORIGIN + best.u, variante: best.variant, w: best.w, h: best.h, bytes: best.buf.length });
  }
  manifest.galerien[cat] = stats;
  console.log('Galerie', cat, items.length, 'Bilder', JSON.stringify(stats.varianten), `${stats.minW}-${stats.maxW} x ${stats.minH}-${stats.maxH}`);
}

await writeFile(path.join(OUT, 'manifest.json'), JSON.stringify(manifest, null, 2));
console.log('fertig');
