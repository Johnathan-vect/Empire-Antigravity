import {
  CLEANING_COST,
  COLLECTION_CATEGORIES,
  COLLECTION_ITEMS,
  CREDIT_OFFERS,
  CRYPTOS,
  DEFAULT_DISTRICT_COMPETITORS,
  DEFAULT_MACRO,
  HISTORY_CAP,
  HOUR_CURVE,
  HYGIENE_START,
  INDUSTRIES,
  INTEREST_ANNUAL,
  LEDGER_CAP,
  LIVING_PER_DAY,
  MINUTES_PER_DAY,
  MINUTES_PER_HOUR,
  POSSESSIONS,
  PRODUCT_COMMODITY_MAP,
  PRODUCTS,
  REAL_ESTATE,
  STOCKS,
  STOCK_HISTORY_CAP,
  SUPPLIER_NAMES_BY_INDUSTRY,
  YEAR_EVENTS,
  YEAR_LENGTH_DAYS,
  buybackPriceOf,
  collectionCategoryById,
  companyScaleById,
  creditLimit,
  cryptoBySymbol,
  dailyInterest,
  industryById,
  locationById,
  managerCostPerDayForIndustry,
  mergerById,
  productById,
  productSlotsForLevel,
  productsForIndustry,
  realEstateById,
  scaleUpgradeByTarget,
  stockByTicker,
  supplierById,
  unitCost,
  volumeDiscount,
  yearThreshold,
} from "./catalog";
import {
  absoluteGameDay,
  clamp,
  isOpenHour,
  nid,
  pick,
  readClock,
  rngNext,
  yearCapMinutes,
} from "./clock";
import { maybeQueueEvents } from "./events";
import type {
  Company,
  CompanyScaleId,
  CustomerTrafficBreakdown,
  GameState,
  Gender,
  Industry,
  LedgerEntry,
  Loan,
  LoanCategory,
  LoanOwner,
  LocationId,
  MacroCycle,
  MacroState,
  OwnedProperty,
  ProductOffering,
  Role,
  SimBurst,
  SupplierOffer,
} from "./types";

export function pushLedger(
  s: GameState,
  label: string,
  amount: number,
  bucket: LedgerEntry["bucket"],
): void {
  s.ledger.unshift({
    id: nid("ld"),
    at: s.gameMinutes,
    label,
    amount,
    bucket,
  });
  if (s.ledger.length > LEDGER_CAP) s.ledger.length = LEDGER_CAP;
  if (amount > 0) s.career.totalEarned += amount;
  else s.career.totalSpent += Math.abs(amount);
}

export function companyUnitCost(
  company: Company,
  productId: string,
  supplierId: string,
  orderedLifetime: number,
): number {
  const base = unitCost(productId, supplierId, orderedLifetime);
  const storageLvl = company.upgrades?.storage ?? 0;
  const storageDiscount = 1 - storageLvl * 0.04;
  const scaleDiscount = company.scale === "largeChain" ? 0.92 : 1;
  return base * storageDiscount * scaleDiscount;
}

export function offeringUnitCost(
  company: Company,
  offering: ProductOffering,
  customOffer?: SupplierOffer,
  macro?: MacroState,
): number {
  const def = productById(offering.productId);
  const priceMult =
    customOffer?.priceMult ??
    offering.contractedSupplier?.priceMult ??
    supplierById(offering.supplierId || "mittel").priceMult;
  const volDisc = volumeDiscount(offering.orderedLifetime);
  const storageLvl = company.upgrades?.storage ?? 0;
  const storageDiscount = 1 - storageLvl * 0.04;
  const scaleDiscount = company.scale === "largeChain" ? 0.92 : 1;
  const commKey = PRODUCT_COMMODITY_MAP[offering.productId];
  const commMult = commKey && macro?.commodities?.[commKey] ? macro.commodities[commKey] : 1;
  const inflationMult = 1 + (macro?.inflationRate ?? 0);
  return def.baseCost * priceMult * volDisc * storageDiscount * scaleDiscount * commMult * inflationMult;
}

export function offeringQuality(
  offering: ProductOffering,
  customOffer?: SupplierOffer,
): number {
  return (
    customOffer?.quality ??
    offering.contractedSupplier?.quality ??
    supplierById(offering.supplierId || "mittel").quality
  );
}

export function inventoryValue(company: Company): number {
  let v = 0;
  for (const p of company.products) {
    const inTransit = (p.pendingDeliveries ?? []).reduce((sum, d) => sum + d.qty, 0);
    v += (p.stock + inTransit) * offeringUnitCost(company, p);
  }
  return v;
}

export function stockValue(s: GameState): number {
  let v = 0;
  for (const h of s.holdings) {
    v += h.shares * (s.quotes[h.ticker] ?? 0);
  }
  return v;
}

export function cryptoValue(s: GameState): number {
  let v = 0;
  for (const h of s.cryptoHoldings ?? []) {
    v += h.coins * (s.cryptoQuotes?.[h.symbol] ?? 0);
  }
  return v;
}

export function propertyDailyRent(prop: OwnedProperty): number {
  const def = REAL_ESTATE.find((r) => r.id === prop.propertyId);
  if (!def) return 0;
  let boostPct = 0;
  for (const upId of prop.upgrades ?? []) {
    const up = def.upgrades.find((u) => u.id === upId);
    if (up) boostPct += up.rentBoostPct;
  }
  return Math.round(def.dailyRent * (1 + boostPct / 100));
}

export function totalDailyRent(s: GameState): number {
  return (s.realEstate ?? []).reduce((sum, p) => sum + propertyDailyRent(p), 0);
}

export function realEstateValue(s: GameState): number {
  let v = 0;
  for (const prop of s.realEstate ?? []) {
    const def = REAL_ESTATE.find((r) => r.id === prop.propertyId);
    if (!def) continue;
    let upgradeVal = 0;
    for (const upId of prop.upgrades ?? []) {
      const up = def.upgrades.find((u) => u.id === upId);
      if (up) upgradeVal += up.cost * 0.85;
    }
    v += def.price + upgradeVal;
  }
  return v;
}

export function dailyDividendEstimate(s: GameState): number {
  let total = 0;
  for (const h of s.holdings) {
    if (h.shares <= 0) continue;
    const def = STOCKS.find((st) => st.ticker === h.ticker);
    if (!def) continue;
    const px = s.quotes[h.ticker] ?? def.base;
    total += h.shares * px * (def.dividendYield / YEAR_LENGTH_DAYS);
  }
  return total;
}

export function collectionValue(s: GameState): number {
  let v = 0;
  for (const id of s.collections ?? []) {
    const item = COLLECTION_ITEMS.find((x) => x.id === id);
    if (item) v += item.price;
  }
  return v;
}

export function debtRemaining(s: GameState): number {
  return s.loans.reduce((a, l) => a + l.remaining, 0);
}

export function companyDebtTotal(s: GameState, companyId: string): number {
  return s.loans
    .filter((l) => l.owner === "company" && l.companyId === companyId)
    .reduce((a, l) => a + l.remaining, 0);
}

export function usedCompanyCredit(s: GameState): number {
  return s.loans.filter((l) => l.owner === "company").reduce((a, l) => a + l.remaining, 0);
}

export function personalDebtTotal(s: GameState): number {
  return s.loans.filter((l) => l.owner === "player").reduce((a, l) => a + l.remaining, 0);
}

export function possessionValue(s: GameState): number {
  let v = 0;
  for (const id of s.possessions) {
    const def = POSSESSIONS.find((p) => p.id === id);
    if (def) v += def.price * 0.5;
  }
  return v;
}

/** Privat + Firmenkassen + Lager + Aktien + Krypto + Immobilien − Schulden. */
export function netWorth(s: GameState): number {
  const companies = s.companies.reduce((a, c) => a + c.cash + inventoryValue(c), 0);
  return (
    s.cash +
    companies +
    stockValue(s) +
    cryptoValue(s) +
    realEstateValue(s) -
    debtRemaining(s)
  );
}

export function liquidWealth(s: GameState): number {
  const companies = s.companies.reduce((a, c) => a + c.cash, 0);
  return s.cash + companies + stockValue(s) + cryptoValue(s);
}

export function syncCompanyDebt(s: GameState, company: Company): void {
  company.debt = companyDebtTotal(s, company.id);
}

export function canEndYearEarly(s: GameState): boolean {
  return netWorth(s) + 0.01 >= yearThreshold(s.yearNetWorthBase);
}

export function tryBuyIndustryLicense(st: GameState, industry: Industry): string | null {
  if (st.licenses.includes(industry)) return "Lizenz bereits vorhanden.";
  const def = industryById(industry);
  if (netWorth(st) < def.minNetWorth) {
    return `Benötigt mindestens ${def.minNetWorth.toLocaleString("de-DE")} € Gesamtvermögen.`;
  }
  if (st.cash < def.licenseFee) return "Nicht genug Guthaben für die Lizenz.";
  st.cash -= def.licenseFee;
  st.licenses.push(industry);
  pushLedger(st, `Lizenz ${def.name}`, -def.licenseFee, "license");
  return null;
}

export function tryBuyLicense(st: GameState): string | null {
  return tryBuyIndustryLicense(st, "imbiss");
}

export function tryFoundCompany(
  st: GameState,
  rawName: string,
  industry: Industry,
  locationId: LocationId,
  equity: number,
  extra: number,
  scale: CompanyScaleId = "local",
): string | null {
  const name = rawName.trim().slice(0, 32);
  if (name.length < 3) return "Name: 3 bis 32 Zeichen.";
  if (!st.licenses.includes(industry)) {
    if (industry === "imbiss") return "Zuerst die Imbiss-Lizenz kaufen.";
    return `Zuerst die Lizenz für ${industryById(industry).name} kaufen.`;
  }
  const indDef = industryById(industry);
  const locDef = locationById(locationId);
  const scaleDef = companyScaleById(scale);
  if (netWorth(st) < scaleDef.minNetWorth) {
    return `Größenstufe „${scaleDef.name}“ erfordert mindestens ${scaleDef.minNetWorth.toLocaleString("de-DE")} € Gesamtvermögen.`;
  }
  const fee = Math.round(indDef.foundingFee * scaleDef.feeMult);
  const loanAmt = Math.max(0, fee - equity);
  const extraAmt = Math.max(0, extra);

  if (equity < 0 || equity > fee) return "Eigenkapital ungültig.";
  if (equity + extraAmt > st.cash + 0.01)
    return "Nicht genug Guthaben für Eigenkapital und Einlage.";
  if (loanAmt > 0.01 && loanAmt > st.creditLimit - usedCompanyCredit(st) + 0.01) {
    return "Kreditlimit überschritten.";
  }
  if (equity + loanAmt < fee - 0.01)
    return "Finanzierung deckt die Gründungsgebühr nicht.";

  st.cash -= equity + extraAmt;
  const newId = nid("co");
  const clock = readClock(st);
  const rentPerDay = Math.round(locDef.rentMult * indDef.baseRent * scaleDef.rentMult);

  st.companies.push(
    newCompanyDefaults({
      id: newId,
      name,
      industry,
      locationId,
      scale,
      rentPerDay,
      cash: extraAmt,
      equity,
      debt: loanAmt,
      foundedAt: st.gameMinutes,
      foundedAtGameYear: st.year,
      yearNote: st.market.yearNote,
    }),
  );

  if (loanAmt > 0) {
    st.loans.push({
      id: nid("ln"),
      owner: "company",
      companyId: newId,
      principal: loanAmt,
      remaining: loanAmt,
      annualRate: INTEREST_ANNUAL,
      accruedInterest: 0,
      createdAtGameDay: (st.year - 1) * YEAR_LENGTH_DAYS + clock.day,
    });
  }
  st.career.companiesFounded += 1;
  st.ui.showFounding = false;
  st.ui.companyId = newId;
  st.ui.tab = "biz";
  if (equity + extraAmt > 0) {
    pushLedger(st, `Gründung ${name} (${scaleDef.name})`, -(equity + extraAmt), "company");
  }
  return null;
}

export function tryFoundImbiss(
  st: GameState,
  rawName: string,
  equity: number,
  extra: number,
): string | null {
  return tryFoundCompany(st, rawName, "imbiss", "kiez", equity, extra, "local");
}

export function tryExecuteMerger(
  st: GameState,
  mergerId: string,
  customName?: string,
): string | null {
  const merger = mergerById(mergerId);
  if (st.cash < merger.mergerFee) {
    return `Fusionsgebühr von ${merger.mergerFee.toLocaleString("de-DE")} € auf dem Privatkonto benötigt.`;
  }

  const chosenIds: string[] = [];
  for (const req of merger.requirements) {
    const matching = st.companies
      .filter(
        (c) =>
          c.status === "active" &&
          c.industry === req.industry &&
          c.level >= req.minLevel &&
          !chosenIds.includes(c.id),
      )
      .sort((a, b) => b.level - a.level);
    if (matching.length < req.count) {
      return `Voraussetzung nicht erfüllt: ${req.count}× ${industryById(req.industry).name} ab Stufe ${req.minLevel} benötigt.`;
    }
    for (let i = 0; i < req.count; i++) {
      chosenIds.push(matching[i]!.id);
    }
  }

  const mergingCos = st.companies.filter((c) => chosenIds.includes(c.id));
  const combinedCash = mergingCos.reduce((sum, c) => sum + c.cash, 0);
  const combinedRev = mergingCos.reduce((sum, c) => sum + c.lifetimeRevenue, 0);
  const combinedProf = mergingCos.reduce((sum, c) => sum + c.lifetimeProfit, 0);
  const maxLvl = Math.max(...mergingCos.map((c) => c.level));
  const combinedEmployees = mergingCos.flatMap((c) => c.employees ?? []).slice(0, maxLvl * 2 + 4);
  const anyManager = mergingCos.some((c) => c.manager);

  const primary = mergingCos[0]!;
  const newName = (customName?.trim() || merger.name).slice(0, 32);

  st.cash -= merger.mergerFee;
  pushLedger(st, `Unternehmensfusion: ${newName}`, -merger.mergerFee, "company");

  // Reassign any loans of secondary companies to primary company
  for (const loan of st.loans) {
    if (loan.owner === "company" && loan.companyId && chosenIds.includes(loan.companyId)) {
      loan.companyId = primary.id;
    }
  }

  primary.name = newName;
  primary.industry = merger.targetIndustry;
  primary.scale = "largeChain";
  primary.mergerId = merger.id;
  primary.synergyMult = Math.max(primary.synergyMult ?? 1, merger.synergyMult);
  primary.level = maxLvl;
  primary.productSlotMax = productSlotsForLevel(maxLvl, merger.bonusSlots);
  primary.cash = combinedCash;
  primary.lifetimeRevenue = combinedRev;
  primary.lifetimeProfit = combinedProf;
  primary.employees = combinedEmployees;
  primary.employeeCount = combinedEmployees.length;
  primary.manager = anyManager;
  primary.managerCostPerDay = anyManager ? managerCostPerDayForIndustry(merger.targetIndustry) : 0;
  primary.upgrades = {
    equipment: Math.max(...mergingCos.map((c) => c.upgrades?.equipment ?? 0)),
    storage: Math.max(...mergingCos.map((c) => c.upgrades?.storage ?? 0)),
    marketing: Math.max(...mergingCos.map((c) => c.upgrades?.marketing ?? 0)),
    autoOrder: mergingCos.some((c) => Boolean(c.upgrades?.autoOrder)),
  };
  primary.forecast = `Fusioniert zu ${newName}: Dauerhafter Synergie-Bonus +${Math.round((merger.synergyMult - 1) * 100)} % aktiv.`;

  // Remove merged secondary companies
  const secondaryIds = new Set(chosenIds.slice(1));
  st.companies = st.companies.filter((c) => !secondaryIds.has(c.id));
  syncCompanyDebt(st, primary);

  st.reputation += merger.reputationGain;
  st.creditLimit = creditLimit(st.reputation, st.collections);
  st.stats.mergersCompleted = (st.stats.mergersCompleted ?? 0) + 1;
  st.ui.companyId = primary.id;
  return null;
}

export function tryUpgradeCompanyScale(
  st: GameState,
  companyId: string,
  targetScale: "smallChain" | "largeChain",
): string | null {
  const company = st.companies.find((c) => c.id === companyId);
  if (!company) return "Unternehmen nicht gefunden.";
  if (company.status !== "active") return "Betrieb muss aktiv sein, um zu expandieren.";
  if (company.scale === targetScale) {
    return `Betrieb ist bereits als ${companyScaleById(targetScale).name} aufgestellt.`;
  }
  if (company.scale === "largeChain") {
    return "Betrieb hat bereits die maximale Expansionsstufe erreicht.";
  }
  if (targetScale === "largeChain" && company.scale !== "smallChain") {
    return "Zuerst den Ausbau zur kleinen Ladenkette abschließen.";
  }

  const upDef = scaleUpgradeByTarget(targetScale);
  if (company.level < upDef.minLevel) {
    return `Erfordert mindestens Betriebsstufe ${upDef.minLevel} (aktuell: Stufe ${company.level}).`;
  }
  const currentNet = netWorth(st);
  if (currentNet < upDef.minNetWorth) {
    return `Erfordert mindestens ${upDef.minNetWorth.toLocaleString("de-DE")} € Gesamtvermögen.`;
  }
  const fee = upDef.feeByIndustry[company.industry ?? "imbiss"] ?? 15_000;
  if (st.cash < fee) {
    return `Privatkonto reicht nicht aus (benötigt: ${fee.toLocaleString("de-DE")} €).`;
  }

  st.cash -= fee;
  company.scale = targetScale;
  const indDef = industryById(company.industry ?? "imbiss");
  const locDef = locationById(company.locationId ?? "kiez");
  const nextScaleDef = companyScaleById(targetScale);
  company.rentPerDay = Math.round(locDef.rentMult * indDef.baseRent * nextScaleDef.rentMult);

  st.reputation += upDef.reputationGain;
  st.creditLimit = creditLimit(st.reputation, st.collections);
  pushLedger(st, `Filialnetz-Ausbau: ${company.name} (${upDef.name})`, -fee, "company");
  return null;
}

export function tryBuyRealEstate(st: GameState, propertyId: string): string | null {
  const def = realEstateById(propertyId);
  if (st.realEstate.some((r) => r.propertyId === propertyId)) {
    return "Immobilie befindet sich bereits in deinem Portfolio.";
  }
  if (netWorth(st) < def.minNetWorth) {
    return `Erfordert mindestens ${def.minNetWorth.toLocaleString("de-DE")} € Gesamtvermögen.`;
  }
  if (st.cash < def.price) {
    return "Guthaben auf dem Privatkonto reicht nicht aus.";
  }
  st.cash -= def.price;
  st.realEstate.push({
    propertyId,
    purchasedAt: st.gameMinutes,
    upgrades: [],
    lifetimeRent: 0,
  });
  st.reputation += Math.max(2, Math.round(def.price / 80_000));
  st.creditLimit = creditLimit(st.reputation, st.collections);
  pushLedger(st, `Immobilienkauf: ${def.name}`, -def.price, "realestate");
  return null;
}

export function tryUpgradeRealEstate(
  st: GameState,
  propertyId: string,
  upgradeId: string,
): string | null {
  const owned = st.realEstate.find((r) => r.propertyId === propertyId);
  if (!owned) return "Immobilie nicht im Besitz.";
  if (owned.upgrades.includes(upgradeId)) return "Modernisierung bereits durchgeführt.";
  const def = realEstateById(propertyId);
  const up = def.upgrades.find((u) => u.id === upgradeId);
  if (!up) return "Upgrade nicht gefunden.";
  if (st.cash < up.cost) return "Privatkonto reicht nicht für diese Modernisierung.";

  st.cash -= up.cost;
  owned.upgrades.push(upgradeId);
  pushLedger(st, `Renovierung ${def.name}: ${up.name}`, -up.cost, "realestate");
  return null;
}

export function trySellRealEstate(st: GameState, propertyId: string): string | null {
  const idx = st.realEstate.findIndex((r) => r.propertyId === propertyId);
  if (idx === -1) return "Immobilie nicht im Besitz.";
  const owned = st.realEstate[idx]!;
  const def = realEstateById(propertyId);
  const upVal = owned.upgrades.reduce((sum, uId) => {
    const up = def.upgrades.find((u) => u.id === uId);
    return sum + (up ? up.cost * 0.85 : 0);
  }, 0);
  const saleProceeds = Math.round((def.price + upVal) * 0.94);
  st.realEstate.splice(idx, 1);
  st.cash += saleProceeds;
  pushLedger(st, `Immobilienverkauf: ${def.name}`, saleProceeds, "realestate");
  return null;
}

export function tryBuyCollectionItem(st: GameState, itemId: string): string | null {
  const item = COLLECTION_ITEMS.find((x) => x.id === itemId);
  if (!item) return "Sammlerstück nicht gefunden.";
  if (st.collections.includes(itemId)) return "Bereits in deiner Sammlung.";
  if (st.cash < item.price) return "Privatkonto reicht nicht aus.";

  st.cash -= item.price;
  st.collections.push(itemId);
  st.reputation += item.reputation;

  const cat = collectionCategoryById(item.categoryId);
  const allCatItems = COLLECTION_ITEMS.filter((i) => i.categoryId === cat.id);
  const completedNow = allCatItems.every((i) => st.collections.includes(i.id));
  if (completedNow) {
    st.reputation += cat.bonusReputation;
  }
  st.creditLimit = creditLimit(st.reputation, st.collections);
  pushLedger(st, `Sammlung (${cat.name}): ${item.name}`, -item.price, "collection");
  return null;
}

export function tryTransfer(st: GameState, companyId: string, amount: number): string | null {
  const c = st.companies.find((x) => x.id === companyId);
  if (!c) return "Betrieb nicht gefunden.";
  if (amount > 0) {
    if (c.status !== "active") return "Nur aktive Betriebe nehmen Einlagen.";
    if (st.cash < amount) return "Persönliches Guthaben reicht nicht.";
    st.cash -= amount;
    c.cash += amount;
    pushLedger(st, `Einlage ${c.name}`, -amount, "company");
  } else {
    const take = Math.abs(amount);
    if (c.status !== "active") return "Keine Entnahme.";
    if (c.cash < take) return "Unternehmenskasse reicht nicht.";
    c.cash -= take;
    st.cash += take;
    pushLedger(st, `Entnahme ${c.name}`, take, "personal");
  }
  return null;
}

export function tryExtraPayment(st: GameState, loanId: string, amount: number): string | null {
  const loan = st.loans.find((l) => l.id === loanId);
  if (!loan) return "Kredit nicht gefunden.";
  const pay = Math.min(amount, loan.remaining);
  if (pay <= 0) return "Betrag ungültig.";
  if (loan.owner === "company" && loan.companyId) {
    const c = st.companies.find((x) => x.id === loan.companyId);
    if (!c || c.cash < pay) return "Unternehmenskasse reicht nicht.";
    c.cash -= pay;
    loan.remaining = Math.max(0, loan.remaining - pay);
    syncCompanyDebt(st, c);
    pushLedger(st, `Sondertilgung ${c.name}`, -pay, "loan");
  } else {
    if (st.cash < pay) return "Nicht genug Guthaben.";
    st.cash -= pay;
    loan.remaining = Math.max(0, loan.remaining - pay);
    pushLedger(st, "Sondertilgung privat", -pay, "loan");
  }
  if (loan.remaining < 0.5) {
    st.loans = st.loans.filter((l) => l.id !== loan.id);
  }
  return null;
}

export function tryBorrowLoan(
  st: GameState,
  category: "micro" | "classic" | "invest",
  amount: number,
  owner: LoanOwner,
  companyId?: string,
): string | null {
  const offer = CREDIT_OFFERS.find((o) => o.id === category);
  if (!offer) return "Unbekannter Kredit-Typ.";
  const amt = Math.round(amount);
  if (amt <= 0 || !Number.isFinite(amt)) return "Betrag muss mindestens 1 € betragen.";
  if (st.reputation < offer.minReputation) {
    return `Erfordert mindestens ${offer.minReputation} Ansehen (Ruf) für die Bonitätsprüfung.`;
  }
  if (offer.minNetWorth && netWorth(st) < offer.minNetWorth) {
    return `Erfordert mindestens ${offer.minNetWorth.toLocaleString("de-DE")} € Gesamtvermögen.`;
  }
  if (amt > offer.maxAmount) {
    return `Höchstbetrag für ${offer.name} liegt bei ${offer.maxAmount.toLocaleString("de-DE")} €.`;
  }
  const avail = (st.creditLimit ?? 15_000) - usedCompanyCredit(st);
  if (amt > avail + 0.01) {
    return `Freier Kreditrahmen nicht ausreichend (verfügbar: ${Math.max(0, Math.round(avail)).toLocaleString("de-DE")} €).`;
  }

  const clock = readClock(st);
  const day = (st.year - 1) * YEAR_LENGTH_DAYS + clock.day;
  const newLoan: Loan = {
    id: nid("ln"),
    owner,
    companyId: owner === "company" ? companyId : undefined,
    category: offer.id,
    label: offer.name,
    principal: amt,
    remaining: amt,
    annualRate: offer.annualRate,
    accruedInterest: 0,
    createdAtGameDay: day,
  };

  if (owner === "company") {
    if (!companyId) return "Kein Unternehmen ausgewählt.";
    const c = st.companies.find((x) => x.id === companyId);
    if (!c || c.status !== "active") return "Unternehmen nicht aktiv.";
    c.cash += amt;
    st.loans.push(newLoan);
    syncCompanyDebt(st, c);
    pushLedger(st, `Kreditaufnahme ${offer.name} (${c.name})`, amt, "company");
  } else {
    st.cash += amt;
    st.loans.push(newLoan);
    pushLedger(st, `Kreditaufnahme ${offer.name}`, amt, "loan");
  }
  return null;
}

export function tickMinutes(state: GameState, minutes: number, burst?: SimBurst): GameState {
  if (state.pendingYearEnd || state.insolvent) return state;
  const cap = yearCapMinutes(state);
  const maxStep = Math.max(0, cap - state.gameMinutes);
  let left = Math.min(Math.max(0, Math.floor(minutes)), maxStep);
  while (left > 0 && !state.insolvent && !state.pendingYearEnd) {
    if (state.gameMinutes >= cap) {
      if (!state.pendingYearEnd) {
        endOfDay(state, YEAR_LENGTH_DAYS, state.year, burst);
      }
      state.pendingYearEnd = true;
      state.speed = 0;
      break;
    }
    const rem = 15 - (state.gameMinutes % 15);
    const step = Math.min(left, rem, cap - state.gameMinutes);
    if (step <= 0) {
      if (!state.pendingYearEnd) {
        endOfDay(state, YEAR_LENGTH_DAYS, state.year, burst);
      }
      state.pendingYearEnd = true;
      state.speed = 0;
      break;
    }
    state.gameMinutes += step;
    left -= step;
    processDeliveries(state);
    if (state.gameMinutes % MINUTES_PER_HOUR === 0) {
      runHour(state, burst);
    }
    if (state.gameMinutes >= cap) {
      if (!state.pendingYearEnd) {
        endOfDay(state, YEAR_LENGTH_DAYS, state.year, burst);
      }
      state.pendingYearEnd = true;
      state.speed = 0;
      break;
    }
  }
  return state;
}

function processDeliveries(s: GameState): void {
  for (const company of s.companies) {
    if (company.status !== "active") continue;
    for (const p of company.products) {
      if (!p.pendingDeliveries) continue;
      const arrived = p.pendingDeliveries.filter((d) => d.arrivesAt <= s.gameMinutes);
      const remaining = p.pendingDeliveries.filter((d) => d.arrivesAt > s.gameMinutes);

      let addedQty = 0;
      for (const d of arrived) {
        addedQty += d.qty;
      }
      p.stock += addedQty;
      p.pendingDeliveries = remaining;
    }
  }
}

function tickMacroEconomy(s: GameState, day: number): void {
  void day;
  if (!s.market.macro) s.market.macro = { ...DEFAULT_MACRO };
  const m = s.market.macro;
  m.cycleDaysRemaining -= 1;

  if (m.cycleDaysRemaining <= 0) {
    const nextCycle: Record<MacroCycle, MacroCycle> = {
      normal: Math.random() > 0.5 ? "boom" : "recession",
      boom: "normal",
      recession: "normal",
    };
    m.cycle = nextCycle[m.cycle] ?? "normal";
    m.cycleDaysRemaining = 45 + Math.floor(Math.random() * 45); // 45 bis 90 Tage

    if (m.cycle === "boom") {
      m.interestRate = Math.round((0.08 + Math.random() * 0.035) * 1000) / 1000;
      m.inflationRate = Math.round((0.035 + Math.random() * 0.02) * 1000) / 1000;
      m.commodities.meat = 1.15;
      m.commodities.grain = 1.12;
      m.commodities.coffeeBeans = 1.2;
      m.commodities.hardware = 1.1;
      m.trendLabel = "Boomende Gesamtwirtschaft · Hohe Nachfrage & steigende Zinsen";
      s.market.demand = Math.min(1.4, s.market.demand + 0.12);
    } else if (m.cycle === "recession") {
      m.interestRate = Math.round((0.04 + Math.random() * 0.018) * 1000) / 1000;
      m.inflationRate = Math.round((0.012 + Math.random() * 0.008) * 1000) / 1000;
      m.commodities.meat = 0.9;
      m.commodities.grain = 0.92;
      m.commodities.coffeeBeans = 0.88;
      m.commodities.hardware = 0.95;
      m.trendLabel = "Konjunktureller Abschwung · Günstige Kredite & zäher Konsum";
      s.market.demand = Math.max(0.75, s.market.demand - 0.12);
    } else {
      m.interestRate = 0.065;
      m.inflationRate = 0.022;
      m.commodities.meat = 1.0;
      m.commodities.grain = 1.0;
      m.commodities.coffeeBeans = 1.0;
      m.commodities.hardware = 1.0;
      m.trendLabel = "Stabile Binnenkonjunktur";
    }

    // Kreditzinsen anpassen
    for (const loan of s.loans) {
      if (loan.owner === "company") {
        loan.annualRate = Math.round((m.interestRate + 0.035) * 1000) / 1000;
      }
    }
  }

  // Organische Rivalen sicherstellen
  if (!s.market.districtCompetitors) {
    s.market.districtCompetitors = [...DEFAULT_DISTRICT_COMPETITORS];
  }
}

export function tryWithdrawCompanyDividend(
  s: GameState,
  companyId: string,
  amount?: number,
): string | null {
  const company = s.companies.find((c) => c.id === companyId);
  if (!company || company.status !== "active") return "Betrieb nicht aktiv.";
  const dailyBurn =
    (company.rentPerDay || 20) +
    (company.employees?.reduce((sum, e) => sum + e.wage, 0) || 0) +
    40;
  const minBuffer = dailyBurn * 5 + 300;
  const freeCash = Math.max(0, company.cash - minBuffer);
  if (freeCash < 10) {
    return `Kein freier Gewinn über dem 5-Tage-Fixkostenpuffer (${minBuffer.toLocaleString("de-DE")} €) verfügbar.`;
  }
  const toWithdraw = amount !== undefined ? Math.min(amount, freeCash) : freeCash;
  if (toWithdraw <= 0) return "Ungültiger Betrag.";
  company.cash -= toWithdraw;
  s.cash += toWithdraw;
  s.stats.fromDividends = (s.stats?.fromDividends ?? 0) + toWithdraw;
  pushLedger(s, `Gewinnausschüttung (${company.name})`, toWithdraw, "dividend");
  return null;
}

function runHour(s: GameState, burst?: SimBurst): void {
  const beforeMarket = stockValue(s) + cryptoValue(s);
  const clock = readClock(s);

  tickStocks(s);
  tickCryptos(s);
  if (burst) burst.stockDelta += stockValue(s) + cryptoValue(s) - beforeMarket;

  for (const company of s.companies) {
    if (company.status !== "active") continue;
    tickSupplierSatisfaction(s, company);

    // Automatic manager hygiene cleaning if manager hired (ensures 24/7 hygiene >= 80%)
    if (company.manager && company.hygiene < 80 && company.cash >= CLEANING_COST) {
      company.cash -= CLEANING_COST;
      company.todayExpenses += CLEANING_COST;
      company.hygiene = Math.min(100, company.hygiene + 22);
    }

    if (isOpenHour(clock.hour)) {
      const profitBefore = company.todayRevenue - company.todayExpenses;
      operateHour(s, company, clock.hour);
      if (burst) {
        burst.companyProfit += company.todayRevenue - company.todayExpenses - profitBefore;
      }
    }
  }

  if (clock.hour === 0 && s.gameMinutes > s.yearStartMinutes + 60) {
    endOfDay(s, clock.day, clock.year, burst);
  }

  if (clock.hour % 3 === 0) recordNet(s);
}

function recordNet(s: GameState): void {
  const v = netWorth(s);
  s.netHistory.push({ t: s.gameMinutes, v });
  if (s.netHistory.length > HISTORY_CAP) s.netHistory.splice(0, s.netHistory.length - HISTORY_CAP);
  s.career.bestNetWorth = Math.max(s.career.bestNetWorth, v);
}

function tickStocks(s: GameState): void {
  const volBoost = s.gameMinutes < s.market.volUntil ? 2.1 : 1;
  for (const def of STOCKS) {
    const [n1, seed1] = rngNext(s.rngSeed);
    const [n2, seed2] = rngNext(seed1);
    s.rngSeed = seed2;
    const price = s.quotes[def.ticker] ?? def.base;
    const shock = (n1 - 0.48) * 0.013 * def.vol * volBoost;
    const revert = ((def.base - price) / def.base) * 0.003;
    const drift = 0.00004;
    let extra = 0;
    if (def.ticker === "HBF") {
      extra = clamp((s.market.demand - 1) * 0.002, -0.004, 0.004);
    }
    const next = Math.max(2.4, price * (1 + drift + shock + revert + extra + (n2 - 0.5) * 0.001));
    s.quotes[def.ticker] = Math.round(next * 100) / 100;
    const hist = s.quoteHistory[def.ticker] ?? [];
    hist.push(s.quotes[def.ticker]!);
    if (hist.length > STOCK_HISTORY_CAP) hist.splice(0, hist.length - STOCK_HISTORY_CAP);
    s.quoteHistory[def.ticker] = hist;
  }
}

function tickCryptos(s: GameState): void {
  const volBoost = s.gameMinutes < s.market.volUntil ? 1.8 : 1;
  if (!s.cryptoQuotes) s.cryptoQuotes = {};
  if (!s.cryptoHistory) s.cryptoHistory = {};
  for (const coin of CRYPTOS) {
    const [n1, seed1] = rngNext(s.rngSeed);
    const [n2, seed2] = rngNext(seed1);
    s.rngSeed = seed2;
    const price = s.cryptoQuotes[coin.symbol] ?? coin.base;
    const shock = (n1 - 0.482) * 0.016 * coin.vol * volBoost;
    const revert = ((coin.base - price) / coin.base) * 0.0035;
    const drift = 0.00006;
    const next = Math.max(0.25, price * (1 + drift + shock + revert + (n2 - 0.5) * 0.002));
    s.cryptoQuotes[coin.symbol] = Math.round(next * 100) / 100;
    const hist = s.cryptoHistory[coin.symbol] ?? [];
    hist.push(s.cryptoQuotes[coin.symbol]!);
    if (hist.length > STOCK_HISTORY_CAP) hist.splice(0, hist.length - STOCK_HISTORY_CAP);
    s.cryptoHistory[coin.symbol] = hist;
  }
}

export type DemandDirection = "up" | "down" | "flat";
export type DemandTone = "gain" | "warn" | "loss" | "muted";
export type DemandStatusLabel = "Boom" | "Hoch" | "Normal" | "Schwach" | "Flaute";

export interface DemandSnapshot {
  mult: number;
  pct: number;
  prevPct: number;
  deltaPct: number;
  direction: DemandDirection;
  arrow: "↑" | "↓" | "→";
  label: DemandStatusLabel;
  tone: DemandTone;
  formatted: string;
}

export interface ProductDemandInfo extends DemandSnapshot {
  productId: string;
  rawProdMult: number;
}

export interface IndustryDemandInfo extends DemandSnapshot {
  industry: Industry;
  competition: number;
  competitionPct: number;
  competitionLabel: "Niedrig" | "Moderat" | "Hoch";
  competitionTone: "gain" | "muted" | "warn";
  products: ProductDemandInfo[];
  topProduct: ProductDemandInfo;
  weakestProduct: ProductDemandInfo;
}

export function getIndustryCompetition(s: GameState, industry: Industry): number {
  const byInd = s.market.competitionByIndustry?.[industry];
  if (typeof byInd === "number") return byInd;
  const base = s.market.competition ?? 0.7;
  const factor = industry === "imbiss" ? 1.16 : industry === "cafe" ? 0.96 : 0.82;
  return Math.round(clamp(base * factor, 0.4, 1.7) * 100) / 100;
}

export function classifyCompetition(comp: number): {
  competition: number;
  competitionPct: number;
  competitionLabel: "Niedrig" | "Moderat" | "Hoch";
  competitionTone: "gain" | "muted" | "warn";
} {
  const competitionPct = Math.round(comp * 100);
  const competitionLabel: "Niedrig" | "Moderat" | "Hoch" =
    competitionPct >= 95 ? "Hoch" : competitionPct <= 65 ? "Niedrig" : "Moderat";
  const competitionTone: "gain" | "muted" | "warn" =
    competitionPct >= 95 ? "warn" : competitionPct <= 65 ? "gain" : "muted";
  return {
    competition: comp,
    competitionPct,
    competitionLabel,
    competitionTone,
  };
}

export interface CompanyDemandInfo extends DemandSnapshot {
  hasActiveProducts: boolean;
  activeCount: number;
}

export function classifyDemand(mult: number, prevMult?: number): DemandSnapshot {
  const pct = Math.round(mult * 100);
  const prevPct = typeof prevMult === "number" ? Math.round(prevMult * 100) : pct;
  const deltaPct = pct - prevPct;

  let label: DemandStatusLabel = "Normal";
  let tone: DemandTone = "muted";
  if (pct >= 120) {
    label = "Boom";
    tone = "gain";
  } else if (pct >= 106) {
    label = "Hoch";
    tone = "gain";
  } else if (pct >= 95) {
    label = "Normal";
    tone = "muted";
  } else if (pct >= 82) {
    label = "Schwach";
    tone = "warn";
  } else {
    label = "Flaute";
    tone = "loss";
  }

  let direction: DemandDirection = "flat";
  if (deltaPct >= 2) {
    direction = "up";
  } else if (deltaPct <= -2) {
    direction = "down";
  } else if (pct >= 106) {
    direction = "up";
  } else if (pct <= 94) {
    direction = "down";
  }

  const arrow = direction === "up" ? "↑" : direction === "down" ? "↓" : "→";
  const formatted = `${pct} % ${arrow} ${label}`;

  return {
    mult,
    pct,
    prevPct,
    deltaPct,
    direction,
    arrow,
    label,
    tone,
    formatted,
  };
}

export function getGlobalMarketDemandInfo(s: GameState): DemandSnapshot {
  const cur = s.market.demand ?? 1;
  const prev = s.market.prevDemand ?? cur;
  return classifyDemand(cur, prev);
}

export function getProductDemandInfo(s: GameState, productId: string): ProductDemandInfo {
  const globalMult = s.market.demand ?? 1;
  const prevGlobalMult = s.market.prevDemand ?? globalMult;
  const rawProdMult = s.market.demandByProduct[productId] ?? 1;
  const prevProdMult = s.market.prevDemandByProduct?.[productId] ?? rawProdMult;

  const effMult = globalMult * rawProdMult;
  const prevEffMult = prevGlobalMult * prevProdMult;
  const snap = classifyDemand(effMult, prevEffMult);

  return {
    ...snap,
    productId,
    rawProdMult,
  };
}

export function getIndustryDemandInfo(s: GameState, industry: Industry): IndustryDemandInfo {
  const prods = productsForIndustry(industry);
  const prodInfos = prods
    .map((p) => getProductDemandInfo(s, p.id))
    .sort((a, b) => b.pct - a.pct);

  const avgMult =
    prodInfos.length > 0
      ? prodInfos.reduce((sum, p) => sum + p.mult, 0) / prodInfos.length
      : (s.market.demand ?? 1);
  const avgPrevMult =
    prodInfos.length > 0
      ? prodInfos.reduce((sum, p) => sum + p.prevPct / 100, 0) / prodInfos.length
      : avgMult;

  const snap = classifyDemand(avgMult, avgPrevMult);
  const compInfo = classifyCompetition(getIndustryCompetition(s, industry));
  const fallbackProd = prodInfos[0] ?? getProductDemandInfo(s, "hotdog");
  const weakestProd = prodInfos[prodInfos.length - 1] ?? fallbackProd;

  return {
    ...snap,
    ...compInfo,
    industry,
    products: prodInfos,
    topProduct: fallbackProd,
    weakestProduct: weakestProd,
  };
}

export function getAllIndustryDemands(s: GameState): IndustryDemandInfo[] {
  return INDUSTRIES.map((ind) => getIndustryDemandInfo(s, ind.id)).sort(
    (a, b) => b.pct - a.pct,
  );
}

export function getCompanyDemandInfo(s: GameState, company: Company): CompanyDemandInfo {
  const enabled = company.products.filter((p) => p.enabled);
  if (enabled.length === 0) {
    const indSnap = getIndustryDemandInfo(s, company.industry ?? "imbiss");
    return {
      ...indSnap,
      hasActiveProducts: false,
      activeCount: 0,
    };
  }
  const infos = enabled.map((p) => getProductDemandInfo(s, p.productId));
  const avgMult = infos.reduce((sum, x) => sum + x.mult, 0) / infos.length;
  const avgPrev = infos.reduce((sum, x) => sum + x.prevPct / 100, 0) / infos.length;
  const snap = classifyDemand(avgMult, avgPrev);
  return {
    ...snap,
    hasActiveProducts: true,
    activeCount: enabled.length,
  };
}

export interface ProductSalesEstimate {
  hourlySales: number;
  dailySales: number;
  unitMargin: number;
  marginPct: number;
  hourlyProfit: number;
  cogsUnit: number;
}

export function estimateProductHourlySales(
  company: Company,
  offering: ProductOffering,
  s: GameState,
  customSupplierId?: string,
  customPrice?: number,
  customOffer?: SupplierOffer,
): ProductSalesEstimate {
  const def = productById(offering.productId);
  const price = customPrice ?? offering.price;
  const prodDemand = s.market.demandByProduct[offering.productId] ?? 1;

  const ratio = price / def.fairPrice;
  let priceMult = 1;
  if (ratio > 1) {
    priceMult = Math.max(0.05, 1 - 1.333 * (ratio - 1));
  } else {
    priceMult = Math.min(1.4, 1 + 0.8 * (1 - ratio));
  }

  const basePerHour = def.ownerCap / 14;
  const hygieneMult = 0.85 + 0.15 * (company.hygiene / 100);
  const qualMult = customOffer
    ? customOffer.quality
    : offering.contractedSupplier
      ? offering.contractedSupplier.quality
      : supplierById(customSupplierId ?? offering.supplierId ?? "mittel").quality;
  const loc = locationById(company.locationId ?? "kiez");
  const locMult = loc.freqMult;
  const locSynergy = loc.synergyIndustry === company.industry ? (loc.synergyBonus ?? 1) : 1;
  const mktLvl = company.upgrades?.marketing ?? 0;
  const mktMult = 1 + mktLvl * 0.12;
  const eqLvl = company.upgrades?.equipment ?? 0;
  const eqCapMult = 1 + eqLvl * 0.15;
  const activeStaff = (company.employees ?? []).filter(
    (e) => !e.sickUntil || e.sickUntil <= s.gameMinutes,
  );
  const staffMult = 1 + activeStaff.reduce((sum, e) => sum + e.productivity * 0.35, 0);
  const scaleMult = companyScaleById(company.scale).volumeMult;
  const synergyMult = company.synergyMult ?? 1;

  const indCompetition = getIndustryCompetition(s, company.industry ?? "imbiss");
  const rawHourly =
    basePerHour *
    s.market.demand *
    prodDemand *
    (1 / (1 + indCompetition * 0.22)) *
    hygieneMult *
    qualMult *
    priceMult *
    def.demandWeight *
    locMult *
    locSynergy *
    mktMult *
    staffMult *
    eqCapMult *
    scaleMult *
    synergyMult;

  const hourlySales = Math.max(0, Math.round(rawHourly * 10) / 10);
  const dailySales = Math.max(0, Math.round(hourlySales * 14));
  const cogsUnit =
    customOffer || offering.contractedSupplier
      ? offeringUnitCost(company, offering, customOffer)
      : companyUnitCost(
          company,
          offering.productId,
          customSupplierId ?? offering.supplierId,
          offering.orderedLifetime,
        );
  const unitMargin = price - cogsUnit;
  const marginPct = price > 0 ? (unitMargin / price) * 100 : 0;
  const hourlyProfit = hourlySales * unitMargin;

  return {
    hourlySales,
    dailySales,
    unitMargin,
    marginPct,
    hourlyProfit,
    cogsUnit,
  };
}

export function getCompanyTrafficBreakdown(
  company: Company,
  s: GameState,
): CustomerTrafficBreakdown {
  const loc = locationById(company.locationId ?? "kiez");
  const baseLocationFreq = loc.freqMult;
  const hasSynergy = loc.synergyIndustry === company.industry;
  const synergyBonusPct = hasSynergy ? Math.round(((loc.synergyBonus ?? 1) - 1) * 100) : 0;
  const synergyLabel = hasSynergy ? loc.synergyLabel : undefined;
  const scaleDef = companyScaleById(company.scale);
  const scaleMult = scaleDef.volumeMult;
  const hygieneFactorPct = Math.round((0.85 + 0.15 * (company.hygiene / 100)) * 100);

  const enabled = company.products.filter((p) => p.enabled);
  let avgPriceAttract = 100;
  if (enabled.length > 0) {
    let sum = 0;
    for (const p of enabled) {
      const def = productById(p.productId);
      const ratio = p.price / def.fairPrice;
      const mult =
        ratio > 1
          ? Math.max(0.1, 1 - 1.333 * (ratio - 1))
          : Math.min(1.4, 1 + 0.8 * (1 - ratio));
      sum += mult;
    }
    avgPriceAttract = Math.round((sum / enabled.length) * 100);
  }

  // Capacity Max
  const capacityMax = Math.round(35 * Math.max(1, company.level) * scaleMult);

  // Sum estimated hourly customers across enabled products
  let hourlyTraffic = 0;
  for (const p of enabled) {
    const est = estimateProductHourlySales(company, p, s);
    hourlyTraffic += est.hourlySales;
  }
  hourlyTraffic = Math.round(hourlyTraffic * 10) / 10;

  const occupancyPct = Math.min(100, Math.round((hourlyTraffic / capacityMax) * 100));
  let occupancyLabel = "Sortiment einrichten";
  if (enabled.length > 0) {
    if (occupancyPct >= 85) occupancyLabel = "Voll ausgelastet (Spitzenandrang)";
    else if (occupancyPct >= 55) occupancyLabel = "Gut besucht (Starke Frequenz)";
    else if (occupancyPct >= 25) occupancyLabel = "Solide Nachfrage";
    else occupancyLabel = "Ruhiger Betrieb (Geringer Andrang)";
  }

  return {
    hourlyTraffic,
    baseLocationFreq,
    synergyBonusPct,
    synergyLabel,
    priceAttractivenessPct: avgPriceAttract,
    scaleMult,
    hygieneFactorPct,
    occupancyPct,
    occupancyLabel,
    capacityMax,
  };
}

export const SUPPLIER_SEARCH_COOLDOWN_MINUTES = MINUTES_PER_DAY;

export function supplierSearchCooldownRemaining(
  s: GameState,
  offering: ProductOffering,
): number {
  const nextAt = offering.nextSupplierSearchAt ?? 0;
  return Math.max(0, nextAt - s.gameMinutes);
}

export function canSearchSuppliers(s: GameState, offering: ProductOffering): boolean {
  return supplierSearchCooldownRemaining(s, offering) <= 0;
}

export function orderCooldownRemaining(s: GameState, offering: ProductOffering): number {
  const nextAt = offering.nextOrderAvailableAt ?? 0;
  return Math.max(0, nextAt - s.gameMinutes);
}

export function canOrderStockNow(s: GameState, offering: ProductOffering): boolean {
  return orderCooldownRemaining(s, offering) <= 0;
}

export function calculateOrderLeadTime(supplier: SupplierOffer, qty: number): number {
  const base = supplier.leadTimeMinutes || 90;
  const extraRaw = Math.max(0, (qty - 10) * 1.15);
  const extra = Math.ceil(extraRaw / 15) * 15;
  return base + extra;
}

export interface AutoOrderThreshold {
  hourlySales: number;
  leadHours: number;
  leadTimeDemand: number;
  safetyStock: number;
  reorderPoint: number;
  targetBatchSize: number;
}

/**
 * Berechnet den dynamischen Meldebestand (Reorder Point) und die Zielcharge.
 * Meldebestand = Vorlaufbedarf (Lead Time Demand) + Sicherheitsbestand (Safety Stock).
 * Gewährleistet, dass auch bei langen Lieferzeiten oder unzuverlässigen Lieferanten das Lager nie leerläuft.
 */
export function calculateAutoOrderThreshold(
  company: Company,
  offering: ProductOffering,
  s: GameState,
  supplierOverride?: SupplierOffer | null,
): AutoOrderThreshold {
  const sup = supplierOverride ?? offering.contractedSupplier;
  if (!sup) {
    return {
      hourlySales: 0,
      leadHours: 2,
      leadTimeDemand: 0,
      safetyStock: 15,
      reorderPoint: 15,
      targetBatchSize: 40,
    };
  }

  const est = estimateProductHourlySales(
    company,
    offering,
    s,
    undefined,
    undefined,
    sup,
  );
  // Mindestens 0.5 Stk./Std. annehmen, damit auch bei Neuanlauf oder Dämpfung rechtzeitig bestellt wird
  const hourlySales = Math.max(0.5, est.hourlySales);

  const minQ = sup.minOrderQty ?? 15;
  const maxQ = sup.maxOrderQty ?? 80;

  // Lieferzeit für typische Mindestcharge in Stunden
  const leadMinutes = calculateOrderLeadTime(sup, Math.max(20, minQ));
  const leadHours = Math.max(1, Math.round((leadMinutes / 60) * 10) / 10);
  const leadTimeDemand = Math.ceil(hourlySales * leadHours);

  // Sicherheitsbestand: Puffer für Verzugsrisiken (Lieferanten-Zuverlässigkeit) + unerwartete Nachfragespitzen
  const reliability = typeof sup.reliability === "number" ? sup.reliability : 0.9;
  const bufferHours = 2.5 + (1 - reliability) * 3;
  const safetyStock = Math.max(12, Math.ceil(hourlySales * bufferHours));

  // Meldebestand (Bestellgrenze)
  const reorderPoint = leadTimeDemand + safetyStock;

  // Optimale Bestellcharge für ca. 20 Betriebsstunden
  const targetBatchSize = clamp(Math.ceil(hourlySales * 20), minQ, maxQ);

  return {
    hourlySales: Math.round(hourlySales * 10) / 10,
    leadHours,
    leadTimeDemand,
    safetyStock,
    reorderPoint,
    targetBatchSize,
  };
}

export const SUPPLIER_MOOD_GROWTH_HOURS = 12;

export function calculateOrderMoodGain(supplier: SupplierOffer, qty: number): number {
  const minQ = supplier.minOrderQty || 10;
  const baseMaxQ = Math.max(minQ + 10, supplier.baseMaxOrderQty || supplier.maxOrderQty || 60);
  const gainMult = supplier.moodGainMult ?? 1;
  const ratio = clamp((qty - minQ) / Math.max(1, baseMaxQ - minQ), 0, 1.6);
  const rawGain = (14 + ratio * 20) * gainMult;
  return Math.max(4, Math.round(rawGain));
}

function tickSupplierSatisfaction(s: GameState, company: Company): void {
  for (const offering of company.products) {
    if (!offering.enabled || !offering.contractedSupplier) continue;
    const sup = offering.contractedSupplier;
    const decayPerHour = (sup.moodDecayPerDay ?? 16) / 24;
    const currentSat = typeof sup.satisfaction === "number" ? sup.satisfaction : 85;
    const nextSat = Math.max(0, Math.round((currentSat - decayPerHour) * 10) / 10);
    sup.satisfaction = nextSat;

    const baseMax = sup.baseMaxOrderQty ?? sup.maxOrderQty ?? 60;
    const maxCap = sup.maxOrderCap ?? Math.round((baseMax * 3.1) / 10) * 10;
    const step = sup.growthStep ?? 20;
    sup.baseMaxOrderQty = baseMax;
    sup.maxOrderCap = maxCap;
    sup.growthStep = step;

    if (nextSat > 75 && sup.maxOrderQty < maxCap) {
      const nextHours = (sup.highMoodHours ?? 0) + 1;
      if (nextHours >= SUPPLIER_MOOD_GROWTH_HOURS) {
        sup.highMoodHours = nextHours - SUPPLIER_MOOD_GROWTH_HOURS;
        sup.maxOrderQty = Math.min(maxCap, sup.maxOrderQty + step);
      } else {
        sup.highMoodHours = nextHours;
      }
    } else if (nextSat >= 75 && sup.maxOrderQty >= maxCap) {
      sup.highMoodHours = 0;
    } else if (nextSat < 25 && sup.maxOrderQty > baseMax) {
      // Nur bei dauerhaft sehr schlechter Laune (< 25 %) schrumpft der Ausbau-Bonus langsam zurück
      const prevHours = sup.highMoodHours ?? 0;
      if (prevHours > 0) {
        sup.highMoodHours = Math.max(0, prevHours - 2);
      } else {
        sup.maxOrderQty = Math.max(baseMax, sup.maxOrderQty - Math.max(5, Math.round(step / 3)));
      }
    }

    if (nextSat <= 0) {
      const supName = sup.name;
      const def = productById(offering.productId);
      const buybackCost = calculateSupplierBuybackPrice(sup, company.industry ?? "imbiss");
      offering.previousSupplier = {
        ...sup,
        satisfaction: 40,
        highMoodHours: 0,
      };
      offering.supplierBuybackPrice = buybackCost;
      offering.contractedSupplier = null;
      offering.candidateSuppliers = generateSupplierCandidates(
        s,
        company.industry ?? "imbiss",
        offering.productId,
      );
      offering.nextSupplierSearchAt = 0;
      const ev = {
        id: nid("ev"),
        kind: "warning" as const,
        title: "Lieferant abgesprungen",
        body: `${company.name}: ${supName} hat den Liefervertrag für ${def.name} gekündigt, weil zu wenig bestellt wurde. Du kannst ihn gegen eine Vertragsprämie (${buybackCost.toLocaleString("de-DE")} €) direkt zurückkaufen oder einen neuen Lieferanten wählen.`,
        companyId: company.id,
        productId: offering.productId,
        createdAt: s.gameMinutes,
        options: [
          {
            id: "buyback-supplier",
            label: `${supName} zurückkaufen · ${buybackCost.toLocaleString("de-DE")} €`,
            hint: `Reaktiviert ${supName}. Der Lieferant startet im Status 'Gekränkt' mit 40 % Zufriedenheit und vorerst 60 % Liefermenge.`,
          },
          {
            id: "open-supplier",
            label: `Jetzt neuen Lieferanten für ${def.name} wählen`,
            hint: "Öffnet direkt den Betrieb im Reiter Produkte — 3 neue Angebote liegen bereit.",
          },
          {
            id: "ack",
            label: "Später darum kümmern",
            hint: "Meldung bleibt gespeichert — Rückkauf ist auch später im Produkt-Slot möglich.",
          },
        ],
      };
      s.inbox.unshift(ev);
      if (s.inbox.length > 12) s.inbox.length = 12;
      if (!s.pendingEvent) {
        s.pendingEvent = ev;
      }
    }
  }
}

export function calculateSupplierBuybackPrice(sup: SupplierOffer, industry: Industry): number {
  const baseTarget = industry === "shop" ? 2600 : industry === "cafe" ? 1050 : 450;
  const baseMax = sup.baseMaxOrderQty ?? sup.maxOrderQty ?? 60;
  const bonusCap = Math.max(0, (sup.maxOrderQty ?? baseMax) - baseMax);
  const raw = baseTarget + bonusCap * 2.5;
  return Math.max(150, Math.round(raw / 10) * 10);
}

export function generateSupplierCandidates(
  s: GameState,
  industry: Industry,
  productId: string,
): SupplierOffer[] {
  void productId;
  const namesPool = SUPPLIER_NAMES_BY_INDUSTRY[industry] ?? SUPPLIER_NAMES_BY_INDUSTRY.imbiss;
  const usedNames = new Set<string>();
  const feeBase = industry === "shop" ? 520 : industry === "cafe" ? 230 : 100;

  // 3 Archetypen mit großzügigem Kapazitäts-Ausbau bei > 75 % Laune (~3x Start-Maximalmenge):
  // 1) Günstig & Einsteigerfreundlich: Start 35–55 Stk., ausbaubar bis ~110–180 Stk. (+15 Stk./Stufe)
  // 2) Mittelklasse / Ausgewogen: Start 80–115 Stk., ausbaubar bis ~250–360 Stk. (+25 Stk./Stufe)
  // 3) Großhändler / Premium: Start 140–220 Stk., ausbaubar bis ~420–660 Stk. (+40 Stk./Stufe)
  const profiles = [
    {
      priceRange: [0.76, 0.91] as const,
      qualRange: [0.40, 0.62] as const,
      relRange: [0.58, 0.80] as const,
      leadOptions: [90, 105, 120] as const,
      minQtyOptions: [10, 15] as const,
      maxQtyOptions: [35, 45, 55] as const,
      capMult: 3.2,
      growthStep: 15,
      moodGainMult: 1.45,
      moodDecayPerDay: 12,
    },
    {
      priceRange: [0.89, 1.06] as const,
      qualRange: [0.63, 0.82] as const,
      relRange: [0.76, 0.93] as const,
      leadOptions: [75, 90, 105] as const,
      minQtyOptions: [25, 30, 35] as const,
      maxQtyOptions: [80, 95, 115] as const,
      capMult: 3.1,
      growthStep: 25,
      moodGainMult: 1.0,
      moodDecayPerDay: 16,
    },
    {
      priceRange: [0.72, 1.18] as const,
      qualRange: [0.80, 0.96] as const,
      relRange: [0.84, 0.98] as const,
      leadOptions: [60, 75, 90] as const,
      minQtyOptions: [45, 55, 65] as const,
      maxQtyOptions: [140, 175, 220] as const,
      capMult: 3.0,
      growthStep: 40,
      moodGainMult: 0.68,
      moodDecayPerDay: 22,
    },
  ];

  const offers: SupplierOffer[] = [];
  for (let i = 0; i < 3; i++) {
    const prof = profiles[i]!;
    const [r1, s1] = rngNext(s.rngSeed);
    const [r2, s2] = rngNext(s1);
    const [r3, s3] = rngNext(s2);
    const [r4, s4] = rngNext(s3);
    const [r5, s5] = rngNext(s4);
    const [r6, s6] = rngNext(s5);
    const [r7, s7] = rngNext(s6);
    s.rngSeed = s7;

    let name = namesPool[Math.floor(r1 * namesPool.length)] ?? `Großhandel #${i + 1}`;
    if (usedNames.has(name)) {
      const alt = namesPool.find((n) => !usedNames.has(n));
      if (alt) name = alt;
    }
    usedNames.add(name);

    const priceMult =
      Math.round((prof.priceRange[0] + r2 * (prof.priceRange[1] - prof.priceRange[0])) * 100) / 100;
    const quality =
      Math.round((prof.qualRange[0] + r3 * (prof.qualRange[1] - prof.qualRange[0])) * 100) / 100;
    const reliability =
      Math.round((prof.relRange[0] + r4 * (prof.relRange[1] - prof.relRange[0])) * 100) / 100;
    const leadTimeMinutes =
      prof.leadOptions[Math.floor(r5 * prof.leadOptions.length)] ?? 90;
    const minOrderQty =
      prof.minQtyOptions[Math.floor(r6 * prof.minQtyOptions.length)] ?? 15;
    const maxOrderQty =
      prof.maxQtyOptions[Math.floor(r7 * prof.maxQtyOptions.length)] ?? 60;
    const baseMaxOrderQty = maxOrderQty;
    const maxOrderCap = Math.round((baseMaxOrderQty * prof.capMult) / 10) * 10;

    const valueScore = (quality * 0.55 + reliability * 0.45) / Math.max(0.7, priceMult);
    const hiringFee = Math.max(50, Math.round((feeBase * (0.65 + valueScore * 0.7)) / 10) * 10);

    const capTag =
      maxOrderQty <= 55
        ? `Kleine Kapazität (${minOrderQty}–${maxOrderQty} Stk., Ausbau bis ${maxOrderCap} Stk.)`
        : maxOrderQty >= 135
          ? `Großvolumen (${minOrderQty}–${maxOrderQty} Stk., Ausbau bis ${maxOrderCap} Stk.)`
          : `Mittlere Kapazität (${minOrderQty}–${maxOrderQty} Stk., Ausbau bis ${maxOrderCap} Stk.)`;
    const qualTag =
      quality >= 0.8
        ? "Spitzenqualität"
        : quality <= 0.55
          ? "Einfache Ware"
          : "Solide Qualität";

    offers.push({
      id: nid("sup"),
      name,
      blurb: `${capTag} · ${qualTag}.`,
      priceMult,
      quality,
      reliability,
      leadTimeMinutes,
      hiringFee,
      minOrderQty,
      maxOrderQty,
      baseMaxOrderQty,
      maxOrderCap,
      growthStep: prof.growthStep,
      highMoodHours: 0,
      satisfaction: 85,
      moodGainMult: prof.moodGainMult,
      moodDecayPerDay: prof.moodDecayPerDay,
    });
  }

  // Shuffle candidate order deterministically so archetypes don't always appear in the same slot
  for (let i = offers.length - 1; i > 0; i--) {
    const [rn, nextSeed] = rngNext(s.rngSeed);
    s.rngSeed = nextSeed;
    const j = Math.floor(rn * (i + 1));
    const tmp = offers[i]!;
    offers[i] = offers[j]!;
    offers[j] = tmp;
  }

  return offers;
}

export function trySearchSuppliers(
  st: GameState,
  companyId: string,
  productId: string,
): string | null {
  const c = st.companies.find((x) => x.id === companyId);
  if (!c || c.status !== "active") return "Betrieb nicht aktiv.";
  const p = c.products.find((x) => x.productId === productId);
  if (!p) return "Produkt nicht im Sortiment.";

  const remaining = supplierSearchCooldownRemaining(st, p);
  if (remaining > 0) {
    const leftHours = Math.ceil(remaining / 60);
    return `Neue Lieferantensuche für dieses Produkt erst in ca. ${leftHours} Spielstunden möglich.`;
  }

  p.candidateSuppliers = generateSupplierCandidates(st, c.industry ?? "imbiss", productId);
  p.nextSupplierSearchAt = st.gameMinutes + SUPPLIER_SEARCH_COOLDOWN_MINUTES;
  return null;
}

export function tryHireSupplier(
  st: GameState,
  companyId: string,
  productId: string,
  offerId: string,
): string | null {
  const c = st.companies.find((x) => x.id === companyId);
  if (!c || c.status !== "active") return "Betrieb nicht aktiv.";
  const p = c.products.find((x) => x.productId === productId);
  if (!p) return "Produkt nicht im Sortiment.";

  const offer = (p.candidateSuppliers ?? []).find((o) => o.id === offerId);
  if (!offer) return "Angebot nicht mehr verfügbar.";
  if (c.cash < offer.hiringFee) {
    return `Unternehmenskasse reicht nicht für die Vertragsgebühr (${offer.hiringFee.toLocaleString("de-DE")} €).`;
  }

  c.cash -= offer.hiringFee;
  c.todayExpenses += offer.hiringFee;
  p.contractedSupplier = {
    ...offer,
    baseMaxOrderQty: offer.baseMaxOrderQty ?? offer.maxOrderQty,
    maxOrderCap:
      offer.maxOrderCap ?? Math.round(((offer.baseMaxOrderQty ?? offer.maxOrderQty) * 3.1) / 10) * 10,
    growthStep: offer.growthStep ?? 20,
    highMoodHours: 0,
    satisfaction: 85,
  };
  p.previousSupplier = null;
  p.supplierBuybackPrice = undefined;
  p.candidateSuppliers = [];
  st.inbox = st.inbox.filter(
    (e) =>
      !(
        e.title === "Lieferant abgesprungen" &&
        e.companyId === companyId &&
        e.productId === productId
      ),
  );
  return null;
}

export function tryBuybackSupplier(
  st: GameState,
  companyId: string,
  productId: string,
): string | null {
  const c = st.companies.find((x) => x.id === companyId);
  if (!c || c.status !== "active") return "Betrieb nicht aktiv.";
  const p = c.products.find((x) => x.productId === productId);
  if (!p) return "Produkt nicht im Sortiment.";
  const prev = p.previousSupplier;
  if (!prev) return "Kein vorheriger Lieferant zum Zurückkaufen verfügbar.";

  const fee =
    p.supplierBuybackPrice ?? calculateSupplierBuybackPrice(prev, c.industry ?? "imbiss");

  if (c.cash >= fee) {
    c.cash -= fee;
    c.todayExpenses += fee;
  } else {
    const companyPart = Math.max(0, c.cash);
    const neededFromPrivate = fee - companyPart;
    if (st.cash < neededFromPrivate) {
      return `Nicht genug Guthaben in Firmenkasse oder Privatkonto (${fee.toLocaleString("de-DE")} € benötigt).`;
    }
    if (companyPart > 0) {
      c.cash -= companyPart;
    }
    st.cash -= neededFromPrivate;
    c.todayExpenses += fee;
    pushLedger(
      st,
      `Lieferanten-Rückkauf ${prev.name} (${c.name})`,
      -neededFromPrivate,
      "company",
    );
  }

  const baseMax = prev.baseMaxOrderQty ?? prev.maxOrderQty ?? 60;
  p.contractedSupplier = {
    ...prev,
    baseMaxOrderQty: baseMax,
    maxOrderQty: Math.max(prev.minOrderQty ?? 15, Math.round(baseMax * 0.6)),
    maxOrderCap: prev.maxOrderCap ?? Math.round((baseMax * 3.1) / 10) * 10,
    growthStep: prev.growthStep ?? 20,
    highMoodHours: 0,
    satisfaction: 40,
  };
  p.previousSupplier = null;
  p.supplierBuybackPrice = undefined;
  p.candidateSuppliers = [];
  st.inbox = st.inbox.filter(
    (e) =>
      !(
        e.title === "Lieferant abgesprungen" &&
        e.companyId === companyId &&
        e.productId === productId
      ),
  );
  return null;
}

export interface OrderOutcome {
  err: string | null;
  orderedQty: number;
  actualQty: number;
  delayed: boolean;
  etaMinutes: number;
  totalCost: number;
  moodGain?: number;
  clampedFrom?: number;
}

export function placeProductOrder(
  s: GameState,
  company: Company,
  offering: ProductOffering,
  rawQty: number,
): OrderOutcome {
  let qty = Math.round(rawQty);
  if (!Number.isFinite(qty) || qty <= 0) {
    return {
      err: "Menge ungültig.",
      orderedQty: 0,
      actualQty: 0,
      delayed: false,
      etaMinutes: 0,
      totalCost: 0,
    };
  }
  const sup = offering.contractedSupplier;
  if (!sup) {
    return {
      err: "Kein Zulieferer unter Vertrag. Bitte zuerst einen Zulieferer suchen und anwerben.",
      orderedQty: qty,
      actualQty: 0,
      delayed: false,
      etaMinutes: 0,
      totalCost: 0,
    };
  }

  const cooldownLeft = orderCooldownRemaining(s, offering);
  if (cooldownLeft > 0) {
    const mins = Math.ceil(cooldownLeft / 15) * 15;
    return {
      err: `Bestell-Cooldown aktiv: Nächste Bestellung erst in ca. ${mins} Min. möglich.`,
      orderedQty: qty,
      actualQty: 0,
      delayed: false,
      etaMinutes: 0,
      totalCost: 0,
    };
  }

  const minQty = sup.minOrderQty ?? 10;
  const maxQty = sup.maxOrderQty ?? 100;
  if (qty < minQty) {
    return {
      err: `Mindestbestellmenge bei ${sup.name} beträgt ${minQty} Stk.`,
      orderedQty: qty,
      actualQty: 0,
      delayed: false,
      etaMinutes: 0,
      totalCost: 0,
    };
  }
  let clampedFrom: number | undefined;
  if (qty > maxQty) {
    clampedFrom = qty;
    qty = maxQty;
  }

  const cost = qty * offeringUnitCost(company, offering);
  if (company.cash < cost) {
    return {
      err: "Unternehmenskasse reicht nicht.",
      orderedQty: qty,
      actualQty: 0,
      delayed: false,
      etaMinutes: 0,
      totalCost: cost,
    };
  }

  company.cash -= cost;
  company.todayExpenses += cost;
  offering.orderedLifetime += qty;

  const [r1, seed1] = rngNext(s.rngSeed);
  const [r2, seed2] = rngNext(seed1);
  const [r3, seed3] = rngNext(seed2);
  s.rngSeed = seed3;

  let etaMinutes = calculateOrderLeadTime(sup, qty);
  let actualQty = qty;
  let delayed = false;

  if (r1 > sup.reliability) {
    delayed = true;
    const extraMinutes = (1 + Math.floor(r2 * 3)) * 45; // +45 bis +135 Min. Verspätung
    etaMinutes += extraMinutes;
    if (r3 < 0.65) {
      const keepRatio = 0.82 + r2 * 0.13;
      actualQty = Math.max(1, Math.round(qty * keepRatio));
    }
  }

  const moodGain = calculateOrderMoodGain(sup, qty);
  sup.satisfaction = Math.min(100, Math.round((sup.satisfaction ?? 85) + moodGain));

  // Cooldown gegen Bestell-Spamming (gekoppelt an die reguläre Lieferdauer, mind. 60 Min.)
  const cooldownDuration = Math.max(60, calculateOrderLeadTime(sup, qty));
  offering.nextOrderAvailableAt = s.gameMinutes + cooldownDuration;

  if (!offering.pendingDeliveries) offering.pendingDeliveries = [];
  offering.pendingDeliveries.push({
    qty: actualQty,
    orderedQty: qty,
    arrivesAt: s.gameMinutes + etaMinutes,
    delayed,
  });

  return {
    err: null,
    orderedQty: qty,
    actualQty,
    delayed,
    etaMinutes,
    totalCost: cost,
    moodGain,
    clampedFrom,
  };
}

function runAutoOrder(s: GameState, company: Company): void {
  for (const offering of company.products) {
    if (!offering.enabled || !offering.autoOrder || !offering.contractedSupplier) continue;
    if (!canOrderStockNow(s, offering)) continue;
    const sup = offering.contractedSupplier;
    const inTransit = (offering.pendingDeliveries ?? []).reduce((acc, d) => acc + d.qty, 0);
    const threshold = calculateAutoOrderThreshold(company, offering, s, sup);

    // Frühzeitige Nachbestellung, wenn Bestand + Zulauf den dynamischen Meldebestand erreicht oder unterschreitet
    if (offering.stock + inTransit <= threshold.reorderPoint) {
      let targetQty = threshold.targetBatchSize;
      const unitCost = offeringUnitCost(company, offering);
      const minQty = sup.minOrderQty ?? 15;

      // Cash-aware sizing: Wenn Kasse nicht für die volle Charge reicht, passe auf bezahlbare Menge an
      if (unitCost > 0 && company.cash < targetQty * unitCost) {
        const affordableQty = Math.floor(company.cash / unitCost);
        if (affordableQty >= minQty) {
          targetQty = affordableQty;
        } else {
          // Kasse reicht im Moment nicht einmal für die Mindestmenge
          continue;
        }
      }

      placeProductOrder(s, company, offering, targetQty);
    }
  }
}

function operateHour(s: GameState, company: Company, hour: number): void {
  // Vollständiger Streikstillstand (48h keine Verkäufe, aber laufende Fixkosten)
  if (company.strikeActiveUntil && company.strikeActiveUntil > s.gameMinutes) {
    company.forecast = "Betrieb durch Streik lahmgelegt (0 € Umsatz).";
    return;
  }

  const [n, seed] = rngNext(s.rngSeed);
  s.rngSeed = seed;

  // Equipment reduces hygiene decay: base 0.18, down to 0.08 at equipment level 3
  const eqLvl = company.upgrades?.equipment ?? 0;
  const decay = Math.max(0.08, 0.18 - eqLvl * 0.03);
  company.hygiene = clamp(company.hygiene - decay, 0, 100);

  // Automatic manager hygiene cleaning if manager hired
  if (company.manager && company.hygiene < 80 && company.cash >= CLEANING_COST) {
    company.cash -= CLEANING_COST;
    company.todayExpenses += CLEANING_COST;
    company.hygiene = Math.min(100, company.hygiene + 22);
  }

  // Employee satisfaction dynamics driven by store hygiene during operating hours
  for (const emp of company.employees ?? []) {
    const curSat = typeof emp.satisfaction === "number" ? emp.satisfaction : 85;
    let delta = 0;
    if (company.hygiene < 30) {
      delta -= 1.3;
    } else if (company.hygiene < 50) {
      delta -= 0.55;
    } else if (company.hygiene < 65) {
      delta -= 0.15;
    } else if (company.hygiene >= 80) {
      delta += 0.35;
    } else if (company.hygiene >= 70) {
      delta += 0.15;
    }
    if (emp.wage < emp.desiredWage) {
      delta -= 0.35;
    } else if (emp.wage >= emp.desiredWage + 5) {
      delta += 0.15;
    }
    emp.satisfaction = Math.round(clamp(curSat + delta, 0, 100) * 10) / 10;
  }

  // Automatic auto-order if manager + autoOrder upgrade active
  if (company.manager && company.upgrades?.autoOrder) {
    runAutoOrder(s, company);
  }

  const enabled = company.products.filter((p) => p.enabled && p.stock > 0);
  if (enabled.length === 0) return;

  const hygieneMult = 0.85 + 0.15 * (company.hygiene / 100);
  const demand = s.market.demand;
  const indCompetition = getIndustryCompetition(s, company.industry ?? "imbiss");
  const competition = 1 / (1 + indCompetition * 0.22);
  const hourMult = HOUR_CURVE[hour] ?? 0.6;
  const noise = 0.88 + n * 0.24;
  const loc = locationById(company.locationId ?? "kiez");
  const locMult = loc.freqMult;
  const locSynergy = loc.synergyIndustry === company.industry ? (loc.synergyBonus ?? 1) : 1;
  const mktLvl = company.upgrades?.marketing ?? 0;
  const mktMult = 1 + mktLvl * 0.12;
  const eqCapMult = 1 + eqLvl * 0.15;
  const activeStaff = (company.employees ?? []).filter(
    (e) => !e.sickUntil || e.sickUntil <= s.gameMinutes,
  );
  const staffMult = 1 + activeStaff.reduce((sum, e) => sum + e.productivity * 0.35, 0);
  const scaleMult = companyScaleById(company.scale).volumeMult;
  const synergyMult = company.synergyMult ?? 1;

  for (const offering of enabled) {
    const def = productById(offering.productId);
    const prodDemand = s.market.demandByProduct[offering.productId] ?? 1;

    const ratio = offering.price / def.fairPrice;
    let priceMult = 1;
    if (ratio > 1) {
      priceMult = Math.max(0.05, 1 - 1.333 * (ratio - 1));
    } else {
      priceMult = Math.min(1.4, 1 + 0.8 * (1 - ratio));
    }

    const perHour = def.ownerCap / 14;
    const qualMult = offeringQuality(offering);

    const raw =
      perHour *
      hourMult *
      demand *
      prodDemand *
      competition *
      hygieneMult *
      qualMult *
      priceMult *
      noise *
      def.demandWeight *
      locMult *
      locSynergy *
      mktMult *
      staffMult *
      eqCapMult *
      scaleMult *
      synergyMult;

    const want = Math.max(0, Math.round(raw));
    const sold = Math.min(offering.stock, want);
    if (sold <= 0) continue;
    offering.stock -= sold;
    offering.soldLifetime = (offering.soldLifetime ?? 0) + sold;
    const revenue = sold * offering.price;
    const cogs = sold * offeringUnitCost(company, offering);
    company.cash += revenue;
    company.todayRevenue += revenue;
    company.todayCogs += cogs;
    company.todayCustomers += sold;
    company.lifetimeRevenue += revenue;
  }
}

function accrueInterest(s: GameState): void {
  for (const loan of s.loans) {
    if (loan.remaining <= 0.01) continue;
    const add = dailyInterest(loan.remaining, loan.annualRate);
    loan.remaining += add;
    loan.accruedInterest += add;
  }
  for (const c of s.companies) syncCompanyDebt(s, c);
}

const FIRST_NAMES = [
  "Lukas",
  "Mia",
  "Jonas",
  "Emma",
  "Leon",
  "Sophie",
  "Noah",
  "Lea",
  "Elias",
  "Hannah",
  "Felix",
  "Marie",
  "Tim",
  "Laura",
];
const LAST_NAMES = [
  "Weber",
  "Schmidt",
  "Müller",
  "Schneider",
  "Fischer",
  "Meyer",
  "Wagner",
  "Becker",
  "Schulz",
  "Hoffmann",
];

export const APPLICANT_REFRESH_COST = 100;

export function replenishApplicants(s: GameState): void {
  // Remove expired
  s.applications = (s.applications ?? []).filter((a) => a.expiresAt > s.gameMinutes);
  const needed = 4 - s.applications.length;
  if (needed <= 0) return;

  for (let i = 0; i < needed; i++) {
    const [n1, s1] = rngNext(s.rngSeed);
    const [n2, s2] = rngNext(s1);
    const [n3, s3] = rngNext(s2);
    const [n4, s4] = rngNext(s3);
    const [n5, s5] = rngNext(s4);
    s.rngSeed = s5;

    const fn = FIRST_NAMES[Math.floor(n1 * FIRST_NAMES.length)] ?? "Alex";
    const ln = LAST_NAMES[Math.floor(n2 * LAST_NAMES.length)] ?? "Bauer";
    const roles: Role[] = ["kueche", "theke", "allround"];
    const role = roles[Math.floor(n3 * roles.length)] ?? "allround";
    const gender: Gender = n1 > 0.5 ? "w" : "m";
    const prod = Math.round((0.7 + n4 * 0.45) * 100) / 100;
    const rel = Math.round((0.7 + n5 * 0.28) * 100) / 100;
    const exp = Math.round(1 + n2 * 4);
    const wage = Math.round(42 + prod * 18 + exp * 2);

    s.applications.push({
      id: nid("app"),
      name: `${fn} ${ln}`,
      age: 19 + Math.floor(n3 * 26),
      gender,
      role,
      productivity: prod,
      reliability: rel,
      experience: exp,
      desiredWage: wage,
      expiresAt: s.gameMinutes + MINUTES_PER_DAY * 3,
    });
  }
}

export function refreshApplicantPool(s: GameState, companyId?: string): string | null {
  if (companyId) {
    const c = s.companies.find((x) => x.id === companyId);
    if (!c || c.status !== "active") return "Betrieb nicht aktiv.";
    if (c.cash < APPLICANT_REFRESH_COST) {
      return `Firmenkasse benötigt ${APPLICANT_REFRESH_COST} € für eine neue Stellenausschreibung.`;
    }
    c.cash -= APPLICANT_REFRESH_COST;
    c.todayExpenses += APPLICANT_REFRESH_COST;
  } else {
    if (s.cash < APPLICANT_REFRESH_COST) {
      return `Guthaben benötigt ${APPLICANT_REFRESH_COST} € für eine neue Stellenausschreibung.`;
    }
    s.cash -= APPLICANT_REFRESH_COST;
    pushLedger(s, "Stellenausschreibung", -APPLICANT_REFRESH_COST, "company");
  }
  s.applications = [];
  replenishApplicants(s);
  return null;
}

const INTRA_YEAR_PULSES: {
  note: string;
  boosts: string[];
  dips: string[];
}[] = [
  {
    note: "Mittagspausen-Welle in den Bürovierteln: Schnelle Klassiker und Espresso ziehen leicht an.",
    boosts: ["doener", "hotdog", "c_espresso"],
    dips: ["c_kuchen", "s_collector"],
  },
  {
    note: "Social-Media-Trend im Viertel: Matcha, Bowls und urbane Streetwear gewinnen an Beliebtheit.",
    boosts: ["c_matcha", "c_avocado", "s_streetwear"],
    dips: ["pommes", "hotdog"],
  },
  {
    note: "Technik- & Pendler-Nachfrage: Kopfhörer, Smartwatches und Rucksäcke sind stärker gefragt.",
    boosts: ["s_audio", "s_smartwatch", "s_backpack"],
    dips: ["s_collector", "taco"],
  },
  {
    note: "Gemütliches Café-Wetter: Frisches Gebäck, Kuchen und Kaffee verzeichnen mehr Zulauf.",
    boosts: ["c_croissant", "c_kuchen", "c_espresso"],
    dips: ["taco", "s_streetwear"],
  },
  {
    note: "Feierabend-Andrang in der Stadt: Pizza, Tacos und Pommes legen bei den Bestellungen zu.",
    boosts: ["pizza", "taco", "pommes"],
    dips: ["c_avocado", "s_backpack"],
  },
  {
    note: "Sammler- & Lifestyle-Fieber: Limitierte Editionen und Designer-Accessoires liegen im Trend.",
    boosts: ["s_collector", "s_backpack", "c_matcha"],
    dips: ["hotdog", "c_croissant"],
  },
];

function tickMarketPulse(s: GameState, day: number): void {
  // Leichte, nachvollziehbare unterjährige Schwankungen alle 5 Spieltage
  if (day % 5 !== 0) return;
  if (!s.market.prevDemandByProduct) s.market.prevDemandByProduct = {};

  const [r1, s1] = rngNext(s.rngSeed);
  const [r2, s2] = rngNext(s1);
  s.rngSeed = s2;

  const pulse =
    INTRA_YEAR_PULSES[Math.floor(r1 * INTRA_YEAR_PULSES.length)] ?? INTRA_YEAR_PULSES[0]!;
  const stepBoost = 0.04 + r2 * 0.04; // +4% bis +8%
  const stepDip = 0.03 + r2 * 0.03; // -3% bis -6%

  for (const pid of pulse.boosts) {
    const cur = s.market.demandByProduct[pid] ?? 1;
    s.market.prevDemandByProduct[pid] = cur;
    s.market.demandByProduct[pid] = clamp(Math.round((cur + stepBoost) * 100) / 100, 0.65, 1.45);
  }
  for (const pid of pulse.dips) {
    const cur = s.market.demandByProduct[pid] ?? 1;
    s.market.prevDemandByProduct[pid] = cur;
    s.market.demandByProduct[pid] = clamp(Math.round((cur - stepDip) * 100) / 100, 0.65, 1.45);
  }

  // Wenn aktive Betriebe starkes Marketing betreiben, stützt das leicht deren aktive Produkte
  for (const c of s.companies) {
    if (c.status !== "active") continue;
    const mkt = c.upgrades?.marketing ?? 0;
    if (mkt >= 2 && c.hygiene >= 75) {
      for (const off of c.products) {
        if (!off.enabled) continue;
        const cur = s.market.demandByProduct[off.productId] ?? 1;
        s.market.prevDemandByProduct[off.productId] = cur;
        s.market.demandByProduct[off.productId] = clamp(
          Math.round((cur + 0.02) * 100) / 100,
          0.65,
          1.45,
        );
      }
    }
  }

  // Leichte unterjährige Bewegung des branchenspezifischen Konkurrenzdrucks
  if (!s.market.competitionByIndustry) {
    s.market.competitionByIndustry = {
      imbiss: getIndustryCompetition(s, "imbiss"),
      cafe: getIndustryCompetition(s, "cafe"),
      shop: getIndustryCompetition(s, "shop"),
    };
  }
  for (const ind of ["imbiss", "cafe", "shop"] as const) {
    const [rc, nextSeed] = rngNext(s.rngSeed);
    s.rngSeed = nextSeed;
    const curComp = s.market.competitionByIndustry[ind] ?? 0.7;
    const compStep = (rc - 0.5) * 0.06;
    s.market.competitionByIndustry[ind] =
      Math.round(clamp(curComp + compStep, 0.4, 1.65) * 100) / 100;
  }
  s.market.competition =
    Math.round(
      ((s.market.competitionByIndustry.imbiss +
        s.market.competitionByIndustry.cafe +
        s.market.competitionByIndustry.shop) /
        3) *
        100,
    ) / 100;

  s.market.pulseNote = pulse.note;
}

function endOfDay(s: GameState, day: number, year: number, burst?: SimBurst): void {
  if (LIVING_PER_DAY > 0) {
    s.cash -= LIVING_PER_DAY;
    pushLedger(s, "Lebenshaltung", -LIVING_PER_DAY, "living");
    if (burst) burst.living += LIVING_PER_DAY;
  }

  accrueInterest(s);

  // Tägliche Mieteinnahmen aus Immobilien
  const rentIncome = totalDailyRent(s);
  if (rentIncome > 0) {
    s.cash += rentIncome;
    for (const prop of s.realEstate ?? []) {
      prop.lifetimeRent = (prop.lifetimeRent ?? 0) + propertyDailyRent(prop);
    }
    s.stats.fromRentals = (s.stats?.fromRentals ?? 0) + rentIncome;
    pushLedger(s, `Mieteinnahmen (${s.realEstate.length} Immobilien)`, rentIncome, "realestate");
    if (burst) burst.companyProfit += rentIncome;
  }

  // Tägliche Aktien-Dividenden
  const divIncome = Math.round(dailyDividendEstimate(s) * 100) / 100;
  if (divIncome >= 0.5) {
    s.cash += divIncome;
    s.stats.fromDividends = (s.stats?.fromDividends ?? 0) + divIncome;
    pushLedger(s, "Dividenden-Ausschüttung", divIncome, "dividend");
    if (burst) burst.stockDelta += divIncome;
  }

  for (const company of s.companies) {
    if (company.status !== "active") continue;

    // Location rent deduction
    const loc = locationById(company.locationId ?? "kiez");
    const ind = industryById(company.industry ?? "imbiss");
    const rent = company.rentPerDay > 0 ? company.rentPerDay : loc.rentMult * ind.baseRent;
    if (rent > 0) {
      company.cash -= rent;
      company.todayExpenses += rent;
    }

    // Manager salary
    if (company.manager) {
      const managerSalary = managerCostPerDayForIndustry(company.industry);
      company.cash -= managerSalary;
      company.todayExpenses += managerSalary;
    }

    // Employee wages, punctual payment satisfaction & sickness check
    for (const emp of company.employees) {
      const paidOnTime = company.cash >= emp.wage;
      company.cash -= emp.wage;
      company.todayExpenses += emp.wage;
      company.todayWages += emp.wage;
      const curSat = typeof emp.satisfaction === "number" ? emp.satisfaction : 85;
      if (paidOnTime) {
        emp.satisfaction = Math.round(clamp(curSat + 1.5, 0, 100) * 10) / 10;
      } else {
        emp.satisfaction = Math.round(clamp(curSat - 14, 0, 100) * 10) / 10;
      }
      if (emp.sickUntil && emp.sickUntil <= s.gameMinutes) {
        emp.sickUntil = null;
      }
    }

    const profit = company.todayRevenue - company.todayExpenses;
    company.lifetimeProfit += profit;
    if (profit > 0) {
      s.stats.fromCompanies = (s.stats?.fromCompanies ?? 0) + profit;
    }
    company.yesterday = {
      day,
      year,
      revenue: company.todayRevenue,
      expenses: company.todayExpenses,
      profit,
      customers: company.todayCustomers,
    };
    company.history.push(company.yesterday);
    if (company.history.length > 21) company.history.splice(0, company.history.length - 21);
    company.todayRevenue = 0;
    company.todayExpenses = 0;
    company.todayCustomers = 0;
    company.todayCogs = 0;
    company.todayWages = 0;

    // Automatische Dividenden-Ausschüttung (falls bewusst aktiviert & Gewinn erzielt)
    if (company.autoDividend && company.yesterday && company.yesterday.profit > 0) {
      const dailyBurn =
        (company.rentPerDay || 20) +
        (company.employees?.reduce((sum, e) => sum + e.wage, 0) || 0) +
        40;
      const minBuffer = dailyBurn * 5 + 300;
      if (company.cash > minBuffer) {
        const payoutRatio = (company.dividendPct ?? 70) / 100;
        const maxAffordable = company.cash - minBuffer;
        const targetPayout = Math.round(company.yesterday.profit * payoutRatio);
        const payout = Math.min(maxAffordable, targetPayout);
        if (payout >= 10) {
          company.cash -= payout;
          s.cash += payout;
          s.stats.fromDividends = (s.stats?.fromDividends ?? 0) + payout;
          pushLedger(s, `Dividende (${company.name})`, payout, "dividend");
        }
      }
    }
  }

  tickMarketPulse(s, day);
  tickMacroEconomy(s, day);
  replenishApplicants(s);

  if (!burst) {
    maybeQueueEvents(s);
  }

  recordNet(s);
}

export function resolveYearEdge(s: GameState): void {
  const day = absoluteGameDay(s);
  for (const company of s.companies) {
    if (company.status !== "active") continue;
    if (company.cash < 0) {
      failCompany(s, company, day);
    }
  }

  const personalDebt = personalDebtTotal(s);
  if (s.cash <= 0 && personalDebt > 0.5) {
    triggerRunEnd(s);
    return;
  }

  applyYearShift(s);
}

function failCompany(s: GameState, company: Company, day: number): void {
  const owed = companyDebtTotal(s, company.id);
  company.status = "buyback";
  company.insolventAtGameDay = day;
  company.buybackUntilGameDay = day + YEAR_LENGTH_DAYS;
  company.buybackPrice = buybackPriceOf(company.level, company.productSlotMax);
  company.debt = 0;
  company.employeeCount = 0;
  company.employees = [];
  s.loans = s.loans.filter((l) => !(l.owner === "company" && l.companyId === company.id));
  if (owed > 0.5) {
    s.loans.push({
      id: nid("ln"),
      owner: "player",
      principal: owed,
      remaining: owed,
      annualRate: INTEREST_ANNUAL,
      accruedInterest: 0,
      createdAtGameDay: day,
    });
    pushLedger(s, `Schuldübernahme ${company.name}`, -owed, "loan");
  }
  company.forecast = `Pleite. Rückkauf ${company.buybackPrice?.toFixed(0)} €, Fenster ein Geschäftsjahr.`;
  s.inbox.unshift({
    id: nid("ev"),
    kind: "warning",
    title: `${company.name} ist pleite`,
    body: `Die Firma schließt operativ. Offene Kredite liegen jetzt privat. Rückkauf bis Geschäftsjahr ${s.year + 1}.`,
    companyId: company.id,
    options: [],
    createdAt: s.gameMinutes,
  });
}

function triggerRunEnd(s: GameState): void {
  s.insolvent = true;
  s.speed = 0;
  const clock = readClock(s);
  const fromCompanies = s.companies.reduce((a, c) => a + c.lifetimeProfit, 0);
  const fromStocks = s.holdings.reduce((a, h) => {
    const px = s.quotes[h.ticker] ?? 0;
    return a + (px - h.avgCost) * h.shares;
  }, 0);
  s.insolvency = {
    days: clock.totalDays,
    year: s.year,
    peakNet: s.career.bestNetWorth,
    endNet: netWorth(s),
    fromCompanies,
    fromStocks,
    fromLiving: -(LIVING_PER_DAY * clock.totalDays),
    fromAssets: possessionValue(s),
    history: s.netHistory.slice(),
  };
}

export function applyYearShift(s: GameState): void {
  const [n1, s1] = rngNext(s.rngSeed);
  const [n2, s2] = rngNext(s1);
  const [n3, s3] = rngNext(s2);
  const [n4, s4] = rngNext(s3);
  s.rngSeed = s4;
  s.yearNetWorthBase = netWorth(s);
  s.year += 1;
  s.yearStartMinutes = s.gameMinutes;
  s.pendingYearEnd = false;
  if (s.speed === 0) s.speed = 1;

  s.market.prevDemand = s.market.demand;
  const demandDelta = 0.12 + n1 * 0.14;
  const demandSign = n2 > 0.46 ? 1 : -1;
  // Leichte Mean-Reversion zur Mitte (1.0), kombiniert mit kräftigem Jahres-Impuls
  const baseRevert = (1 - s.market.demand) * 0.35;
  s.market.demand = clamp(
    Math.round((s.market.demand + baseRevert + demandSign * demandDelta) * 100) / 100,
    0.75,
    1.35,
  );
  if (!s.market.competitionByIndustry) {
    s.market.competitionByIndustry = {
      imbiss: getIndustryCompetition(s, "imbiss"),
      cafe: getIndustryCompetition(s, "cafe"),
      shop: getIndustryCompetition(s, "shop"),
    };
  }
  for (const ind of ["imbiss", "cafe", "shop"] as const) {
    const [rc, nextSeed] = rngNext(s.rngSeed);
    s.rngSeed = nextSeed;
    const curComp = s.market.competitionByIndustry[ind] ?? 0.7;
    const targetBase = ind === "imbiss" ? 0.8 : ind === "cafe" ? 0.68 : 0.58;
    const revertComp = (targetBase - curComp) * 0.25;
    const nextComp = clamp(curComp + revertComp + (rc - 0.48) * 0.28, 0.4, 1.65);
    s.market.competitionByIndustry[ind] = Math.round(nextComp * 100) / 100;
  }
  s.market.competition =
    Math.round(
      ((s.market.competitionByIndustry.imbiss +
        s.market.competitionByIndustry.cafe +
        s.market.competitionByIndustry.shop) /
        3) *
        100,
    ) / 100;
  s.market.volUntil = s.gameMinutes + MINUTES_PER_DAY * 6;

  const [ev, seedEv] = pick(s.rngSeed, YEAR_EVENTS);
  s.rngSeed = seedEv;
  s.market.yearEvent = { title: ev.title, body: ev.body };

  if (!s.market.prevDemandByProduct) s.market.prevDemandByProduct = {};

  // Branchen-Rotation zum neuen Geschäftsjahr, damit ganze Branchen spürbar boomen oder abkühlen können
  const indShifts: Record<Industry, number> = {
    imbiss: (n1 - 0.48) * 0.22,
    cafe: (n2 - 0.48) * 0.22,
    shop: (n4 - 0.48) * 0.24,
  };

  for (const p of PRODUCTS) {
    const [pn, seed] = rngNext(s.rngSeed);
    const [pn2, seed2] = rngNext(seed);
    s.rngSeed = seed2;

    const prev = s.market.demandByProduct[p.id] ?? 1;
    s.market.prevDemandByProduct[p.id] = prev;

    const ind = p.industry ?? "imbiss";
    const revert = (1 - prev) * 0.4;
    const swing = (pn - 0.48) * 0.36 + (pn2 - 0.5) * 0.14 + indShifts[ind];
    let nextVal = prev + revert + swing;

    // Event-spezifische Kopplung für hohe Nachvollziehbarkeit
    if (ev.title === "Mittagstisch im Viertel" && (p.id === "hotdog" || p.id === "doener" || p.id === "pommes" || p.id === "c_espresso")) {
      nextVal += 0.14;
    } else if (ev.title === "Lieferengpass Speiseöl") {
      if (p.id === "pommes") nextVal -= 0.18;
      if (p.id === "pizza" || p.id === "c_avocado") nextVal += 0.1;
    } else if (ev.title === "Streetfood-Hype" && (p.id === "taco" || p.id === "doener" || p.id === "c_matcha")) {
      nextVal += 0.16;
    } else if (ev.title === "Sommertagesschicht" && (p.id === "c_matcha" || p.id === "taco" || p.id === "s_streetwear")) {
      nextVal += 0.14;
    }

    s.market.demandByProduct[p.id] = clamp(Math.round(nextVal * 100) / 100, 0.65, 1.45);
  }

  const allInds = getAllIndustryDemands(s);
  const topInd = allInds[0];
  const topIndDef = topInd ? industryById(topInd.industry) : null;
  const topProdDef = topInd ? productById(topInd.topProduct.productId) : null;

  const demandTxt =
    s.market.demand >= 1.08
      ? "Die Nachfrage zieht kräftig an."
      : s.market.demand <= 0.88
        ? "Die Nachfrage kühlt spürbar ab."
        : "Ausgeglichenes Marktklima.";
  const compTxt =
    s.market.competition >= 1.05
      ? "Mehr Konkurrenz im Viertel."
      : "Die Konkurrenz bleibt überschaubar.";
  s.market.yearNote = `${demandTxt} ${compTxt} ${ev.title}.`;
  s.market.pulseNote =
    topInd && topIndDef && topProdDef
      ? `Neues Geschäftsjahr ${s.year}: ${topIndDef.name} führt den Markt an (${topInd.pct} % ${topInd.arrow}) — Top-Produkt: ${topProdDef.name} (${topInd.topProduct.pct} %).`
      : `Neues Geschäftsjahr ${s.year}: Starke Neuausrichtung der Branchen- und Produktnachfrage.`;

  for (const c of s.companies) {
    if (
      c.status === "buyback" &&
      c.buybackUntilGameDay &&
      absoluteGameDay(s) > c.buybackUntilGameDay
    ) {
      c.status = "insolvent";
      c.forecast = "Rückkauf-Fenster abgelaufen.";
    } else {
      c.forecast = `${ev.title}: ${ev.body}`;
    }
  }
}

export function blankOfferings(industry?: Industry): ProductOffering[] {
  void industry;
  return PRODUCTS.map((p) => ({
    productId: p.id,
    enabled: false,
    price: p.fairPrice,
    stock: 0,
    supplierId: "mittel",
    orderedLifetime: 0,
    soldLifetime: 0,
    pendingDeliveries: [],
    autoOrder: false,
    contractedSupplier: null,
    candidateSuppliers: [],
    nextSupplierSearchAt: 0,
    nextOrderAvailableAt: 0,
  }));
}

export function newCompanyDefaults(partial: {
  id: string;
  name: string;
  industry?: Industry;
  locationId?: LocationId;
  scale?: CompanyScaleId;
  rentPerDay?: number;
  cash: number;
  equity: number;
  debt: number;
  foundedAt: number;
  foundedAtGameYear: number;
  yearNote: string;
}): Company {
  const ind = partial.industry ?? "imbiss";
  const locId = partial.locationId ?? "kiez";
  const scale = partial.scale ?? "local";
  const indDef = industryById(ind);
  const locDef = locationById(locId);
  const scaleDef = companyScaleById(scale);
  const rent =
    typeof partial.rentPerDay === "number"
      ? partial.rentPerDay
      : Math.round(locDef.rentMult * indDef.baseRent * scaleDef.rentMult);

  return {
    id: partial.id,
    name: partial.name,
    industry: ind,
    locationId: locId,
    scale,
    synergyMult: 1,
    level: 1,
    cash: partial.cash,
    equityIn: partial.equity,
    equity: partial.equity,
    debt: partial.debt,
    status: "active",
    employeeCount: 0,
    productSlotMax: 1,
    foundedAt: partial.foundedAt,
    foundedAtGameYear: partial.foundedAtGameYear,
    foundedAtIso: new Date().toISOString(),
    hygiene: HYGIENE_START,
    hygieneBudget: 0,
    rentPerDay: rent,
    manager: false,
    managerCostPerDay: 0,
    upgrades: {
      equipment: 0,
      storage: 0,
      marketing: 0,
      autoOrder: false,
    },
    forecast: partial.yearNote,
    products: blankOfferings(ind),
    employees: [],
    todayRevenue: 0,
    todayExpenses: 0,
    todayCustomers: 0,
    todayCogs: 0,
    todayWages: 0,
    lifetimeRevenue: 0,
    lifetimeProfit: 0,
    yesterday: null,
    history: [],
  };
}

export function dayChange(ticker: string, s: GameState): number {
  const hist = s.quoteHistory[ticker] ?? [];
  const now = s.quotes[ticker] ?? stockByTicker(ticker).base;
  const prev = hist.length >= 24 ? hist[hist.length - 24]! : (hist[0] ?? now);
  if (!prev) return 0;
  return (now - prev) / prev;
}

export function cryptoDayChange(symbol: string, s: GameState): number {
  const hist = s.cryptoHistory?.[symbol] ?? [];
  const now = s.cryptoQuotes?.[symbol] ?? cryptoBySymbol(symbol).base;
  const prev = hist.length >= 24 ? hist[hist.length - 24]! : (hist[0] ?? now);
  if (!prev) return 0;
  return (now - prev) / prev;
}

export interface StockPeriodStats {
  series: number[];
  startPrice: number;
  currentPrice: number;
  changeAbs: number;
  changePct: number;
  high: number;
  low: number;
  dayHigh: number;
  dayLow: number;
}

export function stockPeriodStats(
  ticker: string,
  s: GameState,
  hoursWindow: number,
): StockPeriodStats {
  const def = stockByTicker(ticker);
  const now = s.quotes[ticker] ?? def.base;
  const full =
    s.quoteHistory[ticker] && s.quoteHistory[ticker]!.length > 0
      ? s.quoteHistory[ticker]!
      : [now];
  const series =
    Number.isFinite(hoursWindow) && full.length > hoursWindow
      ? full.slice(full.length - hoursWindow)
      : full.slice();
  if (series[series.length - 1] !== now) {
    series.push(now);
  }
  const startPrice = series[0] ?? now;
  const changeAbs = now - startPrice;
  const changePct = startPrice > 0 ? changeAbs / startPrice : 0;
  const high = Math.max(...series);
  const low = Math.min(...series);

  const daySeries = full.length > 24 ? full.slice(full.length - 24) : full;
  const dayHigh = Math.max(now, ...daySeries);
  const dayLow = Math.min(now, ...daySeries);

  return {
    series,
    startPrice,
    currentPrice: now,
    changeAbs,
    changePct,
    high,
    low,
    dayHigh,
    dayLow,
  };
}

export function cryptoPeriodStats(
  symbol: string,
  s: GameState,
  hoursWindow: number,
): StockPeriodStats {
  const def = cryptoBySymbol(symbol);
  const now = s.cryptoQuotes?.[symbol] ?? def.base;
  const full =
    s.cryptoHistory?.[symbol] && s.cryptoHistory[symbol]!.length > 0
      ? s.cryptoHistory[symbol]!
      : [now];
  const series =
    Number.isFinite(hoursWindow) && full.length > hoursWindow
      ? full.slice(full.length - hoursWindow)
      : full.slice();
  if (series[series.length - 1] !== now) {
    series.push(now);
  }
  const startPrice = series[0] ?? now;
  const changeAbs = now - startPrice;
  const changePct = startPrice > 0 ? changeAbs / startPrice : 0;
  const high = Math.max(...series);
  const low = Math.min(...series);

  const daySeries = full.length > 24 ? full.slice(full.length - 24) : full;
  const dayHigh = Math.max(now, ...daySeries);
  const dayLow = Math.min(now, ...daySeries);

  return {
    series,
    startPrice,
    currentPrice: now,
    changeAbs,
    changePct,
    high,
    low,
    dayHigh,
    dayLow,
  };
}

export { productSlotsForLevel, yearThreshold };
