# Empire — Projektstatus & Wissensbasis

> **Zweck dieses Dokuments:**  
> Dieses Dokument ist die zentrale Informationsquelle für den aktuellen Entwicklungsstand, offene Aufgaben und wichtige System-Zustände von **Empire**.  
> **Für Entwickler und Sub-Agents:** Vor jeder Aufgabe zuerst diese Datei lesen, um Kontext und Historie zu verstehen. Nach jeder abgeschlossenen Aufgabe aktualisieren!

---

## 📌 Aktueller Projektstatus
- **Projektphase:** Sprint 3 — Externes Multi-Agenten-Test- & Balancing-System
- **Datum:** 22. Oktober 2026
- **Status:** **Erfolgreich implementiert & verifiziert (Sprint 3 abgeschlossen)**
- **Kompilierung:** TypeScript `npm.cmd run typecheck` ➔ **0 Fehler (Exit-Code 0)**
- **Build & Dev:** Vite 8.3 / React 19 / TanStack Start / Tailwind v4 / Zustand 5 (100 % autark, `dist/` ohne Agent-Code)
- **Test-Status:** Automatisierte Persona-Playtests (Desktop & Mobile) und Headless-Wirtschafts-Simulation aktiv.

---

## 🎮 Was ist Empire?
Empire ist eine deutsche Wirtschaftssimulation. Der Spieler startet als Privatperson mit 25.000 € Guthaben und 15.000 € Kreditlinie. Er kann:
1. **Unternehmen gründen & skalieren:** Imbiss, Café, Einzelhandel — Miete, Einkaufspreise, Lieferantenbeziehungen, Personal, Hygiene, Upgrades und Filialnetz-Expansion steuern.
2. **Am Kapitalmarkt handeln:** Aktien mit Dividenden p. a. und schwankende Kryptowährungen handeln.
3. **Immobilien & Luxusgüter erwerben:** Passives Einkommen durch Mieten und Ansehen (Ruf).
4. **Jahreszyklus meistern:** 360 Tage pro Geschäftsjahr. Ab +10 % Vermögen kann das Jahr vorzeitig beendet werden. Ein Run endet erst bei privater Zahlungsunfähigkeit an der Jahreskante.

---

## 🏗️ Kern-Architektur auf einen Blick
- **State Management:** Zustand Store ([`src/game/store.ts`](file:///c:/Users/Ja201/Desktop/Empire%20AIstudio/src/game/store.ts))
- **Persistenz:** Client-seitig in `localStorage` unter dem Key `empire.save.v2` ([`src/game/save.ts`](file:///c:/Users/Ja201/Desktop/Empire%20AIstudio/src/game/save.ts))
- **Simulations-Clock:** Kontinuierlicher Takt (`requestAnimationFrame`), 8 echte Minuten = 1 Spieltag (1×), Pause (0×), 2×, 5× ([`src/game/clock.ts`](file:///c:/Users/Ja201/Desktop/Empire%20AIstudio/src/game/clock.ts), [`src/game/sim.ts`](file:///c:/Users/Ja201/Desktop/Empire%20AIstudio/src/game/sim.ts))
- **Backend-Schnittstellen (Vorhaltung):** Better-Auth & PGLite unter `src/lib/auth/` und `src/lib/db.ts` für geplante Cloud-Saves und Nutzer-Accounts.

---

## 📋 Aktuelle Aufgaben & Roadmap
- [x] **Sprint 1:** Fundament, Dokumentation & Stabilität (Erledigt)
- [x] **Sprint 2:** Branchen-Ausbau, Standort-Spezialisierung & Filialnetze (Erledigt)
- [x] **Sprint 3:** Externes Multi-Agenten-Test- & Balancing-System (Erledigt)
- [x] **UX/UI Refactor Betriebsfenster & Mehrtages-Kundenstrom:**
  - [x] Hygiene & Sauberkeit oben als 2-Spalten-Duo mit Schnellputz-Aktion
  - [x] GuV & Cashflow harmonisiert mit Direkt-Umschalter und einklappbaren Fixkosten
  - [x] Kompakter Live-Kundenstrom mit einklappbaren Faktoren
  - [x] Grafisches Mehrtages-Balkendiagramm (`CustomerBarChart.tsx`) für Kundenstrom (7 Tage Historie + Heute)
- [x] **Auto-Order Optimierung:**
  - [x] Dynamischer Meldebestand: Lead Time Demand + Sicherheitsbestand basierend auf Verkaufsrate und Lieferzeit
  - [x] Dynamische Bestellcharge für ca. 20 Betriebsstunden
  - [x] Cash-Aware Sizing: Automatische Herunterskalierung auf bezahlbare Höchstmenge bei knapper Kasse
  - [x] Transparente UI im Bestell-Modal und Slot-Badge (`Auto-Order (≤ X Stk.)`)
- [ ] **Nächster Schritt:** Implementierung weiterer Balancing- & Gameplay-Erweiterungen (Lieferanten-Vertragsstrafen, weitere Branchen-Features)
