// ============================================================================
//  GALERIE – Kategorien, Auswahl für Hero, Showcase und Leistungen.
//  Die Bilder selbst (Maße, Schwarzweiß-Erkennung) stehen in src/data/images.json,
//  erzeugt von `npm run images` aus quelle/fotos/<ordner>/.
//  Neues Foto: Datei nach quelle/fotos/<ordner>/ legen, `npm run images`, fertig.
// ============================================================================

// Reihenfolge = Reihenfolge der Filter. `folders` = Ordner unter quelle/fotos/, `old` = URL der alten Seite.
export const categories = [
  { id: 'portrait', label: 'Portrait', folders: ['portrait'], old: ['/portrait'], noun: 'Portrait' },
  { id: 'bewerbung', label: 'Bewerbung', folders: ['bewerbung'], old: ['/bewerbung'], noun: 'Bewerbungsfoto' },
  { id: 'passbilder', label: 'Passbilder', folders: ['passbilder'], old: ['/passbilder'], noun: 'Passbild' },
  { id: 'familie', label: 'Familie', folders: ['familie'], old: ['/familie'], noun: 'Familienfoto' },
  { id: 'kinder', label: 'Kinder', folders: ['kinder'], old: ['/kinder'], noun: 'Kinderfoto' },
  { id: 'schwanger', label: 'Babybauch', folders: ['schwanger'], old: ['/schwanger'], noun: 'Babybauch-Foto' },
  {
    id: 'hochzeit',
    label: 'Hochzeit',
    noun: 'Hochzeitsfoto',
    subs: [
      { id: 'hochzeit-portrait', label: 'Brautpaar-Portrait', folder: 'hochzeit-portrait', old: '/hochzeits-portrait' },
      { id: 'hochzeit-reportage-1', label: 'Reportage I', folder: 'hochzeit-reportage-1', old: '/hochzeits-reportage1' },
      { id: 'hochzeit-reportage-2', label: 'Reportage II', folder: 'hochzeit-reportage-2', old: '/hochzeits-reportage-2' },
      { id: 'hochzeit-reportage-3', label: 'Reportage III', folder: 'hochzeit-reportage-3', old: '/hochzeits-reportage-3' },
    ],
  },
  { id: 'gruppen-vereine', label: 'Gruppen & Vereine', folders: ['gruppen-vereine'], old: ['/gruppen-und-vereine'], noun: 'Gruppenfoto' },
  { id: 'tiere', label: 'Tiere', folders: ['tiere'], old: ['/tiere'], noun: 'Tierfoto' },
  // Sensibel: nie im Hero, Showcase, OG-Bild oder in „Alle“. Nur hinter dem Hinweis-Klick (ab 18).
  { id: 'boudoir', label: 'Boudoir / Akt', folders: ['erotik'], old: ['/erotik'], noun: 'Boudoir-Foto', gated: true },
];

// Ordner → Kategorie (und Unterkategorie bei Hochzeit)
export const folderInfo = (folder) => {
  for (const c of categories) {
    if (c.folders?.includes(folder)) return { cat: c, sub: null };
    const s = c.subs?.find((x) => x.folder === folder);
    if (s) return { cat: c, sub: s };
  }
  return null;
};

// Hero „Ins rechte Licht gerückt“: Low-Key-Portrait, das erst im Licht sichtbar wird.
// Quelle nur 220×306 px – Original beim Kunden angefragt (docs/bestandsaufnahme.md).
export const hero = { id: 'portrait/l006', alt: 'Schwarzweiß-Portrait einer Frau im Profil, die aus dem Dunkel ins Licht tritt' };

// Showcase-Filmstreifen (Reihenfolge = Bildzähler). Nur ausdrucksstarke Studioarbeiten, keine Boudoir-Bilder.
export const showcase = [
  { id: 'portrait/l014', alt: 'Schwarzweiß-Portrait einer Frau mit Perlenkette in hellem, weichem Licht' },
  { id: 'kinder/l014', alt: 'Baby schaut aus dem Dunkel in die Kamera, Schwarzweiß' },
  { id: 'bewerbung/l002', alt: 'Bewerbungsportrait eines Mannes mit Locken und Brille, Schwarzweiß' },
  { id: 'schwanger/l000', alt: 'Silhouette eines Babybauchs im Low-Key-Licht' },
  { id: 'hochzeit-portrait/l019', alt: 'Brautpaar in enger Umarmung, Schwarzweiß' },
  { id: 'familie/l009', alt: 'Eltern mit Baby vor dunklem Hintergrund, Schwarzweiß' },
  { id: 'portrait/l005', alt: 'Boxer in Kampfhaltung, Schwarzweiß-Studioportrait' },
  { id: 'tiere/l005', alt: 'Schwarze Katze im Profil vor hellem Hintergrund' },
  { id: 'portrait/l020', alt: 'Männerportrait im Halbschatten, Low-Key in Schwarzweiß' },
  { id: 'kinder/l025', alt: 'Neugeborenes an der Wange der Mutter, Schwarzweiß' },
  { id: 'bewerbung/l004', alt: 'Business-Portrait eines Mannes im Anzug, Schwarzweiß' },
  { id: 'schwanger/l005', alt: 'Babybauch im Streiflicht vor schwarzem Hintergrund' },
];

// Beispielfotos für die Lichtstimmungen im Planer (Fallback ohne WebGL)
export const lookExamples = {
  highkey: { id: 'portrait/l008', alt: 'High-Key: Frau liegt vor hellem, weißem Hintergrund' },
  lowkey: { id: 'portrait/l006', alt: 'Low-Key: Frau im Profil vor schwarzem Hintergrund' },
  rembrandt: { id: 'portrait/l003', alt: 'Klassisches Licht: Frau im Profil mit weichem Seitenlicht' },
};

// Studio-Fotos (quelle/fotos/studio/, 650×469 mit Schriftzug – neue Fotos angefragt)
export const studioPhotos = {
  raum: { file: 'Studioraum', alt: 'Der Studioraum mit Softboxen, Hintergründen und Requisiten' },
  verkauf: { file: 'Studio-Verkauf', alt: 'Beratungsbereich mit gerahmten Portraits und Leinwänden an den Wänden' },
  vorne: { file: 'Studio-vorne', alt: 'Empfang mit Theke, Bilderrahmen, Alben und Vitrine' },
};
