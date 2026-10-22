# Empire — Lessons Learned, Fehler-Vermeidung & System-Regeln

> **Zweck dieses Dokuments:**  
> Dieses Dokument dient als verbindliches Regelwerk und Wissensspeicher für Entwickler und alle KI-Sub-Agents.  
> Hier werden vergangene Fehler, Fehlschläge, Stolperfallen und unverrückbare System-Voraussetzungen festgehalten, damit **kein Fehler zweimal gemacht wird** und der Projektkontext glasklar bleibt.

---

## 🛑 1. Kritische Stolperfallen & Frühere Fehler (Pitfalls)

### 1.1 Abhängigkeiten & Installation (`npm install`)
- **Fehler:** Ein einfaches `npm install` bricht mit Fehlercode `ERESOLVE` ab.
- **Ursache:** Die Vorlagen-Bibliothek `better-auth@~1.6.30` besitzt eine unaufgelöste Peer-Dependency auf `vitest@^2.0.0 || ^3.0.0 || ^4.0.0`, während im Root `@vitejs/devtools-vitest` mit Vite 8/Vitest 5 läuft.
- **Verbindliche Regel:** Befehle zur Paketinstallation **müssen immer** mit `npm install --legacy-peer-deps` ausgeführt werden. Auf Windows-Umgebungen stets `npm.cmd` verwenden (da PowerShell ExecutionPolicy `.ps1` blockiert).

### 1.2 TypeScript & UI-Komponenten-Typen
- **Fehler:** `error TS2322: Type '"accent"' is not assignable to type '"gain" | "warn" | "loss" | "muted" | undefined'`.
- **Ursache:** Die `Badge`-Komponente (`src/components/ui/badge.tsx`) unterstützte den Farbton `"accent"` nicht, obwohl dieser in mehreren Screens genutzt wurde.
- **Verbindliche Regel:** `Badge` muss immer den Ton `"accent"` mit `text-accent bg-accent/15` unterstützen.
- **Fehler:** `indInfo.competitionTone === "loss"` schlug fehl (`TS2367`).
- **Ursache:** `competitionTone` in `src/game/sim.ts` ist strikt typisiert als `"gain" | "muted" | "warn"` (es gibt kein `"loss"`).

### 1.3 Viewport- & Layout-Regeln (Responsive Design)
- **Fehler:** Bei 768 px Bildschirmbreite (Tablet Hochformat) kollabierte das Layout völlig; Text in Dashboards wurde unleserlich (`Gutha...`, `Aus Untern...`).
- **Ursache:** Die Desktop-Sidebar wurde ab `md:` (768px) gerendert (`w-60` = 240px), wodurch dem Hauptinhalt nur noch 528px blieben.
- **Verbindliche Regel:** Die Desktop-Sidebar darf **erst ab `lg:` (1024px)** eingeblendet werden. Auf Tablets (768px bis 1023px) wird die mobile Leiste (Bottom-Navigation) genutzt, damit die Dashboards volle Breite haben.

### 1.4 Navigation & UI-Hierarchie
- **Fehler:** Doppelter Zurück-Button (`< Zurück` im Header und `< Titel` in der Seiten-BackBar).
- **Verbindliche Regel:** Wenn eine Unteransicht (`inSubView = true`) aktiv ist, darf in der oberen Header-Zeile **kein** Zurück-Button gerendert werden, da die Ansicht ihre eigene `BackBar` besitzt.

### 1.5 Toast-Positionierung
- **Fehler:** Toasts erschienen oben zentriert (`top-center`) und verdeckten die zentrale Spielzeit-Uhr (`Tag 1/360`), Pause-Buttons und Titel.
- **Verbindliche Regel:** Der Sonner-Toaster muss immer auf `bottom-right` (Desktop) bzw. `bottom-center` (Mobile mit Mindestabstand `offset={72}`) platziert sein.

### 1.6 Onboarding & leere Zustände (Empty States)
- **Fehler:** Ein neu gegründeter Betrieb startete stumm mit 0 Umsatz; Spieler dachten, das Spiel sei abgestürzt, und klickten auf inaktive Buttons.
- **Verbindliche Regel:**
  1. Jeder neu gegründete Betrieb zeigt eine klare 3-Schritte-Startanleitung.
  2. Abhängige Buttons (`Lieferant`, `Bestellen`, `Preis`) müssen visuell deaktiviert (`disabled={!def}`) sein, solange kein Produkt im Slot zugewiesen ist.

### 1.7 Client-State: Vermögensberechnung (`netWorth(s)` vs `s.netWorth`)
- **Fehler:** Zugriff auf `s.netWorth` in Komponenten oder Aktionen schlägt mit `TS2339: Property 'netWorth' does not exist on type 'Store'` fehl.
- **Ursache:** Das Gesamtvermögen wird im Zustand-Store nicht als statisches Feld persistiert, sondern deterministisch und reaktiv über die Helferfunktion `netWorth(s)` aus Privatkasse, Kassen aller Betriebe, Warenlagern, Aktien und Krediten errechnet.
- **Verbindliche Regel:** In Komponenten und Berechnungen immer `import { netWorth } from "@/game/sim"` importieren und `netWorth(s)` aufrufen.

### 1.8 Multiplikatoren-Konsistenz in der Spielsimulation
- **Fehler:** Eine Diskrepanz zwischen der Absatz-Vorschau in der UI und den echten stündlichen Verkäufen führt zu Spieler-Frust.
- **Ursache:** Werden Boni (z.B. Standort-Synergien oder Rabatte für Großketten) nur in `estimateProductHourlySales` oder nur in `operateHour` eingerechnet, weichen Simulation und Anzeige voneinander ab.
- **Verbindliche Regel:** Alle Multiplikatoren (Standort-Synergien, Ketten-Skalierung, Hygiene, Ruf) müssen in `src/game/sim.ts` exakt synchron in beiden Pfaden (`estimateProductHourlySales` und `operateHour`) angewendet werden. Großketten-Großhandelsrabatte (-8 %) müssen in `companyUnitCost` und `offeringUnitCost` zentral verankert sein.

### 1.9 Scrolling in Tests & DOM-Hierarchie (`AppShell`)
- **Fehler:** `window.scrollBy(...)` in automatisierten QA-Tests scrollt den Bildschirminhalt nicht.
- **Ursache:** Das `window`-Objekt hat keine Scrollbars; der Scroll-Container ist das übergeordnete `<main>`-Element mit `overflow-y-auto`.
- **Verbindliche Regel:** In DOM-Manipulationen oder Playwright-Skripten immer `document.querySelector('main')?.scrollBy(0, ...)` verwenden.

### 1.10 Spieltag-Ermittlung (`readClock(s).day` vs `s.day`)
- **Fehler:** Zugriff auf `s.day` in UI-Komponenten schlägt mit `TS2339: Property 'day' does not exist on type 'Store'` fehl.
- **Ursache:** Die Simulation speichert die Uhrzeit kontinuierlich in `gameMinutes`. Der aktuelle Tag des 360-Tage-Jahres wird deterministisch durch `readClock(s).day` berechnet.
- **Verbindliche Regel:** Stets `import { readClock } from "@/game/clock"` importieren und `readClock(s).day` aufrufen.

### 1.11 Lizenzen im Spielzustand (`st.licenses` ist ein String-Array)
- **Fehler:** `st.licenses['imbiss'] = true` führt dazu, dass `st.licenses.includes(industry)` fehlschlägt und Gründungen mit *"Zuerst die Imbiss-Lizenz kaufen"* abbrechen.
- **Ursache:** Lizenzen werden im State als `licenses: IndustryId[]` (Array) gespeichert, nicht als Dictionary / Record.
- **Verbindliche Regel:** Immer prüfen über `st.licenses.includes(industry)` und hinzufügen via `st.licenses.push(industry)` bzw. `buyIndustryLicense()`.

### 1.12 Simulations-Zeitsteuerung im Store (`state.advance(minutes)`)
- **Fehler:** Aufruf von `state.tick()` schlägt mit `TypeError: state.tick is not a function` fehl.
- **Ursache:** Die Simulationsfortschreibung im Store ist über `advance(minutes: number)` gekapselt.
- **Verbindliche Regel:** In Tests oder Zeitsteuerungen immer `state.advance(minutes)` aufrufen (z. B. `state.advance(60)` für eine Betriebsstunde).

### 1.13 Auto-Order Optimierung: Meldebestand & Cash-Aware Sizing
- **Fehler:** Feste Schwellen (`stock < 25`) und starre Losgrößen (`40 Stk.`) führten bei schnelldrehenden Produkten oder Lieferzeiten zu Ausverkäufen (Lagerbestand fiel auf 0). Bei knapper Firmenkasse schlug die Bestellung zudem komplett mit *"Unternehmenskasse reicht nicht"* fehl.
- **Verbindliche Regel:**
  1. Auto-Order nutzt immer die dynamische Formel `calculateAutoOrderThreshold`:  
     $\text{Meldebestand} = \text{Lead Time Demand} + \text{Sicherheitsbestand}$.
  2. Bei knapper Kasse wird die Bestellmenge anteilig auf die maximal bezahlbare Stückzahl (`Math.floor(cash / unitCost)`) heruntergerechnet (bis `minOrderQty`), anstatt den Nachkauf komplett scheitern zu lassen.

---

## 🔒 2. Architektonische Invarianten (Nicht verletzen!)

1. **Client-Authoritative State:**
   - Der gesamte Spielzustand liegt im Zustand-Store (`src/game/store.ts`) und serialisiert nach `localStorage` (`empire.save.v2`).
   - Keine Spielzustände direkt in `window` oder Komponenten ablegen.
2. **Erhalt der Backend-Infrastruktur:**
   - Dateipfade wie `src/lib/auth/`, `src/lib/db.ts`, `migrations/` und `server/` dürfen **nicht** gelöscht werden. Sie dienen als Vorbereitung für spätere Cloud-Spielstände und Benutzerkonten.
3. **Simulations-Reihenfolge:**
   - Berechnungen (Zinsen, Verkäufe, Nachfrage, Mieten) gehören ausschließlich in funktionale Helfer in `src/game/sim.ts`.
   - Der Store (`src/game/store.ts`) führt die Zustandsmutationen aus und dispatched die UI-Updates.
4. **Kompilierungs-Pflicht:**
   - Nach jeder Code-Änderung **muss** `npm.cmd run typecheck` ausgeführt werden. Ein Commit oder Meilenstein-Abschluss mit Compiler-Warnungen oder Fehlern ist unzulässig.

---

## 📝 3. Dokumentations-Workflow für Agenten

Vor jeder Änderung:
1. `docs/PROJECT_STATUS.md` und `docs/LESSONS_LEARNED.md` lesen.
2. Plan erstellen oder aktualisieren.

Nach jeder Änderung:
1. `npm.cmd run typecheck` ausführen und verifizieren.
2. `docs/WORKFLOW_LOG.md` mit den konkreten Änderungen aktualisieren.
3. `docs/PROJECT_STATUS.md` auf den neuesten Stand bringen.
