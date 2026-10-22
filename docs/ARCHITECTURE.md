# Empire — System-Architektur

> **Für Entwickler und Sub-Agents:**  
> Dieses Dokument beschreibt die Code-Struktur, Datenflüsse und mathematischen Modelle des Spiels.

---

## 1. Technologiestack
- **Frontend-Framework:** React 19.2 + TanStack Start 1.168
- **Styling:** Tailwind CSS v4 (`@tailwindcss/vite`)
- **State Management:** Zustand v5 (`src/game/store.ts`)
- **Simulation:** Reine funktionale TypeScript-Module (`src/game/sim.ts`)
- **UI-Komponenten:** Radix UI Primitives + Lucide Icons + Sonner Toasts
- **Build-Tool:** Vite 8.3
- **Test-Tools:** Node native test runner (`node --test`) + Playwright

---

## 2. Directory-Übersicht

```text
Empire AIstudio/
├── docs/                   # Vollständige Projektdokumentation (Status, Architektur, Roadmap, Log)
├── migrations/             # SQL-Migrationen für PGLite/Neon (Auth-Vorhaltung)
├── public/                 # Statische Assets (Icons, SVG-Logos für Aktien, Bilder)
├── scripts/                # Build- und Environment-Helfer (with-app-env, migrate, etc.)
├── server/                 # Server-Entrypoint für TanStack Start / Nitro
├── src/
│   ├── components/
│   │   ├── empire/         # Kern-Spiel-Views (Dashboard, BusinessScreen, StockScreen, CompanyDetail etc.)
│   │   └── ui/             # Wiederverwendbare Basis-Komponenten (Button, Badge, Slider, Input etc.)
│   ├── game/
│   │   ├── catalog.ts      # Statische Stammdaten (Produkte, Branchen, Aktien, Standorte, Preise)
│   │   ├── clock.ts        # Spielzeit-Umrechnung (Minuten, Stunden, Tage, Jahre)
│   │   ├── events.ts       # Zufallsereignisse und Marktimpulse
│   │   ├── save.ts         # Serialisierung, Deserialisierung und Migrationen des Spielstands
│   │   ├── sim.ts          # Kernsimulationsschleife (tickMinutes, GuV, Dividenden, Kreditzinsen)
│   │   ├── store.ts        # Zustand Store mit allen Spieler-Aktionen (Actions)
│   │   └── types.ts        # TypeScript-Typdefinitionen (GameState, Company, Offering, Stock etc.)
│   ├── lib/                # Hilfsfunktionen (Formatierung, Auth-Client, PGLite-DB-Anbindung)
│   └── routes/             # TanStack Router (__root.tsx, index.tsx)
```

---

## 3. Die Simulations-Schleife (`Simulation Loop`)

Die Spielwelt läuft in realer Zeit ab, gesteuert über einen `requestAnimationFrame`-Loop in [`AppShell.tsx`](file:///c:/Users/Ja201/Desktop/Empire%20AIstudio/src/components/empire/AppShell.tsx):
- **Geschwindigkeiten:**
  - `0×`: Pause (Stopp)
  - `1×`: 8 reale Minuten = 1 Spieltag (1440 Spielminuten = 480 reale Sekunden ➔ 3 Spielminuten pro reale Sekunde)
  - `2×`: 6 Spielminuten pro reale Sekunde
  - `5×`: 15 Spielminuten pro reale Sekunde
- **Zeittaktung (`tickMinutes` in `sim.ts`):**
  - Alle 15 Spielminuten: Lieferungs-Prüfung (`processDeliveries`)
  - Jede Spielstunde (`isOpenHour` 08:00–22:00): Verkauf von Waren, Nachfrageberechnung, Aktienkursbewegungen (`tickStocks`, `tickCryptos`)
  - Jeden Spieltag (Mitternacht): Lebenshaltungskosten (`LIVING_PER_DAY`), tägliche Kreditzinsen (10 % p. a. auf Restschuld), Mieteinnahmen & Mietabzüge, Mitarbeiterlöhne, Zufallsereignisse.

---

## 4. Persistenz & Speicherformat
- Gespeichert wird in `localStorage` unter dem Schlüssel `empire.save.v2`.
- `GameState` enthält: Bargeld, Unternehmen (Produkte, Lieferanten, Mitarbeiter, Kasse), Aktien- & Krypto-Holdings, Immobilien, Sammlungen, Schulden, Ledger (Buchungshistorie) und Karriere-Statistiken.
- Automatisches Speichern bei Tab-Wechsel (`visibilitychange`) und vor dem Verlassen der Seite (`pagehide`).
