# Empire

Deutsche Wirtschaftssimulation. Du startest als Privatperson mit 25.000 € — Imbiss gründen, an der Börse handeln, oder beides.

## Spielstand (dieser Build)

- **Start:** 25.000 € privat, keine Firma, Kreditlimit 15.000 €
- **Lizenz** 1.000 € einmal, danach jeder Imbiss 5.000 € Gründungsgebühr (versunken)
- **Kredit:** Eigenkapital-Regler, 10 % p. a. täglich auf die Restschuld, nur Sondertilgung
- **Jahr:** 360 Tage, vorzeitig ab +10 % Vermögen, Zwang an Tag 360
- **Zeit:** 8 echte Minuten = 1 Spieltag (1×), Pause, 2× / 5×
- Firmenpleite ≠ Run-Ende. Run-Ende nur privat an der Jahreskante

Noch nicht in diesem Schritt: Personal, Manager, Standorte, Immobilien, Krypto, Tutorial, Karriere-UI, komplexe Events.

## Stack

React 19, Vite, TanStack Start, Tailwind v4, Zustand. Spielstand in `localStorage` (`empire.save.v2`).

## Lokal starten

```bash
npm install
npm run dev
```

Vorschau standardmäßig auf Port 8080.

```bash
npm run typecheck
npm run build
```

## Speichern

Neuer Spielstand: Einstellungen → Neuer Spielstand. Die Karrierekarte bleibt.
