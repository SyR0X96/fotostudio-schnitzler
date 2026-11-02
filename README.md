# Fotostudio Schnitzler, Website

Neue Website für das Fotostudio Schnitzler in Hürth-Gleuel (bisher Joomla/YOOtheme unter fotostudio-schnitzler.de).
One-Pager mit WebGL-Hero „Ins rechte Licht gerückt“, Filmstreifen-Showcase, Galerie als Abzüge im Passepartout, Shooting-Planer mit 3D-Lichtvorschau und Hell-/Dunkelmodus.
Gebaut mit Vite, Three.js, GSAP + ScrollTrigger und Lenis. Das Ergebnis ist eine statische Seite (`base: './'`).

- **Vorschau:** https://syr0x96.github.io/fotostudio-schnitzler/ (noindex)
- **Bestandsaufnahme der alten Seite, Textfreigabe, offene Fragen:** [`docs/bestandsaufnahme.md`](docs/bestandsaufnahme.md)

## Vor dem Livegang ausfüllen

Alle Angaben stehen zentral in **`src/config.js`**. Leere Felder blenden den zugehörigen Teil der Seite aus.

| Feld | Stand |
|---|---|
| `whatsapp` | leer, das Studio hat kein WhatsApp (Antwort vom 02.11.2026). Anfragen laufen über E-Mail und Telefon. Käme später eine Nummer dazu (`49…` ohne `+` und ohne führende 0), würde WhatsApp überall zum Hauptweg. |
| `phone`, `fax` | von der alten Seite (Impressum und Schild) |
| `email` | vom Schild der Kontaktseite, am 02.11.2026 bestätigt |
| `hours`, `hoursNote` | vom Schild, bitte bestätigen. Leeres Objekt `{}` blendet Öffnungszeiten und Live-Status aus. |
| `prices` | leer lassen: Auf die Seite sollen keine Preise (Antwort vom 02.11.2026) |
| `voucher` | Gutschein-Abschnitt und Anlass „Gutschein“, bitte beim Kunden bestätigen |
| `boudoir` | Erotik-Galerie als „Boudoir / Akt“ hinter Hinweis-Klick, bleibt laut Antwort vom 02.11.2026. `false` nimmt sie komplett heraus. |
| `googleReviews`, `reviews` | leer = kein Bewertungsbereich. Nur echte Bewertungen eintragen. |
| `beforeAfter` | leer = beschrifteter Platzhalter im Vorher/Nachher-Slider. Beispielpaare kommen vom Kunden. |
| `legal.*` | Impressumsangaben der alten Seite. Die USt-IdNr hat 10 statt 9 Ziffern, bitte prüfen. |
| `noindex` | `true` = Vorschau (Meta-Tag `noindex` in allen Seiten plus robots.txt mit `Disallow: /`). Für den Livegang `false`. Hinweis: Wirksam ist auf GitHub Pages vor allem das Meta-Tag, denn eine robots.txt unter `/fotostudio-schnitzler/` lesen Suchmaschinen nicht (sie gilt nur im Host-Root). |

Impressum und Datenschutz (`impressum.html`, `datenschutz.html`) sind an die neue Technik angepasst und am 02.11.2026 freigegeben. Beim Umzug auf den VPS muss Abschnitt 3 (Hosting) auf IONOS umgestellt werden.

## Befehle

```bash
npm install
npm run dev       # Entwicklungsserver auf http://localhost:5173
npm run build     # fertige Seite nach dist/ (inkl. robots.txt, sitemap.xml, version.txt)
npm run preview   # dist/ lokal ansehen
npm run images    # Bilder aus quelle/ neu optimieren (AVIF + WebP, mehrere Breiten)
npm run bestand   # alte Seite erneut komplett herunterladen (Texte, Fotos, manifest.json)
```

Build-Variable: `NOINDEX=0 npm run build` bzw. `NOINDEX=1` überschreibt `site.noindex`.

## Aufbau

```
index.html                   Startseite (alle Texte; Listen kommen beim Build aus src/data)
impressum.html, datenschutz.html
vite.config.js               ersetzt {{platzhalter}} und <!-- @BLOCK --> im HTML: Leistungen, Galerie,
                             Filmstreifen, Öffnungszeiten, JSON-LD, robots.txt, sitemap.xml, version.txt
src/config.js                Kontaktdaten, Öffnungszeiten, Schalter
src/data/gallery.js          Kategorien, Auswahl für Hero, Showcase, Lichtbeispiele, Studiofotos
src/data/services.js         Leistungen (Zeilenliste)
src/data/images.json         Maße, Breiten, Schwarzweiß-Erkennung (von npm run images)
src/main.js                  Scroll, Preloader, Reveals, Galerie, Lightbox, Cursor
src/modules/iris.js          Kamerablende (Preloader und Übergang aus dem Hero)
src/modules/hero/            WebGL-Hero (Licht, Staub, Bokeh, Korn), lädt nach
src/modules/planner/         Shooting-Planer, 3D-Lichtvorschau mit Büste (lädt nach)
src/styles/                  base.css (Farben hell/dunkel, Buttons, Felder), main.css, planner.css, legal.css
scripts/bestand-holen.mjs    Crawler für die alte Seite
scripts/optimize-images.mjs  sharp-Pipeline, Favicons, OG-Bild, Büste
quelle/                      Originale: fotos/<kategorie>/, texte/, modelle/, manifest.json
public/                      optimierte Bilder, Modell, Favicons
```

Alle Inhalte stehen auch ohne JavaScript im HTML. Die Galerie-Filter funktionieren dann über CSS (`:has`).

## Inhalte pflegen

- **Texte:** direkt in `index.html`; Leistungen in `src/data/services.js`.
- **Galerie:** Foto nach `quelle/fotos/<ordner>/` legen (Ordner siehe `src/data/gallery.js`), `npm run images`, fertig. Schwarzweiß wird automatisch erkannt.
- **Bessere Originale:** Datei gleichen Namens in `quelle/fotos/<ordner>/` ersetzen und `npm run images`. Die Pipeline erzeugt dann automatisch große Varianten (480/960/1600 px Galerie, bis 2400 px Hero), skaliert aber nie hoch. Welche Bilder am dringendsten fehlen: `docs/bestandsaufnahme.md`, Abschnitt 7.
- **Hero-Bild:** `hero` in `src/data/gallery.js`.
- **Vorher/Nachher:** Paare nach `public/img/vorher-nachher/` (`<name>-<breite>.webp` und `.avif`), dann in `beforeAfter` in `src/config.js` eintragen.

## Vorschau auf GitHub Pages

Jeder Push auf `main` baut die Seite und stellt sie über den Workflow „Deploy to GitHub Pages“ bereit. Am Ende prüft der Workflow, ob `https://syr0x96.github.io/fotostudio-schnitzler/version.txt` den neuen Commit liefert.

Einmalig: **Settings → Pages → Build and deployment → Source: „GitHub Actions“**. Im Gratis-Plan muss das Repository dafür öffentlich sein.

## Umzug auf den Server (erst nach Freigabe durch den Kunden)

Ziel ist derselbe IONOS-VPS wie bei Chicago Ink; nginx bedient dort mehrere Seiten. Vorgehen, sobald „Kunde hat freigegeben“:

1. **Deploy-Dateien übernehmen** aus `SyR0X96/chicago-ink`: `deploy/server-setup.sh`, `deploy/deploy.sh`, `deploy/ci-ssh.sh` und `.github/workflows/deploy.yml` („Deploy to VPS“). Anpassen auf
   - Deploy-Benutzer `schnitzler-deploy`, Pfad `/var/www/fotostudio-schnitzler` (Releases unter `releases/`, Symlink `current`, letzte 5 Versionen bleiben)
   - eigene Secrets in diesem Repo: `VPS_HOST`, `VPS_PORT`, `VPS_USER`, `VPS_KNOWN_HOSTS`, `VPS_SSH_KEY`, `SITE_URL`
   - Live-Check über `version.txt` wie bisher
2. **noindex aus:** `site.noindex = false` in `src/config.js` (robots.txt erlaubt dann alles und nennt die Sitemap).
3. **DNS:** A-Einträge für `fotostudio-schnitzler.de` und `www` auf die IP des VPS. Vorher die bestehenden DNS-Einträge sichern (die E-Mail-Adresse läuft über web.de und ist nicht betroffen, andere Einträge prüfen).
4. **HTTPS:** `DOMAIN=fotostudio-schnitzler.de EMAIL=… bash server-setup.sh` richtet Let's Encrypt für Domain und `www` ein.
5. **301-Weiterleitungen** der alten Joomla-URLs in den nginx-Serverblock (Query wie `?start=20` wird ignoriert, Ziel gleich):
   ```nginx
   location = /service               { return 301 /#leistungen; }
   location = /studio                { return 301 /#studio; }
   location = /kontakt               { return 301 /#kontakt; }
   location = /impressum             { return 301 /impressum.html; }
   location = /datenschutz           { return 301 /datenschutz.html; }
   location = /portrait              { return 301 /?galerie=portrait#galerie; }
   location = /bewerbung             { return 301 /?galerie=bewerbung#galerie; }
   location = /passbilder            { return 301 /?galerie=passbilder#galerie; }
   location = /familie               { return 301 /?galerie=familie#galerie; }
   location = /kinder                { return 301 /?galerie=kinder#galerie; }
   location = /schwanger             { return 301 /?galerie=schwanger#galerie; }
   location = /hochzeits-portrait    { return 301 /?galerie=hochzeit-portrait#galerie; }
   location = /hochzeits-reportage1  { return 301 /?galerie=hochzeit-reportage-1#galerie; }
   location = /hochzeits-reportage-2 { return 301 /?galerie=hochzeit-reportage-2#galerie; }
   location = /hochzeits-reportage-3 { return 301 /?galerie=hochzeit-reportage-3#galerie; }
   location = /gruppen-und-vereine   { return 301 /?galerie=gruppen-vereine#galerie; }
   location = /tiere                 { return 301 /?galerie=tiere#galerie; }
   location = /erotik                { return 301 /?galerie=boudoir#galerie; }   # nur, wenn die Galerie bleibt, sonst /#galerie
   location = /index.php             { return 301 /; }
   ```
6. **Datenschutz** Abschnitt 3 auf IONOS umstellen (IONOS SE, Elgendorfer Str. 57, 56410 Montabaur; Server-Logfiles auf dem eigenen VPS, Speicherdauer angeben).
7. **GitHub Pages abschalten:** Workflow `pages.yml` löschen und unter Settings → Pages die Seite entfernen. Danach kann das Repository privat werden.
8. Canonical, OG-URLs, JSON-LD und Sitemap nutzen bereits `site.url` (`https://fotostudio-schnitzler.de`).

## Lizenzen

- **3D-Büste im Planer:** „Marble Bust 01“ von Rico Cilliers, [Poly Haven](https://polyhaven.com/a/marble_bust_01), **CC0** (gemeinfrei, auch kommerziell frei nutzbar). Original in `quelle/modelle/marble_bust_01/`, aufbereitet in `public/models/bust/`.
- **Schriften:** Bodoni Moda und Hanken Grotesk, SIL Open Font License, lokal über Fontsource.
- **Fotos:** © Fotostudio Schnitzler. Nicht ohne Erlaubnis weiterverwenden.

## Datenschutz

Keine Cookies, kein Tracking. Schriften liegen lokal, die OpenStreetMap-Karte lädt erst nach Klick, WhatsApp-Links sind einfache Links ohne Skript. Bilder im Shooting-Planer verlassen das Gerät nicht. Im Local Storage liegt nur die Wahl hell/dunkel.
