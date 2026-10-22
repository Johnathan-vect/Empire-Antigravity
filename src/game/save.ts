import {
  CRYPTOS,
  DEFAULT_DISTRICT_COMPETITORS,
  DEFAULT_MACRO,
  PRODUCTS,
  SAVE_KEY,
  SAVE_KEY_LEGACY,
  SAVE_VERSION,
  START_CASH,
  STOCKS,
  YEAR1_NET_WORTH_BASE,
  creditLimit,
  productSlotsForLevel,
} from "./catalog";
import { nid, rngNext } from "./clock";
import type {
  Career,
  Company,
  CryptoDef,
  GameState,
  Industry,
  LifetimeStats,
  Loan,
  OwnedProperty,
  ProductOffering,
  Speed,
  StockDef,
  SupplierOffer,
} from "./types";

export function defaultCareer(): Career {
  return {
    level: 1,
    totalEarned: 0,
    totalSpent: 0,
    companiesFounded: 0,
    runs: 1,
    bestNetWorth: START_CASH,
  };
}

export function defaultStats(): LifetimeStats {
  return {
    fromCompanies: 0,
    fromRentals: 0,
    fromDividends: 0,
    fromStockTrading: 0,
    fromCryptoTrading: 0,
    mergersCompleted: 0,
  };
}

function emptyDemand(): Record<string, number> {
  return {
    hotdog: 1.16,
    pommes: 1.08,
    doener: 1.22,
    pizza: 0.96,
    taco: 0.88,
    c_espresso: 1.18,
    c_croissant: 1.07,
    c_matcha: 1.24,
    c_avocado: 0.93,
    c_kuchen: 1.01,
    s_audio: 1.19,
    s_streetwear: 1.12,
    s_smartwatch: 1.02,
    s_backpack: 0.91,
    s_collector: 0.84,
  };
}

function defaultPrevDemand(): Record<string, number> {
  return {
    hotdog: 1.08,
    pommes: 1.04,
    doener: 1.12,
    pizza: 1.0,
    taco: 0.94,
    c_espresso: 1.1,
    c_croissant: 1.03,
    c_matcha: 1.14,
    c_avocado: 0.98,
    c_kuchen: 1.0,
    s_audio: 1.1,
    s_streetwear: 1.06,
    s_smartwatch: 1.0,
    s_backpack: 0.96,
    s_collector: 0.9,
  };
}

export function defaultCompetitionByIndustry(): Record<Industry, number> {
  return {
    imbiss: 0.82,
    cafe: 0.68,
    shop: 0.56,
  };
}

/**
 * Generates a deterministic pre-game hourly price history ending exactly at `endPrice`.
 * Does not touch `GameState.rngSeed`, so simulation determinism is preserved.
 */
function buildInitialQuoteHistory(st: StockDef, endPrice = st.base, count = 180): number[] {
  let seed = 0x811c9dc5;
  for (let i = 0; i < st.ticker.length; i++) {
    seed ^= st.ticker.charCodeAt(i);
    seed = Math.imul(seed, 0x01000193) >>> 0;
  }
  const raw: number[] = [st.base];
  for (let i = 1; i < count; i++) {
    const [n1, s1] = rngNext(seed);
    const [n2, s2] = rngNext(s1);
    seed = s2;
    const prev = raw[i - 1]!;
    const shock = (n1 - 0.485) * 0.012 * st.vol;
    const revert = ((st.base - prev) / st.base) * 0.004;
    const next = Math.max(2.4, prev * (1 + shock + revert + (n2 - 0.5) * 0.001));
    raw.push(next);
  }
  const lastRaw = raw[raw.length - 1] || st.base;
  const scale = endPrice / lastRaw;
  const scaled = raw.map((v) => Math.max(2.4, Math.round(v * scale * 100) / 100));
  scaled[scaled.length - 1] = Math.round(endPrice * 100) / 100;
  return scaled;
}

function buildInitialCryptoHistory(coin: CryptoDef, endPrice = coin.base, count = 180): number[] {
  let seed = 0x9e3779b9;
  for (let i = 0; i < coin.symbol.length; i++) {
    seed ^= coin.symbol.charCodeAt(i);
    seed = Math.imul(seed, 0x01000193) >>> 0;
  }
  const raw: number[] = [coin.base];
  for (let i = 1; i < count; i++) {
    const [n1, s1] = rngNext(seed);
    const [n2, s2] = rngNext(s1);
    seed = s2;
    const prev = raw[i - 1]!;
    const shock = (n1 - 0.482) * 0.016 * coin.vol;
    const revert = ((coin.base - prev) / coin.base) * 0.004;
    const next = Math.max(0.25, prev * (1 + shock + revert + (n2 - 0.5) * 0.002));
    raw.push(next);
  }
  const lastRaw = raw[raw.length - 1] || coin.base;
  const scale = endPrice / lastRaw;
  const scaled = raw.map((v) => Math.max(0.25, Math.round(v * scale * 100) / 100));
  scaled[scaled.length - 1] = Math.round(endPrice * 100) / 100;
  return scaled;
}

export function newGame(career?: Career): GameState {
  const quotes: Record<string, number> = {};
  const quoteHistory: Record<string, number[]> = {};
  for (const st of STOCKS) {
    quotes[st.ticker] = st.base;
    quoteHistory[st.ticker] = buildInitialQuoteHistory(st, st.base, 180);
  }

  const cryptoQuotes: Record<string, number> = {};
  const cryptoHistory: Record<string, number[]> = {};
  for (const coin of CRYPTOS) {
    cryptoQuotes[coin.symbol] = coin.base;
    cryptoHistory[coin.symbol] = buildInitialCryptoHistory(coin, coin.base, 180);
  }

  const now = Date.now();
  return {
    version: SAVE_VERSION,
    createdAt: now,
    lastRealTs: now,
    gameMinutes: 8 * 60,
    year: 1,
    yearStartMinutes: 0,
    rngSeed: (now ^ 0x9e3779b9) >>> 0,
    speed: 1,
    theme: "dark",
    playerName: "",
    cash: START_CASH,
    creditLimit: creditLimit(18, []),
    reputation: 18,
    licenses: [],
    possessions: [],
    realEstate: [],
    collections: [],
    companies: [],
    loans: [],
    holdings: [],
    quotes,
    quoteHistory,
    cryptoHoldings: [],
    cryptoQuotes,
    cryptoHistory,
    stats: defaultStats(),
    market: {
      demand: 1.04,
      prevDemand: 1.0,
      competition: 0.69,
      competitionByIndustry: defaultCompetitionByIndustry(),
      volUntil: 0,
      yearNote:
        "Freundliches Marktklima zum Jahresstart. Streetfood-Klassiker und Kaffeespezialitäten sind besonders gefragt.",
      pulseNote:
        "Aktueller Trend: Hohe Nachfrage bei Döner, Matcha & Iced Latte sowie Kopfhörer & Audio.",
      demandByProduct: emptyDemand(),
      prevDemandByProduct: defaultPrevDemand(),
      macro: { ...DEFAULT_MACRO },
      districtCompetitors: [...DEFAULT_DISTRICT_COMPETITORS],
    },
    applications: [],
    inbox: [],
    pendingEvent: null,
    pendingYearEnd: false,
    yearNetWorthBase: YEAR1_NET_WORTH_BASE,
    ledger: [
      {
        id: nid("ld"),
        at: 8 * 60,
        label: "Startkapital",
        amount: START_CASH,
        bucket: "personal",
      },
    ],
    netHistory: [{ t: 8 * 60, v: START_CASH }],
    career: career ?? defaultCareer(),
    seenWelcome: false,
    insolvent: false,
    insolvency: null,
    offlineReport: null,
    ui: {
      tab: "home",
      companyId: null,
      selectedTicker: null,
      selectedCrypto: null,
      showFounding: false,
      showMarketAnalysis: false,
      showSettings: false,
    },
  };
}

function migrateSpeed(raw: unknown): Speed {
  if (raw === 0 || raw === 1 || raw === 2 || raw === 5) return raw;
  if (raw === 4) return 2;
  if (raw === 16) return 5;
  return 1;
}

function migrateSupplierOffer(raw: Partial<SupplierOffer> | null | undefined): SupplierOffer | null {
  if (!raw || typeof raw !== "object" || typeof raw.name !== "string") return null;
  const quality = typeof raw.quality === "number" ? raw.quality : 0.7;
  const isHighTier = quality >= 0.78;
  const isLowTier = quality <= 0.6;
  const defaultMin = isHighTier ? 50 : isLowTier ? 10 : 25;
  const defaultMax = isHighTier ? 160 : isLowTier ? 45 : 95;
  const minOrderQty =
    typeof raw.minOrderQty === "number" && raw.minOrderQty > 0 ? raw.minOrderQty : defaultMin;
  const maxOrderQty =
    typeof raw.maxOrderQty === "number" && raw.maxOrderQty >= minOrderQty
      ? raw.maxOrderQty
      : Math.max(minOrderQty + 15, defaultMax);
  const baseMaxOrderQty =
    typeof raw.baseMaxOrderQty === "number" && raw.baseMaxOrderQty >= minOrderQty
      ? raw.baseMaxOrderQty
      : maxOrderQty;
  const growthStep =
    typeof raw.growthStep === "number" && raw.growthStep > 0
      ? raw.growthStep
      : isHighTier
        ? 40
        : isLowTier
          ? 15
          : 25;
  const defaultCap = Math.round((baseMaxOrderQty * 3.1) / 10) * 10;
  const maxOrderCap =
    typeof raw.maxOrderCap === "number" && raw.maxOrderCap >= defaultCap
      ? Math.max(raw.maxOrderCap, maxOrderQty)
      : Math.max(maxOrderQty, defaultCap);
  const highMoodHours =
    typeof raw.highMoodHours === "number" && raw.highMoodHours >= 0 ? raw.highMoodHours : 0;

  return {
    id: raw.id ?? nid("sup"),
    name: raw.name,
    blurb: raw.blurb ?? "Großhandelsvertrag",
    priceMult: typeof raw.priceMult === "number" ? raw.priceMult : 1,
    quality,
    reliability: typeof raw.reliability === "number" ? raw.reliability : 0.85,
    leadTimeMinutes: typeof raw.leadTimeMinutes === "number" ? raw.leadTimeMinutes : 120,
    hiringFee: typeof raw.hiringFee === "number" ? raw.hiringFee : 100,
    minOrderQty,
    maxOrderQty,
    baseMaxOrderQty,
    maxOrderCap,
    growthStep,
    highMoodHours,
    satisfaction:
      typeof raw.satisfaction === "number" ? Math.max(0, Math.min(100, raw.satisfaction)) : 85,
    moodGainMult:
      typeof raw.moodGainMult === "number"
        ? raw.moodGainMult
        : isLowTier
          ? 1.45
          : isHighTier
            ? 0.7
            : 1.05,
    moodDecayPerDay:
      typeof raw.moodDecayPerDay === "number"
        ? raw.moodDecayPerDay
        : isLowTier
          ? 12
          : isHighTier
            ? 22
            : 16,
  };
}

function migrateCompany(raw: unknown): Company | null {
  if (!raw || typeof raw !== "object") return null;
  const c = raw as Partial<Company> & {
    equityIn?: number;
    employees?: { length: number };
    locationId?: string;
    upgrades?: Partial<Company["upgrades"]>;
  };
  const level = typeof c.level === "number" ? c.level : 1;
  const industry = c.industry === "cafe" || c.industry === "shop" ? c.industry : "imbiss";
  const locationId = c.locationId === "viertel" || c.locationId === "zentrum" ? c.locationId : "kiez";
  const scale =
    c.scale === "smallChain" || c.scale === "largeChain" ? c.scale : "local";
  const upgrades = {
    equipment: Math.max(0, Math.min(3, c.upgrades?.equipment ?? 0)),
    storage: Math.max(0, Math.min(3, c.upgrades?.storage ?? 0)),
    marketing: Math.max(0, Math.min(3, c.upgrades?.marketing ?? 0)),
    autoOrder: Boolean(c.upgrades?.autoOrder),
  };

  return {
    id: c.id ?? nid("co"),
    name: c.name ?? (industry === "cafe" ? "Bistro" : industry === "shop" ? "Trendshop" : "Imbiss"),
    industry,
    locationId,
    scale,
    mergerId: typeof c.mergerId === "string" ? c.mergerId : undefined,
    synergyMult: typeof c.synergyMult === "number" && c.synergyMult > 0 ? c.synergyMult : 1,
    level,
    cash: typeof c.cash === "number" ? c.cash : 0,
    equityIn: typeof c.equityIn === "number" ? c.equityIn : (c.equity ?? 0),
    equity: typeof c.equity === "number" ? c.equity : (c.equityIn ?? 0),
    debt: typeof c.debt === "number" ? c.debt : 0,
    status:
      c.status === "buyback" || c.status === "paused" || c.status === "insolvent"
        ? c.status
        : "active",
    employeeCount:
      typeof c.employeeCount === "number" ? c.employeeCount : (c.employees?.length ?? 0),
    productSlotMax:
      typeof c.productSlotMax === "number" ? c.productSlotMax : productSlotsForLevel(level),
    foundedAt: typeof c.foundedAt === "number" ? c.foundedAt : 8 * 60,
    foundedAtGameYear: typeof c.foundedAtGameYear === "number" ? c.foundedAtGameYear : 1,
    foundedAtIso: typeof c.foundedAtIso === "string" ? c.foundedAtIso : new Date().toISOString(),
    hygiene: typeof c.hygiene === "number" ? c.hygiene : 70,
    hygieneBudget: 0,
    rentPerDay: typeof c.rentPerDay === "number" ? c.rentPerDay : 0,
    manager: Boolean(c.manager),
    managerCostPerDay: typeof c.managerCostPerDay === "number" ? c.managerCostPerDay : 0,
    upgrades,
    forecast: c.forecast ?? "",
    products: (() => {
      const existingList = Array.isArray(c.products) ? c.products : [];
      const seen = new Set<string>();
      const orderedDefs = [
        ...existingList
          .map((p) => (p ? PRODUCTS.find((d) => d.id === p.productId) : undefined))
          .filter((d): d is (typeof PRODUCTS)[number] => {
            if (!d || seen.has(d.id)) return false;
            seen.add(d.id);
            return true;
          }),
        ...PRODUCTS.filter((d) => !seen.has(d.id)),
      ];
      return orderedDefs.map((def): ProductOffering => {
        const existing = existingList.find((p) => p && p.productId === def.id);
        return {
          productId: def.id,
          enabled: Boolean(existing?.enabled),
          price: typeof existing?.price === "number" ? existing.price : def.fairPrice,
          stock: typeof existing?.stock === "number" ? existing.stock : 0,
          supplierId: existing?.supplierId ?? "mittel",
          orderedLifetime:
            typeof existing?.orderedLifetime === "number" ? existing.orderedLifetime : 0,
          soldLifetime:
            typeof existing?.soldLifetime === "number" ? existing.soldLifetime : 0,
          pendingDeliveries: Array.isArray(existing?.pendingDeliveries)
            ? existing.pendingDeliveries
            : [],
          autoOrder: Boolean(existing?.autoOrder),
          contractedSupplier: migrateSupplierOffer(existing?.contractedSupplier),
          candidateSuppliers: Array.isArray(existing?.candidateSuppliers)
            ? existing.candidateSuppliers
                .map((cand) => migrateSupplierOffer(cand))
                .filter((cand): cand is SupplierOffer => cand !== null)
            : [],
          nextSupplierSearchAt:
            typeof existing?.nextSupplierSearchAt === "number" ? existing.nextSupplierSearchAt : 0,
          nextOrderAvailableAt:
            typeof existing?.nextOrderAvailableAt === "number" ? existing.nextOrderAvailableAt : 0,
        };
      });
    })(),
    employees: Array.isArray(c.employees) ? c.employees : [],
    todayRevenue: c.todayRevenue ?? 0,
    todayExpenses: c.todayExpenses ?? 0,
    todayCustomers: c.todayCustomers ?? 0,
    todayCogs: c.todayCogs ?? 0,
    todayWages: c.todayWages ?? 0,
    lifetimeRevenue: c.lifetimeRevenue ?? 0,
    lifetimeProfit: c.lifetimeProfit ?? 0,
    yesterday: c.yesterday ?? null,
    history: Array.isArray(c.history) ? c.history : [],
    insolventAtGameDay: c.insolventAtGameDay,
    buybackUntilGameDay: c.buybackUntilGameDay,
    buybackPrice: c.buybackPrice,
    autoDividend: Boolean(c.autoDividend),
    dividendPct: typeof c.dividendPct === "number" ? c.dividendPct : 70,
    strikeActiveUntil: typeof c.strikeActiveUntil === "number" ? c.strikeActiveUntil : undefined,
  };
}

function migrateLoan(raw: unknown): Loan | null {
  if (!raw || typeof raw !== "object") return null;
  const l = raw as Partial<Loan> & { companyId?: string; originatedAt?: number };
  const remaining = typeof l.remaining === "number" ? l.remaining : 0;
  return {
    id: l.id ?? nid("ln"),
    owner: l.owner === "player" ? "player" : "company",
    companyId: l.companyId,
    principal: typeof l.principal === "number" ? l.principal : remaining,
    remaining,
    annualRate: typeof l.annualRate === "number" ? l.annualRate : 0.1,
    accruedInterest: typeof l.accruedInterest === "number" ? l.accruedInterest : 0,
    createdAtGameDay: typeof l.createdAtGameDay === "number" ? l.createdAtGameDay : 1,
  };
}

export function migrate(raw: unknown): GameState {
  const fallback = newGame();
  if (!raw || typeof raw !== "object") return fallback;
  const s = raw as Partial<GameState> & { version?: number };
  const companies = Array.isArray(s.companies)
    ? s.companies.map(migrateCompany).filter((c): c is Company => Boolean(c))
    : [];
  const loans = Array.isArray(s.loans)
    ? s.loans.map(migrateLoan).filter((l): l is Loan => Boolean(l))
    : [];
  const licenses = Array.isArray(s.licenses)
    ? s.licenses.filter(
        (x): x is "imbiss" | "cafe" | "shop" =>
          x === "imbiss" || x === "cafe" || x === "shop",
      )
    : Array.from(new Set(companies.map((c) => c.industry)));

  const collections = Array.isArray(s.collections) ? s.collections : [];
  const reputation = typeof s.reputation === "number" ? s.reputation : 18;
  const realEstate: OwnedProperty[] = Array.isArray(s.realEstate)
    ? s.realEstate
        .filter((r): r is OwnedProperty => Boolean(r && typeof r === "object" && typeof r.propertyId === "string"))
        .map((r) => ({
          propertyId: r.propertyId,
          purchasedAt: typeof r.purchasedAt === "number" ? r.purchasedAt : 8 * 60,
          upgrades: Array.isArray(r.upgrades) ? r.upgrades : [],
          lifetimeRent: typeof r.lifetimeRent === "number" ? r.lifetimeRent : 0,
        }))
    : [];

  return {
    ...fallback,
    ...s,
    version: SAVE_VERSION,
    speed: migrateSpeed(s.speed),
    reputation,
    creditLimit: creditLimit(reputation, collections),
    licenses,
    realEstate,
    collections,
    stats: {
      ...defaultStats(),
      ...(s.stats ?? {}),
    },
    pendingYearEnd: Boolean(s.pendingYearEnd),
    yearNetWorthBase:
      typeof s.yearNetWorthBase === "number" ? s.yearNetWorthBase : YEAR1_NET_WORTH_BASE,
    yearStartMinutes: s.yearStartMinutes === 8 * 60 ? 0 : (s.yearStartMinutes ?? 0),
    career: { ...fallback.career, ...(s.career ?? {}) },
    market: (() => {
      const rawDemandMap = s.market?.demandByProduct ?? {};
      const values = Object.values(rawDemandMap);
      const isAllFlatOne =
        values.length === 0 || values.every((v) => typeof v === "number" && Math.abs(v - 1) < 0.001);
      const mergedDemand = isAllFlatOne
        ? emptyDemand()
        : { ...emptyDemand(), ...rawDemandMap };
      const mergedPrevDemand = s.market?.prevDemandByProduct
        ? { ...defaultPrevDemand(), ...s.market.prevDemandByProduct }
        : defaultPrevDemand();
      const defComp = defaultCompetitionByIndustry();
      const rawCompByInd = s.market?.competitionByIndustry;
      const baseComp = typeof s.market?.competition === "number" ? s.market.competition : 0.7;
      const competitionByIndustry: Record<Industry, number> = {
        imbiss:
          typeof rawCompByInd?.imbiss === "number"
            ? rawCompByInd.imbiss
            : Math.round(Math.min(1.65, Math.max(0.4, baseComp * 1.16)) * 100) / 100,
        cafe:
          typeof rawCompByInd?.cafe === "number"
            ? rawCompByInd.cafe
            : Math.round(Math.min(1.65, Math.max(0.4, baseComp * 0.96)) * 100) / 100,
        shop:
          typeof rawCompByInd?.shop === "number"
            ? rawCompByInd.shop
            : Math.round(Math.min(1.65, Math.max(0.4, baseComp * 0.82)) * 100) / 100,
      };
      if (
        Math.abs(competitionByIndustry.imbiss - competitionByIndustry.cafe) < 0.02 &&
        Math.abs(competitionByIndustry.cafe - competitionByIndustry.shop) < 0.02
      ) {
        competitionByIndustry.imbiss = defComp.imbiss;
        competitionByIndustry.cafe = defComp.cafe;
        competitionByIndustry.shop = defComp.shop;
      }
      return {
        ...fallback.market,
        ...(s.market ?? {}),
        competitionByIndustry,
        demand:
          typeof s.market?.demand === "number"
            ? isAllFlatOne && Math.abs(s.market.demand - 1) < 0.001
              ? 1.04
              : s.market.demand
            : 1.04,
        prevDemand:
          typeof s.market?.prevDemand === "number" ? s.market.prevDemand : 1.0,
        pulseNote:
          typeof s.market?.pulseNote === "string" && s.market.pulseNote.length > 0
            ? s.market.pulseNote
            : fallback.market.pulseNote,
        demandByProduct: mergedDemand,
        prevDemandByProduct: mergedPrevDemand,
        macro: s.market?.macro ?? { ...DEFAULT_MACRO },
        districtCompetitors: Array.isArray(s.market?.districtCompetitors)
          ? s.market.districtCompetitors
          : [...DEFAULT_DISTRICT_COMPETITORS],
      };
    })(),
    ui: {
      ...fallback.ui,
      ...(s.ui ?? {}),
      showMarketAnalysis: Boolean(s.ui?.showMarketAnalysis),
    },
    companies,
    loans,
    holdings: s.holdings ?? [],
    quotes: { ...fallback.quotes, ...(s.quotes ?? {}) },
    quoteHistory: (() => {
      const merged: Record<string, number[]> = {
        ...fallback.quoteHistory,
        ...(s.quoteHistory ?? {}),
      };
      for (const st of STOCKS) {
        const cur = merged[st.ticker];
        const targetEnd =
          cur && cur.length > 0 ? cur[cur.length - 1]! : (s.quotes?.[st.ticker] ?? st.base);
        if (!cur || cur.length < 24) {
          const prefix = buildInitialQuoteHistory(st, cur?.[0] ?? targetEnd, 180);
          merged[st.ticker] =
            cur && cur.length > 1 ? [...prefix.slice(0, -1), ...cur] : prefix;
        }
      }
      return merged;
    })(),
    cryptoHoldings: Array.isArray(s.cryptoHoldings) ? s.cryptoHoldings : [],
    cryptoQuotes: { ...fallback.cryptoQuotes, ...(s.cryptoQuotes ?? {}) },
    cryptoHistory: (() => {
      const merged: Record<string, number[]> = {
        ...fallback.cryptoHistory,
        ...(s.cryptoHistory ?? {}),
      };
      for (const coin of CRYPTOS) {
        const cur = merged[coin.symbol];
        const targetEnd =
          cur && cur.length > 0 ? cur[cur.length - 1]! : (s.cryptoQuotes?.[coin.symbol] ?? coin.base);
        if (!cur || cur.length < 24) {
          const prefix = buildInitialCryptoHistory(coin, cur?.[0] ?? targetEnd, 180);
          merged[coin.symbol] =
            cur && cur.length > 1 ? [...prefix.slice(0, -1), ...cur] : prefix;
        }
      }
      return merged;
    })(),
    possessions: s.possessions ?? [],
    applications: Array.isArray(s.applications)
      ? s.applications.filter(
          (a): a is GameState["applications"][number] =>
            Boolean(
              a &&
                typeof a === "object" &&
                typeof a.id === "string" &&
                typeof a.name === "string" &&
                typeof a.desiredWage === "number" &&
                typeof a.expiresAt === "number",
            ),
        )
      : [],
    inbox: s.inbox ?? [],
    ledger: s.ledger ?? fallback.ledger,
    netHistory: s.netHistory ?? fallback.netHistory,
  };
}

export function loadSave(): GameState {
  try {
    const raw = localStorage.getItem(SAVE_KEY) ?? localStorage.getItem(SAVE_KEY_LEGACY);
    if (!raw) return newGame();
    return migrate(JSON.parse(raw));
  } catch {
    return newGame();
  }
}

export function writeSave(state: GameState): void {
  try {
    const snapshot = { ...state, lastRealTs: Date.now() };
    localStorage.setItem(SAVE_KEY, JSON.stringify(snapshot));
    localStorage.setItem(`${SAVE_KEY}.bak`, JSON.stringify(snapshot));
  } catch {
    // private mode / quota — keep playing in memory
  }
}

export function careerLevel(totalEarned: number): number {
  return 1 + Math.floor(Math.max(0, totalEarned) / 20_000);
}
