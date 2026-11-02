import { defineConfig } from 'vite';
import { resolve } from 'node:path';
import { readFileSync } from 'node:fs';
import { execSync } from 'node:child_process';
import { site, reviews, beforeAfter, waLink, telLink, mailLink, mapsLink, hasWa, hasHours, fullAddress } from './src/config.js';
import { categories, folderInfo, showcase, studioPhotos } from './src/data/gallery.js';
import { services, serviceMessage } from './src/data/services.js';
import { picture, galleryPicture, largest, esc } from './src/lib/pic.js';

const root = import.meta.dirname;
const meta = JSON.parse(readFileSync(resolve(root, 'src/data/images.json'), 'utf8'));

// Vorschau (noindex) laut config, per NOINDEX=0/1 beim Build überschreibbar
const noindex = process.env.NOINDEX ? process.env.NOINDEX !== '0' : site.noindex;
const sha = process.env.GITHUB_SHA || (() => {
  try {
    return execSync('git rev-parse HEAD', { stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim();
  } catch {
    return 'lokal';
  }
})();

// ---------------------------------------------------------------------------
//  Öffnungszeiten
// ---------------------------------------------------------------------------
const DAYS = ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'];
const DAYS_LONG = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const ORDER = [1, 2, 3, 4, 5, 6, 0];
const slot = (iv) => iv.map(([a, b]) => `${a.replace(':00', '')}–${b.replace(':00', '')}`).join(' und ') + ' Uhr';

function hoursHtml() {
  const groups = [];
  for (const d of ORDER) {
    const h = site.hours[d];
    const key = h ? JSON.stringify(h) : 'zu';
    const g = groups.find((x) => x.key === key);
    if (g) g.days.push(d);
    else groups.push({ key, h, days: [d] });
  }
  return groups
    .map((g) => `<div class="hours__row" data-days="${g.days.join(',')}"><dt>${g.days.map((d) => DAYS[d]).join(', ')}</dt><dd>${g.h ? slot(g.h) : 'nach Terminabsprache'}</dd></div>`)
    .join('');
}

function jsonLd() {
  const ld = {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    '@id': `${site.url}/#studio`,
    name: site.name,
    description: 'Fotostudio in Hürth-Gleuel: klassische Portraits, besonders in Schwarzweiß, Bewerbungsfotos, Passbilder, Hochzeiten, Familien und Reproduktion alter Fotos.',
    url: `${site.url}/`,
    image: `${site.url}/og-image.jpg`,
    telephone: site.phoneIntl,
    email: site.email,
    faxNumber: site.fax,
    address: {
      '@type': 'PostalAddress',
      streetAddress: site.address.street,
      postalCode: site.address.zip,
      addressLocality: `${site.address.city}-${site.address.district}`,
      addressRegion: 'Nordrhein-Westfalen',
      addressCountry: 'DE',
    },
    geo: { '@type': 'GeoCoordinates', latitude: site.geo.lat, longitude: site.geo.lon },
    areaServed: ['Hürth', 'Köln', 'Rhein-Erft-Kreis'],
  };
  if (hasHours()) {
    ld.openingHoursSpecification = ORDER.flatMap((d) =>
      (site.hours[d] ?? []).map(([opens, closes]) => ({ '@type': 'OpeningHoursSpecification', dayOfWeek: DAYS_LONG[d], opens, closes }))
    );
  }
  if (site.googleReviews) ld.sameAs = [site.googleReviews];
  return `<script type="application/ld+json">${JSON.stringify(ld)}</script>`;
}

// ---------------------------------------------------------------------------
//  Leistungen (Zeilenliste)
// ---------------------------------------------------------------------------
function servicePicture(img, opts) {
  if (!img) return '';
  if (img.startsWith('studio:')) {
    const f = img.slice(7);
    return picture('img/studio', f, meta.studio[f], opts);
  }
  return galleryPicture(img, meta, opts);
}
function servicePreviewSrc(img) {
  if (!img) return '';
  if (img.startsWith('studio:')) {
    const f = img.slice(7);
    return `img/studio/${f}-${meta.studio[f].widths.at(-1)}.webp`;
  }
  return largest(img, meta);
}

function servicesHtml() {
  return services
    .map((s, i) => {
      const msg = serviceMessage(s);
      const examples = s.gallery ? `<a class="text-link" href="?galerie=${s.gallery}#galerie" data-show-gallery="${s.gallery}">Beispiele ansehen</a>` : s.anchor ? `<a class="text-link" href="${s.anchor}">Mehr erfahren</a>` : '';
      const plan = s.occasion ? `<a class="btn btn--primary btn--sm" href="#planer" data-plan="${s.occasion}">Shooting planen</a>` : '';
      return `<li class="svc" data-svc="${s.id}"${s.img ? ` data-preview="${servicePreviewSrc(s.img)}"` : ''}>
  <div class="svc__head">
    <span class="svc__no">${String(i + 1).padStart(2, '0')}</span>
    <h3 class="svc__title">${esc(s.title)}</h3>
    <span class="svc__arrow" aria-hidden="true"><svg class="ico"><use href="#i-arrow"/></svg></span>
  </div>
  <div class="svc__body">
    ${s.img ? `<div class="svc__thumb">${servicePicture(s.img, { alt: '', sizes: '(max-width: 760px) 40vw, 1px' })}</div>` : ''}
    <div class="svc__text">
      <p class="svc__kicker">${esc(s.h)}</p>
      <p>${esc(s.text)}</p>
      <div class="svc__actions">
        ${plan}
        <a class="btn btn--sm wa-only" data-wa="${esc(msg)}" target="_blank" rel="noopener"><svg class="ico"><use href="#i-wa"/></svg>WhatsApp</a>
        <a class="btn btn--sm no-wa-only" href="${esc(mailLink(`Anfrage: ${s.title}`, msg))}"><svg class="ico"><use href="#i-mail"/></svg>Per E-Mail anfragen</a>
        ${examples}
      </div>
    </div>
  </div>
</li>`;
    })
    .join('\n');
}

// ---------------------------------------------------------------------------
//  Showcase (Filmstreifen)
// ---------------------------------------------------------------------------
function showcaseHtml() {
  return showcase
    .map((s, i) => {
      const m = meta.gallery[s.id];
      const land = m.w > m.h;
      return `<li class="frame${land ? ' frame--land' : ''}" data-id="${s.id}">
  <a class="frame__img" href="${largest(s.id, meta)}" data-cursor="Ansehen" aria-label="${esc(s.alt)}, vergrößern">${galleryPicture(s.id, meta, { alt: s.alt, sizes: '(max-width: 760px) 70vw, 30vw' })}</a>
  <span class="frame__no" aria-hidden="true">${i + 1}<i>${i + 1}A</i></span>
</li>`;
    })
    .join('\n');
}

// ---------------------------------------------------------------------------
//  Galerie (alle Bilder im HTML; Filter funktionieren per CSS auch ohne JavaScript)
// ---------------------------------------------------------------------------
const catList = categories.filter((c) => !c.gated || site.boudoir);

function galleryFiltersHtml() {
  const radio = (id, label, checked = false, extra = '') =>
    `<input type="radio" name="gf" id="gf-${id}" value="${id}"${checked ? ' checked' : ''} class="sr-only"${extra} /><label for="gf-${id}" class="chip">${esc(label)}</label>`;
  const main = [radio('alle', 'Alle', true), ...catList.map((c) => radio(c.id, c.label, false, c.gated ? ' data-gated' : ''))].join('');
  const hz = categories.find((c) => c.id === 'hochzeit');
  const subs = [
    `<input type="radio" name="gfs" id="gfs-alle" value="alle" checked class="sr-only" /><label for="gfs-alle" class="chip chip--sub">Alle Hochzeiten</label>`,
    ...hz.subs.map((s) => `<input type="radio" name="gfs" id="gfs-${s.id}" value="${s.id}" class="sr-only" /><label for="gfs-${s.id}" class="chip chip--sub">${esc(s.label)}</label>`),
  ].join('');
  return `<div class="gallery__filters" role="group" aria-label="Galerie filtern">${main}</div><div class="gallery__subfilters" role="group" aria-label="Hochzeit genauer filtern">${subs}</div>`;
}

// CSS-Regeln für die Filter (funktionieren ohne JavaScript über :has)
function galleryCss() {
  const rules = [
    '.gallery:has(#gf-alle:checked) .g-item[data-gated]{display:none}',
    '.gallery:not(:has(#gf-hochzeit:checked)) .gallery__subfilters{display:none}',
    ...catList.map((c) => `.gallery:has(#gf-${c.id}:checked) .g-item:not([data-cat="${c.id}"]){display:none}`),
    ...categories.find((c) => c.id === 'hochzeit').subs.map((s) => `.gallery:has(#gf-hochzeit:checked):has(#gfs-${s.id}:checked) .g-item:not([data-sub="${s.id}"]){display:none}`),
  ];
  return `<style>${rules.join('')}</style>`;
}

function galleryItemsHtml() {
  const counters = {};
  return Object.entries(meta.gallery)
    .map(([id, m]) => {
      const info = folderInfo(id.split('/')[0]);
      if (!info || (info.cat.gated && !site.boudoir)) return '';
      const { cat, sub } = info;
      const n = (counters[cat.id] = (counters[cat.id] ?? 0) + 1);
      const alt = `${cat.noun} ${n}${sub ? ` (${sub.label})` : ''}${m.bw ? ', Schwarzweiß' : ''}, Fotostudio Schnitzler Hürth`;
      const attrs = `data-cat="${cat.id}"${sub ? ` data-sub="${sub.id}"` : ''} data-id="${id}"${m.bw ? ' data-bw' : ''}${cat.gated ? ' data-gated' : ''} style="--w:${m.w}px;--ar:${m.w}/${m.h};--c:${m.color}"`;
      if (cat.gated) {
        // Nur die unscharfe Mini-Vorschau steht im HTML; das echte Bild setzt main.js erst nach dem Hinweis-Klick
        return `<figure class="g-item" ${attrs}><a class="g-item__link" href="#galerie" aria-label="${esc(cat.label)}: Vorschau, erst nach Bestätigung sichtbar"><span class="g-item__mat"><img class="g-item__blur" src="${'img/g/' + id}-blur.webp" width="${m.w}" height="${m.h}" alt="" loading="lazy" decoding="async" /></span></a></figure>`;
      }
      return `<figure class="g-item" ${attrs}><a class="g-item__link" href="${largest(id, meta)}" aria-label="${esc(alt)}, vergrößern"><span class="g-item__mat">${galleryPicture(id, meta, { alt, sizes: `(max-width: 560px) 44vw, ${Math.min(m.w, 320)}px` })}<span class="vf" aria-hidden="true"></span></span></a></figure>`;
    })
    .join('');
}

// Vorher/Nachher: echte Paare aus src/config.js, sonst ein klar beschrifteter Platzhalter
function beforeAfterHtml() {
  const slider = (before, after, w, h, labelBefore = 'Vorher', labelAfter = 'Nachher', placeholder = false) => `<div class="ba__frame${placeholder ? ' ba__frame--demo' : ''}" style="--ar:${w}/${h};--w:${w}px">
  <div class="ba__after">${after}</div>
  <div class="ba__before" aria-hidden="true">${before}</div>
  <span class="ba__handle" aria-hidden="true"><span></span></span>
  <span class="ba__label ba__label--before" aria-hidden="true">${labelBefore}</span><span class="ba__label ba__label--after" aria-hidden="true">${labelAfter}</span>
  <input class="ba__range" type="range" min="0" max="100" value="50" aria-label="Vorher und Nachher vergleichen" />
</div>`;
  if (beforeAfter.length) {
    return beforeAfter
      .map((p) => {
        const m = { w: p.w, h: p.h, widths: [p.w] };
        const pic = (f, alt) => picture('img/vorher-nachher', f, m, { alt, sizes: '(max-width: 760px) 92vw, 46vw' });
        return `<figure class="ba__item">${slider(pic(p.before, ''), pic(p.after, `${p.title}, nach der Bearbeitung`), p.w, p.h)}<figcaption class="ba__caption">${esc(p.title)}</figcaption></figure>`;
      })
      .join('');
  }
  const id = 'portrait/l010';
  const m = meta.gallery[id];
  const pic = (alt) => galleryPicture(id, meta, { alt, sizes: `(max-width: 760px) 80vw, ${m.w}px` });
  return `<figure class="ba__item">${slider(pic(''), pic('Platzhalter für ein Vorher/Nachher-Beispiel'), m.w, m.h, 'Vorher', 'Nachher', true)}<figcaption class="ba__caption"><strong>Platzhalter.</strong> Hier zeigen wir bald echte Vorher/Nachher-Beispiele aus dem Studio. Der Vorher-Effekt ist nur simuliert.</figcaption></figure>`;
}

function reviewsHtml() {
  if (!reviews.length) return '';
  const cards = reviews
    .map((r) => `<figure class="review"><div class="review__stars" aria-label="${r.stars} von 5 Sternen">${'★'.repeat(r.stars)}${'☆'.repeat(5 - r.stars)}</div><blockquote>„${esc(r.text)}“</blockquote><figcaption>${esc(r.name)}${r.source ? ` · ${esc(r.source)}` : ''}</figcaption></figure>`)
    .join('');
  return `<section class="reviews" id="bewertungen" aria-labelledby="reviews-title"><div class="wrap"><div class="section-head"><p class="eyebrow">Stimmen</p><h2 class="h-1" id="reviews-title">Was unsere Kunden <em>sagen</em></h2></div><div class="reviews__grid">${cards}</div>${site.googleReviews ? `<p><a class="text-link" href="${esc(site.googleReviews)}" target="_blank" rel="noopener">Alle Bewertungen bei Google</a></p>` : ''}</div></section>`;
}

function studioHtml(key, sizes, cls = '') {
  const p = studioPhotos[key];
  return picture('img/studio', p.file, meta.studio[p.file], { alt: p.alt, sizes, cls });
}

// ---------------------------------------------------------------------------
//  Platzhalter im HTML ersetzen
// ---------------------------------------------------------------------------
function siteTokens() {
  const tokens = {
    phone: site.phone,
    tel: telLink(),
    fax: site.fax,
    email: site.email,
    mailto: mailLink(),
    street: site.address.street,
    zip: site.address.zip,
    city: site.address.city,
    district: site.address.district,
    address: fullAddress(),
    maps: mapsLink(),
    url: site.url,
    name: site.name,
    owner: site.legal.owner,
    ownerTitle: site.legal.title,
    company: site.legal.company,
    vatId: site.legal.vatId,
    hoursNote: site.hoursNote,
    year: String(new Date().getFullYear()),
    htmlClass: [hasWa() && 'has-wa', hasHours() && 'has-hours'].filter(Boolean).join(' '),
    showcaseTotal: String(showcase.length).padStart(2, '0'),
  };
  // Attribute ohne Escaping (ganze Attribute wie hidden)
  const attrs = {
    voucherHidden: site.voucher ? '' : 'hidden',
  };
  const blocks = {
    ROBOTS: noindex ? '<meta name="robots" content="noindex, nofollow" />' : '<meta name="robots" content="index, follow, max-image-preview:large" />',
    JSONLD: jsonLd(),
    HOURS: hasHours() ? hoursHtml() : '',
    SERVICES: servicesHtml(),
    SHOWCASE: showcaseHtml(),
    GALLERY_FILTERS: galleryFiltersHtml(),
    GALLERY_CSS: galleryCss(),
    GALLERY: galleryItemsHtml(),
    STUDIO_RAUM: studioHtml('raum', '(max-width: 760px) 92vw, 46vw'),
    STUDIO_VERKAUF: studioHtml('verkauf', '(max-width: 760px) 92vw, 30vw'),
    STUDIO_VORNE: studioHtml('vorne', '(max-width: 760px) 92vw, 30vw'),
    HERO_PICTURE: picture('img/hero', 'portrait', meta.hero, { alt: '', sizes: '(max-width: 760px) 60vw, 34vw', cls: 'hero__fallback', lazy: false }),
    BEFORE_AFTER: beforeAfterHtml(),
    REVIEWS: reviewsHtml(),
  };
  return {
    name: 'site-tokens',
    transformIndexHtml(html) {
      return html
        .replace(/<!--\s*@(\w+)\s*-->/g, (m, key) => (key in blocks ? blocks[key] : m))
        .replace(/\{\{(\w+)\}\}/g, (m, key) => (key in attrs ? attrs[key] : key in tokens ? esc(tokens[key]) : m))
        // WhatsApp-Links bekommen ihre vorformulierte Nachricht schon im HTML
        .replace(/data-wa="([^"]*)"/g, (m, msg) => (hasWa() ? `${m} href="${esc(waLink(msg.replace(/&quot;/g, '"').replace(/&amp;/g, '&')))}"` : `${m} href="#kontakt"`));
    },
    generateBundle() {
      this.emitFile({ type: 'asset', fileName: 'version.txt', source: `${sha}\n` });
      this.emitFile({
        type: 'asset',
        fileName: 'robots.txt',
        source: noindex
          ? '# Vorschau: nicht indexieren (Schalter site.noindex in src/config.js)\nUser-agent: *\nDisallow: /\n'
          : `User-agent: *\nAllow: /\n\nSitemap: ${site.url}/sitemap.xml\n`,
      });
      const today = new Date().toISOString().slice(0, 10);
      const urls = ['/', '/impressum.html', '/datenschutz.html']
        .map((p, i) => `  <url><loc>${site.url}${p}</loc><lastmod>${today}</lastmod><priority>${i ? '0.3' : '1.0'}</priority></url>`)
        .join('\n');
      this.emitFile({ type: 'asset', fileName: 'sitemap.xml', source: `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n` });
    },
  };
}

export default defineConfig({
  base: './',
  plugins: [siteTokens()],
  build: {
    target: 'es2020',
    assetsInlineLimit: 0,
    // three.js (~570 kB) lädt nur nach, wenn Hero oder Lichtvorschau es brauchen
    chunkSizeWarningLimit: 700,
    rollupOptions: {
      input: {
        main: resolve(root, 'index.html'),
        impressum: resolve(root, 'impressum.html'),
        datenschutz: resolve(root, 'datenschutz.html'),
      },
    },
  },
  server: { host: true },
});
