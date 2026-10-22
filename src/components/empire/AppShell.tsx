import {
  ArrowLeftRight,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Gem,
  Landmark,
  LayoutDashboard,
  LineChart,
  Play,
  Settings,
  Square,
  Store,
  Wallet,
  X,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Toaster, toast } from "sonner";
import { GAME_MINUTES_PER_REAL_SECOND } from "@/game/catalog";
import { formatGameTimestamp } from "@/game/clock";
import { debtRemaining, netWorth, possessionValue, stockValue } from "@/game/sim";
import { availableCredit, useGame } from "@/game/store";
import type { Speed, TabId } from "@/game/types";
import { money } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { AssetsScreen } from "./AssetsScreen";
import { BusinessScreen } from "./BusinessScreen";
import { HeaderClock } from "./chrome";
import { Dashboard } from "./Dashboard";
import { EventModal } from "./EventModal";
import { FinanceScreen } from "./FinanceScreen";
import { InsolvencyScreen } from "./InsolvencyScreen";
import { OfflineReport } from "./OfflineReport";
import { SettingsSheet } from "./SettingsSheet";
import { StockScreen } from "./StockScreen";
import { Welcome } from "./Welcome";
import { YearEndModal } from "./YearEndModal";

const TABS: { id: TabId; label: string; icon: typeof Store }[] = [
  { id: "home", label: "Übersicht", icon: LayoutDashboard },
  { id: "finance", label: "Finanzen", icon: Landmark },
  { id: "stock", label: "Börse", icon: LineChart },
  { id: "biz", label: "Unternehmen", icon: Store },
  { id: "assets", label: "Besitz", icon: Gem },
];

export function AppShell() {
  const s = useGame();
  const theme = s.theme;
  const speed = s.speed;
  const tab = s.ui.tab;
  const companyId = s.ui.companyId;
  const selectedTicker = s.ui.selectedTicker ?? null;
  const hydrated = s.hydrated;
  const insolvent = s.insolvent;
  const pendingYear = s.pendingYearEnd;
  const pending = s.pendingEvent;
  const setSpeed = s.setSpeed;
  const setTab = s.setTab;
  const openSettings = s.openSettings;
  const advance = s.advance;
  const persistNow = s.persistNow;

  const [wealthOpen, setWealthOpen] = useState(false);
  const [speedExpanded, setSpeedExpanded] = useState(false);
  const [isDesktop, setIsDesktop] = useState(
    () => typeof window !== "undefined" && window.matchMedia("(min-width: 1024px)").matches,
  );
  const resumeSpeed = useRef<Exclude<Speed, 0>>(1);
  const mainRef = useRef<HTMLElement | null>(null);
  const lastInboxIdRef = useRef<string | null>(null);

  useEffect(() => {
    const mq = window.matchMedia("(min-width: 1024px)");
    const update = () => setIsDesktop(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  useEffect(() => {
    if (speed === 1 || speed === 2 || speed === 5) resumeSpeed.current = speed;
  }, [speed]);

  useEffect(() => {
    const apply = () => {
      const mode =
        theme === "system"
          ? window.matchMedia("(prefers-color-scheme: light)").matches
            ? "light"
            : "dark"
          : theme;
      document.documentElement.dataset.theme = mode;
    };
    apply();
    const mq = window.matchMedia("(prefers-color-scheme: light)");
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, [theme]);

  useEffect(() => {
    let raf = 0;
    let last = performance.now();
    let acc = 0;
    const loop = (now: number) => {
      const dt = Math.min((now - last) / 1000, 0.1);
      last = now;
      const st = useGame.getState();
      if (!st.hydrated) {
        raf = requestAnimationFrame(loop);
        return;
      }
      const spd =
        st.pendingEvent || st.insolvent || st.pendingYearEnd || !st.seenWelcome ? 0 : st.speed;
      if (spd > 0) {
        acc += dt * GAME_MINUTES_PER_REAL_SECOND * spd;
        const minutes = Math.floor(acc);
        if (minutes >= 1) {
          acc -= minutes;
          advance(minutes);
        }
      } else if (acc >= 1 && !st.pendingYearEnd) {
        const minutes = Math.floor(acc);
        acc -= minutes;
        advance(minutes);
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [advance, hydrated]);

  useEffect(() => {
    const onHide = () => {
      if (document.visibilityState === "hidden") persistNow();
    };
    document.addEventListener("visibilitychange", onHide);
    window.addEventListener("pagehide", persistNow);
    return () => {
      document.removeEventListener("visibilitychange", onHide);
      window.removeEventListener("pagehide", persistNow);
    };
  }, [persistNow]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.code !== "Space" && e.key !== " ") return;
      const target = e.target as HTMLElement | null;
      if (target) {
        const tag = target.tagName;
        if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || target.isContentEditable) {
          return;
        }
      }
      e.preventDefault();
      const st = useGame.getState();
      if (st.insolvent || st.pendingYearEnd || !st.seenWelcome) return;
      st.setSpeed(st.speed === 0 ? resumeSpeed.current : 0);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // Scroll main viewport to top when changing tabs or company detail
  useEffect(() => {
    mainRef.current?.scrollTo({ top: 0, behavior: "instant" as ScrollBehavior });
  }, [tab, companyId, s.ui.showFounding, s.ui.showMarketAnalysis, selectedTicker]);

  // Surface new inbox events as top-of-screen toast notifications with timestamp & direct action
  const latestInbox = s.inbox[0];
  useEffect(() => {
    if (!hydrated || !latestInbox) return;
    if (lastInboxIdRef.current === null) {
      lastInboxIdRef.current = latestInbox.id;
      return;
    }
    if (lastInboxIdRef.current !== latestInbox.id) {
      lastInboxIdRef.current = latestInbox.id;
      const timeStr = formatGameTimestamp(latestInbox.createdAt);
      const actionConfig = latestInbox.companyId
        ? {
            label: "Zum Betrieb",
            onClick: () => {
              const st = useGame.getState();
              st.openCompany(latestInbox.companyId!);
              if (
                latestInbox.title.includes("Liefer") ||
                Boolean(latestInbox.productId)
              ) {
                st.setCompanyTab("products");
              }
            },
          }
        : undefined;

      if (latestInbox.kind === "warning" || latestInbox.kind === "critical") {
        toast.warning(`${latestInbox.title} (${timeStr}): ${latestInbox.body}`, {
          action: actionConfig,
        });
      } else {
        toast.info(`${latestInbox.title} (${timeStr}): ${latestInbox.body}`, {
          action: actionConfig,
        });
      }
    }
  }, [hydrated, latestInbox]);

  if (!hydrated) {
    return (
      <div className="flex h-dvh items-center justify-center bg-bg text-fg">
        <p className="font-display text-3xl tracking-tight">Empire</p>
      </div>
    );
  }

  if (insolvent) return <InsolvencyScreen />;

  const nw = netWorth(s);
  const companyCashTotal = s.companies.reduce((a, c) => a + c.cash, 0);
  const depotVal = stockValue(s);
  const possVal = possessionValue(s);
  const debt = debtRemaining(s);
  const availCred = availableCredit(s);
  const inSubView = Boolean(
    s.ui.showFounding || s.ui.showMarketAnalysis || companyId || selectedTicker,
  );
  const canGoBack = inSubView || tab !== "home";
  const displaySpeed = speed === 0 ? resumeSpeed.current : speed;

  return (
    <div className="h-dvh overflow-hidden bg-bg text-fg">
      <div className="mx-auto flex h-dvh max-w-6xl overflow-hidden">
        {/* Desktop Sidebar (nur auf Desktop >= 1024px im DOM) */}
        {isDesktop ? (
          <aside className="hidden h-dvh w-60 shrink-0 flex-col border-r border-border bg-bg p-4 lg:flex overflow-y-auto">
          <div>
            <p className="font-display text-2xl tracking-tight">Empire</p>
            <p className="mt-0.5 text-xs text-muted">Wirtschaftssimulation</p>
          </div>

          <nav className="mt-6 flex flex-col gap-1">
            {TABS.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setTab(t.id)}
                className={cn(
                  "flex h-10 items-center gap-3 rounded-md px-3 text-sm transition-colors duration-150",
                  tab === t.id
                    ? "bg-raised text-fg font-medium"
                    : "text-muted hover:bg-raised hover:text-fg",
                )}
              >
                <t.icon className="size-4 shrink-0" />
                <span className="truncate">{t.label}</span>
              </button>
            ))}
          </nav>

          {/* Permanentes Privatvermögen-Fenster in der Sidebar (Web & Tablet) */}
          <div className="mt-6 rounded-xl bg-surface p-3.5 shadow-[var(--shadow-border)] space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] uppercase tracking-wider text-muted flex items-center gap-1.5">
                <Wallet className="size-3.5 text-accent" />
                <span>Privatvermögen</span>
              </span>
              <button
                type="button"
                onClick={() => setWealthOpen(true)}
                className="text-[11px] text-muted hover:text-fg underline underline-offset-2"
              >
                Transfer
              </button>
            </div>

            <div>
              <span className="text-[11px] text-muted block">Privatkonto (verfügbar)</span>
              <p className="tabular font-display text-xl tracking-tight text-fg">
                {money(s.cash, true)}
              </p>
            </div>

            <div className="space-y-1 border-t border-border pt-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-muted">Gesamtvermögen</span>
                <span className="tabular font-medium text-fg">{money(nw)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted">Firmenkassen</span>
                <span className="tabular text-fg">{money(companyCashTotal)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted">Aktiendepot</span>
                <span className="tabular text-fg">{money(depotVal)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted">Freier Kredit</span>
                <span className="tabular text-fg">{money(availCred)}</span>
              </div>
              {debt > 0.5 ? (
                <div className="flex items-center justify-between text-warn">
                  <span>Schulden</span>
                  <span className="tabular">−{money(debt)}</span>
                </div>
              ) : null}
            </div>

            {s.companies.some((c) => c.status === "active") ? (
              <Button
                size="sm"
                variant="secondary"
                className="w-full h-8 text-xs gap-1.5"
                onClick={() => setWealthOpen(true)}
              >
                <ArrowLeftRight className="size-3.5" />
                <span>Schnell-Transfer</span>
              </Button>
            ) : null}
          </div>

          <div className="mt-auto pt-4 text-xs text-faint">Fiktive Märkte. Kein Echtgeld.</div>
          </aside>
        ) : null}

        {/* Main Viewport Column */}
        <div className="flex h-dvh min-w-0 flex-1 flex-col overflow-hidden">
          <header className="shrink-0 z-20 border-b border-border bg-bg/95 backdrop-blur-sm">
            {/* Row 1: Fester Zurück-Button oben links + Clock + Wealth Trigger + Stop/Play/Pfeil-Speed */}
            <div className="flex items-center justify-between gap-1.5 px-2.5 py-2 sm:px-4 sm:py-2.5">
              <div className="flex items-center gap-1.5 min-w-0 flex-1">
                {canGoBack && !inSubView ? (
                  <button
                    type="button"
                    onClick={() => s.navigateBack()}
                    className="flex h-8 items-center justify-center gap-0.5 rounded-lg bg-raised px-2 text-xs font-medium text-fg shadow-[var(--shadow-border)] hover:bg-surface active:scale-95 transition-all shrink-0 cursor-pointer lg:hidden"
                    aria-label="Zurück"
                    title="Zurück"
                  >
                    <ChevronLeft className="size-4" />
                    <span className="hidden xs:inline sm:inline text-[11px]">Zurück</span>
                  </button>
                ) : null}
                <div className="min-w-0 flex-1">
                  <HeaderClock />
                </div>
              </div>

              {/* Stop / Play / Ausfahrbarer Pfeil-Button für Geschwindigkeit + Einstellungen */}
              <div className="flex items-center gap-1 shrink-0">
                <div className="flex items-center rounded-lg bg-surface p-0.5 shadow-[var(--shadow-border)]">
                  {/* Stopp-Button */}
                  <button
                    type="button"
                    onClick={() => setSpeed(0)}
                    disabled={insolvent || pendingYear}
                    className={cn(
                      "flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-md text-xs font-medium transition-colors cursor-pointer",
                      speed === 0
                        ? "bg-warn/20 text-warn font-semibold"
                        : "text-muted hover:bg-raised hover:text-fg",
                    )}
                    aria-pressed={speed === 0}
                    aria-label="Stopp (Pause)"
                    title="Stopp / Pause"
                  >
                    <Square className="size-3 fill-current" />
                  </button>

                  {/* Play-Button */}
                  <button
                    type="button"
                    onClick={() => {
                      if (insolvent || pendingYear) return;
                      setSpeed(speed === 0 ? resumeSpeed.current : speed);
                    }}
                    disabled={insolvent || pendingYear}
                    className={cn(
                      "flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-md text-xs font-medium transition-colors cursor-pointer",
                      speed > 0
                        ? "bg-accent text-accent-fg font-semibold"
                        : "text-muted hover:bg-raised hover:text-fg",
                    )}
                    aria-pressed={speed > 0}
                    aria-label="Play (Weiter)"
                    title={`Weiter (${displaySpeed}×)`}
                  >
                    <Play className="size-3.5 fill-current" />
                  </button>

                  {/* Ausfahrbarer Pfeil-Button für Geschwindigkeitswahl */}
                  <button
                    type="button"
                    onClick={() => setSpeedExpanded((v) => !v)}
                    className={cn(
                      "flex h-7 sm:h-8 items-center gap-0.5 rounded-md px-1.5 text-[11px] font-semibold tabular transition-colors cursor-pointer",
                      speedExpanded
                        ? "bg-raised text-fg"
                        : "text-muted hover:bg-raised hover:text-fg",
                    )}
                    aria-expanded={speedExpanded}
                    aria-label="Geschwindigkeit wählen"
                    title="Geschwindigkeit ausklappen"
                  >
                    <span>{displaySpeed}×</span>
                    {speedExpanded ? (
                      <ChevronLeft className="size-3" />
                    ) : (
                      <ChevronRight className="size-3" />
                    )}
                  </button>

                  {/* Ausgefahrene Geschwindigkeits-Stufen (1x, 2x, 5x) */}
                  {speedExpanded ? (
                    <div className="flex items-center gap-0.5 pl-0.5 border-l border-border ml-0.5">
                      {([1, 2, 5] as const).map((spd) => (
                        <button
                          key={spd}
                          type="button"
                          onClick={() => {
                            resumeSpeed.current = spd;
                            setSpeed(spd);
                            setSpeedExpanded(false);
                          }}
                          className={cn(
                            "flex h-7 min-w-7 sm:h-8 sm:min-w-8 items-center justify-center rounded-md px-1.5 text-[11px] font-semibold tabular transition-colors cursor-pointer",
                            speed === spd
                              ? "bg-accent text-accent-fg"
                              : "text-muted hover:bg-raised hover:text-fg",
                          )}
                        >
                          {spd}×
                        </button>
                      ))}
                    </div>
                  ) : null}
                </div>

                <button
                  type="button"
                  onClick={() => openSettings(true)}
                  className="flex size-8 sm:size-9 items-center justify-center rounded-md text-muted hover:bg-raised hover:text-fg cursor-pointer"
                  aria-label="Einstellungen"
                >
                  <Settings className="size-4" />
                </button>
              </div>
            </div>

            {/* Row 2 (Mobile & Tablet < lg): Einheitliche Vermögens- & Kontoleiste */}
            {!isDesktop ? (
              <div className="flex lg:hidden items-center justify-between gap-2 border-t border-border/60 bg-surface/95 px-3 py-1.5 text-xs">
                <button
                  type="button"
                  onClick={() => setWealthOpen((v) => !v)}
                  className="flex flex-1 items-center gap-3 min-w-0 text-left cursor-pointer group"
                >
                  <div className="flex items-center gap-1.5 min-w-0">
                    <div className="flex size-5 items-center justify-center rounded bg-accent/15 text-accent shrink-0">
                      <Wallet className="size-3" />
                    </div>
                    <div className="flex items-baseline gap-1.5 min-w-0">
                      <span className="text-[10px] uppercase tracking-wider text-muted shrink-0">
                        Privat
                      </span>
                      <b className="tabular text-xs font-semibold text-fg truncate">
                        {money(s.cash)}
                      </b>
                    </div>
                  </div>

                  <div className="h-3.5 w-px bg-border shrink-0" />

                  <div className="flex items-baseline gap-1.5 min-w-0">
                    <span className="text-[10px] uppercase tracking-wider text-muted shrink-0">
                      Gesamt
                    </span>
                    <b className="tabular text-xs font-medium text-fg truncate">
                      {money(nw)}
                    </b>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setWealthOpen(true)}
                  className="inline-flex items-center gap-1 rounded-md bg-raised px-2 py-1 text-[11px] font-medium text-fg shadow-[var(--shadow-border)] hover:bg-bg transition-colors shrink-0 cursor-pointer"
                >
                  <ArrowLeftRight className="size-3 text-accent" />
                  <span>Konto</span>
                  <ChevronDown className="size-3 text-muted" />
                </button>
              </div>
            ) : null}
          </header>

          {/* Scrollable Main Content Area */}
          <main
            ref={mainRef}
            className="flex-1 overflow-y-auto overscroll-contain px-2.5 pb-20 pt-2.5 sm:px-6 lg:px-8 lg:pb-10 lg:pt-6"
          >
            {tab === "home" ? <Dashboard /> : null}
            {tab === "finance" ? <FinanceScreen /> : null}
            {tab === "stock" ? <StockScreen /> : null}
            {tab === "biz" ? <BusinessScreen /> : null}
            {tab === "assets" ? <AssetsScreen /> : null}
          </main>
        </div>
      </div>

      {/* Mobile & Tablet Bottom Navigation */}
      {!isDesktop ? (
        <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-bg/95 backdrop-blur-sm pb-[env(safe-area-inset-bottom)] lg:hidden">
          <ul className="mx-auto grid max-w-lg grid-cols-5">
            {TABS.map((t) => (
              <li key={t.id}>
                <button
                  type="button"
                  onClick={() => setTab(t.id)}
                  className={cn(
                    "flex h-14 w-full flex-col items-center justify-center gap-0.5 text-[11px] transition-colors",
                    tab === t.id ? "text-fg font-medium" : "text-muted",
                  )}
                >
                  <t.icon className="size-5" />
                  <span className="truncate max-w-full px-1">{t.label}</span>
                </button>
              </li>
            ))}
          </ul>
        </nav>
      ) : null}

      {/* Überall verfügbares Privatvermögen- & Schnelltransfer-Fenster */}
      {wealthOpen && typeof document !== "undefined"
        ? createPortal(
            <div
              className="fixed inset-0 z-50 flex items-start justify-center empire-scrim p-3 pt-14 sm:pt-16"
              onClick={() => setWealthOpen(false)}
            >
              <div
                className="w-full max-w-md rounded-xl bg-surface p-4 sm:p-5 shadow-[var(--shadow-border)] space-y-4 max-h-[82dvh] overflow-y-auto"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Wallet className="size-4 text-accent" />
                    <h2 className="font-display text-xl tracking-tight">
                      Privatvermögen & Konten
                    </h2>
                  </div>
                  <button
                    type="button"
                    onClick={() => setWealthOpen(false)}
                    className="flex size-9 items-center justify-center rounded-md text-muted hover:bg-raised hover:text-fg"
                    aria-label="Schließen"
                  >
                    <X className="size-4" />
                  </button>
                </div>

                {/* Hauptanzeige Privatkonto & Gesamtvermögen */}
                <div className="grid grid-cols-2 gap-2.5">
                  <div className="rounded-lg bg-raised p-3">
                    <span className="text-[11px] text-muted block">Privatkonto (verfügbar)</span>
                    <p className="mt-0.5 font-display text-2xl tabular tracking-tight text-fg">
                      {money(s.cash, true)}
                    </p>
                    <span className="text-[10px] text-faint block mt-0.5">
                      Für Aktien, Lizenzen, Besitz & Einlagen
                    </span>
                  </div>
                  <div className="rounded-lg bg-raised p-3">
                    <span className="text-[11px] text-muted block">Gesamtvermögen</span>
                    <p className="mt-0.5 font-display text-2xl tabular tracking-tight text-fg">
                      {money(nw)}
                    </p>
                    <span className="text-[10px] text-faint block mt-0.5">
                      Privat + Firmen + Depot − Schulden
                    </span>
                  </div>
                </div>

                {/* Vermögens-Aufschlüsselung */}
                <div className="rounded-lg bg-raised/60 p-3 text-xs space-y-1.5 border border-[var(--border-subtle)]">
                  <div className="flex items-center justify-between">
                    <span className="text-muted">Firmenkassen gesamt ({s.companies.length})</span>
                    <span className="tabular font-medium text-fg">{money(companyCashTotal)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted">Aktiendepot Kurswert</span>
                    <span className="tabular font-medium text-fg">{money(depotVal)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted">Status-Besitz (50 % Beleihungswert)</span>
                    <span className="tabular font-medium text-fg">{money(possVal)}</span>
                  </div>
                  <div className="flex items-center justify-between border-t border-border pt-1.5">
                    <span className="text-muted">Freier Kreditrahmen</span>
                    <span className="tabular font-medium text-fg">
                      {money(availCred)} / {money(s.creditLimit)}
                    </span>
                  </div>
                  {debt > 0.5 ? (
                    <div className="flex items-center justify-between text-warn">
                      <span>Offene Gesamtschulden</span>
                      <span className="tabular font-medium">−{money(debt)}</span>
                    </div>
                  ) : null}
                </div>

                {/* Schnell-Transfer zwischen Privatkonto und Betrieben */}
                {s.companies.filter((c) => c.status === "active").length > 0 ? (
                  <div className="space-y-2">
                    <p className="text-xs font-medium text-muted uppercase tracking-wider">
                      Schnell-Transfer (Privatkonto ↔ Betrieb)
                    </p>
                    <div className="space-y-2">
                      {s.companies
                        .filter((c) => c.status === "active")
                        .map((c) => (
                          <div
                            key={c.id}
                            className="rounded-lg bg-raised p-3 text-xs space-y-2 border border-[var(--border-subtle)]"
                          >
                            <div className="flex items-center justify-between">
                              <span className="font-medium text-fg">{c.name}</span>
                              <span className="tabular text-muted">
                                Firmenkasse: <b className="text-fg">{money(c.cash, true)}</b>
                              </span>
                            </div>
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                              {[250, 500, 1000].map((amt) => (
                                <Button
                                  key={`in-${amt}`}
                                  size="sm"
                                  variant="secondary"
                                  className="h-8 text-xs px-2"
                                  disabled={s.cash < amt}
                                  onClick={() => {
                                    const err = s.transfer(c.id, amt);
                                    if (err) toast.error(err);
                                    else toast.success(`${money(amt)} in ${c.name} eingelegt.`);
                                  }}
                                >
                                  +{amt} € in Firma
                                </Button>
                              ))}
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-8 text-xs px-2 border border-border"
                                disabled={c.cash < 500}
                                onClick={() => {
                                  const err = s.transfer(c.id, -500);
                                  if (err) toast.error(err);
                                  else
                                    toast.success(
                                      `500 € aus ${c.name} auf Privatkonto entnommen.`,
                                    );
                                }}
                              >
                                −500 € auf Privat
                              </Button>
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>
                ) : null}

                <div className="flex items-center justify-between gap-2 pt-1">
                  <Button
                    variant="secondary"
                    size="sm"
                    className="flex-1"
                    onClick={() => {
                      setWealthOpen(false);
                      setTab("finance");
                    }}
                  >
                    Zu den Finanzen
                  </Button>
                  <Button size="sm" className="flex-1" onClick={() => setWealthOpen(false)}>
                    Fertig
                  </Button>
                </div>
              </div>
            </div>,
            document.body,
          )
        : null}

      <Welcome />
      <OfflineReport />
      <YearEndModal />
      {pending ? <EventModal /> : null}
      <SettingsSheet />
      {typeof document !== "undefined"
        ? createPortal(
            <Toaster
              position={isDesktop ? "bottom-right" : "bottom-center"}
              offset={isDesktop ? 20 : 72}
              mobileOffset={72}
              visibleToasts={3}
              richColors
              toastOptions={{
                style: {
                  background: "var(--empire-surface)",
                  color: "var(--empire-fg)",
                  border: "1px solid var(--empire-border)",
                  boxShadow: "0 10px 28px -6px rgba(0, 0, 0, 0.45)",
                },
              }}
            />,
            document.body,
          )
        : null}
    </div>
  );
}
