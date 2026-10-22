import { useState } from "react";
import {
  Anchor,
  Award,
  Building,
  Car,
  CheckCircle2,
  Coins,
  Crown,
  Gem,
  Hammer,
  Lock,
  MapPin,
  Palette,
  Plane,
  Sparkles,
  Stamp,
  X,
} from "lucide-react";
import { toast } from "sonner";
import {
  COLLECTION_CATEGORIES,
  COLLECTION_ITEMS,
  POSSESSIONS,
  REAL_ESTATE,
} from "@/game/catalog";
import {
  collectionValue,
  netWorth,
  propertyDailyRent,
  realEstateValue,
  totalDailyRent,
} from "@/game/sim";
import { useGame } from "@/game/store";
import type {
  CollectionCategoryId,
  HangarCategory,
  PossessionDef,
} from "@/game/types";
import { money, num1 } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type AssetsSubTab = "luxury" | "realestate" | "collections";
type HangarFilter = "all" | HangarCategory;
type RealEstateSort = "cheapest" | "expensive" | "yield";
type RealEstateSubView = "market" | "owned";

function HangarArtwork({ item }: { item: PossessionDef }) {
  if (item.image) {
    return (
      <img
        src={item.image}
        alt={item.name}
        referrerPolicy="no-referrer"
        className="h-full w-full object-contain transition-transform duration-300 group-hover:scale-105"
      />
    );
  }
  const Icon =
    item.hangar === "harbor"
      ? Anchor
      : item.hangar === "hangar"
        ? Plane
        : item.hangar === "garage"
          ? Car
          : Crown;
  const accent =
    item.hangar === "harbor"
      ? "#0284c7"
      : item.hangar === "hangar"
        ? "#6366f1"
        : "#d97757";
  return (
    <div className="flex flex-col items-center justify-center gap-2 text-center">
      <div
        className="flex size-16 items-center justify-center rounded-2xl shadow-md"
        style={{ backgroundColor: `${accent}18`, color: accent }}
      >
        <Icon className="size-8" />
      </div>
      <span className="text-[11px] font-medium text-neutral-500">{item.category}</span>
    </div>
  );
}

function CollectionCategoryIcon({
  id,
  color,
}: {
  id: CollectionCategoryId;
  color: string;
}) {
  const Icon =
    id === "coins"
      ? Coins
      : id === "paintings"
        ? Palette
        : id === "uniques"
          ? Crown
          : id === "retroCars"
            ? Car
            : id === "jewels"
              ? Gem
              : Stamp;
  return (
    <div
      className="flex size-11 shrink-0 items-center justify-center rounded-xl"
      style={{ backgroundColor: `${color}20`, color }}
    >
      <Icon className="size-5" />
    </div>
  );
}

export function AssetsScreen() {
  const s = useGame();
  const nw = netWorth(s);

  const [subTab, setSubTab] = useState<AssetsSubTab>("luxury");
  const [hangarFilter, setHangarFilter] = useState<HangarFilter>("all");
  const [selectedItem, setSelectedItem] = useState<PossessionDef | null>(null);

  const [reSubView, setReSubView] = useState<RealEstateSubView>("market");
  const [reSort, setReSort] = useState<RealEstateSort>("cheapest");

  const [activeCollectionCat, setActiveCollectionCat] =
    useState<CollectionCategoryId>("coins");

  const ownedPossessions = POSSESSIONS.filter((p) => s.possessions.includes(p.id));
  const totalLuxuryValue = ownedPossessions.reduce((sum, p) => sum + p.price, 0);
  const reVal = realEstateValue(s);
  const dailyRent = totalDailyRent(s);
  const colVal = collectionValue(s);

  const filteredPossessions = POSSESSIONS.filter((p) => {
    if (hangarFilter === "all") return true;
    return (p.hangar ?? "status") === hangarFilter;
  });

  const sortedRealEstate = REAL_ESTATE.slice().sort((a, b) => {
    if (reSort === "cheapest") return a.price - b.price;
    if (reSort === "expensive") return b.price - a.price;
    return b.dailyRent / b.price - a.dailyRent / a.price;
  });

  const activeCategoryDef =
    COLLECTION_CATEGORIES.find((c) => c.id === activeCollectionCat) ??
    COLLECTION_CATEGORIES[0]!;
  const activeCatItems = COLLECTION_ITEMS.filter(
    (i) => i.categoryId === activeCategoryDef.id,
  );

  return (
    <div className="mx-auto max-w-3xl space-y-4 sm:space-y-5">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl tracking-tight">
            Besitz, Immobilien & Sammlungen
          </h1>
          <p className="mt-0.5 text-xs sm:text-sm text-muted">
            Baue dein Immobilien-Portfolio mit täglichen Mieteinnahmen, deinen Fuhrpark und seltene
            Sammlungen auf.
          </p>
        </div>

        {/* Sub-Tabs: Status & Fuhrpark | Immobilien | Sammlungen */}
        <div className="grid grid-cols-3 rounded-xl bg-surface p-1 shadow-[var(--shadow-border)] text-xs w-full sm:w-auto">
          <button
            type="button"
            onClick={() => setSubTab("luxury")}
            className={cn(
              "flex items-center justify-center gap-1.5 rounded-lg px-3 py-2 font-medium transition-colors cursor-pointer",
              subTab === "luxury" ? "bg-raised text-fg shadow-xs" : "text-muted hover:text-fg",
            )}
          >
            <Car className="size-3.5 text-accent" />
            <span className="truncate">Fuhrpark ({ownedPossessions.length})</span>
          </button>
          <button
            type="button"
            onClick={() => setSubTab("realestate")}
            className={cn(
              "flex items-center justify-center gap-1.5 rounded-lg px-3 py-2 font-medium transition-colors cursor-pointer",
              subTab === "realestate"
                ? "bg-raised text-fg shadow-xs"
                : "text-muted hover:text-fg",
            )}
          >
            <Building className="size-3.5 text-[#45a1b8]" />
            <span className="truncate">Immobilien ({s.realEstate.length})</span>
          </button>
          <button
            type="button"
            onClick={() => setSubTab("collections")}
            className={cn(
              "flex items-center justify-center gap-1.5 rounded-lg px-3 py-2 font-medium transition-colors cursor-pointer",
              subTab === "collections"
                ? "bg-raised text-fg shadow-xs"
                : "text-muted hover:text-fg",
            )}
          >
            <Gem className="size-3.5 text-[#9b72cf]" />
            <span className="truncate">Sammlungen ({s.collections.length})</span>
          </button>
        </div>
      </header>

      {/* ===================================================================== */}
      {/* SUB-TAB 1: STATUS, GARAGE, HAFEN & HANGAR                             */}
      {/* ===================================================================== */}
      {subTab === "luxury" ? (
        <>
          <section className="grid grid-cols-3 gap-2 sm:gap-3">
            <div className="rounded-xl bg-surface p-3 sm:p-3.5 shadow-[var(--shadow-border)]">
              <span className="text-[10px] sm:text-[11px] uppercase tracking-wider text-muted block">
                Status & Fuhrpark
              </span>
              <div className="mt-1 flex items-baseline gap-1.5">
                <span className="font-display text-lg sm:text-2xl font-semibold tabular text-fg">
                  {ownedPossessions.length}
                </span>
                <span className="text-xs text-muted tabular">/ {POSSESSIONS.length}</span>
              </div>
            </div>

            <div className="rounded-xl bg-surface p-3 sm:p-3.5 shadow-[var(--shadow-border)]">
              <span className="text-[10px] sm:text-[11px] uppercase tracking-wider text-muted block">
                Ansehen (Ruf)
              </span>
              <div className="mt-1 flex items-baseline gap-1.5">
                <span className="font-display text-lg sm:text-2xl font-semibold tabular text-accent">
                  +{s.reputation}
                </span>
                <span className="text-xs text-muted">Gesamt</span>
              </div>
            </div>

            <div className="rounded-xl bg-surface p-3 sm:p-3.5 shadow-[var(--shadow-border)]">
              <span className="text-[10px] sm:text-[11px] uppercase tracking-wider text-muted block">
                Fuhrpark-Wert
              </span>
              <div className="mt-1 flex items-baseline gap-1.5">
                <span className="font-display text-lg sm:text-2xl font-semibold tabular text-fg truncate">
                  {money(totalLuxuryValue)}
                </span>
              </div>
            </div>
          </section>

          {/* Hangar-Kategorie-Pills (wie im Video: Status, Garage, Hafen, Flugzeughalle) */}
          <div className="flex gap-1.5 overflow-x-auto pb-1">
            {(
              [
                ["all", "Alle Bereiche"],
                ["status", "Status & Residenz"],
                ["garage", "Garage & Showroom"],
                ["harbor", "Yachthafen"],
                ["hangar", "Flugzeughalle"],
              ] as const
            ).map(([id, label]) => (
              <button
                key={id}
                type="button"
                onClick={() => setHangarFilter(id)}
                className={cn(
                  "h-8 shrink-0 rounded-lg px-3 text-xs font-medium transition-colors cursor-pointer",
                  hangarFilter === id
                    ? "bg-accent text-accent-fg"
                    : "bg-surface text-muted hover:text-fg shadow-[var(--shadow-border)]",
                )}
              >
                {label}
              </button>
            ))}
          </div>

          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 sm:gap-4">
            {filteredPossessions.map((p) => {
              const owned = s.possessions.includes(p.id);
              const netWorthLocked = nw < p.minNetWorth;
              const locked = Boolean(p.comingSoon || netWorthLocked);
              const canAfford = s.cash >= p.price;
              const unlockProgress =
                p.minNetWorth > 0
                  ? Math.min(100, Math.max(0, Math.round((nw / p.minNetWorth) * 100)))
                  : 100;

              return (
                <li
                  key={p.id}
                  className={cn(
                    "group relative flex flex-col overflow-hidden rounded-2xl bg-surface shadow-[var(--shadow-border)] transition-all",
                    owned ? "ring-1 ring-gain/35" : locked ? "opacity-90" : "hover:shadow-md",
                  )}
                >
                  <button
                    type="button"
                    onClick={() => setSelectedItem(p)}
                    className="relative aspect-[4/3] w-full overflow-hidden bg-[#FFFFFF] p-4 sm:p-5 flex items-center justify-center border-b border-[var(--border-subtle)] cursor-pointer text-left"
                  >
                    <HangarArtwork item={p} />

                    <span className="absolute left-3 top-3 rounded-md bg-neutral-900/75 px-2 py-0.5 text-[10px] font-medium tracking-wide uppercase text-white backdrop-blur-xs">
                      {p.category}
                    </span>

                    <span className="absolute right-3 top-3 inline-flex items-center gap-1 rounded-md bg-amber-500/15 border border-amber-600/25 px-2 py-0.5 text-[11px] font-semibold text-amber-800">
                      <Award className="size-3 text-amber-600" />
                      +{p.reputation} Ruf
                    </span>

                    {owned ? (
                      <span className="absolute bottom-2.5 left-3 inline-flex items-center gap-1 rounded-md bg-emerald-600 px-2 py-0.5 text-[10px] font-semibold text-white shadow-xs">
                        <CheckCircle2 className="size-3" />
                        Im Besitz
                      </span>
                    ) : netWorthLocked ? (
                      <span className="absolute bottom-2.5 left-3 inline-flex items-center gap-1 rounded-md bg-neutral-900/80 px-2 py-0.5 text-[10px] font-medium text-white backdrop-blur-xs">
                        <Lock className="size-3" />
                        Ab {money(p.minNetWorth)} Vermögen
                      </span>
                    ) : null}
                  </button>

                  <div className="flex flex-1 flex-col justify-between p-3.5 sm:p-4 space-y-3">
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <button
                          type="button"
                          onClick={() => setSelectedItem(p)}
                          className="font-display text-base sm:text-lg font-semibold tracking-tight text-fg hover:text-accent transition-colors cursor-pointer text-left"
                        >
                          {p.name}
                        </button>
                        <span className="tabular text-sm sm:text-base font-semibold text-fg shrink-0">
                          {money(p.price)}
                        </span>
                      </div>
                      <p className="mt-1 text-xs text-muted leading-relaxed line-clamp-2">
                        {p.blurb}
                      </p>
                    </div>

                    <div className="space-y-2.5 pt-1 border-t border-[var(--border-subtle)]">
                      {!owned && p.minNetWorth > 0 ? (
                        <div className="space-y-1">
                          <div className="flex items-center justify-between text-[11px]">
                            <span className="text-muted">
                              Voraussetzung: {money(p.minNetWorth)} Vermögen
                            </span>
                            <span
                              className={cn(
                                "tabular font-medium",
                                netWorthLocked ? "text-muted" : "text-gain",
                              )}
                            >
                              {netWorthLocked ? `${unlockProgress} %` : "Erfüllt"}
                            </span>
                          </div>
                          {netWorthLocked ? (
                            <div className="h-1.5 w-full overflow-hidden rounded-full bg-raised">
                              <div
                                className="h-full rounded-full bg-accent transition-all duration-300"
                                style={{ width: `${unlockProgress}%` }}
                              />
                            </div>
                          ) : null}
                        </div>
                      ) : null}

                      <div className="flex items-center justify-between gap-2">
                        {owned ? (
                          <div className="flex w-full items-center justify-between">
                            <span className="text-[11px] text-muted">Dauerhafter Bonus aktiv</span>
                            <Badge tone="gain">In deiner Sammlung</Badge>
                          </div>
                        ) : (
                          <Button
                            size="sm"
                            variant={!locked && canAfford ? "primary" : "secondary"}
                            className="w-full h-9 text-xs font-medium justify-between px-3"
                            disabled={locked || !canAfford}
                            onClick={() => {
                              const err = s.buyPossession(p.id);
                              if (err) toast.error(err);
                              else toast.success(`${p.name} erworben (+${p.reputation} Ruf).`);
                            }}
                          >
                            <span>
                              {netWorthLocked
                                ? "Noch gesperrt"
                                : !canAfford
                                  ? "Guthaben fehlt"
                                  : "Statussymbol erwerben"}
                            </span>
                            <span className="tabular font-semibold">{money(p.price)}</span>
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        </>
      ) : null}

      {/* ===================================================================== */}
      {/* SUB-TAB 2: IMMOBILIENMARKT & MEINE IMMOBILIEN                         */}
      {/* ===================================================================== */}
      {subTab === "realestate" ? (
        <div className="space-y-4">
          {/* Immobilien-Hero-Karte wie im Video */}
          <section className="rounded-xl bg-surface p-4 sm:p-5 shadow-[var(--shadow-border)] border border-[#45a1b8]/25">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-[11px] uppercase tracking-wider text-muted">
                  Mieteinnahmen pro Spieltag
                </p>
                <p className="mt-0.5 font-display text-2xl sm:text-4xl tabular tracking-tight text-gain">
                  +{money(dailyRent)} <span className="text-sm font-normal text-muted">/ Tag</span>
                </p>
                <p className="mt-1 text-xs text-muted">
                  Wird täglich um 00:00 Uhr direkt deinem Privatkonto gutgeschrieben.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-2 text-right text-xs sm:min-w-52">
                <div className="rounded-lg bg-raised px-3 py-2">
                  <p className="text-[10px] text-muted">Portfoliowert</p>
                  <p className="mt-0.5 tabular text-xs sm:text-sm font-semibold text-fg">
                    {money(reVal)}
                  </p>
                </div>
                <div className="rounded-lg bg-raised px-3 py-2">
                  <p className="text-[10px] text-muted">Meine Objekte</p>
                  <p className="mt-0.5 tabular text-xs sm:text-sm font-semibold text-fg">
                    {s.realEstate.length} / {REAL_ESTATE.length}
                  </p>
                </div>
              </div>
            </div>

            {/* 2 Große Auswahl-Karten wie im Video: Immobilienmarkt vs. Meine Immobilien */}
            <div className="mt-4 grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => setReSubView("market")}
                className={cn(
                  "rounded-xl p-3 text-left transition-all cursor-pointer border",
                  reSubView === "market"
                    ? "bg-raised border-[#45a1b8] shadow-xs"
                    : "bg-raised/40 border-transparent hover:bg-raised/80",
                )}
              >
                <p className="font-display text-sm font-semibold text-fg">Immobilienmarkt</p>
                <p className="mt-0.5 text-[11px] text-muted line-clamp-1">
                  Kaufe Rendite-Objekte und sichere dir laufende Mieten
                </p>
              </button>
              <button
                type="button"
                onClick={() => setReSubView("owned")}
                className={cn(
                  "rounded-xl p-3 text-left transition-all cursor-pointer border",
                  reSubView === "owned"
                    ? "bg-raised border-[#45a1b8] shadow-xs"
                    : "bg-raised/40 border-transparent hover:bg-raised/80",
                )}
              >
                <p className="font-display text-sm font-semibold text-fg">
                  Meine Immobilien ({s.realEstate.length})
                </p>
                <p className="mt-0.5 text-[11px] text-muted line-clamp-1">
                  Renovierungen & Miet-Upgrades verwalten
                </p>
              </button>
            </div>
          </section>

          {reSubView === "market" ? (
            <div className="space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h2 className="text-base font-medium">Verfügbare Immobilien</h2>
                <div className="flex rounded-lg bg-raised p-0.5 text-xs">
                  {(
                    [
                      ["cheapest", "Günstigste zuerst"],
                      ["expensive", "Teuerste zuerst"],
                      ["yield", "Höchste Rendite"],
                    ] as const
                  ).map(([id, label]) => (
                    <button
                      key={id}
                      type="button"
                      onClick={() => setReSort(id)}
                      className={cn(
                        "rounded-md px-2.5 py-1 transition-colors cursor-pointer",
                        reSort === id ? "bg-surface text-fg font-medium" : "text-muted hover:text-fg",
                      )}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {sortedRealEstate.map((prop) => {
                  const ownedObj = s.realEstate.find((r) => r.propertyId === prop.id);
                  const isOwned = Boolean(ownedObj);
                  const nwLocked = nw < prop.minNetWorth;
                  const canAfford = s.cash >= prop.price;
                  const currentRent = ownedObj ? propertyDailyRent(ownedObj) : prop.dailyRent;
                  const annualYieldPct = ((currentRent * 360) / prop.price) * 100;

                  return (
                    <li
                      key={prop.id}
                      className={cn(
                        "rounded-2xl bg-surface p-4 shadow-[var(--shadow-border)] flex flex-col justify-between gap-3",
                        isOwned ? "ring-1 ring-gain/40" : "",
                      )}
                    >
                      <div className="space-y-2">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <div
                              className="flex size-10 shrink-0 items-center justify-center rounded-xl"
                              style={{
                                backgroundColor: `${prop.accentColor}20`,
                                color: prop.accentColor,
                              }}
                            >
                              <Building className="size-5" />
                            </div>
                            <div>
                              <span className="text-[10px] uppercase tracking-wider text-muted block">
                                {prop.category}
                              </span>
                              <h3 className="font-display text-base font-semibold text-fg leading-snug">
                                {prop.name}
                              </h3>
                            </div>
                          </div>
                          {isOwned ? <Badge tone="gain">Im Bestand</Badge> : null}
                        </div>

                        <div className="flex items-center gap-1 text-xs text-muted">
                          <MapPin className="size-3.5 text-accent shrink-0" />
                          <span>{prop.city}</span>
                          <span>·</span>
                          <span className="text-gain font-medium tabular">
                            {num1(annualYieldPct)} % Mietrendite
                          </span>
                        </div>

                        <p className="text-xs text-muted leading-relaxed">{prop.blurb}</p>
                      </div>

                      <div className="space-y-2.5 pt-2.5 border-t border-[var(--border-subtle)]">
                        <div className="grid grid-cols-2 gap-2 rounded-lg bg-raised px-3 py-2 text-xs">
                          <div>
                            <span className="text-[10px] text-muted block">Kaufpreis</span>
                            <span className="tabular font-semibold text-fg">
                              {money(prop.price)}
                            </span>
                          </div>
                          <div className="text-right">
                            <span className="text-[10px] text-muted block">Miete / Tag</span>
                            <span className="tabular font-semibold text-gain">
                              +{money(currentRent)}
                            </span>
                          </div>
                        </div>

                        {isOwned ? (
                          <Button
                            size="sm"
                            variant="secondary"
                            className="w-full h-8 text-xs"
                            onClick={() => setReSubView("owned")}
                          >
                            Renovierungen verwalten ({ownedObj?.upgrades.length ?? 0}/
                            {prop.upgrades.length})
                          </Button>
                        ) : (
                          <Button
                            size="sm"
                            variant={!nwLocked && canAfford ? "primary" : "secondary"}
                            className="w-full h-9 text-xs justify-between px-3"
                            disabled={nwLocked || !canAfford}
                            onClick={() => {
                              const err = s.buyRealEstate(prop.id);
                              if (err) toast.error(err);
                              else {
                                toast.success(
                                  `${prop.name} gekauft (+${money(prop.dailyRent)} Miete/Tag)!`,
                                );
                              }
                            }}
                          >
                            <span>
                              {nwLocked
                                ? `Ab ${money(prop.minNetWorth)} Vermögen`
                                : !canAfford
                                  ? "Guthaben fehlt"
                                  : "Immobilie kaufen"}
                            </span>
                            <span className="tabular font-semibold">{money(prop.price)}</span>
                          </Button>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>
          ) : (
            /* Meine Immobilien + Renovierungen */
            <div className="space-y-3">
              {s.realEstate.length === 0 ? (
                <div className="rounded-xl bg-surface p-8 text-center shadow-[var(--shadow-border)] space-y-2">
                  <Building className="size-8 text-muted mx-auto opacity-50" />
                  <p className="text-sm font-medium text-fg">Noch keine Immobilien im Bestand</p>
                  <p className="text-xs text-muted">
                    Wechsle zum Immobilienmarkt, um dein erstes Mietobjekt zu erwerben.
                  </p>
                  <Button size="sm" onClick={() => setReSubView("market")}>
                    Zum Immobilienmarkt
                  </Button>
                </div>
              ) : (
                <ul className="space-y-3">
                  {s.realEstate.map((owned) => {
                    const def = REAL_ESTATE.find((r) => r.id === owned.propertyId);
                    if (!def) return null;
                    const rent = propertyDailyRent(owned);

                    return (
                      <li
                        key={owned.propertyId}
                        className="rounded-2xl bg-surface p-4 sm:p-5 shadow-[var(--shadow-border)] space-y-3.5"
                      >
                        <div className="flex flex-wrap items-start justify-between gap-2">
                          <div>
                            <div className="flex items-center gap-2">
                              <h3 className="font-display text-lg font-semibold text-fg">
                                {def.name}
                              </h3>
                              <Badge tone="gain">+{money(rent)} / Tag</Badge>
                            </div>
                            <p className="text-xs text-muted">
                              {def.city} · Bisherige Mieteinnahmen:{" "}
                              <b className="text-fg tabular">{money(owned.lifetimeRent ?? 0)}</b>
                            </p>
                          </div>

                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 px-2.5 text-xs text-muted hover:text-loss"
                            onClick={() => {
                              const err = s.sellRealEstate(def.id);
                              if (err) toast.error(err);
                              else toast.success(`${def.name} verkauft.`);
                            }}
                          >
                            Objekt verkaufen
                          </Button>
                        </div>

                        <div className="space-y-2">
                          <p className="text-xs font-medium text-muted uppercase tracking-wider">
                            Objekt-Modernisierungen ({owned.upgrades.length} / {def.upgrades.length})
                          </p>
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                            {def.upgrades.map((up) => {
                              const done = owned.upgrades.includes(up.id);
                              const canAfford = s.cash >= up.cost;
                              return (
                                <div
                                  key={up.id}
                                  className={cn(
                                    "rounded-xl p-3 border flex flex-col justify-between gap-2",
                                    done
                                      ? "bg-gain/10 border-gain/30"
                                      : "bg-raised border-[var(--border-subtle)]",
                                  )}
                                >
                                  <div>
                                    <div className="flex items-center justify-between gap-1">
                                      <span className="text-xs font-medium text-fg">{up.name}</span>
                                      {done ? (
                                        <CheckCircle2 className="size-3.5 text-gain shrink-0" />
                                      ) : null}
                                    </div>
                                    <p className="mt-0.5 text-[11px] text-gain font-medium tabular">
                                      +{up.rentBoostPct} % Mieteinnahmen
                                    </p>
                                  </div>
                                  {done ? (
                                    <span className="text-[11px] text-gain font-medium">
                                      Ausgebaut
                                    </span>
                                  ) : (
                                    <Button
                                      size="sm"
                                      variant="secondary"
                                      className="h-7 text-[11px] w-full gap-1"
                                      disabled={!canAfford}
                                      onClick={() => {
                                        const err = s.upgradeRealEstate(def.id, up.id);
                                        if (err) toast.error(err);
                                        else
                                          toast.success(
                                            `${up.name} abgeschlossen (+${up.rentBoostPct} % Miete)!`,
                                          );
                                      }}
                                    >
                                      <Hammer className="size-3" />
                                      <span>{money(up.cost)}</span>
                                    </Button>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          )}
        </div>
      ) : null}

      {/* ===================================================================== */}
      {/* SUB-TAB 3: SAMMLUNGEN (Münzen, Gemälde, Unikate, Retroautos, Juwelen) */}
      {/* ===================================================================== */}
      {subTab === "collections" ? (
        <div className="space-y-4">
          <section className="rounded-xl bg-surface p-4 shadow-[var(--shadow-border)] flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-[11px] uppercase tracking-wider text-muted">
                Gesamtwert deiner Sammlungen
              </p>
              <p className="mt-0.5 font-display text-2xl sm:text-3xl font-semibold tabular">
                {money(colVal)}
              </p>
            </div>
            <div className="text-right text-xs text-muted">
              <p>
                Exponate:{" "}
                <b className="text-fg tabular">
                  {s.collections.length} von {COLLECTION_ITEMS.length}
                </b>
              </p>
              <p className="text-[11px]">
                Vollständige Sammlungen erhöhen dauerhaft Ruf & Kreditlimit
              </p>
            </div>
          </section>

          {/* 2-Spalten Kategorie-Grid wie im Video */}
          <section className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
            {COLLECTION_CATEGORIES.map((cat) => {
              const items = COLLECTION_ITEMS.filter((i) => i.categoryId === cat.id);
              const ownedCount = items.filter((i) => s.collections.includes(i.id)).length;
              const completed = ownedCount === items.length;
              const isSelected = activeCollectionCat === cat.id;

              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setActiveCollectionCat(cat.id)}
                  className={cn(
                    "rounded-2xl bg-surface p-3.5 text-left shadow-[var(--shadow-border)] transition-all cursor-pointer border",
                    isSelected
                      ? "border-accent ring-1 ring-accent"
                      : "border-transparent hover:bg-raised/60",
                  )}
                >
                  <div className="flex items-start justify-between gap-2">
                    <CollectionCategoryIcon id={cat.id} color={cat.accentColor} />
                    {completed ? (
                      <Badge tone="gain" className="text-[10px]">
                        Komplett
                      </Badge>
                    ) : null}
                  </div>
                  <p className="mt-2.5 font-display text-sm sm:text-base font-semibold text-fg">
                    {cat.name}
                  </p>
                  <p className="text-xs text-muted tabular">
                    {ownedCount} von {items.length}
                  </p>
                  <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-raised">
                    <div
                      className="h-full rounded-full transition-all duration-300"
                      style={{
                        width: `${(ownedCount / items.length) * 100}%`,
                        backgroundColor: cat.accentColor,
                      }}
                    />
                  </div>
                </button>
              );
            })}
          </section>

          {/* Exponate der gewählten Sammel-Kategorie */}
          <section className="rounded-2xl bg-surface p-4 sm:p-5 shadow-[var(--shadow-border)] space-y-3.5">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--border-subtle)] pb-3">
              <div>
                <h2 className="font-display text-lg font-semibold text-fg">
                  Sammlung: {activeCategoryDef.name}
                </h2>
                <p className="text-xs text-muted">{activeCategoryDef.subtitle}</p>
              </div>
              <div className="text-right text-xs">
                <span className="text-muted block">Komplettierungs-Bonus:</span>
                <span className="font-semibold text-accent tabular">
                  +{activeCategoryDef.bonusReputation} Ruf · +
                  {money(activeCategoryDef.bonusCreditLimit)} Kreditlimit
                </span>
              </div>
            </div>

            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {activeCatItems.map((item) => {
                const owned = s.collections.includes(item.id);
                const canAfford = s.cash >= item.price;
                return (
                  <li
                    key={item.id}
                    className={cn(
                      "rounded-xl p-3.5 border flex flex-col justify-between gap-3",
                      owned
                        ? "bg-gain/5 border-gain/30"
                        : "bg-raised/60 border-[var(--border-subtle)]",
                    )}
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <span className="text-[10px] uppercase tracking-wider text-muted block">
                            {item.era}
                          </span>
                          <h3 className="font-medium text-sm sm:text-base text-fg">{item.name}</h3>
                        </div>
                        <span className="rounded-md bg-accent/15 px-2 py-0.5 text-[11px] font-semibold text-accent shrink-0">
                          +{item.reputation} Ruf
                        </span>
                      </div>
                      <p className="mt-1 text-xs text-muted leading-relaxed">{item.blurb}</p>
                    </div>

                    <div className="flex items-center justify-between gap-2 pt-2 border-t border-[var(--border-subtle)]">
                      <span className="tabular text-sm font-semibold text-fg">
                        {money(item.price)}
                      </span>
                      {owned ? (
                        <Badge tone="gain">In Sammlung</Badge>
                      ) : (
                        <Button
                          size="sm"
                          variant={canAfford ? "primary" : "secondary"}
                          className="h-8 px-3 text-xs"
                          disabled={!canAfford}
                          onClick={() => {
                            const err = s.buyCollectionItem(item.id);
                            if (err) toast.error(err);
                            else
                              toast.success(
                                `${item.name} zur Sammlung hinzugefügt (+${item.reputation} Ruf)!`,
                              );
                          }}
                        >
                          Erwerben
                        </Button>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          </section>
        </div>
      ) : null}

      {/* Detail-Ansicht / Showroom-Modal beim Klick auf ein Objekt */}
      {selectedItem ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs"
          onClick={() => setSelectedItem(null)}
        >
          <div
            className="w-full max-w-md overflow-hidden rounded-2xl bg-surface shadow-2xl border border-[var(--border-subtle)]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="relative aspect-square w-full bg-[#FFFFFF] p-6 flex items-center justify-center border-b border-[var(--border-subtle)]">
              <HangarArtwork item={selectedItem} />
              <span className="absolute left-3.5 top-3.5 rounded-md bg-neutral-900/80 px-2.5 py-1 text-[11px] font-medium uppercase tracking-wider text-white">
                {selectedItem.category}
              </span>
              <button
                type="button"
                onClick={() => setSelectedItem(null)}
                className="absolute right-3.5 top-3.5 flex size-8 items-center justify-center rounded-full bg-neutral-900/75 text-white hover:bg-neutral-900 cursor-pointer"
                aria-label="Schließen"
              >
                <X className="size-4" />
              </button>
            </div>

            <div className="p-4 sm:p-5 space-y-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="font-display text-xl font-semibold tracking-tight text-fg">
                    {selectedItem.name}
                  </h2>
                  <p className="mt-1 text-xs sm:text-sm text-muted leading-relaxed">
                    {selectedItem.blurb}
                  </p>
                </div>
                <span className="inline-flex items-center gap-1 rounded-lg bg-accent/15 px-2.5 py-1 text-xs font-semibold text-accent shrink-0">
                  <Sparkles className="size-3.5" />
                  +{selectedItem.reputation} Ruf
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 rounded-xl bg-raised p-3 text-xs">
                <div>
                  <span className="text-[10px] uppercase tracking-wider text-muted block">
                    Kaufpreis
                  </span>
                  <span className="mt-0.5 font-semibold tabular text-sm text-fg block">
                    {money(selectedItem.price)}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] uppercase tracking-wider text-muted block">
                    Voraussetzung
                  </span>
                  <span className="mt-0.5 font-medium tabular text-sm text-fg block">
                    {selectedItem.minNetWorth > 0
                      ? `ab ${money(selectedItem.minNetWorth)} Vermögen`
                      : "Sofort verfügbar"}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2">
                <Button variant="secondary" size="sm" onClick={() => setSelectedItem(null)}>
                  Schließen
                </Button>
                {s.possessions.includes(selectedItem.id) ? (
                  <Badge tone="gain">Bereits im Besitz</Badge>
                ) : (
                  <Button
                    size="sm"
                    disabled={
                      Boolean(selectedItem.comingSoon) ||
                      nw < selectedItem.minNetWorth ||
                      s.cash < selectedItem.price
                    }
                    onClick={() => {
                      const err = s.buyPossession(selectedItem.id);
                      if (err) {
                        toast.error(err);
                      } else {
                        toast.success(
                          `${selectedItem.name} erworben (+${selectedItem.reputation} Ruf).`,
                        );
                        setSelectedItem(null);
                      }
                    }}
                  >
                    Jetzt kaufen · {money(selectedItem.price)}
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
