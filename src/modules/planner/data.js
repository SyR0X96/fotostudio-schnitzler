// ============================================================================
//  Inhalte des Shooting-Planers: Anlässe, Detailfelder, Extras, Schritte.
//  Texte hier ändern, Planner.js baut daraus Formular, Zusammenfassung und Nachricht.
//
//  Feldtypen in `fields`:
//    count  Zahl mit Plus/Minus        { key, label, sum, min, max, def }
//    radio  Einfachauswahl als Karten  { key, label, sum, options: [[wert, text], …] }
//    check  Mehrfachauswahl            { key, label, sum, options, exclusive? }
//    select Auswahlliste               { key, label, sum, options: [text, …] }
//    text   Freitext                   { key, label, sum, placeholder }
//    date   Datum ab heute             { key, label, sum }
//    upload Foto-Vorschau (bleibt auf dem Gerät)
//    fixed  feste Angabe               { label, sum, value }
//    note   Hinweistext                { text }
//  `sum` = kurze Bezeichnung für Zusammenfassung und Nachricht.
// ============================================================================

const people = (label, def = 1, min = 1, max = 20, sum = 'Personen') => ({ key: 'personen', type: 'count', label, sum, min, max, def });

export const OCCASIONS = [
  {
    id: 'bewerbung',
    label: 'Bewerbung / Business',
    hint: 'Bewerbung, Profil, Unternehmen',
    title: 'Ihr <em>Bewerbungsfoto</em>',
    fields: [
      {
        key: 'branche',
        type: 'select',
        label: 'Branche',
        sum: 'Branche',
        options: ['Büro und Verwaltung', 'Handel und Vertrieb', 'Handwerk und Technik', 'IT und Digitales', 'Medizin und Pflege', 'Kreativ und Medien', 'Management und Führung', 'Schauspiel und Kunst', 'Ausbildung und Studium', 'Sonstiges'],
      },
      { key: 'position', type: 'text', label: 'Position oder Branche genauer (optional)', sum: 'Position', placeholder: 'z. B. Steuerfachangestellte' },
      {
        key: 'hintergrund',
        type: 'radio',
        label: 'Hintergrund',
        sum: 'Hintergrund',
        options: [
          ['hell', 'Hell'],
          ['dunkel', 'Dunkel'],
          ['beratung', 'Beraten Sie mich'],
        ],
      },
    ],
  },
  {
    id: 'passbild',
    label: 'Passbild, biometrisch',
    hint: 'Ausweis, Pass, Führerschein',
    title: 'Ihr <em>Passbild</em>',
    intro: 'Biometrisch und passend für Ihr Dokument.',
    fields: [
      {
        key: 'dokument',
        type: 'radio',
        label: 'Für welches Dokument?',
        sum: 'Dokument',
        options: [
          ['ausweis', 'Personalausweis / Reisepass'],
          ['fuehrerschein', 'Führerschein'],
          ['visum', 'Visum / Sonstiges'],
        ],
      },
      people('Für wie viele Personen?', 1, 1, 10),
    ],
  },
  {
    id: 'portrait',
    label: 'Portrait',
    hint: 'Klassisch, gern in Schwarzweiß',
    title: 'Ihr <em>Portrait</em>',
    fields: [people('Wie viele Personen sind auf dem Bild?', 1, 1, 10)],
  },
  {
    id: 'paar',
    label: 'Paar',
    hint: 'Zu zweit vor der Kamera',
    title: 'Zu <em>zweit</em>',
    fields: [
      { type: 'fixed', label: 'Personen auf dem Bild', sum: 'Personen', value: '2' },
      { key: 'anlass', type: 'text', label: 'Gibt es einen besonderen Anlass? (optional)', sum: 'Anlass des Shootings', placeholder: 'z. B. Verlobung, Jahrestag' },
    ],
  },
  {
    id: 'familie',
    label: 'Familie',
    hint: 'Mit allen, die dazugehören',
    title: 'Ihre <em>Familie</em>',
    fields: [
      people('Wie viele Personen sind auf dem Bild?', 3, 2, 30),
      { key: 'alter', type: 'text', label: 'Alter der Kinder (optional)', sum: 'Alter der Kinder', placeholder: 'z. B. 2 und 6 Jahre' },
    ],
  },
  {
    id: 'kinder',
    label: 'Kinder',
    hint: 'Vom Baby bis zum Schulkind',
    title: 'Ihre <em>Kinder</em>',
    fields: [
      people('Wie viele Kinder?', 1, 1, 10, 'Anzahl Kinder'),
      { key: 'alter', type: 'text', label: 'Alter (optional)', sum: 'Alter', placeholder: 'z. B. 8 Monate' },
    ],
  },
  {
    id: 'babybauch',
    label: 'Babybauch',
    hint: 'Die Zeit der Schwangerschaft',
    title: 'Ihr <em>Babybauch</em>',
    fields: [
      {
        key: 'wer',
        type: 'radio',
        label: 'Wer ist auf dem Bild?',
        sum: 'Auf dem Bild',
        options: [
          ['allein', 'Nur ich'],
          ['partner', 'Mit Partnerin oder Partner'],
          ['familie', 'Mit der Familie'],
        ],
      },
      { key: 'et', type: 'date', label: 'Errechneter Geburtstermin (optional)', sum: 'Errechneter Termin' },
    ],
  },
  {
    id: 'hochzeit',
    label: 'Hochzeit',
    hint: 'Portrait und Reportage',
    title: 'Ihr <em>großer Tag</em>',
    termin: { title: 'Wann <em>passt</em> ein Vorgespräch?', date: 'Wunschtermin für ein Vorgespräch' },
    fields: [
      { key: 'datum', type: 'date', label: 'Datum der Hochzeit', sum: 'Hochzeitsdatum' },
      { key: 'ort', type: 'text', label: 'Ort der Hochzeit', sum: 'Ort der Hochzeit', placeholder: 'z. B. Standesamt Hürth' },
      {
        key: 'umfang',
        type: 'check',
        label: 'Was sollen wir fotografieren?',
        sum: 'Umfang',
        options: [
          ['trauung', 'Trauung'],
          ['feier', 'Feier'],
          ['portrait', 'Brautpaar-Portrait'],
        ],
      },
    ],
  },
  {
    id: 'tiere',
    label: 'Tiere',
    hint: 'Allein oder mit Ihnen',
    title: 'Ihr <em>Tier</em>',
    fields: [
      {
        key: 'tier',
        type: 'radio',
        label: 'Welches Tier?',
        sum: 'Tier',
        options: [
          ['hund', 'Hund'],
          ['katze', 'Katze'],
          ['pferd', 'Pferd'],
          ['kleintier', 'Kleintier'],
          ['anderes', 'Anderes'],
        ],
      },
      { key: 'tierinfo', type: 'text', label: 'Name, Rasse oder Tierart (optional)', sum: 'Zum Tier', placeholder: 'z. B. Labrador, 3 Jahre' },
      {
        key: 'mitbild',
        type: 'radio',
        label: 'Sollen Personen mit aufs Bild?',
        sum: 'Personen mit auf dem Bild',
        options: [
          ['ja', 'Ja'],
          ['nein', 'Nein'],
        ],
      },
    ],
  },
  {
    id: 'gruppen',
    label: 'Gruppen / Vereine',
    hint: 'Verein, Team, Jahrgang',
    title: 'Ihre <em>Gruppe</em>',
    fields: [
      people('Wie viele Personen?', 10, 3, 200),
      { key: 'gruppe', type: 'text', label: 'Verein oder Gruppe (optional)', sum: 'Gruppe', placeholder: 'z. B. Karnevalsgesellschaft' },
    ],
  },
  {
    id: 'boudoir',
    label: 'Boudoir',
    hint: 'Diskret und ästhetisch, ab 18',
    title: 'Boudoir, <em>diskret</em>',
    gate: 'boudoir',
    fields: [
      {
        key: 'wer',
        type: 'radio',
        label: 'Allein oder zu zweit?',
        sum: 'Personen',
        options: [
          ['allein', 'Allein'],
          ['paar', 'Als Paar'],
        ],
      },
      { type: 'note', text: 'Diskretion ist für uns selbstverständlich. Alles Weitere besprechen wir gern persönlich.' },
    ],
  },
  {
    id: 'reproduktion',
    label: 'Reproduktion / Retusche alter Fotos',
    hint: 'Alte Bilder neu belebt',
    title: 'Ihre <em>Vorlagen</em>',
    termin: { title: 'Wann <em>bringen</em> Sie die Vorlagen?', date: 'Wunschtermin zum Vorbeibringen' },
    fields: [
      { key: 'anzahl', type: 'count', label: 'Wie viele Vorlagen?', sum: 'Anzahl Vorlagen', min: 1, max: 200, def: 1 },
      {
        key: 'zustand',
        type: 'check',
        label: 'Zustand',
        sum: 'Zustand',
        // „Gut erhalten“ schließt die anderen aus
        exclusive: 'gut',
        options: [
          ['gut', 'Gut erhalten'],
          ['verblasst', 'Verblasst'],
          ['risse', 'Risse / Knicke'],
          ['beschaedigt', 'Stark beschädigt'],
        ],
      },
      { key: 'fotos', type: 'upload', label: 'Foto der Vorlage (optional)', sum: 'Foto' },
    ],
  },
  {
    id: 'gutschein',
    label: 'Gutschein',
    hint: 'Ein Shooting verschenken',
    title: 'Ein <em>Gutschein</em>',
    gate: 'voucher',
    termin: { title: 'Wann <em>holen</em> Sie ihn ab?', date: 'Abholung des Gutscheins' },
    msg: 'Den Wert oder die Leistung würde ich gern persönlich mit Ihnen besprechen.',
    fields: [
      // Optionen füllt Planner.js mit den übrigen Anlässen
      { key: 'fuer', type: 'select', label: 'Für welchen Anlass?', sum: 'Gutschein für', options: 'occasions' },
      { type: 'note', text: 'Wert oder Leistung besprechen wir gern persönlich.' },
    ],
  },
];

// Schritte; `skip` = Anlässe, bei denen der Schritt entfällt
export const STEPS = [
  { id: 'anlass', label: 'Anlass', title: 'Worum <em>geht es?</em>' },
  { id: 'details', label: 'Details', title: 'Ein paar <em>Details</em>' },
  { id: 'ort', label: 'Ort', title: 'Wo soll <em>fotografiert</em> werden?', skip: ['passbild', 'reproduktion', 'gutschein'] },
  { id: 'look', label: 'Look', title: 'Welches <em>Licht</em> passt zu Ihnen?', skip: ['passbild', 'reproduktion', 'gutschein'] },
  { id: 'extras', label: 'Extras', title: 'Darf es <em>etwas mehr</em> sein?' },
  { id: 'termin', label: 'Termin', title: 'Wann <em>passt</em> es Ihnen?' },
];

export const COLORS = [
  ['farbe', 'Farbe', 'Natürlich und lebendig'],
  ['sw', 'Schwarzweiß', 'Zeitlos, unsere Stärke'],
  ['beides', 'Beides', 'Wir zeigen Ihnen beide Varianten'],
];

export const LIGHTS = [
  ['highkey', 'High-Key', 'Hell, weich und freundlich'],
  ['lowkey', 'Low-Key', 'Dunkel, dramatisch, ein Seitenlicht'],
  ['rembrandt', 'Klassisch / Rembrandt', 'Licht von schräg oben, mit Lichtdreieck'],
  ['beratung', 'Beraten Sie mich', 'Wir finden das passende Licht'],
];

// Extras: `msg` steht in der Nachricht hinter „interessiere ich mich für …“
// `only` = nur bei diesen Anlässen, `not` = bei diesen nicht
export const EXTRAS = [
  { id: 'retusche', label: 'Weitere retuschierte Bilder', msg: 'weitere retuschierte Bilder', not: ['passbild'] },
  { id: 'dateien', label: 'Digitale Dateien', msg: 'digitale Dateien' },
  { id: 'abzuege', label: 'Abzüge', msg: 'Abzüge' },
  { id: 'leinwand', label: 'Leinwand auf Keilrahmen', msg: 'eine Leinwand auf Keilrahmen', not: ['passbild'] },
  { id: 'rahmen', label: 'Einrahmung', msg: 'eine Einrahmung', not: ['passbild'] },
  { id: 'album', label: 'Hochzeitsalbum', msg: 'ein Hochzeitsalbum', only: ['hochzeit', 'gutschein'] },
  { id: 'karten', label: 'Danksagungskarten', msg: 'Danksagungskarten', only: ['hochzeit', 'familie', 'kinder', 'babybauch', 'paar', 'gutschein'] },
];

export const DAYTIMES = [
  ['vormittags', 'Vormittags'],
  ['nachmittags', 'Nachmittags'],
  ['flexibel', 'Flexibel'],
];

export const TERMIN_HINT = 'Termine auch außerhalb der Öffnungszeiten und am Wochenende nach Absprache.';
