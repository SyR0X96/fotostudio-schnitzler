// Zusammenfassung und vorformulierte Nachricht aus dem Zustand des Planers.
// Reine Funktionen ohne DOM, damit Text und Zusammenfassung immer gleich sind.
import { COLORS, LIGHTS, EXTRAS } from './data.js';

const label = (list, v) => list.find((x) => x[0] === v)?.[1] ?? '';

// „a, b und c“
export const joinDe = (arr) => (arr.length < 2 ? arr.join('') : `${arr.slice(0, -1).join(', ')} und ${arr.at(-1)}`);

export const todayIso = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

export const fmtDate = (iso) => {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso || '');
  if (!m) return '';
  return new Date(+m[1], +m[2] - 1, +m[3]).toLocaleDateString('de-DE', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
};

const fmtShortDate = (iso) => {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso || '');
  if (!m) return '';
  return new Date(+m[1], +m[2] - 1, +m[3]).toLocaleDateString('de-DE', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
};

export const extrasFor = (occId) => EXTRAS.filter((e) => (!e.only || e.only.includes(occId)) && !e.not?.includes(occId));

// Wert eines Detailfelds als Text (leer = nicht angegeben)
export function fieldText(f, v, { short = false, files = 0 } = {}) {
  switch (f.type) {
    case 'fixed':
      return f.value;
    case 'count':
      return v ? String(v) : '';
    case 'radio':
      return label(f.options, v);
    case 'check':
      return joinDe((v || []).map((x) => label(f.options, x)).filter(Boolean));
    case 'date':
      return short ? fmtShortDate(v) : fmtDate(v);
    case 'upload':
      return files ? `${files} ${files === 1 ? 'Foto' : 'Fotos'} ausgewählt` : '';
    default:
      return (v || '').trim();
  }
}

function terminText(s, short) {
  const date = short ? fmtShortDate(s.date) : fmtDate(s.date);
  const dt = s.daytime;
  if (date) return dt === 'flexibel' ? `${date}, zeitlich flexibel` : dt ? `${date}, ${dt}` : date;
  if (dt === 'flexibel') return 'zeitlich flexibel';
  if (dt) return `gern ${dt}`;
  return '';
}

// Zeilen für Zusammenfassung und Nachricht: { step, key, label, value, msg? }
export function rows(s, { occ, steps, files = 0, occasions = [] }) {
  const out = [];
  const add = (step, key, lab, value, msg) => value && out.push({ step, key, label: lab, value, msg });
  if (!occ) return out;

  add('anlass', 'anlass', 'Anlass', occ.label);

  const d = s.details[occ.id] || {};
  for (const f of occ.fields) {
    if (f.type === 'note') continue;
    let v = fieldText(f, d[f.key], { short: true, files });
    if (f.type === 'select' && f.options === 'occasions') v = occasions.find((o) => o.id === d[f.key])?.label ?? (d[f.key] === 'offen' ? 'Noch offen' : '');
    const msg = f.type === 'date' ? fieldText(f, d[f.key]) : undefined;
    add('details', `d-${f.key || f.sum}`, f.sum, v, msg);
  }

  if (steps.includes('ort')) {
    if (s.place === 'studio') add('ort', 'ort', 'Ort', 'Im Studio', 'bei Ihnen im Studio');
    if (s.place === 'location') {
      const t = s.placeText.trim();
      add('ort', 'ort', 'Ort', t ? `Location: ${t}` : 'Location, noch offen', t ? `an einer Location (${t})` : 'an einer Location, der Ort ist noch offen');
    }
  }

  if (steps.includes('look')) {
    const c = label(COLORS, s.color);
    add('look', 'farbe', 'Bildwirkung', c === 'Beides' ? 'Farbe und Schwarzweiß' : c);
    const l = label(LIGHTS, s.light);
    add('look', 'licht', 'Lichtstimmung', s.light === 'beratung' ? 'Beratung gewünscht' : l, s.light === 'beratung' ? 'Ich lasse mich gern beraten.' : undefined);
  }

  const ex = extrasFor(occ.id).filter((e) => s.extras.includes(e.id));
  add('extras', 'extras', 'Interesse an', ex.map((e) => e.label).join(', '), joinDe(ex.map((e) => e.msg)));

  const tl = occ.termin?.date || 'Wunschtermin';
  add('termin', 'termin', tl, terminText(s, true), terminText(s, false));
  add('termin', 'name', 'Name', s.name.trim());
  const note = s.note.trim();
  add('termin', 'note', 'Nachricht', note.length > 70 ? `${note.slice(0, 68).trim()} …` : note, note);
  return out;
}

const INTRO = {
  passbild: 'ich möchte gern Passbilder bei Ihnen machen lassen. Hier meine Angaben aus dem Shooting-Planer auf Ihrer Website:',
  reproduktion: 'ich interessiere mich für eine Reproduktion bzw. Retusche alter Fotos. Hier meine Angaben aus dem Shooting-Planer auf Ihrer Website:',
  gutschein: 'ich interessiere mich für einen Gutschein. Hier meine Angaben aus dem Shooting-Planer auf Ihrer Website:',
};

// channel: 'wa' | 'mail' | 'copy' (nur der Hinweis zum Foto unterscheidet sich)
export function message(s, ctx, channel = 'copy') {
  const list = rows(s, ctx);
  const occ = ctx.occ;
  const lines = ['Guten Tag,', ''];
  lines.push(occ ? INTRO[occ.id] || 'ich interessiere mich für ein Shooting bei Ihnen und habe meine Wünsche im Shooting-Planer auf Ihrer Website zusammengestellt:' : 'ich interessiere mich für ein Shooting bei Ihnen.');
  const facts = list.filter((r) => !['name', 'note', 'extras', 'd-fotos'].includes(r.key));
  if (facts.length) {
    lines.push('');
    for (const r of facts) lines.push(`${r.label}: ${r.msg ?? r.value}`);
  }
  const extras = list.find((r) => r.key === 'extras');
  if (extras) lines.push('', `Außerdem interessiere ich mich für ${extras.msg}.`);
  if (occ?.msg) lines.push('', occ.msg);
  const note = list.find((r) => r.key === 'note');
  if (note) lines.push('', note.msg);
  if (ctx.files) {
    const what = ctx.files === 1 ? 'Ein Foto der Vorlage' : 'Fotos der Vorlagen';
    const where = channel === 'mail' ? 'hänge ich dieser E-Mail an' : channel === 'wa' ? 'sende ich Ihnen hier im Chat mit' : 'sende ich Ihnen mit';
    lines.push('', `${what} ${where}.`);
  }
  lines.push('', 'Ich freue mich auf Ihre Rückmeldung.', '', 'Mit freundlichen Grüßen');
  lines.push(s.name.trim() || '[Ihr Name]');
  return lines.join('\n');
}

export function subject(s, occ) {
  const name = s.name.trim();
  const base = !occ ? 'Anfrage über den Shooting-Planer' : occ.id === 'gutschein' ? 'Anfrage Gutschein' : occ.id === 'reproduktion' ? 'Anfrage Reproduktion / Retusche' : occ.id === 'passbild' ? 'Anfrage Passbilder' : `Shooting-Anfrage: ${occ.label}`;
  return name ? `${base} (${name})` : base;
}
