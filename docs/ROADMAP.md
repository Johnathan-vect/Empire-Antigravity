# Empire — Produkt-Roadmap

Dieses Dokument skizziert die langfristige Vision, um *Empire* von einem Prototyp zu einem marktreifen, fesselnden Tycoon-Spiel auszubauen.

---

## 🗺️ Meilenstein-Übersicht

```mermaid
flowchart TD
    Sprint1["Sprint 1: Fundament & Onboarding<br/>(TypeScript-Fixes, Docs, Tablet-Layout, Kaltstart-Löser)"] --> Sprint2["Sprint 2: Branchen-Ausbau & Filialnetze<br/>(Café & Bistro, Einzelhandel, Automaten, Ketten)"]
    Sprint2 --> Sprint3["Sprint 3: Tiefe Wirtschaft & Mitarbeiter<br/>(Schichtplanung, Manager-Fähigkeiten, Verhandlungen)"]
    Sprint3 --> Sprint4["Sprint 4: Kapitalmarkt & Großkonzerne<br/>(Short-Selling, feindliche Übernahmen, Börsengänge)"]
    Sprint4 --> Sprint5["Sprint 5: Story, Rivalen & Cloud<br/>(NPC-Konkurrenten, Quests, Cloud-Save & Multiplayer)"]
```

---

### Meilenstein 1: Fundament, Dokumentation & Stabilität (Aktuell)
- [x] Codebase-Audit & QA-Erfahrungsbericht
- [x] Etablierung des Dokumentationssystems (`docs/`)
- [ ] 0 TypeScript-Fehler (`npm run typecheck`)
- [ ] Beseitigung aller Layout-Bugs auf Tablet (768px) und Mobile
- [ ] Beseitigung des doppelten Zurück-Buttons
- [ ] Beseitigung der Toast-Überdeckung im Header
- [ ] Geführter Erst-Start-Banner („3 Schritte zum ersten Umsatz“)

---

### Meilenstein 2: Branchen-Ausbau & Filialen (Geplant)
- Freischaltung von **Café & Bistro** sowie **Einzelhandel & Trendshop** als vollwertige Spielpfade
- Standort-Differenzierung: Fußgängerzone, Hauptbahnhof, Gewerbegebiet mit spürbaren Kundenprofilen
- Filialketten-System mit Logistik-Zentrum und Zentraleinkauf

---

### Meilenstein 3: Management & Personalwesen (Geplant)
- Bewerber-Pool mit Charaktereigenschaften (Zuverlässigkeit, Tempo, Service-Freundlichkeit)
- Schulungen, Prämien und Mitarbeiterzufriedenheit
- Automatisierte Manager-Routinen für Nachbestellungen und Preisanpassungen

---

### Meilenstein 4: Börsen- & Investment-Vertiefung (Geplant)
- Short-Positionen (Leerverkäufe bei überbewerteten Titeln)
- Eigene Unternehmens-Börsengänge (IPO) zur Kapitalbeschaffung
- Firmenfusionen & feindliche Übernahmen von Mitbewerbern

---

### Meilenstein 5: Rivalen, Story & Cloud-Anbindung (Geplant)
- Interaktive NPC-Tycoons als Rivalen auf der Reichen-Rangliste
- Zufalls-Storylines (Gewerbeaufsicht, Skandale, Lieferengpässe)
- Optionale Cloud-Spielstände über das vorbereitete Auth- & DB-System
