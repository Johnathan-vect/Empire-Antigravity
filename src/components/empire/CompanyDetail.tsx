import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  AlertTriangle,
  ArrowRight,
  BarChart3,
  Calendar,
  Check,
  ChevronDown,
  ChevronUp,
  Clock,
  Layers,
  Lock,
  Minus,
  Package,
  Plus,
  Receipt,
  RefreshCw,
  RotateCcw,
  Search,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  Tag,
  TrendingUp,
  Truck,
  UserCheck,
  UserMinus,
  UserPlus,
  Users,
  Wrench,
  X,
} from "lucide-react";
import {
  CLEANING_COST,
  COMPANY_SCALES,
  companyScaleById,
  companyUpgradeCost,
  industryById,
  locationById,
  managerCostPerDayForIndustry,
  productsForIndustry,
  scaleUpgradeByTarget,
  upgradeCostForLevel,
  volumeDiscount,
} from "@/game/catalog";
import {
  APPLICANT_REFRESH_COST,
  calculateAutoOrderThreshold,
  calculateOrderLeadTime,
  calculateOrderMoodGain,
  calculateSupplierBuybackPrice,
  canOrderStockNow,
  canSearchSuppliers,
  companyDebtTotal,
  estimateProductHourlySales,
  getCompanyDemandInfo,
  getCompanyTrafficBreakdown,
  getIndustryDemandInfo,
  getProductDemandInfo,
  inventoryValue,
  netWorth,
  offeringUnitCost,
  orderCooldownRemaining,
  SUPPLIER_MOOD_GROWTH_HOURS,
  supplierSearchCooldownRemaining,
} from "@/game/sim";
import { readClock } from "@/game/clock";
import { useGame } from "@/game/store";
import { money, num, num1 } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { BackBar, statusLabel, statusTone } from "./chrome";
import { DemandBadge } from "./MarketAnalysis";
import { CustomerBarChart } from "./CustomerBarChart";
import { cn } from "@/lib/utils";
import type { CompanyUpgrades, Role } from "@/game/types";

function formatTransitEta(minutesLeft: number): string {
  const clamped = Math.max(15, Math.ceil(minutesLeft / 15) * 15);
  const hours = Math.floor(clamped / 60);
  const mins = clamped % 60;
  if (hours > 0 && mins > 0) return `${hours} Std. ${mins} Min.`;
  if (hours > 0) return `${hours} Std.`;
  return `${mins} Min.`;
}

function roleLabel(role: Role): string {
  switch (role) {
    case "kueche":
      return "Küche & Zubereitung";
    case "theke":
      return "Theke & Service";
    case "allround":
      return "Allrounder";
  }
}

export function CompanyDetail({ companyId }: { companyId: string }) {
  const s = useGame();
  const c = s.companies.find((x) => x.id === companyId);
  const tab = s.ui.companyTab ?? "overview";
  const setTab = s.setCompanyTab;
  const [activeSlotModal, setActiveSlotModal] = useState<{
    slotIdx: number;
    type: "product" | "supplier" | "order" | "price";
  } | null>(null);
  const [customOrderQty, setCustomOrderQty] = useState<number>(25);
  const [xfer, setXfer] = useState("");
  const [pay, setPay] = useState("");
  const [financialTab, setFinancialTab] = useState<"guv" | "cashflow">("guv");
  const [showFinancialDetails, setShowFinancialDetails] = useState<boolean>(false);
  const [showTrafficFactors, setShowTrafficFactors] = useState<boolean>(false);

  useEffect(() => {
    if (!activeSlotModal) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setActiveSlotModal(null);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [activeSlotModal]);

  if (!c) return null;

  const clock = readClock(s);
  const indDef = industryById(c.industry ?? "imbiss");
  const locDef = locationById(c.locationId ?? "kiez");
  const loans = s.loans.filter(
    (l) => l.owner === "company" && l.companyId === c.id && l.remaining > 0.5,
  );
  const debt = companyDebtTotal(s, c.id);
  const enabledOfferings = c.products.filter((p) => p.enabled);
  const yearEvent = s.market.yearEvent;

  // Next level progression requirements
  const nextLevel = Math.min(5, c.level + 1);
  const isMaxLevel = c.level >= 5;
  const levelReq = upgradeCostForLevel(c.industry, nextLevel);
  const revenueProgress = Math.min(100, Math.round((c.lifetimeRevenue / levelReq.revenueReq) * 100));
  const canUpgrade = !isMaxLevel && c.lifetimeRevenue >= levelReq.revenueReq && c.cash >= levelReq.cost;

  // Upgrades
  const upgrades: CompanyUpgrades = c.upgrades ?? {
    equipment: 0,
    storage: 0,
    marketing: 0,
    autoOrder: false,
  };

  // Operational metrics (cleanly separated between Operational P&L and Cashflow)
  const todayGrossProfit = c.todayRevenue - c.todayCogs;
  const grossMarginPct = c.todayRevenue > 0 ? (todayGrossProfit / c.todayRevenue) * 100 : 0;
  const managerDailyCost = c.manager ? managerCostPerDayForIndustry(c.industry) : 0;
  const dailyStaffWages = c.employees.reduce((sum, e) => sum + e.wage, 0);
  const dailyRent = c.rentPerDay > 0 ? c.rentPerDay : locDef.rentMult * indDef.baseRent;
  const dailyFixedCosts = dailyStaffWages + managerDailyCost + dailyRent;
  const operatingDailyResult = todayGrossProfit - dailyFixedCosts;
  const todayCashflow = c.todayRevenue - c.todayExpenses;
  const activeAutoOrderCount = enabledOfferings.filter(
    (p) => p.autoOrder && p.contractedSupplier,
  ).length;

  const tabDotWarnings: Record<string, boolean> = {
    overview: c.hygiene < 60,
    products: c.products.some((p) => p.enabled && (!p.contractedSupplier || p.stock === 0)),
    team: canUpgrade,
    money: c.cash < Math.max(150, dailyFixedCosts * 2),
  };

  const compDemand = getCompanyDemandInfo(s, c);
  const indDemand = getIndustryDemandInfo(s, c.industry ?? "imbiss");

  // Onboarding & Erst-Setup Status
  const totalStock = enabledOfferings.reduce((sum, p) => sum + p.stock, 0);
  const totalPendingDeliveries = enabledOfferings.reduce(
    (sum, p) => sum + (p.pendingDeliveries?.reduce((dSum, d) => dSum + d.qty, 0) ?? 0),
    0,
  );
  const hasContractedSupplier = enabledOfferings.some((p) => Boolean(p.contractedSupplier));
  const hasStockOrDelivery = totalStock > 0 || totalPendingDeliveries > 0;

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <BackBar title={c.name} onBack={() => s.openCompany(null)} />

      {/* Top Badges */}
      <div className="flex flex-wrap items-center gap-2 text-xs">
        <Badge>{indDef.name}</Badge>
        <Badge>{locDef.name}</Badge>
        <Badge>Stufe {c.level}/5</Badge>
        <Badge>
          {enabledOfferings.length}/{c.productSlotMax} Produktplätze
        </Badge>
        <Badge tone={statusTone(c.status)}>{statusLabel(c.status)}</Badge>
        <DemandBadge
          info={compDemand}
          prefix={compDemand.hasActiveProducts ? "Sortiment-Nachfrage:" : "Branchen-Nachfrage:"}
          showDelta
        />
        <Badge tone={indDemand.competitionTone} className="tabular">
          Konkurrenz ({indDef.name}): {indDemand.competitionPct} % · {indDemand.competitionLabel}
        </Badge>
      </div>

      {/* Kaltstart-Guide: 3 Schritte zum ersten Umsatz */}
      {c.status === "active" && (enabledOfferings.length === 0 || !hasStockOrDelivery) ? (
        <div className="rounded-xl border border-accent/35 bg-accent/10 p-3.5 sm:p-4 shadow-[var(--shadow-border)] space-y-3">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Sparkles className="size-4 text-accent shrink-0" />
              <h3 className="font-semibold text-xs sm:text-sm text-fg">
                Start-Anleitung: 3 Schritte zum ersten Umsatz
              </h3>
            </div>
            <Badge tone="accent">Neu gegründet</Badge>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
            {/* Schritt 1: Produkt */}
            <div
              className={cn(
                "rounded-lg p-2.5 border transition-colors",
                enabledOfferings.length > 0
                  ? "bg-gain/15 border-gain/40 text-fg"
                  : "bg-surface border-border text-fg",
              )}
            >
              <div className="flex items-center gap-1.5 font-medium">
                {enabledOfferings.length > 0 ? (
                  <Check className="size-3.5 text-gain shrink-0" />
                ) : (
                  <span className="flex size-4 items-center justify-center rounded-full bg-accent text-[10px] text-accent-fg shrink-0 font-bold">
                    1
                  </span>
                )}
                <span>Produkt wählen</span>
              </div>
              <p className="mt-1 text-[11px] text-muted leading-tight">
                {enabledOfferings.length > 0
                  ? "Hauptprodukt aktiv zugewiesen"
                  : "Wähle das Zielprodukt für Slot #1"}
              </p>
            </div>

            {/* Schritt 2: Lieferant */}
            <div
              className={cn(
                "rounded-lg p-2.5 border transition-colors",
                hasContractedSupplier
                  ? "bg-gain/15 border-gain/40 text-fg"
                  : "bg-surface border-border text-fg",
              )}
            >
              <div className="flex items-center gap-1.5 font-medium">
                {hasContractedSupplier ? (
                  <Check className="size-3.5 text-gain shrink-0" />
                ) : (
                  <span className="flex size-4 items-center justify-center rounded-full bg-accent text-[10px] text-accent-fg shrink-0 font-bold">
                    2
                  </span>
                )}
                <span>Lieferant binden</span>
              </div>
              <p className="mt-1 text-[11px] text-muted leading-tight">
                {hasContractedSupplier
                  ? "Vertragspartner aktiv"
                  : "Konditionen & Liefertreue vergleichen"}
              </p>
            </div>

            {/* Schritt 3: Erstbestellung */}
            <div
              className={cn(
                "rounded-lg p-2.5 border transition-colors",
                hasStockOrDelivery
                  ? "bg-gain/15 border-gain/40 text-fg"
                  : "bg-surface border-border text-fg",
              )}
            >
              <div className="flex items-center gap-1.5 font-medium">
                {hasStockOrDelivery ? (
                  <Check className="size-3.5 text-gain shrink-0" />
                ) : (
                  <span className="flex size-4 items-center justify-center rounded-full bg-accent text-[10px] text-accent-fg shrink-0 font-bold">
                    3
                  </span>
                )}
                <span>Ware bestellen</span>
              </div>
              <p className="mt-1 text-[11px] text-muted leading-tight">
                {hasStockOrDelivery
                  ? "Bestand im Lager oder Zulauf"
                  : "Starte mit 25–50 Stück Erstladung"}
              </p>
            </div>
          </div>

          {tab !== "products" ? (
            <Button
              size="sm"
              className="w-full h-8 text-xs gap-1.5"
              onClick={() => setTab("products")}
            >
              <Package className="size-3.5" />
              <span>Jetzt Sortiment & Slot einrichten</span>
              <ArrowRight className="size-3.5" />
            </Button>
          ) : null}
        </div>
      ) : null}

      {/* Insolvency / Buyback banner */}
      {c.status === "buyback" ? (
        <div className="rounded-xl bg-surface p-4 shadow-[var(--shadow-border)] border-l-4 border-warn">
          <p className="font-medium text-warn">Rückkauf-Fenster aktiv</p>
          <p className="mt-1 text-sm text-muted">
            Betrieb operativ pausiert. Rückkaufpreis: {money(c.buybackPrice ?? 0)} vom Privatkonto.
            Name, Ausbaustufe und Plätze bleiben erhalten.
          </p>
          <Button
            className="mt-3"
            onClick={() => {
              const err = s.buybackCompany(c.id);
              if (err) toast.error(err);
              else toast.success(`${c.name} erfolgreich zurückgekauft!`);
            }}
          >
            Zurückkaufen · {money(c.buybackPrice ?? 0)}
          </Button>
        </div>
      ) : null}

      {/* Streik-Stillstand-Banner */}
      {c.strikeActiveUntil && c.strikeActiveUntil > s.gameMinutes ? (
        <div className="rounded-xl bg-loss/15 border-l-4 border-loss p-4 shadow-[var(--shadow-border)] text-loss space-y-1 animate-pulse">
          <div className="flex items-center gap-2">
            <AlertTriangle className="size-4 shrink-0" />
            <p className="font-semibold text-sm">Streik aktiv · Vollständiger Betriebsstillstand</p>
          </div>
          <p className="text-xs text-loss/90">
            Die Belegschaft befindet sich im Ausstand. Kunden werden nicht bedient (0 € Umsatz) für noch ca.{" "}
            <b>{Math.max(1, Math.round((c.strikeActiveUntil - s.gameMinutes) / 60))} Stunden</b>. Miete und Fixkosten fallen weiter an.
          </p>
        </div>
      ) : null}

      {/* Sticky Sub-Navigation Tabs */}
      <div className="sticky -top-4 z-10 -mx-1 bg-bg/95 px-1 py-1.5 backdrop-blur-sm">
        <div className="grid grid-cols-4 rounded-xl bg-raised p-1 text-[11px] sm:text-sm shadow-[var(--shadow-border)]">
          {(
            [
              ["overview", "Lage & GuV"],
              ["products", "Produkte"],
              ["team", "Ausbau & Team"],
              ["money", "Kasse"],
            ] as const
          ).map(([id, label]) => {
            const hasDot = tabDotWarnings[id];
            return (
              <button
                key={id}
                type="button"
                onClick={() => setTab(id)}
                className={cn(
                  "relative h-8 sm:h-9 rounded-lg px-1 font-medium transition-colors duration-150 text-center truncate flex items-center justify-center gap-1",
                  tab === id ? "bg-surface text-fg shadow-sm" : "text-muted hover:text-fg",
                )}
              >
                <span className="truncate">{label}</span>
                {hasDot ? (
                  <span className="size-1.5 sm:size-2 rounded-full bg-warn animate-pulse shrink-0" />
                ) : null}
              </button>
            );
          })}
        </div>
      </div>

      {/* TAB 1: OVERVIEW & GuV */}
      {tab === "overview" ? (
        <div className="space-y-3 sm:space-y-4">
          {/* Key KPI cards (4-column row on smartphone) */}
          <div className="grid grid-cols-4 gap-1.5 sm:gap-2">
            <Mini label="Kasse" value={money(c.cash)} />
            <Mini label="Schuld" value={money(debt)} />
            <Mini label="Lager" value={money(inventoryValue(c))} />
            <Mini
              label="Hygiene"
              value={`${Math.round(c.hygiene)} / 100`}
              tone={c.hygiene < 30 ? "loss" : c.hygiene < 60 ? "warn" : "gain"}
            />
          </div>

          {/* 1. Operative Steuerungs-Zeile: Standort & Hygiene als 2-spaltiges Duo */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3">
            {/* Standort & Miete */}
            <div className="rounded-xl bg-surface p-3.5 sm:p-4 shadow-[var(--shadow-border)] flex flex-col justify-between gap-2.5">
              <div>
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="text-[11px] uppercase tracking-wider text-muted font-medium">Standort</span>
                  <Badge>{locDef.name}</Badge>
                  {locDef.synergyIndustry === c.industry ? (
                    <Badge tone="accent" className="gap-1 text-[10px]">
                      <Sparkles className="size-2.5" />
                      <span>{locDef.synergyLabel}</span>
                    </Badge>
                  ) : locDef.synergyBonus && !locDef.synergyIndustry ? (
                    <Badge tone="accent" className="gap-1 text-[10px]">
                      <Sparkles className="size-2.5" />
                      <span>{locDef.synergyLabel}</span>
                    </Badge>
                  ) : null}
                </div>
                <p className="mt-1 text-xs text-muted leading-snug">
                  {locDef.blurb}
                </p>
              </div>
              <div className="pt-2 border-t border-[var(--border-subtle)] flex items-center justify-between text-xs tabular">
                <span className="text-muted">
                  Miete ({locDef.name}):{" "}
                  <b className={cn("text-fg", dailyRent > 0 && "text-warn font-semibold")}>
                    {dailyRent === 0 ? "0 € (Kostenfrei)" : `${money(dailyRent)} / Tag`}
                  </b>
                </span>
                <span className="text-gain font-medium">Frequenz {num1(locDef.freqMult)}×</span>
              </div>
            </div>

            {/* Hygiene & Sauberkeit (Direkt oben & sofort reinigbar!) */}
            <div className="rounded-xl bg-surface p-3.5 sm:p-4 shadow-[var(--shadow-border)] flex flex-col justify-between gap-2.5">
              <div>
                <div className="flex items-center justify-between gap-1.5">
                  <div className="flex items-center gap-1.5">
                    <ShieldCheck className="size-4 text-accent" />
                    <span className="text-xs font-semibold text-fg">Hygiene & Sauberkeit</span>
                  </div>
                  <Badge
                    tone={c.hygiene < 30 ? "loss" : c.hygiene < 60 ? "warn" : "gain"}
                    className="tabular text-xs font-semibold px-2 py-0"
                  >
                    {Math.round(c.hygiene)} %
                  </Badge>
                </div>

                {/* Hygiene Progress Bar */}
                <div className="h-2 w-full overflow-hidden rounded-full bg-raised mt-2">
                  <div
                    className={cn(
                      "h-full rounded-full transition-all duration-300",
                      c.hygiene < 30 ? "bg-loss" : c.hygiene < 60 ? "bg-warn" : "bg-gain",
                    )}
                    style={{ width: `${Math.max(5, Math.min(100, c.hygiene))}%` }}
                  />
                </div>
                <p className="mt-1 text-[11px] text-muted leading-tight">
                  {c.manager
                    ? "Betriebsleiter reinigt automatisch, sobald Hygiene unter 80 % fällt (40 € Firmenkasse)."
                    : "Gute Hygiene steigert Gästezufriedenheit. Unter 25 drohen behördliche Kontrollen."}
                </p>
              </div>

              <div className="pt-2 border-t border-[var(--border-subtle)] flex items-center justify-between gap-2">
                <span className="text-[11px] text-muted">
                  {c.manager ? (
                    <Badge tone="gain" className="gap-1 py-0.5 text-[11px]">
                      <ShieldCheck className="size-3" /> Manager reinigt automatisch (≥ 80 %)
                    </Badge>
                  ) : (
                    <span className="text-muted">Manuelle Reinigung</span>
                  )}
                </span>
                <Button
                  size="sm"
                  variant="secondary"
                  className="h-7 text-xs px-2.5"
                  title={c.manager ? "Zusätzliche Sofortreinigung auf 100 %" : "Betrieb manuell reinigen"}
                  disabled={c.status !== "active" || c.cash < CLEANING_COST}
                  onClick={() => {
                    const err = s.cleanHygiene(c.id);
                    if (err) toast.error(err);
                    else toast.success(`Betrieb gründlich gereinigt (+18 Hygiene).`);
                  }}
                >
                  {c.manager ? `Sofort reinigen · ${money(CLEANING_COST)}` : `Reinigen · ${money(CLEANING_COST)}`}
                </Button>
              </div>
            </div>
          </div>

          {/* 2. Harmonisierte Finanzen & Tagesergebnis */}
          <div className="rounded-xl bg-surface p-4 sm:p-5 shadow-[var(--shadow-border)] space-y-4">
            {/* Summary Header comparing GuV and Cashflow */}
            <div className="flex flex-wrap items-center justify-between gap-2.5">
              <div>
                <h3 className="font-medium text-base flex items-center gap-2">
                  <Receipt className="size-4 text-accent" />
                  <span>Finanzen & Tagesergebnis (Heute)</span>
                </h3>
                <p className="text-xs text-muted mt-0.5">
                  Gegenüberstellung von operativem Periodenerfolg (GuV) und tatsächlichem Kassenfluss
                </p>
              </div>

              {/* Big Comparison Badges */}
              <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                <div className="rounded-lg bg-raised px-2.5 py-1 text-right border border-[var(--border-subtle)]">
                  <span className="text-[10px] text-muted uppercase tracking-wider block">Operativ (GuV)</span>
                  <span
                    className={cn(
                      "tabular font-semibold text-xs sm:text-sm",
                      operatingDailyResult >= 0 ? "text-gain" : "text-loss",
                    )}
                  >
                    {operatingDailyResult >= 0 ? "+" : ""}
                    {money(operatingDailyResult)}
                  </span>
                </div>
                <div className="rounded-lg bg-raised px-2.5 py-1 text-right border border-[var(--border-subtle)]">
                  <span className="text-[10px] text-muted uppercase tracking-wider block">Kassen-Saldo</span>
                  <span
                    className={cn(
                      "tabular font-semibold text-xs sm:text-sm",
                      todayCashflow >= 0 ? "text-gain" : "text-warn",
                    )}
                  >
                    {todayCashflow >= 0 ? "+" : ""}
                    {money(todayCashflow)}
                  </span>
                </div>
              </div>
            </div>

            {/* Segment Switcher */}
            <div className="grid grid-cols-2 rounded-lg bg-raised p-1 text-xs">
              <button
                type="button"
                onClick={() => setFinancialTab("guv")}
                className={cn(
                  "py-1.5 rounded-md font-medium transition-colors text-center cursor-pointer",
                  financialTab === "guv"
                    ? "bg-surface text-fg shadow-sm"
                    : "text-muted hover:text-fg",
                )}
              >
                Operative Erfolgsrechnung (GuV)
              </button>
              <button
                type="button"
                onClick={() => setFinancialTab("cashflow")}
                className={cn(
                  "py-1.5 rounded-md font-medium transition-colors text-center cursor-pointer",
                  financialTab === "cashflow"
                    ? "bg-surface text-fg shadow-sm"
                    : "text-muted hover:text-fg",
                )}
              >
                Kassenfluss & Investitionen
              </button>
            </div>

            {/* Active Tab View */}
            {financialTab === "guv" ? (
              <div className="space-y-2 text-xs sm:text-sm">
                <div className="flex items-center justify-between py-1 border-b border-[var(--border-subtle)]">
                  <span className="text-fg">Umsatzerlöse ({num(c.todayCustomers)} Verkäufe)</span>
                  <span className="tabular font-medium text-gain">+{money(c.todayRevenue)}</span>
                </div>
                <div className="flex items-center justify-between py-1 border-b border-[var(--border-subtle)] text-muted">
                  <span>− Wareneinsatz verkaufter Ware (COGS)</span>
                  <span className="tabular text-loss">−{money(c.todayCogs)}</span>
                </div>
                <div className="flex items-center justify-between py-1 border-b border-[var(--border-subtle)] font-medium">
                  <span className="text-fg">
                    = Operativer Rohertrag / Marge ({num1(grossMarginPct)} %)
                  </span>
                  <span
                    className={cn(
                      "tabular",
                      todayGrossProfit >= 0 ? "text-gain" : "text-loss",
                    )}
                  >
                    {todayGrossProfit >= 0 ? "+" : ""}
                    {money(todayGrossProfit)}
                  </span>
                </div>

                {/* Collapsible Fixed Costs Details */}
                {showFinancialDetails ? (
                  <div className="space-y-1.5 pl-3 border-l-2 border-accent/40 py-1.5 my-1 bg-raised/40 rounded-r-lg">
                    <div className="flex items-center justify-between text-muted text-xs">
                      <span>− Personallöhne ({c.employees.length} Mitarbeiter · Tagessatz)</span>
                      <span className="tabular">−{money(dailyStaffWages)}</span>
                    </div>
                    {c.manager ? (
                      <div className="flex items-center justify-between text-muted text-xs">
                        <span>− Betriebsleiter (Manager · Tagessatz)</span>
                        <span className="tabular">−{money(managerDailyCost)}</span>
                      </div>
                    ) : null}
                    {dailyRent > 0 ? (
                      <div className="flex items-center justify-between text-muted text-xs">
                        <span>− Standortmiete ({locDef.name} · Tagessatz)</span>
                        <span className="tabular">−{money(dailyRent)}</span>
                      </div>
                    ) : null}
                  </div>
                ) : null}

                <div className="flex items-center justify-between pt-1">
                  <button
                    type="button"
                    onClick={() => setShowFinancialDetails(!showFinancialDetails)}
                    className="text-xs text-accent hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    {showFinancialDetails ? (
                      <ChevronUp className="size-3.5" />
                    ) : (
                      <ChevronDown className="size-3.5" />
                    )}
                    <span>
                      {showFinancialDetails
                        ? "Fixkosten-Details einklappen"
                        : `Fixkosten aufschlüsseln (${money(dailyFixedCosts)})`}
                    </span>
                  </button>
                  <div className="text-right">
                    <span className="text-xs text-muted mr-2">Tagesergebnis:</span>
                    <span
                      className={cn(
                        "tabular font-bold text-sm sm:text-base",
                        operatingDailyResult >= 0 ? "text-gain" : "text-loss",
                      )}
                    >
                      {operatingDailyResult >= 0 ? "+" : ""}
                      {money(operatingDailyResult)}
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-2 text-xs sm:text-sm">
                <div className="flex items-center justify-between py-1 border-b border-[var(--border-subtle)]">
                  <span className="text-fg">Kasseneingang durch Verkäufe</span>
                  <span className="tabular font-medium text-gain">+{money(c.todayRevenue)}</span>
                </div>
                <div className="flex items-center justify-between py-1 border-b border-[var(--border-subtle)] text-muted">
                  <span>− Gezahlte Einkäufe, Lieferanten, Reinigung & Ausbau</span>
                  <span className="tabular text-loss">−{money(c.todayExpenses)}</span>
                </div>

                <div className="flex items-center justify-between pt-1 font-semibold">
                  <span className="text-fg">= Gebuchter Kassenfluss (Heute)</span>
                  <span
                    className={cn(
                      "tabular",
                      todayCashflow >= 0 ? "text-gain" : "text-loss",
                    )}
                  >
                    {todayCashflow >= 0 ? "+" : ""}
                    {money(todayCashflow)}
                  </span>
                </div>

                {dailyFixedCosts > 0 ? (
                  <p className="text-[11px] text-muted pt-1 border-t border-[var(--border-subtle)] tabular">
                    Hinweis: Die täglichen Fixkosten ({money(dailyFixedCosts)}) werden um 00:00 Uhr beim
                    Tagesabschluss aus der Firmenkasse verbucht.
                  </p>
                ) : null}
              </div>
            )}

            {/* Yesterday's Snapshot Compact Bar */}
            {c.yesterday ? (
              <div className="rounded-lg bg-raised/70 p-2.5 border border-[var(--border-subtle)] text-xs flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] uppercase font-semibold tracking-wider text-muted">
                    Gestern (Tag {c.yesterday.day})
                  </span>
                  <Badge
                    tone={c.yesterday.profit >= 0 ? "gain" : "loss"}
                    className="tabular text-[10px] py-0 px-1.5"
                  >
                    {c.yesterday.profit >= 0 ? "+" : ""}
                    {money(c.yesterday.profit)}
                  </Badge>
                </div>
                <div className="flex items-center gap-3 text-[11px] text-muted tabular">
                  <span>
                    Umsatz: <b className="text-fg">{money(c.yesterday.revenue)}</b>
                  </span>
                  <span>
                    Kosten: <b className="text-fg">{money(c.yesterday.expenses)}</b>
                  </span>
                  <span>
                    Kunden: <b className="text-fg">{num(c.yesterday.customers)}</b>
                  </span>
                </div>
              </div>
            ) : null}
          </div>

          {/* 3. Live-Kundenstrom & Besucher-Monitor (Kompakter & mit Balkendiagramm) */}
          {(() => {
            const traffic = getCompanyTrafficBreakdown(c, s);
            const scaleDef = companyScaleById(c.scale);
            const occTone =
              traffic.occupancyPct >= 85
                ? "gain"
                : traffic.occupancyPct >= 50
                  ? "accent"
                  : traffic.occupancyPct >= 20
                    ? "warn"
                    : "muted";

            return (
              <div className="rounded-xl bg-surface p-4 sm:p-5 shadow-[var(--shadow-border)] space-y-3.5 border border-accent/20">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <h3 className="font-medium text-base flex items-center gap-2">
                      <Users className="size-4 text-accent" />
                      <span>Live-Kundenstrom & Besucher-Monitor</span>
                    </h3>
                    <p className="text-xs text-muted mt-0.5">
                      Echtzeit-Analyse & Besucherverlauf aus Standort, Preisgestaltung und Auslastung
                    </p>
                  </div>
                  <Badge tone={occTone as any} className="tabular font-medium text-xs">
                    {traffic.occupancyLabel}
                  </Badge>
                </div>

                {/* Main Traffic Metrics (Hero Row - Kompakter) */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                  <div className="rounded-lg bg-raised p-2 sm:p-2.5 border border-[var(--border-subtle)]">
                    <span className="text-[10px] uppercase tracking-wider text-muted block">
                      Gäste / Stunde
                    </span>
                    <span className="tabular font-semibold text-base sm:text-lg text-fg mt-0.5 block">
                      ~{num1(traffic.hourlyTraffic)}
                    </span>
                    <span className="text-[10px] text-muted tabular">
                      ~{num(Math.round(traffic.hourlyTraffic * 14))} / Tag
                    </span>
                  </div>

                  <div className="rounded-lg bg-raised p-2 sm:p-2.5 border border-[var(--border-subtle)]">
                    <span className="text-[10px] uppercase tracking-wider text-muted block">
                      Ladenauslastung
                    </span>
                    <span className="tabular font-semibold text-base sm:text-lg text-fg mt-0.5 block">
                      {traffic.occupancyPct} %
                    </span>
                    <span className="text-[10px] text-muted tabular">
                      Max. ~{traffic.capacityMax}/Std.
                    </span>
                  </div>

                  <div className="rounded-lg bg-raised p-2 sm:p-2.5 border border-[var(--border-subtle)]">
                    <span className="text-[10px] uppercase tracking-wider text-muted block">
                      Standort-Frequenz
                    </span>
                    <span className="tabular font-semibold text-base sm:text-lg text-fg mt-0.5 block">
                      {num1(traffic.baseLocationFreq)}×
                    </span>
                    <span className="text-[10px] text-gain tabular truncate block">
                      {traffic.synergyBonusPct > 0
                        ? `+${traffic.synergyBonusPct}% Synergie`
                        : "Standard"}
                    </span>
                  </div>

                  <div className="rounded-lg bg-raised p-2 sm:p-2.5 border border-[var(--border-subtle)]">
                    <span className="text-[10px] uppercase tracking-wider text-muted block">
                      Preis-Attraktivität
                    </span>
                    <span
                      className={cn(
                        "tabular font-semibold text-base sm:text-lg mt-0.5 block",
                        traffic.priceAttractivenessPct >= 100
                          ? "text-gain"
                          : traffic.priceAttractivenessPct >= 85
                            ? "text-warn"
                            : "text-loss",
                      )}
                    >
                      {traffic.priceAttractivenessPct} %
                    </span>
                    <span className="text-[10px] text-muted tabular truncate block">
                      {traffic.priceAttractivenessPct >= 105
                        ? "Günstig (zieht an)"
                        : traffic.priceAttractivenessPct >= 95
                          ? "Ausgewogen"
                          : "Teuer (dämpft)"}
                    </span>
                  </div>
                </div>

                {/* Auslastungs-Balken */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted">Aktuelle Kapazitätsauslastung:</span>
                    <span className="tabular font-medium text-fg">{traffic.occupancyPct} %</span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-raised">
                    <div
                      className={cn(
                        "h-full rounded-full transition-all duration-300",
                        traffic.occupancyPct >= 85
                          ? "bg-loss"
                          : traffic.occupancyPct >= 50
                            ? "bg-accent"
                            : traffic.occupancyPct >= 20
                              ? "bg-gain"
                              : "bg-muted",
                      )}
                      style={{ width: `${Math.max(4, Math.min(100, traffic.occupancyPct))}%` }}
                    />
                  </div>
                </div>

                {/* Grafisches Balkendiagramm für Besucher */}
                <CustomerBarChart
                  history={c.history ?? []}
                  todayCustomers={c.todayCustomers ?? 0}
                  todayDay={clock.day}
                />

                {/* Ausklappbare Faktoren-Details */}
                <div className="pt-0.5">
                  <button
                    type="button"
                    onClick={() => setShowTrafficFactors(!showTrafficFactors)}
                    className="text-xs text-accent hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    {showTrafficFactors ? (
                      <ChevronUp className="size-3.5" />
                    ) : (
                      <ChevronDown className="size-3.5" />
                    )}
                    <span>
                      {showTrafficFactors
                        ? "Berechnungsfaktoren ausblenden"
                        : "Berechnungsfaktoren & Multiplikatoren einblenden"}
                    </span>
                  </button>

                  {showTrafficFactors ? (
                    <div className="rounded-lg bg-raised/70 p-3 text-xs space-y-2 border border-[var(--border-subtle)] mt-2">
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-muted block">
                        Faktoren auf den Kundenstrom
                      </span>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1.5 text-[11px]">
                        <div className="flex items-center justify-between">
                          <span className="text-muted">Standort ({locDef.name}):</span>
                          <span className="tabular font-medium text-fg">
                            {num1(traffic.baseLocationFreq)}×
                            {traffic.synergyBonusPct > 0 ? (
                              <span className="text-gain ml-1">
                                (+{traffic.synergyBonusPct} %{" "}
                                {traffic.synergyLabel ? `· ${traffic.synergyLabel}` : ""})
                              </span>
                            ) : null}
                          </span>
                        </div>

                        <div className="flex items-center justify-between">
                          <span className="text-muted">Filialnetz & Betriebsgröße:</span>
                          <span className="tabular font-medium text-fg">
                            {num1(traffic.scaleMult)}× ({scaleDef.name})
                          </span>
                        </div>

                        <div className="flex items-center justify-between">
                          <span className="text-muted">Hygiene-Wohlfühlfaktor:</span>
                          <span
                            className={cn(
                              "tabular font-medium",
                              traffic.hygieneFactorPct >= 95 ? "text-gain" : "text-warn",
                            )}
                          >
                            {traffic.hygieneFactorPct} % ({Math.round(c.hygiene)}% Sauberkeit)
                          </span>
                        </div>

                        <div className="flex items-center justify-between">
                          <span className="text-muted">Personal & Durchsatz:</span>
                          <span className="tabular font-medium text-fg">
                            {c.employees.length} MA · Geräte Stufe {upgrades.equipment}/3
                          </span>
                        </div>
                      </div>

                      {traffic.occupancyPct >= 85 ? (
                        <div className="mt-2 pt-2 border-t border-[var(--border-subtle)] flex items-center gap-2 text-warn text-[11px]">
                          <AlertTriangle className="size-3.5 shrink-0" />
                          <span>
                            Hoher Andrang stößt an Kapazitätsgrenzen! Baue Geräte aus oder stelle im
                            Reiter „Ausbau & Team“ mehr Personal ein.
                          </span>
                        </div>
                      ) : null}
                    </div>
                  ) : null}
                </div>
              </div>
            );
          })()}

          {/* Aktuelle Markt- & Sortiments-Nachfrage */}
          <div className="rounded-xl bg-surface p-4 shadow-[var(--shadow-border)] space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h3 className="font-medium text-sm flex items-center gap-1.5">
                  <TrendingUp className="size-4 text-accent" />
                  <span>Markt- & Sortiments-Nachfrage ({indDef.name})</span>
                </h3>
                <p className="text-xs text-muted mt-0.5">
                  Die Nachfrage und der Branchen-Konkurrenzdruck ({indDemand.competitionPct} % ·{" "}
                  {indDemand.competitionLabel}) bestimmen direkt den stündlichen Kundenandrang.
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-1.5">
                <DemandBadge info={indDemand} prefix="Branche:" showDelta />
                <Button
                  size="sm"
                  variant="secondary"
                  className="h-6 px-2 text-[11px] gap-1"
                  onClick={() => s.openMarketAnalysis(true)}
                >
                  <BarChart3 className="size-3 text-accent" />
                  <span>Marktanalyse</span>
                </Button>
              </div>
            </div>

            {enabledOfferings.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                {enabledOfferings.map((off) => {
                  const pDef = productsForIndustry(c.industry).find((p) => p.id === off.productId);
                  const pInfo = getProductDemandInfo(s, off.productId);
                  return (
                    <div
                      key={off.productId}
                      className="rounded-lg bg-raised px-3 py-2 text-xs flex items-center justify-between gap-2 border border-[var(--border-subtle)]"
                    >
                      <span className="font-medium text-fg truncate">
                        {pDef?.name ?? off.productId}
                      </span>
                      <DemandBadge info={pInfo} showDelta />
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-xs text-muted">
                Noch kein aktives Produkt im Sortiment. Wähle im Reiter „Produkte“ gefragte Artikel aus.
              </p>
            )}

            {s.market.pulseNote ? (
              <p className="text-xs text-muted pt-1 border-t border-[var(--border-subtle)]">
                <b className="text-fg">Markt-Impuls:</b> {s.market.pulseNote}
              </p>
            ) : null}
          </div>

          {/* Market event if active */}
          {yearEvent ? (
            <div className="rounded-xl bg-surface p-4 shadow-[var(--shadow-border)]">
              <p className="text-xs text-muted">Aktuelles Marktereignis im Geschäftsjahr</p>
              <p className="mt-1 font-medium text-sm">{yearEvent.title}</p>
              <p className="mt-1 text-xs text-muted leading-relaxed">{yearEvent.body}</p>
            </div>
          ) : null}
        </div>
      ) : null}

      {/* TAB 2: PRODUKTE (Kompakte Slot-Karten + 4 eigenständige Modal-Fenster) */}
      {tab === "products" ? (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-surface p-4 shadow-[var(--shadow-border)]">
            <div>
              <h2 className="font-display text-lg tracking-tight">
                Produkt-Slots & Sortiment ({enabledOfferings.length} / {c.productSlotMax} belegt)
              </h2>
              <p className="text-xs text-muted mt-0.5">
                Wähle pro Slot flexibel über eigene Fenster:{" "}
                <b className="text-fg">Produkt wählen</b>,{" "}
                <b className="text-fg">Lieferant wählen</b>,{" "}
                <b className="text-fg">Ware bestellen</b> und{" "}
                <b className="text-fg">Preis festlegen</b>.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Badge tone="accent">
                Stufe {c.level} · {c.productSlotMax}{" "}
                {c.productSlotMax === 1 ? "Slot frei" : "Slots frei"}
              </Badge>
              {c.manager && upgrades.autoOrder ? (
                activeAutoOrderCount > 0 ? (
                  <Badge tone="gain" className="gap-1 tabular">
                    <Check className="size-3" /> Auto-Order aktiv ({activeAutoOrderCount})
                  </Badge>
                ) : (
                  <Badge className="gap-1 tabular">
                    <RefreshCw className="size-3" /> Auto-Order bereit (0 aktiv)
                  </Badge>
                )
              ) : null}
            </div>
          </div>

          {(() => {
            const industryProducts = productsForIndustry(c.industry);
            const industryProductIds = new Set(industryProducts.map((p) => p.id));
            const activeInIndustry = c.products.filter(
              (p) => p.enabled && industryProductIds.has(p.productId),
            );

            // Daten für das aktuell geöffnete Modal-Fenster ermitteln
            const modalSlotIdx = activeSlotModal?.slotIdx ?? null;
            const modalType = activeSlotModal?.type ?? null;
            const modalSlotNumber = modalSlotIdx !== null ? modalSlotIdx + 1 : null;
            const modalOffering =
              modalSlotIdx !== null ? activeInIndustry[modalSlotIdx] ?? null : null;
            const modalDef = modalOffering
              ? industryProducts.find((p) => p.id === modalOffering.productId) ?? null
              : null;

            return (
              <>
                {/* Kompakte Slot-Karten (Slot #1 bis #productSlotMax) */}
                <div className="space-y-3">
                  {Array.from({ length: c.productSlotMax }, (_, slotIdx) => {
                    const slotNumber = slotIdx + 1;
                    const offering = activeInIndustry[slotIdx] ?? null;
                    const def = offering
                      ? industryProducts.find((p) => p.id === offering.productId) ?? null
                      : null;

                    const contracted = offering?.contractedSupplier ?? null;
                    const cost = offering ? offeringUnitCost(c, offering) : 0;
                    const deliveries = offering?.pendingDeliveries ?? [];
                    const inTransitQty = deliveries.reduce((sum, d) => sum + d.qty, 0);
                    const hasDelayedDelivery = deliveries.some((d) => d.delayed);
                    const estimate =
                      offering && def
                        ? estimateProductHourlySales(
                            c,
                            offering,
                            s,
                            offering.supplierId,
                            offering.price,
                          )
                        : null;

                    const prodDemand = def ? getProductDemandInfo(s, def.id) : null;

                    return (
                      <div
                        key={`slot-card-${slotNumber}`}
                        className={cn(
                          "rounded-xl bg-surface p-4 shadow-[var(--shadow-border)] space-y-3 transition-colors",
                          offering && def
                            ? "ring-1 ring-accent/30"
                            : "border border-dashed border-[var(--border-subtle)]",
                        )}
                      >
                        {/* Kopfzeile des Slots */}
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div className="flex flex-wrap items-center gap-2">
                            <Badge tone="accent">Slot #{slotNumber}</Badge>
                            <h3 className="font-semibold text-sm sm:text-base text-fg">
                              {def ? def.name : "Freier Produkt-Slot"}
                            </h3>
                            {prodDemand ? (
                              <DemandBadge info={prodDemand} prefix="Nachfrage:" showDelta />
                            ) : null}
                            {!def ? (
                              <Badge>Kein Produkt gewählt</Badge>
                            ) : !contracted ? (
                              <Badge tone="warn">Lieferant fehlt</Badge>
                            ) : offering.stock <= 0 && inTransitQty <= 0 ? (
                              <Badge tone="warn">Lager leer</Badge>
                            ) : (
                              <Badge tone="gain">Verkauf bereit</Badge>
                            )}
                            {offering?.autoOrder && c.manager && upgrades.autoOrder ? (() => {
                              const threshold = calculateAutoOrderThreshold(c, offering, s, offering.contractedSupplier);
                              return (
                                <Badge
                                  tone="gain"
                                  className="gap-1"
                                  title={`Automatischer Nachkauf ab Bestand ≤ ${threshold.reorderPoint} Stk. (Charge: ${threshold.targetBatchSize} Stk.)`}
                                >
                                  <RefreshCw className="size-3" /> Auto-Order (≤ {threshold.reorderPoint} Stk.)
                                </Badge>
                              );
                            })() : null}
                          </div>

                          {def ? (
                            <span className="text-[11px] text-muted tabular">
                              Richtpreis {money(def.fairPrice)} · verkaufte Menge gesamt:{" "}
                              {num(offering?.soldLifetime ?? 0)} Stk.
                            </span>
                          ) : (
                            <span className="text-[11px] text-muted">
                              Klicke auf „Produkt wählen“, um diesen Slot zu belegen
                            </span>
                          )}
                        </div>

                        {/* Kompakte 4er-Kurzinfo: Produkt | Lieferant | Lagerbestand | Preis */}
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 text-xs">
                          {/* 1. Produkt */}
                          <div className="rounded-lg bg-raised px-3 py-2 border border-[var(--border-subtle)]">
                            <span className="text-[10px] uppercase tracking-wider text-muted block">
                              Produkt & Nachfrage
                            </span>
                            {def && prodDemand ? (
                              <div className="mt-0.5">
                                <span className="font-semibold text-fg block truncate">
                                  {def.name}
                                </span>
                                <span
                                  className={cn(
                                    "text-[11px] tabular block truncate font-medium",
                                    prodDemand.tone === "gain"
                                      ? "text-gain"
                                      : prodDemand.tone === "warn"
                                        ? "text-warn"
                                        : prodDemand.tone === "loss"
                                          ? "text-loss"
                                          : "text-muted",
                                  )}
                                >
                                  {prodDemand.pct} % {prodDemand.arrow} {prodDemand.label} · EK{" "}
                                  {money(def.baseCost)}
                                </span>
                              </div>
                            ) : (
                              <span className="text-muted font-medium block mt-0.5">
                                Nicht ausgewählt
                              </span>
                            )}
                          </div>

                          {/* 2. Lieferant */}
                          <div className="rounded-lg bg-raised px-3 py-2 border border-[var(--border-subtle)]">
                            <span className="text-[10px] uppercase tracking-wider text-muted block">
                              Lieferant
                            </span>
                            {contracted ? (
                              <div className="mt-0.5">
                                <span className="font-semibold text-fg block truncate">
                                  {contracted.name}
                                </span>
                                <span className="text-[11px] text-muted tabular block truncate">
                                  {money(cost)}/Stk. · Laune{" "}
                                  <b
                                    className={cn(
                                      (contracted.satisfaction ?? 85) >= 60
                                        ? "text-gain"
                                        : (contracted.satisfaction ?? 85) >= 30
                                          ? "text-warn"
                                          : "text-loss",
                                    )}
                                  >
                                    {Math.round(contracted.satisfaction ?? 85)} %
                                  </b>
                                </span>
                              </div>
                            ) : offering?.previousSupplier ? (
                              <div className="mt-0.5">
                                <span className="font-semibold text-warn block truncate">
                                  {offering.previousSupplier.name} (gekündigt)
                                </span>
                                <button
                                  type="button"
                                  onClick={() => {
                                    if (!def) return;
                                    const err = s.buybackSupplier(c.id, def.id);
                                    if (err) toast.error(err);
                                    else
                                      toast.success(
                                        `${offering.previousSupplier?.name} für ${def.name} zurückgekauft!`,
                                      );
                                  }}
                                  className="text-[11px] text-accent hover:underline font-medium tabular block truncate cursor-pointer"
                                >
                                  ↻ Zurückkaufen ({money(
                                    offering.supplierBuybackPrice ??
                                      calculateSupplierBuybackPrice(
                                        offering.previousSupplier,
                                        c.industry ?? "imbiss",
                                      ),
                                    true,
                                  )})
                                </button>
                              </div>
                            ) : (
                              <span
                                className={cn(
                                  "font-medium block mt-0.5",
                                  def ? "text-warn" : "text-muted",
                                )}
                              >
                                {def ? "Kein Vertrag" : "—"}
                              </span>
                            )}
                          </div>

                          {/* 3. Lagerbestand */}
                          <div className="rounded-lg bg-raised px-3 py-2 border border-[var(--border-subtle)]">
                            <span className="text-[10px] uppercase tracking-wider text-muted block">
                              Lagerbestand
                            </span>
                            {offering && def ? (
                              <div className="mt-0.5">
                                <span
                                  className={cn(
                                    "font-semibold tabular block",
                                    offering.stock > 0 ? "text-fg" : "text-warn",
                                  )}
                                >
                                  {num(offering.stock)} Stk.
                                </span>
                                <span
                                  className={cn(
                                    "text-[11px] tabular block truncate",
                                    inTransitQty > 0
                                      ? hasDelayedDelivery
                                        ? "text-loss"
                                        : "text-warn"
                                      : "text-muted",
                                  )}
                                >
                                  {inTransitQty > 0
                                    ? `+${num(inTransitQty)} Stk. im Zulauf`
                                    : "Kein Zulauf"}
                                </span>
                              </div>
                            ) : (
                              <span className="text-muted font-medium block mt-0.5">—</span>
                            )}
                          </div>

                          {/* 4. Verkaufspreis */}
                          <div className="rounded-lg bg-raised px-3 py-2 border border-[var(--border-subtle)]">
                            <span className="text-[10px] uppercase tracking-wider text-muted block">
                              Verkaufspreis
                            </span>
                            {offering && def && estimate ? (
                              <div className="mt-0.5">
                                <span className="font-semibold text-fg tabular block">
                                  {money(offering.price)}
                                </span>
                                <span
                                  className={cn(
                                    "text-[11px] tabular block truncate",
                                    estimate.unitMargin >= 0 ? "text-gain" : "text-loss",
                                  )}
                                >
                                  Marge {estimate.unitMargin >= 0 ? "+" : ""}
                                  {money(estimate.unitMargin)} · ~{num1(estimate.hourlySales)}/Std.
                                </span>
                              </div>
                            ) : (
                              <span className="text-muted font-medium block mt-0.5">—</span>
                            )}
                          </div>
                        </div>

                        {/* Vier Fenster-Buttons pro Slot (in freier Reihenfolge aufrufbar) */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-0.5">
                          <Button
                            size="sm"
                            variant={def ? "secondary" : "default"}
                            className="w-full justify-center"
                            onClick={() =>
                              setActiveSlotModal({ slotIdx, type: "product" })
                            }
                          >
                            <Package className="size-3.5 mr-1.5 shrink-0" />
                            <span className="truncate">Produkt wählen</span>
                          </Button>

                          <Button
                            size="sm"
                            variant={def && !contracted ? "default" : "secondary"}
                            disabled={!def}
                            className="w-full justify-center disabled:opacity-40"
                            onClick={() =>
                              setActiveSlotModal({ slotIdx, type: "supplier" })
                            }
                          >
                            <Truck className="size-3.5 mr-1.5 shrink-0" />
                            <span className="truncate">Lieferant wählen</span>
                          </Button>

                          <Button
                            size="sm"
                            variant={
                              def && contracted && offering && offering.stock === 0 && inTransitQty === 0
                                ? "default"
                                : "secondary"
                            }
                            disabled={!def}
                            className="w-full justify-center disabled:opacity-40"
                            onClick={() =>
                              setActiveSlotModal({ slotIdx, type: "order" })
                            }
                          >
                            <Plus className="size-3.5 mr-1.5 shrink-0" />
                            <span className="truncate">Ware bestellen</span>
                          </Button>

                          <Button
                            size="sm"
                            variant="secondary"
                            disabled={!def}
                            className="w-full justify-center disabled:opacity-40"
                            onClick={() =>
                              setActiveSlotModal({ slotIdx, type: "price" })
                            }
                          >
                            <SlidersHorizontal className="size-3.5 mr-1.5 shrink-0" />
                            <span className="truncate">Preis festlegen</span>
                          </Button>
                        </div>
                      </div>
                    );
                  })}

                  {/* Kompakte Vorschau auf den nächsten gesperrten Produkt-Slot */}
                  {c.productSlotMax < 5 ? (
                    <div className="rounded-xl bg-surface/70 p-4 shadow-[var(--shadow-border)] border border-dashed border-[var(--border-subtle)] flex flex-wrap items-center justify-between gap-3">
                      <div className="flex items-start gap-3">
                        <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-raised text-muted">
                          <Lock className="size-4" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-sm text-fg">
                              Produkt-Slot #{c.productSlotMax + 1} (von 5)
                            </span>
                            <Badge>Ab Betriebsstufe {c.level + 1}</Badge>
                          </div>
                          <p className="text-xs text-muted mt-0.5">
                            Baue das Unternehmen auf Stufe {c.level + 1} aus, um einen weiteren
                            freien Produkt-Slot freizuschalten.
                          </p>
                        </div>
                      </div>

                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => setTab("team")}
                      >
                        Zum Betriebsausbau
                        <ArrowRight className="size-3.5 ml-1.5" />
                      </Button>
                    </div>
                  ) : null}
                </div>

                {/* ZENTRIERTES MODAL-FENSTER FÜR DIE 4 SLOT-AKTIONEN */}
                {activeSlotModal && modalSlotNumber !== null ? (
                  <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 backdrop-blur-[2px] p-3 sm:p-4"
                    onClick={() => setActiveSlotModal(null)}
                  >
                    <div
                      className="w-full max-w-2xl max-h-[88vh] flex flex-col rounded-xl bg-surface shadow-2xl border border-[var(--border-subtle)] overflow-hidden"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {/* Modal-Header */}
                      <div className="flex items-center justify-between gap-3 px-4 py-3.5 sm:px-5 border-b border-[var(--border-subtle)] bg-raised/60">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <Badge tone="accent">Slot #{modalSlotNumber}</Badge>
                            <h3 className="font-display font-semibold text-base text-fg truncate">
                              {modalType === "product"
                                ? "Produkt wählen"
                                : modalType === "supplier"
                                  ? "Lieferant wählen"
                                  : modalType === "order"
                                    ? "Ware bestellen"
                                    : "Preis festlegen"}
                            </h3>
                          </div>
                          <p className="text-xs text-muted truncate mt-0.5">
                            {modalDef
                              ? `Aktuelles Produkt: ${modalDef.name}`
                              : "Noch kein Produkt in diesem Slot ausgewählt"}
                          </p>
                        </div>

                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-8 w-8 p-0 shrink-0"
                          onClick={() => setActiveSlotModal(null)}
                          aria-label="Fenster schließen"
                        >
                          <X className="size-4" />
                        </Button>
                      </div>

                      {/* Schnellwechsel-Leiste zwischen den 4 Fenstern dieses Slots */}
                      <div className="grid grid-cols-4 gap-1 p-2 bg-raised/40 border-b border-[var(--border-subtle)] text-xs">
                        {(
                          [
                            ["product", "Produkt", Package],
                            ["supplier", "Lieferant", Truck],
                            ["order", "Bestellen", Plus],
                            ["price", "Preis", Tag],
                          ] as const
                        ).map(([tKey, label, Icon]) => (
                          <button
                            key={tKey}
                            type="button"
                            onClick={() =>
                              setActiveSlotModal({
                                slotIdx: activeSlotModal.slotIdx,
                                type: tKey,
                              })
                            }
                            className={cn(
                              "flex items-center justify-center gap-1.5 rounded-lg py-1.5 px-2 font-medium transition-colors cursor-pointer",
                              modalType === tKey
                                ? "bg-accent text-accent-fg shadow-xs"
                                : "text-muted hover:text-fg hover:bg-raised",
                            )}
                          >
                            <Icon className="size-3.5 shrink-0" />
                            <span className="truncate">{label}</span>
                          </button>
                        ))}
                      </div>

                      {/* Scrollbarer Fenster-Inhalt */}
                      <div className="p-4 sm:p-5 overflow-y-auto space-y-4">
                        {/* FENSTER 1: PRODUKT WÄHLEN */}
                        {modalType === "product" ? (
                          <div className="space-y-4">
                            {modalDef && modalOffering ? (
                              <div className="rounded-lg bg-raised p-3.5 text-xs border border-accent/35 flex flex-wrap items-center justify-between gap-3">
                                <div>
                                  <div className="flex flex-wrap items-center gap-2">
                                    <span className="font-semibold text-sm text-fg">
                                      {modalDef.name}
                                    </span>
                                    <Badge tone="gain">Aktuell im Slot</Badge>
                                    <DemandBadge
                                      info={getProductDemandInfo(s, modalDef.id)}
                                      prefix="Nachfrage:"
                                      showDelta
                                    />
                                  </div>
                                  <p className="text-[11px] text-muted mt-0.5">
                                    Richtpreis {money(modalDef.fairPrice)} · Lagerbestand:{" "}
                                    {num(modalOffering.stock)} Stk.
                                  </p>
                                </div>
                                <Button
                                  size="sm"
                                  variant="secondary"
                                  disabled={c.status !== "active"}
                                  onClick={() => {
                                    const err = s.toggleProduct(c.id, modalDef.id);
                                    if (err) toast.error(err);
                                    else {
                                      toast.success(
                                        `${modalDef.name} aus Slot #${modalSlotNumber} entfernt.`,
                                      );
                                      setActiveSlotModal(null);
                                    }
                                  }}
                                >
                                  Slot räumen
                                </Button>
                              </div>
                            ) : null}

                            <div className="space-y-2">
                              <div className="flex flex-wrap items-center justify-between gap-2">
                                <span className="text-xs font-medium text-muted block">
                                  {modalDef
                                    ? "Anderes Produkt für diesen Slot auswählen (sortiert nach Nachfrage):"
                                    : `Verfügbare Produkte in ${indDef.name} (sortiert nach Nachfrage):`}
                                </span>
                                <DemandBadge info={indDemand} prefix="Branchen-Schnitt:" />
                              </div>

                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                                {industryProducts
                                  .filter((p) => {
                                    const off = c.products.find((x) => x.productId === p.id);
                                    return !off?.enabled;
                                  })
                                  .sort(
                                    (a, b) =>
                                      getProductDemandInfo(s, b.id).pct -
                                      getProductDemandInfo(s, a.id).pct,
                                  )
                                  .map((candDef) => {
                                    const candOff = c.products.find(
                                      (p) => p.productId === candDef.id,
                                    );
                                    const existingSupplier =
                                      candOff?.contractedSupplier ?? null;
                                    const existingStock = candOff?.stock ?? 0;
                                    const candDemand = getProductDemandInfo(s, candDef.id);
                                    const candEst = candOff
                                      ? estimateProductHourlySales(
                                          c,
                                          candOff,
                                          s,
                                          candOff.supplierId,
                                          candDef.fairPrice,
                                        )
                                      : null;

                                    return (
                                      <div
                                        key={candDef.id}
                                        className={cn(
                                          "rounded-lg bg-raised p-3.5 text-xs border flex flex-col justify-between gap-3 hover:border-accent/40 transition-colors",
                                          candDemand.tone === "gain"
                                            ? "border-gain/30"
                                            : "border-[var(--border-subtle)]",
                                        )}
                                      >
                                        <div className="space-y-2">
                                          <div className="flex items-start justify-between gap-2">
                                            <span className="font-semibold text-sm text-fg">
                                              {candDef.name}
                                            </span>
                                            <DemandBadge info={candDemand} showDelta />
                                          </div>
                                          <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px] text-muted tabular">
                                            <span>Richtpreis: {money(candDef.fairPrice)}</span>
                                            <span>·</span>
                                            <span>Basis-EK: {money(candDef.baseCost)}</span>
                                          </div>
                                          <p className="text-[11px] text-muted tabular">
                                            Erwarteter Absatz bei Richtpreis:{" "}
                                            <b className="text-fg">
                                              ~
                                              {candEst
                                                ? num1(candEst.hourlySales)
                                                : Math.round(candDef.ownerCap / 14)}{" "}
                                              Stk./Std.
                                            </b>
                                          </p>
                                          {existingSupplier || existingStock > 0 ? (
                                            <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                                              {existingSupplier ? (
                                                <Badge tone="gain" className="gap-1">
                                                  <Truck className="size-3" />{" "}
                                                  {existingSupplier.name}
                                                </Badge>
                                              ) : null}
                                              {existingStock > 0 ? (
                                                <Badge>
                                                  Restlager: {num(existingStock)} Stk.
                                                </Badge>
                                              ) : null}
                                            </div>
                                          ) : null}
                                        </div>

                                        <Button
                                          size="sm"
                                          className="w-full"
                                          disabled={c.status !== "active"}
                                          onClick={() => {
                                            if (modalDef) {
                                              const err = s.swapProduct(
                                                c.id,
                                                modalDef.id,
                                                candDef.id,
                                              );
                                              if (err) toast.error(err);
                                              else {
                                                toast.success(
                                                  `${candDef.name} in Slot #${modalSlotNumber} ausgewählt.`,
                                                );
                                                setActiveSlotModal(null);
                                              }
                                            } else {
                                              const err = s.toggleProduct(c.id, candDef.id);
                                              if (err) toast.error(err);
                                              else {
                                                toast.success(
                                                  `${candDef.name} für Slot #${modalSlotNumber} ausgewählt.`,
                                                );
                                                setActiveSlotModal(null);
                                              }
                                            }
                                          }}
                                        >
                                          <Package className="size-3.5 mr-1.5" />
                                          {candDef.name} wählen
                                        </Button>
                                      </div>
                                    );
                                  })}
                              </div>
                            </div>
                          </div>
                        ) : null}

                        {/* FALLBACK, WENN IN FENSTER 2, 3 ODER 4 NOCH KEIN PRODUKT GEWÄHLT IST */}
                        {modalType !== "product" && (!modalOffering || !modalDef) ? (
                          <div className="rounded-lg bg-raised p-5 text-center space-y-3 border border-dashed border-[var(--border-subtle)]">
                            <Package className="size-7 text-muted mx-auto" />
                            <div className="space-y-1">
                              <p className="font-medium text-sm text-fg">
                                Noch kein Produkt in Slot #{modalSlotNumber} ausgewählt
                              </p>
                              <p className="text-xs text-muted max-w-md mx-auto">
                                Wähle zuerst ein Produkt für diesen Slot aus, damit du dafür
                                einen Lieferanten suchen, Ware bestellen oder den Verkaufspreis
                                festlegen kannst.
                              </p>
                            </div>
                            <Button
                              size="sm"
                              onClick={() =>
                                setActiveSlotModal({
                                  slotIdx: activeSlotModal.slotIdx,
                                  type: "product",
                                })
                              }
                            >
                              <Package className="size-3.5 mr-1.5" />
                              Jetzt Produkt wählen
                            </Button>
                          </div>
                        ) : null}

                        {/* FENSTER 2: LIEFERANT WÄHLEN */}
                        {modalType === "supplier" && modalOffering && modalDef ? (
                          (() => {
                            const contracted = modalOffering.contractedSupplier ?? null;
                            const candidates = modalOffering.candidateSuppliers ?? [];
                            const cooldownMinutesLeft = supplierSearchCooldownRemaining(
                              s,
                              modalOffering,
                            );
                            const canSearchNow = canSearchSuppliers(s, modalOffering);
                            const cost = offeringUnitCost(c, modalOffering);

                            return (
                              <div className="space-y-4">
                                <div className="flex flex-wrap items-center justify-between gap-2">
                                  <div>
                                    <span className="text-xs font-medium text-fg flex items-center gap-1.5">
                                      <Truck className="size-3.5 text-accent" />
                                      <span>Zulieferer für {modalDef.name}</span>
                                    </span>
                                    <p className="text-[11px] text-muted mt-0.5">
                                      Kleine Lieferanten brauchen wenig Mindestumsatz, liefern aber
                                      nur kleine Mengen · Großhändler liefern große Mengen, fordern
                                      aber hohe Abnahmen.
                                    </p>
                                  </div>

                                  <Button
                                    size="sm"
                                    variant={contracted ? "secondary" : "default"}
                                    disabled={c.status !== "active" || !canSearchNow}
                                    onClick={() => {
                                      const err = s.searchSuppliers(c.id, modalDef.id);
                                      if (err) toast.error(err);
                                      else
                                        toast.success(
                                          `3 Zulieferer-Angebote für ${modalDef.name} eingeholt!`,
                                        );
                                    }}
                                  >
                                    <Search className="size-3.5 mr-1.5" />
                                    {!canSearchNow
                                      ? `Neue Suche in ${formatTransitEta(cooldownMinutesLeft)}`
                                      : contracted
                                        ? "Neue Angebote suchen"
                                        : "Zulieferer suchen (3 Angebote)"}
                                  </Button>
                                </div>

                                {/* Aktueller Vertragspartner */}
                                {contracted ? (
                                  (() => {
                                    const curSat = Math.round(contracted.satisfaction ?? 85);
                                    const baseMax =
                                      contracted.baseMaxOrderQty ?? contracted.maxOrderQty ?? 60;
                                    const curMax = contracted.maxOrderQty ?? baseMax;
                                    const maxCap =
                                      contracted.maxOrderCap ??
                                      Math.round((baseMax * 3.1) / 10) * 10;
                                    const step = contracted.growthStep ?? 20;
                                    const bonusQty = Math.max(0, curMax - baseMax);
                                    const hoursLeft = Math.max(
                                      1,
                                      SUPPLIER_MOOD_GROWTH_HOURS - (contracted.highMoodHours ?? 0),
                                    );

                                    return (
                                      <div className="rounded-lg bg-raised p-3.5 text-xs border border-[var(--border-subtle)] space-y-3">
                                        <div className="flex flex-wrap items-center justify-between gap-2">
                                          <div>
                                            <div className="flex items-center gap-2">
                                              <span className="font-semibold text-sm text-fg">
                                                {contracted.name}
                                              </span>
                                              <Badge tone="gain">Aktueller Vertrag</Badge>
                                              {bonusQty > 0 ? (
                                                <Badge tone="accent" className="tabular">
                                                  Treue-Ausbau +{bonusQty} Stk.
                                                </Badge>
                                              ) : null}
                                            </div>
                                            <p className="text-[11px] text-muted mt-0.5">
                                              {contracted.blurb}
                                            </p>
                                          </div>
                                          <div className="text-right">
                                            <span className="text-[10px] uppercase tracking-wider text-muted block">
                                              Effektiver EK
                                            </span>
                                            <span className="tabular font-semibold text-sm text-fg">
                                              {money(cost)} / Stk.
                                            </span>
                                          </div>
                                        </div>

                                        {/* Zufriedenheits-Balken des Lieferanten mit 75 %-Schwelle für Kapazitätsausbau */}
                                        <div className="space-y-1.5 pt-2 border-t border-[var(--border-subtle)]">
                                          <div className="flex flex-wrap items-center justify-between gap-1 text-[11px]">
                                            <span className="text-muted">
                                              Lieferanten-Laune (ab{" "}
                                              <b className="text-fg">&gt; 75 %</b> steigt die Max.-Menge):
                                            </span>
                                            <span
                                              className={cn(
                                                "tabular font-semibold",
                                                curSat > 75
                                                  ? "text-gain"
                                                  : curSat >= 35
                                                    ? "text-warn"
                                                    : "text-loss",
                                              )}
                                            >
                                              {curSat} %
                                            </span>
                                          </div>
                                          <div className="relative h-2.5 w-full rounded-full bg-surface overflow-hidden border border-[var(--border-subtle)]">
                                            <div
                                              className={cn(
                                                "h-full transition-all",
                                                curSat > 75
                                                  ? "bg-gain"
                                                  : curSat >= 35
                                                    ? "bg-warn"
                                                    : "bg-loss",
                                              )}
                                              style={{
                                                width: `${Math.max(0, Math.min(100, curSat))}%`,
                                              }}
                                            />
                                            {/* 75%-Markierung */}
                                            <div
                                              className="absolute top-0 bottom-0 w-0.5 bg-fg/60"
                                              style={{ left: "75%" }}
                                              title="Ab > 75 % Laune wächst die maximale Bestellmenge"
                                            />
                                          </div>
                                          <div className="flex flex-wrap items-center justify-between gap-1 text-[11px]">
                                            {curMax >= maxCap ? (
                                              <span className="text-gain font-medium">
                                                Maximale Ausbaustufe erreicht ({maxCap} Stk. Limit)
                                              </span>
                                            ) : curSat > 75 ? (
                                              <span className="text-gain font-medium tabular">
                                                Ausbau aktiv: +{step} Stk. Max.-Kapazität in{" "}
                                                {hoursLeft} Std. (Limit: {maxCap} Stk.)
                                              </span>
                                            ) : (
                                              <span className="text-muted tabular">
                                                Halte die Laune über 75 %, um die Max.-Menge bis auf{" "}
                                                {maxCap} Stk. (+{step} Stk./Stufe) auszubauen
                                              </span>
                                            )}
                                          </div>
                                        </div>

                                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-[var(--border-subtle)]">
                                          <div>
                                            <span className="text-[10px] uppercase tracking-wider text-muted block">
                                              Qualität
                                            </span>
                                            <span className="tabular font-medium text-fg">
                                              {Math.round(contracted.quality * 100)} / 100
                                            </span>
                                          </div>
                                          <div>
                                            <span className="text-[10px] uppercase tracking-wider text-muted block">
                                              Zuverlässigkeit
                                            </span>
                                            <span
                                              className={cn(
                                                "tabular font-medium",
                                                contracted.reliability >= 0.85
                                                  ? "text-gain"
                                                  : contracted.reliability < 0.7
                                                    ? "text-warn"
                                                    : "text-fg",
                                              )}
                                            >
                                              {Math.round(contracted.reliability * 100)} %
                                            </span>
                                          </div>
                                          <div>
                                            <span className="text-[10px] uppercase tracking-wider text-muted block">
                                              Bestellspanne (Ausbau)
                                            </span>
                                            <span className="tabular font-medium text-fg block">
                                              {contracted.minOrderQty ?? 15}–{curMax} Stk.
                                            </span>
                                            <span className="text-[10px] text-muted tabular block">
                                              Max. Ausbau: {maxCap} Stk.
                                            </span>
                                          </div>
                                          <div>
                                            <span className="text-[10px] uppercase tracking-wider text-muted block">
                                              Basis-Lieferzeit
                                            </span>
                                            <span className="tabular font-medium text-fg">
                                              ab {formatTransitEta(contracted.leadTimeMinutes)}
                                            </span>
                                          </div>
                                        </div>
                                      </div>
                                    );
                                  })()
                                ) : modalOffering.previousSupplier ? (
                                  (() => {
                                    const prevSup = modalOffering.previousSupplier;
                                    const buybackFee =
                                      modalOffering.supplierBuybackPrice ??
                                      calculateSupplierBuybackPrice(
                                        prevSup,
                                        c.industry ?? "imbiss",
                                      );
                                    const prevCost = offeringUnitCost(c, modalOffering, prevSup);
                                    const baseMax =
                                      prevSup.baseMaxOrderQty ?? prevSup.maxOrderQty ?? 60;
                                    const curMax = prevSup.maxOrderQty ?? baseMax;
                                    const bonusQty = Math.max(0, curMax - baseMax);
                                    const canAffordBuyback =
                                      Math.max(0, c.cash) + s.cash >= buybackFee;

                                    return (
                                      <div className="rounded-lg bg-raised p-3.5 text-xs border border-warn/40 space-y-2.5">
                                        <div className="flex flex-wrap items-start justify-between gap-2">
                                          <div>
                                            <div className="flex flex-wrap items-center gap-1.5">
                                              <Badge tone="warn">Abgesprungen</Badge>
                                              <span className="font-semibold text-sm text-fg">
                                                {prevSup.name}
                                              </span>
                                              {bonusQty > 0 ? (
                                                <Badge tone="accent" className="tabular">
                                                  Ausbau +{bonusQty} Stk. bleibt erhalten
                                                </Badge>
                                              ) : null}
                                            </div>
                                            <p className="text-[11px] text-muted mt-1 leading-relaxed">
                                              {prevSup.name} hat wegen zu geringer Abnahmemengen
                                              gekündigt. Gegen eine Vertragsprämie kannst du den
                                              Lieferanten inkl. bisheriger Kapazität (
                                              <b className="text-fg">
                                                {prevSup.minOrderQty ?? 15}–{curMax} Stk.
                                              </b>{" "}
                                              · EK <b className="text-fg">{money(prevCost)}/Stk.</b>{" "}
                                              · Qualität{" "}
                                              <b className="text-fg">
                                                {Math.round(prevSup.quality * 100)}/100
                                              </b>
                                              ) sofort mit 75 % Laune zurückholen.
                                            </p>
                                          </div>
                                          <Button
                                            size="sm"
                                            disabled={c.status !== "active" || !canAffordBuyback}
                                            onClick={() => {
                                              const err = s.buybackSupplier(c.id, modalDef.id);
                                              if (err) toast.error(err);
                                              else {
                                                setCustomOrderQty(prevSup.minOrderQty ?? 15);
                                                toast.success(
                                                  `${prevSup.name} für ${modalDef.name} erfolgreich zurückgekauft!`,
                                                );
                                              }
                                            }}
                                            className="shrink-0 gap-1.5"
                                          >
                                            <RotateCcw className="size-3.5" />
                                            <span>
                                              {prevSup.name} zurückkaufen · {money(buybackFee, true)}
                                            </span>
                                          </Button>
                                        </div>
                                      </div>
                                    );
                                  })()
                                ) : candidates.length === 0 ? (
                                  <div className="rounded-lg bg-raised p-4 text-xs border border-dashed border-accent/40 space-y-2.5">
                                    <p className="font-medium text-fg">
                                      Noch kein Lieferant für {modalDef.name} unter Vertrag
                                    </p>
                                    <p className="text-[11px] text-muted leading-relaxed">
                                      Starte eine kostenlose Marktsuche, um 3 zufällige
                                      Großhändler mit unterschiedlichen Preisen, Qualitäten,
                                      Lieferkapazitäten und Mindestabnahmen zu vergleichen.
                                    </p>
                                  </div>
                                ) : null}

                                {/* 3 Kandidaten zur Auswahl */}
                                {candidates.length > 0 ? (
                                  <div className="space-y-2">
                                    <span className="text-xs font-medium text-fg flex items-center gap-1.5">
                                      <Sparkles className="size-3.5 text-accent" />
                                      <span>
                                        Verfügbare Angebote ({candidates.length} Kandidaten):
                                      </span>
                                    </span>

                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                                      {candidates.map((cand) => {
                                        const candCost = offeringUnitCost(
                                          c,
                                          modalOffering,
                                          cand,
                                        );
                                        const candEst = estimateProductHourlySales(
                                          c,
                                          modalOffering,
                                          s,
                                          modalOffering.supplierId,
                                          modalOffering.price,
                                          cand,
                                        );
                                        const canAffordFee = c.cash >= cand.hiringFee;
                                        const candMin = cand.minOrderQty ?? 15;
                                        const candMax = cand.maxOrderQty ?? 60;
                                        const candCap =
                                          cand.maxOrderCap ??
                                          Math.round((candMax * 3.1) / 10) * 10;
                                        const moodLabel =
                                          (cand.moodGainMult ?? 1) >= 1.25
                                            ? "Pflegeleicht"
                                            : (cand.moodGainMult ?? 1) <= 0.8
                                              ? "Anspruchsvoll"
                                              : "Normal";

                                        return (
                                          <div
                                            key={cand.id}
                                            className="rounded-lg bg-raised p-3 text-xs border border-[var(--border-subtle)] flex flex-col justify-between space-y-2.5"
                                          >
                                            <div className="space-y-1.5">
                                              <div className="flex items-start justify-between gap-1.5">
                                                <p className="font-semibold text-fg leading-snug">
                                                  {cand.name}
                                                </p>
                                                <Badge className="shrink-0 tabular">
                                                  {money(candCost)}/Stk.
                                                </Badge>
                                              </div>
                                              <p className="text-[11px] text-muted leading-relaxed">
                                                {cand.blurb}
                                              </p>

                                              <div className="grid grid-cols-2 gap-1 pt-1 text-[11px]">
                                                <div className="rounded bg-surface px-2 py-1">
                                                  <span className="text-[10px] text-muted block">
                                                    Qualität / Zuv.
                                                  </span>
                                                  <b className="tabular text-fg">
                                                    {Math.round(cand.quality * 100)} ·{" "}
                                                    {Math.round(cand.reliability * 100)} %
                                                  </b>
                                                </div>
                                                <div className="rounded bg-surface px-2 py-1">
                                                  <span className="text-[10px] text-muted block">
                                                    Basis-Dauer
                                                  </span>
                                                  <b className="tabular text-fg">
                                                    ab {formatTransitEta(cand.leadTimeMinutes)}
                                                  </b>
                                                </div>
                                                <div className="rounded bg-surface px-2 py-1">
                                                  <span className="text-[10px] text-muted block">
                                                    Start-Spanne
                                                  </span>
                                                  <b className="tabular text-fg block">
                                                    {candMin}–{candMax} Stk.
                                                  </b>
                                                  <span className="text-[10px] text-gain tabular block">
                                                    Ausbau bis {candCap} Stk.
                                                  </span>
                                                </div>
                                                <div className="rounded bg-surface px-2 py-1">
                                                  <span className="text-[10px] text-muted block">
                                                    Laune-Pflege
                                                  </span>
                                                  <b
                                                    className={cn(
                                                      moodLabel === "Pflegeleicht"
                                                        ? "text-gain"
                                                        : moodLabel === "Anspruchsvoll"
                                                          ? "text-warn"
                                                          : "text-fg",
                                                    )}
                                                  >
                                                    {moodLabel}
                                                  </b>
                                                </div>
                                              </div>

                                              <div className="rounded bg-surface/70 px-2 py-1.5 text-[11px] space-y-0.5 border border-[var(--border-subtle)]">
                                                <div className="flex items-center justify-between">
                                                  <span className="text-muted">Absatz:</span>
                                                  <span className="tabular font-medium text-fg">
                                                    ~{num1(candEst.hourlySales)}/Std.
                                                  </span>
                                                </div>
                                                <div className="flex items-center justify-between">
                                                  <span className="text-muted">Marge:</span>
                                                  <span
                                                    className={cn(
                                                      "tabular font-medium",
                                                      candEst.unitMargin >= 0
                                                        ? "text-gain"
                                                        : "text-loss",
                                                    )}
                                                  >
                                                    +{money(candEst.unitMargin)}
                                                  </span>
                                                </div>
                                              </div>
                                            </div>

                                            <Button
                                              size="sm"
                                              className="w-full"
                                              disabled={c.status !== "active" || !canAffordFee}
                                              onClick={() => {
                                                const err = s.hireSupplier(
                                                  c.id,
                                                  modalDef.id,
                                                  cand.id,
                                                );
                                                if (err) toast.error(err);
                                                else {
                                                  setCustomOrderQty(cand.minOrderQty ?? 15);
                                                  toast.success(
                                                    `${cand.name} für ${modalDef.name} unter Vertrag genommen!`,
                                                  );
                                                  setActiveSlotModal(null);
                                                }
                                              }}
                                            >
                                              Anwerben · {money(cand.hiringFee, true)}
                                            </Button>
                                          </div>
                                        );
                                      })}
                                    </div>
                                  </div>
                                ) : null}
                              </div>
                            );
                          })()
                        ) : null}

                        {/* FENSTER 3: WARE BESTELLEN (Aufgeräumtes Layout mit freier Mengeneingabe, dynamischer Lieferzeit, Cooldown & Laune-Balken) */}
                        {modalType === "order" && modalOffering && modalDef ? (
                          (() => {
                            const contracted = modalOffering.contractedSupplier ?? null;
                            const cost = offeringUnitCost(c, modalOffering);
                            const volDiscPct = Math.round(
                              (1 - volumeDiscount(modalOffering.orderedLifetime)) * 100,
                            );
                            const deliveries = modalOffering.pendingDeliveries ?? [];
                            const inTransitQty = deliveries.reduce((sum, d) => sum + d.qty, 0);
                            const hasDelayedDelivery = deliveries.some((d) => d.delayed);
                            const nextArrivalMin =
                              deliveries.length > 0
                                ? Math.max(0, deliveries[0]!.arrivesAt - s.gameMinutes)
                                : 0;

                            if (!contracted) {
                              return (
                                <div className="rounded-lg bg-raised p-5 text-center space-y-3 border border-dashed border-warn/40">
                                  <Truck className="size-7 text-warn mx-auto" />
                                  <div className="space-y-1">
                                    <p className="font-medium text-sm text-fg">
                                      Noch kein Lieferant für {modalDef.name} unter Vertrag
                                    </p>
                                    <p className="text-xs text-muted max-w-md mx-auto">
                                      Um Ware bestellen zu können, benötigst du einen aktiven
                                      Zulieferervertrag für dieses Produkt.
                                    </p>
                                  </div>
                                  <Button
                                    size="sm"
                                    onClick={() =>
                                      setActiveSlotModal({
                                        slotIdx: activeSlotModal.slotIdx,
                                        type: "supplier",
                                      })
                                    }
                                  >
                                    <Truck className="size-3.5 mr-1.5" />
                                    Zum Fenster „Lieferant wählen“
                                  </Button>
                                </div>
                              );
                            }

                            const minQty = contracted.minOrderQty ?? 10;
                            const maxQty = Math.max(minQty, contracted.maxOrderQty ?? 80);
                            const baseMaxQty =
                              contracted.baseMaxOrderQty ?? contracted.maxOrderQty ?? maxQty;
                            const maxCapQty =
                              contracted.maxOrderCap ??
                              Math.round((baseMaxQty * 3.1) / 10) * 10;
                            const growthStep = contracted.growthStep ?? 20;
                            const bonusMaxQty = Math.max(0, maxQty - baseMaxQty);
                            const hoursToNextStep = Math.max(
                              1,
                              SUPPLIER_MOOD_GROWTH_HOURS - (contracted.highMoodHours ?? 0),
                            );
                            const midQty = Math.round((minQty + maxQty) / 2);
                            const selectedQty = Math.max(
                              minQty,
                              Math.min(maxQty, Math.round(customOrderQty || minQty)),
                            );
                            const orderTotal = selectedQty * cost;
                            const previewLeadTime = calculateOrderLeadTime(
                              contracted,
                              selectedQty,
                            );
                            const previewMoodGain = calculateOrderMoodGain(
                              contracted,
                              selectedQty,
                            );
                            const currentSat = Math.round(contracted.satisfaction ?? 85);
                            const nextSatPreview = Math.min(100, currentSat + previewMoodGain);
                            const orderCooldownLeft = orderCooldownRemaining(s, modalOffering);
                            const canOrderNow = canOrderStockNow(s, modalOffering);

                            return (
                              <div className="space-y-3.5">
                                {/* 1. Aufgeräumte Kopf-Übersicht: Lager & Lieferanten-Zufriedenheit */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
                                  {/* Lager & Zulauf */}
                                  <div className="rounded-lg bg-raised p-3.5 border border-[var(--border-subtle)] flex items-center justify-between gap-3">
                                    <div>
                                      <span className="text-[10px] uppercase tracking-wider text-muted block">
                                        Aktueller Lagerbestand
                                      </span>
                                      <div className="flex items-center gap-2 mt-0.5">
                                        <span className="tabular font-display font-bold text-lg text-fg">
                                          {num(modalOffering.stock)} Stk.
                                        </span>
                                        <DemandBadge
                                          info={getProductDemandInfo(s, modalDef.id)}
                                          prefix="Nachfrage:"
                                        />
                                      </div>
                                      <span
                                        className={cn(
                                          "text-[11px] tabular block mt-0.5",
                                          inTransitQty > 0
                                            ? hasDelayedDelivery
                                              ? "text-loss"
                                              : "text-warn"
                                            : "text-muted",
                                        )}
                                      >
                                        {inTransitQty > 0
                                          ? `Im Zulauf: +${num(inTransitQty)} Stk. (${formatTransitEta(nextArrivalMin)})`
                                          : "Aktuell keine Lieferung unterwegs"}
                                      </span>
                                    </div>

                                    <div className="text-right">
                                      <span className="text-[10px] uppercase tracking-wider text-muted block">
                                        Stückpreis
                                      </span>
                                      <span className="tabular font-semibold text-sm text-fg mt-0.5 block">
                                        {money(cost)}
                                      </span>
                                      {volDiscPct > 0 ? (
                                        <span className="text-[11px] text-gain tabular">
                                          −{volDiscPct} % Rabatt
                                        </span>
                                      ) : (
                                        <span className="text-[11px] text-muted">Standard</span>
                                      )}
                                    </div>
                                  </div>

                                  {/* Lieferant & Zufriedenheits-Balken mit 75%-Ausbau-Schwelle */}
                                  <div className="rounded-lg bg-raised p-3.5 border border-[var(--border-subtle)] flex flex-col justify-between gap-2">
                                    <div className="flex items-center justify-between gap-2">
                                      <div className="min-w-0">
                                        <span className="text-[10px] uppercase tracking-wider text-muted block truncate">
                                          Laune · {contracted.name}
                                        </span>
                                        <span className="text-[11px] text-muted block mt-0.5">
                                          {maxQty >= maxCapQty ? (
                                            <span className="text-gain font-medium">
                                              Max. Kapazitäts-Ausbau erreicht ({maxCapQty} Stk.)
                                            </span>
                                          ) : currentSat > 75 ? (
                                            <span className="text-gain font-medium tabular">
                                              &gt; 75 % Laune: +{growthStep} Max.-Menge in{" "}
                                              {hoursToNextStep} Std.
                                            </span>
                                          ) : (
                                            <span>
                                              Über 75 % halten für mehr Max.-Kapazität (bis{" "}
                                              {maxCapQty} Stk.)
                                            </span>
                                          )}
                                        </span>
                                      </div>
                                      <span
                                        className={cn(
                                          "tabular font-display font-bold text-base shrink-0",
                                          currentSat > 75
                                            ? "text-gain"
                                            : currentSat >= 35
                                              ? "text-warn"
                                              : "text-loss",
                                        )}
                                      >
                                        {currentSat} %
                                      </span>
                                    </div>

                                    <div className="relative h-2.5 w-full rounded-full bg-surface overflow-hidden border border-[var(--border-subtle)]">
                                      <div
                                        className={cn(
                                          "h-full transition-all",
                                          currentSat > 75
                                            ? "bg-gain"
                                            : currentSat >= 35
                                              ? "bg-warn"
                                              : "bg-loss",
                                        )}
                                        style={{ width: `${Math.max(0, Math.min(100, currentSat))}%` }}
                                      />
                                      <div
                                        className="absolute top-0 bottom-0 w-0.5 bg-fg/60"
                                        style={{ left: "75%" }}
                                        title="75 %-Schwelle für Kapazitätsausbau"
                                      />
                                    </div>
                                  </div>
                                </div>

                                {/* 2. Zentraler Mengen-Wähler (Zahlenfeld + Schieberegler + Live-Lieferzeit) */}
                                <div className="rounded-lg bg-raised p-4 space-y-4 border border-[var(--border-subtle)]">
                                  <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                                    <div>
                                      <div className="flex flex-wrap items-center gap-2">
                                        <span className="font-semibold text-sm text-fg">
                                          Bestellmenge eingeben
                                        </span>
                                        {bonusMaxQty > 0 ? (
                                          <Badge tone="gain" className="tabular">
                                            +{bonusMaxQty} Stk. durch Treue freigeschaltet
                                          </Badge>
                                        ) : null}
                                      </div>
                                      <span className="text-[11px] text-muted block mt-0.5 tabular">
                                        Mindestabnahme: <b className="text-fg">{minQty} Stk.</b> ·
                                        Aktuelles Maximum: <b className="text-fg">{maxQty} Stk.</b>{" "}
                                        (Ausbaubar bis <b className="text-fg">{maxCapQty} Stk.</b>)
                                      </span>
                                    </div>

                                    <div className="flex items-center gap-1.5">
                                      {[
                                        ["Min", minQty],
                                        ["50 %", midQty],
                                        ["Max", maxQty],
                                      ].map(([label, val]) => (
                                        <button
                                          key={String(label)}
                                          type="button"
                                          onClick={() => setCustomOrderQty(Number(val))}
                                          className={cn(
                                            "px-2.5 py-1 rounded-md text-[11px] font-medium border transition-colors cursor-pointer tabular",
                                            selectedQty === val
                                              ? "bg-accent text-accent-fg border-accent"
                                              : "bg-surface text-muted hover:text-fg border-[var(--border-subtle)]",
                                          )}
                                        >
                                          {label} ({val})
                                        </button>
                                      ))}
                                    </div>
                                  </div>

                                  {/* Zahlenfeld + Schieberegler */}
                                  <div className="flex items-center gap-3">
                                    <Button
                                      size="sm"
                                      variant="secondary"
                                      className="h-9 w-9 p-0 shrink-0"
                                      onClick={() =>
                                        setCustomOrderQty(Math.max(minQty, selectedQty - 5))
                                      }
                                    >
                                      <Minus className="size-4" />
                                    </Button>

                                    <div className="w-24 shrink-0">
                                      <Input
                                        type="number"
                                        min={minQty}
                                        max={maxQty}
                                        value={selectedQty}
                                        onChange={(e) => {
                                          const parsed = parseInt(e.target.value, 10);
                                          if (!Number.isNaN(parsed)) {
                                            setCustomOrderQty(
                                              Math.max(minQty, Math.min(maxQty, parsed)),
                                            );
                                          }
                                        }}
                                        className="text-center font-semibold tabular h-9"
                                      />
                                    </div>

                                    <div className="flex-1">
                                      <Slider
                                        min={minQty}
                                        max={maxQty}
                                        step={1}
                                        value={[selectedQty]}
                                        onValueChange={(v) =>
                                          setCustomOrderQty(v[0] ?? minQty)
                                        }
                                      />
                                    </div>

                                    <Button
                                      size="sm"
                                      variant="secondary"
                                      className="h-9 w-9 p-0 shrink-0"
                                      onClick={() =>
                                        setCustomOrderQty(Math.min(maxQty, selectedQty + 5))
                                      }
                                    >
                                      <Plus className="size-4" />
                                    </Button>
                                  </div>

                                  {/* Live-Vorschau: Lieferzeit, Laune-Bonus & Gesamtpreis */}
                                  <div className="grid grid-cols-3 gap-2 rounded-lg bg-surface p-3 text-xs border border-[var(--border-subtle)]">
                                    <div>
                                      <span className="text-[10px] uppercase tracking-wider text-muted block">
                                        Lieferzeit (mengenabhängig)
                                      </span>
                                      <span className="tabular font-semibold text-sm text-fg mt-0.5 flex items-center gap-1">
                                        <Clock className="size-3.5 text-accent shrink-0" />
                                        {formatTransitEta(previewLeadTime)}
                                      </span>
                                    </div>

                                    <div>
                                      <span className="text-[10px] uppercase tracking-wider text-muted block">
                                        Laune-Effekt
                                      </span>
                                      <span className="tabular font-semibold text-sm text-gain mt-0.5 block">
                                        +{previewMoodGain} % (auf {nextSatPreview} %)
                                      </span>
                                    </div>

                                    <div className="text-right">
                                      <span className="text-[10px] uppercase tracking-wider text-muted block">
                                        Gesamtpreis ({selectedQty} Stk.)
                                      </span>
                                      <span
                                        className={cn(
                                          "tabular font-display font-bold text-base mt-0.5 block",
                                          c.cash >= orderTotal ? "text-fg" : "text-loss",
                                        )}
                                      >
                                        {money(orderTotal)}
                                      </span>
                                    </div>
                                  </div>

                                  {/* Bestell-Button mit Cooldown-Schutz */}
                                  <Button
                                    className="w-full py-2.5"
                                    disabled={
                                      c.status !== "active" ||
                                      !canOrderNow ||
                                      c.cash < orderTotal
                                    }
                                    onClick={() => {
                                      const out = s.orderStock(c.id, modalDef.id, selectedQty);
                                      if (out.err) {
                                        toast.error(out.err);
                                        return;
                                      }
                                      if (out.clampedFrom) {
                                        toast.info(
                                          `Liefermenge automatisch auf Lieferanten-Maximum (${out.orderedQty} Stk.) angepasst.`,
                                        );
                                      }
                                      if (out.delayed) {
                                        const shortageNote =
                                          out.actualQty < out.orderedQty
                                            ? ` · nur ${out.actualQty} von ${out.orderedQty} Stk. geliefert (Schwund)`
                                            : "";
                                        toast.warning(
                                          `Lieferverzögerung bei ${contracted.name}: Ankunft in ${formatTransitEta(out.etaMinutes)}${shortageNote}.`,
                                        );
                                      } else {
                                        toast.success(
                                          `${out.actualQty}× ${modalDef.name} bestellt (Lieferzeit ${formatTransitEta(out.etaMinutes)}, Laune +${out.moodGain ?? previewMoodGain} %).`,
                                        );
                                      }
                                    }}
                                  >
                                    {!canOrderNow
                                      ? `Bestell-Cooldown aktiv · Nächste Bestellung in ${formatTransitEta(orderCooldownLeft)}`
                                      : c.cash < orderTotal
                                        ? `Firmenkonto reicht nicht (${money(orderTotal)} benötigt)`
                                        : `Jetzt ${selectedQty} Stk. für ${money(orderTotal)} bestellen`}
                                  </Button>
                                </div>

                                {/* 3. Auto-Order Einstellung */}
                                <div className="rounded-lg bg-raised p-3.5 space-y-2.5 border border-[var(--border-subtle)] text-xs">
                                  <div className="flex items-center justify-between gap-3">
                                    <div className="flex items-center gap-2">
                                      <RefreshCw className="size-3.5 text-accent shrink-0" />
                                      <div className="flex flex-col">
                                        <span className="font-medium text-fg">
                                          Automatische Nachbestellung (Auto-Order)
                                        </span>
                                        <span className="text-[11px] text-muted">
                                          Bestellt frühzeitig nach, damit das Lager nie leerläuft.
                                        </span>
                                      </div>
                                    </div>
                                    {c.manager && upgrades.autoOrder ? (
                                      <Switch
                                        checked={Boolean(modalOffering.autoOrder)}
                                        onCheckedChange={() => {
                                          const err = s.toggleProductAutoOrder(
                                            c.id,
                                            modalDef.id,
                                          );
                                          if (err) toast.error(err);
                                          else
                                            toast.success(
                                              `Auto-Order für ${modalDef.name} ${modalOffering.autoOrder ? "deaktiviert" : "aktiviert"}.`,
                                            );
                                        }}
                                      />
                                    ) : (
                                      <span className="text-[11px] text-muted text-right">
                                        Ab Stufe 3 + Manager + Einkaufs-Assistent
                                      </span>
                                    )}
                                  </div>

                                  {c.manager && upgrades.autoOrder && modalOffering.contractedSupplier ? (() => {
                                    const threshold = calculateAutoOrderThreshold(
                                      c,
                                      modalOffering,
                                      s,
                                      modalOffering.contractedSupplier,
                                    );
                                    return (
                                      <div className="pt-2 border-t border-[var(--border-subtle)] flex flex-col gap-1.5 text-[11px] text-muted bg-[var(--surface-subtle)]/30 rounded-md p-2">
                                        <div className="flex items-center justify-between text-fg font-medium">
                                          <span>Dynamischer Meldebestand:</span>
                                          <span className="text-accent font-semibold">≤ {threshold.reorderPoint} Stk.</span>
                                        </div>
                                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-1 text-[10px]">
                                          <span>• Vorlauf: ~{threshold.leadTimeDemand} Stk. ({threshold.leadHours}h)</span>
                                          <span>• Puffer: +{threshold.safetyStock} Stk.</span>
                                          <span>• Charge: {threshold.targetBatchSize} Stk.</span>
                                        </div>
                                      </div>
                                    );
                                  })() : null}
                                </div>
                              </div>
                            );
                          })()
                        ) : null}

                        {/* FENSTER 4: PREIS FESTLEGEN */}
                        {modalType === "price" && modalOffering && modalDef ? (
                          (() => {
                            const contracted = modalOffering.contractedSupplier ?? null;
                            const cost = offeringUnitCost(c, modalOffering);
                            const estimate = estimateProductHourlySales(
                              c,
                              modalOffering,
                              s,
                              modalOffering.supplierId,
                              modalOffering.price,
                            );

                            return (
                              <div className="space-y-4">
                                <div className="rounded-lg bg-raised p-4 space-y-3.5 border border-[var(--border-subtle)]">
                                  <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                                    <div>
                                      <div className="flex flex-wrap items-center gap-2">
                                        <span className="font-semibold text-sm text-fg">
                                          Verkaufspreis für {modalDef.name}
                                        </span>
                                        <DemandBadge
                                          info={getProductDemandInfo(s, modalDef.id)}
                                          prefix="Nachfrage:"
                                          showDelta
                                        />
                                      </div>
                                      <span className="text-[11px] text-muted block mt-0.5">
                                        Richtpreis: {money(modalDef.fairPrice)} · Aktueller EK:{" "}
                                        {money(cost)} / Stk.
                                      </span>
                                    </div>
                                    <span className="tabular font-display font-bold text-xl text-fg">
                                      {money(modalOffering.price)}
                                    </span>
                                  </div>

                                  <div className="flex items-center gap-2.5 pt-1">
                                    <Button
                                      size="sm"
                                      variant="secondary"
                                      className="h-9 w-9 p-0"
                                      onClick={() =>
                                        s.setPrice(
                                          c.id,
                                          modalDef.id,
                                          Math.max(
                                            modalDef.baseCost + 0.2,
                                            modalOffering.price - 0.2,
                                          ),
                                        )
                                      }
                                    >
                                      <Minus className="size-4" />
                                    </Button>
                                    <div className="flex-1">
                                      <Slider
                                        min={Math.round((modalDef.baseCost + 0.2) * 10)}
                                        max={Math.round(modalDef.fairPrice * 2.4 * 10)}
                                        step={1}
                                        value={[Math.round(modalOffering.price * 10)]}
                                        onValueChange={(v) =>
                                          s.setPrice(c.id, modalDef.id, (v[0] ?? 30) / 10)
                                        }
                                      />
                                    </div>
                                    <Button
                                      size="sm"
                                      variant="secondary"
                                      className="h-9 w-9 p-0"
                                      onClick={() =>
                                        s.setPrice(
                                          c.id,
                                          modalDef.id,
                                          Math.min(
                                            modalDef.fairPrice * 2.4,
                                            modalOffering.price + 0.2,
                                          ),
                                        )
                                      }
                                    >
                                      <Plus className="size-4" />
                                    </Button>
                                  </div>
                                </div>

                                {/* Live Absatz- & Margen-Prognose */}
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
                                  <div className="rounded-lg bg-raised p-3 border border-[var(--border-subtle)]">
                                    <span className="text-[10px] uppercase tracking-wider text-muted block">
                                      Erwarteter Absatz
                                    </span>
                                    <span className="tabular font-semibold text-base text-fg mt-0.5 block">
                                      ~{num1(estimate.hourlySales)} Stk./Std.
                                    </span>
                                    <span className="text-[11px] text-muted tabular">
                                      ~{num(estimate.dailySales)} Stk. pro Tag
                                    </span>
                                  </div>

                                  <div className="rounded-lg bg-raised p-3 border border-[var(--border-subtle)]">
                                    <span className="text-[10px] uppercase tracking-wider text-muted block">
                                      Stückmarge
                                    </span>
                                    <span
                                      className={cn(
                                        "tabular font-semibold text-base mt-0.5 block",
                                        estimate.unitMargin >= 0 ? "text-gain" : "text-loss",
                                      )}
                                    >
                                      {estimate.unitMargin >= 0 ? "+" : ""}
                                      {money(estimate.unitMargin)}
                                    </span>
                                    <span className="text-[11px] text-muted tabular">
                                      {num1(estimate.marginPct)} % vom VK
                                    </span>
                                  </div>

                                  <div className="rounded-lg bg-raised p-3 border border-[var(--border-subtle)]">
                                    <span className="text-[10px] uppercase tracking-wider text-muted block">
                                      Rohertrag-Prognose
                                    </span>
                                    <span className="tabular font-semibold text-base text-fg mt-0.5 block">
                                      ~{money(estimate.hourlyProfit)} / Std.
                                    </span>
                                    <span className="text-[11px] text-muted truncate block">
                                      {contracted
                                        ? `Mit ${contracted.name}`
                                        : "Vorschau (ohne Lieferant)"}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            );
                          })()
                        ) : null}
                      </div>

                      {/* Modal-Footer */}
                      <div className="flex items-center justify-between gap-2 px-4 py-3 sm:px-5 border-t border-[var(--border-subtle)] bg-raised/40">
                        <span className="text-[11px] text-muted tabular">
                          Firmenkonto: <b className="text-fg">{money(c.cash)}</b>
                        </span>
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => setActiveSlotModal(null)}
                        >
                          Fenster schließen
                        </Button>
                      </div>
                    </div>
                  </div>
                ) : null}
              </>
            );
          })()}
        </div>
      ) : null}

      {/* TAB 3: AUSBAU & TEAM */}
      {tab === "team" ? (
        <div className="space-y-5">
          {/* Betriebsstufe 1 bis 5 */}
          <div className="rounded-xl bg-surface p-5 shadow-[var(--shadow-border)] space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-medium text-base">Betriebsstufe {c.level} von 5</h3>
                  <Badge>{indDef.name}</Badge>
                </div>
                <p className="text-xs text-muted mt-0.5">
                  Höhere Stufen schalten mehr Produktplätze, Mitarbeiterkapazität und den
                  Betriebsleiter frei.
                </p>
              </div>
              <Badge tone="gain">{c.productSlotMax} Produktplätze</Badge>
            </div>

            {!isMaxLevel ? (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted">
                    Umsatz-Fortschritt zu Stufe {nextLevel}: {money(c.lifetimeRevenue)} /{" "}
                    {money(levelReq.revenueReq)}
                  </span>
                  <span className="tabular font-medium">{revenueProgress} %</span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-raised">
                  <div
                    className="h-full bg-accent transition-all duration-300"
                    style={{ width: `${revenueProgress}%` }}
                  />
                </div>
                <div className="flex flex-wrap items-center justify-between gap-2 pt-2">
                  <span className="text-xs text-muted">
                    Ausbaukosten: <b className="text-fg">{money(levelReq.cost)}</b> (aus
                    Firmenkasse)
                  </span>
                  <Button
                    size="sm"
                    className="w-full sm:w-auto"
                    disabled={!canUpgrade || c.status !== "active"}
                    onClick={() => {
                      const err = s.upgradeCompany(c.id);
                      if (err) toast.error(err);
                      else toast.success(`Betrieb erfolgreich auf Stufe ${nextLevel} ausgebaut!`);
                    }}
                  >
                    Auf Stufe {nextLevel} ausbauen · {money(levelReq.cost)}
                  </Button>
                </div>
              </div>
            ) : (
              <p className="text-xs text-gain font-medium">
                Maximale Betriebsstufe 5 erreicht — höchste Kapazität aktiv!
              </p>
            )}
          </div>

          {/* Filialnetz & Expansion */}
          {(() => {
            const currentScale = c.scale ?? "local";
            const scaleDef = companyScaleById(currentScale);
            const isMaxScale = currentScale === "largeChain";
            const nextTarget: "smallChain" | "largeChain" | null =
              currentScale === "local"
                ? "smallChain"
                : currentScale === "smallChain"
                  ? "largeChain"
                  : null;
            const nextDef = nextTarget ? scaleUpgradeByTarget(nextTarget) : null;
            const nextFee = nextDef ? nextDef.feeByIndustry[c.industry] : 0;
            const playerNetWorth = netWorth(s);
            const canExpand =
              Boolean(nextDef) &&
              c.level >= (nextDef?.minLevel ?? 99) &&
              playerNetWorth >= (nextDef?.minNetWorth ?? 999_999) &&
              c.cash >= nextFee &&
              c.status === "active";

            return (
              <div className="rounded-xl bg-surface p-5 shadow-[var(--shadow-border)] space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-medium text-base flex items-center gap-1.5">
                        <Layers className="size-4 text-accent" />
                        <span>Filialnetz & Betriebsgröße (Expansion)</span>
                      </h3>
                      <Badge tone={currentScale !== "local" ? "accent" : "muted"}>
                        {scaleDef.name}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted mt-0.5">
                      Baue dein Einzelgeschäft zu einem stadtweiten Filialnetz oder einer Großkette aus, um den Kundenstrom massiv zu steigern.
                    </p>
                  </div>
                  <Badge tone="gain">Volumen-Faktor {num1(scaleDef.volumeMult)}×</Badge>
                </div>

                {/* Status-Vergleich */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
                  {COMPANY_SCALES.map((sc) => {
                    const isCurrent = (c.scale ?? "local") === sc.id;
                    const isPassed =
                      (c.scale === "largeChain" && (sc.id === "local" || sc.id === "smallChain")) ||
                      (c.scale === "smallChain" && sc.id === "local");
                    return (
                      <div
                        key={sc.id}
                        className={cn(
                          "rounded-lg p-3 border space-y-1.5",
                          isCurrent
                            ? "bg-accent/10 border-accent/40"
                            : isPassed
                              ? "bg-raised/40 border-border opacity-70"
                              : "bg-raised border-[var(--border-subtle)]",
                        )}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-fg">{sc.name}</span>
                          {isCurrent ? (
                            <Badge tone="accent" className="text-[10px] py-0 px-1.5">
                              Aktiv
                            </Badge>
                          ) : isPassed ? (
                            <Badge tone="gain" className="text-[10px] py-0 px-1.5">
                              Erreicht
                            </Badge>
                          ) : (
                            <Badge tone="muted" className="text-[10px] py-0 px-1.5">
                              Stufe {sc.id === "smallChain" ? "2" : "4"}
                            </Badge>
                          )}
                        </div>
                        <p className="text-[11px] text-muted">{sc.blurb}</p>
                        <div className="text-[11px] font-medium text-gain tabular">
                          {num1(sc.volumeMult)}× Kundenstrom
                          {sc.id === "largeChain" ? " · -8 % EK-Rabatt" : ""}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Upgrade Action Card */}
                {!isMaxScale && nextDef ? (
                  <div className="rounded-lg bg-raised p-4 border border-[var(--border-subtle)] space-y-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="text-xs font-semibold uppercase tracking-wider text-fg">
                        Nächste Expansionsstufe: {nextDef.name}
                      </span>
                      <span className="text-xs text-muted tabular">
                        Kosten: <b className="text-fg">{money(nextFee)}</b> (aus Firmenkasse)
                      </span>
                    </div>

                    {/* Perks List */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-1.5 text-xs">
                      {nextDef.perks.map((perk, idx) => (
                        <div key={idx} className="flex items-center gap-1.5 text-muted">
                          <Check className="size-3.5 text-gain shrink-0" />
                          <span className="text-[11px] leading-tight text-fg">{perk}</span>
                        </div>
                      ))}
                    </div>

                    {/* Prerequisites Checklist */}
                    <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-[var(--border-subtle)] text-xs">
                      <span
                        className={cn(
                          "flex items-center gap-1 px-2 py-1 rounded-md text-[11px]",
                          c.level >= nextDef.minLevel
                            ? "bg-gain/15 text-gain"
                            : "bg-loss/15 text-loss",
                        )}
                      >
                        {c.level >= nextDef.minLevel ? (
                          <Check className="size-3" />
                        ) : (
                          <X className="size-3" />
                        )}
                        Betriebsstufe {c.level}/{nextDef.minLevel}
                      </span>

                      <span
                        className={cn(
                          "flex items-center gap-1 px-2 py-1 rounded-md text-[11px]",
                          playerNetWorth >= nextDef.minNetWorth
                            ? "bg-gain/15 text-gain"
                            : "bg-loss/15 text-loss",
                        )}
                      >
                        {playerNetWorth >= nextDef.minNetWorth ? (
                          <Check className="size-3" />
                        ) : (
                          <X className="size-3" />
                        )}
                        Vermögen {money(playerNetWorth)} / {money(nextDef.minNetWorth)}
                      </span>

                      <span
                        className={cn(
                          "flex items-center gap-1 px-2 py-1 rounded-md text-[11px]",
                          c.cash >= nextFee
                            ? "bg-gain/15 text-gain"
                            : "bg-loss/15 text-loss",
                        )}
                      >
                        {c.cash >= nextFee ? (
                          <Check className="size-3" />
                        ) : (
                          <X className="size-3" />
                        )}
                        Firmenkasse {money(c.cash)} / {money(nextFee)}
                      </span>
                    </div>

                    <div className="pt-1 flex justify-end">
                      <Button
                        size="sm"
                        disabled={!canExpand}
                        onClick={() => {
                          const err = s.upgradeCompanyScale(c.id, nextDef.targetScale);
                          if (err) toast.error(err);
                          else
                            toast.success(
                              `Expansion erfolgreich! ${c.name} ist jetzt eine ${nextDef.name}.`,
                            );
                        }}
                      >
                        Zu {nextDef.name} expandieren · {money(nextFee)}
                      </Button>
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-gain font-medium">
                    Maximale Filialnetz-Stufe erreicht — deine Kette dominiert das Stadtgebiet mit vollen Vorteilen!
                  </p>
                )}
              </div>
            );
          })()}

          {/* Betriebs-Upgrades */}
          <div className="rounded-xl bg-surface p-5 shadow-[var(--shadow-border)] space-y-3">
            <h3 className="font-medium text-base flex items-center gap-2">
              <Wrench className="size-4 text-accent" />
              <span>Betriebs-Upgrades</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Geräte & Technik */}
              <div className="rounded-lg bg-raised p-3 text-xs space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-fg">Geräte & Technik</span>
                  <Badge>{upgrades.equipment}/3</Badge>
                </div>
                <p className="text-muted text-[11px] leading-relaxed">
                  +15 % Durchsatzkapazität pro Stufe & verlangsamt den Hygieneverfall.
                </p>
                {upgrades.equipment < 3 ? (
                  <Button
                    size="sm"
                    variant="secondary"
                    className="w-full"
                    disabled={
                      c.cash < companyUpgradeCost(c.industry, "equipment", upgrades.equipment)
                    }
                    onClick={() => {
                      const err = s.buyCompanyUpgrade(c.id, "equipment");
                      if (err) toast.error(err);
                      else toast.success(`Geräte-Upgrade Stufe ${upgrades.equipment + 1} gekauft.`);
                    }}
                  >
                    Ausbauen ·{" "}
                    {money(companyUpgradeCost(c.industry, "equipment", upgrades.equipment))}
                  </Button>
                ) : (
                  <Badge tone="gain" className="w-full justify-center">
                    Maximal ausgebaut
                  </Badge>
                )}
              </div>

              {/* Lager & Logistik */}
              <div className="rounded-lg bg-raised p-3 text-xs space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-fg">Lager & Logistik</span>
                  <Badge>{upgrades.storage}/3</Badge>
                </div>
                <p className="text-muted text-[11px] leading-relaxed">
                  −4 % Einkaufskosten pro Stufe durch besseres Verhandlungs- und Lagervolumen.
                </p>
                {upgrades.storage < 3 ? (
                  <Button
                    size="sm"
                    variant="secondary"
                    className="w-full"
                    disabled={c.cash < companyUpgradeCost(c.industry, "storage", upgrades.storage)}
                    onClick={() => {
                      const err = s.buyCompanyUpgrade(c.id, "storage");
                      if (err) toast.error(err);
                      else toast.success(`Lager-Upgrade Stufe ${upgrades.storage + 1} gekauft.`);
                    }}
                  >
                    Ausbauen · {money(companyUpgradeCost(c.industry, "storage", upgrades.storage))}
                  </Button>
                ) : (
                  <Badge tone="gain" className="w-full justify-center">
                    Maximal ausgebaut
                  </Badge>
                )}
              </div>

              {/* Lokal-Marketing */}
              <div className="rounded-lg bg-raised p-3 text-xs space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-fg">Lokal-Marketing</span>
                  <Badge>{upgrades.marketing}/3</Badge>
                </div>
                <p className="text-muted text-[11px] leading-relaxed">
                  +12 % Nachfrage-Boost im Viertel durch Flyer, Aktionen und Social Media.
                </p>
                {upgrades.marketing < 3 ? (
                  <Button
                    size="sm"
                    variant="secondary"
                    className="w-full"
                    disabled={
                      c.cash < companyUpgradeCost(c.industry, "marketing", upgrades.marketing)
                    }
                    onClick={() => {
                      const err = s.buyCompanyUpgrade(c.id, "marketing");
                      if (err) toast.error(err);
                      else
                        toast.success(`Marketing-Upgrade Stufe ${upgrades.marketing + 1} gekauft.`);
                    }}
                  >
                    Ausbauen ·{" "}
                    {money(companyUpgradeCost(c.industry, "marketing", upgrades.marketing))}
                  </Button>
                ) : (
                  <Badge tone="gain" className="w-full justify-center">
                    Maximal ausgebaut
                  </Badge>
                )}
              </div>

              {/* Einkaufs-Assistent (Auto-Order) */}
              <div className="rounded-lg bg-raised p-3 text-xs space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-fg">Einkaufs-Assistent</span>
                  {upgrades.autoOrder ? (
                    <Badge tone="gain">Aktiv</Badge>
                  ) : (
                    <Badge>Ab Stufe 3</Badge>
                  )}
                </div>
                <p className="text-muted text-[11px] leading-relaxed">
                  Schaltet die automatische Warennachbestellung pro Produkt frei (zusammen mit dem
                  Manager).
                </p>
                {!upgrades.autoOrder ? (
                  <Button
                    size="sm"
                    variant="secondary"
                    className="w-full"
                    disabled={c.level < 3 || c.cash < companyUpgradeCost(c.industry, "autoOrder", 0)}
                    onClick={() => {
                      const err = s.buyCompanyUpgrade(c.id, "autoOrder");
                      if (err) toast.error(err);
                      else toast.success(`Einkaufs-Assistent erfolgreich freigeschaltet!`);
                    }}
                  >
                    Freischalten · {money(companyUpgradeCost(c.industry, "autoOrder", 0))}
                  </Button>
                ) : (
                  <Badge tone="gain" className="w-full justify-center">
                    Freigeschaltet
                  </Badge>
                )}
              </div>
            </div>
          </div>

          {/* Betriebsleiter (Manager) */}
          <div className="rounded-xl bg-surface p-5 shadow-[var(--shadow-border)] space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-medium text-base flex items-center gap-1.5">
                    <UserCheck className="size-4 text-accent" />
                    <span>Betriebsleiter (Manager)</span>
                  </h3>
                  {c.manager ? (
                    <Badge tone="gain">Engagiert</Badge>
                  ) : (
                    <Badge>Ab Stufe 3</Badge>
                  )}
                </div>
                <p className="text-xs text-muted mt-0.5">
                  Hält die Hygiene automatisch hoch und koordiniert die Auto-Nachbestellung.
                </p>
              </div>
              <span className="text-xs tabular font-medium">
                {money(managerCostPerDayForIndustry(c.industry))} / Tag
              </span>
            </div>

            {c.level >= 3 ? (
              <div className="flex items-center justify-between pt-2 border-t border-[var(--border-subtle)]">
                <span className="text-xs text-muted max-w-md">
                  {c.manager
                    ? "Betriebsleiter leitet das Tagesgeschäft: Führt Auto-Order aus und beauftragt automatisch Reinigungen (Hygiene ≥ 80 %)."
                    : "Noch kein Betriebsleiter engagiert. Führt Auto-Order aus und hält Hygiene automatisch über 80 %."}
                </span>
                <Button
                  size="sm"
                  variant={c.manager ? "ghost" : "primary"}
                  onClick={() => {
                    const err = s.toggleManager(c.id);
                    if (err) toast.error(err);
                    else
                      toast.success(
                        c.manager
                          ? "Betriebsleiter entlassen."
                          : "Betriebsleiter erfolgreich engagiert!",
                      );
                  }}
                >
                  {c.manager ? "Manager entlassen" : "Manager engagieren"}
                </Button>
              </div>
            ) : (
              <p className="text-xs text-muted">
                Betriebsleiter wird ab <b>Stufe 3</b> freigeschaltet.
              </p>
            )}
          </div>

          {/* Personal & Mitarbeiter (ab Stufe 2) */}
          <div className="rounded-xl bg-surface p-5 shadow-[var(--shadow-border)] space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium text-base flex items-center gap-1.5">
                  <Users className="size-4 text-accent" />
                  <span>Personal ({c.employees.length} Mitarbeiter)</span>
                </h3>
                <p className="text-xs text-muted mt-0.5">
                  Mitarbeiter erhöhen den stündlichen Durchsatz. Ihre Zufriedenheit hängt von guter
                  Hygiene und pünktlicher Lohnzahlung um 00:00 Uhr ab.
                </p>
              </div>
              <Badge>
                {c.employees.length} / {c.level * 2} Plätze
              </Badge>
            </div>

            {c.level < 2 ? (
              <p className="text-xs text-muted">
                Personal kann ab <b>Betriebsstufe 2</b> eingestellt werden.
              </p>
            ) : (
              <div className="space-y-4">
                {/* Aktive Mitarbeiter */}
                {c.employees.length > 0 ? (
                  <div className="space-y-2">
                    <span className="text-xs uppercase tracking-wider text-muted">
                      Aktives Team
                    </span>
                    {c.employees.map((emp) => {
                      const sat = Math.round(emp.satisfaction ?? 85);
                      const satTone = sat >= 65 ? "gain" : sat >= 35 ? "warn" : "loss";
                      return (
                        <div
                          key={emp.id}
                          className="rounded-lg bg-raised p-3 flex items-center justify-between gap-3 text-xs border border-[var(--border-subtle)]"
                        >
                          <div className="min-w-0 flex-1 space-y-1.5">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="font-medium text-fg">{emp.name}</span>
                              <Badge>{roleLabel(emp.role)}</Badge>
                              {emp.sickUntil && emp.sickUntil > s.gameMinutes ? (
                                <Badge tone="warn">Krank</Badge>
                              ) : null}
                              {sat < 35 ? (
                                <Badge tone="loss" className="gap-1">
                                  <AlertTriangle className="size-3" /> Kündigungsgefahr
                                </Badge>
                              ) : null}
                            </div>
                            <p className="text-[11px] text-muted tabular">
                              Produktivität: {Math.round(emp.productivity * 100)} % ·
                              Zuverlässigkeit: {Math.round(emp.reliability * 100)} % · Lohn:{" "}
                              <b className="text-fg">{money(emp.wage)} / Tag</b>
                            </p>
                            <div className="flex items-center gap-2.5 pt-0.5">
                              <span className="text-[11px] text-muted shrink-0">
                                Zufriedenheit:
                              </span>
                              <div className="h-1.5 w-24 sm:w-32 rounded-full bg-surface overflow-hidden border border-[var(--border-subtle)]">
                                <div
                                  className={cn(
                                    "h-full rounded-full transition-all",
                                    satTone === "gain"
                                      ? "bg-gain"
                                      : satTone === "warn"
                                        ? "bg-warn"
                                        : "bg-loss",
                                  )}
                                  style={{ width: `${Math.max(4, Math.min(100, sat))}%` }}
                                />
                              </div>
                              <span
                                className={cn(
                                  "text-[11px] font-semibold tabular",
                                  satTone === "gain"
                                    ? "text-gain"
                                    : satTone === "warn"
                                      ? "text-warn"
                                      : "text-loss",
                                )}
                              >
                                {sat} %
                              </span>
                            </div>
                          </div>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-8 text-loss hover:text-loss shrink-0"
                            onClick={() => {
                              const err = s.fireEmployee(c.id, emp.id);
                              if (err) toast.error(err);
                              else toast.success(`${emp.name} entlassen.`);
                            }}
                          >
                            <UserMinus className="size-3.5" />
                          </Button>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-xs text-muted">Noch keine Mitarbeiter angestellt.</p>
                )}

                {/* Bewerber-Pool */}
                <div className="space-y-2 pt-2 border-t border-[var(--border-subtle)]">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <span className="text-xs uppercase tracking-wider text-muted block">
                        Bewerber-Pool ({s.applications.length} Kandidaten)
                      </span>
                      <span className="text-[11px] text-muted">
                        Neue Stellenausschreibung tauscht alle Kandidaten sofort aus
                      </span>
                    </div>
                    <Button
                      size="sm"
                      variant="secondary"
                      className="h-8 text-xs tabular"
                      disabled={c.status !== "active" || c.cash < APPLICANT_REFRESH_COST}
                      onClick={() => {
                        const err = s.replenishApplications(c.id);
                        if (err) toast.error(err);
                        else
                          toast.success(
                            `Neue Stellenausschreibung geschaltet (${money(APPLICANT_REFRESH_COST)}) — 4 neue Bewerber verfügbar!`,
                          );
                      }}
                    >
                      <RefreshCw className="size-3.5 mr-1.5" />
                      Neu ausschreiben · {money(APPLICANT_REFRESH_COST)}
                    </Button>
                  </div>

                  {s.applications.length > 0 ? (
                    <div className="space-y-2">
                      {s.applications.map((app) => (
                        <div
                          key={app.id}
                          className="rounded-lg bg-raised p-3 flex items-center justify-between gap-3 text-xs border border-[var(--border-subtle)]"
                        >
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-fg">{app.name}</span>
                              <Badge>{roleLabel(app.role)}</Badge>
                            </div>
                            <p className="text-[11px] text-muted mt-0.5 tabular">
                              Produktivität: {Math.round(app.productivity * 100)} % ·
                              Zuverlässigkeit: {Math.round(app.reliability * 100)} % ·
                              Lohnforderung: <b className="text-fg">{money(app.desiredWage)} / Tag</b>
                            </p>
                          </div>
                          <Button
                            size="sm"
                            disabled={c.employees.length >= c.level * 2}
                            onClick={() => {
                              const err = s.hireEmployee(c.id, app.id);
                              if (err) toast.error(err);
                              else toast.success(`${app.name} erfolgreich eingestellt!`);
                            }}
                          >
                            <UserPlus className="size-3.5 mr-1" />
                            Einstellen
                          </Button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-muted py-2">
                      Alle aktuellen Bewerber wurden eingestellt. Schalte eine neue Ausschreibung
                      oder warte auf den nächsten Spieltag.
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      ) : null}

      {/* TAB 4: KASSE */}
      {tab === "money" ? (
        <div className="space-y-4">
          <div className="rounded-xl bg-surface p-5 shadow-[var(--shadow-border)] space-y-3">
            <span className="text-xs uppercase tracking-wider text-muted">Unternehmenskasse</span>
            <p className="font-display text-3xl tabular tracking-tight text-fg">{money(c.cash)}</p>
            <p className="text-xs text-muted">
              Start-Eigenkapital: {money(c.equity)} · Offene Schulden: {money(debt)}
            </p>

            <div className="pt-2 flex flex-wrap sm:flex-nowrap gap-2">
              <Input
                type="number"
                min={0}
                placeholder="Betrag in €"
                className="w-full sm:flex-1"
                value={xfer}
                onChange={(e) => setXfer(e.target.value)}
              />
              <Button
                variant="secondary"
                className="flex-1 sm:flex-initial"
                onClick={() => {
                  const n = Number(xfer);
                  if (!n || n <= 0) return;
                  const err = s.transfer(c.id, n);
                  if (err) toast.error(err);
                  else {
                    setXfer("");
                    toast.success(`${money(n)} aus Privatkonto in ${c.name} eingelegt.`);
                  }
                }}
              >
                Einlegen
              </Button>
              <Button
                variant="ghost"
                className="flex-1 sm:flex-initial"
                onClick={() => {
                  const n = Number(xfer);
                  if (!n || n <= 0) return;
                  const err = s.transfer(c.id, -n);
                  if (err) toast.error(err);
                  else {
                    setXfer("");
                    toast.success(`${money(n)} aus ${c.name} auf Privatkonto entnommen.`);
                  }
                }}
              >
                Entnehmen
              </Button>
            </div>
          </div>

          {/* Dividenden & Ausschüttungs-Politik */}
          <div className="rounded-xl bg-surface p-5 shadow-[var(--shadow-border)] space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs uppercase tracking-wider text-muted block">
                  Dividenden-Ausschüttung
                </span>
                <p className="font-medium text-fg text-sm mt-0.5">
                  Tägliche Gewinne automatisch ans Privatkonto überweisen
                </p>
              </div>
              <Switch
                checked={Boolean(c.autoDividend)}
                onCheckedChange={() => s.toggleAutoDividend(c.id)}
              />
            </div>

            {c.autoDividend ? (
              <div className="space-y-2 pt-2 border-t border-border/60">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted">Ausschüttungsquote</span>
                  <span className="tabular font-medium text-fg">
                    {c.dividendPct ?? 70} % des Tagesgewinns
                  </span>
                </div>
                <Slider
                  value={[c.dividendPct ?? 70]}
                  min={10}
                  max={100}
                  step={5}
                  onValueChange={(val) => s.setDividendPct(c.id, val[0])}
                />
                <p className="text-[11px] text-muted">
                  Ein 5-Tage-Fixkostenpuffer (
                  {money(
                    ((c.rentPerDay || 20) +
                      (c.employees?.reduce((sum, e) => sum + e.wage, 0) || 0) +
                      40) *
                      5 +
                      300,
                  )}
                  ) verbleibt stets geschützt im Betrieb.
                </p>
              </div>
            ) : (
              <p className="text-xs text-muted">
                Gewinne verbleiben voll in der Firmenkasse. Aktiviere diesen Schalter, um tägliche Reingewinne automatisch abzuschöpfen.
              </p>
            )}

            <div className="pt-2">
              <Button
                variant="secondary"
                className="w-full h-8 text-xs gap-1.5"
                onClick={() => {
                  const err = s.withdrawCompanyDividend(c.id);
                  if (err) toast.error(err);
                  else
                    toast.success(
                      `Freier Gewinn aus ${c.name} erfolgreich aufs Privatkonto übertragen.`,
                    );
                }}
              >
                <span>Freien Gewinn sofort ausschütten (1-Tap)</span>
              </Button>
            </div>
          </div>

          {/* Firmenschulden */}
          {loans.map((loan) => (
            <div
              key={loan.id}
              className="rounded-xl bg-surface p-4 text-sm shadow-[var(--shadow-border)] space-y-2"
            >
              <div className="flex items-center justify-between">
                <span className="font-medium">Firmenschuld (Kredit)</span>
                <span className="tabular font-medium text-warn">{money(loan.remaining)}</span>
              </div>
              <p className="text-xs text-muted">
                Zins: {num1(loan.annualRate * 100)} % p.a. · Bisher angefallener Zins:{" "}
                {money(loan.accruedInterest, true)}
              </p>
              <p className="text-[11px] text-muted">
                Keine automatische Tilgungsrate. Schulden werden manuell aus der Firmenkasse getilgt.
              </p>

              <div className="pt-2 flex gap-2">
                <Input
                  type="number"
                  min={0}
                  placeholder="Sondertilgung in €"
                  value={pay}
                  onChange={(e) => setPay(e.target.value)}
                />
                <Button
                  variant="secondary"
                  onClick={() => {
                    const n = Number(pay);
                    if (!n || n <= 0) return;
                    const err = s.extraPayment(loan.id, n);
                    if (err) toast.error(err);
                    else {
                      setPay("");
                      toast.success(`Sondertilgung über ${money(n)} verbucht.`);
                    }
                  }}
                >
                  Tilgen
                </Button>
              </div>
            </div>
          ))}

          {loans.length === 0 ? (
            <div className="rounded-xl bg-surface p-4 text-center text-sm text-muted shadow-[var(--shadow-border)]">
              Keine offenen Firmenschulden vorhanden.
            </div>
          ) : null}
        </div>
      ) : null}

      {/* Mobile Sticky Quick-Action Floater (Daumenzone) */}
      {c.status === "active" && (c.hygiene < 60 || tabDotWarnings.products) ? (
        <div className="fixed bottom-16 inset-x-3 z-20 sm:hidden flex items-center justify-between gap-2 rounded-xl bg-surface/95 border border-[var(--border-subtle)] p-2 shadow-lg backdrop-blur-md">
          {c.hygiene < 60 ? (
            <Button
              size="sm"
              variant="secondary"
              className="flex-1 h-8 text-xs font-semibold gap-1.5 border-warn/40 text-warn hover:bg-warn/10"
              disabled={c.cash < CLEANING_COST}
              onClick={() => {
                const err = s.cleanHygiene(c.id);
                if (err) toast.error(err);
                else toast.success(`Betrieb blitzblank gereinigt (+18 Hygiene).`);
              }}
            >
              <Sparkles className="size-3.5" />
              <span>Reinigen (-{money(CLEANING_COST)})</span>
            </Button>
          ) : null}

          {tabDotWarnings.products && tab !== "products" ? (
            <Button
              size="sm"
              className="flex-1 h-8 text-xs font-semibold gap-1.5"
              onClick={() => setTab("products")}
            >
              <Package className="size-3.5" />
              <span>Sortiment / Ware</span>
            </Button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

function Mini({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone?: "gain" | "warn" | "loss";
}) {
  return (
    <div className="rounded-xl bg-surface p-2 sm:p-3.5 shadow-[var(--shadow-border)] min-w-0">
      <p className="text-[10px] sm:text-[11px] text-muted truncate">{label}</p>
      <p
        className={cn(
          "mt-0.5 tabular font-semibold text-xs sm:text-sm truncate",
          tone === "gain" && "text-gain",
          tone === "warn" && "text-warn",
          tone === "loss" && "text-loss",
        )}
      >
        {value}
      </p>
    </div>
  );
}
