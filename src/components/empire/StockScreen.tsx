import { useState, type MouseEvent, type TouchEvent } from "react";
import {
  ArrowDownRight,
  ArrowUpRight,
  Briefcase,
  ChevronRight,
  Coins,
  Flame,
  Sparkles,
  TrendingUp,
} from "lucide-react";
import { toast } from "sonner";
import {
  CRYPTOS,
  CRYPTO_SPREAD,
  STOCKS,
  STOCK_SPREAD,
  YEAR_LENGTH_DAYS,
  cryptoBySymbol,
  stockByTicker,
} from "@/game/catalog";
import {
  cryptoDayChange,
  cryptoPeriodStats,
  cryptoValue,
  dailyDividendEstimate,
  dayChange,
  stockPeriodStats,
  stockValue,
} from "@/game/sim";
import { useGame } from "@/game/store";
import type { CryptoDef, StockDef } from "@/game/types";
import { money, num, num1, pct, signedMoney } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { BackBar } from "./chrome";
import { Delta } from "./Delta";
import { Sparkline } from "./Sparkline";
import { cn } from "@/lib/utils";

type MarketSubTab = "stocks" | "crypto";
type TimeframeId = "1T" | "1W" | "1M" | "Max";
type BuyMode = "shares" | "amount";
type OrderSide = "buy" | "sell";
type DepotSort = "value" | "pnl";
type MarketSort = "default" | "gainers" | "losers" | "dividend";
type CryptoFilter = "all" | "hot" | "gainers" | "losers" | "cap";

const TIMEFRAMES: { id: TimeframeId; label: string; hours: number; periodLabel: string }[] = [
  { id: "1T", label: "1T", hours: 24, periodLabel: "24 Spielstunden" },
  { id: "1W", label: "1W", hours: 24 * 7, periodLabel: "7 Spieltage" },
  { id: "1M", label: "1M", hours: 24 * 30, periodLabel: "30 Spieltage" },
  { id: "Max", label: "Max", hours: Number.POSITIVE_INFINITY, periodLabel: "Gesamtverlauf" },
];

const ALLOCATION_COLORS = [
  "bg-[#4f9d6e]",
  "bg-[#5b8def]",
  "bg-[#c4a35a]",
  "bg-[#9b72cf]",
  "bg-[#45a1b8]",
  "bg-[#d97757]",
  "bg-[#7c9885]",
  "bg-[#c45c5c]",
];

function volatilityLabel(vol: number): string {
  if (vol <= 0.85) return "Niedrig";
  if (vol <= 1.2) return "Mittel";
  if (vol <= 2.0) return "Hoch";
  return "Sehr hoch";
}

function StockLogo({
  stock,
  className,
}: {
  stock: StockDef;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex shrink-0 items-center justify-center overflow-hidden rounded-lg bg-[#FFFFFF] p-0.5 shadow-[var(--shadow-border)] ring-1 ring-black/5",
        className,
      )}
    >
      <img
        src={stock.logo}
        alt={`${stock.name} (${stock.ticker})`}
        referrerPolicy="no-referrer"
        className="size-full object-contain"
      />
    </div>
  );
}

function CryptoBadge({
  coin,
  className,
}: {
  coin: CryptoDef;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex shrink-0 items-center justify-center rounded-xl font-display font-bold text-white shadow-xs select-none",
        className,
      )}
      style={{ backgroundColor: coin.color }}
    >
      <span className="text-xs tracking-tight">{coin.symbol.slice(0, 3)}</span>
    </div>
  );
}

export function StockScreen() {
  const s = useGame();
  const selectedTicker = s.ui.selectedTicker ?? null;
  const selectedCrypto = s.ui.selectedCrypto ?? null;
  const setSelectedTicker = s.openStock;
  const setSelectedCrypto = s.openCrypto;

  const [subTab, setSubTab] = useState<MarketSubTab>("stocks");
  const [sectorFilter, setSectorFilter] = useState<string>("Alle");
  const [depotSort, setDepotSort] = useState<DepotSort>("value");
  const [marketSort, setMarketSort] = useState<MarketSort>("default");
  const [cryptoFilter, setCryptoFilter] = useState<CryptoFilter>("all");

  if (selectedTicker) {
    const exists = STOCKS.some((st) => st.ticker === selectedTicker);
    if (exists) {
      return <StockDetail ticker={selectedTicker} onBack={() => setSelectedTicker(null)} />;
    }
  }

  if (selectedCrypto) {
    const exists = CRYPTOS.some((c) => c.symbol === selectedCrypto);
    if (exists) {
      return <CryptoDetail symbol={selectedCrypto} onBack={() => setSelectedCrypto(null)} />;
    }
  }

  const depotVal = stockValue(s);
  const cryptoVal = cryptoValue(s);
  const dailyDiv = dailyDividendEstimate(s);
  const annualDiv = dailyDiv * YEAR_LENGTH_DAYS;

  const totalCost = s.holdings.reduce((a, h) => a + h.avgCost * h.shares, 0);
  const totalPnl = depotVal - totalCost;
  const totalPnlPct = totalCost > 0 ? totalPnl / totalCost : 0;

  const enrichedHoldings = s.holdings
    .filter((h) => h.shares > 0)
    .map((h) => {
      const def = stockByTicker(h.ticker);
      const px = s.quotes[h.ticker] ?? def.base;
      const posValue = h.shares * px;
      const posCost = h.shares * h.avgCost;
      const pnlAbs = posValue - posCost;
      const pnlPct = posCost > 0 ? pnlAbs / posCost : 0;
      const weight = depotVal > 0 ? posValue / depotVal : 0;
      const chg24h = dayChange(h.ticker, s);
      const dailyDivPos = (posValue * def.dividendYield) / YEAR_LENGTH_DAYS;
      return {
        holding: h,
        def,
        px,
        posValue,
        posCost,
        pnlAbs,
        pnlPct,
        weight,
        chg24h,
        dailyDivPos,
      };
    })
    .sort((a, b) => (depotSort === "value" ? b.posValue - a.posValue : b.pnlPct - a.pnlPct));

  const sectors = ["Alle", ...Array.from(new Set(STOCKS.map((st) => st.sector)))];

  const filteredStocks = STOCKS.filter(
    (st) => sectorFilter === "Alle" || st.sector === sectorFilter,
  )
    .map((st) => {
      const px = s.quotes[st.ticker] ?? st.base;
      const chg = dayChange(st.ticker, s);
      const held = s.holdings.find((h) => h.ticker === st.ticker && h.shares > 0);
      const stats24 = stockPeriodStats(st.ticker, s, 24);
      return { st, px, chg, held, stats24 };
    })
    .sort((a, b) => {
      if (marketSort === "gainers") return b.chg - a.chg;
      if (marketSort === "losers") return a.chg - b.chg;
      if (marketSort === "dividend") return b.st.dividendYield - a.st.dividendYield;
      return 0;
    });

  // Curated Discovery Lists (Video-inspired: Stabile Einnahmen vs. Wachstumspotenzial)
  const topDividendStocks = STOCKS.filter((st) => st.style === "dividend")
    .sort((a, b) => b.dividendYield - a.dividendYield)
    .slice(0, 4);
  const topGrowthStocks = STOCKS.filter((st) => st.style === "growth").sort(
    (a, b) => b.vol - a.vol,
  );

  // Crypto calculations
  const totalCryptoCost = (s.cryptoHoldings ?? []).reduce((a, h) => a + h.avgCost * h.coins, 0);
  const totalCryptoPnl = cryptoVal - totalCryptoCost;
  const totalCryptoPnlPct = totalCryptoCost > 0 ? totalCryptoPnl / totalCryptoCost : 0;

  const enrichedCryptoHoldings = (s.cryptoHoldings ?? [])
    .filter((h) => h.coins > 0.0001)
    .map((h) => {
      const def = cryptoBySymbol(h.symbol);
      const px = s.cryptoQuotes?.[h.symbol] ?? def.base;
      const posValue = h.coins * px;
      const posCost = h.coins * h.avgCost;
      const pnlAbs = posValue - posCost;
      const pnlPct = posCost > 0 ? pnlAbs / posCost : 0;
      const weight = cryptoVal > 0 ? posValue / cryptoVal : 0;
      const chg24h = cryptoDayChange(h.symbol, s);
      return {
        holding: h,
        def,
        px,
        posValue,
        posCost,
        pnlAbs,
        pnlPct,
        weight,
        chg24h,
      };
    })
    .sort((a, b) => b.posValue - a.posValue);

  const filteredCryptos = CRYPTOS.map((coin) => {
    const px = s.cryptoQuotes?.[coin.symbol] ?? coin.base;
    const chg = cryptoDayChange(coin.symbol, s);
    const held = (s.cryptoHoldings ?? []).find((h) => h.symbol === coin.symbol && h.coins > 0.0001);
    const stats24 = cryptoPeriodStats(coin.symbol, s, 24);
    return { coin, px, chg, held, stats24 };
  })
    .filter((item) => {
      if (cryptoFilter === "hot") return Boolean(item.coin.isHot);
      return true;
    })
    .sort((a, b) => {
      if (cryptoFilter === "gainers") return b.chg - a.chg;
      if (cryptoFilter === "losers") return a.chg - b.chg;
      if (cryptoFilter === "cap") return a.coin.marketCapRank - b.coin.marketCapRank;
      return a.coin.marketCapRank - b.coin.marketCapRank;
    });

  const marketLedger = s.ledger
    .filter((e) => e.bucket === "stock" || e.bucket === "crypto" || e.bucket === "dividend")
    .slice(0, 8);

  return (
    <div className="mx-auto max-w-3xl space-y-4 sm:space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl tracking-tight">Börse & Kapitalmarkt</h1>
          <p className="mt-0.5 text-xs sm:text-sm text-muted">
            Dividendenstarke Aktien und dynamischer 24/7-Kryptohandel über dein Privatkonto.
          </p>
        </div>

        {/* Sub-Tab Umschalter: Aktienmarkt | Kryptobörse */}
        <div className="grid grid-cols-2 rounded-xl bg-surface p-1 shadow-[var(--shadow-border)] text-xs w-full sm:w-auto">
          <button
            type="button"
            onClick={() => setSubTab("stocks")}
            className={cn(
              "flex items-center justify-center gap-1.5 rounded-lg px-4 py-2 font-medium transition-colors cursor-pointer",
              subTab === "stocks" ? "bg-raised text-fg shadow-xs" : "text-muted hover:text-fg",
            )}
          >
            <TrendingUp className="size-3.5 text-accent" />
            <span>Aktien ({enrichedHoldings.length})</span>
          </button>
          <button
            type="button"
            onClick={() => setSubTab("crypto")}
            className={cn(
              "flex items-center justify-center gap-1.5 rounded-lg px-4 py-2 font-medium transition-colors cursor-pointer",
              subTab === "crypto" ? "bg-raised text-fg shadow-xs" : "text-muted hover:text-fg",
            )}
          >
            <Coins className="size-3.5 text-[#9b72cf]" />
            <span>Kryptobörse ({enrichedCryptoHoldings.length})</span>
          </button>
        </div>
      </header>

      {subTab === "stocks" ? (
        <>
          {/* Aktien-Portfolio Hero Card */}
          <section className="rounded-xl bg-surface p-3.5 sm:p-5 shadow-[var(--shadow-border)]">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-[11px] uppercase tracking-wider text-muted">
                  Mein Aktienportfolio
                </p>
                <p className="mt-0.5 font-display text-2xl sm:text-4xl tabular tracking-tight">
                  {money(depotVal, true)}
                </p>
                <div className="mt-1 flex flex-wrap items-center gap-1.5 text-xs sm:text-sm">
                  <span
                    className={cn(
                      "inline-flex items-center gap-1 tabular font-medium",
                      totalPnl >= 0 ? "text-gain" : "text-loss",
                    )}
                  >
                    {totalPnl >= 0 ? (
                      <ArrowUpRight className="size-3.5" />
                    ) : (
                      <ArrowDownRight className="size-3.5" />
                    )}
                    {signedMoney(totalPnl, true)} ({pct(totalPnlPct)})
                  </span>
                  <span className="text-[11px] text-muted">seit Kauf</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 text-right text-xs sm:min-w-56">
                <div className="rounded-lg bg-raised px-2.5 py-2">
                  <p className="text-[10px] text-muted">Dividende / Tag</p>
                  <p className="mt-0.5 tabular text-xs sm:text-sm font-semibold text-gain">
                    +{money(dailyDiv, true)}
                  </p>
                  <p className="text-[10px] text-faint tabular">~{money(annualDiv)} / Jahr</p>
                </div>
                <div className="rounded-lg bg-raised px-2.5 py-2">
                  <p className="text-[10px] text-muted">Positionen</p>
                  <p className="mt-0.5 tabular text-xs sm:text-sm font-medium text-fg">
                    {enrichedHoldings.length} / {STOCKS.length}
                  </p>
                  <p className="text-[10px] text-faint tabular">Einstand {money(totalCost)}</p>
                </div>
              </div>
            </div>

            {enrichedHoldings.length > 0 ? (
              <div className="mt-4 border-t border-border pt-3.5">
                <div className="flex items-center justify-between text-xs text-muted">
                  <span>Depot-Gewichtung</span>
                  <span className="tabular">100 %</span>
                </div>
                <div className="mt-2 flex h-2.5 w-full overflow-hidden rounded-full bg-raised">
                  {enrichedHoldings.map((item, idx) => (
                    <div
                      key={item.def.ticker}
                      style={{ width: `${Math.max(2, item.weight * 100)}%` }}
                      className={cn(
                        "h-full transition-all duration-150",
                        ALLOCATION_COLORS[idx % ALLOCATION_COLORS.length],
                      )}
                      title={`${item.def.name}: ${num1(item.weight * 100)} %`}
                    />
                  ))}
                </div>
                <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1.5 text-xs">
                  {enrichedHoldings.map((item, idx) => (
                    <button
                      key={item.def.ticker}
                      type="button"
                      onClick={() => setSelectedTicker(item.def.ticker)}
                      className="inline-flex items-center gap-1.5 text-muted transition-colors hover:text-fg cursor-pointer"
                    >
                      <span
                        className={cn(
                          "size-2 rounded-xs",
                          ALLOCATION_COLORS[idx % ALLOCATION_COLORS.length],
                        )}
                      />
                      <span className="font-medium text-fg">{item.def.ticker}</span>
                      <span className="tabular">{num1(item.weight * 100)} %</span>
                    </button>
                  ))}
                </div>
              </div>
            ) : null}
          </section>

          {/* Entdecker-Sektionen wie im Video: Stabile Einnahmen vs. Wachstumspotenzial */}
          <section className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div className="rounded-xl bg-surface p-3.5 sm:p-4 shadow-[var(--shadow-border)] space-y-2.5">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-sm font-semibold text-fg">Stabile Einnahmen</h2>
                  <p className="text-[11px] text-muted">Aktien mit den höchsten Dividenden</p>
                </div>
                <Badge tone="gain">Dividenden-Fokus</Badge>
              </div>
              <ul className="space-y-2">
                {topDividendStocks.map((st) => {
                  const px = s.quotes[st.ticker] ?? st.base;
                  return (
                    <li
                      key={st.ticker}
                      className="flex items-center justify-between gap-2 rounded-lg bg-raised/70 p-2"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <StockLogo stock={st} className="size-8" />
                        <div className="min-w-0">
                          <p className="text-xs font-medium text-fg truncate">{st.name}</p>
                          <p className="text-[11px] text-gain font-medium tabular">
                            {num1(st.dividendYield * 100)} % Dividende p.a.
                          </p>
                        </div>
                      </div>
                      <Button
                        size="sm"
                        variant="secondary"
                        className="h-7 px-2.5 text-[11px] shrink-0"
                        onClick={() => setSelectedTicker(st.ticker)}
                      >
                        Kaufen · {money(px, true)}
                      </Button>
                    </li>
                  );
                })}
              </ul>
            </div>

            <div className="rounded-xl bg-surface p-3.5 sm:p-4 shadow-[var(--shadow-border)] space-y-2.5">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-sm font-semibold text-fg">Wachstumspotenzial</h2>
                  <p className="text-[11px] text-muted">Dynamische Titel mit hoher Kurschance</p>
                </div>
                <Badge tone="warn">Wachstum</Badge>
              </div>
              <ul className="space-y-2">
                {topGrowthStocks.map((st) => {
                  const px = s.quotes[st.ticker] ?? st.base;
                  const chg = dayChange(st.ticker, s);
                  return (
                    <li
                      key={st.ticker}
                      className="flex items-center justify-between gap-2 rounded-lg bg-raised/70 p-2"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <StockLogo stock={st} className="size-8" />
                        <div className="min-w-0">
                          <p className="text-xs font-medium text-fg truncate">{st.name}</p>
                          <p className="text-[11px] text-muted tabular">
                            Volatilität {num1(st.vol * 100)} % · Heute{" "}
                            <span className={chg >= 0 ? "text-gain" : "text-loss"}>
                              {pct(chg)}
                            </span>
                          </p>
                        </div>
                      </div>
                      <Button
                        size="sm"
                        variant="secondary"
                        className="h-7 px-2.5 text-[11px] shrink-0"
                        onClick={() => setSelectedTicker(st.ticker)}
                      >
                        Kaufen · {money(px, true)}
                      </Button>
                    </li>
                  );
                })}
              </ul>
            </div>
          </section>

          {/* Bereich 1: Mein Depot */}
          {enrichedHoldings.length > 0 ? (
            <section className="space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Briefcase className="size-4 text-muted" />
                  <h2 className="text-base font-medium">Mein Aktien-Depot</h2>
                  <span className="text-xs text-muted">({enrichedHoldings.length})</span>
                </div>
                {enrichedHoldings.length > 1 ? (
                  <div className="flex rounded-lg bg-raised p-0.5 text-xs">
                    <button
                      type="button"
                      onClick={() => setDepotSort("value")}
                      className={cn(
                        "rounded-md px-2.5 py-1 transition-colors cursor-pointer",
                        depotSort === "value" ? "bg-surface text-fg" : "text-muted hover:text-fg",
                      )}
                    >
                      Nach Wert
                    </button>
                    <button
                      type="button"
                      onClick={() => setDepotSort("pnl")}
                      className={cn(
                        "rounded-md px-2.5 py-1 transition-colors cursor-pointer",
                        depotSort === "pnl" ? "bg-surface text-fg" : "text-muted hover:text-fg",
                      )}
                    >
                      Nach Rendite
                    </button>
                  </div>
                ) : null}
              </div>

              <ul className="space-y-2">
                {enrichedHoldings.map(
                  ({ holding, def, px, posValue, pnlAbs, pnlPct, dailyDivPos }) => {
                    const stats24 = stockPeriodStats(def.ticker, s, 24);
                    return (
                      <li key={def.ticker}>
                        <button
                          type="button"
                          onClick={() => setSelectedTicker(def.ticker)}
                          className="flex w-full items-center gap-3 rounded-xl bg-surface p-3.5 sm:p-4 text-left shadow-[var(--shadow-border)] transition-colors duration-150 hover:bg-raised/70 cursor-pointer"
                        >
                          <StockLogo stock={def} className="size-10" />

                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1.5">
                              <p className="truncate font-medium">{def.name}</p>
                              <span className="rounded bg-raised px-1.5 py-0.5 font-mono text-[10px] font-semibold text-muted">
                                {def.ticker}
                              </span>
                            </div>
                            <p className="mt-0.5 tabular text-xs text-muted">
                              {num(holding.shares)} Stk. · Buy-In {money(holding.avgCost, true)} · Kurs{" "}
                              {money(px, true)}
                            </p>
                            <p className="mt-0.5 tabular text-[11px] text-gain">
                              Dividende: +{money(dailyDivPos, true)} / Tag ({num1(def.dividendYield * 100)} % p.a.)
                            </p>
                          </div>

                          <div className="hidden w-20 sm:block">
                            <Sparkline values={stats24.series} positive={pnlAbs >= 0} />
                          </div>

                          <div className="text-right">
                            <p className="tabular text-sm font-medium">{money(posValue, true)}</p>
                            <p
                              className={cn(
                                "mt-0.5 tabular text-xs font-medium",
                                pnlAbs >= 0 ? "text-gain" : "text-loss",
                              )}
                            >
                              {signedMoney(pnlAbs, true)} ({pct(pnlPct)})
                            </p>
                          </div>

                          <ChevronRight className="size-4 shrink-0 text-faint" />
                        </button>
                      </li>
                    );
                  },
                )}
              </ul>
            </section>
          ) : null}

          {/* Bereich 2: Alle Aktien (Marktübersicht) */}
          <section className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <TrendingUp className="size-4 text-muted" />
                <h2 className="text-base font-medium">Börse — Alle Aktien</h2>
                <span className="text-xs text-muted">({filteredStocks.length})</span>
              </div>

              <div className="flex rounded-lg bg-raised p-0.5 text-xs">
                {(
                  [
                    ["default", "Alle"],
                    ["dividend", "Top Dividende"],
                    ["gainers", "Top 24h"],
                    ["losers", "Flop 24h"],
                  ] as const
                ).map(([id, label]) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => setMarketSort(id)}
                    className={cn(
                      "rounded-md px-2.5 py-1 transition-colors cursor-pointer",
                      marketSort === id ? "bg-surface text-fg" : "text-muted hover:text-fg",
                    )}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex gap-1.5 overflow-x-auto pb-1">
              {sectors.map((sec) => (
                <button
                  key={sec}
                  type="button"
                  onClick={() => setSectorFilter(sec)}
                  className={cn(
                    "h-8 shrink-0 rounded-md px-3 text-xs transition-colors duration-150 cursor-pointer",
                    sectorFilter === sec
                      ? "bg-accent text-accent-fg font-medium"
                      : "bg-raised text-muted hover:text-fg",
                  )}
                >
                  {sec}
                </button>
              ))}
            </div>

            <ul className="space-y-1.5">
              {filteredStocks.map(({ st, px, chg, held, stats24 }) => {
                const abs24 = stats24.changeAbs;
                return (
                  <li key={st.ticker}>
                    <button
                      type="button"
                      onClick={() => setSelectedTicker(st.ticker)}
                      className="flex w-full items-center gap-2.5 rounded-xl bg-surface p-2.5 sm:p-4 text-left shadow-[var(--shadow-border)] transition-colors duration-150 hover:bg-raised/70 cursor-pointer"
                    >
                      <StockLogo stock={st} className="size-9 sm:size-10" />

                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-x-1.5 gap-y-0.5">
                          <p className="truncate text-sm font-medium">{st.name}</p>
                          <span className="rounded bg-raised px-1.5 py-0.5 font-mono text-[10px] font-semibold text-muted">
                            {st.ticker}
                          </span>
                          <span className="text-[11px] text-gain font-medium tabular">
                            · {num1(st.dividendYield * 100)} % Div.
                          </span>
                        </div>
                        <p className="mt-0.5 text-[11px] text-muted truncate">
                          {held ? (
                            <span className="tabular text-fg">
                              Im Depot: {num(held.shares)} Stk. ({money(held.shares * px, true)})
                            </span>
                          ) : (
                            <span>
                              {st.sector} · 24h: {money(stats24.dayLow, true)} –{" "}
                              {money(stats24.dayHigh, true)}
                            </span>
                          )}
                        </p>
                      </div>

                      <div className="hidden w-20 shrink-0 sm:block">
                        <Sparkline values={stats24.series} positive={chg >= 0} />
                      </div>

                      <div className="shrink-0 text-right sm:min-w-24">
                        <p className="tabular text-xs sm:text-sm font-semibold">{money(px, true)}</p>
                        <p
                          className={cn(
                            "mt-0.5 tabular text-[11px]",
                            chg >= 0 ? "text-gain" : "text-loss",
                          )}
                        >
                          {signedMoney(abs24, true)} ({pct(chg)})
                        </p>
                      </div>

                      <ChevronRight className="size-4 shrink-0 text-faint" />
                    </button>
                  </li>
                );
              })}
            </ul>
          </section>
        </>
      ) : (
        /* SUB-TAB 2: KRYPTOBÖRSE */
        <>
          <section className="rounded-xl bg-surface p-3.5 sm:p-5 shadow-[var(--shadow-border)] border border-[#9b72cf]/25">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-[11px] uppercase tracking-wider text-muted">
                  Gesamtwert der Kryptowährung
                </p>
                <p className="mt-0.5 font-display text-2xl sm:text-4xl tabular tracking-tight">
                  {money(cryptoVal, true)}
                </p>
                <div className="mt-1 flex flex-wrap items-center gap-1.5 text-xs sm:text-sm">
                  <span
                    className={cn(
                      "inline-flex items-center gap-1 tabular font-medium",
                      totalCryptoPnl >= 0 ? "text-gain" : "text-loss",
                    )}
                  >
                    {totalCryptoPnl >= 0 ? (
                      <ArrowUpRight className="size-3.5" />
                    ) : (
                      <ArrowDownRight className="size-3.5" />
                    )}
                    {signedMoney(totalCryptoPnl, true)} ({pct(totalCryptoPnlPct)})
                  </span>
                  <span className="text-[11px] text-muted">seit Kauf · 0,6 % Spread</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 text-right text-xs sm:min-w-48">
                <div className="rounded-lg bg-raised px-2.5 py-2">
                  <p className="text-[10px] text-muted">Einstand Wallet</p>
                  <p className="mt-0.5 tabular text-xs sm:text-sm font-medium text-fg">
                    {money(totalCryptoCost, true)}
                  </p>
                </div>
                <div className="rounded-lg bg-raised px-2.5 py-2">
                  <p className="text-[10px] text-muted">Gehaltene Coins</p>
                  <p className="mt-0.5 tabular text-xs sm:text-sm font-medium text-fg">
                    {enrichedCryptoHoldings.length} / {CRYPTOS.length}
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Gehaltene Krypto-Positionen */}
          {enrichedCryptoHoldings.length > 0 ? (
            <section className="space-y-2.5">
              <h2 className="text-sm font-medium text-muted uppercase tracking-wider">
                Mein Krypto-Wallet
              </h2>
              <ul className="space-y-2">
                {enrichedCryptoHoldings.map(({ holding, def, px, posValue, pnlAbs, pnlPct }) => {
                  const stats24 = cryptoPeriodStats(def.symbol, s, 24);
                  return (
                    <li key={def.symbol}>
                      <button
                        type="button"
                        onClick={() => setSelectedCrypto(def.symbol)}
                        className="flex w-full items-center gap-3 rounded-xl bg-surface p-3.5 sm:p-4 text-left shadow-[var(--shadow-border)] transition-colors hover:bg-raised/70 cursor-pointer"
                      >
                        <CryptoBadge coin={def} className="size-10" />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5">
                            <p className="truncate font-medium">{def.name}</p>
                            <span className="rounded bg-raised px-1.5 py-0.5 font-mono text-[10px] font-semibold text-muted">
                              {def.symbol}
                            </span>
                          </div>
                          <p className="mt-0.5 tabular text-xs text-muted">
                            {holding.coins.toLocaleString("de-DE", {
                              maximumFractionDigits: 4,
                            })}{" "}
                            {def.symbol} · Buy-In {money(holding.avgCost, true)}
                          </p>
                        </div>

                        <div className="hidden w-20 sm:block">
                          <Sparkline values={stats24.series} positive={pnlAbs >= 0} />
                        </div>

                        <div className="text-right">
                          <p className="tabular text-sm font-medium">{money(posValue, true)}</p>
                          <p
                            className={cn(
                              "mt-0.5 tabular text-xs font-medium",
                              pnlAbs >= 0 ? "text-gain" : "text-loss",
                            )}
                          >
                            {signedMoney(pnlAbs, true)} ({pct(pnlPct)})
                          </p>
                        </div>
                        <ChevronRight className="size-4 shrink-0 text-faint" />
                      </button>
                    </li>
                  );
                })}
              </ul>
            </section>
          ) : null}

          {/* Kryptobörse mit Video-Filtern: Alle | Heiß | Gewinner | Verlierer | Höchste Obergrenze */}
          <section className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Sparkles className="size-4 text-[#9b72cf]" />
                <h2 className="text-base font-medium">Kryptobörse</h2>
              </div>

              <div className="flex flex-wrap rounded-lg bg-raised p-0.5 text-xs">
                {(
                  [
                    ["all", "Alle"],
                    ["hot", "Heiß"],
                    ["gainers", "Gewinner"],
                    ["losers", "Verlierer"],
                    ["cap", "Höchste Cap"],
                  ] as const
                ).map(([id, label]) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => setCryptoFilter(id)}
                    className={cn(
                      "rounded-md px-2.5 py-1 transition-colors cursor-pointer",
                      cryptoFilter === id ? "bg-surface text-fg font-medium" : "text-muted hover:text-fg",
                    )}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            <ul className="space-y-2">
              {filteredCryptos.map(({ coin, px, chg, held, stats24 }) => {
                const abs24 = stats24.changeAbs;
                return (
                  <li key={coin.symbol}>
                    <button
                      type="button"
                      onClick={() => setSelectedCrypto(coin.symbol)}
                      className="flex w-full items-center gap-3 rounded-xl bg-surface p-3 sm:p-4 text-left shadow-[var(--shadow-border)] transition-colors hover:bg-raised/70 cursor-pointer"
                    >
                      <CryptoBadge coin={coin} className="size-10" />

                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <p className="truncate text-sm font-medium">{coin.name}</p>
                          <span className="rounded bg-raised px-1.5 py-0.5 font-mono text-[10px] font-semibold text-muted">
                            {coin.symbol}
                          </span>
                          <span className="text-[10px] text-muted">· Rang #{coin.marketCapRank}</span>
                          {coin.isHot ? (
                            <span className="inline-flex items-center gap-0.5 rounded bg-amber-500/15 px-1.5 py-0.5 text-[10px] font-medium text-amber-500">
                              <Flame className="size-2.5" /> Heiß
                            </span>
                          ) : null}
                        </div>
                        <p className="mt-0.5 text-[11px] text-muted truncate">
                          {held ? (
                            <span className="tabular text-fg">
                              Im Wallet:{" "}
                              {held.coins.toLocaleString("de-DE", { maximumFractionDigits: 4 })}{" "}
                              {coin.symbol} ({money(held.coins * px, true)})
                            </span>
                          ) : (
                            <span>
                              {coin.category} · Volatilität {num1(coin.vol * 100)} %
                            </span>
                          )}
                        </p>
                      </div>

                      <div className="hidden w-20 shrink-0 sm:block">
                        <Sparkline values={stats24.series} positive={chg >= 0} />
                      </div>

                      <div className="shrink-0 text-right sm:min-w-24">
                        <p className="tabular text-xs sm:text-sm font-semibold">{money(px, true)}</p>
                        <p
                          className={cn(
                            "mt-0.5 tabular text-[11px]",
                            chg >= 0 ? "text-gain" : "text-loss",
                          )}
                        >
                          {signedMoney(abs24, true)} ({pct(chg)})
                        </p>
                      </div>

                      <ChevronRight className="size-4 shrink-0 text-faint" />
                    </button>
                  </li>
                );
              })}
            </ul>
          </section>
        </>
      )}

      {/* Letzte Kapitalmarkt-Buchungen */}
      {marketLedger.length > 0 ? (
        <section className="space-y-2">
          <h2 className="text-sm font-medium text-muted">Letzte Kapitalmarkt-Buchungen</h2>
          <ul className="divide-y divide-border rounded-xl bg-surface shadow-[var(--shadow-border)]">
            {marketLedger.map((entry) => (
              <li key={entry.id} className="flex items-center justify-between px-4 py-2.5 text-xs sm:text-sm">
                <span className="text-muted">{entry.label}</span>
                <Delta value={entry.amount} withLabel={false} />
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}

function StockDetail({ ticker, onBack }: { ticker: string; onBack: () => void }) {
  const s = useGame();
  const def = stockByTicker(ticker);
  const [timeframe, setTimeframe] = useState<TimeframeId>("1W");
  const [hoverIdx, setHoverIdx] = useState<number | null>(null);
  const [side, setSide] = useState<OrderSide>("buy");
  const [buyMode, setBuyMode] = useState<BuyMode>("shares");
  const [sharesInput, setSharesInput] = useState<string>("10");
  const [amountInput, setAmountInput] = useState<string>("1000");

  const tfConfig = TIMEFRAMES.find((t) => t.id === timeframe) ?? TIMEFRAMES[1]!;
  const stats = stockPeriodStats(ticker, s, tfConfig.hours);
  const px = stats.currentPrice;
  const held = s.holdings.find((h) => h.ticker === ticker && h.shares > 0);
  const depotVal = stockValue(s);

  const activeIdx =
    hoverIdx !== null && hoverIdx >= 0 && hoverIdx < stats.series.length ? hoverIdx : null;
  const displayPrice = activeIdx !== null ? stats.series[activeIdx]! : px;
  const displayChangeAbs = displayPrice - stats.startPrice;
  const displayChangePct = stats.startPrice > 0 ? displayChangeAbs / stats.startPrice : 0;

  const heldShares = held?.shares ?? 0;
  const posValue = heldShares * px;
  const posCost = held ? held.shares * held.avgCost : 0;
  const posPnlAbs = posValue - posCost;
  const posPnlPct = posCost > 0 ? posPnlAbs / posCost : 0;
  const posWeight = depotVal > 0 ? posValue / depotVal : 0;

  const unitBuyCostWithSpread = px * (1 + STOCK_SPREAD);
  const maxAffordableShares = Math.max(0, Math.floor(s.cash / unitBuyCostWithSpread));

  const parsedShares = Math.max(0, Math.floor(Number(sharesInput) || 0));
  const parsedAmount = Math.max(0, Number(amountInput) || 0);

  const effectiveShares =
    side === "buy"
      ? buyMode === "shares"
        ? parsedShares
        : Math.max(0, Math.floor(parsedAmount / unitBuyCostWithSpread))
      : Math.min(heldShares, parsedShares);

  const rawCourseValue = effectiveShares * px;
  const spreadFee = rawCourseValue * STOCK_SPREAD;
  const totalOrderAmount =
    side === "buy" ? rawCourseValue + spreadFee : Math.max(0, rawCourseValue - spreadFee);

  const realizedSellPnl =
    side === "sell" && held && effectiveShares > 0
      ? totalOrderAmount - effectiveShares * held.avgCost
      : 0;

  const canExecute =
    side === "buy"
      ? effectiveShares >= 1 && totalOrderAmount <= s.cash + 0.01
      : effectiveShares >= 1 && effectiveShares <= heldShares;

  const handleSellPercentage = (ratio: number) => {
    if (!heldShares) return;
    const target = ratio >= 1 ? heldShares : Math.max(1, Math.floor(heldShares * ratio));
    setSide("sell");
    setSharesInput(String(target));
  };

  const handleExecuteOrder = () => {
    if (effectiveShares < 1) {
      toast.error("Mindestens 1 Aktie erforderlich.");
      return;
    }
    if (side === "buy") {
      const err = s.buyShares(ticker, effectiveShares);
      if (err) toast.error(err);
      else {
        toast.success(
          `${num(effectiveShares)}× ${ticker} für ${money(totalOrderAmount, true)} gekauft.`,
        );
      }
    } else {
      const err = s.sellShares(ticker, effectiveShares);
      if (err) toast.error(err);
      else {
        toast.success(
          `${num(effectiveShares)}× ${ticker} für ${money(totalOrderAmount, true)} verkauft.`,
        );
      }
    }
  };

  const handleSellAllImmediate = () => {
    if (!heldShares) return;
    const proceeds = heldShares * px * (1 - STOCK_SPREAD);
    const err = s.sellShares(ticker, heldShares);
    if (err) toast.error(err);
    else {
      toast.success(`Alle ${num(heldShares)}× ${ticker} für ${money(proceeds, true)} verkauft.`);
    }
  };

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <BackBar title={`${def.name} (${def.ticker})`} onBack={onBack} />

      <section className="rounded-xl bg-surface p-5 shadow-[var(--shadow-border)]">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex items-start gap-3.5">
            <StockLogo stock={def} className="size-12 sm:size-14 rounded-xl p-1" />
            <div>
              <p className="text-xs text-muted">
                {def.sector} · WKN {def.ticker}001 ·{" "}
                <span className="text-gain font-medium">
                  {num1(def.dividendYield * 100)} % Dividende p.a.
                </span>
              </p>
              <p className="mt-1 font-display text-3xl sm:text-4xl tabular tracking-tight">
                {money(displayPrice, true)}
              </p>
              <div className="mt-1.5 flex items-center gap-2 text-sm">
                <span
                  className={cn(
                    "tabular font-medium",
                    displayChangeAbs >= 0 ? "text-gain" : "text-loss",
                  )}
                >
                  {signedMoney(displayChangeAbs, true)} ({pct(displayChangePct)})
                </span>
                <span className="text-xs text-muted">
                  {activeIdx !== null
                    ? `Punkt ${activeIdx + 1} / ${stats.series.length}`
                    : tfConfig.periodLabel}
                </span>
              </div>
            </div>
          </div>

          {held ? (
            <div className="rounded-lg bg-raised px-3.5 py-2 text-right">
              <p className="text-[11px] text-muted">Im Depot · {num(held.shares)} Stk.</p>
              <p className="tabular text-sm font-medium">{money(posValue, true)}</p>
              <p
                className={cn(
                  "tabular text-xs font-medium",
                  posPnlAbs >= 0 ? "text-gain" : "text-loss",
                )}
              >
                {signedMoney(posPnlAbs, true)} ({pct(posPnlPct)})
              </p>
            </div>
          ) : null}
        </div>

        <div className="mt-4">
          <InteractiveBrokerChart
            series={stats.series}
            buyIn={held?.avgCost}
            activeIdx={activeIdx}
            onHoverIndex={setHoverIdx}
          />
        </div>

        <div className="mt-4 grid grid-cols-4 gap-1 rounded-lg bg-raised p-1">
          {TIMEFRAMES.map((tf) => (
            <button
              key={tf.id}
              type="button"
              onClick={() => {
                setTimeframe(tf.id);
                setHoverIdx(null);
              }}
              className={cn(
                "h-9 rounded-md text-xs font-medium transition-colors duration-150 cursor-pointer",
                timeframe === tf.id ? "bg-surface text-fg" : "text-muted hover:text-fg",
              )}
            >
              {tf.label}
            </button>
          ))}
        </div>
      </section>

      <section className="rounded-xl bg-surface p-5 shadow-[var(--shadow-border)]">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-base font-medium">Deine Position</h2>
          {held ? (
            <Button variant="secondary" size="sm" onClick={handleSellAllImmediate}>
              Alles verkaufen · {money(heldShares * px * (1 - STOCK_SPREAD), true)}
            </Button>
          ) : (
            <span className="text-xs text-muted">Nicht im Bestand</span>
          )}
        </div>

        {held ? (
          <div className="mt-3 grid grid-cols-2 gap-2.5 sm:grid-cols-3">
            <MetricTile label="Anteile im Besitz" value={`${num(held.shares)} Stk.`} />
            <MetricTile label="Positionswert" value={money(posValue, true)} />
            <MetricTile label="Buy-In (Ø Kaufkurs)" value={money(held.avgCost, true)} />
            <MetricTile
              label="Dividende / Tag"
              value={`+${money((posValue * def.dividendYield) / YEAR_LENGTH_DAYS, true)}`}
              tone="gain"
            />
            <MetricTile
              label="Rendite seit Kauf"
              value={`${signedMoney(posPnlAbs, true)} (${pct(posPnlPct)})`}
              tone={posPnlAbs >= 0 ? "gain" : "loss"}
            />
            <MetricTile label="Depot-Gewichtung" value={`${num1(posWeight * 100)} %`} />
          </div>
        ) : (
          <p className="mt-2 text-sm text-muted">
            Du hältst aktuell keine Anteile von {def.name}. Nutze das Order-Ticket unten für einen
            Einstieg nach Stückzahl oder Wunschbetrag.
          </p>
        )}
      </section>

      <section className="rounded-xl bg-surface p-5 shadow-[var(--shadow-border)]">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-base font-medium">Order aufgeben</h2>
          <p className="tabular text-xs text-muted">
            Verfügbar: <span className="font-medium text-fg">{money(s.cash, true)}</span>
          </p>
        </div>

        <div className="mt-3 grid grid-cols-2 gap-1 rounded-lg bg-raised p-1">
          <button
            type="button"
            onClick={() => setSide("buy")}
            className={cn(
              "h-10 rounded-md text-sm font-medium transition-colors duration-150 cursor-pointer",
              side === "buy" ? "bg-surface text-fg" : "text-muted hover:text-fg",
            )}
          >
            Kaufen
          </button>
          <button
            type="button"
            onClick={() => setSide("sell")}
            disabled={heldShares <= 0}
            className={cn(
              "h-10 rounded-md text-sm font-medium transition-colors duration-150 disabled:opacity-40 cursor-pointer",
              side === "sell" ? "bg-surface text-fg" : "text-muted hover:text-fg",
            )}
          >
            Verkaufen {heldShares > 0 ? `(${num(heldShares)} Stk.)` : ""}
          </button>
        </div>

        {side === "buy" ? (
          <div className="mt-4 space-y-3">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs text-muted">Order-Typ</span>
              <div className="flex rounded-lg bg-raised p-0.5 text-xs">
                <button
                  type="button"
                  onClick={() => setBuyMode("shares")}
                  className={cn(
                    "rounded-md px-3 py-1 transition-colors cursor-pointer",
                    buyMode === "shares" ? "bg-surface text-fg font-medium" : "text-muted",
                  )}
                >
                  Nach Stückzahl
                </button>
                <button
                  type="button"
                  onClick={() => setBuyMode("amount")}
                  className={cn(
                    "rounded-md px-3 py-1 transition-colors cursor-pointer",
                    buyMode === "amount" ? "bg-surface text-fg font-medium" : "text-muted",
                  )}
                >
                  Nach Betrag (€)
                </button>
              </div>
            </div>

            {buyMode === "shares" ? (
              <div>
                <label className="block text-xs text-muted">
                  Stückzahl (max. {num(maxAffordableShares)} Stk. kaufbar)
                  <Input
                    type="number"
                    min={1}
                    step={1}
                    value={sharesInput}
                    onChange={(e) => setSharesInput(e.target.value)}
                    className="mt-1 tabular"
                  />
                </label>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {[1, 5, 10, 25, 50].map((n) => (
                    <button
                      key={n}
                      type="button"
                      onClick={() => setSharesInput(String(n))}
                      className="h-8 rounded-md bg-raised px-2.5 tabular text-xs text-muted transition-colors hover:text-fg cursor-pointer"
                    >
                      {n} Stk.
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => setSharesInput(String(Math.max(1, maxAffordableShares)))}
                    className="h-8 rounded-md bg-raised px-2.5 tabular text-xs font-medium text-fg transition-colors hover:bg-accent hover:text-accent-fg cursor-pointer"
                  >
                    Max ({num(maxAffordableShares)})
                  </button>
                </div>
              </div>
            ) : (
              <div>
                <label className="block text-xs text-muted">
                  Wunschbetrag in Euro (ergibt {num(effectiveShares)} ganze Stücke)
                  <Input
                    type="number"
                    min={10}
                    step={50}
                    value={amountInput}
                    onChange={(e) => setAmountInput(e.target.value)}
                    className="mt-1 tabular"
                  />
                </label>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {[500, 1000, 2500, 5000].map((eur) => (
                    <button
                      key={eur}
                      type="button"
                      onClick={() => setAmountInput(String(eur))}
                      className="h-8 rounded-md bg-raised px-2.5 tabular text-xs text-muted transition-colors hover:text-fg cursor-pointer"
                    >
                      {money(eur)}
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => setAmountInput(String(Math.floor(s.cash)))}
                    className="h-8 rounded-md bg-raised px-2.5 tabular text-xs font-medium text-fg transition-colors hover:bg-accent hover:text-accent-fg cursor-pointer"
                  >
                    Max ({money(Math.floor(s.cash))})
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="mt-4 space-y-3">
            <div>
              <label className="block text-xs text-muted">
                Zu verkaufende Stückzahl (Bestand: {num(heldShares)} Stk.)
                <Input
                  type="number"
                  min={1}
                  max={heldShares}
                  step={1}
                  value={sharesInput}
                  onChange={(e) => setSharesInput(e.target.value)}
                  className="mt-1 tabular"
                />
              </label>
              <div className="mt-2 flex flex-wrap gap-1.5">
                <button
                  type="button"
                  onClick={() => handleSellPercentage(0.25)}
                  className="h-8 rounded-md bg-raised px-3 tabular text-xs text-muted transition-colors hover:text-fg cursor-pointer"
                >
                  25 % ({num(Math.max(1, Math.floor(heldShares * 0.25)))} Stk.)
                </button>
                <button
                  type="button"
                  onClick={() => handleSellPercentage(0.5)}
                  className="h-8 rounded-md bg-raised px-3 tabular text-xs text-muted transition-colors hover:text-fg cursor-pointer"
                >
                  50 % ({num(Math.max(1, Math.floor(heldShares * 0.5)))} Stk.)
                </button>
                <button
                  type="button"
                  onClick={() => handleSellPercentage(1)}
                  className="h-8 rounded-md bg-raised px-3 tabular text-xs font-medium text-fg transition-colors hover:bg-accent hover:text-accent-fg cursor-pointer"
                >
                  Alles verkaufen ({num(heldShares)} Stk.)
                </button>
              </div>
            </div>
          </div>
        )}

        <dl className="mt-4 space-y-1.5 rounded-lg bg-raised p-3.5 text-xs">
          <div className="flex justify-between">
            <dt className="text-muted">Ausführung ({num(effectiveShares)} × {money(px, true)})</dt>
            <dd className="tabular text-fg">{money(rawCourseValue, true)}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-muted">Spread / Ordergebühr (0,4 %)</dt>
            <dd className="tabular text-muted">{money(spreadFee, true)}</dd>
          </div>
          {side === "sell" && held && effectiveShares > 0 ? (
            <div className="flex justify-between">
              <dt className="text-muted">Realisierter Gewinn/Verlust (ggü. Buy-In)</dt>
              <dd
                className={cn(
                  "tabular font-medium",
                  realizedSellPnl >= 0 ? "text-gain" : "text-loss",
                )}
              >
                {signedMoney(realizedSellPnl, true)}
              </dd>
            </div>
          ) : null}
          <div className="flex justify-between border-t border-border pt-2 text-sm font-medium">
            <dt>{side === "buy" ? "Gesamtsumme (Belastung)" : "Gutschrift Privatkonto"}</dt>
            <dd className="tabular">{money(totalOrderAmount, true)}</dd>
          </div>
        </dl>

        <Button className="mt-4 w-full" disabled={!canExecute} onClick={handleExecuteOrder}>
          {side === "buy"
            ? `${num(effectiveShares)} Stk. kaufen · ${money(totalOrderAmount, true)}`
            : `${num(effectiveShares)} Stk. verkaufen · ${money(totalOrderAmount, true)}`}
        </Button>
      </section>

      <section className="rounded-xl bg-surface p-5 shadow-[var(--shadow-border)]">
        <h2 className="text-base font-medium">Kennzahlen & Profil</h2>
        <p className="mt-1 text-sm text-muted">{def.blurb}</p>

        <div className="mt-4 grid grid-cols-2 gap-2.5 sm:grid-cols-3">
          <MetricTile label="Tageshoch (24h)" value={money(stats.dayHigh, true)} />
          <MetricTile label="Tagestief (24h)" value={money(stats.dayLow, true)} />
          <MetricTile
            label="Dividendenrendite"
            value={`${num1(def.dividendYield * 100)} % p.a.`}
            tone="gain"
          />
          <MetricTile label={`Spanne (${tfConfig.label})`} value={`${money(stats.low, true)} – ${money(stats.high, true)}`} />
          <MetricTile
            label="Volatilität"
            value={`${volatilityLabel(def.vol)} (${num1(def.vol * 100)} %)`}
          />
          <MetricTile label="Basis-Referenzkurs" value={money(def.base, true)} />
        </div>
      </section>
    </div>
  );
}

function CryptoDetail({ symbol, onBack }: { symbol: string; onBack: () => void }) {
  const s = useGame();
  const def = cryptoBySymbol(symbol);
  const [timeframe, setTimeframe] = useState<TimeframeId>("1W");
  const [hoverIdx, setHoverIdx] = useState<number | null>(null);
  const [side, setSide] = useState<OrderSide>("buy");
  const [amountInput, setAmountInput] = useState<string>("1000");
  const [coinsInput, setCoinsInput] = useState<string>("1");

  const tfConfig = TIMEFRAMES.find((t) => t.id === timeframe) ?? TIMEFRAMES[1]!;
  const stats = cryptoPeriodStats(symbol, s, tfConfig.hours);
  const px = stats.currentPrice;
  const held = (s.cryptoHoldings ?? []).find((h) => h.symbol === symbol && h.coins > 0.0001);

  const activeIdx =
    hoverIdx !== null && hoverIdx >= 0 && hoverIdx < stats.series.length ? hoverIdx : null;
  const displayPrice = activeIdx !== null ? stats.series[activeIdx]! : px;
  const displayChangeAbs = displayPrice - stats.startPrice;
  const displayChangePct = stats.startPrice > 0 ? displayChangeAbs / stats.startPrice : 0;

  const heldCoins = held?.coins ?? 0;
  const posValue = heldCoins * px;
  const posCost = held ? held.coins * held.avgCost : 0;
  const posPnlAbs = posValue - posCost;
  const posPnlPct = posCost > 0 ? posPnlAbs / posCost : 0;

  const unitBuyCost = px * (1 + CRYPTO_SPREAD);
  const parsedAmount = Math.max(0, Number(amountInput) || 0);
  const parsedSellCoins = Math.max(0, Number(coinsInput) || 0);

  const effectiveCoins =
    side === "buy"
      ? Math.round((parsedAmount / unitBuyCost) * 10000) / 10000
      : Math.min(heldCoins, parsedSellCoins);

  const rawValue = effectiveCoins * px;
  const spreadFee = rawValue * CRYPTO_SPREAD;
  const totalOrderAmount =
    side === "buy" ? rawValue + spreadFee : Math.max(0, rawValue - spreadFee);

  const canExecute =
    side === "buy"
      ? effectiveCoins >= 0.001 && totalOrderAmount <= s.cash + 0.05
      : effectiveCoins >= 0.0001 && effectiveCoins <= heldCoins + 0.0001;

  const handleExecute = () => {
    if (side === "buy") {
      const err = s.buyCrypto(symbol, effectiveCoins);
      if (err) toast.error(err);
      else {
        toast.success(
          `${effectiveCoins.toLocaleString("de-DE", { maximumFractionDigits: 4 })} ${symbol} gekauft.`,
        );
      }
    } else {
      const err = s.sellCrypto(symbol, effectiveCoins);
      if (err) toast.error(err);
      else {
        toast.success(
          `${effectiveCoins.toLocaleString("de-DE", { maximumFractionDigits: 4 })} ${symbol} verkauft.`,
        );
      }
    }
  };

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <BackBar title={`${def.name} (${def.symbol})`} onBack={onBack} />

      <section className="rounded-xl bg-surface p-5 shadow-[var(--shadow-border)]">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex items-start gap-3.5">
            <CryptoBadge coin={def} className="size-12 sm:size-14 text-sm" />
            <div>
              <p className="text-xs text-muted">
                {def.category} · Marktrang #{def.marketCapRank}
              </p>
              <p className="mt-1 font-display text-3xl sm:text-4xl tabular tracking-tight">
                {money(displayPrice, true)}
              </p>
              <div className="mt-1.5 flex items-center gap-2 text-sm">
                <span
                  className={cn(
                    "tabular font-medium",
                    displayChangeAbs >= 0 ? "text-gain" : "text-loss",
                  )}
                >
                  {signedMoney(displayChangeAbs, true)} ({pct(displayChangePct)})
                </span>
                <span className="text-xs text-muted">{tfConfig.periodLabel}</span>
              </div>
            </div>
          </div>

          {held ? (
            <div className="rounded-lg bg-raised px-3.5 py-2 text-right">
              <p className="text-[11px] text-muted">
                Im Wallet · {held.coins.toLocaleString("de-DE", { maximumFractionDigits: 4 })}{" "}
                {def.symbol}
              </p>
              <p className="tabular text-sm font-medium">{money(posValue, true)}</p>
              <p
                className={cn(
                  "tabular text-xs font-medium",
                  posPnlAbs >= 0 ? "text-gain" : "text-loss",
                )}
              >
                {signedMoney(posPnlAbs, true)} ({pct(posPnlPct)})
              </p>
            </div>
          ) : null}
        </div>

        <div className="mt-4">
          <InteractiveBrokerChart
            series={stats.series}
            buyIn={held?.avgCost}
            activeIdx={activeIdx}
            onHoverIndex={setHoverIdx}
          />
        </div>

        <div className="mt-4 grid grid-cols-4 gap-1 rounded-lg bg-raised p-1">
          {TIMEFRAMES.map((tf) => (
            <button
              key={tf.id}
              type="button"
              onClick={() => {
                setTimeframe(tf.id);
                setHoverIdx(null);
              }}
              className={cn(
                "h-9 rounded-md text-xs font-medium transition-colors cursor-pointer",
                timeframe === tf.id ? "bg-surface text-fg" : "text-muted hover:text-fg",
              )}
            >
              {tf.label}
            </button>
          ))}
        </div>
      </section>

      <section className="rounded-xl bg-surface p-5 shadow-[var(--shadow-border)] space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-medium">Krypto-Order (Bruchstücke möglich)</h2>
          <span className="text-xs text-muted tabular">
            Verfügbar: <b className="text-fg">{money(s.cash, true)}</b>
          </span>
        </div>

        <div className="grid grid-cols-2 gap-1 rounded-lg bg-raised p-1">
          <button
            type="button"
            onClick={() => setSide("buy")}
            className={cn(
              "h-10 rounded-md text-sm font-medium transition-colors cursor-pointer",
              side === "buy" ? "bg-surface text-fg" : "text-muted hover:text-fg",
            )}
          >
            Kaufen (nach €)
          </button>
          <button
            type="button"
            onClick={() => {
              setSide("sell");
              if (heldCoins > 0) setCoinsInput(String(heldCoins));
            }}
            disabled={heldCoins <= 0}
            className={cn(
              "h-10 rounded-md text-sm font-medium transition-colors disabled:opacity-40 cursor-pointer",
              side === "sell" ? "bg-surface text-fg" : "text-muted hover:text-fg",
            )}
          >
            Verkaufen
          </button>
        </div>

        {side === "buy" ? (
          <div>
            <label className="block text-xs text-muted">
              Investitionsbetrag in Euro (ergibt ca.{" "}
              {effectiveCoins.toLocaleString("de-DE", { maximumFractionDigits: 4 })} {symbol})
              <Input
                type="number"
                min={10}
                step={50}
                value={amountInput}
                onChange={(e) => setAmountInput(e.target.value)}
                className="mt-1 tabular"
              />
            </label>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {[250, 1000, 2500, 10000].map((eur) => (
                <button
                  key={eur}
                  type="button"
                  onClick={() => setAmountInput(String(eur))}
                  className="h-8 rounded-md bg-raised px-2.5 tabular text-xs text-muted hover:text-fg cursor-pointer"
                >
                  {money(eur)}
                </button>
              ))}
              <button
                type="button"
                onClick={() => setAmountInput(String(Math.floor(s.cash)))}
                className="h-8 rounded-md bg-raised px-2.5 tabular text-xs font-medium text-fg hover:bg-accent hover:text-accent-fg cursor-pointer"
              >
                Max ({money(Math.floor(s.cash))})
              </button>
            </div>
          </div>
        ) : (
          <div>
            <label className="block text-xs text-muted">
              Zu verkaufende Coins (Bestand:{" "}
              {heldCoins.toLocaleString("de-DE", { maximumFractionDigits: 4 })} {symbol})
              <Input
                type="number"
                min={0.001}
                step={0.1}
                value={coinsInput}
                onChange={(e) => setCoinsInput(e.target.value)}
                className="mt-1 tabular"
              />
            </label>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {[0.25, 0.5, 1].map((ratio) => (
                <button
                  key={ratio}
                  type="button"
                  onClick={() =>
                    setCoinsInput(String(Math.round(heldCoins * ratio * 10000) / 10000))
                  }
                  className="h-8 rounded-md bg-raised px-3 tabular text-xs text-muted hover:text-fg cursor-pointer"
                >
                  {ratio * 100} %
                </button>
              ))}
            </div>
          </div>
        )}

        <Button className="w-full" disabled={!canExecute} onClick={handleExecute}>
          {side === "buy"
            ? `${effectiveCoins.toLocaleString("de-DE", { maximumFractionDigits: 4 })} ${symbol} kaufen · ${money(totalOrderAmount, true)}`
            : `${effectiveCoins.toLocaleString("de-DE", { maximumFractionDigits: 4 })} ${symbol} verkaufen · ${money(totalOrderAmount, true)}`}
        </Button>
      </section>
    </div>
  );
}

function MetricTile({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone?: "gain" | "loss";
}) {
  return (
    <div className="rounded-lg bg-raised px-3 py-2.5">
      <p className="text-[11px] text-muted">{label}</p>
      <p
        className={cn(
          "mt-0.5 tabular text-sm font-medium",
          tone === "gain" ? "text-gain" : tone === "loss" ? "text-loss" : "text-fg",
        )}
      >
        {value}
      </p>
    </div>
  );
}

function InteractiveBrokerChart({
  series,
  buyIn,
  activeIdx,
  onHoverIndex,
}: {
  series: number[];
  buyIn?: number;
  activeIdx: number | null;
  onHoverIndex: (idx: number | null) => void;
}) {
  if (series.length < 2) {
    return <div className="h-52 w-full rounded-lg bg-raised" />;
  }

  const w = 640;
  const h = 210;
  const padY = 18;

  const rawMin = Math.min(...series);
  const rawMax = Math.max(...series);
  const includeBuyIn =
    buyIn !== undefined && buyIn >= rawMin * 0.8 && buyIn <= rawMax * 1.2;
  const min = includeBuyIn && buyIn !== undefined ? Math.min(rawMin, buyIn) : rawMin;
  const max = includeBuyIn && buyIn !== undefined ? Math.max(rawMax, buyIn) : rawMax;
  const span = max - min || 1;

  const toX = (i: number) => (i / (series.length - 1)) * w;
  const toY = (v: number) => h - padY - ((v - min) / span) * (h - padY * 2);

  const points = series.map((v, i) => `${toX(i).toFixed(1)},${toY(v).toFixed(1)}`).join(" ");
  const areaPoints = `0,${h} ${points} ${w},${h}`;

  const up = series[series.length - 1]! >= series[0]!;
  const strokeColor = up ? "var(--empire-gain)" : "var(--empire-loss)";
  const gradId = up ? "broker-grad-gain" : "broker-grad-loss";

  const handlePointer = (clientX: number, rect: DOMRect) => {
    const ratio = Math.max(0, Math.min(1, (clientX - rect.left) / Math.max(1, rect.width)));
    const idx = Math.round(ratio * (series.length - 1));
    onHoverIndex(idx);
  };

  const onMouseMove = (e: MouseEvent<SVGSVGElement>) => {
    handlePointer(e.clientX, e.currentTarget.getBoundingClientRect());
  };

  const onTouchMove = (e: TouchEvent<SVGSVGElement>) => {
    const touch = e.touches[0];
    if (!touch) return;
    handlePointer(touch.clientX, e.currentTarget.getBoundingClientRect());
  };

  const buyInY = includeBuyIn && buyIn !== undefined ? toY(buyIn) : null;
  const activeX = activeIdx !== null ? toX(activeIdx) : null;
  const activeY = activeIdx !== null ? toY(series[activeIdx]!) : null;

  return (
    <div className="relative select-none">
      <div className="mb-1 flex justify-between tabular text-[11px] text-faint">
        <span>Tief {money(rawMin, true)}</span>
        {buyIn !== undefined ? <span>Buy-In {money(buyIn, true)}</span> : null}
        <span>Hoch {money(rawMax, true)}</span>
      </div>
      <svg
        viewBox={`0 0 ${w} ${h}`}
        className="h-36 sm:h-52 w-full cursor-crosshair overflow-visible rounded-lg bg-raised/50"
        onMouseMove={onMouseMove}
        onMouseLeave={() => onHoverIndex(null)}
        onTouchStart={onTouchMove}
        onTouchMove={onTouchMove}
        onTouchEnd={() => onHoverIndex(null)}
      >
        <defs>
          <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={strokeColor} stopOpacity="0.24" />
            <stop offset="100%" stopColor={strokeColor} stopOpacity="0.0" />
          </linearGradient>
        </defs>

        <polygon points={areaPoints} fill={`url(#${gradId})`} />

        {buyInY !== null ? (
          <line
            x1={0}
            y1={buyInY}
            x2={w}
            y2={buyInY}
            stroke="var(--empire-warn)"
            strokeWidth="1.2"
            strokeDasharray="4 4"
            opacity="0.75"
          />
        ) : null}

        <polyline
          fill="none"
          stroke={strokeColor}
          strokeWidth="2.2"
          strokeLinejoin="round"
          strokeLinecap="round"
          points={points}
        />

        {activeX !== null && activeY !== null ? (
          <>
            <line
              x1={activeX}
              y1={0}
              x2={activeX}
              y2={h}
              stroke="var(--empire-muted)"
              strokeWidth="1"
              strokeDasharray="3 3"
            />
            <circle
              cx={activeX}
              cy={activeY}
              r="4.5"
              fill={strokeColor}
              stroke="var(--empire-surface)"
              strokeWidth="2"
            />
          </>
        ) : null}
      </svg>
    </div>
  );
}
