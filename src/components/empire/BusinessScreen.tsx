import { useState } from "react";
import { BarChart3, Building2, Check, GitMerge, Layers, Lock, Plus, Sparkles, Users } from "lucide-react";
import { toast } from "sonner";
import {
  INDUSTRIES,
  MERGERS,
  companyScaleById,
  industryById,
  locationById,
  mergerById,
} from "@/game/catalog";
import { companyDebtTotal, getCompanyDemandInfo, getIndustryDemandInfo, netWorth } from "@/game/sim";
import { useGame } from "@/game/store";
import { money } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { CompanyDetail } from "./CompanyDetail";
import { FoundingFlow } from "./FoundingFlow";
import { DemandBadge, MarketAnalysisPage } from "./MarketAnalysis";
import { statusLabel, statusTone } from "./chrome";
import { cn } from "@/lib/utils";

type BizSubTab = "companies" | "mergers";

export function BusinessScreen() {
  const s = useGame();
  const [subTab, setSubTab] = useState<BizSubTab>("companies");
  const [customNames, setCustomNames] = useState<Record<string, string>>({});

  if (s.ui.showFounding) return <FoundingFlow />;
  if (s.ui.showMarketAnalysis) return <MarketAnalysisPage />;
  if (s.ui.companyId) {
    const c = s.companies.find((x) => x.id === s.ui.companyId);
    if (c) return <CompanyDetail companyId={c.id} />;
  }

  const totalCompanyCash = s.companies.reduce((sum, c) => sum + c.cash, 0);
  const totalTodayRevenue = s.companies.reduce((sum, c) => sum + c.todayRevenue, 0);
  const totalTodayProfit = s.companies.reduce(
    (sum, c) => sum + (c.todayRevenue - c.todayExpenses),
    0,
  );
  const activeCompanies = s.companies.filter((c) => c.status === "active");

  return (
    <div className="mx-auto max-w-3xl space-y-4 sm:space-y-5">
      <header className="flex flex-wrap items-end justify-between gap-2.5">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl tracking-tight">Unternehmen</h1>
          <p className="mt-0.5 text-xs sm:text-sm text-muted">
            Baue dein Firmen-Portfolio auf — vom Kiez-Imbiss über Ladenketten bis zu Konzernfusionen.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => s.openMarketAnalysis(true)}
            className="gap-1.5 h-8 px-2.5 text-xs"
          >
            <BarChart3 className="size-3.5 text-accent" />
            <span>Marktanalyse</span>
          </Button>
          <Button
            size="sm"
            onClick={() => s.openFounding(true)}
            className="gap-1.5 h-8 px-2.5 text-xs"
          >
            <Plus className="size-3.5" />
            <span>Gründen</span>
          </Button>
        </div>
      </header>

      {/* Sub-Navigation: Meine Betriebe | Unternehmensfusionen */}
      <div className="grid grid-cols-2 gap-1.5 rounded-xl bg-raised p-1.5 text-xs">
        <button
          type="button"
          onClick={() => setSubTab("companies")}
          className={cn(
            "flex items-center justify-center gap-1.5 rounded-lg py-2 font-medium transition-colors cursor-pointer",
            subTab === "companies"
              ? "bg-surface text-fg shadow-sm"
              : "text-muted hover:text-fg",
          )}
        >
          <Building2 className="size-3.5" />
          <span>Meine Betriebe ({s.companies.length})</span>
        </button>
        <button
          type="button"
          onClick={() => setSubTab("mergers")}
          className={cn(
            "flex items-center justify-center gap-1.5 rounded-lg py-2 font-medium transition-colors cursor-pointer",
            subTab === "mergers"
              ? "bg-surface text-fg shadow-sm"
              : "text-muted hover:text-fg",
          )}
        >
          <GitMerge className="size-3.5" />
          <span>Unternehmensfusionen ({MERGERS.length})</span>
        </button>
      </div>

      {/* Aggregate Overview Metrics in 4er-Reihe */}
      {s.companies.length > 0 ? (
        <div className="grid grid-cols-4 gap-1.5 sm:gap-2">
          <div className="rounded-xl bg-surface p-2 sm:p-3.5 shadow-[var(--shadow-border)] min-w-0">
            <span className="text-[10px] sm:text-[11px] text-muted block truncate">Betriebe</span>
            <span className="font-semibold tabular text-xs sm:text-sm block truncate">
              {s.companies.length}
            </span>
          </div>
          <div className="rounded-xl bg-surface p-2 sm:p-3.5 shadow-[var(--shadow-border)] min-w-0">
            <span className="text-[10px] sm:text-[11px] text-muted block truncate">Kassen</span>
            <span className="font-semibold tabular text-xs sm:text-sm block truncate">
              {money(totalCompanyCash)}
            </span>
          </div>
          <div className="rounded-xl bg-surface p-2 sm:p-3.5 shadow-[var(--shadow-border)] min-w-0">
            <span className="text-[10px] sm:text-[11px] text-muted block truncate">Umsatz heute</span>
            <span className="font-semibold tabular text-xs sm:text-sm text-gain block truncate">
              +{money(totalTodayRevenue)}
            </span>
          </div>
          <div className="rounded-xl bg-surface p-2 sm:p-3.5 shadow-[var(--shadow-border)] min-w-0">
            <span className="text-[10px] sm:text-[11px] text-muted block truncate">Gewinn heute</span>
            <span
              className={`font-semibold tabular text-xs sm:text-sm block truncate ${totalTodayProfit >= 0 ? "text-gain" : "text-loss"}`}
            >
              {totalTodayProfit >= 0 ? "+" : ""}
              {money(totalTodayProfit)}
            </span>
          </div>
        </div>
      ) : null}

      {subTab === "companies" ? (
        <>
          {/* Lizenzen-Status Bar */}
          <div className="rounded-xl bg-surface p-3 sm:p-4 shadow-[var(--shadow-border)] space-y-1.5">
            <span className="text-[11px] uppercase tracking-wider text-muted block">
              Branchen-Lizenzen ({s.licenses.length} von {INDUSTRIES.length})
            </span>
            <div className="flex flex-wrap gap-1.5">
              {INDUSTRIES.map((ind) => {
                const owned = s.licenses.includes(ind.id);
                const indDemand = getIndustryDemandInfo(s, ind.id);
                return (
                  <Badge
                    key={ind.id}
                    tone={owned ? "gain" : "muted"}
                    className="gap-1 text-[11px] py-0.5 px-2 tabular"
                  >
                    <Building2 className="size-3" />
                    <span>{ind.name}</span>
                    <span className="opacity-80">
                      · {indDemand.pct} % {indDemand.arrow}
                    </span>
                    <span className="opacity-75">{owned ? "✓" : `(${money(ind.licenseFee)})`}</span>
                  </Badge>
                );
              })}
            </div>
          </div>

          {/* Lizenz-Meilensteine & Fortschrittsbalken */}
          {(() => {
            const playerNw = netWorth(s);
            const unownedIndustries = INDUSTRIES.filter((ind) => !s.licenses.includes(ind.id));
            if (unownedIndustries.length === 0) return null;

            return (
              <div className="rounded-xl bg-surface p-4 shadow-[var(--shadow-border)] space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <Lock className="size-3.5 text-accent" />
                    <span className="text-xs font-medium text-fg uppercase tracking-wider">
                      Nächste Branchen-Meilensteine
                    </span>
                  </div>
                  <span className="text-[11px] text-muted">
                    Gesamtvermögen: <b className="text-fg tabular">{money(playerNw)}</b>
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {unownedIndustries.map((ind) => {
                    const progress = Math.min(100, Math.round((playerNw / ind.minNetWorth) * 100));
                    const isUnlocked = playerNw >= ind.minNetWorth;
                    const canAfford = s.cash >= ind.licenseFee;

                    return (
                      <div
                        key={ind.id}
                        className="rounded-lg bg-raised p-3 border border-[var(--border-subtle)] space-y-2 text-xs flex flex-col justify-between"
                      >
                        <div>
                          <div className="flex items-center justify-between gap-1.5">
                            <div className="flex items-center gap-1.5">
                              <span className="font-semibold text-fg">{ind.name}</span>
                              {isUnlocked ? (
                                <Badge tone="gain" className="text-[10px] py-0 px-1.5">
                                  Freigeschaltet
                                </Badge>
                              ) : (
                                <Badge tone="muted" className="text-[10px] py-0 px-1.5 tabular">
                                  Ab {money(ind.minNetWorth)}
                                </Badge>
                              )}
                            </div>
                            <span className="text-[11px] text-muted tabular">
                              Lizenz: <b className="text-fg">{money(ind.licenseFee)}</b>
                            </span>
                          </div>

                          <p className="mt-1 text-[11px] text-muted leading-tight">{ind.blurb}</p>
                        </div>

                        <div className="space-y-1.5 pt-1">
                          <div className="flex items-center justify-between text-[11px] text-muted">
                            <span>
                              {isUnlocked
                                ? "Vermögens-Bedingung erfüllt!"
                                : `Noch ${money(Math.max(0, ind.minNetWorth - playerNw))}`}
                            </span>
                            <span className="tabular font-medium text-fg">{progress} %</span>
                          </div>
                          <div className="h-1.5 w-full overflow-hidden rounded-full bg-surface border border-[var(--border-subtle)]">
                            <div
                              className={cn(
                                "h-full rounded-full transition-all duration-300",
                                isUnlocked ? "bg-gain" : "bg-accent",
                              )}
                              style={{ width: `${Math.max(3, progress)}%` }}
                            />
                          </div>

                          {isUnlocked ? (
                            <div className="pt-1.5 flex items-center justify-between gap-2 border-t border-[var(--border-subtle)]">
                              <span className="text-[10px] text-muted">
                                Privat: <b className="text-fg tabular">{money(s.cash)}</b>
                              </span>
                              <Button
                                size="sm"
                                className="h-7 text-xs px-2.5"
                                disabled={!canAfford}
                                onClick={() => {
                                  const err = s.buyIndustryLicense(ind.id);
                                  if (err) toast.error(err);
                                  else toast.success(`Lizenz für ${ind.name} erfolgreich erworben!`);
                                }}
                              >
                                Lizenz kaufen · {money(ind.licenseFee)}
                              </Button>
                            </div>
                          ) : null}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })()}

          {/* Empty State */}
          {s.companies.length === 0 ? (
            <div className="rounded-xl bg-surface p-5 shadow-[var(--shadow-border)] text-center space-y-2.5">
              <Building2 className="size-8 text-muted mx-auto opacity-50" />
              <h3 className="font-medium text-sm sm:text-base">Noch kein eigenes Unternehmen</h3>
              <p className="text-xs sm:text-sm text-muted max-w-md mx-auto">
                Prüfe über den Button „Marktanalyse“, welche Branche und welche Produkte aktuell im
                Trend liegen, und gründe deinen ersten Betrieb.
              </p>
              <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => s.openMarketAnalysis(true)}
                  className="gap-1.5"
                >
                  <BarChart3 className="size-4 text-accent" />
                  <span>Marktanalyse öffnen</span>
                </Button>
                <Button size="sm" onClick={() => s.openFounding(true)}>
                  Jetzt ersten Betrieb gründen
                </Button>
              </div>
            </div>
          ) : (
            /* Company List */
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h2 className="text-xs font-medium text-muted uppercase tracking-wider">
                  Deine Betriebe
                </h2>
                <button
                  type="button"
                  onClick={() => setSubTab("mergers")}
                  className="text-[11px] font-medium text-accent hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <GitMerge className="size-3" />
                  <span>Fusionen prüfen</span>
                </button>
              </div>
              <ul className="space-y-2">
                {s.companies.map((c) => {
                  const debt = companyDebtTotal(s, c.id);
                  const ind = industryById(c.industry ?? "imbiss");
                  const loc = locationById(c.locationId ?? "kiez");
                  const scale = companyScaleById(c.scale ?? "local");
                  const merger = c.mergerId ? mergerById(c.mergerId) : undefined;
                  const todayP = c.todayRevenue - c.todayExpenses;
                  const compDemand = getCompanyDemandInfo(s, c);

                  return (
                    <li key={c.id}>
                      <button
                        type="button"
                        onClick={() => s.openCompany(c.id)}
                        className="flex w-full items-center justify-between gap-2.5 rounded-xl bg-surface p-3 sm:p-4 text-left shadow-[var(--shadow-border)] hover:bg-raised/70 transition-all duration-150 cursor-pointer"
                      >
                        <div className="space-y-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-1.5">
                            <p className="font-medium text-sm sm:text-base text-fg truncate">
                              {c.name}
                            </p>
                            <Badge tone={statusTone(c.status)} className="px-2 py-0 text-[10px]">
                              {statusLabel(c.status)}
                            </Badge>
                            {c.scale && c.scale !== "local" ? (
                              <Badge tone="accent" className="px-2 py-0 text-[10px] gap-1">
                                <Layers className="size-2.5" />
                                {scale.name}
                              </Badge>
                            ) : null}
                            {loc.synergyIndustry === c.industry ? (
                              <Badge tone="accent" className="px-1.5 py-0 text-[10px] gap-1">
                                <Sparkles className="size-2.5" />
                                {loc.synergyLabel}
                              </Badge>
                            ) : null}
                            {merger ? (
                              <Badge tone="gain" className="px-2 py-0 text-[10px] gap-1">
                                <Sparkles className="size-2.5" />
                                Konzern (+{Math.round(((c.synergyMult ?? 1) - 1) * 100)} %)
                              </Badge>
                            ) : null}
                            <DemandBadge
                              info={compDemand}
                              prefix="Nachfrage:"
                              className="px-2 py-0 text-[10px]"
                            />
                          </div>
                          <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-muted">
                            <span className="truncate">
                              {ind.name} · {loc.name} ·{" "}
                              <b className="text-fg font-medium">Stufe {c.level}/5</b>
                            </span>
                            {c.manager ? (
                              <Badge tone="gain" className="px-1.5 py-0 text-[10px]">
                                Manager
                              </Badge>
                            ) : null}
                            {c.employees.length > 0 ? (
                              <span className="flex items-center gap-0.5 text-[11px] text-muted">
                                <Users className="size-3" />
                                <span>{c.employees.length} MA</span>
                              </span>
                            ) : null}
                          </div>
                        </div>

                        <div className="text-right space-y-0.5 shrink-0">
                          <p className="tabular font-semibold text-sm text-fg">{money(c.cash)}</p>
                          <p
                            className={`tabular text-[11px] ${todayP >= 0 ? "text-gain" : "text-loss"}`}
                          >
                            Heute {todayP >= 0 ? "+" : ""}
                            {money(todayP)}
                          </p>
                          {debt > 0 ? (
                            <p className="text-[10px] text-muted">Schuld: {money(debt)}</p>
                          ) : null}
                        </div>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}
        </>
      ) : (
        /* SUB-TAB: UNTERNEHMENSFUSIONEN */
        <div className="space-y-4">
          <div className="rounded-xl bg-surface p-4 shadow-[var(--shadow-border)] space-y-1">
            <div className="flex items-center gap-2">
              <GitMerge className="size-4 text-accent" />
              <h2 className="font-medium text-sm sm:text-base">
                Unternehmensfusionen & Holding-Konzerne
              </h2>
            </div>
            <p className="text-xs text-muted leading-relaxed">
              Schließe bestehende Betriebe auf geforderter Ausbaustufe zu einer mächtigen
              Konzern-Holding zusammen. Kassen, Personal und Lagerbestände werden gebündelt —
              zusätzlich erhält der Konzern dauerhafte Umsatz-Synergien, Zusatz-Produktplätze und
              Reputation.
            </p>
          </div>

          <div className="space-y-3">
            {MERGERS.map((m) => {
              // Expand requirements by count so each required company slot is checked individually
              const usedIds = new Set<string>();
              const expandedReqs = m.requirements.flatMap((req) =>
                Array.from({ length: req.count }, (_, idx) => ({
                  industry: req.industry,
                  minLevel: req.minLevel,
                  slotIdx: idx,
                })),
              );

              const reqStatus = expandedReqs.map((req) => {
                const match = activeCompanies
                  .filter(
                    (c) =>
                      !usedIds.has(c.id) &&
                      c.industry === req.industry &&
                      c.level >= req.minLevel,
                  )
                  .sort((a, b) => b.level - a.level)[0];
                if (match) usedIds.add(match.id);
                return { req, match };
              });

              const allReqsMet = reqStatus.every((r) => Boolean(r.match));
              const canAfford = s.cash >= m.mergerFee;
              const ready = allReqsMet && canAfford;

              return (
                <div
                  key={m.id}
                  className={cn(
                    "rounded-xl bg-surface p-4 shadow-[var(--shadow-border)] space-y-3 border",
                    ready ? "border-accent/50" : "border-[var(--border-subtle)]",
                  )}
                >
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-accent">
                          {m.subtitle}
                        </span>
                        <Badge tone="gain" className="text-[10px] py-0 px-1.5">
                          +{Math.round((m.synergyMult - 1) * 100)} % Umsatz-Synergie
                        </Badge>
                        {m.bonusSlots > 0 ? (
                          <Badge tone="accent" className="text-[10px] py-0 px-1.5">
                            +{m.bonusSlots} Produktplatz
                          </Badge>
                        ) : null}
                        <Badge tone="accent" className="text-[10px] py-0 px-1.5">
                          +{m.reputationGain} Reputation
                        </Badge>
                      </div>
                      <h3 className="mt-1 font-display text-lg tracking-tight">{m.name}</h3>
                      <p className="mt-0.5 text-xs text-muted leading-relaxed">{m.blurb}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="text-[10px] uppercase tracking-wider text-muted block">
                        Fusionsgebühr
                      </span>
                      <span
                        className={cn(
                          "font-semibold tabular text-sm",
                          canAfford ? "text-fg" : "text-loss",
                        )}
                      >
                        {money(m.mergerFee)}
                      </span>
                    </div>
                  </div>

                  {/* Requirements list */}
                  <div className="space-y-1.5">
                    <span className="text-[10px] uppercase tracking-wider text-muted block">
                      Benötigte Betriebe ({reqStatus.filter((r) => r.match).length}/
                      {reqStatus.length} erfüllt):
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                      {reqStatus.map(({ req, match }, idx) => {
                        const ind = industryById(req.industry);
                        return (
                          <div
                            key={`${m.id}-req-${req.industry}-${idx}`}
                            className={cn(
                              "flex items-center justify-between gap-2 rounded-lg px-2.5 py-2 text-xs border",
                              match
                                ? "bg-gain/10 border-gain/30 text-fg"
                                : "bg-raised border-[var(--border-subtle)] text-muted",
                            )}
                          >
                            <div className="min-w-0">
                              <p className="font-medium truncate">
                                {ind.name} · min. Stufe {req.minLevel}
                              </p>
                            </div>
                            {match ? (
                              <Badge tone="gain" className="shrink-0 gap-1 text-[10px]">
                                <Check className="size-3" />
                                <span className="truncate max-w-[110px]">{match.name}</span>
                              </Badge>
                            ) : (
                              <Badge tone="muted" className="shrink-0 text-[10px]">
                                Fehlt
                              </Badge>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Action row */}
                  <div className="pt-2 border-t border-[var(--border-subtle)] flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2">
                    <Input
                      placeholder={`Konzernname (Standard: ${m.name})`}
                      value={customNames[m.id] ?? ""}
                      onChange={(e) =>
                        setCustomNames({ ...customNames, [m.id]: e.target.value })
                      }
                      maxLength={32}
                      className="h-8 text-xs sm:max-w-xs"
                    />
                    <Button
                      size="sm"
                      disabled={!ready}
                      onClick={() => {
                        const err = s.executeMerger(m.id, customNames[m.id]);
                        if (err) toast.error(err);
                        else {
                          toast.success(
                            `Fusion zu „${customNames[m.id]?.trim() || m.name}“ abgeschlossen!`,
                          );
                          setSubTab("companies");
                        }
                      }}
                      className="gap-1.5 h-8"
                    >
                      <GitMerge className="size-3.5" />
                      <span>Fusion durchführen · {money(m.mergerFee)}</span>
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
