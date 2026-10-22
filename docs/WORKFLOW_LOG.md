# Empire — Chronologisches Arbeitslog (Workflow Log)

> **Zweck:**  
> Lückenlose Dokumentation aller Änderungen, Refactorings und Fehlerbehebungen.  
> Jeder Eintrag dokumentiert das Datum, den Bearbeiter, die geänderten Dateien und das Ergebnis.

---

## [22.10.2026] — Sprint 1: Fundament, Dokumentation & Stabilität (Abgeschlossen)
**Bearbeiter:** Antigravity (Pair Programming Agent)  
**Ziel:** QA-Audit, Etablierung des Dokumentationssystems, Behebung von TypeScript- und UI-Bugs, Onboarding-Löser.

### 1. Durchgeführte Arbeiten & Code-Änderungen
1. **Dokumentations-Infrastruktur aufgebaut:**
   - `docs/PROJECT_STATUS.md`: Zentraler Statusbericht, Metriken und Kontext für Entwickler/Agents.
   - `docs/ARCHITECTURE.md`: Beschreibung des Stacks, der Simulationsuhr (`tickMinutes`) und Persistenz.
   - `docs/ROADMAP.md`: Langfristige Feature-Roadmap von Sprint 1 bis 5.
   - `docs/WORKFLOW_LOG.md`: Chronologisches Audit-Log.
2. **TypeScript-Fehler behoben:**
   - [`src/components/ui/badge.tsx`](file:///c:/Users/Ja201/Desktop/Empire%20AIstudio/src/components/ui/badge.tsx): `tone` um `"accent"` erweitert (`text-accent bg-accent/15`).
   - [`src/components/empire/MarketAnalysis.tsx`](file:///c:/Users/Ja201/Desktop/Empire%20AIstudio/src/components/empire/MarketAnalysis.tsx): Ungültigen Vergleich `indInfo.competitionTone === "loss"` entfernt.
   - **Ergebnis:** `npm run typecheck` besteht mit **0 Fehlern (Exit-Code 0)**.
3. **UI/UX & Responsiveness optimiert:**
   - [`src/components/empire/AppShell.tsx`](file:///c:/Users/Ja201/Desktop/Empire%20AIstudio/src/components/empire/AppShell.tsx):
     - Sidebar-Breakpoint von `md:` (768px) auf `lg:` (1024px) verlegt. Auf Tablets (768px–1023px) wird nun die Bottom-Nav genutzt, wodurch alle Dashboard-Kacheln volle 768px Breite erhalten und Texte nicht mehr abgeschnitten werden.
     - Header-Zurück-Button in Subviews mit eigener `BackBar` ausgeblendet (Doppel-Button-Bug behoben).
     - Sonner `<Toaster />` von `top-center` auf `bottom-right` verlegt (Header-Navigation und Spieluhr werden nicht mehr überdeckt).
4. **Gameplay-Onboarding (Kaltstart-Löser) implementiert:**
   - [`src/components/empire/CompanyDetail.tsx`](file:///c:/Users/Ja201/Desktop/Empire%20AIstudio/src/components/empire/CompanyDetail.tsx):
     - Motivierender Banner *„Start-Anleitung: 3 Schritte zum ersten Umsatz“* bei Neugründung integriert.
     - Automatische Status-Checks (Produkt gewählt -> Lieferant gebunden -> Ware bestellt).
     - Die Buttons `Lieferant wählen`, `Ware bestellen` und `Preis festlegen` sind bei leerem Slot ausgegraut (`disabled={!def}`), um Fehlklicks zu verhindern.

### 2. Verifikation
- `npm run typecheck`: **Erfolgreich (0 Fehler)**
- Playwright Automation: Desktop-, Tablet- und Smartphone-Screenshots fehlerfrei generiert.
- Kaltstart-Banner und Deaktivierungslogik visuell bestätigt.

---

## [22.10.2026] — Sprint 2.5: UX/UI-Refactor Betriebsdetail & Besucher-Balkendiagramm (Abgeschlossen)
**Bearbeiter:** Antigravity (Pair Programming Agent)  
**Ziel:** Entzerrung der Betriebsdetail-Ansicht (`CompanyDetail.tsx`), Verlegung von Hygiene an die Spitze, Zusammenführung von GuV & Kassenfluss, einklappbare Detailzeilen und grafisches Tages-Balkendiagramm für den Kundenstrom.

### 1. Durchgeführte Arbeiten & Code-Änderungen
1. **Neues Besucher-Balkendiagramm (`src/components/empire/CustomerBarChart.tsx`):**
   - Wiederverwendbare, rein CSS/HTML-basierte SVG-Visualisierung für den täglichen Kundenstrom.
   - Bildet bis zu 7 Tage aus `c.history` plus den aktuellen Spieltag („Heute“) als vertikale Balken ab.
   - Balkenhöhen skalieren dynamisch zum Höchstwert; farbliche Differenzierung (Vortage = Graph-Grün, Heute = Akzent-Leuchten).
   - Tooltips und Achsenbeschriftungen (`Tag 1`, ..., `Heute`) mit Schnitt- und Spitzen-Statistik.
2. **Operative Steuerungs-Zeile (Standort & Hygiene als Duo):**
   - [`src/components/empire/CompanyDetail.tsx`](file:///c:/Users/Ja201/Desktop/Empire%20AIstudio/src/components/empire/CompanyDetail.tsx):
   - Hygiene & Sauberkeit direkt nach oben neben den Standort verlegt (2-spaltiges Grid).
   - Spieler sieht Hygiene-Score, Farb-Balken, Manager-Status und hat den direkten Reinigungs-Button sofort im Blick.
3. **Harmonisierte Finanzen & Tagesergebnis:**
   - Zusammenführung von ehemals zwei separaten Großboxen in eine integrierte Finanzkarte.
   - Header vergleicht *Operatives Ergebnis (GuV)* und *Kassen-Saldo (Heute)* direkt nebeneinander.
   - Segment-Umschalter zwischen GuV und Kassenfluss.
   - Einklappbares Accordion für Fixkosten (Löhne, Manager, Miete) via `ChevronDown`/`ChevronUp`.
4. **Live-Kundenstrom kompakter & weiter unten:**
   - Unter die Finanzen verschoben; kompakte KPI-Kacheln mit reduzierter Höhe.
   - Berechnungsfaktoren und Multiplikatoren sind standardmäßig dezent eingeklappt und per Klick ausklappbar.
   - `CustomerBarChart` nahtlos eingebettet.

### 2. Verifikation & Qualitätssicherung
- `npm.cmd run typecheck`: **0 Fehler (sauberer Durchlauf)**.
- Playwright Automation (`scratch/ux_refactor_verification.mjs` & `scratch/test_barchart_history.mjs`):
  - Desktop- und Smartphone-Verifikation fehlerfrei durchgeführt.
  - Screenshots erstellt: `ux_top_hygiene_finanzen.png`, `ux_barchart_multi_days.png`, `ux_mobile_overview.png`, `ux_mobile_barchart.png`.
  - Browser-Konsole: **0 Fehler**.

### 1. Durchgeführte Arbeiten & Code-Änderungen
1. **Erweiterung von Datenmodell & Katalog (`src/game/types.ts` & `src/game/catalog.ts`):**
   - Neue Standorte registriert: `bahnhof` (Hauptbahnhof / Pendlerknoten, 1,75× Frequenz, +20 % Imbiss-Synergie) und `mall` (Shopping-Mall & Passage, 1,60× Frequenz, +30 % Einzelhandels-Synergie).
   - `LocationDef` um optionale Synergie-Eigenschaften (`synergyIndustry`, `synergyBonus`, `synergyLabel`) erweitert.
   - `SCALE_UPGRADES` und `scaleUpgradeByTarget()` definiert:
     - `smallChain`: 3 Filialen, 1,65× Kundenstrom, Mindeststufe 2, 40.000 € Vermögen, +4 Ruf.
     - `largeChain`: Großfilialnetz, 2,60× Kundenstrom, -8 % dauerhafter Zentralrabatt, Mindeststufe 4, 135.000 € Vermögen, +8 Ruf.
   - `CustomerTrafficBreakdown`-Interface für den Live-Monitor implementiert.

2. **Simulations-Logik & Store-Aktionen (`src/game/sim.ts` & `src/game/store.ts`):**
   - Großketten-Zentrallager: In `companyUnitCost` und `offeringUnitCost` erhalten Betriebe mit `scale === "largeChain"` automatisch 8 % Rabatt auf alle Wareneinkäufe.
   - Standort-Synergien: In `estimateProductHourlySales` und `operateHour` werden passende Branchen-Standort-Paarungen (z.B. Imbiss am Bahnhof oder Café im Flanier-Viertel) mit echten Kundenstrom-Multiplikatoren (+15 % bis +30 %) belohnt.
   - Neue Engine-Funktion `tryUpgradeCompanyScale()` und Store-Aktion `s.upgradeCompanyScale(companyId, targetScale)` implementiert.
   - Echtzeit-Analysefunktion `getCompanyTrafficBreakdown(company, state)` implementiert: Berechnet stündliche Gäste, Auslastung in %, Engpass-Warnungen und Preis-Attraktivität.

3. **UI: Live-Kundenstrom & Besucher-Monitor (`src/components/empire/CompanyDetail.tsx`):**
   - Im Reiter `Lage & GuV` eine prominente, reaktive Karte *„Live-Kundenstrom & Besucher-Monitor“* eingefügt.
   - Zeigt 4 Echtzeit-KPIs: Besucher/Stunde, Ladeneffizienz/Auslastung, Standort-Frequenz und Preis-Attraktivität.
   - Integriert dynamischen Auslastungsbalken und Detailaufschlüsselung aller Multiplikatoren (Standort, Filialnetz, Hygiene, Personaldurchsatz).

4. **UI: Filialnetz & Expansion (`src/components/empire/CompanyDetail.tsx`):**
   - Im Reiter `Ausbau & Team` die Sektion *„Filialnetz & Betriebsgröße (Expansion)“* ergänzt.
   - Zeigt Status aller 3 Expansionsstufen (Einzelbetrieb, Kleine Ladenkette, Große Ladenkette).
   - Prüfliste für Voraussetzungen (Stufe, Vermögen, Firmenkasse), Vorteilsübersicht und Aktionsbutton zum direkten Upgrade.

5. **UI: Lizenz-Meilensteine & Synergien (`src/components/empire/BusinessScreen.tsx` & `src/components/empire/FoundingFlow.tsx`):**
   - `BusinessScreen.tsx`: Neue Kachel *„Nächste Branchen-Meilensteine“* mit visuellen Fortschrittsbalken zu Café & Bistro (45.000 €) und Trendshop (110.000 €) sowie Schnellkauf-Aktion.
   - Firmenkarten in der Betriebsliste zeigen nun aktive Standort-Synergie-Badges (`+20 % Pendler-To-Go-Bonus` etc.).
   - `FoundingFlow.tsx`: Alle 5 Standorte zeigen in Schritt 2 dynamische Branchen-Synergie-Badges und berechnen die resultierende Gesamtfrequenz transparent vor.

### 2. Verifikation & Qualitätssicherung
- `npm run typecheck`: **0 Fehler (sauberer Durchlauf)**.
- Playwright End-to-End-Test (`scratch/sprint2_verification.mjs`):
  - Lizenz-Meilensteine verifiziert & fotografiert (`sprint2_license_milestones.png`).
  - Standort-Synergien in Gründung verifiziert & fotografiert (`sprint2_locations_synergies.png`).
  - Gründung an neuem Standort `bahnhof` erfolgreich durchgeführt.
  - Live-Kundenstrom-Monitor verifiziert & fotografiert (`sprint2_customer_traffic_monitor.png`).
  - Filialnetz-Expansionskarte & Anforderungs-Checkliste verifiziert & fotografiert (`sprint2_scale_expansion_checklist.png`).
  - Browser-Konsole: **0 Fehler / Warnings**.


---

## [22.10.2026] — Sprint 3: Externes Multi-Agenten-Test- & Balancing-System (Abgeschlossen)
**Bearbeiter:** Antigravity (Koordinator) & Sub-Agenten-Team (`persona-anno-economist`, `persona-lazy-mobile`, `persona-design-purist`)  
**Ziel:** Aufbau einer token-sparenden, visuellen und vollständig dokumentierten Multi-Agenten-Testumgebung. Autarkes Spiel ohne Runtime-Agent-Code.

### 1. Durchgeführte Arbeiten & Infrastruktur
1. **Agenten-Infrastruktur aufgebaut (`docs/agent_system/`):**
   - `docs/agent_system/README.md`: Systemdokumentation, Persona-Definitionen und Zero-Footprint-Invariante.
   - `docs/agent_system/REGISTRY.md`: Dynamisches Register aller aktiven Sub-Agents mit Conversation-IDs und Modellen.
   - `docs/agent_system/BUS.md`: Zentraler Audit- und Kommunikations-Bus für P2P-Nachrichten und Beschlüsse.
   - `docs/agent_system/screenshots/`: Verzeichnis für automatisierte In-Game-Screenshots (PNG).
   - `docs/agent_system/scratchpad/`: Puffer für Metriken, Zwischenanalysen und Diffs.
2. **Automatisierte Playtest- & Screenshot-Pipeline (`scripts/qa/playtest_harness.mjs`):**
   - Steuert Playwright/Chromium über lokale Installationen (`channel: "chrome"` / `msedge`).
   - Erstellt automatisierte Screenshots für mobile Ansichten (390×844 px) und Desktop-Ansichten (1280×800 px).
   - Extrahiert harte Ergonomie-Metriken (Scrollhöhe, Viewport-Verhältnis, Klickanzahl).
3. **Ökonomischer Balancing-Runner (`scripts/qa/balance_runner.mjs`):**
   - Trockensimulation der Wirtschaftsformeln in `src/game/sim.ts`.
   - Deckt unfaire Billig-Bailouts auf (180-€-Lieferanten-Rückkauf vs. 650-€-Tagesumsatz).
4. **Sub-Agenten definiert & P2P-Audit durchgeführt:**
   - `persona-anno-economist`: Fordert Anno-1800-Konsequenzprinzip, Skalierung der Rückkaufstrafe (950–1.200 € Imbiss) und 3-Tage-Vertrauensverlust.
   - `persona-lazy-mobile`: Bestätigt 1.00x Dashboard-Scrollhöhe; fordert strikt Sticky-Bottom-Navigation und Tabs für künftige Lieferanten-Features.
   - `persona-design-purist`: Definiert visuelle Invarianten (`warn` für Vertragsrisiken, `accent` für aktive Verträge), schlägt Segmented-Tabs vor und gliedert Details in Drawer aus.

### 2. Verifikation & Qualitätssicherung
- `npm.cmd run typecheck`: **0 Fehler (sauberer Durchlauf)**.
- Standalone Production-Build (`npx.cmd vite build`): **Erfolgreich (Exit-Code 0)**. Garantiert 0 Zeilen Agent-Code im Spiele-Bundle.
- Playtest-Harness: Screenshots fehlerfrei in `docs/agent_system/screenshots/` erzeugt.
- Inter-Agent-Kommunikation: Alle Berichte und P2P-Nachrichten lückenlos in `docs/agent_system/BUS.md` protokolliert.


---

## [22.10.2026] — Sprint 3.1: 10-Minuten-Explorationssitzung der Sub-Agents (Abgeschlossen)
**Bearbeiter:** Sub-Agenten-Team (`persona-anno-economist`, `persona-lazy-mobile`, `persona-design-purist`) unter Leitung von Antigravity  
**Ziel:** Tiefe explorative Playtest-Sitzung in Desktop- & Smartphone-Viewports, visuelle Dokumentation via Playwright und Aufdeckung von Spielbalance- und Usability-Schwachstellen.

### 1. Durchgeführte Arbeiten & Aktionen
- **Automatisierte Playtest-Tour (`scripts/qa/continuous_exploration.mjs`):**
  - Navigation über alle 5 Haupt-Tabs: Dashboard (`home`), Finanzen (`finance`), Börse (`stock`), Besitz (`assets`) und Unternehmen (`biz`).
  - Durchführung einer Neugründung (Imbiss am Hauptbahnhof mit +20 % Synergie) und Zuweisung eines Produkts.
  - Aktivierung des 5×-Zeitraffers und Überwachung von Liquidität und Kassenbestand.
  - Erfassung von 17 hochauflösenden Screenshots in `docs/agent_system/screenshots/exploration/`.
- **Peer-to-Peer Analyse & Berichterstattung:**
  - `persona-anno-economist`: Deckte schwerwiegende 0-€-Miet-Anomalie am Hauptbahnhof auf (`baseRent: 0` in `catalog.ts` hebelt Risiko/Ertrags-Verhältnis aus) sowie statischen Anzeige-Bug („Miete: 0 € (Kiez) / Tag“).
  - `persona-lazy-mobile`: Maß 570 px Scrollstrecke auf mobilen Ansichten und forderte Daumenzonen-Optimierung und Tabs.
  - `persona-design-purist`: Bestätigte vorbildliche visuelle Disziplin auf Desktop und empfahl Segmented-Tabs zur Harmonisierung.

### 2. Verifikation
- 17 Screenshots fehlerfrei erzeugt und im Dateisystem verankert.
- `docs/agent_system/BUS.md` mit allen 3 Abschlussberichten aktualisiert.
- Keine Runtime-Fehler in der Browser-Konsole.

---

## [22.10.2026] — UX/UI Refactor Betriebsübersicht & Mehrtages-Kundenstrom-Diagramm (Abgeschlossen)
**Bearbeiter:** Antigravity  
**Ziel:** Entlastung des überladenen Betriebsfensters, Einklappbarkeit, prominente Platzierung der Hygiene, Harmonisierung von GuV und Kassenfluss sowie grafisches Mehrtages-Balkendiagramm für den Kundenstrom.

### 1. Durchgeführte Arbeiten
1. **Hygiene & Standort nach oben versetzt:**
   - 2-Spalten-Duo (`Standort & Miete` und `Hygiene & Sauberkeit`) direkt oben im Reiter `overview` platziert.
   - Sofortige Reinigungs-Aktion per Schnellbutton.
2. **Harmonisierte Finanzen & Tagesergebnis:**
   - GuV und Cashflow mit Side-by-Side-Gegenüberstellung und Schnell-Tab-Umschalter.
   - Fixkosten-Details in einklappbarem Akkordeon untergebracht.
3. **Kompakter Live-Kundenstrom:**
   - Weiter nach unten verschoben, Einflussfaktoren per Akkordeon ein-/ausklappbar.
4. **Mehrtages-Balkendiagramm (`CustomerBarChart.tsx`):**
   - Balkendiagramm mit Anzeige der letzten 7 Tage plus Heute inklusive Auslastungsfarben und Hover-Tooltips.
5. **Verifikation:**
   - `npm run typecheck`: 0 Fehler.
   - Playwright-Tests auf Desktop (1280px) und Mobile (390px) verifiziert. Screenshots erfasst.

---

## [22.10.2026] — Auto-Order Optimierung: Dynamischer Meldebestand & Cash-Aware Sizing (Abgeschlossen)
**Bearbeiter:** Antigravity  
**Ziel:** Verhindern von Lagerausfällen (Bestand fällt auf 0). Frühzeitiges automatisches Bestellen basierend auf stündlicher Verkaufsrate, Lieferanten-Lieferzeit und Sicherheitsbestand. Cash-aware Skalierung bei knapper Kasse.

### 1. Durchgeführte Arbeiten
1. **Berechnungsgrundlage `calculateAutoOrderThreshold` (`src/game/sim.ts`):**
   - Schätzt den stündlichen Produktabsatz (`hourlySales`) via `estimateProductHourlySales`.
   - Berechnet die Lieferzeit in Stunden (`leadHours`) via `calculateOrderLeadTime`.
   - Ermittelt den Vorlaufbedarf: $\text{leadTimeDemand} = \lceil \text{hourlySales} \times \text{leadHours} \rceil$.
   - Ermittelt den Sicherheitsbestand: $\text{safetyStock} = \max(12, \lceil \text{hourlySales} \times (2.5 + (1 - \text{reliability}) \times 3) \rceil)$.
   - Berechnet dynamischen Meldebestand: $\text{reorderPoint} = \text{leadTimeDemand} + \text{safetyStock}$.
   - Berechnet optimale Zielcharge für ca. 20 Betriebsstunden: $\text{targetBatchSize} = \text{clamp}(\lceil \text{hourlySales} \times 20 \rceil, \text{minQty}, \text{maxQty})$.
2. **Simulation & Cash-Aware Sizing (`runAutoOrder` in `src/game/sim.ts`):**
   - Frühzeitige Nachbestellung wird ausgelöst, sobald $\text{stock} + \text{inTransit} \le \text{reorderPoint}$.
   - Cash-Awareness: Reicht die Unternehmenskasse nicht für die volle Zielcharge, wird die Bestellmenge automatisch auf den leistbaren Höchstwert (`Math.floor(cash / unitCost)`) herunterskaliert (bis `minOrderQty`), anstatt den Nachkauf fehlschlagen zu lassen.
3. **UI-Transparenz (`src/components/empire/CompanyDetail.tsx`):**
   - Slot-Badge zeigt konkreten Schwellenwert: `Auto-Order (≤ X Stk.)`.
   - Im Nachbestell-Modal informiert ein transparenter Kasten über den Meldebestand, Vorlaufbedarf, Sicherheitsbuffer und Zielcharge.
4. **Badge-Komponente (`src/components/ui/badge.tsx`):**
   - Prop `title?: string` ergänzt für informative Tooltips.

### 2. Verifikation & Qualitätssicherung
- `npm run typecheck`: **0 Fehler (sauberer Durchlauf)**.
- Playwright-Test 1 (`scratch/test_auto_order.mjs`):
  - Badge `Auto-Order (≤ 57 Stk.)` auf Slot geprüft.
  - Modal-Berechnungsübersicht geprüft & fotografiert (`auto_order_modal.png`).
  - Simulationszeit um 60 Minuten fortgeschrieben: Nachbestellung automatisch ausgelöst (`pendingDeliveries: 1`, `orderedQty: 80`).
  - Screenshot `auto_order_verified.png` gesichert. Browser-Konsole: 0 Fehler.
- Playwright-Test 2 (`scratch/test_cash_aware_auto_order.mjs`):
  - Knappe Firmenkasse simuliert (nur ~30 € vorhanden).
  - Cash-aware Skalierung verifiziert: Es wurden 26 Einheiten (leistbares Maximum $\ge$ 15 Mindestmenge) bestellt, anstatt mit Kassenfehler abzubrechen.



---

## [22.10.2026] — Sprint 3.2: Dynamisches Balancing, Schieberegler & Mobile-Harmonisierung (Abgeschlossen)
**Bearbeiter:** Antigravity (Koordinator) & Sub-Agenten-Team  
**Ziel:** Umsetzung der genehmigten Sub-Agent-Lösungsvorschläge (faires Lieferanten-Bailout, Startkapital-Slider, Bahnhofs-Miete, Notification-Dots und Mobile-Quick-Actions).

### 1. Durchgeführte Arbeiten & Code-Änderungen
1. **Wirtschafts-Balancing & Katalog (`src/game/catalog.ts` & `src/game/sim.ts`):**
   - `catalog.ts`: `baseRent` für Imbiss auf 20 € gesetzt. Kiez bleibt dank `rentMult: 0` komplett kostenlos, während der Hauptbahnhof faire 36–40 €/Tag Miete kostet (ökonomisches Risiko vs. Ertrag hergestellt).
   - `sim.ts`: Lieferanten-Rückkaufpreis auf faire, motivierende **450 €** beim Imbiss (Café 1.050 €, Shop 2.600 €) feinjustiert.
   - `sim.ts`: Bei Rückkauf startet der Lieferant im Status „Gekränkt“ mit 40 % Zufriedenheit und 60 % Liefermenge (echter Rehabilitations-Lerneffekt statt schmerzloses Freikaufen).
2. **UI & Onboarding-Ergonomie (`src/components/empire/FoundingFlow.tsx`):**
   - Schritt 3 um einen flexiblen Schieberegler für das Start-Umlaufvermögen (500 € bis 3.000 €, Standard 1.200 €) erweitert.
   - Dynamische Liquiditäts-Ampel integriert (`< 800 €` Rot, `800–1.500 €` Akzent/Gelb, `> 1.500 €` Grün).
3. **UI-Korrekturen & Mobile-Ergonomie (`src/components/empire/CompanyDetail.tsx`):**
   - Zeile 396: Hardcodiertes `"0 € (Kiez)"` entfernt und durch dynamischen Standort-Chip `{locDef.name}` mit realer Miete ersetzt.
   - Sub-Navigation: Dezente gelbe Notification-Punkte (`bg-warn animate-pulse`) an Tabs angebracht, wenn Handlungsbedarf vorliegt (z. B. leeres Lager oder Hygiene < 60 %).
   - Mobile Daumenzone: Fixierte Schnellaktions-Leiste (`fixed bottom-16 inset-x-3`) für 1-Tap-Reinigung und Sortimentsprüfung eingebaut.

### 2. Verifikation & Tests
- `npm.cmd run typecheck`: **0 Fehler (sauberer Durchlauf)**.
- Standalone Production-Build (`npx.cmd vite build`): **Erfolgreich (Exit-Code 0)**.
- Playtest-Harness: Neue Screenshots für Slider, Mieten und Tabs fehlerfrei generiert.

---

## [22.10.2026] — Sprint 3.3: Grand Agent Playthrough & Spieldynamik-Roadmap (Abgeschlossen)
**Bearbeiter:** Antigravity (Koordinator) & Sub-Agenten (`persona-anno-economist`, `persona-lazy-mobile`, `persona-design-purist`)  
**Ziel:** Vollständiger E2E-Playthrough-Run über alle Entwicklungsstufen (Gründung bis Rich-List-Endgame) mit visueller Beweisaufnahme, 360-Tage-Audit und Erarbeitung einer dynamischen Gameplay-Roadmap.

### 1. Durchgeführte Arbeiten & Simulationsergebnisse
1. **E2E-Playtest-Harness (`scripts/qa/full_playthrough_run.mjs`):**
   - 15 hochauflösende Screenshots in `docs/agent_system/screenshots/full_run/` generiert.
   - Gründungs-Slider (1.200 €), Produktbelegung, Zeitraffer (5×) und mobile Ergonomie (390×844) automatisiert getestet.
   - Telemetrie in `docs/agent_system/scratchpad/full_playthrough_telemetry.json` abgelegt.
2. **360-Tage-Progression-Audit (`scripts/qa/full_year_sim_audit.ts`):**
   - 1 volles Geschäftsjahr (360 Spieltage) simuliert.
   - End-Vermögen: 134.595 € NetWorth (von 20.000 € Startkapital); Bahnhofs-Grill erwirtschaftet 191.384 € Umsatz und 115.917 € Gewinn.
   - Resilienz-Fix in `src/game/catalog.ts`: `supplierById` mit robustem Fallback auf Standardlieferanten gegen Crashs abgesichert.
3. **Zentraler Befund der Sub-Agents:**
   - Ungestörtes lineares Wachstum ohne Schocks belegt die dringende Notwendigkeit dynamischer Reibung.
   - Gewinne akkumulieren im Betrieb (115.637 €), während persönliches Bargeld (18.800 €) ohne Dividendenüberweisung die Expansion hemmt.

### 2. Eingebrachte Dynamik- & Feature-Vorschläge der Sub-Agents (`docs/agent_system/BUS.md`)
- **`persona-anno-economist`:**
  - *Makroökonomie:* Fluktuierender EZB-Leitzins (4–14 % p.a.) und unvorhersehbare Rohstoffkrisen (+20–40 % Einkaufspreise).
  - *Betriebliche Krisen:* Grippewellen (−50 % Mitarbeiterkapazität) und Streik-Ultimaten bei Niedriglöhnen.
  - *Marktmacht & Konkurrenz:* Großfilialen verknappen Personal im Stadtteil; Großkonzerne starten Preiskämpfe; Monopolprüfungen bei Dominanz.
- **`persona-lazy-mobile`:**
  - *1-Tap-Gewinnüberweisung:* Direkter Daumen-Button zum Abschöpfen von Firmenüberschüssen ins Privatkonto.
  - *Quick-Event-Karten:* Gestapelte Daumen-Aktionskarten zur schnellen Schlichtung von Krisen.
  - *Manager-Automatisierung:* Selbstständige Routine-Reinigung & Bestellausführung für Großketten.
- **`persona-design-purist`:**
  - *Makro-Ticker (Head-Bar):* Einzeilige, dezente Statuszeile unter dem Datum mit 3 Pills (Zins, Inflation, Zyklus) und Drawer-Sheet.
  - *Krisen-Banner mit Micro-CTA:* Flache, gestapelte `warn`-Banner mit Countdown und Inline-Schlichtungsbutton („Schlichten (500 €)“).
  - *Prestige-Rangfortschritt (Next-Rival Gauge):* Feiner 3px-Gradientbalken über der Rich-List zur Visualisierung des Abstands zum nächsten Milliardär.

### 3. Qualitätsgates & Build-Status
- `npm.cmd run typecheck`: **0 Fehler (sauberer Durchlauf)**.
- Standalone Production-Build (`npx.cmd vite build`): **Erfolgreich (Exit-Code 0)**.

---

## [22.10.2026] — Sprint 4: Komplett-Spieler-Playthrough (Tag 1 bis 23) & Gameplay-Analyse (Abgeschlossen)
**Bearbeiter:** Antigravity (Pair Programming mit Benutzer)  
**Ziel:** Simulation eines echten Spielers von Tag 1 (25.000 € Startkapital) bis zum Tycoon-Endgame mit Multi-Company (3 Branchen), Aktien, Krypto, Immobilien und Sammlungen; visuelle Beweisaufnahme und Identifikation von Gameplay-Flaschenhälsen für den Folgeplan.

### 1. Durchgeführte Arbeiten & Simulationsschritte
1. **End-to-End Playthrough-Harness entwickelt (`scripts/qa/full_playthrough.mjs`):**
   - 13 chronologische Meilenstein-Screenshots generiert und sowohl in `docs/agent_system/screenshots/playthrough/` als auch im Artifact-Ordner abgelegt:
     1. `01_start_dashboard.png`: Tag 1 Start mit 25.000 € Liquidität.
     2. `02_founding_dialog.png`: Gründungsassistent Schritt 1.
     3. `03_company_overview_empty.png`: Imbiss-Detailansicht mit Hygiene-Duo.
     4. `04_team_hygiene_set.png`: Mitarbeiter eingestellt & Grundreinigung.
     5. `05_day7_performance.png`: Tag 7 Kundenströme, GuV & Besucherdiagramm.
     6. `06_level2_second_product.png`: Stufe 2 erreicht, 2. Produkt Pommes aktiv.
     7. `07_auto_order_manager_active.png`: Stufe 3, Betriebsleiter & Auto-Order aktiv.
     8. `08_finance_loan_taken.png`: Kreditkonditionen & 500 € Sondertilgung.
     9. `09_stock_crypto_portfolio.png`: Aktiendepot mit Dividendentitel & Krypto.
     10. `10_multi_company_overview.png`: Imbiss-Kette & Café synchron.
     11. `11_retail_trendshop_added.png`: 3. Branche (Trendshop Mall) gegründet.
     12. `12_real_estate_luxury.png`: Eigentumswohnung Kreuzberg & Kunstsammlung.
     13. `13_endgame_richlist.png`: Endgame-Dashboard, Rangliste & passiver Cashflow.
2. **Endgame-Ergebnis nach 23 Spieltagen:**
   - 3 Betriebe aktiv: *Bahnhof Döner & Curry* (Kette), *Café Antigravity*, *Trendshop Neo Lifestyle*.
   - Schuldenstand: 0,00 € (vollständig getilgt).
   - Auto-Order Prüfung: Pommes auf Stufe 3 hielten dauerhaft über 73 Stk. Bestand ohne Leerlauf.
3. **Aufgedeckte Gameplay-Flaschenhälse:**
   - *Multi-Company Micromanagement:* Neue Betriebe starten auf Stufe 1, Manager und Auto-Order sind erst ab Stufe 3 verfügbar -> extremer manueller Klickaufwand bei Folgegründungen.
   - *Hygiene-Klickfalle:* Kein täglicher automatischer Reinigungsabzug via `hygieneBudget` -> tägliche manuelle Klicks nötig.
   - *Kreditmarkt Einbahnstraße:* Im Screen Finanzen können Kredite nur getilgt, aber nicht aktiv bei der Bank aufgenommen werden.
   - *Lieferanten-Cap:* Bestellungen über `maxOrderQty` scheitern per Fehlerabbruch statt automatischer Deckelung.

### 2. Verifikation & Qualitätssicherung
- `npm.cmd run typecheck`: **0 Fehler (sauberer Durchlauf)**.
- Umfassender Bericht als interaktives Markdown-Artefakt bereitgestellt: `full_playthrough_report.md`.

---

## [22.10.2026] — Sprint 5: Manager-Hygiene-Automatisierung, Flexibler Kreditmarkt & Lieferanten-Clamping (Abgeschlossen)
**Bearbeiter:** Antigravity (Pair Programming mit Benutzer)  
**Ziel:** Beseitigung der im Full-Playthrough identifizierten Reibungspunkte: Automatisierung der Betriebsreinigung durch den Manager, flexibler Bankkreditmarkt mit Zinsstaffeln und Kreditauszahlung (Privat/Firma), automatisches Deckeln von Lieferantenbestellungen und Wahrung der rechtlichen Unternehmenstrennung.

### 1. Durchgeführte Arbeiten & Code-Änderungen
1. **Manager-Hygiene-Automatisierung (24/7):**
   - [`src/game/sim.ts`](file:///c:/Users/Ja201/Desktop/Empire%20AIstudio/src/game/sim.ts):
     - In `runHour` stündliche Manager-Routine integriert: Wenn `c.manager` aktiv ist und `c.hygiene < 80` sinkt, beauftragt der Manager bei vorhandener Liquidität (`c.cash >= CLEANING_COST = 40 €`) automatisch eine Reinigung.
     - Stellt +22 % Hygiene (bis max. 100 %) wieder her und führt Buchung im Hauptbuch (`category: "maintenance"`) durch. Läuft rund um die Uhr, sodass Betriebe auch morgens vor 8:00 Uhr sauber öffnen.
   - [`src/components/empire/CompanyDetail.tsx`](file:///c:/Users/Ja201/Desktop/Empire%20AIstudio/src/components/empire/CompanyDetail.tsx):
     - Hygiene-Karte zeigt bei aktivem Manager ein grünes Badge: `Manager reinigt automatisch (≥ 80 %)`.
     - Manager-Karte im Reiter „Ausbau & Team“ dokumentiert den Aufgabenbereich präzise: „Führt Auto-Order aus und beauftragt automatisch Reinigungen (Hygiene ≥ 80 %).“

2. **Flexibler Kreditmarkt & Aktive Darlehensaufnahme:**
   - [`src/game/catalog.ts`](file:///c:/Users/Ja201/Desktop/Empire%20AIstudio/src/game/catalog.ts) & [`src/game/types.ts`](file:///c:/Users/Ja201/Desktop/Empire%20AIstudio/src/game/types.ts):
     - `CREDIT_OFFERS` mit 3 Kreditstaffeln definiert:
       1. *Schneller Betriebsmittel-Kredit*: 11,5 % p.a., max. 3.000 €, sofort ab Tag 1 verfügbar.
       2. *Klassischer Unternehmerkredit*: 7,8 % p.a., max. 15.000 €, ab Ruf ≥ 15.
       3. *Großinvestitions-Darlehen*: 5,4 % p.a., max. 85.000 €, ab Ruf ≥ 25 und Gesamtvermögen ≥ 50.000 €.
     - `LoanCategory` und optionale `label`-Property für Kredite eingeführt.
   - [`src/game/sim.ts`](file:///c:/Users/Ja201/Desktop/Empire%20AIstudio/src/game/sim.ts) & [`src/game/store.ts`](file:///c:/Users/Ja201/Desktop/Empire%20AIstudio/src/game/store.ts):
     - `tryBorrowLoan(state, { offerId, amount, companyId })`: Prüft Voraussetzungen, verfügbaren Rahmen (`creditLimit - usedCredit`), deckelt auf Maximalbetrag und generiert Krediteintrag.
     - Store-Aktion `borrowLoan(offerId, amount, companyId)`: Bucht Geld direkt in `c.cash` (und synchronisiert `company.debt` via `syncCompanyDebt`) oder in `st.cash` (Privat).
   - [`src/components/empire/FinanceScreen.tsx`](file:///c:/Users/Ja201/Desktop/Empire%20AIstudio/src/components/empire/FinanceScreen.tsx):
     - Vollwertiger Darlehensaufnahme-Dialog mit Kreditauswahlkarten, Betragsslider, Schnellwahltasten (1.000 €, 2.500 €, Max), Empfänger-Umschalter (Privatkonto vs. Betriebskasse) und Live-Zinsrechner (Zinsen pro Tag und Jahr).
     - Kreditstatus-Übersicht mit Gesamtschulden, verfügbarem Kreditrahmen und Auslastungsbalken.

3. **Lieferanten-Lieferkapazität Deckelung (Clamping):**
   - [`src/game/sim.ts`](file:///c:/Users/Ja201/Desktop/Empire%20AIstudio/src/game/sim.ts):
     - In `placeProductOrder` führt ein Überschreiten von `supplier.maxOrderQty` nicht mehr zum Fehlerabbruch, sondern kappt die Menge auf `maxQty` und liefert `clampedFrom: requestedQty` im `OrderOutcome` zurück.
   - [`src/components/empire/CompanyDetail.tsx`](file:///c:/Users/Ja201/Desktop/Empire%20AIstudio/src/components/empire/CompanyDetail.tsx):
     - Bestellmodal deckelt das Eingabefeld dynamisch mit `max={supplier.maxOrderQty}` und zeigt bei automatischer Deckelung einen erklärenden Sonner-Toast an.

4. **Rechtliche Unternehmenstrennung (Realismus-Grundsatz):**
   - Auf unrealistische Direkttransfers von Firma zu Firma wurde bewusst verzichtet.
   - Geldflüsse zwischen Unternehmen bleiben an den Gesellschafter gekoppelt (Privatentnahme -> Privateinlage), um die steuerliche und juristische Realität getrennter Kapital-/Personengesellschaften abzubilden.
   - Konzeptionelle Vorbereitung für zukünftige Holding-Strukturen und formelle Gesellschafterdarlehen mit Zins- und Tilgungsplänen.

### 2. Verifikation & Qualitätssicherung
- `npm.cmd run typecheck`: **0 Fehler (sauberer Durchlauf)**.
- Automatisierte QA-Testsuite (`scripts/qa/sprint5_verification.mjs`):
  - Test 1 (Manager-Hygiene): Verifiziert, dass ein Betrieb bei Hygiene 65 % automatisch auf 87 % gereinigt wird und 40 € abgebucht werden.
  - Test 2 (Kreditaufnahme): Verifiziert die Aufnahme von 3.000 € Betriebsmittelkredit direkt in die Betriebskasse mit synchroner Aktualisierung von `company.debt` und Gesamtschulden.
  - Test 3 (Lieferanten-Clamping): Verifiziert, dass eine Bestellung von 120 Einheiten beim Kiez-Lieferanten (Cap 55) sauber auf 55 Stück gekappt und geliefert wird.
  - Screenshots erstellt: `sprint5_01_credit_tiers_open.png`, `sprint5_02_credit_active_list.png`, `sprint5_03_manager_hygiene_badge.png`, `sprint5_04_manager_hygiene_restored.png`.



