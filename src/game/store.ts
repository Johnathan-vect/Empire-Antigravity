import { create } from "zustand";
import {
  CLEANING_COST,
  CREDIT_LIMIT_START,
  CRYPTO_SPREAD,
  GAME_MINUTES_PER_REAL_SECOND,
  POSSESSIONS,
  buybackPriceOf,
  companyUpgradeCost,
  creditLimit,
  cryptoBySymbol,
  managerCostPerDayForIndustry,
  productById,
  productSlotsForLevel,
  stockByTicker,
  upgradeCostForLevel,
  yearThreshold,
} from "./catalog";
import { absoluteGameDay, nid, readClock, yearCapMinutes } from "./clock";
import { resolveEvent } from "./events";
import { careerLevel, loadSave, newGame, writeSave } from "./save";
import {
  type OrderOutcome,
  canEndYearEarly,
  cryptoValue,
  liquidWealth,
  netWorth,
  personalDebtTotal,
  placeProductOrder,
  pushLedger,
  refreshApplicantPool,
  replenishApplicants,
  resolveYearEdge,
  stockValue,
  tickMinutes,
  tryBorrowLoan,
  tryBuyCollectionItem,
  tryBuyIndustryLicense,
  tryBuyRealEstate,
  tryBuybackSupplier,
  tryExecuteMerger,
  tryExtraPayment,
  tryFoundCompany,
  tryHireSupplier,
  trySearchSuppliers,
  trySellRealEstate,
  tryTransfer,
  tryUpgradeCompanyScale,
  tryUpgradeRealEstate,
  tryWithdrawCompanyDividend,
  usedCompanyCredit,
} from "./sim";
import type {
  CompanyScaleId,
  CompanyTabId,
  Employee,
  GameState,
  Industry,
  LoanOwner,
  LocationId,
  OfflineReport,
  SimBurst,
  Speed,
  TabId,
  ThemeMode,
} from "./types";

type Store = GameState & {
  hydrated: boolean;
  hydrate: () => void;
  persistNow: () => void;
  setSpeed: (speed: Speed) => void;
  setTheme: (theme: ThemeMode) => void;
  setTab: (tab: TabId) => void;
  setName: (name: string) => void;
  dismissWelcome: () => void;
  openFounding: (open: boolean) => void;
  openMarketAnalysis: (open: boolean) => void;
  openMacroDrawer: (open: boolean) => void;
  openSettings: (open: boolean) => void;
  openCompany: (id: string | null) => void;
  setCompanyTab: (companyTab: CompanyTabId) => void;
  openStock: (ticker: string | null) => void;
  openCrypto: (symbol: string | null) => void;
  navigateBack: () => void;
  advance: (minutes: number) => void;
  applyOffline: () => void;
  dismissOffline: () => void;
  buyIndustryLicense: (industry: Industry) => string | null;
  buyLicense: () => string | null;
  foundCompany: (
    name: string,
    industry: Industry,
    locationId: LocationId,
    equity: number,
    extra: number,
    scale?: CompanyScaleId,
  ) => string | null;
  foundImbiss: (name: string, equity: number, extra: number) => string | null;
  executeMerger: (mergerId: string, customName?: string) => string | null;
  orderStock: (companyId: string, productId: string, qty: number) => OrderOutcome;
  setPrice: (companyId: string, productId: string, price: number) => void;
  setSupplier: (companyId: string, productId: string, supplierId: string) => void;
  searchSuppliers: (companyId: string, productId: string) => string | null;
  hireSupplier: (companyId: string, productId: string, offerId: string) => string | null;
  buybackSupplier: (companyId: string, productId: string) => string | null;
  toggleProduct: (companyId: string, productId: string) => string | null;
  swapProduct: (companyId: string, oldProductId: string, newProductId: string) => string | null;
  cleanHygiene: (companyId: string) => string | null;
  upgradeCompany: (companyId: string) => string | null;
  upgradeCompanyScale: (
    companyId: string,
    nextScale: "smallChain" | "largeChain",
  ) => string | null;
  buyCompanyUpgrade: (
    companyId: string,
    upgrade: "equipment" | "storage" | "marketing" | "autoOrder",
  ) => string | null;
  hireEmployee: (companyId: string, applicantId: string) => string | null;
  fireEmployee: (companyId: string, employeeId: string) => string | null;
  toggleManager: (companyId: string) => string | null;
  toggleProductAutoOrder: (companyId: string, productId: string) => string | null;
  toggleAutoDividend: (companyId: string) => void;
  setDividendPct: (companyId: string, pct: number) => void;
  withdrawCompanyDividend: (companyId: string, amount?: number) => string | null;
  replenishApplications: (companyId?: string) => string | null;
  buybackCompany: (companyId: string) => string | null;
  transfer: (companyId: string, amount: number) => string | null;
  borrowLoan: (
    category: "micro" | "classic" | "invest",
    amount: number,
    owner: LoanOwner,
    companyId?: string,
  ) => string | null;
  extraPayment: (loanId: string, amount: number) => string | null;
  buyShares: (ticker: string, shares: number) => string | null;
  sellShares: (ticker: string, shares: number) => string | null;
  buyCrypto: (symbol: string, coins: number) => string | null;
  sellCrypto: (symbol: string, coins: number) => string | null;
  buyPossession: (id: string) => string | null;
  buyRealEstate: (propertyId: string) => string | null;
  upgradeRealEstate: (propertyId: string, upgradeId: string) => string | null;
  sellRealEstate: (propertyId: string) => string | null;
  buyCollectionItem: (itemId: string) => string | null;
  requestYearEnd: () => string | null;
  confirmYear: () => void;
  resolvePendingEvent: (optionId: string) => string | null;
  dismissInbox: (id: string) => void;
  restart: () => void;
};

let persistTimer: ReturnType<typeof setTimeout> | null = null;

function pickState(s: Store): GameState {
  return {
    version: s.version,
    createdAt: s.createdAt,
    lastRealTs: s.lastRealTs,
    gameMinutes: s.gameMinutes,
    year: s.year,
    yearStartMinutes: s.yearStartMinutes,
    rngSeed: s.rngSeed,
    speed: s.speed,
    theme: s.theme,
    playerName: s.playerName,
    cash: s.cash,
    creditLimit: s.creditLimit,
    reputation: s.reputation,
    licenses: s.licenses,
    possessions: s.possessions,
    realEstate: s.realEstate,
    collections: s.collections,
    companies: s.companies,
    loans: s.loans,
    holdings: s.holdings,
    quotes: s.quotes,
    quoteHistory: s.quoteHistory,
    cryptoHoldings: s.cryptoHoldings,
    cryptoQuotes: s.cryptoQuotes,
    cryptoHistory: s.cryptoHistory,
    stats: s.stats,
    market: s.market,
    applications: s.applications,
    inbox: s.inbox,
    pendingEvent: s.pendingEvent,
    pendingYearEnd: s.pendingYearEnd,
    yearNetWorthBase: s.yearNetWorthBase,
    ledger: s.ledger,
    netHistory: s.netHistory,
    career: s.career,
    seenWelcome: s.seenWelcome,
    insolvent: s.insolvent,
    insolvency: s.insolvency,
    offlineReport: s.offlineReport,
    ui: s.ui,
  };
}

function schedulePersist(get: () => Store) {
  if (persistTimer) return;
  persistTimer = setTimeout(() => {
    persistTimer = null;
    writeSave(pickState(get()));
  }, 1200);
}

function patch(
  set: (fn: (s: Store) => Store) => void,
  get: () => Store,
  mut: (s: GameState) => void,
) {
  set((s) => {
    const next = structuredClone(pickState(s));
    mut(next);
    next.creditLimit = creditLimit(next.reputation, next.collections);
    next.career.level = careerLevel(next.career.totalEarned);
    next.career.bestNetWorth = Math.max(next.career.bestNetWorth, netWorth(next));
    schedulePersist(get);
    return { ...s, ...next };
  });
}

export const useGame = create<Store>((set, get) => ({
  ...newGame(),
  hydrated: false,

  hydrate: () => {
    if (get().hydrated) return;
    const loaded = loadSave();
    if (!loaded.applications || loaded.applications.length === 0) {
      replenishApplicants(loaded);
    }
    set({ ...loaded, hydrated: true });
    get().applyOffline();
  },

  persistNow: () => writeSave(pickState(get())),

  setSpeed: (speed) => {
    set((s) => {
      const next = s.insolvent || s.pendingYearEnd ? 0 : speed;
      return { ...s, speed: next };
    });
    writeSave(pickState(get()));
  },

  setTheme: (theme) =>
    set((s) => {
      schedulePersist(get);
      return { ...s, theme };
    }),

  setTab: (tab) =>
    set((s) => ({
      ...s,
      ui: {
        ...s.ui,
        tab,
        companyId: tab === "biz" ? s.ui.companyId : null,
        selectedTicker: tab === "stock" ? s.ui.selectedTicker : null,
        selectedCrypto: tab === "stock" ? s.ui.selectedCrypto : null,
        showFounding: false,
        showMarketAnalysis: false,
      },
    })),

  setName: (playerName) =>
    set((s) => {
      schedulePersist(get);
      return { ...s, playerName };
    }),

  dismissWelcome: () =>
    set((s) => {
      schedulePersist(get);
      return { ...s, seenWelcome: true };
    }),

  openFounding: (open) =>
    set((s) => ({
      ...s,
      ui: {
        ...s.ui,
        showFounding: open,
        showMarketAnalysis: false,
        selectedTicker: null,
        selectedCrypto: null,
        tab: open ? "biz" : s.ui.tab,
      },
    })),
  openMarketAnalysis: (open) =>
    set((s) => ({
      ...s,
      ui: {
        ...s.ui,
        showMarketAnalysis: open,
        showFounding: false,
        selectedTicker: null,
        selectedCrypto: null,
        companyId: open ? null : s.ui.companyId,
        tab: open ? "biz" : s.ui.tab,
      },
    })),
  openMacroDrawer: (open) =>
    set((s) => ({
      ...s,
      ui: {
        ...s.ui,
        showMacroDrawer: open,
      },
    })),
  openSettings: (open) => set((s) => ({ ...s, ui: { ...s.ui, showSettings: open } })),
  openCompany: (id) =>
    set((s) => ({
      ...s,
      ui: {
        ...s.ui,
        companyId: id,
        companyTab: id && id !== s.ui.companyId ? "overview" : (s.ui.companyTab ?? "overview"),
        showFounding: false,
        showMarketAnalysis: false,
        selectedTicker: null,
        selectedCrypto: null,
        tab: "biz",
      },
    })),
  setCompanyTab: (companyTab) =>
    set((s) => ({
      ...s,
      ui: {
        ...s.ui,
        companyTab,
      },
    })),
  openStock: (ticker) =>
    set((s) => ({
      ...s,
      ui: {
        ...s.ui,
        selectedTicker: ticker,
        selectedCrypto: null,
        tab: ticker ? "stock" : s.ui.tab,
      },
    })),
  openCrypto: (symbol) =>
    set((s) => ({
      ...s,
      ui: {
        ...s.ui,
        selectedCrypto: symbol,
        selectedTicker: null,
        tab: symbol ? "stock" : s.ui.tab,
      },
    })),
  navigateBack: () =>
    set((s) => {
      if (s.ui.showFounding) {
        return { ...s, ui: { ...s.ui, showFounding: false } };
      }
      if (s.ui.showMarketAnalysis) {
        return { ...s, ui: { ...s.ui, showMarketAnalysis: false } };
      }
      if (s.ui.companyId) {
        return { ...s, ui: { ...s.ui, companyId: null } };
      }
      if (s.ui.selectedTicker) {
        return { ...s, ui: { ...s.ui, selectedTicker: null } };
      }
      if (s.ui.selectedCrypto) {
        return { ...s, ui: { ...s.ui, selectedCrypto: null } };
      }
      if (s.ui.tab !== "home") {
        return { ...s, ui: { ...s.ui, tab: "home" } };
      }
      return s;
    }),

  advance: (minutes) => {
    if (minutes <= 0) return;
    const cur = get();
    if (cur.insolvent || cur.pendingYearEnd) return;
    const rem = 60 - (cur.gameMinutes % 60);
    const capLeft = cur.yearStartMinutes + 360 * 24 * 60 - cur.gameMinutes;
    if (minutes < rem && minutes < capLeft) {
      set({ gameMinutes: cur.gameMinutes + minutes });
      schedulePersist(get);
      return;
    }
    patch(set, get, (s) => {
      if (s.insolvent || s.pendingYearEnd) return;
      tickMinutes(s, minutes);
    });
  },

  applyOffline: () => {
    const s = get();
    if (!s.hydrated || s.insolvent || !s.seenWelcome) return;
    if (s.speed === 0 || s.pendingYearEnd) return;
    const elapsedMs = Date.now() - s.lastRealTs;
    if (elapsedMs < 25_000) return;
    const gameMinutes = (elapsedMs / 1000) * GAME_MINUTES_PER_REAL_SECOND * s.speed;
    const capLeft = Math.max(0, yearCapMinutes(s) - s.gameMinutes);
    const minutes = Math.min(capLeft, Math.floor(gameMinutes));
    if (minutes < 1) return;
    patch(set, get, (st) => {
      const burst: SimBurst = { companyProfit: 0, stockDelta: 0, living: 0 };
      const marketBefore = stockValue(st) + cryptoValue(st);
      tickMinutes(st, minutes, burst);
      burst.stockDelta = stockValue(st) + cryptoValue(st) - marketBefore;
      const result = burst.companyProfit + burst.stockDelta - burst.living;
      const report: OfflineReport = {
        realMs: elapsedMs,
        gameHours: minutes / 60,
        companyProfit: burst.companyProfit,
        stockDelta: burst.stockDelta,
        living: burst.living,
        result,
        stoppedAtYearEnd: st.pendingYearEnd,
      };
      st.offlineReport = report;
    });
  },

  dismissOffline: () => set((s) => ({ ...s, offlineReport: null })),

  buyIndustryLicense: (industry) => {
    let err: string | null = null;
    patch(set, get, (st) => {
      err = tryBuyIndustryLicense(st, industry);
    });
    return err;
  },

  buyLicense: () => get().buyIndustryLicense("imbiss"),

  foundCompany: (rawName, industry, locationId, equity, extra, scale = "local") => {
    let err: string | null = null;
    patch(set, get, (st) => {
      err = tryFoundCompany(st, rawName, industry, locationId, equity, extra, scale);
    });
    return err;
  },

  foundImbiss: (rawName, equity, extra) =>
    get().foundCompany(rawName, "imbiss", "kiez", equity, extra, "local"),

  executeMerger: (mergerId, customName) => {
    let err: string | null = null;
    patch(set, get, (st) => {
      err = tryExecuteMerger(st, mergerId, customName);
    });
    return err;
  },

  orderStock: (companyId, productId, qty) => {
    let outcome: OrderOutcome = {
      err: "Unbekannter Fehler.",
      orderedQty: qty,
      actualQty: 0,
      delayed: false,
      etaMinutes: 0,
      totalCost: 0,
    };
    patch(set, get, (st) => {
      const c = st.companies.find((x) => x.id === companyId);
      if (!c || c.status !== "active") {
        outcome.err = "Betrieb nicht aktiv.";
        return;
      }
      const p = c.products.find((x) => x.productId === productId);
      if (!p) {
        outcome.err = "Produkt nicht im Sortiment.";
        return;
      }
      outcome = placeProductOrder(st, c, p, qty);
    });
    return outcome;
  },

  setPrice: (companyId, productId, price) => {
    patch(set, get, (st) => {
      const p = st.companies
        .find((c) => c.id === companyId)
        ?.products.find((x) => x.productId === productId);
      if (!p) return;
      const def = productById(productId);
      p.price =
        Math.round(Math.max(def.baseCost + 0.2, Math.min(def.fairPrice * 2.4, price)) * 10) / 10;
    });
  },

  setSupplier: (companyId, productId, supplierId) => {
    patch(set, get, (st) => {
      const p = st.companies
        .find((c) => c.id === companyId)
        ?.products.find((x) => x.productId === productId);
      if (p) p.supplierId = supplierId;
    });
  },

  searchSuppliers: (companyId, productId) => {
    let err: string | null = null;
    patch(set, get, (st) => {
      err = trySearchSuppliers(st, companyId, productId);
    });
    return err;
  },

  hireSupplier: (companyId, productId, offerId) => {
    let err: string | null = null;
    patch(set, get, (st) => {
      err = tryHireSupplier(st, companyId, productId, offerId);
    });
    return err;
  },

  buybackSupplier: (companyId, productId) => {
    let err: string | null = null;
    patch(set, get, (st) => {
      err = tryBuybackSupplier(st, companyId, productId);
    });
    return err;
  },

  toggleProduct: (companyId, productId) => {
    let err: string | null = null;
    patch(set, get, (st) => {
      const c = st.companies.find((x) => x.id === companyId);
      if (!c || c.status !== "active") return;
      const p = c.products.find((x) => x.productId === productId);
      if (!p) return;
      if (!p.enabled) {
        const used = c.products.filter((x) => x.enabled).length;
        if (used >= c.productSlotMax) {
          err = `Maximal ${c.productSlotMax} Produkte auf Stufe ${c.level}.`;
          return;
        }
        p.enabled = true;
        const idx = c.products.indexOf(p);
        if (idx !== -1) {
          c.products.splice(idx, 1);
          const lastEnabledIdx = c.products.reduce(
            (acc, item, i) => (item.enabled && item !== p ? i : acc),
            -1,
          );
          c.products.splice(lastEnabledIdx + 1, 0, p);
        }
      } else {
        p.enabled = false;
      }
    });
    return err;
  },

  swapProduct: (companyId, oldProductId, newProductId) => {
    let err: string | null = null;
    patch(set, get, (st) => {
      const c = st.companies.find((x) => x.id === companyId);
      if (!c || c.status !== "active") {
        err = "Betrieb nicht aktiv.";
        return;
      }
      const oldIdx = c.products.findIndex((x) => x.productId === oldProductId);
      const newIdx = c.products.findIndex((x) => x.productId === newProductId);
      if (oldIdx === -1 || newIdx === -1) {
        err = "Produkt nicht gefunden.";
        return;
      }
      const oldP = c.products[oldIdx]!;
      const newP = c.products[newIdx]!;
      if (newP.enabled) {
        err = "Produkt ist bereits in einem anderen Slot aktiv.";
        return;
      }
      oldP.enabled = false;
      newP.enabled = true;
      c.products[oldIdx] = newP;
      c.products[newIdx] = oldP;
    });
    return err;
  },

  cleanHygiene: (companyId) => {
    let err: string | null = null;
    patch(set, get, (st) => {
      const c = st.companies.find((x) => x.id === companyId);
      if (!c || c.status !== "active") {
        err = "Betrieb nicht aktiv.";
        return;
      }
      if (c.cash < CLEANING_COST) {
        err = "Unternehmenskasse reicht nicht.";
        return;
      }
      c.cash -= CLEANING_COST;
      c.todayExpenses += CLEANING_COST;
      c.hygiene = Math.min(100, c.hygiene + 18);
    });
    return err;
  },

  upgradeCompany: (companyId) => {
    let err: string | null = null;
    patch(set, get, (st) => {
      const c = st.companies.find((x) => x.id === companyId);
      if (!c || c.status !== "active") {
        err = "Betrieb nicht aktiv.";
        return;
      }
      if (c.level >= 5) {
        err = "Maximale Ausbaustufe 5 bereits erreicht.";
        return;
      }
      const nextLevel = c.level + 1;
      const req = upgradeCostForLevel(c.industry, nextLevel);
      if (c.lifetimeRevenue < req.revenueReq) {
        err = `Noch ${Math.ceil(req.revenueReq - c.lifetimeRevenue).toLocaleString("de-DE")} € Umsatz bis Stufe ${nextLevel}.`;
        return;
      }
      if (c.cash < req.cost) {
        err = `Ausbau erfordert ${req.cost.toLocaleString("de-DE")} € aus der Unternehmenskasse.`;
        return;
      }
      c.cash -= req.cost;
      c.todayExpenses += req.cost;
      c.level = nextLevel;
      c.productSlotMax = productSlotsForLevel(nextLevel, c.mergerId ? 1 : 0);
      c.forecast = `Stufe ${nextLevel} erreicht: ${c.productSlotMax} Produktplätze freigeschaltet.`;
    });
    return err;
  },

  upgradeCompanyScale: (companyId, nextScale) => {
    let err: string | null = null;
    patch(set, get, (st) => {
      err = tryUpgradeCompanyScale(st, companyId, nextScale);
    });
    return err;
  },

  buyCompanyUpgrade: (companyId, upgrade) => {
    let err: string | null = null;
    patch(set, get, (st) => {
      const c = st.companies.find((x) => x.id === companyId);
      if (!c || c.status !== "active") {
        err = "Betrieb nicht aktiv.";
        return;
      }
      if (!c.upgrades) {
        c.upgrades = { equipment: 0, storage: 0, marketing: 0, autoOrder: false };
      }
      if (upgrade === "autoOrder") {
        if (c.level < 3) {
          err = "Auto-Nachbestellung erfordert mindestens Betriebsstufe 3.";
          return;
        }
        if (c.upgrades.autoOrder) {
          err = "Upgrade Einkaufs-Assistent bereits freigeschaltet.";
          return;
        }
        const cost = companyUpgradeCost(c.industry, "autoOrder", 0);
        if (c.cash < cost) {
          err = `Erfordert ${cost.toLocaleString("de-DE")} € aus der Firmenkasse.`;
          return;
        }
        c.cash -= cost;
        c.todayExpenses += cost;
        c.upgrades.autoOrder = true;
        return;
      }

      const curLvl = c.upgrades[upgrade] ?? 0;
      if (curLvl >= 3) {
        err = "Maximale Stufe (3/3) dieses Upgrades bereits erreicht.";
        return;
      }
      const cost = companyUpgradeCost(c.industry, upgrade, curLvl);
      if (c.cash < cost) {
        err = `Erfordert ${cost.toLocaleString("de-DE")} € aus der Firmenkasse.`;
        return;
      }
      c.cash -= cost;
      c.todayExpenses += cost;
      c.upgrades[upgrade] = curLvl + 1;
    });
    return err;
  },

  hireEmployee: (companyId, applicantId) => {
    let err: string | null = null;
    patch(set, get, (st) => {
      const c = st.companies.find((x) => x.id === companyId);
      if (!c || c.status !== "active") {
        err = "Betrieb nicht aktiv.";
        return;
      }
      if (c.level < 2) {
        err = "Personal kann erst ab Betriebsstufe 2 eingestellt werden.";
        return;
      }
      const maxStaff = c.level * 2;
      if (c.employees.length >= maxStaff) {
        err = `Maximal ${maxStaff} Mitarbeiter auf Stufe ${c.level}.`;
        return;
      }
      const appIdx = st.applications.findIndex((a) => a.id === applicantId);
      if (appIdx === -1) {
        err = "Bewerber nicht mehr verfügbar.";
        return;
      }
      const app = st.applications[appIdx]!;
      st.applications.splice(appIdx, 1);
      const emp: Employee = {
        id: nid("emp"),
        name: app.name,
        age: app.age,
        gender: app.gender,
        role: app.role,
        productivity: app.productivity,
        reliability: app.reliability,
        experience: app.experience,
        wage: app.desiredWage,
        desiredWage: app.desiredWage,
        satisfaction: 85,
        sickUntil: null,
        hiredAt: st.gameMinutes,
      };
      c.employees.push(emp);
      c.employeeCount = c.employees.length;
    });
    return err;
  },

  fireEmployee: (companyId, employeeId) => {
    let err: string | null = null;
    patch(set, get, (st) => {
      const c = st.companies.find((x) => x.id === companyId);
      if (!c) {
        err = "Betrieb nicht gefunden.";
        return;
      }
      c.employees = c.employees.filter((e) => e.id !== employeeId);
      c.employeeCount = c.employees.length;
    });
    return err;
  },

  toggleManager: (companyId) => {
    let err: string | null = null;
    patch(set, get, (st) => {
      const c = st.companies.find((x) => x.id === companyId);
      if (!c || c.status !== "active") {
        err = "Betrieb nicht aktiv.";
        return;
      }
      if (c.level < 3) {
        err = "Betriebsleiter (Manager) kann erst ab Stufe 3 engagiert werden.";
        return;
      }
      c.manager = !c.manager;
      c.managerCostPerDay = c.manager ? managerCostPerDayForIndustry(c.industry) : 0;
    });
    return err;
  },

  toggleProductAutoOrder: (companyId, productId) => {
    let err: string | null = null;
    patch(set, get, (st) => {
      const c = st.companies.find((x) => x.id === companyId);
      if (!c) return;
      const p = c.products.find((x) => x.productId === productId);
      if (!p) return;
      if (!c.manager || !c.upgrades?.autoOrder) {
        err = "Erfordert aktiven Betriebsleiter und das Upgrade Einkaufs-Assistent.";
        return;
      }
      if (!p.contractedSupplier && !p.autoOrder) {
        err = "Bitte zuerst einen Zulieferer für dieses Produkt unter Vertrag nehmen.";
        return;
      }
      p.autoOrder = !p.autoOrder;
    });
    return err;
  },

  toggleAutoDividend: (companyId) => {
    patch(set, get, (st) => {
      const c = st.companies.find((x) => x.id === companyId);
      if (!c) return;
      c.autoDividend = !c.autoDividend;
    });
  },

  setDividendPct: (companyId, pct) => {
    const valid = Math.max(10, Math.min(100, Math.round(pct)));
    patch(set, get, (st) => {
      const c = st.companies.find((x) => x.id === companyId);
      if (!c) return;
      c.dividendPct = valid;
    });
  },

  withdrawCompanyDividend: (companyId, amount) => {
    let err: string | null = null;
    patch(set, get, (st) => {
      err = tryWithdrawCompanyDividend(st, companyId, amount);
    });
    return err;
  },

  replenishApplications: (companyId) => {
    let err: string | null = null;
    patch(set, get, (st) => {
      err = refreshApplicantPool(st, companyId);
    });
    return err;
  },

  buybackCompany: (companyId) => {
    let err: string | null = null;
    patch(set, get, (st) => {
      const c = st.companies.find((x) => x.id === companyId);
      if (!c || c.status !== "buyback") {
        err = "Kein Rückkauf möglich.";
        return;
      }
      const day = absoluteGameDay(st);
      if (c.buybackUntilGameDay && day > c.buybackUntilGameDay) {
        err = "Rückkauf-Fenster abgelaufen.";
        return;
      }
      const price = c.buybackPrice ?? buybackPriceOf(c.level, c.productSlotMax);
      if (st.cash < price) {
        err = "Privatkonto reicht nicht.";
        return;
      }
      st.cash -= price;
      c.status = "active";
      c.cash = 0;
      c.debt = 0;
      c.employeeCount = 0;
      c.employees = [];
      c.insolventAtGameDay = undefined;
      c.buybackUntilGameDay = undefined;
      c.buybackPrice = undefined;
      c.forecast = "Zurückgekauft. Kasse leer — Einlage nötig.";
      pushLedger(st, `Rückkauf ${c.name}`, -price, "company");
    });
    return err;
  },

  transfer: (companyId, amount) => {
    let err: string | null = null;
    patch(set, get, (st) => {
      err = tryTransfer(st, companyId, amount);
    });
    return err;
  },

  borrowLoan: (category, amount, owner, companyId) => {
    let err: string | null = null;
    patch(set, get, (st) => {
      err = tryBorrowLoan(st, category, amount, owner, companyId);
    });
    return err;
  },

  extraPayment: (loanId, amount) => {
    let err: string | null = null;
    patch(set, get, (st) => {
      err = tryExtraPayment(st, loanId, amount);
    });
    return err;
  },

  buyShares: (ticker, shares) => {
    if (shares <= 0) return "Stückzahl ungültig.";
    let err: string | null = null;
    patch(set, get, (st) => {
      const px = st.quotes[ticker] ?? stockByTicker(ticker).base;
      const cost = shares * px * 1.004;
      if (st.cash < cost) {
        err = "Guthaben reicht nicht.";
        return;
      }
      st.cash -= cost;
      const h = st.holdings.find((x) => x.ticker === ticker);
      if (h) {
        const total = h.avgCost * h.shares + px * shares;
        h.shares += shares;
        h.avgCost = total / h.shares;
      } else {
        st.holdings.push({ ticker, shares, avgCost: px });
      }
      pushLedger(st, `Kauf ${ticker}`, -cost, "stock");
    });
    return err;
  },

  sellShares: (ticker, shares) => {
    let err: string | null = null;
    patch(set, get, (st) => {
      const h = st.holdings.find((x) => x.ticker === ticker);
      if (!h || h.shares < shares) {
        err = "Nicht genug Stücke.";
        return;
      }
      const px = st.quotes[ticker] ?? stockByTicker(ticker).base;
      const proceeds = shares * px * 0.996;
      const costBasis = shares * h.avgCost;
      const realizedProfit = proceeds - costBasis;
      if (realizedProfit > 0) {
        st.stats.fromStockTrading = (st.stats?.fromStockTrading ?? 0) + realizedProfit;
      }
      h.shares -= shares;
      if (h.shares <= 0) st.holdings = st.holdings.filter((x) => x.ticker !== ticker);
      st.cash += proceeds;
      pushLedger(st, `Verkauf ${ticker}`, proceeds, "stock");
    });
    return err;
  },

  buyCrypto: (symbol, coins) => {
    if (coins <= 0) return "Menge ungültig.";
    let err: string | null = null;
    patch(set, get, (st) => {
      const def = cryptoBySymbol(symbol);
      const px = st.cryptoQuotes?.[symbol] ?? def.base;
      const cost = coins * px * (1 + CRYPTO_SPREAD);
      if (st.cash + 0.01 < cost) {
        err = "Guthaben reicht nicht.";
        return;
      }
      st.cash = Math.max(0, st.cash - cost);
      const h = st.cryptoHoldings.find((x) => x.symbol === symbol);
      if (h) {
        const total = h.avgCost * h.coins + px * coins;
        h.coins = Math.round((h.coins + coins) * 10000) / 10000;
        h.avgCost = total / h.coins;
      } else {
        st.cryptoHoldings.push({
          symbol,
          coins: Math.round(coins * 10000) / 10000,
          avgCost: px,
        });
      }
      pushLedger(st, `Krypto-Kauf ${symbol}`, -cost, "crypto");
    });
    return err;
  },

  sellCrypto: (symbol, coins) => {
    if (coins <= 0) return "Menge ungültig.";
    let err: string | null = null;
    patch(set, get, (st) => {
      const h = st.cryptoHoldings.find((x) => x.symbol === symbol);
      if (!h || h.coins + 0.0001 < coins) {
        err = "Nicht genug Coins im Wallet.";
        return;
      }
      const def = cryptoBySymbol(symbol);
      const px = st.cryptoQuotes?.[symbol] ?? def.base;
      const sellQty = Math.min(h.coins, coins);
      const proceeds = sellQty * px * (1 - CRYPTO_SPREAD);
      const costBasis = sellQty * h.avgCost;
      const realizedProfit = proceeds - costBasis;
      if (realizedProfit > 0) {
        st.stats.fromCryptoTrading = (st.stats?.fromCryptoTrading ?? 0) + realizedProfit;
      }
      h.coins = Math.round((h.coins - sellQty) * 10000) / 10000;
      if (h.coins <= 0.0001) {
        st.cryptoHoldings = st.cryptoHoldings.filter((x) => x.symbol !== symbol);
      }
      st.cash += proceeds;
      pushLedger(st, `Krypto-Verkauf ${symbol}`, proceeds, "crypto");
    });
    return err;
  },

  buyPossession: (id) => {
    const def = POSSESSIONS.find((p) => p.id === id);
    if (!def) return "Nicht verfügbar.";
    if (def.comingSoon) return "Noch nicht freigeschaltet.";
    let err: string | null = null;
    patch(set, get, (st) => {
      if (st.possessions.includes(id)) {
        err = "Bereits im Besitz.";
        return;
      }
      const nw = netWorth(st);
      if (nw < def.minNetWorth) {
        err = "Nettovermögen reicht nicht.";
        return;
      }
      if (st.cash < def.price) {
        err = "Guthaben reicht nicht.";
        return;
      }
      st.cash -= def.price;
      st.possessions.push(id);
      st.reputation += def.reputation;
      pushLedger(st, def.name, -def.price, "asset");
    });
    return err;
  },

  buyRealEstate: (propertyId) => {
    let err: string | null = null;
    patch(set, get, (st) => {
      err = tryBuyRealEstate(st, propertyId);
    });
    return err;
  },

  upgradeRealEstate: (propertyId, upgradeId) => {
    let err: string | null = null;
    patch(set, get, (st) => {
      err = tryUpgradeRealEstate(st, propertyId, upgradeId);
    });
    return err;
  },

  sellRealEstate: (propertyId) => {
    let err: string | null = null;
    patch(set, get, (st) => {
      err = trySellRealEstate(st, propertyId);
    });
    return err;
  },

  buyCollectionItem: (itemId) => {
    let err: string | null = null;
    patch(set, get, (st) => {
      err = tryBuyCollectionItem(st, itemId);
    });
    return err;
  },

  requestYearEnd: () => {
    const s = get();
    if (s.pendingYearEnd) return null;
    const clock = readClock(s);
    if (clock.day >= 360) {
      patch(set, get, (st) => {
        st.pendingYearEnd = true;
        st.speed = 0;
      });
      return null;
    }
    if (!canEndYearEarly(s)) {
      return `Vorzeitig ab ${Math.round(yearThreshold(s.yearNetWorthBase))} € Gesamtvermögen.`;
    }
    patch(set, get, (st) => {
      st.pendingYearEnd = true;
      st.speed = 0;
    });
    return null;
  },

  confirmYear: () => {
    patch(set, get, (st) => {
      resolveYearEdge(st);
    });
  },

  resolvePendingEvent: (optionId) => {
    let err: string | null = null;
    patch(set, get, (st) => {
      err = resolveEvent(st, optionId);
    });
    return err;
  },

  dismissInbox: (id) => set((s) => ({ ...s, inbox: s.inbox.filter((e) => e.id !== id) })),

  restart: () => {
    const career = { ...get().career, runs: get().career.runs + 1 };
    const next = newGame(career);
    next.seenWelcome = true;
    set({ ...get(), ...next, hydrated: true });
    writeSave(next);
  },
}));

export function usedCredit(s: GameState): number {
  return usedCompanyCredit(s);
}

export function availableCredit(s: GameState): number {
  return Math.max(0, (s.creditLimit ?? CREDIT_LIMIT_START) - usedCompanyCredit(s));
}

export {
  canEndYearEarly,
  creditLimit,
  liquidWealth,
  netWorth,
  personalDebtTotal,
  usedCompanyCredit,
  yearThreshold,
  GAME_MINUTES_PER_REAL_SECOND,
};

if (typeof window !== "undefined") {
  (window as unknown as { __EMPIRE_STORE__?: typeof useGame }).__EMPIRE_STORE__ = useGame;
}
