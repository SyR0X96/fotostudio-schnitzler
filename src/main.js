import '@fontsource-variable/bodoni-moda/opsz.css';
import '@fontsource-variable/bodoni-moda/opsz-italic.css';
import '@fontsource-variable/hanken-grotesk';
import './styles/base.css';
import './styles/main.css';

import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';
import { site, waLink, mailLink, hasWa } from './config.js';
import { categories } from './data/gallery.js';
import { galleryPicture, largest } from './lib/pic.js';
import imagesMeta from './data/images.json';
import { Iris } from './modules/iris.js';

gsap.registerPlugin(ScrollTrigger);

// Nachladbare Module (eigene Chunks; fehlt eines, läuft die Seite ohne es weiter)
const lazy = import.meta.glob(['./modules/hero/HeroScene.js', './modules/planner/Planner.js']);
const load = (p) => (lazy[p] ? lazy[p]() : Promise.reject(new Error(`Modul fehlt: ${p}`)));

const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
const mobile = matchMedia('(max-width: 760px)').matches;
const finePointer = matchMedia('(hover: hover) and (pointer: fine)').matches;
const BASE = import.meta.env.BASE_URL;
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
// Speicherzugriff kann im privaten Modus oder bei gesperrten Website-Daten werfen
const store = {
  get: (k, type = 'localStorage') => {
    try {
      return window[type].getItem(k);
    } catch {
      return null;
    }
  },
  set: (k, v, type = 'localStorage') => {
    try {
      window[type].setItem(k, v);
    } catch {
      /* nicht speicherbar, dann eben nur für diesen Besuch */
    }
  },
};

// Galerie-Kategorie → Anlass im Shooting-Planer
const OCCASION = { portrait: 'portrait', bewerbung: 'bewerbung', passbilder: 'passbild', familie: 'familie', kinder: 'kinder', schwanger: 'babybauch', hochzeit: 'hochzeit', 'gruppen-vereine': 'gruppen', tiere: 'tiere', boudoir: 'boudoir' };
const catLabel = (id) => categories.find((c) => c.id === id)?.label ?? 'Galerie';

let lenis;
const scrollToEl = (el, offset = -70) => {
  if (!el) return;
  if (lenis) lenis.scrollTo(el, { offset, duration: 1.4 });
  else el.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth' });
};

// ---------------------------------------------------------------------------
//  Hell / Dunkel
// ---------------------------------------------------------------------------
function initTheme() {
  const root = document.documentElement;
  const systemDark = matchMedia('(prefers-color-scheme: dark)');
  const isDark = () => (root.dataset.theme ? root.dataset.theme === 'dark' : systemDark.matches);
  const btn = $('[data-theme-toggle]');
  const label = () => btn.setAttribute('aria-label', isDark() ? 'Hellen Modus einschalten' : 'Dunklen Modus einschalten');
  label();
  btn.addEventListener('click', () => {
    const next = isDark() ? 'light' : 'dark';
    root.dataset.theme = next;
    store.set('theme', next);
    label();
  });
  systemDark.addEventListener('change', label);
}

// ---------------------------------------------------------------------------
//  Öffnungszeiten: Live-Status (Zeitzone Berlin, mehrere Zeitfenster pro Tag)
// ---------------------------------------------------------------------------
const DAYS = ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'];
function berlinNow() {
  const parts = new Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/Berlin', weekday: 'short', hour: '2-digit', minute: '2-digit', hour12: false }).formatToParts(new Date());
  const get = (t) => parts.find((p) => p.type === t)?.value;
  const day = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf(get('weekday'));
  return { day, min: (parseInt(get('hour'), 10) % 24) * 60 + parseInt(get('minute'), 10) };
}
const toMin = (t) => parseInt(t.slice(0, 2), 10) * 60 + parseInt(t.slice(3), 10);

function initHours() {
  if (!Object.values(site.hours).some(Boolean)) return;
  const { day, min } = berlinNow();
  const today = site.hours[day] ?? [];
  const now = today.find(([a, b]) => min >= toMin(a) && min < toMin(b));
  let text;
  if (now) text = `Jetzt geöffnet · bis ${now[1]} Uhr`;
  else {
    for (let i = 0; i < 8 && !text; i++) {
      const d = (day + i) % 7;
      const next = (site.hours[d] ?? []).find(([a]) => i > 0 || toMin(a) > min);
      if (next) text = `Geschlossen · öffnet ${i === 0 ? 'heute' : i === 1 ? 'morgen' : DAYS[d]} ${next[0]} Uhr`;
    }
  }
  $$('[data-open-status]').forEach((el) => {
    el.hidden = false;
    el.classList.toggle('is-open', !!now);
    $('span', el).textContent = text;
  });
  $$('.hours__row').forEach((r) => r.classList.toggle('is-today', r.dataset.days.split(',').includes(String(day))));
}

// ---------------------------------------------------------------------------
//  Smooth Scroll, Header, Menü
// ---------------------------------------------------------------------------
function initScroll() {
  if (!reduced) {
    lenis = new Lenis({ lerp: 0.1, wheelMultiplier: 1 });
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add((t) => lenis.raf(t * 1000));
    gsap.ticker.lagSmoothing(0);
    lenis.stop();
    window.lenis = lenis; // der Planer scrollt beim Schrittwechsel darüber
  }
  document.addEventListener('click', (e) => {
    const a = e.target.closest('a[href^="#"]');
    if (!a || a.hasAttribute('data-plan') || a.hasAttribute('data-show-gallery')) return;
    const id = a.getAttribute('href');
    const target = id.length > 1 && document.getElementById(id.slice(1));
    if (!target) return;
    e.preventDefault();
    closeMenu();
    if (id === '#top') lenis ? lenis.scrollTo(0, { duration: 1.4 }) : window.scrollTo({ top: 0, behavior: reduced ? 'auto' : 'smooth' });
    else scrollToEl(target);
    history.replaceState(null, '', id);
    // Fokus mitnehmen, damit Tab danach im Ziel weitergeht (Skip-Link, Menüpunkte)
    if (!target.matches('a[href], button, input, select, textarea, [tabindex]')) target.setAttribute('tabindex', '-1');
    target.focus({ preventScroll: true });
  });

  const header = $('.header');
  const heroEl = $('.hero');
  let lastY = 0;
  const onScroll = () => {
    const y = window.scrollY;
    const vh = window.innerHeight;
    // Mit Blende: früh umschalten, weil die Lamellen die Ecken (und damit den Header) zuerst bedecken
    const threshold = vh * (heroEl.classList.contains('has-iris') ? 0.3 : 0.6);
    document.body.classList.toggle('past-hero', y > threshold);
    header.classList.toggle('is-hidden', y > vh * 1.8 && y > lastY + 2 && !document.body.classList.contains('menu-open'));
    if (y < lastY - 2) header.classList.remove('is-hidden');
    lastY = y;
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  $('.burger').addEventListener('click', () => (document.body.classList.contains('menu-open') ? closeMenu() : openMenu()));
  document.addEventListener('keydown', (e) => e.key === 'Escape' && closeMenu());

  $$('.showcase, .footer').forEach((sec) =>
    ScrollTrigger.create({ trigger: sec, start: 'top 76px', end: 'bottom 76px', onToggle: (st) => document.body.classList.toggle('header-dark', st.isActive) })
  );

  // Aktiver Menüpunkt
  const links = $$('.header__nav a');
  links.forEach((a) => {
    const sec = document.getElementById(a.getAttribute('href').slice(1));
    if (!sec) return;
    ScrollTrigger.create({ trigger: sec, start: 'top 45%', end: 'bottom 45%', onToggle: (st) => a.classList.toggle('is-active', st.isActive) });
  });
}
function openMenu() {
  document.body.classList.add('menu-open');
  $('.burger').setAttribute('aria-expanded', 'true');
  $('.burger').setAttribute('aria-label', 'Menü schließen');
  const m = $('#menu');
  m.setAttribute('aria-hidden', 'false');
  m.inert = false;
  lenis?.stop();
  if (!reduced) gsap.fromTo('.menu__nav a', { yPercent: 60, opacity: 0 }, { yPercent: 0, opacity: 1, stagger: 0.05, duration: 0.8, ease: 'power3.out', delay: 0.2 });
}
function closeMenu() {
  if (!document.body.classList.contains('menu-open')) return;
  document.body.classList.remove('menu-open');
  $('.burger').setAttribute('aria-expanded', 'false');
  $('.burger').setAttribute('aria-label', 'Menü öffnen');
  const m = $('#menu');
  m.setAttribute('aria-hidden', 'true');
  m.inert = true;
  lenis?.start();
}

// ---------------------------------------------------------------------------
//  Hero: WebGL-Licht (lädt nach), Blende beim Wegscrollen
// ---------------------------------------------------------------------------
let hero;
// WebGL nur mit echter Grafikkarte: Software-Rendering (SwiftShader, llvmpipe) würde den Shader
// auf der CPU rechnen und die Seite ausbremsen – dann bleibt das statische Bild.
// Zum Testen erzwingen: ?webgl=force
function glUsable() {
  try {
    const c = document.createElement('canvas');
    const gl = c.getContext('webgl2') || c.getContext('webgl');
    if (!gl) return false;
    if (new URLSearchParams(location.search).get('webgl') === 'force') return true;
    const ext = gl.getExtension('WEBGL_debug_renderer_info');
    const name = String(ext ? gl.getParameter(ext.UNMASKED_RENDERER_WEBGL) : gl.getParameter(gl.RENDERER));
    gl.getExtension('WEBGL_lose_context')?.loseContext();
    return !/swiftshader|llvmpipe|softpipe|software|basic render/i.test(name);
  } catch {
    return false;
  }
}
async function initHero() {
  if (!glUsable()) return;
  try {
    const { HeroScene } = await load('./modules/hero/HeroScene.js');
    const w = imagesMeta.hero.widths.at(-1);
    hero = new HeroScene($('.hero__canvas'), {
      imageUrl: `${BASE}img/hero/portrait-${w}.webp`,
      getFrame: () => $('.hero__frame').getBoundingClientRect(),
      mobile,
      reduced,
    });
    await hero.init();
    document.documentElement.classList.add('has-webgl');
    if (introPlayed) hero.playIntro(gsap);
  } catch (e) {
    console.warn('Hero-WebGL nicht verfügbar, statisches Bild bleibt', e);
    hero = null;
  }
}

function initHeroScroll() {
  if (reduced) return;
  const heroEl = $('.hero');
  heroEl.classList.add('has-iris');
  const iris = new Iris($('[data-iris="hero"]'), { blades: 7, twist: 1.1 });
  window.addEventListener('resize', () => iris.resize());
  ScrollTrigger.create({
    trigger: heroEl,
    start: 'top top',
    end: 'bottom bottom',
    scrub: true,
    onUpdate: (st) => {
      const p = st.progress;
      // Erst langsam, dann zügig zu – wie ein Blendenring
      iris.set(1 - gsap.parseEase('power2.in')(p));
      hero?.setScroll(p);
    },
  });
  gsap.to('.hero__content, .hero__meta, .hero__scroll', {
    y: -60,
    opacity: 0,
    ease: 'none',
    scrollTrigger: { trigger: heroEl, start: 'top top', end: () => `+=${window.innerHeight * 0.55}`, scrub: true },
  });
}

// ---------------------------------------------------------------------------
//  Preloader: Blende schließt, Bildzähler 01–36, Blende öffnet in den Hero
// ---------------------------------------------------------------------------
let introPlayed = false;
async function preload() {
  const pre = $('.preloader');
  const done = () => {
    pre.remove();
    document.body.classList.remove('is-loading');
    lenis?.start();
    introPlayed = true;
    hero?.playIntro(gsap);
  };
  if (reduced) {
    done();
    return;
  }
  const iris = new Iris($('[data-iris="pre"]'), { blades: 7, twist: 1.4 });
  const counter = $('[data-counter]');
  const state = { open: 0.36, n: 0 };
  iris.set(state.open);
  pre.classList.add('is-open');
  const onResize = () => iris.resize();
  window.addEventListener('resize', onResize);
  await document.fonts.ready.catch(() => {});
  const tl = gsap.timeline();
  tl.to(state, { open: 0, duration: 0.55, ease: 'power3.inOut', onUpdate: () => iris.set(state.open) })
    .to(state, {
      n: 36,
      duration: 1.05,
      ease: 'power1.inOut',
      onUpdate: () => (counter.textContent = String(Math.max(1, Math.round(state.n))).padStart(2, '0')),
    })
    .to('.preloader__counter', { opacity: 0, scale: 0.92, duration: 0.3, ease: 'power2.in' }, '-=0.1')
    .to(state, { open: 1, duration: 1.15, ease: 'expo.inOut', onUpdate: () => iris.set(state.open) }, '-=0.05');
  await tl;
  window.removeEventListener('resize', onResize);
  done();
}

function heroIntro() {
  if (reduced) return;
  // Ohne Transparenz: Texte stellen scharf, damit der Kontrast zu jedem Zeitpunkt stimmt
  gsap.from('.hero__lead, .hero__ctas > *', { y: 24, filter: 'blur(8px)', duration: 1.1, stagger: 0.08, ease: 'power3.out', delay: 0.1, clearProps: 'filter' });
  gsap.from('.hero__meta > *', { y: 14, filter: 'blur(6px)', duration: 1, stagger: 0.06, ease: 'power3.out', delay: 0.25, clearProps: 'filter' });
  // Nur die Inhalte: Der Header selbst hat eine CSS-Transition auf transform (Ein-/Ausblenden), die sich mit GSAP beißt
  gsap.from('.header > *', { y: -18, filter: 'blur(6px)', duration: 1, stagger: 0.06, ease: 'power3.out', delay: 0.2, clearProps: 'transform,filter' });
}

// ---------------------------------------------------------------------------
//  Text-Reveals, Parallax, Laufband
// ---------------------------------------------------------------------------
function splitWords(el) {
  const walk = (node) => {
    [...node.childNodes].forEach((n) => {
      if (n.nodeType === 3) {
        const frag = document.createDocumentFragment();
        n.textContent.split(/(\s+)/).forEach((w) => {
          if (!w) return;
          if (/^\s+$/.test(w)) frag.appendChild(document.createTextNode(w));
          else {
            const s = document.createElement('span');
            s.className = 'w';
            s.textContent = w;
            frag.appendChild(s);
          }
        });
        n.replaceWith(frag);
      } else if (n.nodeType === 1) walk(n);
    });
  };
  walk(el);
  return $$('.w', el);
}

function initReveals() {
  if (reduced) return;
  const words = splitWords($('[data-words]'));
  // Wörter „stellen scharf“: --f steuert Unschärfe und Farbe in CSS, damit hell/dunkel live mitgeht
  gsap.fromTo(words, { '--f': 0 }, { '--f': 1, stagger: 0.06, ease: 'none', scrollTrigger: { trigger: '[data-words]', start: 'top 82%', end: 'bottom 48%', scrub: true } });

  // Überschriften (.h-1) haben ihren eigenen Clip-Reveal weiter unten und sind hier ausgenommen.
  // overwrite 'auto' statt true: true hätte jede andere Animation am selben Element abgebrochen.
  const sel = '.section-head > :not(.h-1), .pillars li, .statement__text > *, .svc, .process__list li, .faq__list details, .channel, .print, .hours-card, .map, .voucher__card, .voucher__text > :not(.h-1), .retouch__text > :not(.h-1), .ba__item, .studio__text > *';
  gsap.set(sel, { opacity: 0 });
  ScrollTrigger.batch(sel, {
    start: 'top 90%',
    once: true,
    onEnter: (els) => gsap.fromTo(els, { y: 46, opacity: 0 }, { y: 0, opacity: 1, duration: 1.1, stagger: 0.07, ease: 'power3.out', overwrite: 'auto' }),
  });

  $$('.h-1').forEach((h) => {
    gsap.fromTo(h, { clipPath: 'inset(-20% -5% 100% -5%)', y: 30 }, { clipPath: 'inset(-20% -5% -20% -5%)', y: 0, duration: 1.3, ease: 'power4.out', clearProps: 'clipPath', scrollTrigger: { trigger: h, start: 'top 90%', once: true } });
  });
  $$('[data-parallax]').forEach((el) => {
    const v = parseFloat(el.dataset.parallax);
    gsap.fromTo(el, { yPercent: -v }, { yPercent: v, ease: 'none', scrollTrigger: { trigger: el, start: 'top bottom', end: 'bottom top', scrub: true } });
  });
}

function initMarquee() {
  const track = $('[data-marquee]');
  if (reduced) return;
  let x = 0, vel = 0, half = track.scrollWidth / 2;
  const measure = () => (half = track.scrollWidth / 2);
  window.addEventListener('resize', measure);
  document.fonts.ready.then(measure);
  lenis?.on('scroll', (e) => (vel = e.velocity));
  let visible = false;
  new IntersectionObserver(([e]) => (visible = e.isIntersecting)).observe(track);
  gsap.ticker.add((t, delta) => {
    if (!visible) return;
    vel *= 0.92;
    x -= (40 * (1 + Math.min(Math.abs(vel) * 0.1, 4)) * delta) / 1000;
    if (x <= -half) x += half;
    track.style.transform = `translate3d(${x.toFixed(2)}px,0,0)`;
  });
}

// ---------------------------------------------------------------------------
//  Leistungen: Vorschaubild folgt der Maus
// ---------------------------------------------------------------------------
function initServices() {
  const list = $('[data-services]');
  const prev = $('.svc-preview');
  if (!finePointer || !prev) return;
  const img = $('img', prev);
  gsap.set(prev, { x: -400, y: -400 });
  const px = gsap.quickTo(prev, 'x', { duration: 0.55, ease: 'power3' });
  const py = gsap.quickTo(prev, 'y', { duration: 0.55, ease: 'power3' });
  let current = null;
  list.addEventListener('pointermove', (e) => {
    px(e.clientX + 40);
    py(e.clientY);
    const row = e.target.closest('.svc');
    const src = row?.dataset.preview;
    if (src && src !== current) {
      current = src;
      img.src = src;
    }
    prev.classList.toggle('is-on', !!src && !e.target.closest('.svc__actions'));
  });
  list.addEventListener('pointerleave', () => prev.classList.remove('is-on'));
}

// ---------------------------------------------------------------------------
//  Showcase: gepinnter Filmstreifen, Bilder entwickeln sich zur Mitte hin
// ---------------------------------------------------------------------------
function initShowcase() {
  const film = $('[data-film]');
  const track = $('[data-showcase]');
  const frames = $$('.frame', track);
  const cur = $('[data-sc-current]');
  const update = (viewLeft, viewW) => {
    const center = viewLeft + viewW / 2;
    let nearest = 0, best = Infinity;
    frames.forEach((f, i) => {
      const r = f.getBoundingClientRect();
      const c = r.left + r.width / 2;
      // Rechts der Mitte Negativ, zur Mitte hin entwickelt, danach bleibt der Abzug
      const dev = Math.min(1, Math.max(0, (center + viewW * 0.12 - c) / (viewW * 0.3)));
      f.style.setProperty('--dev', dev.toFixed(3));
      const d = Math.abs(c - center);
      if (d < best) (best = d), (nearest = i);
    });
    cur.textContent = String(nearest + 1).padStart(2, '0');
  };

  track.addEventListener('click', (e) => {
    const a = e.target.closest('.frame__img');
    if (!a) return;
    e.preventDefault();
    const ids = frames.map((f) => f.dataset.id);
    openLightbox(ids.indexOf(a.closest('.frame').dataset.id), ids);
  });

  if (reduced) return;
  if (mobile) {
    // Natives Wischen; das Bild in der Mitte entwickelt sich (CSS-Übergang über --dev)
    film.style.setProperty('--film-w', `${track.scrollWidth}px`);
    const io = new IntersectionObserver((es) => es.forEach((e) => e.isIntersecting && e.target.classList.add('is-dev')), { root: film, rootMargin: '0px -30% 0px -30%', threshold: 0.4 });
    frames.forEach((f) => io.observe(f));
    film.addEventListener('scroll', () => {
      const i = Math.round(film.scrollLeft / (track.scrollWidth / frames.length));
      cur.textContent = String(Math.min(frames.length, i + 1)).padStart(2, '0');
    }, { passive: true });
    return;
  }
  const dist = () => track.scrollWidth - window.innerWidth;
  gsap.to(track, {
    x: () => -dist(),
    ease: 'none',
    scrollTrigger: {
      trigger: '.showcase',
      start: 'top top',
      end: () => `+=${dist() * 1.15}`,
      pin: '.showcase__pin',
      scrub: 0.8,
      invalidateOnRefresh: true,
      onUpdate: () => update(0, window.innerWidth),
      onRefresh: () => update(0, window.innerWidth),
    },
  });
  update(0, window.innerWidth);
}

// ---------------------------------------------------------------------------
//  Shooting-Planer (lädt erst in der Nähe oder beim ersten „Shooting planen“)
// ---------------------------------------------------------------------------
let plannerPromise;
function loadPlanner() {
  if (!plannerPromise) {
    plannerPromise = load('./modules/planner/Planner.js')
      .then(async ({ Planner }) => {
        const p = new Planner($('[data-planner]'));
        await p.init();
        ScrollTrigger.refresh();
        return p;
      })
      .catch((e) => {
        console.warn('Planer konnte nicht geladen werden', e);
        return null;
      });
  }
  return plannerPromise;
}
function initPlanner() {
  const io = new IntersectionObserver(
    ([e]) => {
      if (!e.isIntersecting) return;
      io.disconnect();
      loadPlanner();
    },
    { rootMargin: '1000px 0px' }
  );
  io.observe($('#planer'));
  // Schwebender Button weicht der Zusammenfassungsleiste des Planers aus
  new IntersectionObserver(([e]) => document.body.classList.toggle('in-planner', e.isIntersecting), { rootMargin: '0px 0px -40% 0px' }).observe($('#planer'));
  document.addEventListener('click', async (e) => {
    const a = e.target.closest('[data-plan]');
    if (!a) return;
    e.preventDefault();
    closeMenu();
    if ($('.lightbox').open) $('.lightbox').close();
    scrollToEl($('[data-planner]'), -110);
    const p = await loadPlanner();
    p?.preselect(a.dataset.plan);
  });
}

// ---------------------------------------------------------------------------
//  Galerie: Filter (Radio + CSS, hier nur Komfort), Mehr laden, Boudoir-Hinweis
// ---------------------------------------------------------------------------
const FIRST = mobile ? 12 : 20;
let shown = FIRST;
let boudoirOk = store.get('boudoir-ok', 'sessionStorage') === '1';
const items = () => $$('.g-item');
const filterState = () => ({
  cat: $('input[name="gf"]:checked')?.value ?? 'alle',
  sub: $('input[name="gfs"]:checked')?.value ?? 'alle',
});
function visibleItems() {
  const { cat, sub } = filterState();
  return items().filter((el) => {
    if (cat === 'alle') return !el.hasAttribute('data-gated');
    if (el.dataset.cat !== cat) return false;
    return cat !== 'hochzeit' || sub === 'alle' || el.dataset.sub === sub;
  });
}

function applyGallery(animate = true) {
  const { cat } = filterState();
  const vis = visibleItems();
  items().forEach((el) => el.classList.remove('is-more'));
  vis.forEach((el, i) => el.classList.toggle('is-more', i >= shown));
  $('[data-gallery-more]').hidden = vis.length <= shown;
  const gated = cat === 'boudoir';
  $('[data-gate]').hidden = !gated || boudoirOk;
  if (gated && boudoirOk) unlockBoudoir();

  // CTA passend zur Kategorie
  const label = cat === 'alle' ? null : catLabel(cat);
  const msg = label ? `Guten Tag, ich habe auf Ihrer Website die Galerie „${label}“ gesehen und interessiere mich für ein ähnliches Shooting.` : 'Guten Tag, ich habe Ihre Fotogalerie gesehen und interessiere mich für ein Shooting.';
  const cta = $('[data-gallery-cta]');
  if (hasWa()) $('.wa-only', cta).href = waLink(msg);
  const plan = $('[data-plan-from-gallery]', cta);
  if (OCCASION[cat]) plan.dataset.plan = OCCASION[cat];
  else plan.removeAttribute('data-plan');

  if (animate && !reduced) {
    const fresh = vis.filter((el) => !el.classList.contains('is-more'));
    gsap.fromTo(fresh, { opacity: 0, y: 26 }, { opacity: 1, y: 0, duration: 0.7, stagger: { each: 0.025, from: 'start' }, ease: 'power2.out', overwrite: true });
  }
  ScrollTrigger.refresh();
}

function unlockBoudoir() {
  $$('.g-item[data-gated]').forEach((el) => {
    if (el.dataset.unlocked) return;
    el.dataset.unlocked = '1';
    const id = el.dataset.id;
    const alt = `${catLabel('boudoir')}, Fotostudio Schnitzler Hürth`;
    const a = $('.g-item__link', el);
    a.href = largest(id, imagesMeta);
    a.setAttribute('aria-label', `${alt}, vergrößern`);
    $('.g-item__mat', el).innerHTML = galleryPicture(id, imagesMeta, { alt, sizes: '(max-width: 560px) 44vw, 260px' }) + '<span class="vf" aria-hidden="true"></span>';
  });
}

function setGalleryFilter(id) {
  const hz = categories.find((c) => c.id === 'hochzeit');
  const sub = hz.subs.find((s) => s.id === id);
  const main = sub ? 'hochzeit' : id;
  const r = document.getElementById(`gf-${main}`);
  if (!r) {
    if (id !== 'alle') setGalleryFilter('alle');
    return;
  }
  r.checked = true;
  const rs = document.getElementById(`gfs-${sub ? sub.id : 'alle'}`);
  if (rs) rs.checked = true;
  shown = FIRST;
  applyGallery();
}

function initGallery() {
  const grid = $('[data-gallery]');
  $('.gallery').addEventListener('change', (e) => {
    if (e.target.name !== 'gf' && e.target.name !== 'gfs') return;
    if (e.target.name === 'gf') {
      const rs = $('#gfs-alle');
      if (rs) rs.checked = true;
    }
    shown = FIRST;
    applyGallery();
    if (e.target.value === 'boudoir' && !boudoirOk) $('[data-gate-ok]').focus({ preventScroll: true });
  });
  $('[data-gallery-more]').addEventListener('click', () => {
    shown += mobile ? 12 : 20;
    applyGallery(false);
    if (!reduced) gsap.fromTo(visibleItems().slice(shown - (mobile ? 12 : 20), shown), { opacity: 0, y: 26 }, { opacity: 1, y: 0, duration: 0.7, stagger: 0.03, ease: 'power2.out' });
  });
  $('[data-gate-ok]').addEventListener('click', () => {
    boudoirOk = true;
    store.set('boudoir-ok', '1', 'sessionStorage');
    applyGallery();
    $('.g-item[data-gated] .g-item__link')?.focus({ preventScroll: true });
  });
  $('[data-gate-cancel]').addEventListener('click', () => {
    setGalleryFilter('alle');
    $('#gf-alle').focus({ preventScroll: true });
  });

  grid.addEventListener('click', (e) => {
    const a = e.target.closest('.g-item__link');
    if (!a) return;
    e.preventDefault();
    const item = a.closest('.g-item');
    if (item.hasAttribute('data-gated') && !boudoirOk) {
      $('[data-gate]').hidden = false;
      $('[data-gate-ok]').focus();
      return;
    }
    const ids = visibleItems().map((el) => el.dataset.id);
    openLightbox(ids.indexOf(item.dataset.id), ids, item.dataset.cat);
  });

  document.addEventListener('click', (e) => {
    const a = e.target.closest('[data-show-gallery]');
    if (!a) return;
    e.preventDefault();
    setGalleryFilter(a.dataset.showGallery);
    scrollToEl($('#galerie'));
  });

  const q = new URLSearchParams(location.search).get('galerie');
  if (q) setGalleryFilter(q);
  else applyGallery(false);
}

// ---------------------------------------------------------------------------
//  Lightbox: Wischen, Tastatur, Zoom (Doppelklick, Mausrad, zwei Finger)
// ---------------------------------------------------------------------------
const lb = { i: 0, ids: [], cat: null, scale: 1, x: 0, y: 0 };
function catOf(id) {
  const folder = id.split('/')[0];
  return categories.find((c) => c.folders?.includes(folder) || c.subs?.some((s) => s.folder === folder))?.id;
}
function openLightbox(i, ids, cat = null) {
  if (i < 0) return;
  Object.assign(lb, { i, ids, cat });
  const box = $('.lightbox');
  box.showModal();
  lenis?.stop();
  showLb();
}
function setZoom(scale, x = 0, y = 0) {
  lb.scale = scale;
  lb.x = scale === 1 ? 0 : x;
  lb.y = scale === 1 ? 0 : y;
  $('.lightbox__figure').style.transform = `translate(${lb.x}px, ${lb.y}px) scale(${lb.scale})`;
  $('.lightbox').classList.toggle('is-zoomed', scale > 1);
  $('[data-lb-zoom]').setAttribute('aria-label', scale > 1 ? 'Verkleinern' : 'Vergrößern');
}
function showLb() {
  const id = lb.ids[lb.i];
  const m = imagesMeta.gallery[id];
  const img = $('[data-lb-img]');
  const cat = lb.cat ?? catOf(id);
  const label = catLabel(cat);
  img.src = largest(id, imagesMeta);
  img.width = m.w;
  img.height = m.h;
  img.alt = `${label}, Bild ${lb.i + 1} von ${lb.ids.length}`;
  img.closest('.lightbox__mat').style.setProperty('--w', `${m.w}px`);
  $('[data-lb-cat]').textContent = label;
  $('[data-lb-count]').textContent = `${lb.i + 1} / ${lb.ids.length}`;
  if (hasWa()) $('[data-lb-wa]').href = waLink(`Guten Tag, ich habe auf Ihrer Website ein Bild aus der Galerie „${label}“ gesehen (Bild ${id.split('/')[1]}) und interessiere mich für ein ähnliches Shooting.`);
  const plan = $('[data-lb-plan]');
  if (OCCASION[cat]) plan.dataset.plan = OCCASION[cat];
  else plan.removeAttribute('data-plan');
  setZoom(1);
  if (!reduced) gsap.fromTo('.lightbox__figure', { opacity: 0, scale: 0.97 }, { opacity: 1, scale: 1, duration: 0.45, ease: 'power2.out', clearProps: 'scale' });
}
function initLightbox() {
  const box = $('.lightbox');
  const stage = $('[data-lb-stage]');
  const step = (d) => {
    lb.i = (lb.i + d + lb.ids.length) % lb.ids.length;
    showLb();
  };
  $('[data-lb-close]').addEventListener('click', () => box.close());
  $('[data-lb-prev]').addEventListener('click', () => step(-1));
  $('[data-lb-next]').addEventListener('click', () => step(1));
  $('[data-lb-zoom]').addEventListener('click', () => setZoom(lb.scale > 1 ? 1 : 2));
  box.addEventListener('close', () => {
    lenis?.start();
    setZoom(1);
  });
  // Schließen nur, wenn wirklich auf den dunklen Rand gedrückt und nicht gezogen wurde
  let downOnStage = false, moved = false, lastType = 'mouse';
  box.addEventListener('click', (e) => {
    if (e.target === stage && downOnStage && !moved) box.close();
  });
  box.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowRight') step(1);
    if (e.key === 'ArrowLeft') step(-1);
    if (e.key === '+' || e.key === '=') setZoom(Math.min(3, lb.scale + 0.5), lb.x, lb.y);
    if (e.key === '-') setZoom(Math.max(1, lb.scale - 0.5), lb.x, lb.y);
  });
  stage.addEventListener('dblclick', () => lastType !== 'touch' && setZoom(lb.scale > 1 ? 1 : 2));
  stage.addEventListener('wheel', (e) => {
    e.preventDefault();
    setZoom(Math.min(3, Math.max(1, lb.scale - e.deltaY * 0.002)), lb.x, lb.y);
  }, { passive: false });

  // Zeiger: Wischen (ohne Zoom), Verschieben (mit Zoom), Pinch (zwei Finger)
  const pts = new Map();
  let start = null, pinch = null, pinched = false, lastTap = 0;
  stage.addEventListener('pointerdown', (e) => {
    if (!pts.size) {
      downOnStage = e.target === stage;
      moved = false;
      pinched = false;
      lastType = e.pointerType;
    }
    stage.setPointerCapture(e.pointerId);
    pts.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pts.size === 2) {
      const [a, b] = [...pts.values()];
      pinch = { d: Math.hypot(a.x - b.x, a.y - b.y), s: lb.scale };
      pinched = true;
    } else start = { x: e.clientX, y: e.clientY, lx: lb.x, ly: lb.y, t: Date.now() };
  });
  stage.addEventListener('pointermove', (e) => {
    if (!pts.has(e.pointerId)) return;
    pts.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (start && Math.hypot(e.clientX - start.x, e.clientY - start.y) > 6) moved = true;
    if (pinch && pts.size === 2) {
      const [a, b] = [...pts.values()];
      setZoom(Math.min(3, Math.max(1, (pinch.s * Math.hypot(a.x - b.x, a.y - b.y)) / pinch.d)), lb.x, lb.y);
    } else if (start && lb.scale > 1) {
      setZoom(lb.scale, start.lx + e.clientX - start.x, start.ly + e.clientY - start.y);
    }
  });
  const end = (e) => {
    pts.delete(e.pointerId);
    if (pinch && pts.size === 1) {
      // Nach dem Pinch verschiebt der verbleibende Finger ab seiner eigenen Position
      const [r] = [...pts.values()];
      start = { x: r.x, y: r.y, lx: lb.x, ly: lb.y, t: Date.now() };
    }
    if (pts.size < 2) pinch = null;
    if (!start || pts.size) return;
    if (pinched) {
      start = null;
      return;
    }
    const dx = e.clientX - start.x, dy = e.clientY - start.y;
    if (lb.scale === 1 && Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy)) step(dx < 0 ? 1 : -1);
    else if (e.pointerType === 'touch' && Math.abs(dx) < 8 && Math.abs(dy) < 8) {
      // Doppeltippen zoomt
      if (Date.now() - lastTap < 300) setZoom(lb.scale > 1 ? 1 : 2);
      lastTap = Date.now();
    }
    start = null;
  };
  stage.addEventListener('pointerup', end);
  stage.addEventListener('pointercancel', end);
}

// ---------------------------------------------------------------------------
//  Vorher/Nachher-Slider
// ---------------------------------------------------------------------------
function initBeforeAfter() {
  $$('.ba__frame').forEach((f) => {
    const r = $('.ba__range', f);
    const set = () => {
      f.style.setProperty('--pos', `${r.value}%`);
      f.style.setProperty('--pos-n', r.value / 100);
    };
    r.addEventListener('input', set);
    set();
    // Kurzer Hinweis, dass man schieben kann
    if (!reduced) {
      ScrollTrigger.create({
        trigger: f,
        start: 'top 70%',
        once: true,
        onEnter: () => gsap.fromTo(r, { value: 50 }, { value: 30, duration: 0.7, ease: 'power2.inOut', yoyo: true, repeat: 1, onUpdate: set }),
      });
    }
  });
}

// ---------------------------------------------------------------------------
//  Karte (erst nach Klick)
// ---------------------------------------------------------------------------
function initMap() {
  $('[data-map-load]').addEventListener('click', () => {
    const { lat, lon } = site.geo;
    const bbox = [lon - 0.005, lat - 0.0022, lon + 0.005, lat + 0.0022].map((v) => v.toFixed(5)).join(',');
    $('[data-map]').innerHTML = `<iframe title="Lage des Fotostudio Schnitzler auf OpenStreetMap" src="https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${lat},${lon}" loading="lazy"></iframe>`;
  });
}

// ---------------------------------------------------------------------------
//  Cursor (Kamerasucher) und magnetische Buttons – nur mit Maus
// ---------------------------------------------------------------------------
function initCursor() {
  if (!finePointer || reduced) return;
  document.body.classList.add('has-cursor');
  const el = $('.cursor');
  const label = $('.cursor__label');
  const x = gsap.quickTo(el, 'x', { duration: 0.18, ease: 'power3' });
  const y = gsap.quickTo(el, 'y', { duration: 0.18, ease: 'power3' });
  // Bis zur ersten Mausbewegung versteckt, sonst steht der Sucher oben links
  document.body.classList.add('cursor-hidden');
  let seen = false;
  window.addEventListener('pointermove', (e) => {
    if (!seen) {
      seen = true;
      gsap.set(el, { x: e.clientX, y: e.clientY });
    }
    x(e.clientX);
    y(e.clientY);
    document.body.classList.remove('cursor-hidden');
  });
  document.addEventListener('pointerleave', () => document.body.classList.add('cursor-hidden'));
  document.addEventListener('pointerenter', () => document.body.classList.remove('cursor-hidden'));
  let focusEl = null;
  document.addEventListener('pointerover', (e) => {
    const img = e.target.closest('[data-cursor], .g-item__link, .svc, .print, .ba__frame');
    const link = e.target.closest('a, button, summary, label, input, select, textarea');
    const canvas = e.target.closest('.hero__stage');
    if (img !== focusEl) {
      document.body.classList.remove('cursor-focus');
      if (img) {
        void el.offsetWidth; // Animation neu starten
        document.body.classList.add('cursor-focus');
      }
      focusEl = img;
    }
    document.body.classList.toggle('cursor-link', !!link && !img);
    label.textContent = img ? img.dataset.cursor || (img.classList.contains('ba__frame') ? 'Schieben' : img.classList.contains('svc') ? '' : 'Ansehen') : canvas && !link ? 'Licht' : '';
    document.body.classList.toggle('cursor-focus', !!img || (!!canvas && !link));
  });

  $$('.magnetic').forEach((m) => {
    const mx = gsap.quickTo(m, 'x', { duration: 0.6, ease: 'elastic.out(1, 0.4)' });
    const my = gsap.quickTo(m, 'y', { duration: 0.6, ease: 'elastic.out(1, 0.4)' });
    m.addEventListener('pointermove', (e) => {
      const r = m.getBoundingClientRect();
      mx((e.clientX - r.left - r.width / 2) * 0.28);
      my((e.clientY - r.top - r.height / 2) * 0.38);
    });
    m.addEventListener('pointerleave', () => {
      mx(0);
      my(0);
    });
  });
}

// ---------------------------------------------------------------------------
//  Start
// ---------------------------------------------------------------------------
initTheme();
initHours();
initScroll();
initHeroScroll();
initReveals();
initMarquee();
initServices();
initShowcase();
initPlanner();
initGallery();
initLightbox();
initBeforeAfter();
initMap();
initCursor();
// WebGL erst nach dem ersten Bild laden, damit der Seitenaufbau nicht wartet
requestAnimationFrame(() => setTimeout(initHero, 0));
preload().then(() => {
  heroIntro();
  ScrollTrigger.refresh();
});
window.addEventListener('load', () => ScrollTrigger.refresh());
// Ändert sich die Seitenhöhe (Planer lädt nach, Galerie filtert), Scroll-Positionen neu berechnen
let lastHeight = 0, refreshTimer;
new ResizeObserver(() => {
  const h = document.body.scrollHeight;
  if (Math.abs(h - lastHeight) < 4) return;
  lastHeight = h;
  clearTimeout(refreshTimer);
  refreshTimer = setTimeout(() => ScrollTrigger.refresh(), 200);
}).observe(document.body);
if (import.meta.env.DEV) Object.assign(window, { __lenis: () => lenis, mailLink });
