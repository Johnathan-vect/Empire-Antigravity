import { useState } from "react";
import { BarChart3, Building2, Check, ChevronDown, ChevronUp, Flame, Plus, Sparkles, TrendingDown, TrendingUp } from "lucide-react";
import { industryById, productById } from "@/game/catalog";
import {
  type DemandSnapshot,
  getAllIndustryDemands,
  getGlobalMarketDemandInfo,
} from "@/game/sim";
import { useGame } from "@/game/store";
import { money } from "@/lib/format";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { Industry } from "@/game/types";
import { BackBar } from "./chrome";

export function DemandBadge({
  info,
  prefix,
  showDelta = false,
  className,
}: {
  info: DemandSnapshot;
  prefix?: string;
  showDelta?: boolean;
  className?: string;
}) {
  const badgeTone =
    info.tone === "gain"
      ? "gain"
      : info.tone === "warn"
        ? "warn"
        : info.tone === "loss"
          ? "loss"
          : "muted";

  return (
    <Badge
      tone={badgeTone}
      className={cn("tabular whitespace-nowrap shrink-0 gap-1", className)}
    >
      {prefix ? <span className="opacity-80 font-normal">{prefix}</span> : null}
      <span className="font-semibold">
        {info.pct} % {info.arrow}
      </span>
      <span>{info.label}</span>
      {showDelta && info.deltaPct !== 0 ? (
        <span className="opacity-80 text-[10px]">
          ({info.deltaPct > 0 ? `+${info.deltaPct}` : info.deltaPct} %)
        </span>
      ) : null}
    </Badge>
  );
}

export function MarketAnalysisPage() {
  const s = useGame();
  return (
    <div className="mx-auto max-w-3xl space-y-3">
      <div className="flex items-center justify-between gap-2">
        <div className="-mb-4">
          <BackBar
            title="Marktanalyse"
            onBack={() => s.openMarketAnalysis(false)}
          />
        </div>
        <Button
          size="sm"
          onClick={() => s.openFounding(true)}
          className="h-8 px-2.5 text-xs gap-1"
        >
          <Plus className="size-3.5" />
          <span>Neu gründen</span>
        </Button>
      </div>
      <MarketAnalysisSection hideTitle />
    </div>
  );
}

const DISPLAY_IND_NAME: Record<Industry, string> = {
  imbiss: "Imbiss & Streetfood",
  cafe: "Café & Bistro",
  shop: "Einzelhandel & Shop",
};

export function MarketAnalysisSection({ hideTitle = false }: { hideTitle?: boolean } = {}) {
  const s = useGame();
  const industryDemands = getAllIndustryDemands(s);
  const globalDemand = getGlobalMarketDemandInfo(s);

  // Alle Branchen-Fächer sind beim Öffnen der Seite standardmäßig eingefahren (null)
  const [expandedIndustry, setExpandedIndustry] = useState<Industry | null>(null);
  const [showMarketHint, setShowMarketHint] = useState(false);

  // Zähle für jedes Produkt, in wie vielen aktiven Spieler-Betrieben es aktuell angeboten wird
  const activeProductCounts = new Map<string, number>();
  for (const c of s.companies) {
    if (c.status !== "active") continue;
    for (const p of c.products) {
      if (p.enabled) {
        activeProductCounts.set(p.productId, (activeProductCounts.get(p.productId) ?? 0) + 1);
      }
    }
  }

  return (
    <section className="rounded-xl bg-surface p-3 sm:p-4 shadow-[var(--shadow-border)] space-y-2.5">
      {/* Kompakter Header & Globales Marktklima */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 min-w-0">
          <BarChart3 className="size-4 text-accent shrink-0" />
          {!hideTitle ? (
            <h2 className="font-display text-base sm:text-lg tracking-tight text-fg truncate">
              Marktanalyse & Trends
            </h2>
          ) : (
            <span className="text-xs uppercase tracking-wider text-muted font-medium">
              Branchen & Konkurrenzdruck
            </span>
          )}
        </div>
        <div className="flex items-center gap-1.5">
          <DemandBadge info={globalDemand} prefix="Klima:" />
          {(s.market.pulseNote || s.market.yearNote) ? (
            <button
              type="button"
              onClick={() => setShowMarketHint((v) => !v)}
              className="rounded-md bg-raised px-2 py-0.5 text-[11px] text-muted hover:text-fg border border-[var(--border-subtle)] cursor-pointer"
            >
              {showMarketHint ? "Impuls ▲" : "Impuls ▼"}
            </button>
          ) : null}
        </div>
      </div>

      {/* Einklappbarer Markt-Impuls / Begründung */}
      {showMarketHint && (s.market.pulseNote || s.market.yearNote) ? (
        <div className="rounded-lg bg-raised px-2.5 py-2 text-[11px] border border-[var(--border-subtle)] flex items-start gap-2">
          <Sparkles className="size-3.5 text-accent shrink-0 mt-0.5" />
          <div className="space-y-0.5 min-w-0">
            {s.market.pulseNote ? (
              <p className="text-fg font-medium leading-snug">{s.market.pulseNote}</p>
            ) : null}
            {s.market.yearNote ? (
              <p className="text-muted leading-snug">
                Jahr {s.year}: {s.market.yearNote}
              </p>
            ) : null}
          </div>
        </div>
      ) : null}

      {/* Einheitliche Branchen-Zeilen: Links gleich große Branchen-Kachel | Rechts daneben gut lesbare Konkurrenz-Kachel */}
      <div className="space-y-2">
        {industryDemands.map((indInfo, idx) => {
          const topProdDef = productById(indInfo.topProduct.productId);
          const isExpanded = expandedIndustry === indInfo.industry;
          const isLeading = idx === 0;
          const playerCompaniesInInd = s.companies.filter(
            (c) => (c.industry ?? "imbiss") === indInfo.industry,
          ).length;

          return (
            <div key={indInfo.industry} className="space-y-1.5">
              {/* Nebeneinander: Branchen-Kachel (links) + Konkurrenz-Feld (rechts) in exakt gleicher Höhe */}
              <div className="grid grid-cols-[1fr_98px] sm:grid-cols-[1fr_128px] gap-2 items-stretch">
                {/* 1. Branchen-Kachel (immer exakt 68px hoch, identisches 2-Zeilen-Layout) */}
                <button
                  type="button"
                  onClick={() =>
                    setExpandedIndustry(isExpanded ? null : indInfo.industry)
                  }
                  className={cn(
                    "h-[68px] w-full rounded-xl border px-3 py-2 text-left flex flex-col justify-between transition-colors cursor-pointer min-w-0",
                    isExpanded
                      ? "bg-raised/80 border-accent/50"
                      : "bg-raised/35 border-[var(--border-subtle)] hover:bg-raised/60",
                  )}
                >
                  {/* Zeile 1: Rang + Name + Betriebe + Nachfrage + Pfeil */}
                  <div className="flex items-center justify-between gap-1.5 min-w-0">
                    <div className="flex items-center gap-1.5 min-w-0 flex-1">
                      <span
                        className={cn(
                          "inline-flex h-5 items-center gap-0.5 rounded px-1.5 text-[10px] font-semibold shrink-0 tabular",
                          isLeading
                            ? "bg-gain/15 text-gain"
                            : "bg-surface text-muted",
                        )}
                      >
                        {isLeading ? <Flame className="size-2.5" /> : null}
                        #{idx + 1}
                      </span>
                      <span className="font-semibold text-xs sm:text-sm text-fg truncate">
                        {DISPLAY_IND_NAME[indInfo.industry]}
                      </span>
                      {playerCompaniesInInd > 0 ? (
                        <span className="inline-flex h-5 items-center gap-0.5 rounded bg-surface px-1.5 text-[10px] text-muted shrink-0 tabular">
                          <Building2 className="size-2.5" />
                          {playerCompaniesInInd}
                        </span>
                      ) : null}
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <DemandBadge info={indInfo} className="text-[10px] sm:text-[11px] py-0.5 px-1.5" />
                      <div className="flex size-5 sm:size-6 items-center justify-center rounded bg-surface text-muted border border-[var(--border-subtle)]">
                        {isExpanded ? (
                          <ChevronUp className="size-3.5" />
                        ) : (
                          <ChevronDown className="size-3.5" />
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Zeile 2: Einzeiliges Top-Produkt (bricht nie um, alle Kacheln gleich groß) */}
                  <div className="flex items-center justify-between gap-2 text-[11px] text-muted tabular min-w-0">
                    <span className="truncate">
                      Top-Produkt: <b className="text-fg">{topProdDef.name}</b>{" "}
                      <span
                        className={cn(
                          "font-semibold",
                          indInfo.topProduct.tone === "gain"
                            ? "text-gain"
                            : indInfo.topProduct.tone === "warn"
                              ? "text-warn"
                              : indInfo.topProduct.tone === "loss"
                                ? "text-loss"
                                : "text-fg",
                        )}
                      >
                        ({indInfo.topProduct.pct} % {indInfo.topProduct.arrow})
                      </span>
                    </span>
                    <span className="hidden sm:inline text-[10px] text-faint shrink-0">
                      {isExpanded ? "Zuklappen" : "Produkte zeigen"}
                    </span>
                  </div>
                </button>

                {/* 2. Konkurrenz-Kachel rechts neben der Branchen-Kachel (exakt 68px hoch, groß & gut lesbar) */}
                <button
                  type="button"
                  onClick={() =>
                    setExpandedIndustry(isExpanded ? null : indInfo.industry)
                  }
                  className={cn(
                    "h-[68px] rounded-xl border px-2.5 py-1.5 flex flex-col justify-between text-left transition-colors cursor-pointer",
                    isExpanded
                      ? "bg-raised/80 border-accent/50"
                      : "bg-raised/35 border-[var(--border-subtle)] hover:bg-raised/60",
                  )}
                  title={`Konkurrenzdruck in ${DISPLAY_IND_NAME[indInfo.industry]}: ${indInfo.competitionPct} % (${indInfo.competitionLabel})`}
                >
                  <span className="text-[10px] uppercase tracking-wider text-muted font-medium block truncate">
                    Konkurrenz
                  </span>
                  <div className="flex items-baseline justify-between gap-1">
                    <span className="tabular font-display font-bold text-base sm:text-lg text-fg leading-none">
                      {indInfo.competitionPct} %
                    </span>
                  </div>
                  <span
                    className={cn(
                      "text-[11px] font-semibold truncate block leading-tight",
                      indInfo.competitionTone === "gain"
                        ? "text-gain"
                        : indInfo.competitionTone === "warn"
                          ? "text-warn"
                          : "text-fg",
                    )}
                  >
                    {indInfo.competitionLabel}
                  </span>
                </button>
              </div>

              {/* Ausgeklappte, schmale Produkt-Zeilen unter der Branchen-Zeile */}
              {isExpanded ? (
                <div className="rounded-xl border border-accent/35 bg-surface/80 p-2 space-y-1">
                  {indInfo.products.map((prodInfo, pIdx) => {
                    const pDef = productById(prodInfo.productId);
                    const activeCount = activeProductCounts.get(prodInfo.productId) ?? 0;
                    const baseMargin = pDef.fairPrice - pDef.baseCost;

                    return (
                      <div
                        key={prodInfo.productId}
                        className={cn(
                          "rounded-lg bg-raised px-2.5 py-1.5 text-xs border flex items-center justify-between gap-2",
                          pIdx === 0
                            ? "border-gain/35"
                            : "border-[var(--border-subtle)]",
                        )}
                      >
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5">
                            <span className="text-[10px] font-mono tabular text-muted">
                              #{pIdx + 1}
                            </span>
                            <span className="font-medium text-fg text-xs truncate">
                              {pDef.name}
                            </span>
                            {activeCount > 0 ? (
                              <span className="inline-flex items-center gap-0.5 rounded bg-surface px-1 py-0 text-[10px] text-accent shrink-0 tabular">
                                <Check className="size-2.5" /> {activeCount}×
                              </span>
                            ) : null}
                          </div>
                          <div className="text-[10px] text-muted tabular truncate">
                            VK {money(pDef.fairPrice)} · EK {money(pDef.baseCost)} · Marge +{money(baseMargin)}
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          {prodInfo.deltaPct !== 0 ? (
                            <span
                              className={cn(
                                "text-[10px] tabular font-medium hidden sm:inline-flex items-center gap-0.5",
                                prodInfo.deltaPct > 0 ? "text-gain" : "text-loss",
                              )}
                            >
                              {prodInfo.deltaPct > 0 ? (
                                <TrendingUp className="size-2.5" />
                              ) : (
                                <TrendingDown className="size-2.5" />
                              )}
                              {prodInfo.deltaPct > 0 ? `+${prodInfo.deltaPct}%` : `${prodInfo.deltaPct}%`}
                            </span>
                          ) : null}
                          <DemandBadge info={prodInfo} className="text-[11px] py-0.5 px-2" />
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : null}
            </div>
          );
        })}
      </div>
    </section>
  );
}
