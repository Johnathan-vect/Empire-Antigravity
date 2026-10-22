import { useState } from "react";
import {
  AlertTriangle,
  ArrowRight,
  BarChart3,
  ChevronDown,
  ChevronUp,
  Clock,
  Crown,
  PieChart,
  Plus,
  RotateCcw,
  TrendingUp,
  Trophy,
  X,
} from "lucide-react";
import { toast } from "sonner";
import {
  HINTS,
  POSSESSIONS,
  RICH_LIST,
  YEAR_LENGTH_DAYS,
  industryById,
  productById,
  yearThreshold,
} from "@/game/catalog";
import { formatGameTimestamp, readClock } from "@/game/clock";
import {
  calculateSupplierBuybackPrice,
  canEndYearEarly,
  collectionValue,
  cryptoValue,
  dailyDividendEstimate,
  debtRemaining,
  getAllIndustryDemands,
  getCompanyDemandInfo,
  getGlobalMarketDemandInfo,
  netWorth,
  personalDebtTotal,
  realEstateValue,
  stockValue,
  totalDailyRent,
  usedCompanyCredit,
} from "@/game/sim";
import { useGame } from "@/game/store";
import { money } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Delta, Money } from "./Delta";
import { DemandBadge } from "./MarketAnalysis";
import { Sparkline } from "./Sparkline";
import { cn } from "@/lib/utils";

interface DashboardWarning {
  id: string;
  title: string;
  body: string;
  createdAt: number;
  companyId?: string;
  productId?: string;
  dismissible?: boolean;
  buybackLabel?: string;
  onBuyback?: () => void;
  actionLabel?: string;
  onAction?: () => void;
}

const TYCOON_COLORS = [
  "#c4a35a",
  "#4f9d6e",
  "#9b72cf",
  "#45a1b8",
  "#5b8def",
  "#e08e45",
];

export function Dashboard() {
  const s = useGame();
  const [showNetDetails, setShowNetDetails] = useState(false);
  const [showYearHint, setShowYearHint] = useState(false);
  const [showFullRichList, setShowFullRichList] = useState(false);

  const nw = netWorth(s);
  const today = s.netHistory.length >= 2 ? nw - (s.netHistory[0]?.v ?? nw) : 0;
  const stockVal = stockValue(s);
  const cryptoVal = cryptoValue(s);
  const propVal = realEstateValue(s);
  const collVal = collectionValue(s);
  const fleetVal = s.possessions.reduce((acc, id) => {
    const p = POSSESSIONS.find((x) => x.id === id);
    return acc + (p ? p.price : 0);
  }, 0);
  const companyCash = s.companies.reduce((a, c) => a + c.cash, 0);
  const debt = debtRemaining(s);
  const used = usedCompanyCredit(s);
  const dailyRent = totalDailyRent(s);
  const dailyDiv = dailyDividendEstimate(s);

  // Asset breakdown segments (for positive assets)
  const assetSegments = [
    { key: "cash", label: "Guthaben", val: Math.max(0, s.cash), color: "#4f9d6e" },
    { key: "companies", label: "Unternehmen", val: Math.max(0, companyCash), color: "#d97757" },
    { key: "stocks", label: "Aktien", val: Math.max(0, stockVal), color: "#5b8def" },
    { key: "crypto", label: "Krypto", val: Math.max(0, cryptoVal), color: "#9b72cf" },
    { key: "realestate", label: "Immobilien", val: Math.max(0, propVal), color: "#45a1b8" },
    {
      key: "collections",
      label: "Sammlungen & Fuhrpark",
      val: Math.max(0, collVal + fleetVal),
      color: "#c4a35a",
    },
  ];
  const totalGrossAssets = Math.max(
    1,
    assetSegments.reduce((sum, seg) => sum + seg.val, 0),
  );

  // Rich list ranking computation with unique IDs
  const combinedRichList = [
    ...RICH_LIST.map((r, idx) => ({
      id: `tycoon-${r.rank}-${idx}`,
      name: r.name,
      title: r.title,
      netWorth: r.netWorth,
      avatarColor: TYCOON_COLORS[idx % TYCOON_COLORS.length]!,
      isPlayer: false,
    })),
    {
      id: "player-empire",
      name: "Du (Dein Imperium)",
      title: `${s.companies.length} Betriebe · ${(s.realEstate ?? []).length} Immobilien`,
      netWorth: nw,
      avatarColor: "#d97757",
      isPlayer: true,
    },
  ].sort((a, b) => b.netWorth - a.netWorth);

  const playerRankIdx = combinedRichList.findIndex((r) => r.isPlayer);
  const playerRank = playerRankIdx + 1;
  const nextRival = playerRankIdx > 0 ? combinedRichList[playerRankIdx - 1] : null;

  const warnings: DashboardWarning[] = s.inbox
    .filter((e) => e.kind !== "info")
    .slice(0, 5)
    .map((w, idx) => {
      const isSupplierDrop = w.title.includes("Lieferant");
      const isDeliveryDelay = w.title.includes("Lieferverzögerung");
      const hasCompany = Boolean(w.companyId);
      const comp = w.companyId ? s.companies.find((c) => c.id === w.companyId) : undefined;
      const off =
        comp && w.productId ? comp.products.find((p) => p.productId === w.productId) : undefined;
      const prevSup = off?.previousSupplier ?? null;
      const buybackPrice =
        prevSup && comp
          ? (off?.supplierBuybackPrice ??
            calculateSupplierBuybackPrice(prevSup, comp.industry ?? "imbiss"))
          : undefined;

      return {
        id: w.id || `inbox-warn-${idx}`,
        title: w.title,
        body: w.body,
        createdAt: w.createdAt,
        companyId: w.companyId,
        productId: w.productId,
        dismissible: true,
        buybackLabel:
          isSupplierDrop && prevSup && buybackPrice !== undefined
            ? `Zurückkaufen (${money(buybackPrice, true)})`
            : undefined,
        onBuyback:
          isSupplierDrop && prevSup && w.companyId && w.productId
            ? () => {
                const err = s.buybackSupplier(w.companyId!, w.productId!);
                if (err) toast.error(err);
                else toast.success(`${prevSup.name} erfolgreich zurückgekauft!`);
              }
            : undefined,
        actionLabel: isSupplierDrop
          ? "Neuen wählen"
          : isDeliveryDelay
            ? "Lager prüfen"
            : hasCompany
              ? "Zum Betrieb"
              : "Finanzen prüfen",
        onAction: () => {
          if (w.companyId) {
            s.openCompany(w.companyId);
            if (isSupplierDrop || isDeliveryDelay || w.productId) {
              s.setCompanyTab("products");
            } else {
              s.setCompanyTab("overview");
            }
          } else {
            s.setTab("finance");
          }
        },
      };
    });

  const redCos = s.companies.filter((c) => c.status === "active" && c.cash < 0);
  const buybacks = s.companies.filter((c) => c.status === "buyback");
  if (redCos.length) {
    const firstRed = redCos[0]!;
    warnings.unshift({
      id: "sys-warn-red",
      title: "Firma im Minus",
      body: `${redCos.map((c) => c.name).join(", ")}: Kasse unter 0. An der Jahreskante droht Pleite und Schuldübernahme.`,
      createdAt: s.gameMinutes,
      companyId: firstRed.id,
      actionLabel: "Kasse ausgleichen",
      onAction: () => {
        s.openCompany(firstRed.id);
        s.setCompanyTab("money");
      },
    });
  }
  if (used / Math.max(1, s.creditLimit) >= 0.8) {
    warnings.unshift({
      id: "sys-warn-limit",
      title: "Kreditlimit eng",
      body: `Genutzt ${money(used)} von ${money(s.creditLimit)}.`,
      createdAt: s.gameMinutes,
      actionLabel: "Kredite tilgen",
      onAction: () => s.setTab("finance"),
    });
  }
  if (buybacks.length) {
    const firstBuy = buybacks[0]!;
    warnings.unshift({
      id: "sys-warn-buyback",
      title: "Rückkauf offen",
      body: buybacks.map((c) => `${c.name} · ${money(c.buybackPrice ?? 0)}`).join(" · "),
      createdAt: s.gameMinutes,
      companyId: firstBuy.id,
      actionLabel: "Rückkauf öffnen",
      onAction: () => s.openCompany(firstBuy.id),
    });
  }

  const clock = readClock(s);
  const threshold = yearThreshold(s.yearNetWorthBase);
  const early = canEndYearEarly(s);
  const dayProfit = s.companies.reduce((a, c) => a + (c.yesterday?.profit ?? 0), 0);
  const globalDemand = getGlobalMarketDemandInfo(s);
  const topInd = getAllIndustryDemands(s)[0];
  const topIndDef = topInd ? industryById(topInd.industry) : null;
  const topProdDef = topInd ? productById(topInd.topProduct.productId) : null;
  const stats = s.stats ?? {
    fromCompanies: 0,
    fromRentals: 0,
    fromDividends: 0,
    fromStockTrading: 0,
    fromCryptoTrading: 0,
    mergersCompleted: 0,
  };

  return (
    <div className="mx-auto max-w-3xl space-y-3 sm:space-y-4">
      {/* Kompakte Gesamtvermögen-Karte mit einklappbarem Chart & Hinweis */}
      <section className="rounded-xl bg-surface p-3.5 sm:p-5 shadow-[var(--shadow-border)]">
        <div className="flex items-start justify-between gap-2">
          <div>
            <div className="flex items-center gap-2">
              <p className="text-[10px] sm:text-xs uppercase tracking-wider text-muted">
                Gesamtvermögen
              </p>
              <Badge tone="accent" className="text-[10px] py-0 px-1.5 gap-1">
                <Trophy className="size-2.5" /> Rang #{playerRank}
              </Badge>
            </div>
            <p className="mt-0.5 font-display text-2xl sm:text-4xl tracking-tight">
              <Money value={nw} />
            </p>
            <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs sm:text-sm">
              <div>
                <Delta value={today} />
                <span className="text-muted"> seit Start</span>
              </div>
              {dailyRent + dailyDiv > 0 ? (
                <span className="text-xs text-gain tabular font-medium">
                  · Passiv +{money(dailyRent + dailyDiv)}/Tag
                </span>
              ) : null}
            </div>
          </div>

          <button
            type="button"
            onClick={() => setShowNetDetails((v) => !v)}
            className="inline-flex items-center gap-1 rounded-lg bg-raised px-2.5 py-1 text-[11px] font-medium text-muted hover:text-fg border border-[var(--border-subtle)] cursor-pointer shrink-0"
          >
            <span>{showNetDetails ? "Chart ▲" : "Chart & Info ▼"}</span>
          </button>
        </div>

        {/* Auf Desktop immer sichtbar, auf Smartphone einklappbar */}
        <div className={showNetDetails ? "mt-3 space-y-2.5 block" : "mt-3 space-y-2.5 hidden sm:block"}>
          <p className="max-w-prose text-xs text-faint">{HINTS.netWorth}</p>
          <Sparkline values={s.netHistory.map((p) => p.v)} />
        </div>
      </section>

      {/* Vermögens-Aufschlüsselung (Multi-Segment Bar + 6 Kategorien wie im Video) */}
      <section className="rounded-xl bg-surface p-3.5 sm:p-4 shadow-[var(--shadow-border)] space-y-3">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5">
            <PieChart className="size-3.5 text-accent" />
            <h2 className="text-xs sm:text-sm font-medium">Vermögens-Aufschlüsselung</h2>
          </div>
          {debt > 0.5 ? (
            <span className="text-[11px] text-warn tabular font-medium">
              Abzgl. Schulden: −{money(debt)}
            </span>
          ) : null}
        </div>

        {/* Multi-segment bar */}
        <div className="h-2.5 w-full overflow-hidden rounded-full bg-raised flex">
          {assetSegments.map((seg) => {
            const pct = (seg.val / totalGrossAssets) * 100;
            if (pct <= 0.2) return null;
            return (
              <div
                key={seg.key}
                style={{ width: `${pct}%`, backgroundColor: seg.color }}
                title={`${seg.label}: ${money(seg.val)} (${Math.round(pct)} %)`}
                className="h-full transition-all duration-300"
              />
            );
          })}
        </div>

        {/* 6 Segment Tiles */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 sm:gap-2">
          {assetSegments.map((seg) => {
            const pct = totalGrossAssets > 0 ? Math.round((seg.val / totalGrossAssets) * 100) : 0;
            return (
              <div
                key={seg.key}
                className="flex items-center justify-between gap-2 rounded-lg bg-raised/70 px-2.5 py-2 text-xs"
              >
                <div className="flex items-center gap-1.5 min-w-0">
                  <span
                    className="size-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: seg.color }}
                  />
                  <span className="text-muted truncate text-[11px]">{seg.label}</span>
                </div>
                <div className="text-right shrink-0 tabular">
                  <span className="font-semibold text-fg block text-[11px] sm:text-xs">
                    {money(seg.val)}
                  </span>
                  <span className="text-[10px] text-muted">{pct} %</span>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {s.companies.length > 0 ? (
        <section className="rounded-xl bg-surface p-3 sm:p-4 shadow-[var(--shadow-border)]">
          <div className="flex items-center justify-between">
            <p className="text-xs sm:text-sm font-medium">Gestern in den Betrieben</p>
            <Delta value={dayProfit} />
          </div>
          <ul className="mt-2 space-y-1.5">
            {s.companies.map((c) => {
              const compDemand = getCompanyDemandInfo(s, c);
              return (
                <li
                  key={c.id}
                  className="flex items-center justify-between gap-2 rounded-lg bg-raised/50 px-2.5 py-1.5 text-xs sm:text-sm"
                >
                  <div className="flex items-center gap-1.5 min-w-0">
                    <button
                      type="button"
                      onClick={() => {
                        s.setTab("biz");
                        s.openCompany(c.id);
                      }}
                      className="font-medium hover:underline cursor-pointer truncate"
                    >
                      {c.name}
                    </button>
                    <DemandBadge
                      info={compDemand}
                      prefix={compDemand.hasActiveProducts ? "Sort.:" : "Br.:"}
                      className="text-[10px] py-0 px-1.5"
                    />
                  </div>
                  <Delta value={c.yesterday?.profit ?? 0} withLabel={false} />
                </li>
              );
            })}
          </ul>
        </section>
      ) : (
        <section className="rounded-xl bg-surface p-3.5 sm:p-4 shadow-[var(--shadow-border)] flex items-center justify-between gap-3">
          <div>
            <p className="text-sm font-medium">Noch kein Unternehmen</p>
            <p className="text-xs text-muted">
              Lizenz kaufen & Betrieb gründen oder an der Börse handeln.
            </p>
          </div>
          <Button size="sm" className="shrink-0 gap-1" onClick={() => s.openFounding(true)}>
            <Plus className="size-3.5" />
            <span>Gründen</span>
          </Button>
        </section>
      )}

      {/* Warnungen mit Datum/Uhrzeit und Direkt-Aktion */}
      <section className="space-y-1.5">
        <div className="flex items-center justify-between">
          <p className="text-xs sm:text-sm font-medium">
            Warnungen & Ereignisse {warnings.length > 0 ? `(${warnings.length})` : ""}
          </p>
        </div>
        {warnings.length === 0 ? (
          <p className="rounded-xl bg-surface px-3 py-2 text-xs text-muted shadow-[var(--shadow-border)]">
            Keine offenen Risiken.
          </p>
        ) : (
          <ul className="space-y-1.5">
            {warnings.map((w) => (
              <li
                key={w.id}
                className="rounded-xl bg-surface p-2.5 sm:p-3 shadow-[var(--shadow-border)] border border-[var(--border-subtle)] space-y-1.5"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <AlertTriangle className="size-3.5 shrink-0 text-warn" />
                    <p className="text-xs sm:text-sm font-semibold text-fg truncate">{w.title}</p>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <span className="inline-flex items-center gap-1 rounded bg-raised px-1.5 py-0.5 text-[10px] tabular text-muted">
                      <Clock className="size-2.5 text-accent" />
                      {formatGameTimestamp(w.createdAt)}
                    </span>
                    {w.dismissible ? (
                      <button
                        type="button"
                        onClick={() => s.dismissInbox(w.id)}
                        className="flex size-5 items-center justify-center rounded text-muted hover:bg-raised hover:text-fg cursor-pointer"
                        aria-label="Meldung schließen"
                        title="Ausblenden"
                      >
                        <X className="size-3" />
                      </button>
                    ) : null}
                  </div>
                </div>

                <div className="flex flex-wrap items-end justify-between gap-2 pl-5">
                  <p className="text-xs text-muted leading-snug flex-1 min-w-[180px]">{w.body}</p>
                  <div className="flex flex-wrap items-center gap-1.5 shrink-0">
                    {w.onBuyback && w.buybackLabel ? (
                      <Button
                        size="sm"
                        className="h-7 px-2.5 text-[11px] gap-1 shrink-0"
                        onClick={w.onBuyback}
                      >
                        <RotateCcw className="size-3" />
                        <span>{w.buybackLabel}</span>
                      </Button>
                    ) : null}
                    {w.onAction && w.actionLabel ? (
                      <Button
                        size="sm"
                        variant="secondary"
                        className="h-7 px-2.5 text-[11px] gap-1 shrink-0"
                        onClick={w.onAction}
                      >
                        <span>{w.actionLabel}</span>
                        <ArrowRight className="size-3" />
                      </Button>
                    ) : null}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Lebenszeit-Statistik & Passives Einkommen (Video-Feature: Statistik) */}
      <section className="rounded-xl bg-surface p-3.5 sm:p-4 shadow-[var(--shadow-border)] space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <TrendingUp className="size-3.5 text-accent" />
            <h2 className="text-xs sm:text-sm font-medium">Ertrags-Statistik & Cashflow</h2>
          </div>
          <span className="text-[11px] text-muted tabular">
            Täglich passiv: <b className="text-gain">+{money(dailyRent + dailyDiv)}</b>
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-1.5 text-xs">
          <div className="rounded-lg bg-raised px-2.5 py-2">
            <span className="text-[10px] text-muted block truncate">Aus Unternehmen</span>
            <span className="font-semibold tabular text-fg block truncate">
              {money(stats.fromCompanies ?? 0)}
            </span>
          </div>
          <div className="rounded-lg bg-raised px-2.5 py-2">
            <span className="text-[10px] text-muted block truncate">Aus Vermietung</span>
            <span className="font-semibold tabular text-gain block truncate">
              {money(stats.fromRentals ?? 0)}
            </span>
          </div>
          <div className="rounded-lg bg-raised px-2.5 py-2">
            <span className="text-[10px] text-muted block truncate">Aus Dividenden</span>
            <span className="font-semibold tabular text-gain block truncate">
              {money(stats.fromDividends ?? 0)}
            </span>
          </div>
          <div className="rounded-lg bg-raised px-2.5 py-2">
            <span className="text-[10px] text-muted block truncate">Aktien-Gewinne</span>
            <span
              className={cn(
                "font-semibold tabular block truncate",
                (stats.fromStockTrading ?? 0) >= 0 ? "text-gain" : "text-loss",
              )}
            >
              {money(stats.fromStockTrading ?? 0)}
            </span>
          </div>
          <div className="rounded-lg bg-raised px-2.5 py-2 col-span-2 sm:col-span-1">
            <span className="text-[10px] text-muted block truncate">Krypto-Gewinne</span>
            <span
              className={cn(
                "font-semibold tabular block truncate",
                (stats.fromCryptoTrading ?? 0) >= 0 ? "text-gain" : "text-loss",
              )}
            >
              {money(stats.fromCryptoTrading ?? 0)}
            </span>
          </div>
        </div>
      </section>

      {/* Reichen-Rangliste (Forbes-Tycoon-Liste aus dem Video) */}
      <section className="rounded-xl bg-surface p-3.5 sm:p-4 shadow-[var(--shadow-border)] space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-1.5">
            <Crown className="size-4 text-accent" />
            <div>
              <h2 className="text-xs sm:text-sm font-medium">
                Reichen-Rangliste · Dein Platz: #{playerRank} von {combinedRichList.length}
              </h2>
              {nextRival ? (
                <p className="text-[11px] text-muted">
                  Noch <b className="text-fg tabular">{money(Math.max(0, nextRival.netWorth - nw))}</b>{" "}
                  bis #{playerRank - 1} ({nextRival.name})
                </p>
              ) : (
                <p className="text-[11px] text-gain font-medium">
                  Du stehst an der Spitze der Finanzwelt!
                </p>
              )}
            </div>
          </div>
          <button
            type="button"
            onClick={() => setShowFullRichList((v) => !v)}
            className="text-[11px] font-medium text-accent hover:underline cursor-pointer"
          >
            {showFullRichList ? "Kompakt anzeigen ▲" : "Alle Tycoons anzeigen ▼"}
          </button>
        </div>

        <ul className="space-y-1.5">
          {combinedRichList
            .map((entry, idx) => ({ ...entry, displayRank: idx + 1 }))
            .filter((_, idx) => {
              if (showFullRichList) return true;
              // Show top 3 plus immediate neighbors around the player
              return idx < 3 || Math.abs(idx - playerRankIdx) <= 1;
            })
            .map((entry) => (
              <li
                key={entry.id}
                className={cn(
                  "flex items-center justify-between gap-2.5 rounded-lg px-3 py-2 text-xs",
                  entry.isPlayer
                    ? "bg-accent/15 border border-accent/40 font-medium"
                    : "bg-raised/60",
                )}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <span
                    className="flex size-6 shrink-0 items-center justify-center rounded-full text-[11px] font-bold tabular text-white"
                    style={{ backgroundColor: entry.avatarColor }}
                  >
                    {entry.displayRank}
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-fg font-medium">{entry.name}</p>
                    <p className="truncate text-[10px] text-muted">{entry.title}</p>
                  </div>
                </div>
                <span className="tabular font-semibold text-fg shrink-0">
                  {money(entry.netWorth)}
                </span>
              </li>
            ))}
        </ul>
      </section>

      {/* Kompakter Geschäftsjahr- & Markttrend-Block */}
      <section className="rounded-xl bg-surface p-3 sm:p-4 shadow-[var(--shadow-border)] space-y-2.5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-1.5">
              <p className="text-xs sm:text-sm font-medium">Geschäftsjahr {s.year}</p>
              <DemandBadge info={globalDemand} prefix="Klima:" className="text-[10px] py-0 px-1.5" />
              <button
                type="button"
                onClick={() => setShowYearHint((v) => !v)}
                className="inline-flex items-center gap-0.5 text-[11px] text-muted hover:text-fg cursor-pointer"
              >
                <span>Info</span>
                {showYearHint ? <ChevronUp className="size-3" /> : <ChevronDown className="size-3" />}
              </button>
            </div>
            <p className="mt-0.5 text-[11px] text-muted tabular">
              Tag {clock.day}/{YEAR_LENGTH_DAYS} · Ziel: {money(threshold)} (+10 %)
            </p>
          </div>
          <Button
            variant="secondary"
            size="sm"
            className="h-7 px-2.5 text-xs"
            disabled={!early && clock.day < YEAR_LENGTH_DAYS}
            onClick={() => {
              const err = s.requestYearEnd();
              if (err) toast.error(err);
            }}
          >
            Jahr beenden
          </Button>
        </div>

        {showYearHint ? (
          <div className="rounded-lg bg-raised px-2.5 py-2 text-[11px] text-muted space-y-1">
            <p>{HINTS.year}</p>
            {s.market.yearNote ? <p className="text-fg">{s.market.yearNote}</p> : null}
          </div>
        ) : null}

        {/* Kompakter Markt-Trend-Hinweis mit Link zur Marktanalyse */}
        {topInd && topIndDef && topProdDef ? (
          <div className="rounded-lg bg-raised px-2.5 py-2 text-xs border border-[var(--border-subtle)] flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 min-w-0 truncate">
              <BarChart3 className="size-3.5 text-accent shrink-0" />
              <span className="font-medium text-fg truncate">
                Trend: {topIndDef.name} ({topInd.pct}% {topInd.arrow}) ·{" "}
                <b className="text-fg">{topProdDef.name}</b>
              </span>
            </div>
            <Button
              size="sm"
              variant="secondary"
              className="h-6 px-2 text-[11px] shrink-0"
              onClick={() => s.openMarketAnalysis(true)}
            >
              Marktanalyse
            </Button>
          </div>
        ) : null}

        {personalDebtTotal(s) > 0.5 ? (
          <p className="text-[11px] text-warn">
            Privatschulden {money(personalDebtTotal(s))} — Run-Ende nur an der Jahreskante.
          </p>
        ) : null}
      </section>
    </div>
  );
}
