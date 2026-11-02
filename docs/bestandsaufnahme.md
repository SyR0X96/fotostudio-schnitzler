# Bestandsaufnahme der alten Website

**Fotostudio Schnitzler, Hürth-Gleuel**

- Alte Seite: https://fotostudio-schnitzler.de (Joomla mit YOOtheme, Galerien mit Phoca Gallery)
- Stand: 2. November 2026

Dieses Dokument hält fest, was auf der bisherigen Website steht, was wir davon für die neue Seite übernehmen und welche Angaben wir noch von Ihnen brauchen. Die Fragen an Sie sind in Abschnitt 9 gesammelt, erste Antworten vom 2. November 2026 sind dort vermerkt.

---

## 1. Überblick

- **Abgerufen am:** 2. November 2026, 13:01 Uhr UTC (14:01 Uhr deutscher Zeit). Der Zeitstempel steht als `geholt` in `quelle/manifest.json`.
- **Womit:** mit dem Node-Skript `scripts/bestand-holen.mjs` (Aufruf `npm run bestand`). Es lädt jede Seite, wandelt den Hauptinhalt (`<main id="tm-main">`) in Markdown um und misst die Bildgrößen mit `sharp`.
- **Bilder in der besten verfügbaren Auflösung:** Für jedes Galeriebild prüft das Skript drei Fassungen: die Datei im Phoca-Originalordner, die Vorschaustufe `phoca_thumb_l` und die kleinere Stufe `phoca_thumb_m`. Gespeichert wird die Fassung mit der größten Pixelzahl, bei Gleichstand die größere Datei. Ergebnis: in allen 295 Fällen `phoca_thumb_l`. Die Dateien im Originalordner sind nicht größer (Beispiel `Portrait/l000.jpg` mit 220 × 306 px). Bilder aus dem YOOtheme-Cache (Studiofotos, Schild) wurden in der größten Fassung aus `src` bzw. `srcset` gesichert.
- **Galerieseiten:** Phoca zeigt 20 Bilder je Seite. Das Skript blättert über `?start=20`, `?start=40` usw. weiter und entfernt doppelt gelistete Bilder.
- **Ablage:**
  - `quelle/texte/`: eine Markdown-Datei je Seite (`home`, `service`, `studio`, `kontakt`, `impressum`, `datenschutz`, `galerie-<kategorie>`). Die Liste „Fotogalerie“ oben in jeder Datei ist das Seitenmenü und gehört nicht zum Seitentext.
  - `quelle/fotos/<kategorie>/`: die Galeriebilder, ein Ordner je Kategorie (13 Ordner). Dazu `quelle/fotos/studio/` (6 Bilder) und `quelle/fotos/marke/` (5 Dateien).
  - `quelle/manifest.json`: alle Seiten (URL, Titel, Meta-Description) und alle Bilder (Kategorie, Datei, Quell-URL, Variante, Breite, Höhe, Bytes), dazu unter `galerien` je Kategorie Anzahl und kleinste/größte Auflösung.
- **Umfang:** 19 Seiten (6 Textseiten, 13 Galerien) und 306 Bilddateien (295 Galeriebilder, 6 Studiobilder, 5 Dateien Marke/Technik). Keine Ladefehler. Die Galeriebilder belegen zusammen 4,8 MB.
- **Technische Auffälligkeiten der alten Seite:**
  - Die Meta-Description lautet auf allen 19 Seiten nur „My CMS“ (Platzhalter des Systems). Suchmaschinen bekommen also keine Beschreibung.
  - Die Seitentitel enthalten den Studionamen nicht („Home“, „Service“, „Studio“ usw.).
  - Es gibt keine Sitemap (Abruf ergab 404).
  - Die Fließtexte auf der Startseite und der Studio-Seite sind als Überschriften der kleinsten Stufe (H6) ausgezeichnet, nicht als normale Absätze.
  - Kontaktdaten und Öffnungszeiten stehen auf der Kontaktseite nur in einem Bild (Schild). Suchmaschinen und Vorleseprogramme können sie dort nicht lesen.
  - Favicon (PNG) und App-Symbol sind das Standardlogo von Joomla, kein eigenes Symbol.

---

## 2. Seitenliste und Weiterleitungen

Alle alten Adressen bekommen später eine dauerhafte Weiterleitung (HTTP 301) auf das neue Ziel. So landen alte Lesezeichen, Links und Suchergebnisse an der richtigen Stelle.

| Alte URL | Seitentitel (alt) | Inhalt | Neues Ziel (301) |
|---|---|---|---|
| `/` | Home | Text: Begrüßung (6 Absätze) | `/` |
| `/service` | Service | Text: Leistungsliste (9 Punkte) | `/#leistungen` |
| `/studio` | Studio | Text (3 Absätze) und 3 Studiofotos | `/#studio` |
| `/kontakt` | Kontakt | nur Überschrift, Kontaktdaten und Öffnungszeiten als Bild (Schild) | `/#kontakt` |
| `/impressum` | Impressum | Text | `/impressum.html` |
| `/datenschutz` | Datenschutz | Text (rund 18.500 Zeichen) | `/datenschutz.html` |
| `/portrait` | Portrait | Galerie, 29 Bilder | `/?galerie=portrait#galerie` |
| `/bewerbung` | Bewerbung | Galerie, 15 Bilder | `/?galerie=bewerbung#galerie` |
| `/passbilder` | Passbilder | Galerie, 3 Bilder | `/?galerie=passbilder#galerie` |
| `/familie` | Familie | Galerie, 19 Bilder | `/?galerie=familie#galerie` |
| `/kinder` | Kinder | Galerie, 60 Bilder (118 Einträge, siehe Abschnitt 4) | `/?galerie=kinder#galerie` |
| `/schwanger` | Schwanger | Galerie, 8 Bilder | `/?galerie=schwanger#galerie` |
| `/hochzeits-reportage1` | Hochzeits Reportage 1 | Galerie, 18 Bilder | `/?galerie=hochzeit-reportage-1#galerie` |
| `/hochzeits-reportage-2` | Hochzeits Reportage 2 | Galerie, 37 Bilder | `/?galerie=hochzeit-reportage-2#galerie` |
| `/hochzeits-reportage-3` | Hochzeits Reportage 3 | Galerie, 32 Bilder | `/?galerie=hochzeit-reportage-3#galerie` |
| `/hochzeits-portrait` | Hochzeits Portrait | Galerie, 20 Bilder | `/?galerie=hochzeit-portrait#galerie` |
| `/gruppen-und-vereine` | Gruppen und Vereine | Galerie, 20 Bilder | `/?galerie=gruppen-vereine#galerie` |
| `/tiere` | Tiere | Galerie, 14 Bilder | `/?galerie=tiere#galerie` |
| `/erotik` | Erotik | Galerie, 20 Bilder | `/?galerie=boudoir#galerie` |

**Blätterseiten der Galerien:** Phoca zeigt 20 Bilder je Seite. Galerien mit mehr als 20 Einträgen waren deshalb zusätzlich unter `?start=20`, `?start=40` usw. erreichbar, zum Beispiel `/portrait?start=20`. Das betrifft Portrait, Hochzeits Reportage 2 und 3 sowie Kinder (118 Einträge, also Blätterseiten bis `?start=100`). Alle `?start=`-Varianten bekommen dasselbe Ziel wie die Galerie selbst; die Weiterleitung soll den Parameter `start` also einfach ignorieren.

**Erotik:** Das Ziel `/?galerie=boudoir#galerie` gilt nur, wenn die Galerie auf der neuen Seite bleibt (Frage 4). Sonst legen wir für diese Adresse ein anderes Ziel fest.

---

## 3. Alle Texte wörtlich

Die Texte stehen hier genau so, wie sie auf der alten Seite standen, mit allen Tipp- und Zeichensetzungsfehlern. Die überarbeiteten Fassungen stehen in Abschnitt 8. Quelle ist jeweils die Datei in `quelle/texte/`.

### 3.1 Home (`/`, Datei `home.md`)

Überschrift: „Fotostudio-Schnitzler“

> Herzlich Willkommen,
>
> Anspruchsvolle Fotografie ist unser Arbeitsgebiet, der Stil geprägt durch klassische Lichtführung, aufmerksame Bildkomposition und einen entspannten Umgang mit den Menschen die wir fotografieren.Außerdem meinen wir, daß ein guter Fotograf auch die sorgfältige Retusche von Bilddaten zu seinen Aufgaben zählt.
>
> Unsere Stärken sind das exklusive, klassische Portrait im Fotostudio, speziell auch in schwarzweiß.Bewerbungsfotos auf gehobenem Niveau gehören ebenfalls zu unserem Fachgebiet.Unsere Kunden sind Privatpersonen, Schauspieler und Künstler, Verlage und Unternehmen, die fotografische Bildmaterialien für ihre Präsentation oder ihrem Privatgebrauch benötigen.
>
> Kommen Sie zu uns. Unser Fotostudio befindet sich im Stadtteil Hürth-Gleuel.
>
> Schauen Sie doch einfach mal rein. Wir beraten sie gerne und ausführlich.
>
> Ihr Fotostudio Schnitzler - Bergmannstraße 76 - 50354 Hürth-Gleuel

### 3.2 Service (`/service`, Datei `service.md`)

Überschrift: „unser Service für Sie“

```text
Pass- und Bewerbungsfotos
Reportagen am Ort IhrerWahl
Reproduktionen alter Fotos
Retuschearbeiten
Bildveredelung
Leinenfotos auf Keilrahmen
Einrahmungen
Danksagungen mit Foto
Induviduell gestalltete Hochzeitsalben
```

### 3.3 Studio (`/studio`, Datei `studio.md`)

Überschrift: „unser Fotostudio“

> Das Studio ist der Ort an dem wir uns für Sie ganz speziell Zeit nehmen um Sie ins rechte Licht zu rücken.
>
> Was immer Sie fotografisch festhalten möchten, wir entwicklen mit Ihnen individuelle Ideen und setzen diese kreativ und unkompliziert um.Gerne lassen wir uns von Ihren Wünschen anregen.
>
> Lassen Sie sich doch einfach von den Fotos der Fotogalerie inspirieren.Bedenken Sie das Gut ausgelichtete Fotografien ein ganz persönliches Geschenk sein können.

Dazu zeigt die Seite drei Studiofotos (siehe Abschnitt 4).

### 3.4 Kontakt (`/kontakt`, Datei `kontakt.md`) und Schild

Die Kontaktseite hat als Text nur die Überschrift „Fotostudio-Schnitzler“. Alle Angaben stehen im Bild `quelle/fotos/studio/schild_klein.jpeg` (7795 × 4783 px). Abschrift des Schilds, Zeile für Zeile:

```text
Öffnungszeiten
Dienstag, Mittwoch, Freitag   10 - 12 Uhr  und 15 - 18 Uhr
Donnerstag                    10 - 13 Uhr
Inner-und außerhalb dieser Zeiten sind wir nach
Terminabsprache, auch an den Wochenenden,
gerne für Sie da.
☎ 02233 - 33371               foto-schnitzler@web.de
Bergmannstrasse 76    50354 Hürth - Gleuel
Foto Schnitzler
```

Gestaltung auf dem Schild: „Öffnungszeiten“ und „auch an den Wochenenden“ in Rot, „Terminabsprache“ fett und unterstrichen, darunter groß der Schriftzug „Foto Schnitzler“ in einer schlichten serifenlosen Schrift (Arial).

### 3.5 Impressum (`/impressum`, Datei `impressum.md`)

```text
www.fotostudio-schnitzler.de
Fotostudio-Schnitzler

Aenni Müllenmeister
Fotografenmeisterin
Bergmannstraße 76
50354 Hürth-Gleuel

USt.-IdNr: DE 2218338861

Tel: 02233 / 33371
Fax: 02233 / 933692

e-mail: This email address is being protected from spambots. You need JavaScript enabled to view it.

Webmaster:Carstensen, moderne Kommunikationstechnik
```

Zur E-Mail-Zeile: Joomla verschleiert die Adresse gegen Spam (`joomla-hidden-mail`). Im Quelltext steht sie nur Base64-kodiert (`Zm90by1zY2huaXR6bGVyQHdlYi5kZQ==`), entschlüsselt ergibt das `foto-schnitzler@web.de`. Lesbar steht dieselbe Adresse auf dem Schild.

### 3.6 Datenschutz (`/datenschutz`, Datei `datenschutz.md`)

Der vollständige Text liegt in `quelle/texte/datenschutz.md`. Er wird hier nicht wiederholt, weil die Datenschutzerklärung für die neue Seite ohnehin neu an die tatsächlich genutzten Dienste angepasst wird. Inhaltsübersicht (die Zwischenüberschriften der alten Seite, in dieser Reihenfolge):

1. Einleitung (ohne Überschrift): allgemeiner Umgang mit personenbezogenen Daten
2. Datenschutzerklärung für die Nutzung von etracker
3. Datenschutzerklärung für die Nutzung von Facebook-Plugins (Like-Button)
4. Datenschutzerklärung für die Nutzung von Google Analytics (mit dem Link „hier gehts zum Opt out Formular für Google Analytic“)
5. Datenschutzerklärung für die Nutzung von Google +1
6. Datenschutzerklärung für die Nutzung von Instagram
7. Datenschutzerklärung für die Nutzung von LinkedIn
8. Datenschutzerklärung für die Nutzung von Pinterest
9. Datenschutzerklärung für die Nutzung von Tumblr
10. Datenschutzerklärung für die Nutzung von Twitter
11. Datenschutzerklärung für die Nutzung von Xing
12. Widerspruch Werbe-Mails
13. Auskunft, Löschung, Sperrung
14. Cookies
15. Server-Log-Files
16. Kontaktaufnahme via Kontaktformular
17. Kommentare und Beiträge
18. Kommentarabonnements
19. Widerspruch Werbe-Mails (derselbe Abschnitt ein zweites Mal)
20. Newsletterdaten

Auffällig: Der Abschnitt „Widerspruch Werbe-Mails“ steht doppelt, den Dienst Google +1 gibt es nicht mehr, und im etracker-Abschnitt steht ein Kodierungsfehler („l&oouml;schen“). Ob die genannten Dienste auf der alten Seite wirklich eingebunden waren, geht aus den geholten Texten nicht hervor.

### 3.7 Galerieseiten

Die 13 Galerieseiten haben keinen eigenen Text: Alle Dateien `quelle/texte/galerie-*.md` enthalten nur die Quellangabe. Als Bildtitel sind nur die Dateinamen hinterlegt (`l000`, `l001` usw.).

---

## 4. Bilder je Kategorie

Alle Zahlen sind aus `quelle/manifest.json` berechnet. Hochformat heißt höher als breit, Querformat breiter als hoch.

| Kategorie (Ordner) | Alte Seite | Anzahl | Breite min–max (px) | Höhe min–max (px) | Variante | Hochformat | Querformat | Quadratisch |
|---|---|---:|---|---|---|---|---|---|
| `portrait` | `/portrait` | 29 | 204–424 | 306–306 | `phoca_thumb_l` | 24 (83 %) | 4 (14 %) | 1 (3 %) |
| `bewerbung` | `/bewerbung` | 15 | 204–423 | 306–306 | `phoca_thumb_l` | 11 (73 %) | 1 (7 %) | 3 (20 %) |
| `passbilder` | `/passbilder` | 3 | 210–212 | 294–294 | `phoca_thumb_l` | 3 (100 %) | 0 | 0 |
| `familie` | `/familie` | 19 | 203–458 | 306–306 | `phoca_thumb_l` | 8 (42 %) | 11 (58 %) | 0 |
| `kinder` | `/kinder` | 60 | 203–458 | 306–306 | `phoca_thumb_l` | 41 (68 %) | 19 (32 %) | 0 |
| `schwanger` | `/schwanger` | 8 | 220–458 | 306–306 | `phoca_thumb_l` | 6 (75 %) | 2 (25 %) | 0 |
| `hochzeit-reportage-1` | `/hochzeits-reportage1` | 18 | 203–458 | 306–306 | `phoca_thumb_l` | 7 (39 %) | 11 (61 %) | 0 |
| `hochzeit-reportage-2` | `/hochzeits-reportage-2` | 37 | 203–458 | 306–306 | `phoca_thumb_l` | 15 (41 %) | 22 (59 %) | 0 |
| `hochzeit-reportage-3` | `/hochzeits-reportage-3` | 32 | 204–458 | 306–306 | `phoca_thumb_l` | 16 (50 %) | 16 (50 %) | 0 |
| `hochzeit-portrait` | `/hochzeits-portrait` | 20 | 203–458 | 306–306 | `phoca_thumb_l` | 14 (70 %) | 6 (30 %) | 0 |
| `gruppen-vereine` | `/gruppen-und-vereine` | 20 | 203–559 | 306–306 | `phoca_thumb_l` | 9 (45 %) | 11 (55 %) | 0 |
| `tiere` | `/tiere` | 14 | 203–458 | 306–306 | `phoca_thumb_l` | 8 (57 %) | 5 (36 %) | 1 (7 %) |
| `erotik` | `/erotik` | 20 | 204–424 | 306–306 | `phoca_thumb_l` | 18 (90 %) | 2 (10 %) | 0 |
| **Summe** | | **295** | **203–559** | **294–306** | `phoca_thumb_l` | **180 (61 %)** | **110 (37 %)** | **5 (2 %)** |

Hinweise:

- Innerhalb jeder Kategorie sind alle Bilder gleich hoch: 306 px, bei den Passbildern 294 px. Die längste Bildkante liegt bei höchstens 559 px (`gruppen-vereine/l009.jpg`, 559 × 306 px); alle anderen Bilder messen an der langen Kante höchstens 459 px.
- Die Kinder-Galerie listete auf der alten Seite 118 Einträge, davon nur 60 verschiedene Bilder. Phoca hat Bilder doppelt angezeigt; gespeichert ist jedes Bild einmal.
- Die fünf quadratischen Bilder (306 × 306 px): `portrait/l011.jpg`, `bewerbung/l005.jpg`, `bewerbung/l008.jpg`, `bewerbung/l010.jpg`, `tiere/l014.jpg`.

### Studio- und Markenbilder einzeln

| Datei | Fundstelle¹ | Größe (px) | Bytes | Inhalt | Einschätzung |
|---|---|---|---:|---|---|
| `studio/Studioraum.jpeg` | Studio | 650 × 469 | 39.832 | Aufnahmeraum mit Lichtanlage und Requisiten | eingebrannter blauer Schriftzug „Fotostudio Schnitzler“ unten rechts, für große Flächen zu klein |
| `studio/Studio-Verkauf.jpeg` | Studio | 650 × 469 | 53.827 | Beratungs- und Verkaufsbereich mit gerahmten Bildern | wie oben |
| `studio/Studio-vorne.jpeg` | Studio | 650 × 469 | 43.855 | Eingangsbereich mit Theke und Vitrine | wie oben |
| `studio/schild_klein.jpeg` | Startseite, Kontaktseite | 7795 × 4783 | 1.216.574 | Schild mit Öffnungszeiten, Telefon, E-Mail, Adresse, Schriftzug „Foto Schnitzler“ | Quelle für Kontaktdaten und Öffnungszeiten; der Inhalt soll auf der neuen Seite als echter Text erscheinen |
| `studio/fotostudio-schnitzler.jpeg` | Startseite | 84 × 160 | 4.355 | kleines Schwarz-Weiß-Foto einer Frau | kein Logo, zu klein für eine Verwendung |
| `studio/object583966068.png` | Startseite | 204 × 175 | 51.377 | Frau mit roter Mütze und Kamera, freigestellt | sieht nach Stockfoto aus, Lizenz unklar, wird auf der neuen Seite nicht verwendet |
| `marke/object583966068.png` | `/images/` | 204 × 175 | 67.580 | dasselbe Motiv als Datei aus dem Bilderordner | wie oben |
| `marke/favicon.png` | Theme-Ordner | 96 × 96 | 3.847 | Joomla-Standardlogo | kein eigenes Symbol, für die neue Seite nicht geeignet |
| `marke/apple-touch-icon.png` | Theme-Ordner | 180 × 180 | 19.207 | Joomla-Standardlogo | wie oben |
| `marke/favicon-ico.ico` | `/favicon.ico` | (nicht gemessen) | 113.459 | Favicon der alten Seite | Format nicht mit `sharp` lesbar, nicht weiter geprüft |
| `marke/pageglare.png` | `/images/` | 973 × 422 | 116.820 | fast durchsichtiger heller Lichtreflex (Deko-Grafik des alten Designs) | kein Inhalt, wird nicht gebraucht |

¹ Fundstelle laut Manifest. Das Skript speichert jedes Bild nur beim ersten Fund. Bilder, die auf mehreren Seiten stehen, erscheinen deshalb unter der ersten Seite, auf der sie vorkamen; das Schild zum Beispiel ist schon im HTML der Startseite enthalten und zeigt auf der Kontaktseite die Kontaktdaten.

Ein echtes Logo gibt es nicht. Als Markenzeichen dient nur der Schriftzug „Foto Schnitzler“ auf dem Schild und der Schriftzug „Fotostudio Schnitzler“ als Wasserzeichen in den Studiofotos.

---

## 5. Kontaktdaten

| Angabe | Wert | Fundstelle | Status |
|---|---|---|---|
| Name des Studios | „Fotostudio-Schnitzler“, „Fotostudio Schnitzler“, „Foto Schnitzler“ | Impressum und Überschriften; Begrüßungstext und Wasserzeichen; Schild | bitte bestätigen (welche Schreibweise gilt, Frage 8) |
| Adresse | Bergmannstraße 76, 50354 Hürth-Gleuel | Impressum (Text), Startseite (Text), Schild („Bergmannstrasse“) | bestätigt durch Text |
| Telefon | 02233 33371 | Impressum „Tel: 02233 / 33371“ (Text), Schild „02233 - 33371“ | bestätigt durch Text |
| Fax | 02233 933692 | Impressum „Fax: 02233 / 933692“ (Text) | bestätigt durch Text (noch in Betrieb? Frage 1) |
| E-Mail | foto-schnitzler@web.de | Impressum nur verschleiert (Base64), lesbar nur auf dem Schild (Bild) | bitte bestätigen |
| Öffnungszeiten | Di, Mi, Fr 10–12 Uhr und 15–18 Uhr; Do 10–13 Uhr; außerdem nach Terminabsprache, auch am Wochenende | nur auf dem Schild (Bild) | bitte bestätigen |
| Inhaberin bzw. Verantwortliche | Aenni Müllenmeister, Fotografenmeisterin | Impressum (Text) | Name und Berufsbezeichnung bestätigt durch Text; ob sie Inhaberin ist und die Rechtsform bitte bestätigen (Frage 13) |
| USt-IdNr | DE 2218338861 | Impressum (Text) | bitte prüfen: deutsche USt-IdNr haben 9 Ziffern, hier stehen 10 |
| Webmaster | Carstensen, moderne Kommunikationstechnik | Impressum (Text) | nur zur Information (bisheriger Dienstleister) |
| WhatsApp | keine Angabe | nicht vorhanden | fehlt (Frage 1) |

---

## 6. Lücken

Diese Angaben fehlen auf der alten Seite oder sind unklar. Die Spalte „Feld“ nennt die Stelle in `src/config.js`, an der der Wert auf der neuen Seite später eingetragen wird. Solange ein Wert fehlt, erfinden wir nichts dazu.

| Lücke | Feld in `src/config.js` | Stand |
|---|---|---|
| WhatsApp-Nummer | `whatsapp` | auf der alten Seite keine (Frage 1) |
| Preise | `prices` | auf der alten Seite keine (Frage 3) |
| Link zu den Google-Bewertungen | `googleReviews` | auf der alten Seite keiner (Frage 11) |
| Kundenstimmen, Bewertungen | `reviews` | auf der alten Seite keine; nur echte, freigegebene Stimmen (Frage 11) |
| Öffnungszeiten | `hours` (Hinweis zu Terminen in `hoursNote`) | nur im Schild-Bild; Werte aus dem Schild, bitte bestätigen (Frage 2) |
| Logo | `logo` | kein Logo vorhanden, nur der Schriftzug „Foto Schnitzler“ (Arial) auf dem Schild; `fotostudio-schnitzler.jpeg` ist ein kleines Foto, kein Logo (Frage 8) |
| Kartenposition | `geo` | keine Koordinaten in den geholten Daten; die Position lässt sich aus der Adresse Bergmannstraße 76 ermitteln und sollte von Ihnen bestätigt werden |
| E-Mail-Adresse | `email` | im Impressum nur verschleiert, lesbar nur auf dem Schild (Frage 1) |
| USt-IdNr | kein eigenes Feld (Impressum) | 10 statt 9 Ziffern (Frage 9) |
| Rechtsform für das Impressum | kein eigenes Feld (Impressum) | nicht angegeben (Frage 13) |
| Hochauflösende Bilder | kein eigenes Feld | nur Fassungen bis 306 px Höhe (Abschnitt 7, Frage 5) |
| Studiofotos ohne Wasserzeichen | kein eigenes Feld | nur 650 px breit, mit eingebranntem Schriftzug (Frage 10) |
| Vorher/Nachher-Beispiele | kein eigenes Feld | auf der alten Seite keine (Frage 6) |
| Erotik-Galerie | kein eigenes Feld (Galerie `boudoir`) | unklar, ob sie auf die neue Seite soll (Frage 4) |
| Einwilligungen der abgebildeten Personen | kein eigenes Feld | unklar (Frage 12) |
| Jahreszahlen, Kundenzahlen | kein eigenes Feld | auf der alten Seite keine; werden nicht genannt, solange Sie keine Angaben machen (Frage 14) |
| Seitenbeschreibungen, Seitentitel, Sitemap | kein eigenes Feld | alte Seite nur „My CMS“ und keine Sitemap; für die neue Seite braucht es eigene Beschreibungen und eine Sitemap |

Das Bild `object583966068.png` (Frau mit roter Mütze) ist keine Lücke, sondern wird bewusst nicht übernommen, weil die Lizenz unklar ist.

---

## 7. Zu kleine Bilder für große Flächen

Die neue Seite zeigt Fotos deutlich größer als die alte. Damit ein Bild auf großen Bildschirmen und hochauflösenden Displays scharf aussieht, braucht es mindestens diese Länge an der langen Bildkante:

| Fläche | Mindestens (lange Kante) |
|---|---|
| Hero (großes Bild ganz oben) | 2400 px |
| Showcase und Filmstreifen | 1600 px |
| Galerie-Lightbox (Großansicht nach Klick) | 2000 px |

Von der alten Seite gibt es nur Fassungen mit höchstens 306 px Höhe; die lange Kante misst höchstens 559 px. Das ist für jede dieser Flächen rund 3- bis 8-mal zu wenig. Wir skalieren nichts hoch: Hochrechnen erzeugt keine Details, die Bilder würden weich und unscharf wirken. Bis bessere Dateien vorliegen, können die vorhandenen Bilder nur in ihrer tatsächlichen Größe gezeigt werden.

**Am dringendsten brauchen wir die Originaldateien dieser Bilder:**

| Verwendung | Datei | Heute (px) | Benötigt (lange Kante) | Faktor bis zum Ziel |
|---|---|---|---|---|
| Hero | `portrait/l006.jpg` | 220 × 306 | 2400 px | rund 7,8-fach |
| Showcase | `portrait/l020.jpg` | 204 × 306 | 1600 px | rund 5,2-fach |
| Showcase | `portrait/l005.jpg` | 424 × 306 | 1600 px | rund 3,8-fach |
| Showcase | `portrait/l029.jpg` | 221 × 306 | 1600 px | rund 5,2-fach |
| Showcase | `portrait/l003.jpg` | 229 × 306 | 1600 px | rund 5,2-fach |
| Showcase | `schwanger/l000.jpg` | 220 × 306 | 1600 px | rund 5,2-fach |
| Showcase | `schwanger/l005.jpg` | 220 × 306 | 1600 px | rund 5,2-fach |
| Showcase | `familie/l009.jpg` | 220 × 306 | 1600 px | rund 5,2-fach |
| Showcase | `familie/l020.jpg` | 424 × 306 | 1600 px | rund 3,8-fach |
| Showcase | `hochzeit-portrait/l019.jpg` | 220 × 306 | 1600 px | rund 5,2-fach |
| Showcase | `bewerbung/l002.jpg` | 211 × 306 | 1600 px | rund 5,2-fach |
| Showcase | `bewerbung/l004.jpg` | 211 × 306 | 1600 px | rund 5,2-fach |
| Showcase | `tiere/l005.jpg` | 455 × 306 | 1600 px | rund 3,5-fach |
| Studio | `Studioraum.jpeg`, `Studio-Verkauf.jpeg`, `Studio-vorne.jpeg` | je 650 × 469, mit Wasserzeichen | wir empfehlen ebenfalls mindestens 1600 px | rund 2,5-fach |

Bei den Studiofotos ließe sich der eingebrannte Schriftzug „Fotostudio Schnitzler“ unten rechts nur wegretuschieren, und die Fotos blieben trotzdem zu klein. Am besten wären neue Fotos der Räume ohne Schriftzug (Frage 10).

**Was wir brauchen:** die Originaldateien in voller Auflösung, also die Dateien aus der Kamera oder die fertig bearbeiteten Fassungen, als JPEG oder TIFF und ohne Wasserzeichen. Die übrigen Galeriebilder brauchen für die Lightbox ebenfalls größere Fassungen; sie können nach und nach folgen.

---

## 8. Textüberarbeitung alt → neu

Für alle Texte, die die neue Seite übernimmt, steht hier die alte und die vorgeschlagene neue Fassung. Grundsätze der Überarbeitung:

- Rechtschreibung und Zeichensetzung korrigiert, behutsam modernisiert.
- Inhalt und Sie-Ansprache bleiben. Es kommen keine neuen Behauptungen oder Fakten dazu, und die Werbesprache wird nicht aufgebläht.
- Lange Sätze dürfen geteilt oder umgestellt werden, damit sie sich gut lesen.
- Der Satz „Sie ins rechte Licht rücken“ bleibt als Leitmotiv erhalten.

Bitte lesen Sie die neuen Fassungen und geben Sie sie frei oder schreiben Sie uns Ihre Änderungen (Frage 7).

### 8.1 Home: Begrüßung

**Überschrift**

- Alt: „Fotostudio-Schnitzler“
- Neu: „Fotostudio Schnitzler“
- Was geändert: Name ohne Bindestrich, so wie im Begrüßungstext und im Wasserzeichen der Studiofotos. Welche Schreibweise gilt, klären wir mit Frage 8.

**Absatz 1**

- Alt: „Herzlich Willkommen,“
- Neu: „Herzlich willkommen!“
- Was geändert: „willkommen“ klein (Rechtschreibung). Ausrufezeichen statt Komma, weil der Gruß für sich steht und der nächste Absatz neu beginnt.

**Absatz 2**

Alt:

> Anspruchsvolle Fotografie ist unser Arbeitsgebiet, der Stil geprägt durch klassische Lichtführung, aufmerksame Bildkomposition und einen entspannten Umgang mit den Menschen die wir fotografieren.Außerdem meinen wir, daß ein guter Fotograf auch die sorgfältige Retusche von Bilddaten zu seinen Aufgaben zählt.

Neu:

> Anspruchsvolle Fotografie ist unser Arbeitsgebiet. Unseren Stil prägen klassische Lichtführung, aufmerksame Bildkomposition und ein entspannter Umgang mit den Menschen, die wir fotografieren. Außerdem meinen wir, dass zur Arbeit eines guten Fotografen auch die sorgfältige Retusche der Bilddaten gehört.

Was geändert: Den langen ersten Satz geteilt, „der Stil geprägt durch …“ ist jetzt ein vollständiger Satz. Komma vor „die wir fotografieren“ ergänzt (Relativsatz). Fehlendes Leerzeichen nach dem Punkt ergänzt. „daß“ → „dass“. Den letzten Satz leicht umgestellt, die Aussage bleibt gleich.

**Absatz 3**

Alt:

> Unsere Stärken sind das exklusive, klassische Portrait im Fotostudio, speziell auch in schwarzweiß.Bewerbungsfotos auf gehobenem Niveau gehören ebenfalls zu unserem Fachgebiet.Unsere Kunden sind Privatpersonen, Schauspieler und Künstler, Verlage und Unternehmen, die fotografische Bildmaterialien für ihre Präsentation oder ihrem Privatgebrauch benötigen.

Neu:

> Unsere Stärke ist das exklusive, klassische Portrait im Fotostudio, besonders auch in Schwarzweiß. Bewerbungsfotos auf gehobenem Niveau gehören ebenfalls zu unserem Fachgebiet. Unsere Kunden sind Privatpersonen, Schauspieler und Künstler, Verlage und Unternehmen, die Fotos für ihre Präsentation oder ihren Privatgebrauch benötigen.

Was geändert: Zwei fehlende Leerzeichen nach Punkten ergänzt. „Stärken sind“ → „Stärke ist“, weil im Satz nur eine Stärke folgt (die Bewerbungsfotos kommen im nächsten Satz). „speziell auch in schwarzweiß“ → „besonders auch in Schwarzweiß“ (als Hauptwort groß, in der Schreibweise wie überall auf der neuen Seite). „fotografische Bildmaterialien“ → „Fotos“ (kürzer, gleiche Bedeutung). „ihrem Privatgebrauch“ → „ihren Privatgebrauch“ (richtiger Fall). „Portrait“ bleibt in dieser Schreibweise, passend zu den Galerienamen; „Porträt“ wäre ebenfalls richtig.

**Absatz 4**

- Alt: „Kommen Sie zu uns. Unser Fotostudio befindet sich im Stadtteil Hürth-Gleuel.“
- Neu: „Kommen Sie zu uns: Unser Fotostudio liegt im Hürther Stadtteil Gleuel.“
- Was geändert: Die zwei kurzen Sätze verbunden. Ortsangabe genauer: Gleuel ist der Stadtteil, Hürth die Stadt.

**Absatz 5**

- Alt: „Schauen Sie doch einfach mal rein. Wir beraten sie gerne und ausführlich.“
- Neu: „Schauen Sie doch einfach mal vorbei. Wir beraten Sie gerne und ausführlich.“
- Was geändert: „sie“ → „Sie“ (Anrede groß). „rein“ → „vorbei“ (Umgangssprache leicht geglättet).

**Absatz 6**

- Alt: „Ihr Fotostudio Schnitzler - Bergmannstraße 76 - 50354 Hürth-Gleuel“
- Neu: „Ihr Fotostudio Schnitzler, Bergmannstraße 76, 50354 Hürth-Gleuel“
- Was geändert: Die Striche zwischen Name, Straße und Ort durch Kommas ersetzt.

### 8.2 Service: Leistungsliste

| Alt | Neu | Was geändert |
|---|---|---|
| unser Service für Sie | Unser Service für Sie | Überschrift beginnt groß |
| Pass- und Bewerbungsfotos | Pass- und Bewerbungsfotos | keine Änderung |
| Reportagen am Ort IhrerWahl | Reportagen am Ort Ihrer Wahl | fehlendes Leerzeichen ergänzt |
| Reproduktionen alter Fotos | Reproduktionen alter Fotos | keine Änderung |
| Retuschearbeiten | Retuschearbeiten | keine Änderung |
| Bildveredelung | Bildveredelung | keine Änderung |
| Leinenfotos auf Keilrahmen | Leinwandfotos auf Keilrahmen | geläufigerer Begriff; bitte Bescheid geben, falls bewusst „Leinen“ gemeint ist |
| Einrahmungen | Einrahmungen | keine Änderung |
| Danksagungen mit Foto | Danksagungen mit Foto | keine Änderung |
| Induviduell gestalltete Hochzeitsalben | Individuell gestaltete Hochzeitsalben | zwei Tippfehler korrigiert |

### 8.3 Studio

**Überschrift**

- Alt: „unser Fotostudio“
- Neu: „Unser Fotostudio“
- Was geändert: Überschrift beginnt groß.

**Absatz 1**

- Alt: „Das Studio ist der Ort an dem wir uns für Sie ganz speziell Zeit nehmen um Sie ins rechte Licht zu rücken.“
- Neu: „Das Studio ist der Ort, an dem wir uns ganz bewusst Zeit für Sie nehmen, um Sie ins rechte Licht zu rücken.“
- Was geändert: Zwei fehlende Kommas ergänzt (vor „an dem“ und vor „um … zu“). „uns für Sie ganz speziell Zeit nehmen“ → „uns ganz bewusst Zeit für Sie nehmen“ (flüssigere Wortstellung). Das Leitmotiv „Sie ins rechte Licht zu rücken“ bleibt unverändert.

**Absatz 2**

Alt:

> Was immer Sie fotografisch festhalten möchten, wir entwicklen mit Ihnen individuelle Ideen und setzen diese kreativ und unkompliziert um.Gerne lassen wir uns von Ihren Wünschen anregen.

Neu:

> Was immer Sie fotografisch festhalten möchten: Wir entwickeln mit Ihnen individuelle Ideen und setzen sie kreativ und unkompliziert um. Gerne lassen wir uns dabei von Ihren Wünschen anregen.

Was geändert: „entwicklen“ → „entwickeln“. Fehlendes Leerzeichen nach dem Punkt ergänzt. Doppelpunkt statt Komma, das liest sich klarer. „diese“ → „sie“. „dabei“ ergänzt, damit der zweite Satz an den ersten anschließt.

**Absatz 3**

Alt:

> Lassen Sie sich doch einfach von den Fotos der Fotogalerie inspirieren.Bedenken Sie das Gut ausgelichtete Fotografien ein ganz persönliches Geschenk sein können.

Neu:

> Lassen Sie sich doch einfach von den Fotos in unserer Fotogalerie inspirieren. Denken Sie auch daran, dass gut ausgeleuchtete Fotografien ein ganz persönliches Geschenk sein können.

Was geändert: Fehlendes Leerzeichen nach dem Punkt ergänzt. „der Fotogalerie“ → „in unserer Fotogalerie“. „Bedenken Sie das Gut ausgelichtete“ → „Denken Sie auch daran, dass gut ausgeleuchtete“: Komma ergänzt, „dass“ statt „das“, „gut“ klein, „ausgelichtete“ → „ausgeleuchtete“; „Denken Sie auch daran“ klingt freundlicher als „Bedenken Sie“.

### 8.4 Schild: Öffnungszeiten und Kontakt

**Öffnungszeiten**

Alt:

```text
Dienstag, Mittwoch, Freitag   10 - 12 Uhr  und 15 - 18 Uhr
Donnerstag                    10 - 13 Uhr
```

Neu:

```text
Dienstag, Mittwoch und Freitag: 10–12 Uhr und 15–18 Uhr
Donnerstag: 10–13 Uhr
```

Was geändert: Zeitspannen mit Bis-Strich ohne Leerzeichen geschrieben, „und“ vor „Freitag“ ergänzt. Montag, Samstag und Sonntag stehen nicht auf dem Schild; das klären wir mit Frage 2. Die Zeiten selbst sind unverändert und müssen noch bestätigt werden.

**Hinweis zu Terminen**

- Alt: „Inner-und außerhalb dieser Zeiten sind wir nach Terminabsprache, auch an den Wochenenden, gerne für Sie da.“
- Neu: „Innerhalb und außerhalb dieser Zeiten sind wir nach Terminabsprache gerne für Sie da, auch am Wochenende.“
- Was geändert: „Inner-und“ (fehlendes Leerzeichen) ausgeschrieben zu „Innerhalb und“, das liest sich leichter. Den Einschub ans Satzende gestellt. „an den Wochenenden“ → „am Wochenende“.

**Kontaktzeilen**

- Alt: „☎ 02233 - 33371“, „foto-schnitzler@web.de“, „Bergmannstrasse 76 50354 Hürth - Gleuel“
- Neu: „Telefon 02233 33371“, „foto-schnitzler@web.de“, „Bergmannstraße 76, 50354 Hürth-Gleuel“
- Was geändert: Telefonnummer in der üblichen Schreibweise nach DIN 5008. „Bergmannstrasse“ → „Bergmannstraße“ wie im Impressum. Ortsname ohne Leerzeichen um den Bindestrich, Komma zwischen Straße und Ort. Die E-Mail-Adresse bleibt, muss aber noch bestätigt werden (Frage 1).

---

## 9. Offene Fragen an Sie

1. **Kontaktdaten:** Haben Sie eine WhatsApp-Nummer, über die Kunden Sie erreichen sollen? Ist die Festnetznummer 02233 33371 WhatsApp-fähig, oder gibt es eine Mobilnummer dafür? Ist die E-Mail-Adresse foto-schnitzler@web.de richtig und aktuell? Wird das Fax 02233 933692 noch genutzt? Gibt es Profile in sozialen Netzwerken (zum Beispiel Facebook oder Instagram), die wir verlinken sollen?
   **Antwort (02.11.2026):** Die E-Mail-Adresse stimmt. WhatsApp gibt es nicht, Anfragen laufen über E-Mail und Telefon. Fax und soziale Netzwerke sind noch offen.
2. **Öffnungszeiten:** Stimmen die Zeiten vom Schild (Dienstag, Mittwoch und Freitag 10–12 Uhr und 15–18 Uhr, Donnerstag 10–13 Uhr, sonst nach Terminabsprache, auch am Wochenende)? Ist Montag geschlossen?
3. **Preise:** Sollen auf der neuen Seite Preise stehen, zum Beispiel für Passbilder, Bewerbungsfotos oder Shootings? Wenn ja, welche, und als feste Preise oder als „ab“-Preise?
   **Antwort (02.11.2026):** Keine Preise auf der Seite. Die FAQ-Frage zu den Kosten ist entfernt.
4. **Erotik-Galerie:** Auf der alten Seite gab es die Galerie „Erotik“ mit 20 Bildern. Soll sie auf der neuen Seite wieder erscheinen? Vorgesehen wäre sie unter dem Namen „Boudoir“.
   **Antwort (02.11.2026):** Ja, die Galerie bleibt (als „Boudoir / Akt“ hinter dem Hinweis ab 18). Die Einwilligungen der Abgebildeten (Frage 12) sind noch zu klären.
5. **Bessere Bilddateien:** Können Sie uns die Originaldateien der Bilder in voller Auflösung schicken, zuerst die in Abschnitt 7 aufgeführten? Die Fassungen von der alten Seite sind höchstens 306 px hoch und für die großen Flächen der neuen Seite zu klein.
6. **Vorher/Nachher-Beispiele:** Haben Sie Beispiele für Retusche und für die Reproduktion alter Fotos (jeweils das Ausgangsbild und das Ergebnis), die wir zeigen dürfen?
   **Antwort (02.11.2026):** Ja. Bis die Beispielpaare da sind, zeigt die Seite einen beschrifteten Platzhalter.
7. **Freigabe der Texte:** Sind Sie mit den überarbeiteten Texten in Abschnitt 8 einverstanden, oder möchten Sie etwas ändern?
8. **Logo und Name:** Haben Sie ein Logo als Vektordatei (zum Beispiel SVG, EPS, PDF oder AI)? Oder wünschen Sie einen reinen Schriftzug? Und welche Schreibweise des Namens soll gelten: „Fotostudio Schnitzler“ oder „Foto Schnitzler“?
   **Antwort (02.11.2026):** Ein Logo als Vektordatei liegt nicht vor. Es bleibt beim Schriftzug „Foto Schnitzler“ mit dem Blenden-Symbol. Die Schreibweise des Namens ist noch offen.
9. **USt-IdNr:** Bitte prüfen Sie die Umsatzsteuer-Identifikationsnummer. Im Impressum steht „DE 2218338861“, das sind 10 Ziffern; deutsche Nummern haben 9.
10. **Neue Studiofotos:** Die drei Fotos der Studioräume sind nur 650 px breit und tragen einen eingebrannten Schriftzug. Können Sie uns neue Fotos der Räume ohne Schriftzug und in voller Auflösung schicken?
11. **Google-Bewertungen:** Haben Sie ein Google-Unternehmensprofil? Dann brauchen wir den Link zu Ihren Bewertungen. Gibt es außerdem Kundenstimmen, die wir mit Erlaubnis der Kunden zitieren dürfen?
12. **Bildrechte und Einwilligungen:** Liegen für die abgebildeten Personen Einwilligungen vor, dass ihre Fotos auf der neuen Website gezeigt werden dürfen? Das betrifft besonders Kinder, Hochzeiten und die Erotik-Galerie.
13. **Impressum:** Ist Frau Müllenmeister Inhaberin, und in welcher Rechtsform wird das Studio geführt (zum Beispiel Einzelunternehmen)? Das brauchen wir für das neue Impressum.
   **Antwort (02.11.2026):** Impressum und Datenschutz passen so.
14. **Weitere Angaben (freiwillig):** Gibt es Angaben, die wir zusätzlich nennen dürfen, zum Beispiel seit wann es das Studio gibt? Auf der alten Seite stehen keine Jahreszahlen oder Kundenzahlen, und wir nennen solche Angaben nur, wenn sie von Ihnen kommen.
15. **Gutscheine:** Bieten Sie Gutscheine für Shootings an? Die neue Seite hat dafür einen eigenen Abschnitt „Ein Shooting verschenken“ und einen Anlass im Shooting-Planer. Wenn nicht, blenden wir beides aus.

---

## 10. Neue Texte auf der Website (bitte ebenfalls freigeben)

Diese Texte gab es auf der alten Seite nicht. Sie sind aus den Inhalten der alten Seite abgeleitet und enthalten keine neuen Behauptungen (keine Preise, Zeiten, Jahreszahlen oder Zusagen). Bitte lesen Sie sie wie die Texte in Abschnitt 8.

### 10.1 Startbereich (Hero)

- Leitsatz: „Ins rechte Licht gerückt.“ (aus „Sie ins rechte Licht rücken“ auf der Studio-Seite)
- Unterzeile: „Klassische Lichtführung, aufmerksame Bildkomposition und Zeit für Sie: Portraits, Bewerbungsfotos und Passbilder in unserem Fotostudio.“

### 10.2 Leistungen

| Leistung | Text |
|---|---|
| Portrait & Schwarzweiß | Das exklusive, klassische Portrait im Studio, gern auch in Schwarzweiß. Unsere große Stärke. |
| Bewerbungsfotos | Bewerbungsfotos auf gehobenem Niveau für Privatleute, Schauspieler, Künstler und Unternehmen. |
| Passbilder | Biometrische Passbilder für Ihre Ausweisdokumente, direkt bei uns im Studio. |
| Hochzeit | Brautpaar-Portraits und Reportagen vom großen Tag, auf Wunsch im individuell gestalteten Hochzeitsalbum. |
| Familie & Kinder | Shootings mit der ganzen Familie, mit Kindern und Babys, entspannt und mit viel Zeit. |
| Babybauch | Die Zeit der Schwangerschaft, festgehalten in ruhigem, klassischem Licht. |
| Tiere | Ihr Liebling im Studio, allein oder gemeinsam mit Ihnen. |
| Gruppen & Vereine | Vereine, Mannschaften und Gruppen, im Studio oder vor Ort. |
| Reportagen vor Ort | Wir kommen zu Ihnen und begleiten Ihren Anlass mit der Kamera, am Ort Ihrer Wahl. |
| Reproduktion & Retusche | Reproduktionen alter Fotos, sorgfältige Retusche und Bildveredelung. |
| Leinwand & Rahmen | Leinwandfotos auf Keilrahmen und Einrahmungen, damit Ihre Bilder an die Wand kommen. |
| Danksagungen & Alben | Danksagungen mit Foto und individuell gestaltete Hochzeitsalben. |

### 10.3 So arbeiten wir (Ablauf)

1. **Anfragen:** Rufen Sie an, schreiben Sie uns oder stellen Sie Ihr Shooting im Planer zusammen.
2. **Beraten:** Wir beraten Sie gerne und ausführlich und entwickeln mit Ihnen Ideen für Ihre Bilder.
3. **Fotografieren:** Im Studio oder am Ort Ihrer Wahl, mit klassischer Lichtführung und in entspannter Atmosphäre.
4. **Retuschieren:** Zu unserer Arbeit gehört die sorgfältige Retusche Ihrer Bilder.
5. **Veredeln:** Als Abzug, Leinwandfoto auf Keilrahmen, gerahmt, als Danksagung oder im Hochzeitsalbum.

### 10.4 Häufige Fragen

- **Brauche ich einen Termin?** Zu unseren Öffnungszeiten können Sie gerne vorbeikommen. Innerhalb und außerhalb dieser Zeiten sind wir nach Terminabsprache gerne für Sie da, auch am Wochenende. Einen Termin vereinbaren Sie am einfachsten telefonisch.
- **Machen Sie biometrische Passbilder?** Ja, Pass- und Bewerbungsfotos gehören zu unserem Service.
- **Fotografieren Sie auch außerhalb des Studios?** Ja. Reportagen am Ort Ihrer Wahl gehören zu unserem Service, zum Beispiel bei Hochzeiten oder für Gruppen und Vereine.
- **Können Sie alte Fotos reproduzieren und retuschieren?** Ja. Wir fertigen Reproduktionen alter Fotos an und übernehmen Retusche und Bildveredelung. Bringen Sie die Vorlage einfach mit, oder schicken Sie uns über den Shooting-Planer vorab ein Foto davon.
- **Fotografieren Sie auch in Schwarzweiß?** Sehr gerne. Das exklusive, klassische Portrait, besonders auch in Schwarzweiß, ist unsere Stärke.
- **In welcher Form bekomme ich meine Bilder?** Ob Abzug, Leinwandfoto auf Keilrahmen, Einrahmung, Danksagung mit Foto oder individuell gestaltetes Hochzeitsalbum: Sprechen Sie uns an, wir beraten Sie gerne.
- **Kann ich ein Shooting verschenken?** Gerne. Fragen Sie uns nach einem Gutschein. (nur, wenn Sie Gutscheine anbieten, Frage 15)

### 10.5 Weitere Abschnitte

- **Reproduktion & Retusche:** „Alte Fotos, behutsam erneuert. Wir fertigen Reproduktionen alter Fotos an und übernehmen Retuschearbeiten und Bildveredelung. Bringen Sie Ihre Vorlage einfach mit ins Studio. Im Shooting-Planer können Sie uns vorab ein Foto davon zusammen mit Ihrer Anfrage schicken.“ Daneben steht ein Vorher/Nachher-Schieber, bis zu Ihren Beispielen (Frage 6) als beschrifteter Platzhalter.
- **Gutschein:** „Ein ganz persönliches Geschenk. Gut ausgeleuchtete Fotografien können ein ganz persönliches Geschenk sein. Fragen Sie uns nach einem Gutschein, zum Beispiel für ein Portrait, ein Familien- oder ein Babybauch-Shooting.“
- **Boudoir-Hinweis:** „Nur für Erwachsene. Diese Galerie zeigt Akt- und Boudoir-Fotografie. Bitte bestätigen Sie, dass Sie mindestens 18 Jahre alt sind.“
- **Shooting-Planer:** Auswahltexte und Hinweise im Planer (zum Beispiel „Termine auch außerhalb der Öffnungszeiten und am Wochenende nach Absprache.“). Die vorbereitete Nachricht beginnt mit „Guten Tag,“ und listet alle Angaben auf.
