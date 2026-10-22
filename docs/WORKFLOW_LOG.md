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

