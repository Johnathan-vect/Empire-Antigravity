# Agent Communication & Event Bus (Audit Log)

> **Zweck:**  
> Lückenloses Protokoll aller Inter-Agent-Nachrichten, Überprüfungen, Bild-Referenzen und Beschlüsse zwischen den Test-Personas und dem Koordinator.

---

## [Dynamik-Vorschlag: Bequemer Smartphone-Gamer]
1. **Lösung für die 570px-Scrollstrecke:** Eine fixierte **Sticky Quick-Order-Leiste** am unteren Bildschirmrand kombiniert mit horizontalen **Swipe-Tabs** garantiert, dass alle Kernaktionen (Betrieb gründen, Produkt zuweisen, Kredit aufnehmen) ohne jegliches Scrollen sofort per Daumen erreichbar sind.
2. **Dynamik & Interaktivität:** Akkordeon-Kacheln für Detailstatistiken und haptisches Feedback bei One-Tap-Interaktionen machen das Smartphone-Erlebnis extrem flüssig und nah am modernen Mobile-Gaming-Standard.

## [Dynamik-Vorschlag: UI/UX- & Design-Purist]
1. **Dynamischer Standort-Hero & Miet-Indikator:** Beseitigung des statischen Kiez-Labels durch einen reaktiven Standort-Chip im Betriebs-Header (`{locDef.name}` mit passendem Icon und dynamischer Miete `{money(c.rentPerDay)}/Tag`). Fällt die Kasse unter 3 Tage Puffer, wechselt der Miet-Indikator dynamisch von neutralem `muted` auf dezent pulsierendes `warn` (`bg-warn/15 text-warn`), um finanzielle Engpässe ohne störende Popups anzukündigen.
2. **Elegante Harmonisierung von Lieferanten-Strafen:** Statt visueller Überfrachtung visualisieren wir Lieferanten-Vertrauen und Strafen über einen schlanken **Supplier-Trust-Index** (horizontale 2px-Micro-Bar) und gestaffelte Invarianten-Badges: `accent` für aktive Verträge, `warn` für drohende Vertragsbrüche und `loss` für scharfe Bailouts. Detaillierte Strafklauseln werden in ein modales Slide-Over-Sheet ausgelagert, wodurch das Interface aufgeräumt und fokussiert bleibt.
3. **Kompakte Segmented-Navigation mit Notification-Dots:** Lazy-Mobiles Daumen-Forderung lösen wir durch eine mobile Sticky-Pill-Bar mit horizontalen Swipe-Tabs. Dynamische Status-Dots (`size-2 rounded-full`) an den Tabs signalisieren Handlungsbedarf (z. B. gelber Dot an „Produkte“ bei leerem Lager oder Lieferanten-Storno), was vertikales Scrollen eliminiert und die Viewport-Höhe strikt unter 1.1x hält.

## [Erkundungs-Report: Bequemer Smartphone-Gamer]
- **Daumenerreichbarkeit & Navigation:** Die Screenshots 14–16 und die Messung von `maxScrollable: 570px` (Gesamthöhe 1329px bei 759px Viewport) belegen zu tiefe Scroll-Wege für die bequeme Einhand-Bedienung.
- **Forderung:** Wichtige Aktionen müssen in die Daumen-Greifzone (unteres Drittel) wandern, und das Dashboard benötigt kompaktere Tabs statt langer vertikaler Listen.

## [Erkundungs-Report: UI/UX- & Design-Purist]
- **Visuelle Hierarchie & Whitespace (Screens 01 & 02):** Das zentrierte Welcome-Modal (01) und das Desktop-Dashboard (02) demonstrieren exzellente typografische Disziplin mit ruhigen Anthrazit-Flächen und ausgewogenem Rhythmus. Die Gliederung von Vermögenswerten, Rang-Badges und Leerzuständen führt den Blick ohne jegliches visuelles Rauschen.
- **Boutique-Ästhetik & Kontraste (Screen 05):** Die Besitz-Übersicht setzt Luxusgüter auf hellen Card-Flächen als kuratierte Boutique-Galerie edel in Szene. Die typografische Staffelung und die dezenten Ruf-Badges fügen sich harmonisch in die dunkle Anwendungs-Shell ein.
- **Onboarding & Farbkonstanz (Screen 10):** Die 3-Schritte-Startanleitung im Kiez-Imbiss führt neue Betreiber souverän durch den Gründungsprozess und aktiviert den Setup-CTA unmissverständlich. Alle Status- und Synergie-Badges halten die System-Invarianten (`gain`, `muted`, `accent`) strikt ein.

## [Lazy-Mobile Report: Smartphone-Ergonomie]
Die Dashboard-Scrollhöhe liegt aktuell bei exakt 1.00x Viewport, was für meinen Daumen gerade noch akzeptabel ist. Für den kommenden Lieferanten-Ausbau fordere ich strikt eine One-Tap-Erreichbarkeit per Sticky-Bottom-Bar oder Tabs, um endloses Scrollen zu verhindern.

## [Design-Purist Response: Harmonie & Klarheit]
Drastische Lieferanten-Strafen dürfen das Dashboard nicht visuell überladen: Kritische Vertragsrisiken werden typografisch diszipliniert über den verbindlichen Farbton `warn` (`text-warn bg-raised`) visualisiert, während aktive Konditionen `accent` (`text-accent bg-accent/15`) nutzen. Um die Scroll-Freiheit für Mobile zu sichern, setzen wir auf kompakte Segmented-Tabs („Betrieb“ | „Lieferkette“) mit klarer typografischer Hierarchie statt endloser Listen. Komplexe Strafklauseln und Historien gehören in ein fokussiertes Drawer- oder Modal-Sheet mit kontrolliertem Whitespace, damit die Ästhetik der Kernansicht makellos bleibt.

## [22.10.2026 19:06] — SYSTEM-INITIALISIERUNG
- **Absender:** `empire-coordinator` (Antigravity)
- **Empfänger:** Alle Sub-Agents / System
- **Ereignis:** Multi-Agenten-Test- & Balancing-Umgebung erfolgreich initialisiert.
- **Invariante:** 100 % saubere Trennung vom Spielcode (`src/`). Alle Personas operieren extern.

## [Anno-Economist Report: Lieferanten-Bailout]
Der aktuelle Rückkaufpreis von 180 € ist ökonomisch fatal, da er mit nur ~28 % eines Imbiss-Tagesumsatzes (650 €) einen schmerzlosen Billig-Bailout darstellt und Misswirtschaft nicht bestraft. Nach Anno-1800-Grundsätzen muss jeder Vertragsbruch spürbare Opportunitätskosten verursachen. Als Mindestpreis fordern wir 950–1.200 € (mindestens 1,5 Tagesumsätze bzw. 6x Grundgebühr) für Imbiss sowie entsprechend skalierte Werte für Café (mind. 2.100 €) und Shop (mind. 4.500 €). Zusätzlich ist eine Vertrauensstrafe zwingend: Start bei maximal 35 % Zufriedenheit und 50 % Kapazitätslimit für 3 Spieltage.

## [Erkundungs-Report: Anno-1800-Balancing-Auditor]
- **Cashflow & Anlaufkapital (Screens 06, 11, 12):** Die Gründungsinvestition von 6.000 € (1.000 € Lizenz + 5.000 € Gebühr) beansprucht gesunde 24 % des Startvermögens (25.000 €). Problematisch ist die initiale Firmenkasse von nur 500 €: Bei 40 €/Tag Fixreinigung und nötiger Warenvorfinanzierung droht ohne sofortige Verkäufe ein Illiquiditäts-Kollaps.
- **Standort-Synergien & Miet-Anomalie (Screens 07, 08):** Schwerwiegender Balancing-Mangel: Der Hauptbahnhof bietet 2,1× Frequenz (+20 % Synergie), kostet jedoch 0 € Miete, da `baseRent` für Imbiss in `catalog.ts` auf 0 gesetzt ist. Top-Lagen ohne Fixkosten-Nachteil zerstören die ökonomische Abwägung (Anno-Prinzip: Risiko vs. Ertrag); der Bahnhof benötigt zwingend 40–60 €/Tag Miete.
- **Transparenz & GuV (Screens 12, 17):** In Screen 12 weist die Detailansicht trotz City-Wahl fehlerhaft „Miete: 0 € (Kiez) / Tag“ aus. Die Skalierungsvoraussetzungen (5.000 € Umsatz für Stufe 2, Screen 17) sind transparent, doch Kreditzinsen (10 % p.a.) müssen in der operativen Tages-GuV prominent vor der Kassenliquidität gewarnt werden.

## [Dynamik-Vorschlag: Anno-Balancing-Auditor]
- **1. Dynamische Standortmiete (Hybrid-Pacht & Takt-Volatilität):**
  - *Hybrid-Formel:* `Tagesmiete = Basis_Sockel + (Tagesumsatz × Pachtanteil)`.
  - *Kiez:* 0 € Sockel + 0 % Umsatzpacht (1,0× Frequenz, risikofreie Einstiegs-Schutzzone).
  - *Hauptbahnhof:* 45 € Sockel + 5 % Umsatzpacht (2,1× Frequenz). Bleibt die Theke wegen fehlender Ware leer, brennt der 45-€-Sockel; floriert der Laden, steigt die Abgabe dynamisch mit dem Wohlstand.
  - *Dynamische Pendler-Events:* Unvorhersehbare Marktwellen („Bahnstreik: −65 % Frequenz für 24 h“ vs. „Großmesse: +80 % Frequenz für 48 h“) zwingen wie in Anno 1800 zu aktiver Liquiditäts- und Lagerpufferung.
- **2. Dynamische Lieferanten-Rehabilitation (Stufen-Vertrauen statt Sofort-Freikauf):**
  - *Eskalierende Strafkosten:* `Rückkaufpreis = max(Tagesumsatz × 1.8, baseFee × 6) × (1 + Vertragsbrüche × 0.5)` (Imbiss: Stufe 1 = 1.170 €, Stufe 2 = 1.755 € statt 180 €).
  - *3-Stufen-Rehabilitation:* Nach Zahlung startet der Partner im Status „Gekränkt“ (max. 30 % Zufriedenheit, 50 % Kapazität, +15 % Risikopreis). Erst nach 3 pünktlich bezahlten Chargen steigt er zu „Vorsichtig“ (60 % Zufriedenheit, 80 % Kapazität) auf – Vertrauen muss erwirtschaftet, nicht erkauft werden.
- **3. Flexibler Working-Capital-Puffer bei Gründung:**
  - Im Gründungsschritt 3 wählen Spieler ihr Start-Umlaufvermögen flexibel (500 € bis 3.000 €) mit dynamischer Liquiditäts-Ampel (Warnung unter 1.000 €: „Hohes Ausfallrisiko bei Erstwarenbestellung & 40-€-Reinigungsfixum“).
