# Fotostudio Schnitzler, Hinweise für Claude

## Veröffentlichen (immer so vorgehen)

- Änderungen **immer direkt auf `main` committen und pushen** (`git push origin HEAD:main`), keine Feature-Branches oder Pull Requests, außer es wird ausdrücklich verlangt. Commit-Messages auf Deutsch.
- Der Push auf `main` startet den Workflow „Deploy to GitHub Pages“ (`.github/workflows/pages.yml`): Build, Upload, Ausrollen, Live-Check über `version.txt`.
- **Nach jedem Push prüfen, ob das Deployment erfolgreich war** (inklusive Schritt „Live-Check“), und erst dann den Link weitergeben.
- Vorschau: https://syr0x96.github.io/fotostudio-schnitzler/ (noindex, solange `site.noindex` in `src/config.js` auf `true` steht).
- Umzug auf den IONOS-VPS erst, wenn ausdrücklich „Kunde hat freigegeben“ gesagt wird. Ablauf: README, Abschnitt „Umzug auf den Server“.

## Vor dem Push

- `npm run build` muss fehlerfrei durchlaufen.
- Sichtbare Änderungen kurz prüfen (`npm run preview`), bei größeren Änderungen Screenshots Desktop 1440 px und Handy 390 px, Konsole ohne Fehler.

## Inhalte

- **Keine Fakten erfinden.** Preise, Bewertungen, Jahreszahlen, Kundenzahlen, Öffnungszeiten und Telefonnummern nur, wenn sie vom Kunden oder von der alten Seite kommen (`docs/bestandsaufnahme.md`). Fehlendes ist ein leeres Feld in `src/config.js`, der Abschnitt bleibt dann ausgeblendet.
- Boudoir-/Erotik-Bilder nie im Hero, im Showcase, im OG-Bild oder in der Galerie-Ansicht „Alle“.
- Neue Bilder: Original nach `quelle/fotos/<ordner>/`, dann `npm run images`. Nichts künstlich hochskalieren.
