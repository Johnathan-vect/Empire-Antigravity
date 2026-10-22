# Agent Communication & Event Bus (Audit Log)

> **Zweck:**  
> Lückenloses Protokoll aller Inter-Agent-Nachrichten, Überprüfungen, Bild-Referenzen und Beschlüsse zwischen den Test-Personas und dem Koordinator.

---

## [Lazy-Mobile Grand Run: Ergonomie für das wachsende Imperium]
1. **Krisen-Navigation:** Bei dynamischen Events (Krankheitswellen, Zinsentscheide) führt das aktuelle Menü-Setup zu massivem Frust, da man sich durch tiefe Hierarchien tippen muss.
2. **Die 3 ergonomischen Must-Haves für das Spätspiel:**
   - **1-Tap-Gewinnüberweisung:** Direktes Einsammeln angesammelter Cash-Überschüsse per Daumenklick aus der Sticky-Bar.
   - **Quick-Event-Entscheidungskarten:** Pop-ups im unteren Daumenbereich (Swipe-left/right für Ja/Nein bei Krisen).
   - **Manager-Automatisierung:** Automatisierte Routine-Wartung (Reinigung, Materialnachbestellung), damit das Imperium auch ohne Dauerklicks floriert.

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


## [22.10.2026 20:05] — IMPLEMENTIERUNGS-ABSCHLUSS & VERIFIKATION (SPRINT 3.2)
- **Absender:** `empire-coordinator` (Antigravity)
- **Empfänger:** Alle Sub-Agents / System
- **Status:** ERFOLGREICH UMGESETZT & VERIFIZIERT
- **Umgesetzte Beschlüsse:**
  1. *Faire Lieferanten-Rehabilitation:* Rückkaufpreis beim Imbiss auf faire 450 € austariert (Café 1.050 €, Shop 2.600 €) mit Status „Gekränkt“ (40 % Zufriedenheit, 60 % Liefermenge).
  2. *Startkapital-Schieberegler:* Gründungsschritt 3 besitzt nun einen flexiblen Slider (500 € – 3.000 €) mit 3-stufiger Ampel (Rot/Gelb/Grün).
  3. *Bahnhofsmiete & Display-Bug behoben:* Imbiss-Basismiete auf 20 € gesetzt (Bahnhof ~36–40 €/Tag Miete, Kiez 0 €). Hardcodiertes `"0 € (Kiez)"` ersetzt durch dynamischen Standortnamen `{locDef.name}`.
  4. *Mobile Daumenzone & Notification-Dots:* Gelbe Puls-Punkte an Tabs bei Handlungsbedarf sowie fixe Schnellaktions-Leiste (Reinigen/Sortiment) über der mobilen Navigationsleiste integriert.
- **Qualitätsgate:** `npm.cmd run typecheck` = 0 Fehler, `npx.cmd vite build` = Erfolgreich, Playtest-Harness fehlerfrei durchlaufen.

## [Anno-Economist Grand Run: Dynamische Makroökonomie & Krisen]
- **Audit des 360-Tage-Runs (Scratchpad-Befund):** Der Jahresverlauf offenbart ein lineares Idle-Wachstum von 20.000 € auf 134.595 € Net-Worth und 115.637 € Firmenkasse mit einem simplen Stufe-1-Bahnhofsgrill ohne jedwede Störung. Nach Anno-1800-Grundsätzen ist eine Simulation ohne Konjunkturwellen, Zinswende oder Betriebskrisen ökonomisch tot; wirtschaftlicher Erfolg muss gegen dynamische Marktwiderstände verteidigt werden.
- **Lösung 1: Makroökonomische Konjunkturzyklen & EZB-Schocks:**
  - *Zinszyklen & Geldpolitik:* Dynamischer EZB-Leitzins (4 % bis 14 % p.a.), der fremdfinanzierte Expansionen in Hochzinsphasen drastisch verteuert.
  - *Inflations- & Rohstoffkrisen:* Unvorhersehbare Kostenschocks auf Einkaufspreise (+20–40 % z. B. bei Agrar- oder Fleischknappheit) und verdoppelte Energiekosten zwingen Spieler zu Preisanpassungen oder Margenverzicht.
- **Lösung 2: Betriebliche Krisendynamik (Krankheitswellen & Streikgefahr):**
  - *Saisonale Krankheitswellen:* Grippewellen senken die Mitarbeiterkapazität um 40–60 %; ohne Springer-Pool oder Notdienst-Zuschläge bricht die Bedienfrequenz ein und die Hygiene stürzt ab.
  - *Tarifkonflikte & Streikandrohungen:* Niedriglöhne bei hoher Auslastung erzeugen Unmut. Fällt die Mitarbeitermoral unter 30 %, startet ein 72-Stunden-Ultimatum: Lohnnachbesserung/Prämie zahlen oder vollständiger Betriebsausfall durch Generalstreik.
- **Lösung 3: Dynamische Hintergrund-Ökonomie & Markt-Einfluss (Scale-Feedback):**
  - *Endogene Marktmacht:* Mit wachsender Betriebsgröße (Ladenkette bis Konzern) schlägt das Handeln des Spielers auf den Markt zurück: Großabnahmen schalten Mengenrabatte frei (−15 %), während Konzerne Preiskämpfe gegen den Spieler entfachen.
  - *Lohn-Preis-Spirale & Monopol-Aufsicht:* Expansive Ketten verknappen das lokale Personalangebot, wodurch marktweite Löhne steigen; bei marktbeherrschender Stellung greifen Kartellprüfungen und Wettbewerbsstrafen.

## [Design-Purist Grand Run: Visuelle Klarheit & Prestige]
- **Ästhetik-Audit des 360-Tage-Runs:** Die typografische Disziplin mit konsequentem `font-mono tabular` für Finanzwerte, subtilen Border-Schatten und ausgewogenem Whitespace sorgt für einen vorbildlich ruhigen Premium-Eindruck. Die Rich-List-Karten überzeugen durch visuell prägnante Avatar-Badges und subtile Spieler-Hervorhebung (`bg-accent/15 border-accent/40`), wirken jedoch in längeren Listen ohne visuelle Rangstufen noch etwas monoton.
- **Harmonische Integration von Makroökonomie & Krisen:** Komplexe Makrodaten dürfen das Dashboard keinesfalls in ein unübersichtliches Terminal verwandeln, sondern müssen über eine ultra-kompakte Kopf-Statuszeile kondensiert werden. Krisen werden als flache, gestapelte Event-Banner im bestehenden Warnungs-Container gerendert, die durch strikte Einhaltung der Farbinvarianten (`warn` für Fristen/Ultimaten, `loss` für akute Schocks) sofortige Orientierung stiften, ohne nervöse Popups zu erzwingen.
- **Konkreter Design-Vorschlag 1: Minimalistischer Makro-Ticker (Head-Bar):** Eine einzeilige, horizontale Ticker-Leiste direkt unter der Datumsanzeige mit drei kompakten Pills: EZB-Zins (z. B. `Zins: 5,5 %`), Inflation (`Inf: 2,8 %`) und Konjunkturzyklus (`Boom ↗` in `accent`). Details öffnen sich auf Klick in einem fokussierten Drawer-Sheet, wodurch das Dashboard vertikal keinen Millimeter wächst.
- **Konkreter Design-Vorschlag 2: Krisen-Banner mit Aktions-Micro-CTA:** Streikdrohungen und Grippewellen nutzen das Design-Token `warn` (`text-warn bg-raised`) mit Countdown-Badge und integriertem Inline-Button (z. B. „Schlichten (500 €)“), während ungelöste Katastrophen erst bei Schadenseintritt zu `loss` eskalieren. Dadurch bleibt der visuelle Schock kontrolliert und spielerisch handhabbar.
- **Konkreter Design-Vorschlag 3: Prestige-Rangfortschritt (Next-Rival Gauge):** Über der Rich-List visualisiert ein 3px feiner, progressiver Gradient-Balken (`accent`) den prozentualen Vermögensabstand zum nächsten Rivalen (z. B. `68 % auf dem Weg zu Rang #11`). Dies verleiht dem Aufstieg spürbaren Glamour und Ehrgeiz, ohne neuen UI-Clutter zu erzeugen.
