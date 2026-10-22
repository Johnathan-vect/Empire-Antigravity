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

### 1.14 Zustand Store Snapshot Immutability in Skripten & Tests
- **Fehler:** Aufruf von `const st = window.__EMPIRE_STORE__.getState()`, gefolgt von einer Aktion `st.foundCompany(...)` und anschließendem Lesezugriff auf `st.companies` liest noch den alten Zustand aus, in dem die Firma fehlt.
- **Ursache:** Zustand ersetzt bei `set(...)` den gesamten State-Objektbaum immutabel durch ein neues Objekt. Das zuvor gespeicherte `st` referenziert den veralteten Snapshot.
- **Verbindliche Regel:** Nach jeder Store-Aktion immer erneut `const fresh = window.__EMPIRE_STORE__.getState()` aufrufen, um den aktuellen Zustandsbaum zu erhalten.

### 1.15 Store Action Methodensignaturen & Namenskonventionen
- **Fehler:** Aufrufe von `placeOrder`, `hireManager`, `repayLoan` oder vertauschten Argumenten (`foundCompany(industry, location, ...)` bzw. `hireEmployee(appId, companyId)`) schlagen zur Laufzeit fehl.
- **Verbindliche Regel:** Exakte Signaturen in `src/game/store.ts` beachten:
  1. `foundCompany: (name: string, industry: Industry, locationId: LocationId, equity: number, extra: number, scale?: CompanyScaleId)`
  2. `orderStock: (companyId: string, productId: string, qty: number) => OrderOutcome`
  3. `hireEmployee: (companyId: string, applicantId: string) => string | null`
  4. `toggleManager: (companyId: string) => string | null` (kein `hireManager`/`fireManager`)
  5. `extraPayment: (loanId: string, amount: number) => string | null` (kein `repayLoan`)
  6. `openCompany: (companyId: string | null) => void` (Schließen durch Übergabe von `null`)

### 1.16 Gründungsfinanzierung & Kreditlimit-Obergrenze
- **Fehler:** Beim Gründen höherwertiger Branchen (z.B. Einzelhandel mit 32.000 € Gründungsgebühr) mit zu geringem Eigenkapital (z.B. 18.000 €) entsteht ein Kreditbedarf von 14.000 €. Zusammen mit bestehenden Vorbelastungen übersteigt dies das Start-Kreditlimit (15.000 €) und bricht mit *"Kreditlimit überschritten"* ab.
- **Verbindliche Regel:** Bei Gründungsassistenten und Testläufen muss das Eigenkapital so dimensioniert sein, dass `fee - equity <= availableCredit` gilt. Bei Einzelhandel empfiehlt sich mindestens 25.000–32.000 € Eigenkapital.

### 1.17 Lieferanten-Lieferkapazität (`maxOrderQty`)
- **Fehler:** Bestellungen oberhalb von `supplier.maxOrderQty` (z.B. 80 Stk. bei einem Cap von 55 Stk.) schlagen mit einem Fehlerabbruch fehl.
- **Verbindliche Regel:** Bestellungen im UI und in der Logik immer auf `Math.min(requestedQty, supplier.maxOrderQty)` deckeln und dem Spieler visuelles Feedback zur Obergrenze geben (`clampedFrom` in `OrderOutcome`).

### 1.18 Manager 24/7 Hygiene-Steuerung & Zeitfenster
- **Fehler:** Tägliche manuelle Reinigungen für mehrere Betriebe führten zu Mikromanagement-Frust. Wird die Manager-Hygiene nur während der Öffnungszeiten (8–22 Uhr) ausgeführt, können Betriebe morgens mit schlechter Hygiene eröffnen.
- **Verbindliche Regel:** Die automatische Reinigung durch den Manager (`c.manager && c.hygiene < 80`) wird in `runHour` stündlich rund um die Uhr geprüft. Sie bucht 40 € aus der Firmenkasse ab und stellt +22 % Hygiene (bis max. 100 %) wieder her. So starten Betriebe auch morgens stets sauber in den Tag.

### 1.19 Flexibler Kreditmarkt mit Zinsstufen & Zweckbindung
- **Fehler:** Kredite konnten im Finanz-Screen nur passiv getilgt, aber nicht aktiv bei der Hausbank aufgenommen werden. Zudem hatten alle Kredite denselben pauschalen Zinssatz ohne Risiko-Differenzierung.
- **Verbindliche Regel:** Kredite werden in 3 transparente Kategorien unterteilt:
  1. *Schneller Betriebsmittel-Kredit* (11,5 % p.a., bis 3.000 €, sofort verfügbar)
  2. *Klassischer Unternehmerkredit* (7,8 % p.a., bis 15.000 €, ab Ruf ≥ 15)
  3. *Großinvestitions-Darlehen* (5,4 % p.a., bis 85.000 €, ab Ruf ≥ 25 & NetWorth ≥ 50.000 €)
  Bei Firmenkrediten wird das Geld direkt der Firmenkasse gutgeschrieben und `company.debt` via `syncCompanyDebt` synchronisiert. Bei Privatkrediten fließt das Geld in `st.cash`.

### 1.20 Reale Unternehmenstrennung (Legal Entity Invariant)
- **Fehler:** Der Wunsch nach schnellem Geldtransfer zwischen zwei separaten Firmen verführt zu einem direkten „Transfer von Firma A nach Firma B“-Button. In der Realität sind dies jedoch getrennte juristische Personen.
- **Verbindliche Regel:** Es gibt **keinen** direkten, unrealistischen Firmen-zu-Firmen-Direkttransfer ohne Buchhaltung. Geldtransfers laufen immer über den Inhaber (Privatentnahme `transfer(companyId, -amount)` -> Privateinlage `transfer(targetCompanyId, +amount)`) oder in Zukunft über formelle Gesellschafterdarlehen mit Zins- und Tilgungsvereinbarung.

---

## 🔒 2. Architektonische Invarianten (Nicht verletzen!)

1. **Client-Authoritative State:**
   - Der gesamte Spielzustand liegt im Zustand-Store (`src/game/store.ts`) und serialisiert nach `localStorage` (`empire.save.v2`).
   - Keine Spielzustände direkt in `window` oder Komponenten ablegen.
2. **Erhalt der Backend-Infrastruktur:**
   - Dateipfade wie `src/lib/auth/`, `src/lib/db.ts`, `migrations/` und `server/` dürfen **nicht** gelöscht werden. Sie dienen als Vorbereitung für spätere Cloud-Spielstände und Benutzerkonten.
3. **Rechtliche Trennung von Unternehmen (Corporate Entity Integrity):**
   - Jede gegründete Firma ist eine eigenständige juristische Einheit mit getrennter Kasse, eigenem Warenlager, eigenem Personal und eigener Verbindlichkeit.
   - Kein magischer konzerninterner Quertransfer ohne steuerlich/rechtlich saubere Abwicklung (Einlage/Entnahme oder Gesellschafterdarlehen).
4. **Simulations-Reihenfolge:**
   - Berechnungen (Zinsen, Verkäufe, Nachfrage, Mieten) gehören ausschließlich in funktionale Helfer in `src/game/sim.ts`.
   - Der Store (`src/game/store.ts`) führt die Zustandsmutationen aus und dispatched die UI-Updates.
5. **Kompilierungs-Pflicht:**
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
