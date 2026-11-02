// <picture>-Markup für Bilder aus der Pipeline (scripts/optimize-images.mjs).
// Wird beim Build (vite.config.js, HTML ohne JavaScript) und im Browser verwendet.
// Pfade sind relativ (base './'), damit die Seite auch unter /fotostudio-schnitzler/ läuft.

export const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);

const srcset = (dir, slug, widths, ext) => widths.map((w) => `${dir}/${slug}-${w}.${ext} ${w}w`).join(', ');

// dir: z. B. 'img/g/portrait', slug: 'l006', m: Eintrag aus images.json ({ w, h, widths })
export function picture(dir, slug, m, { alt = '', sizes = '100vw', cls = '', imgCls = '', lazy = true, attrs = '' } = {}) {
  const top = m.widths[m.widths.length - 1];
  return `<picture${cls ? ` class="${cls}"` : ''}><source type="image/avif" srcset="${srcset(dir, slug, m.widths, 'avif')}" sizes="${sizes}" /><img src="${dir}/${slug}-${top}.webp" srcset="${srcset(dir, slug, m.widths, 'webp')}" sizes="${sizes}" width="${m.w}" height="${m.h}" alt="${esc(alt)}"${lazy ? ' loading="lazy" decoding="async"' : ' fetchpriority="high"'}${imgCls ? ` class="${imgCls}"` : ''}${attrs ? ` ${attrs}` : ''} /></picture>`;
}

// Galeriebild über seine id 'ordner/datei'
export const galleryDir = (id) => `img/g/${id.split('/')[0]}`;
export const gallerySlug = (id) => id.split('/')[1];
export const galleryPicture = (id, meta, opts) => picture(galleryDir(id), gallerySlug(id), meta.gallery[id], opts);

// Größte vorhandene Datei (Lightbox)
export const largest = (id, meta, ext = 'webp') => {
  const m = meta.gallery[id];
  return `${galleryDir(id)}/${gallerySlug(id)}-${m.widths[m.widths.length - 1]}.${ext}`;
};
