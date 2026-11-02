// ============================================================================
//  SHOOTING-PLANER – Schritt für Schritt zur fertigen Anfrage.
//  Wird von main.js per import() nachgeladen, sobald #planer in die Nähe kommt.
//  Vertrag: new Planner(root) · await init() · preselect('portrait')
//  Die 3D-Lichtvorschau (LightPreview.js, Three.js) lädt erst im Schritt „Look“.
// ============================================================================
import { gsap } from 'gsap';
import { site, hasWa, waLink, mailLink, telLink, fullAddress } from '../../config.js';
import { lookExamples } from '../../data/gallery.js';
import { picture } from '../../lib/pic.js';
import { OCCASIONS, STEPS, COLORS, LIGHTS, DAYTIMES, TERMIN_HINT } from './data.js';
import { rows, message, subject, extrasFor, todayIso } from './message.js';
import '../../styles/planner.css';

const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

const svg = (d, extra = '') => `<svg class="ico" viewBox="0 0 24 24" aria-hidden="true" focusable="false"${extra}>${d}</svg>`;
const line = (d) => `<path d="${d}" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>`;
const ICON = {
  next: svg(line('M4 12h15M13 6l6 6-6 6')),
  prev: svg(line('M20 12H5M11 6l-6 6 6 6')),
  plus: svg(line('M12 5v14M5 12h14')),
  minus: svg(line('M5 12h14')),
  close: svg(line('M6 6l12 12M18 6 6 18')),
  chevron: svg(line('M6 15l6-6 6 6')),
  mail: svg(line('M3.5 6.5h17v11h-17zM4 7l8 6 8-6')),
  phone: svg(line('M6.5 3.5h3l1.5 4-2 1.5a11 11 0 0 0 6 6l1.5-2 4 1.5v3a2 2 0 0 1-2 2A16 16 0 0 1 4.5 5.5a2 2 0 0 1 2-2z')),
  wa: svg(line('M4 20l1.2-4A8 8 0 1 1 8 18.8zM9 8.5c0 3.5 3 6.5 6.5 6.5l1-1.5-2-1-1 .8a5 5 0 0 1-2.8-2.8l.8-1-1-2z')),
  copy: svg(line('M8.5 8.5h11v11h-11zM15.5 8.5v-4h-11v11h4')),
  image: svg(line('M3.5 5.5h17v13h-17zM3.5 15l5-4.5 4 3.5 3-2.5 5 4M15.5 9.5h.01')),
  light: svg(line('M12 3v2M12 19v2M3 12h2M19 12h2M5.6 5.6l1.4 1.4M17 17l1.4 1.4M5.6 18.4 7 17M17 7l1.4-1.4M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8z')),
  drag: svg(line('M8 12h8M5 12l3-3M5 12l3 3M19 12l-3-3M19 12l-3 3')),
};

// Lichtstimmungen, die die Vorschau zeigen kann („Beraten Sie mich“ zeigt das klassische Licht)
const MOODS = ['highkey', 'lowkey', 'rembrandt'];
const MOOD_NAME = { highkey: 'High-Key', lowkey: 'Low-Key', rembrandt: 'Klassisch / Rembrandt' };

let uid = 0;

export class Planner {
  constructor(root) {
    this.root = root;
    this.id = `pl${++uid}`;
    this.reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
    this.occasions = OCCASIONS.filter((o) => !o.gate || site[o.gate]);
    this.s = { occasion: null, details: {}, place: null, placeText: '', color: null, light: null, extras: [], date: '', daytime: null, name: '', note: '' };
    this.files = [];
    this.visited = new Set(['anlass']);
    this.step = 'anlass';
    this.ready = false;
    this.q = (sel) => root.querySelector(sel);
    this.qa = (sel) => [...root.querySelectorAll(sel)];
  }

  async init() {
    if (this.ready) return;
    this.root.innerHTML = this.markup();
    this.root.classList.add('is-enhanced');
    this.viewport = this.q('[data-viewport]');
    this.stage = this.q('[data-stage]');
    this.bind();
    this.renderDetails();
    this.renderExtras();
    this.renderTermin();
    this.panel('anlass').hidden = false;
    this.updateProgress();
    this.updateNav();
    this.renderSummary();
    this.ready = true;
    if (this.pending) {
      const id = this.pending;
      this.pending = null;
      this.preselect(id);
    }
  }

  // Von außen: Anlass setzen und direkt zu den Details springen
  preselect(occasionId) {
    if (!this.ready) {
      this.pending = occasionId;
      return;
    }
    const input = this.qa('input[name="occasion"]').find((i) => i.value === occasionId);
    if (!input) return;
    input.checked = true;
    this.setOccasion(occasionId);
    this.renderSummary();
    // Die Seite scrollt selbst zum Planer, deshalb hier kein eigenes Scrollen
    this.go('details', { scroll: false });
  }

  // -------------------------------------------------------------------------
  //  Hilfen
  // -------------------------------------------------------------------------
  occ(id = this.s.occasion) {
    return this.occasions.find((o) => o.id === id) || null;
  }

  activeSteps() {
    const o = this.s.occasion;
    return STEPS.filter((st) => !o || !st.skip?.includes(o));
  }

  activeIds() {
    return this.activeSteps().map((st) => st.id);
  }

  panel(id) {
    return this.q(`[data-step="${id}"]`);
  }

  ctx() {
    return { occ: this.occ(), steps: this.activeIds(), files: this.relevantFiles().length, occasions: this.occasions };
  }

  // Fotos zählen nur bei Reproduktion; wechselt der Anlass, hängen sie nicht an anderen Anfragen
  relevantFiles() {
    return this.occ()?.id === 'reproduktion' ? this.files : [];
  }

  details() {
    const o = this.occ();
    return o ? (this.s.details[o.id] ||= Object.fromEntries(o.fields.filter((f) => f.key).map((f) => [f.key, f.type === 'count' ? f.def : f.type === 'check' ? [] : '']))) : {};
  }

  setError(input, errEl, msg) {
    const ids = (input.getAttribute('aria-describedby') || '').split(' ').filter((x) => x && x !== errEl.id);
    errEl.textContent = msg || '';
    errEl.hidden = !msg;
    input.closest('.field')?.classList.toggle('is-error', !!msg);
    if (msg) {
      ids.push(errEl.id);
      input.setAttribute('aria-invalid', 'true');
    } else input.removeAttribute('aria-invalid');
    if (ids.length) input.setAttribute('aria-describedby', ids.join(' '));
    else input.removeAttribute('aria-describedby');
  }

  // -------------------------------------------------------------------------
  //  Markup
  // -------------------------------------------------------------------------
  choice(type, name, value, title, { hint = '', checked = false, extra = '', cls = '' } = {}) {
    return `<label class="choice planner__choice${cls ? ` ${cls}` : ''}">
      <input type="${type}" name="${name}" value="${esc(value)}"${checked ? ' checked' : ''} />
      <span class="planner__mark planner__mark--${type}" aria-hidden="true"></span>
      <span class="planner__ct"><span class="planner__cl">${title}</span>${hint ? `<span class="planner__ch">${hint}</span>` : ''}</span>${extra}
    </label>`;
  }

  shell(st, body, intro = '') {
    return `<section class="planner__step" data-step="${st.id}" hidden>
      <fieldset class="planner__fs" data-fs>
        <legend class="planner__legend"><h3 class="h-2 planner__title" tabindex="-1" data-title>${st.title}</h3></legend>
        ${intro ? `<p class="planner__intro" data-intro>${intro}</p>` : '<p class="planner__intro" data-intro hidden></p>'}
        ${body}
      </fieldset>
    </section>`;
  }

  markup() {
    const id = this.id;
    const step = (sid) => STEPS.find((x) => x.id === sid);
    const price = (o) => (site.prices?.[o.id] ? `<span class="planner__price">${esc(site.prices[o.id])}</span>` : '');

    const anlass = this.shell(
      step('anlass'),
      `<div class="planner__choices planner__choices--occ">
        ${this.occasions.map((o) => this.choice('radio', 'occasion', o.id, esc(o.label), { hint: esc(o.hint), extra: price(o), cls: 'planner__choice--occ' })).join('')}
      </div>
      <p class="field__error planner__error" id="${id}-err-anlass" hidden></p>`,
      'Wählen Sie den Anlass. Alles Weitere passt sich an.'
    );

    const details = this.shell(step('details'), `<div class="planner__fields" data-details></div>`);

    const ort = this.shell(
      step('ort'),
      `<div class="planner__choices planner__choices--2">
        ${this.choice('radio', 'place', 'studio', 'Im Studio', { hint: esc(fullAddress()), cls: 'planner__choice--tall' })}
        ${this.choice('radio', 'place', 'location', 'An einer Location', { hint: 'Am Ort Ihrer Wahl, drinnen oder draußen', cls: 'planner__choice--tall' })}
      </div>
      <div class="field planner__reveal" data-place-field hidden>
        <label for="${id}-place">Wo genau? (optional)</label>
        <input type="text" id="${id}-place" name="placeText" placeholder="z. B. Schloss Gracht oder bei uns zu Hause" autocomplete="off" />
      </div>`,
      'Bei uns im Studio oder an einem Ort Ihrer Wahl.'
    );

    const look = this.shell(
      step('look'),
      `<div class="planner__stage" data-stage data-color="farbe" data-mood="rembrandt">
        <canvas class="planner__canvas" data-canvas tabindex="0" role="application" aria-roledescription="Lichtvorschau"
          aria-label="Lichtvorschau an einer Marmorbüste. Ziehen Sie mit Maus oder Finger oder nutzen Sie die Pfeiltasten, um das Hauptlicht zu verschieben. Pos1 setzt es zurück."
          aria-describedby="${id}-light-status"></canvas>
        <div class="planner__fallback" data-fallback hidden></div>
        <div class="planner__sw" data-sw aria-hidden="true"></div>
        <span class="planner__tag planner__tag--l" aria-hidden="true">Farbe</span>
        <span class="planner__tag planner__tag--r" aria-hidden="true">Schwarzweiß</span>
        <div class="planner__stage-loading" data-stage-loading><span class="planner__spinner" aria-hidden="true"></span><span>Lichtvorschau wird geladen …</span></div>
        <div class="planner__hud" aria-hidden="true">
          <span class="planner__hud-mood" data-stage-mood>${MOOD_NAME.rembrandt}</span>
          <span class="planner__hud-hint" data-stage-hint>${ICON.drag}Licht ziehen</span>
          <svg class="planner__dial" viewBox="-32 -32 64 64" data-dial>
            <circle class="planner__dial-ring" r="27" />
            <line class="planner__dial-beam" x1="0" y1="0" x2="0" y2="20" data-dial-beam />
            <path class="planner__dial-cam" d="M-5 25h10v5h-10z M-2 25l-1.5-3h7L2 25" />
            <ellipse class="planner__dial-head" rx="6.5" ry="7.5" />
            <path class="planner__dial-head" d="M-2 7l2 3 2-3" />
            <circle class="planner__dial-glow" r="7" cx="0" cy="20" data-dial-glow />
            <circle class="planner__dial-light" r="3.6" cx="0" cy="20" data-dial-light />
          </svg>
        </div>
      </div>
      <p class="sr-only" id="${id}-light-status" aria-live="polite" data-light-status></p>
      <div class="planner__look">
        <fieldset class="planner__group">
          <legend class="planner__group-legend">Farbe oder Schwarzweiß</legend>
          <div class="planner__choices planner__choices--3">${COLORS.map(([v, t, h]) => this.choice('radio', 'color', v, t, { hint: h })).join('')}</div>
        </fieldset>
        <fieldset class="planner__group">
          <legend class="planner__group-legend">Lichtstimmung</legend>
          <div class="planner__choices planner__choices--2">${LIGHTS.map(([v, t, h]) => this.choice('radio', 'light', v, t, { hint: h })).join('')}</div>
        </fieldset>
      </div>`,
      'Probieren Sie es aus: Die Vorschau zeigt, wie Licht ein Gesicht formt.'
    );

    const extras = this.shell(
      step('extras'),
      `<div class="planner__choices planner__choices--2" data-extras></div>
      <p class="planner__note">Ganz unverbindlich. Möglichkeiten und Preise besprechen wir gern persönlich.</p>`,
      'Ich interessiere mich für …'
    );

    const termin = this.shell(
      step('termin'),
      `<div class="planner__fields">
        <div class="planner__when">
          <div class="field">
            <label for="${id}-date" data-date-label>Wunschtermin</label>
            <input type="date" id="${id}-date" name="date" min="${todayIso()}" />
            <p class="field__error" id="${id}-err-date" hidden></p>
          </div>
          <fieldset class="planner__group">
            <legend class="planner__group-legend">Tageszeit</legend>
            <div class="planner__choices planner__choices--3 planner__choices--compact">${DAYTIMES.map(([v, t]) => this.choice('radio', 'daytime', v, t)).join('')}</div>
          </fieldset>
        </div>
        <p class="planner__hint">${ICON.light}${TERMIN_HINT}</p>
        <div class="field">
          <label for="${id}-name">Ihr Name <span class="planner__req">(Pflichtfeld)</span></label>
          <input type="text" id="${id}-name" name="name" autocomplete="name" required aria-required="true" />
          <p class="field__error" id="${id}-err-name" hidden></p>
        </div>
        <div class="field">
          <label for="${id}-note">Ihre Nachricht (optional)</label>
          <textarea id="${id}-note" name="note" rows="4" placeholder="Was sollten wir noch wissen?"></textarea>
        </div>
      </div>`,
      'Nennen Sie uns Ihren Wunsch. Den genauen Termin stimmen wir persönlich mit Ihnen ab.'
    );

    const sendMain = hasWa()
      ? `<a class="btn btn--primary" data-send-wa target="_blank" rel="noopener">${ICON.wa}Per WhatsApp senden</a>
         <a class="btn" data-send-mail>${ICON.mail}Per E-Mail</a>`
      : `<a class="btn btn--primary" data-send-mail>${ICON.mail}Per E-Mail senden</a>
         <a class="btn" href="${telLink()}">${ICON.phone}Anrufen: ${esc(site.phone)}</a>`;

    const done = `<section class="planner__step planner__done" data-step="fertig" hidden>
      <h3 class="h-2 planner__title" tabindex="-1" data-title>Ihre Anfrage ist <em>bereit</em></h3>
      <p class="planner__intro">${hasWa() ? 'Prüfen Sie den Text und senden Sie ihn per WhatsApp oder E-Mail.' : 'Prüfen Sie den Text. Mit einem Klick öffnet sich Ihr E-Mail-Programm mit der fertigen Nachricht.'} Gesendet wird erst, wenn Sie es dort bestätigen.</p>
      <div class="planner__letter">
        <p class="planner__letter-head"><span>An</span> ${esc(site.name)}${hasWa() ? '' : ` · ${esc(site.email)}`}</p>
        <div class="planner__msg" data-msg tabindex="0" role="region" aria-label="Vorschau Ihrer Nachricht"></div>
      </div>
      <div class="planner__attach" data-attach hidden></div>
      <div class="planner__send">
        ${sendMain}
        <button type="button" class="text-link planner__copy" data-copy>${ICON.copy}<span data-copy-label>Text kopieren</span></button>
      </div>
      <p class="sr-only" role="status" data-copy-status></p>
    </section>`;

    return `<div class="planner__head">
      <div class="planner__progress">
        <p class="planner__count"><span data-count>Schritt 1 von 6</span><span class="planner__count-name" data-count-name>Anlass</span></p>
        <div class="planner__line" aria-hidden="true"><span data-line></span></div>
      </div>
      <nav class="planner__steps" aria-label="Schritte des Planers"><ol data-steps></ol></nav>
    </div>
    <div class="planner__grid">
      <form class="planner__main" data-form novalidate>
        <div class="planner__viewport" data-viewport>${anlass}${details}${ort}${look}${extras}${termin}${done}</div>
        <div class="planner__nav">
          <button type="button" class="btn planner__prev" data-prev>${ICON.prev}<span>Zurück</span></button>
          <button type="button" class="btn btn--primary planner__next" data-next><span data-next-label>Weiter</span>${ICON.next}</button>
        </div>
      </form>
      <aside class="planner__aside" data-aside aria-labelledby="${id}-sum-title">
        <div class="planner__sum">
          <button type="button" class="planner__sum-toggle" data-sum-toggle aria-expanded="false" aria-controls="${id}-sum">
            <span>Zusammenfassung <span class="planner__sum-n">(<span data-sum-n>0 Angaben</span>)</span></span>${ICON.chevron}
          </button>
          <h3 class="planner__sum-title" id="${id}-sum-title"><span>Ihre Auswahl</span></h3>
          <div class="planner__sum-body" id="${id}-sum">
            <p class="planner__sum-empty" data-sum-empty>Hier sammeln sich Ihre Angaben. Am Ende wird daraus eine fertige Nachricht an uns.</p>
            <div class="planner__sum-groups" data-sum aria-live="polite"></div>
            <p class="planner__sum-foot">Unverbindlich. Gesendet wird erst, wenn Sie es möchten.</p>
          </div>
        </div>
      </aside>
    </div>`;
  }

  fieldHtml(f, d) {
    const occ = this.occ();
    const fid = `${this.id}-${occ.id}-${f.key || 'x'}`;
    const v = d[f.key];
    switch (f.type) {
      case 'count':
        return `<div class="field planner__field">
          <label for="${fid}">${esc(f.label)}</label>
          <div class="planner__stepper">
            <button type="button" class="planner__stepper-btn" data-dec="${fid}" aria-label="Eins weniger" aria-controls="${fid}">${ICON.minus}</button>
            <input type="number" id="${fid}" name="d.${f.key}" min="${f.min}" max="${f.max}" step="1" inputmode="numeric" value="${esc(v)}" />
            <button type="button" class="planner__stepper-btn" data-inc="${fid}" aria-label="Eins mehr" aria-controls="${fid}">${ICON.plus}</button>
          </div>
        </div>`;
      case 'radio':
      case 'check': {
        const type = f.type === 'radio' ? 'radio' : 'checkbox';
        const isOn = (x) => (f.type === 'radio' ? v === x : (v || []).includes(x));
        const cols = f.options.length === 2 || f.options.length === 4 ? 2 : 3;
        return `<fieldset class="planner__group">
          <legend class="planner__group-legend">${esc(f.label)}${f.type === 'check' ? ' <span class="planner__multi">(Mehrfachauswahl)</span>' : ''}</legend>
          <div class="planner__choices planner__choices--${cols} planner__choices--compact">${f.options.map(([x, t]) => this.choice(type, `d.${f.key}`, x, esc(t), { checked: isOn(x) })).join('')}</div>
        </fieldset>`;
      }
      case 'select': {
        const opts = f.options === 'occasions' ? [...this.occasions.filter((o) => !['gutschein', 'passbild', 'reproduktion'].includes(o.id)).map((o) => [o.id, o.label]), ['offen', 'Noch offen']] : f.options.map((t) => [t, t]);
        return `<div class="field planner__field">
          <label for="${fid}">${esc(f.label)}</label>
          <select id="${fid}" name="d.${f.key}">
            <option value="">Bitte wählen</option>
            ${opts.map(([x, t]) => `<option value="${esc(x)}"${v === x ? ' selected' : ''}>${esc(t)}</option>`).join('')}
          </select>
        </div>`;
      }
      case 'text':
        return `<div class="field planner__field">
          <label for="${fid}">${esc(f.label)}</label>
          <input type="text" id="${fid}" name="d.${f.key}" value="${esc(v)}"${f.placeholder ? ` placeholder="${esc(f.placeholder)}"` : ''} autocomplete="off" />
        </div>`;
      case 'date':
        return `<div class="field planner__field">
          <label for="${fid}">${esc(f.label)}</label>
          <input type="date" id="${fid}" name="d.${f.key}" min="${todayIso()}" value="${esc(v)}" data-date />
          <p class="field__error" id="${fid}-err" hidden></p>
        </div>`;
      case 'fixed':
        return `<div class="planner__fixed"><span>${esc(f.label)}</span><strong>${esc(f.value)}</strong></div>`;
      case 'note':
        return `<p class="planner__note">${esc(f.text)}</p>`;
      case 'upload':
        return `<div class="planner__upload">
          <span class="planner__group-legend" id="${fid}-l">${esc(f.label)}</span>
          <label class="planner__drop" data-drop>
            <input type="file" class="sr-only" accept="image/*" multiple data-file aria-describedby="${fid}-privacy" aria-labelledby="${fid}-l ${fid}-btn" />
            ${ICON.image}
            <span class="planner__drop-text"><strong id="${fid}-btn">Foto auswählen</strong><span>oder hierher ziehen</span></span>
          </label>
          <p class="planner__privacy" id="${fid}-privacy">Das Foto bleibt auf Ihrem Gerät und wird nicht hochgeladen. Es dient nur als Vorschau. Bitte senden Sie es zusammen mit Ihrer Nachricht im Chat oder als Anhang Ihrer E-Mail.</p>
          <ul class="planner__thumbs" data-thumbs></ul>
        </div>`;
      default:
        return '';
    }
  }

  renderDetails() {
    const occ = this.occ();
    const wrap = this.q('[data-details]');
    const p = this.panel('details');
    const title = p.querySelector('[data-title]');
    const intro = p.querySelector('[data-intro]');
    if (!occ) {
      title.innerHTML = STEPS[1].title;
      wrap.innerHTML = '';
      intro.hidden = true;
      return;
    }
    title.innerHTML = occ.title;
    intro.textContent = occ.intro || 'Damit wir uns gut vorbereiten können. Alles ist freiwillig.';
    intro.hidden = false;
    const d = this.details();
    wrap.innerHTML = occ.fields.map((f) => this.fieldHtml(f, d)).join('');
    if (occ.fields.some((f) => f.type === 'upload')) this.renderThumbs();
  }

  renderExtras() {
    const occ = this.occ();
    const list = extrasFor(occ?.id);
    // Extras, die zum neuen Anlass nicht passen, fallen weg
    this.s.extras = this.s.extras.filter((x) => list.some((e) => e.id === x));
    this.q('[data-extras]').innerHTML = list.map((e) => this.choice('checkbox', 'extras', e.id, esc(e.label), { checked: this.s.extras.includes(e.id) })).join('');
  }

  renderTermin() {
    const occ = this.occ();
    const p = this.panel('termin');
    p.querySelector('[data-title]').innerHTML = occ?.termin?.title || STEPS[5].title;
    p.querySelector('[data-date-label]').textContent = occ?.termin?.date || 'Wunschtermin';
  }

  renderThumbs() {
    const ul = this.q('[data-thumbs]');
    if (!ul) return;
    ul.innerHTML = this.files
      .map(
        (f, i) => `<li class="planner__thumb">
          <img src="${f.url}" alt="Vorschau: ${esc(f.name)}" />
          <button type="button" class="planner__thumb-x" data-remove="${i}" aria-label="Foto entfernen: ${esc(f.name)}">${ICON.close}</button>
        </li>`
      )
      .join('');
    const strong = this.q('[data-drop] strong');
    if (strong) strong.textContent = this.files.length ? 'Weiteres Foto auswählen' : 'Foto auswählen';
  }

  // -------------------------------------------------------------------------
  //  Ereignisse
  // -------------------------------------------------------------------------
  bind() {
    const form = this.q('[data-form]');
    form.addEventListener('submit', (e) => e.preventDefault());
    form.addEventListener('change', (e) => this.onField(e));
    form.addEventListener('input', (e) => this.onField(e));
    // Enter in einem Textfeld = Weiter (statt Formular absenden)
    form.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && e.target.matches('input:not([type=checkbox]):not([type=radio]):not([type=file])')) {
        e.preventDefault();
        this.next();
      }
    });

    this.root.addEventListener('click', (e) => {
      const t = e.target.closest('button, a');
      if (!t || !this.root.contains(t)) return;
      if (t.dataset.goto) this.go(t.dataset.goto);
      else if (t.matches('[data-next]')) this.next();
      else if (t.matches('[data-prev]')) this.prev();
      else if (t.dataset.inc || t.dataset.dec) this.stepCount(t.dataset.inc || t.dataset.dec, t.dataset.inc ? 1 : -1);
      else if (t.dataset.remove) this.removeFile(+t.dataset.remove);
      else if (t.matches('[data-sum-toggle]')) this.toggleSummary();
      else if (t.matches('[data-copy]')) this.copy();
    });

    // Foto-Vorschau: Auswahl und Ablegen per Drag & Drop
    this.root.addEventListener('change', (e) => {
      if (e.target.matches('[data-file]')) {
        this.addFiles(e.target.files);
        e.target.value = '';
      }
    });
    this.root.addEventListener('dragover', (e) => {
      const drop = e.target.closest?.('[data-drop]');
      if (!drop) return;
      e.preventDefault();
      drop.classList.add('is-over');
    });
    this.root.addEventListener('dragleave', (e) => e.target.closest?.('[data-drop]')?.classList.remove('is-over'));
    this.root.addEventListener('drop', (e) => {
      const drop = e.target.closest?.('[data-drop]');
      if (!drop) return;
      e.preventDefault();
      drop.classList.remove('is-over');
      this.addFiles(e.dataTransfer.files);
    });
  }

  onField(e) {
    const t = e.target;
    const n = t.name;
    if (!n || t.type === 'file') return;
    const s = this.s;
    const texty = /^(text|search|email|tel|textarea|number)$/.test(t.type) || t.tagName === 'TEXTAREA';
    // Radios und Checkboxen melden „input“ und „change“: nur einmal verarbeiten
    if (!texty && e.type === 'input' && t.tagName !== 'SELECT' && t.type !== 'date') return;

    if (n === 'occasion') {
      this.setOccasion(t.value);
      this.setError(this.q('[data-step="anlass"] input'), this.q(`#${this.id}-err-anlass`), '');
    } else if (n.startsWith('d.')) this.setDetail(n.slice(2), t, e.type);
    else if (n === 'extras') s.extras = this.qa('input[name="extras"]:checked').map((i) => i.value);
    else if (n === 'place') {
      s.place = t.value;
      this.revealPlace();
    } else if (n === 'color' || n === 'light') {
      s[n] = t.value;
      this.updateLook();
    } else if (n in s) {
      s[n] = t.value;
      if (n === 'name' && t.value.trim()) this.setError(t, this.q(`#${this.id}-err-name`), '');
      if (n === 'date') this.checkDate(t, this.q(`#${this.id}-err-date`));
    }
    this.scheduleSummary(texty && e.type === 'input');
  }

  setOccasion(id) {
    if (this.s.occasion === id) return;
    this.s.occasion = id;
    this.renderDetails();
    this.renderExtras();
    this.renderTermin();
    this.updateProgress();
  }

  setDetail(key, el, type) {
    const occ = this.occ();
    const f = occ?.fields.find((x) => x.key === key);
    if (!f) return;
    const d = this.details();
    if (f.type === 'count') {
      const n = parseInt(el.value, 10);
      // Beim Tippen nichts überschreiben, erst beim Verlassen begrenzen
      if (type === 'change' || !Number.isNaN(n)) d[key] = Number.isNaN(n) ? f.def : Math.min(f.max, Math.max(f.min, n));
      if (type === 'change') el.value = d[key];
    } else if (f.type === 'check') {
      const boxes = this.qa(`input[name="d.${key}"]`);
      if (f.exclusive && el.checked) {
        for (const b of boxes) if (el.value === f.exclusive ? b !== el : b.value === f.exclusive) b.checked = false;
      }
      d[key] = boxes.filter((b) => b.checked).map((b) => b.value);
    } else {
      d[key] = el.value;
      if (f.type === 'date') this.checkDate(el, this.q(`#${el.id}-err`));
    }
  }

  stepCount(fid, dir) {
    const input = this.q(`#${fid}`);
    if (!input) return;
    const v = parseInt(input.value, 10) || 0;
    input.value = Math.min(+input.max, Math.max(+input.min, v + dir));
    input.dispatchEvent(new Event('change', { bubbles: true }));
  }

  revealPlace() {
    const field = this.q('[data-place-field]');
    const show = this.s.place === 'location';
    if (field.hidden === !show) return;
    field.hidden = !show;
    if (show && !this.reduced) gsap.from(field, { autoAlpha: 0, y: -6, duration: 0.4, ease: 'power2.out', clearProps: 'all' });
  }

  checkDate(input, err) {
    const bad = input.value && input.value < todayIso();
    this.setError(input, err, bad ? 'Bitte wählen Sie ein Datum ab heute.' : '');
    return !bad;
  }

  addFiles(list) {
    for (const f of list || []) {
      if (!f.type.startsWith('image/')) continue;
      // Nur eine lokale Vorschau-Adresse, die Datei verlässt das Gerät nicht
      this.files.push({ name: f.name, url: URL.createObjectURL(f) });
    }
    this.renderThumbs();
    this.scheduleSummary();
  }

  removeFile(i) {
    const [f] = this.files.splice(i, 1);
    if (f) URL.revokeObjectURL(f.url);
    this.renderThumbs();
    this.scheduleSummary();
    this.q('[data-file]')?.focus();
  }

  // -------------------------------------------------------------------------
  //  Navigation
  // -------------------------------------------------------------------------
  validate(id) {
    if (id === 'anlass' && !this.s.occasion) {
      const first = this.q('input[name="occasion"]');
      this.setError(first, this.q(`#${this.id}-err-anlass`), 'Bitte wählen Sie einen Anlass.');
      first.focus();
      return false;
    }
    if (id === 'details') {
      for (const input of this.qa('[data-details] [data-date]')) {
        if (!this.checkDate(input, this.q(`#${input.id}-err`))) {
          input.focus();
          return false;
        }
      }
    }
    if (id === 'termin') {
      const date = this.q(`#${this.id}-date`);
      if (!this.checkDate(date, this.q(`#${this.id}-err-date`))) {
        date.focus();
        return false;
      }
      const name = this.q(`#${this.id}-name`);
      if (!name.value.trim()) {
        this.setError(name, this.q(`#${this.id}-err-name`), 'Bitte geben Sie Ihren Namen an, damit wir Sie ansprechen können.');
        name.focus();
        return false;
      }
    }
    return true;
  }

  next() {
    if (!this.validate(this.step)) return;
    const ids = this.activeIds();
    const i = ids.indexOf(this.step);
    this.go(i === ids.length - 1 ? 'fertig' : ids[i + 1]);
  }

  prev() {
    const ids = this.activeIds();
    if (this.step === 'fertig') return this.go(ids.at(-1));
    const i = ids.indexOf(this.step);
    if (i > 0) this.go(ids[i - 1]);
  }

  async go(id, { focus = true, scroll = true } = {}) {
    if (id === this.step || !this.panel(id)) return;
    if (this.busy) {
      this.queued = [id, { focus, scroll }];
      return;
    }
    const order = [...this.activeIds(), 'fertig'];
    if (!order.includes(id)) return;
    const dir = order.indexOf(id) >= order.indexOf(this.step) ? 1 : -1;
    const from = this.panel(this.step);
    const to = this.panel(id);
    this.busy = true;
    this.step = id;
    this.visited.add(id);
    if (id === 'fertig') this.renderDone();
    if (id === 'look') this.initPreview();
    this.updateProgress();
    this.updateNav();
    this.renderSummary();
    await this.swap(from, to, dir);
    this.busy = false;
    if (focus) to.querySelector('[data-title]')?.focus({ preventScroll: true });
    if (scroll) this.scrollToTop();
    if (this.queued) {
      const [qid, qo] = this.queued;
      this.queued = null;
      this.go(qid, qo);
    }
  }

  async swap(from, to, dir) {
    if (this.reduced || !from) {
      if (from) from.hidden = true;
      to.hidden = false;
      return;
    }
    const vp = this.viewport;
    const h0 = vp.offsetHeight;
    await gsap.to(from, { autoAlpha: 0, y: -10 * dir, duration: 0.2, ease: 'power2.in' });
    from.hidden = true;
    gsap.set(from, { clearProps: 'opacity,visibility,transform' });
    to.hidden = false;
    const h1 = vp.offsetHeight;
    gsap.fromTo(vp, { height: h0, overflow: 'hidden' }, { height: h1, duration: 0.45, ease: 'power3.out', clearProps: 'height,overflow' });
    const cards = to.querySelectorAll('.planner__choice');
    if (cards.length) gsap.from(cards, { opacity: 0, y: 8, duration: 0.45, stagger: Math.min(0.025, 0.3 / cards.length), ease: 'power2.out', delay: 0.05, clearProps: 'opacity,transform' });
    await gsap.fromTo(to, { autoAlpha: 0, y: 16 * dir }, { autoAlpha: 1, y: 0, duration: 0.5, ease: 'power3.out', clearProps: 'opacity,visibility,transform' });
  }

  // Nach einem Schrittwechsel den Anfang des Planers sichtbar machen (z. B. am Handy nach „Weiter“ unten)
  scrollToTop() {
    const top = this.root.getBoundingClientRect().top;
    if (top >= 0 && top < innerHeight * 0.5) return;
    const lenis = window.lenis;
    if (lenis?.scrollTo) lenis.scrollTo(this.root, { offset: -90, immediate: this.reduced });
    else this.root.scrollIntoView({ behavior: this.reduced ? 'auto' : 'smooth', block: 'start' });
  }

  updateProgress() {
    const steps = this.activeSteps();
    const ids = steps.map((x) => x.id);
    const i = ids.indexOf(this.step);
    const done = this.step === 'fertig';
    this.q('[data-count]').textContent = done ? 'Fertig' : `Schritt ${i + 1} von ${ids.length}`;
    this.q('[data-count-name]').textContent = done ? 'Ihre Nachricht' : steps[i]?.label || '';
    this.q('[data-line]').style.setProperty('--p', done ? 1 : (i + 1) / ids.length);
    this.q('[data-steps]').innerHTML = steps
      .map((st, k) => {
        const cur = st.id === this.step;
        const open = this.visited.has(st.id) && !cur;
        return `<li><button type="button" class="planner__steps-btn${this.visited.has(st.id) ? ' is-visited' : ''}"${cur ? ' aria-current="step"' : ''}${open ? ` data-goto="${st.id}"` : ' disabled'}><span class="planner__steps-no">${k + 1}</span>${st.label}</button></li>`;
      })
      .join('');
  }

  updateNav() {
    const ids = this.activeIds();
    const first = this.step === ids[0];
    const last = this.step === ids.at(-1);
    const done = this.step === 'fertig';
    // Zurück bleibt im Layout (visibility), damit „Weiter“ nicht springt
    this.q('[data-prev]').classList.toggle('is-hidden', first);
    this.q('[data-next]').hidden = done;
    this.q('[data-next-label]').textContent = last ? 'Nachricht erstellen' : 'Weiter';
  }

  // -------------------------------------------------------------------------
  //  Zusammenfassung
  // -------------------------------------------------------------------------
  scheduleSummary(debounce = false) {
    clearTimeout(this.sumTimer);
    if (debounce) this.sumTimer = setTimeout(() => this.renderSummary(), 350);
    else this.renderSummary();
  }

  renderSummary() {
    const list = rows(this.s, this.ctx());
    const box = this.q('[data-sum]');
    const steps = this.activeSteps();
    const groups = new Map([...box.children].map((g) => [g.dataset.g, g]));
    let prevEl = null;
    for (const st of steps) {
      const items = list.filter((r) => r.step === st.id);
      let g = groups.get(st.id);
      groups.delete(st.id);
      if (!items.length) {
        g?.remove();
        continue;
      }
      if (!g) {
        g = document.createElement('div');
        g.className = 'planner__sum-group';
        g.dataset.g = st.id;
        g.innerHTML = `<div class="planner__sum-gh"><span>${st.label}</span><button type="button" class="planner__sum-edit" data-goto="${st.id}">Ändern<span class="sr-only"> (${st.label})</span></button></div><dl></dl>`;
      }
      // Reihenfolge der Gruppen wie die Schritte
      if (prevEl ? prevEl.nextElementSibling !== g : box.firstElementChild !== g) prevEl ? prevEl.after(g) : box.prepend(g);
      prevEl = g;
      g.querySelector('.planner__sum-edit').hidden = st.id === this.step || !this.visited.has(st.id);
      this.syncRows(g.querySelector('dl'), items);
    }
    for (const g of groups.values()) g.remove();

    const n = list.length;
    this.q('[data-sum-n]').textContent = `${n} ${n === 1 ? 'Angabe' : 'Angaben'}`;
    this.q('[data-sum-empty]').hidden = n > 0;
    if (this.step === 'fertig') this.renderDone();
  }

  // Nur geänderte Zeilen anfassen, damit aria-live nicht alles neu vorliest
  syncRows(dl, items) {
    const have = new Map([...dl.children].map((r) => [r.dataset.k, r]));
    let prev = null;
    for (const it of items) {
      let r = have.get(it.key);
      have.delete(it.key);
      if (!r) {
        r = document.createElement('div');
        r.className = 'planner__sum-row';
        r.dataset.k = it.key;
        r.innerHTML = '<dt></dt><dd></dd>';
      }
      if (r.firstChild.textContent !== it.label) r.firstChild.textContent = it.label;
      if (r.lastChild.textContent !== it.value) {
        r.lastChild.textContent = it.value;
        // kurz hervorheben, was sich gerade geändert hat
        r.classList.remove('is-fresh');
        void r.offsetWidth;
        r.classList.add('is-fresh');
      }
      if (prev ? prev.nextElementSibling !== r : dl.firstElementChild !== r) prev ? prev.after(r) : dl.prepend(r);
      prev = r;
    }
    for (const r of have.values()) r.remove();
  }

  toggleSummary() {
    const aside = this.q('[data-aside]');
    const btn = this.q('[data-sum-toggle]');
    const open = !aside.classList.contains('is-open');
    aside.classList.toggle('is-open', open);
    btn.setAttribute('aria-expanded', String(open));
    if (open && !this.reduced) gsap.from(this.q('.planner__sum-body'), { autoAlpha: 0, y: 12, duration: 0.35, ease: 'power2.out', clearProps: 'all' });
  }

  // -------------------------------------------------------------------------
  //  Abschluss
  // -------------------------------------------------------------------------
  text(channel) {
    return message(this.s, this.ctx(), channel);
  }

  renderDone() {
    const primary = hasWa() ? 'wa' : 'mail';
    this.q('[data-msg]').textContent = this.text(primary);
    const subj = subject(this.s, this.occ());
    const mail = this.q('[data-send-mail]');
    if (mail) mail.href = mailLink(subj, this.text('mail'));
    const wa = this.q('[data-send-wa]');
    if (wa) wa.href = waLink(this.text('wa'));
    const attach = this.q('[data-attach]');
    const files = this.relevantFiles();
    const n = files.length;
    attach.hidden = !n;
    if (n) {
      attach.innerHTML = `<ul class="planner__thumbs planner__thumbs--sm">${files.map((f) => `<li class="planner__thumb"><img src="${f.url}" alt="" /></li>`).join('')}</ul>
        <p>${hasWa() ? `Bitte hängen Sie ${n === 1 ? 'das Foto' : 'die Fotos'} im Chat oder in Ihrer E-Mail an.` : `Bitte hängen Sie ${n === 1 ? 'das Foto' : 'die Fotos'} in Ihrem E-Mail-Programm an.`} Aus Datenschutzgründen haben wir ${n === 1 ? 'es' : 'sie'} nicht hochgeladen, ${n === 1 ? 'es liegt' : 'sie liegen'} nur auf Ihrem Gerät.</p>`;
    }
  }

  async copy() {
    const txt = this.text('copy');
    const label = this.q('[data-copy-label]');
    const status = this.q('[data-copy-status]');
    let ok = false;
    try {
      await navigator.clipboard.writeText(txt);
      ok = true;
    } catch {
      // Ältere Browser oder ohne Berechtigung: über ein unsichtbares Textfeld
      const ta = Object.assign(document.createElement('textarea'), { value: txt });
      ta.setAttribute('readonly', '');
      ta.style.cssText = 'position:fixed;opacity:0;pointer-events:none';
      document.body.append(ta);
      ta.select();
      try {
        ok = document.execCommand('copy');
      } catch {
        ok = false;
      }
      ta.remove();
    }
    label.textContent = ok ? 'Kopiert' : 'Kopieren nicht möglich';
    status.textContent = ok ? 'Der Text wurde in die Zwischenablage kopiert.' : 'Kopieren war nicht möglich. Bitte markieren Sie den Text in der Vorschau.';
    this.q('[data-copy]').classList.toggle('is-done', ok);
    clearTimeout(this.copyTimer);
    this.copyTimer = setTimeout(() => {
      label.textContent = 'Text kopieren';
      status.textContent = '';
      this.q('[data-copy]').classList.remove('is-done');
    }, 2600);
  }

  // -------------------------------------------------------------------------
  //  Look: 3D-Lichtvorschau (nachgeladen) oder Beispielfotos
  // -------------------------------------------------------------------------
  mood() {
    return MOODS.includes(this.s.light) ? this.s.light : 'rembrandt';
  }

  updateLook() {
    const mood = this.mood();
    this.stage.dataset.color = this.s.color || 'farbe';
    this.stage.dataset.mood = mood;
    this.q('[data-stage-mood]').textContent = this.s.light === 'beratung' ? `${MOOD_NAME[mood]} (Beispiel)` : MOOD_NAME[mood];
    this.preview?.setMood(mood);
    this.showFallback(mood);
  }

  async initPreview() {
    if (this.previewStarted) return;
    this.previewStarted = true;
    this.updateLook();
    try {
      const { LightPreview } = await import('./LightPreview.js');
      const p = new LightPreview(this.q('[data-canvas]'), { reduced: this.reduced, onLight: (az, el) => this.onLight(az, el), onInteract: () => this.q('[data-stage-hint]')?.classList.add('is-faded') });
      await p.init(this.mood());
      this.preview = p;
      // Wurde während des Ladens die Stimmung gewechselt, jetzt nachziehen
      p.setMood(this.mood());
      this.stage.classList.add('is-ready');
    } catch (err) {
      this.preview = null;
      await this.initFallback();
    }
    // Ladehinweis blendet per CSS aus, danach ganz entfernen
    setTimeout(() => (this.q('[data-stage-loading]').hidden = true), 800);
  }

  // Lichtplan (Draufsicht) und Ansage für Screenreader
  onLight(az, el) {
    const r = 27 * (0.3 + 0.7 * Math.cos((el * Math.PI) / 180));
    const x = Math.sin((az * Math.PI) / 180) * r;
    const y = Math.cos((az * Math.PI) / 180) * r;
    for (const c of this.qa('[data-dial-light], [data-dial-glow]')) {
      c.setAttribute('cx', x.toFixed(2));
      c.setAttribute('cy', y.toFixed(2));
    }
    const beam = this.q('[data-dial-beam]');
    beam.setAttribute('x2', x.toFixed(2));
    beam.setAttribute('y2', y.toFixed(2));
    clearTimeout(this.lightTimer);
    this.lightTimer = setTimeout(() => {
      const side = Math.abs(az) < 8 ? 'von vorn' : az < 0 ? `${Math.round(-az)} Grad von links` : `${Math.round(az)} Grad von rechts`;
      const status = this.q('[data-light-status]');
      if (status) status.textContent = `Hauptlicht ${side}, ${Math.round(el)} Grad ${el >= 0 ? 'erhöht' : 'von unten'}.`;
    }, 500);
  }

  async initFallback() {
    const box = this.q('[data-fallback]');
    this.stage.classList.add('is-fallback');
    try {
      const { default: meta } = await import('../../data/images.json');
      const base = import.meta.env.BASE_URL;
      box.innerHTML = MOODS.map((k) => {
        const ex = lookExamples[k];
        const [dir, slug] = ex.id.split('/');
        return `<figure class="planner__fb" data-fb="${k}">${picture(`${base}img/g/${dir}`, slug, meta.gallery[ex.id], { alt: ex.alt, sizes: '(max-width: 760px) 70vw, 360px' })}<figcaption>Beispiel: ${MOOD_NAME[k]}</figcaption></figure>`;
      }).join('');
    } catch {
      box.innerHTML = '<p class="planner__fb-empty">Die Vorschau ist in diesem Browser leider nicht verfügbar.</p>';
    }
    box.hidden = false;
    this.showFallback(this.mood(), true);
  }

  showFallback(mood, instant = false) {
    const box = this.q('[data-fallback]');
    if (!box || box.hidden) return;
    for (const f of box.querySelectorAll('[data-fb]')) {
      const on = f.dataset.fb === mood;
      f.classList.toggle('is-on', on);
      f.setAttribute('aria-hidden', String(!on));
      if (instant || this.reduced) gsap.set(f, { autoAlpha: on ? 1 : 0 });
      else gsap.to(f, { autoAlpha: on ? 1 : 0, duration: 0.9, ease: 'power2.inOut' });
    }
  }
}
