// ============================================================================
//  ZENTRALE KONFIGURATION – hier alle Kontaktdaten und Schalter pflegen.
//  Änderungen wirken überall: HTML (über vite.config.js), Buttons, Planer,
//  Impressum, JSON-LD. Leere Felder blenden den zugehörigen Teil der Seite aus.
//  Quelle der Angaben: alte Seite, siehe docs/bestandsaufnahme.md
// ============================================================================

export const site = {
  name: 'Fotostudio Schnitzler',
  short: 'Foto Schnitzler',
  url: 'https://fotostudio-schnitzler.de',

  // Vorschau-Schalter: true = noindex (Meta-Tag + robots.txt sperrt alles).
  // Für den Livegang auf der echten Domain auf false stellen.
  // Lässt sich beim Build auch per Umgebungsvariable überschreiben: NOINDEX=0 npm run build
  noindex: true,

  // WhatsApp: nur Ziffern, mit Ländervorwahl, ohne + und ohne 0 (0171 2345678 → '491712345678').
  // Leer = alle WhatsApp-Buttons sind ausgeblendet, Anfragen laufen über E-Mail und Telefon.
  // OFFEN: Nummer steht nicht auf der alten Seite (Frage an den Kunden).
  whatsapp: '',

  // Telefon und E-Mail: aus Impressum und Schild der alten Seite (E-Mail bitte bestätigen)
  phone: '02233 33371',
  phoneIntl: '+49 2233 33371',
  fax: '02233 933692',
  email: 'foto-schnitzler@web.de',

  // Optional: Link zu den Google-Bewertungen (leer = Button ausgeblendet)
  googleReviews: '',

  address: {
    street: 'Bergmannstraße 76',
    zip: '50354',
    city: 'Hürth',
    district: 'Gleuel',
  },

  // Kartenposition (OpenStreetMap, lädt erst nach Klick): OSM-Eintrag „Fotostudio-Schnitzler“ (Node 11595344333)
  geo: { lat: 50.88653, lon: 6.83917 },

  // Öffnungszeiten vom Schild auf der alten Kontaktseite (bitte bestätigen).
  // Wochentage: 0 = Sonntag … 6 = Samstag. Mehrere Zeitfenster pro Tag möglich. null = geschlossen.
  // Leeres Objekt {} = Öffnungszeiten und Live-Status werden ausgeblendet.
  hours: {
    1: null,
    2: [['10:00', '12:00'], ['15:00', '18:00']],
    3: [['10:00', '12:00'], ['15:00', '18:00']],
    4: [['10:00', '13:00']],
    5: [['10:00', '12:00'], ['15:00', '18:00']],
    6: null,
    0: null,
  },
  hoursNote: 'Innerhalb und außerhalb dieser Zeiten sind wir nach Terminabsprache gerne für Sie da, auch am Wochenende.',

  // Preise: nur eintragen, wenn der Kunde sie liefert. Leer = keine Preise auf der Seite.
  // Schlüssel = Anlass-id aus dem Shooting-Planer (z. B. passbild: 'ab 15 €').
  prices: {},

  // Gutschein-Abschnitt und Anlass „Gutschein“ im Planer (bitte beim Kunden bestätigen)
  voucher: true,

  // Erotik-Galerie der alten Seite als „Boudoir / Akt“ hinter einem Hinweis-Klick (ab 18).
  // false = Kategorie komplett von der Seite nehmen. OFFEN: Will der Kunde sie überhaupt?
  boudoir: true,

  // Impressum (Angaben der alten Seite, rechtlich prüfen lassen)
  legal: {
    company: 'Fotostudio Schnitzler',
    owner: 'Aenni Müllenmeister',
    title: 'Fotografenmeisterin',
    // So auf der alten Seite. Hat 10 statt 9 Ziffern, bitte prüfen.
    vatId: 'DE 2218338861',
  },
};

// Echte Bewertungen (Text, Name, Sterne, Quelle). Leer = Bewertungsbereich ausgeblendet.
export const reviews = [];

// Vorher/Nachher-Paare für Retusche und Reproduktion: { title, before, after, w, h }
// before/after = Dateiname unter public/img/vorher-nachher/ (ohne Endung, wie bei npm run images erzeugt).
// Leer = der Slider zeigt einen klar beschrifteten Platzhalter.
export const beforeAfter = [];

// ---------------------------------------------------------------------------
//  Hilfsfunktionen
// ---------------------------------------------------------------------------

export const hasWa = () => Boolean(site.whatsapp);

export const waLink = (text = '') =>
  site.whatsapp ? `https://wa.me/${site.whatsapp}${text ? `?text=${encodeURIComponent(text)}` : ''}` : '';

export const telLink = () => `tel:${site.phoneIntl.replace(/[^\d+]/g, '')}`;

export const mailLink = (subject = '', body = '') => {
  const q = new URLSearchParams();
  if (subject) q.set('subject', subject);
  if (body) q.set('body', body);
  const qs = q.toString().replace(/\+/g, '%20');
  return `mailto:${site.email}${qs ? `?${qs}` : ''}`;
};

export const mapsLink = () =>
  `https://www.openstreetmap.org/?mlat=${site.geo.lat}&mlon=${site.geo.lon}#map=18/${site.geo.lat}/${site.geo.lon}`;

export const fullAddress = () => `${site.address.street}, ${site.address.zip} ${site.address.city}-${site.address.district}`;

export const hasHours = () => Object.values(site.hours).some(Boolean);
