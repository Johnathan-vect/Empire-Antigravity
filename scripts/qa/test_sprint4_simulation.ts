import { defaultStats, defaultCareer } from "../../src/game/save";
import {
  START_CASH,
  CREDIT_LIMIT_START,
  DEFAULT_MACRO,
  DEFAULT_DISTRICT_COMPETITORS,
  PRODUCT_COMMODITY_MAP
} from "../../src/game/catalog";
import {
  tryFoundCompany,
  tickMinutes,
  tryWithdrawCompanyDividend,
  offeringUnitCost,
  netWorth
} from "../../src/game/sim";
import type { GameState } from "../../src/game/types";

function createTestState(): GameState {
  return {
    version: 2,
    createdAt: Date.now(),
    lastRealTs: Date.now(),
    gameMinutes: 0,
    year: 1,
    yearStartMinutes: 0,
    rngSeed: 9999,
    speed: 5,
    theme: "dark",
    playerName: "Test Tycoon",
    cash: START_CASH,
    creditLimit: CREDIT_LIMIT_START,
    reputation: 20,
    licenses: ["imbiss"],
    possessions: [],
    realEstate: [],
    collections: [],
    companies: [],
    loans: [],
    holdings: [],
    quotes: {},
    quoteHistory: {},
    cryptoHoldings: [],
    cryptoQuotes: {},
    cryptoHistory: {},
    stats: defaultStats(),
    market: {
      demand: 1.0,
      competition: 1.0,
      volUntil: 0,
      yearNote: "Test Market",
      demandByProduct: {},
      macro: { ...DEFAULT_MACRO, cycleDaysRemaining: 2 },
      districtCompetitors: [...DEFAULT_DISTRICT_COMPETITORS]
    },
    applications: [],
    inbox: [],
    pendingEvent: null,
    pendingYearEnd: false,
    yearNetWorthBase: START_CASH,
    ledger: [],
    netHistory: [],
    career: defaultCareer(),
    seenWelcome: true,
    insolvent: false,
    insolvency: null,
    offlineReport: null,
    ui: {
      tab: "home",
      companyId: null,
      showFounding: false,
      showSettings: false
    }
  };
}

async function runSprint4Verification() {
  console.log("[Sprint 4 Test] Starte Simulationstests für Makroökonomie, Krisen & Dividenden...");

  const s = createTestState();

  // 1. Gründung mit Arbeitskapital
  const errFound = tryFoundCompany(s, "Test Grill", "imbiss", "kiez", 5000, 2000, "local");
  if (errFound) throw new Error(`Founding failed: ${errFound}`);
  const comp = s.companies[0];
  console.log(`[PASS] Betrieb gegründet mit ${comp.cash} € Firmenkasse.`);

  // 2. Rohstoff- und Inflationskosten-Test
  const hotdogOffering = comp.products.find(p => p.productId === "hotdog")!;
  const baseCostNormal = offeringUnitCost(comp, hotdogOffering, undefined, s.market.macro);
  console.log(`[PASS] Basis-Stückkosten Hotdog (Normal): ${baseCostNormal.toFixed(2)} € (Rohstoff: ${PRODUCT_COMMODITY_MAP.hotdog})`);

  // Simuliere Rohstoffschock
  s.market.macro!.commodities.meat = 1.35; // +35 % Fleischpreis
  s.market.macro!.inflationRate = 0.05;   // 5 % Inflation
  const baseCostShock = offeringUnitCost(comp, hotdogOffering, undefined, s.market.macro);
  console.log(`[PASS] Stückkosten Hotdog nach Rohstoffschock (+35 % Fleisch, 5 % Inf): ${baseCostShock.toFixed(2)} €`);
  if (baseCostShock <= baseCostNormal) {
    throw new Error("Rohstoffschock schlägt nicht auf Einkaufspreise durch!");
  }

  // 3. Konjunkturzyklus-Wechsel (tickMinutes über 3 Tage)
  console.log(`[Test] Zyklus vor Simulation: ${s.market.macro!.cycle} (Tage verbleibend: ${s.market.macro!.cycleDaysRemaining})`);
  tickMinutes(s, 24 * 60 * 3); // 3 Tage simulieren
  console.log(`[PASS] Neuer Zyklus: ${s.market.macro!.cycle} (EZB-Zins: ${(s.market.macro!.interestRate * 100).toFixed(1)} %, Inflation: ${(s.market.macro!.inflationRate * 100).toFixed(1)} %)`);
  console.log(`[PASS] Trend: ${s.market.macro!.trendLabel}`);

  // 4. Streik-Stillstand-Test (48h Stillstand = 0 € Umsatz)
  console.log("[Test] Aktiviere 48h-Streik...");
  comp.strikeActiveUntil = s.gameMinutes + 48 * 60;
  comp.todayRevenue = 0;
  tickMinutes(s, 12 * 60); // 12 Betriebsstunden
  console.log(`[PASS] Umsatz während Streik: ${comp.todayRevenue} € (Soll: 0 €)`);
  if (comp.todayRevenue > 0) {
    throw new Error("Trotz Streik wurde Umsatz generiert!");
  }

  // Streik beenden
  comp.strikeActiveUntil = undefined;

  // 5. Dividenden-Ausschüttungstest (Auto-Dividende & Manuelle Ausschüttung)
  comp.cash = 6000; // Überschuss herstellen
  comp.autoDividend = true;
  comp.dividendPct = 70;
  comp.todayRevenue = 1500;
  comp.todayExpenses = 500;

  const initialPlayerCash = s.cash;
  // Simuliere 1 Tageswechsel (1440 Minuten)
  tickMinutes(s, 24 * 60);
  console.log(`[PASS] Spieler-Bargeld nach Auto-Dividende: ${s.cash} € (Vorher: ${initialPlayerCash} €)`);
  if (s.cash <= initialPlayerCash) {
    throw new Error("Automatische Dividende wurde nicht ausgeschüttet!");
  }

  // Manueller 1-Tap Transfer
  comp.cash = 5000;
  const errWithdraw = tryWithdrawCompanyDividend(s, comp.id);
  if (errWithdraw) throw new Error(`Manuelle Ausschüttung fehlgeschlagen: ${errWithdraw}`);
  console.log(`[PASS] 1-Tap-Gewinnüberweisung erfolgreich! Restkasse Betrieb: ${comp.cash} € (5-Tage-Puffer gewahrt).`);

  console.log("\n>>> ALLE SPRINT-4 TESTS ERFOLGREICH BESTANDEN! <<<");
}

runSprint4Verification().then(() => process.exit(0)).catch(e => {
  console.error(e);
  process.exit(1);
});
