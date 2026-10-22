import { X, TrendingUp, TrendingDown, Minus, Building2, Store, Coffee, Shirt, ShieldAlert } from "lucide-react";
import { useGame } from "@/game/store";
import { DEFAULT_MACRO, DEFAULT_DISTRICT_COMPETITORS, locationById } from "@/game/catalog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export function MacroDrawer() {
  const show = useGame((s) => s.ui.showMacroDrawer);
  const openMacroDrawer = useGame((s) => s.openMacroDrawer);
  const macro = useGame((s) => s.market.macro) ?? DEFAULT_MACRO;
  const competitors = useGame((s) => s.market.districtCompetitors) ?? DEFAULT_DISTRICT_COMPETITORS;

  if (!show) return null;

  const cycleTone =
    macro.cycle === "boom" ? "gain" : macro.cycle === "recession" ? "warn" : "muted";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative flex flex-col w-full max-w-xl max-h-[90vh] bg-bg border border-border rounded-xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-surface/50">
          <div className="flex items-center gap-2">
            <div className="size-2 rounded-full bg-accent animate-pulse" />
            <h2 className="font-display text-base sm:text-lg tracking-tight text-fg">
              Makroökonomie & Zentralbankbericht
            </h2>
          </div>
          <button
            type="button"
            onClick={() => openMacroDrawer(false)}
            className="flex size-7 items-center justify-center rounded-md text-muted hover:bg-raised hover:text-fg transition-colors cursor-pointer"
          >
            <X className="size-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs sm:text-sm">
          {/* Zyklus Hero */}
          <div className="p-3.5 rounded-lg border border-border bg-raised/40 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-muted text-xs uppercase tracking-wider">Konjunkturphase</span>
              <Badge tone={cycleTone}>
                {macro.cycle === "boom" ? "Boom ↗" : macro.cycle === "recession" ? "Rezession ↘" : "Normal →"}
              </Badge>
            </div>
            <p className="font-medium text-fg text-sm">{macro.trendLabel}</p>
            <p className="text-xs text-muted">
              Zyklus-Perspektive: Noch ca. <span className="text-fg font-medium">{macro.cycleDaysRemaining} Tage</span> bis zur nächsten Zins- und Konjunkturbewertung durch die Zentralbank.
            </p>
          </div>

          {/* Indikatoren Grid */}
          <div className="grid grid-cols-2 gap-2.5">
            <div className="p-3 rounded-lg border border-border bg-surface/30">
              <span className="text-muted text-[11px] block">EZB-Leitzins (Kredite)</span>
              <p className="tabular font-display text-xl text-fg mt-0.5">
                {(macro.interestRate * 100).toFixed(1)} %
              </p>
              <p className="text-[11px] text-muted mt-1 leading-snug">
                Beeinflusst die Tilgungskosten fremdfinanzierter Filialen und Unternehmenskredite.
              </p>
            </div>

            <div className="p-3 rounded-lg border border-border bg-surface/30">
              <span className="text-muted text-[11px] block">Verbraucher-Inflation</span>
              <p className="tabular font-display text-xl text-fg mt-0.5">
                {(macro.inflationRate * 100).toFixed(1)} %
              </p>
              <p className="text-[11px] text-muted mt-1 leading-snug">
                Bestimmt den marktweiten Preisdruck auf Gewerbemieten und Rohstoff-Einstandspreise.
              </p>
            </div>
          </div>

          {/* Rohstoffmärkte (Commodities) */}
          <div className="space-y-2">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted">
              Sektorale Rohstoff-Märkte (B2B Vorprodukte)
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <div className="p-2.5 rounded-md border border-border bg-surface/20">
                <span className="text-[11px] text-muted flex items-center gap-1">🥩 Fleisch</span>
                <span className="tabular font-medium text-fg text-sm block mt-0.5">
                  {(macro.commodities.meat * 100).toFixed(0)} %
                </span>
                <span className="text-[10px] text-muted">Hotdog & Döner</span>
              </div>

              <div className="p-2.5 rounded-md border border-border bg-surface/20">
                <span className="text-[11px] text-muted flex items-center gap-1">🌾 Getreide</span>
                <span className="tabular font-medium text-fg text-sm block mt-0.5">
                  {(macro.commodities.grain * 100).toFixed(0)} %
                </span>
                <span className="text-[10px] text-muted">Pommes & Gebäck</span>
              </div>

              <div className="p-2.5 rounded-md border border-border bg-surface/20">
                <span className="text-[11px] text-muted flex items-center gap-1">☕ Kaffee</span>
                <span className="tabular font-medium text-fg text-sm block mt-0.5">
                  {(macro.commodities.coffeeBeans * 100).toFixed(0)} %
                </span>
                <span className="text-[10px] text-muted">Barista-Sortiment</span>
              </div>

              <div className="p-2.5 rounded-md border border-border bg-surface/20">
                <span className="text-[11px] text-muted flex items-center gap-1">📱 Hardware</span>
                <span className="tabular font-medium text-fg text-sm block mt-0.5">
                  {(macro.commodities.hardware * 100).toFixed(0)} %
                </span>
                <span className="text-[10px] text-muted">Trendshop & Audio</span>
              </div>
            </div>
          </div>

          {/* Organische Konkurrenten */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-muted">
                Aktive Konkurrenten in den Stadtteilen
              </h3>
              <span className="text-[11px] text-muted">{competitors.length} Rivalen erfasst</span>
            </div>

            <div className="divide-y divide-border/50 border border-border rounded-lg bg-surface/20 overflow-hidden">
              {competitors.map((comp) => {
                const loc = locationById(comp.locationId);
                return (
                  <div key={comp.id} className="p-2.5 flex items-center justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <span className="font-medium text-fg truncate">{comp.name}</span>
                        <span className="text-[11px] text-muted">({comp.rivalName})</span>
                      </div>
                      <p className="text-[11px] text-muted mt-0.5">
                        Standort: {loc.name} · Ruf {comp.reputation}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <Badge tone="accent">{comp.marketSharePct} % Marktanteil</Badge>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-border bg-surface/50 flex justify-end">
          <Button size="sm" variant="secondary" onClick={() => openMacroDrawer(false)}>
            Schließen
          </Button>
        </div>
      </div>
    </div>
  );
}
