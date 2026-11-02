// ============================================================================
//  LEISTUNGEN – große Zeilenliste auf der Startseite.
//  Inhalte von der alten Seite (Service, Startseite, Galerien), siehe docs/bestandsaufnahme.md.
//  img: Galerie-id 'ordner/datei' oder 'studio:Datei' oder null (dann ohne Vorschaubild)
//  gallery: Filter, den „Beispiele ansehen“ öffnet; occasion: Vorauswahl im Shooting-Planer
// ============================================================================

export const services = [
  {
    id: 'portrait',
    title: 'Portrait & Schwarzweiß',
    h: 'Portraitfotografie in Hürth',
    text: 'Das exklusive, klassische Portrait im Studio, gern auch in Schwarzweiß. Unsere große Stärke.',
    img: 'portrait/l029',
    gallery: 'portrait',
    occasion: 'portrait',
  },
  {
    id: 'bewerbung',
    title: 'Bewerbungsfotos',
    h: 'Bewerbungsfotos in Hürth',
    text: 'Bewerbungsfotos auf gehobenem Niveau für Privatleute, Schauspieler, Künstler und Unternehmen.',
    img: 'bewerbung/l009',
    gallery: 'bewerbung',
    occasion: 'bewerbung',
  },
  {
    id: 'passbilder',
    title: 'Passbilder',
    h: 'Passbilder in Hürth',
    text: 'Biometrische Passbilder für Ihre Ausweisdokumente, direkt bei uns im Studio.',
    img: 'passbilder/l004',
    gallery: 'passbilder',
    occasion: 'passbild',
  },
  {
    id: 'hochzeit',
    title: 'Hochzeit',
    h: 'Hochzeitsfotos in Hürth und Umgebung',
    text: 'Brautpaar-Portraits und Reportagen vom großen Tag, auf Wunsch im individuell gestalteten Hochzeitsalbum.',
    img: 'hochzeit-portrait/l015',
    gallery: 'hochzeit',
    occasion: 'hochzeit',
  },
  {
    id: 'familie',
    title: 'Familie & Kinder',
    h: 'Familien- und Kinderfotos in Hürth',
    text: 'Shootings mit der ganzen Familie, mit Kindern und Babys, entspannt und mit viel Zeit.',
    img: 'familie/l005',
    gallery: 'familie',
    occasion: 'familie',
  },
  {
    id: 'schwanger',
    title: 'Babybauch',
    h: 'Babybauch-Fotos in Hürth',
    text: 'Die Zeit der Schwangerschaft, festgehalten in ruhigem, klassischem Licht.',
    img: 'schwanger/l003',
    gallery: 'schwanger',
    occasion: 'babybauch',
  },
  {
    id: 'tiere',
    title: 'Tiere',
    h: 'Tierfotos im Studio',
    text: 'Ihr Liebling im Studio, allein oder gemeinsam mit Ihnen.',
    img: 'tiere/l002',
    gallery: 'tiere',
    occasion: 'tiere',
  },
  {
    id: 'gruppen',
    title: 'Gruppen & Vereine',
    h: 'Gruppen- und Vereinsfotos',
    text: 'Vereine, Mannschaften und Gruppen, im Studio oder vor Ort.',
    img: 'gruppen-vereine/l005',
    gallery: 'gruppen-vereine',
    occasion: 'gruppen',
  },
  {
    id: 'reportage',
    title: 'Reportagen vor Ort',
    h: 'Reportagen am Ort Ihrer Wahl',
    text: 'Wir kommen zu Ihnen und begleiten Ihren Anlass mit der Kamera, am Ort Ihrer Wahl.',
    img: 'hochzeit-reportage-2/l005',
    gallery: 'hochzeit',
    occasion: 'hochzeit',
  },
  {
    id: 'reproduktion',
    title: 'Reproduktion & Retusche',
    h: 'Alte Fotos reproduzieren und retuschieren',
    text: 'Reproduktionen alter Fotos, sorgfältige Retusche und Bildveredelung.',
    img: null,
    anchor: '#retusche',
    occasion: 'reproduktion',
  },
  {
    id: 'veredelung',
    title: 'Leinwand & Rahmen',
    h: 'Leinenfotos auf Keilrahmen und Einrahmungen',
    text: 'Leinenfotos auf Keilrahmen und Einrahmungen, damit Ihre Bilder an die Wand kommen.',
    img: 'studio:Studio-Verkauf',
    anchor: '#studio',
  },
  {
    id: 'danksagung',
    title: 'Danksagungen & Alben',
    h: 'Danksagungen mit Foto und Hochzeitsalben',
    text: 'Danksagungen mit Foto und individuell gestaltete Hochzeitsalben.',
    img: 'studio:Studio-vorne',
    anchor: '#studio',
    occasion: 'hochzeit',
  },
];

// Vorformulierte Nachricht je Leistung (WhatsApp und E-Mail)
export const serviceMessage = (s) => `Guten Tag, ich interessiere mich für „${s.title}“ und hätte gern einen Termin bzw. eine Beratung.`;
