# Empire — Projektstatus & Wissensbasis

> **Zweck dieses Dokuments:**  
> Dieses Dokument ist die zentrale Informationsquelle für den aktuellen Entwicklungsstand, offene Aufgaben und wichtige System-Zustände von **Empire**.  
> **Für Entwickler und Sub-Agents:** Vor jeder Aufgabe zuerst diese Datei lesen, um Kontext und Historie zu verstehen. Nach jeder abgeschlossenen Aufgabe aktualisieren!

---

## 📌 Aktueller Projektstatus
- **Projektphase:** Sprint 5 — Manager-Hygiene-Automatisierung, Flexibler Kreditmarkt & Lieferanten-Clamping
- **Datum:** 22. Oktober 2026
- **Status:** **Erfolgreich implementiert, getestet & verifiziert (Sprint 5 abgeschlossen)**
- **Kompilierung:** TypeScript `npm.cmd run typecheck` ➔ **0 Fehler (Exit-Code 0)**
- **Build & Dev:** Vite 8.3 / React 19 / TanStack Start / Tailwind v4 / Zustand 5 (100 % autark, `dist/` ohne Agent-Code)
- **Test-Status:** Automatisierte Persona-Playtests, E2E-Playthrough (23 Tage) und Sprint-5-Verifikationssuite aktiv und grün.

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
- [x] **Sprint 3.1 & 3.2: Dynamisches Balancing, Schieberegler & Mobile-Harmonisierung (Erledigt):**
  - [x] Faires Lieferanten-Bailout (450 € beim Imbiss) mit 3-Stufen-Rehabilitation (40 % Startlaune, 60 % Kapazität)
  - [x] Flexibler Schieberegler für Start-Betriebskasse (500 € – 3.000 €) mit 3-stufiger Ampel in Schritt 3
  - [x] Beseitigung der 0-€-Miet-Anomalie am Hauptbahnhof (faire ~36–40 €/Tag Miete)
  - [x] Korrektur der Standort-Anzeige (dynamischer Standortname statt statischem „0 € (Kiez)“)
  - [x] Dezente gelbe Notification-Dots an Tabs bei Handlungsbedarf
  - [x] Mobile Daumenzonen-Floater für 1-Tap-Reinigung und Sortimentsprüfung
- [x] **Sprint 4: Komplett-Spieler-Playthrough (Tag 1 bis 23) & Gameplay-Analyse (Erledigt):**
  - [x] 13 chronologische Meilenstein-Screenshots generiert
  - [x] Durchlauf von Gründung (Imbiss) über Filialkette, Café, Trendshop, Aktien, Krypto bis zur Eigentumswohnung
  - [x] 5 akute Schmerzpunkte identifiziert und im interaktiven Report dokumentiert
- [x] **Sprint 5: Manager-Hygiene, Flexibler Kreditmarkt & Lieferanten-Clamping (Erledigt):**
  - [x] Manager-Hygiene-Routine: Automatische Reinigung rund um die Uhr bei Hygiene < 80 % (40 € aus Firmenkasse, +22 % Sauberkeit)
  - [x] Transparente UI-Badges für automatische Hygiene im Betriebs- und Teamfenster
  - [x] Flexibler Bankkreditmarkt: 3 Darlehensstaffeln (Betriebsmittel 11,5 %, Unternehmer 7,8 %, Großinvestition 5,4 %)
  - [x] Interaktiver Kreditaufnahme-Dialog im Finanz-Screen mit Kreditauswahl, Slider, Schnellwahltasten und Verwendungszweck (Privat / Firma)
  - [x] Lieferanten-Bestellobergrenze (Clamping): Automatische Kappung auf `maxOrderQty` statt Abbruch mit Fehlerhinweis
  - [x] Wahrung der legalen Unternehmenstrennung: Verzicht auf unrealistische Quertransfers; Dokumentation realistischer Holding-/Darlehenskonzepte
- [x] **Sprint 6 (Evolution): Dynamische Makroökonomie, Hintergrund-Wirtschaft & Dividenden-Politik (Erledigt):**
  - [x] Konjunkturzyklen (`boom`, `normal`, `recession`) rollieren alle 45–90 Tage mit variierenden EZB-Leitzinsen und Inflationsraten
  - [x] Sektorale Rohstoffmärkte (Fleisch, Getreide, Kaffee, Hardware) beeinflussen dynamisch die Einkaufspreise
  - [x] Organische Rivalen aus der Rich-List mit dynamischen Marktanteilen in den Bezirken
  - [x] Betriebskrisen: Grippewelle und Streik-Ultimatum mit 48h-Vollstillstand bei Missachtung
  - [x] Automatische Dividenden-Ausschüttung aufs Privatkonto (Schalter & %-Slider, 5-Tage-Fixkostenpuffer geschützt) plus 1-Tap-Sofort-Ausschüttung
  - [x] Minimalistischer Makro-Ticker (Head-Bar) mit interaktivem Drawer-Sheet (`MacroDrawer.tsx`)
  - [x] Next-Rival Prestige Gauge über der Rich-List
- [ ] **Nächster Schritt:** Weiterer Ausbau der Holding- & Konzernmechaniken (Gesellschafterdarlehen mit Zinsen, Holding-Cash-Pooling)
