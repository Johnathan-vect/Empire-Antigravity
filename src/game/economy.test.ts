import assert from "node:assert/strict";
import { test } from "node:test";
import {
  CREDIT_LIMIT_START,
  FOUNDING_FEE,
  LICENSE_IMBISS,
  START_CASH,
  YEAR_LENGTH_DAYS,
  dailyInterest,
  yearThreshold,
} from "./catalog";
import { yearCapMinutes } from "./clock";
import { maybeQueueEvents, resolveEvent } from "./events";
import { migrate, newGame } from "./save";
import {
  canEndYearEarly,
  estimateProductHourlySales,
  inventoryValue,
  netWorth,
  personalDebtTotal,
  resolveYearEdge,
  stockPeriodStats,
  tickMinutes,
  tryBuyIndustryLicense,
  tryBuyLicense,
  tryExtraPayment,
  tryFoundCompany,
  tryFoundImbiss,
  tryTransfer,
  usedCompanyCredit,
} from "./sim";

test("new game: 25.000 privat, 0 Firmen, Limit 15.000", () => {
  const s = newGame();
  assert.equal(s.cash, START_CASH);
  assert.equal(s.companies.length, 0);
  assert.equal(s.creditLimit, CREDIT_LIMIT_START);
  assert.equal(s.licenses.length, 0);
  assert.equal(s.pendingYearEnd, false);
  assert.equal(yearThreshold(s.yearNetWorthBase), 27_500);
  assert.equal(canEndYearEarly(s), false);
});

test("Lizenz 1.000 → 24.000", () => {
  const s = newGame();
  assert.equal(tryBuyLicense(s), null);
  assert.equal(s.cash, 24_000);
  assert.deepEqual(s.licenses, ["imbiss"]);
  assert.equal(tryBuyLicense(s), "Lizenz bereits vorhanden.");
});

test("Gründen 100 % Kredit, 0 Einlage", () => {
  const s = newGame();
  assert.equal(tryFoundImbiss(s, "Imbiss am Eck", 0, 0), "Zuerst die Imbiss-Lizenz kaufen.");
  assert.equal(tryBuyLicense(s), null);
  assert.equal(tryFoundImbiss(s, "Imbiss am Eck", 0, 0), null);
  assert.equal(s.cash, 24_000);
  assert.equal(s.companies.length, 1);
  const c = s.companies[0]!;
  assert.equal(c.cash, 0);
  assert.equal(c.debt, 5_000);
  assert.equal(c.status, "active");
  assert.equal(c.level, 1);
  assert.equal(c.productSlotMax, 1);
  assert.equal(c.employeeCount, 0);
  assert.equal(s.loans[0]?.remaining, 5_000);
  assert.equal(usedCompanyCredit(s), 5_000);
  assert.equal(Math.round(netWorth(s)), 19_000);
  assert.equal(canEndYearEarly(s), false);
});

test("Gründen 100 % EK, 0 Einlage", () => {
  const s = newGame();
  tryBuyLicense(s);
  assert.equal(tryFoundImbiss(s, "Bargeld Imbiss", FOUNDING_FEE, 0), null);
  assert.equal(s.cash, 19_000);
  assert.equal(s.companies[0]?.cash, 0);
  assert.equal(s.companies[0]?.debt, 0);
  assert.equal(s.loans.length, 0);
});

test("Extra-Einlage 2.000 erscheint in der Kasse", () => {
  const s = newGame();
  tryBuyLicense(s);
  assert.equal(tryFoundImbiss(s, "Mit Einlage", 0, 2_000), null);
  assert.equal(s.cash, 22_000);
  assert.equal(s.companies[0]?.cash, 2_000);
  assert.equal(s.companies[0]?.debt, 5_000);
});

test("Abheben und Einlegen ändern beide Konten", () => {
  const s = newGame();
  tryBuyLicense(s);
  tryFoundImbiss(s, "Transfer", 0, 0);
  const id = s.companies[0]!.id;
  assert.equal(tryTransfer(s, id, 2_000), null);
  assert.equal(s.cash, 22_000);
  assert.equal(s.companies[0]?.cash, 2_000);
  assert.equal(tryTransfer(s, id, -500), null);
  assert.equal(s.cash, 22_500);
  assert.equal(s.companies[0]?.cash, 1_500);
});

test("Zins erhöht Restschuld, zieht kein Bargeld", () => {
  const s = newGame();
  tryBuyLicense(s);
  tryFoundImbiss(s, "Zins", 0, 0);
  const cashBefore = s.cash;
  const coCash = s.companies[0]!.cash;
  tickMinutes(s, 24 * 60);
  const loan = s.loans[0]!;
  assert.ok(loan.remaining > 5_000);
  assert.ok(
    Math.abs(loan.accruedInterest - dailyInterest(5_000)) < 0.02 || loan.accruedInterest > 0,
  );
  assert.equal(s.companies[0]!.cash, coCash);
  assert.equal(s.cash, cashBefore); // LIVING_PER_DAY is now 0
});

test("Sondertilgung aus Firmenkasse, keine Autotilgung", () => {
  const s = newGame();
  tryBuyLicense(s);
  tryFoundImbiss(s, "Tilgung", 0, 2_000);
  const loanId = s.loans[0]!.id;
  assert.equal(tryExtraPayment(s, loanId, 1_000), null);
  assert.equal(s.companies[0]!.cash, 1_000);
  assert.equal(s.loans[0]!.remaining, 4_000);
  assert.equal(s.cash, 22_000);
});

test("Zwei Imbisse nach einer Lizenz, zweite ohne 1.000", () => {
  const s = newGame();
  tryBuyLicense(s);
  tryFoundImbiss(s, "Eins", 0, 0);
  const cash = s.cash;
  assert.equal(tryFoundImbiss(s, "Zwei", FOUNDING_FEE, 0), null);
  assert.equal(s.licenses.length, 1);
  assert.equal(s.companies.length, 2);
  assert.equal(s.cash, cash - FOUNDING_FEE);
  assert.equal(s.companies[1]?.debt, 0);
});

test("Kreditlimit: drei vollkreditierte Imbisse, vierter nur mit Eigenkapital", () => {
  const s = newGame();
  tryBuyLicense(s);
  tryFoundImbiss(s, "Imbiss A", 0, 0);
  tryFoundImbiss(s, "Imbiss B", 0, 0);
  tryFoundImbiss(s, "Imbiss C", 0, 0);
  assert.equal(s.companies.length, 3);
  assert.equal(Math.round(usedCompanyCredit(s)), 15_000);
  const blocked = tryFoundImbiss(s, "Imbiss D", 0, 0);
  assert.equal(blocked, "Kreditlimit überschritten.");
  assert.equal(tryFoundImbiss(s, "Imbiss E-EK", FOUNDING_FEE, 0), null);
  assert.equal(s.companies.length, 4);
});

test("Jahr-Button bleibt grau unter 27.500", () => {
  const s = newGame();
  tryBuyLicense(s);
  tryFoundImbiss(s, "Arm", 0, 0);
  assert.equal(canEndYearEarly(s), false);
  assert.ok(netWorth(s) < 27_500);
});

test("Offline über Tag 360 stoppt, kein stilles neues Jahr", () => {
  const s = newGame();
  const cap = yearCapMinutes(s);
  tickMinutes(s, cap + 10_000);
  assert.equal(s.pendingYearEnd, true);
  assert.equal(s.year, 1);
  assert.equal(s.speed, 0);
  assert.ok(s.gameMinutes >= cap);
  const yearBefore = s.year;
  tickMinutes(s, 5_000);
  assert.equal(s.year, yearBefore);
  assert.equal(s.pendingYearEnd, true);
});

test("Rote Firma an der Kante wird buyback, Spiel läuft", () => {
  const s = newGame();
  tryBuyLicense(s);
  tryFoundImbiss(s, "Pleitebude", 0, 0);
  s.companies[0]!.cash = -10;
  s.pendingYearEnd = true;
  resolveYearEdge(s);
  assert.equal(s.companies[0]!.status, "buyback");
  assert.ok((s.companies[0]!.buybackPrice ?? 0) > 0);
  assert.ok(personalDebtTotal(s) > 4_000);
  assert.equal(s.insolvent, false);
  assert.equal(s.year, 2);
  assert.ok(s.market.yearEvent);
});

test("Run-Ende nur privat an der Kante", () => {
  const s = newGame();
  tryBuyLicense(s);
  tryFoundImbiss(s, "Ende", 0, 0);
  s.companies[0]!.cash = -1;
  s.cash = 0;
  s.pendingYearEnd = true;
  resolveYearEdge(s);
  assert.equal(s.insolvent, true);
  assert.ok(s.insolvency);
});

test("v1 Save hebt auf v2", () => {
  const migrated = migrate({
    version: 1,
    cash: 12_000,
    speed: 16,
    companies: [{ id: "c1", name: "Alt", cash: 100, debt: 200 }],
    loans: [{ id: "l1", remaining: 200, companyId: "c1" }],
  });
  assert.equal(migrated.version, 2);
  assert.equal(migrated.speed, 5);
  assert.equal(migrated.creditLimit, 15_000);
  assert.deepEqual(migrated.licenses, ["imbiss"]);
  assert.equal(migrated.loans[0]?.owner, "company");
});

test("Lizenz einmal 1000, Gründungsgebühr 5000 versunken", () => {
  assert.equal(LICENSE_IMBISS, 1_000);
  assert.equal(FOUNDING_FEE, 5_000);
  assert.equal(YEAR_LENGTH_DAYS, 360);
});

test("Ware im Zulauf zählt zum Lagerwert und stabilisiert Gesamtvermögen", () => {
  const s = newGame();
  tryBuyLicense(s);
  tryFoundImbiss(s, "Zulauf Imbiss", FOUNDING_FEE, 1_000);
  const c = s.companies[0]!;
  const nwBefore = netWorth(s);
  const hotdog = c.products.find((p) => p.productId === "hotdog")!;
  // 40 Hotdogs zum Standardpreis (1.20 * 1 = 48 €)
  c.cash -= 48;
  hotdog.orderedLifetime += 40;
  hotdog.pendingDeliveries = [{ qty: 40, arrivesAt: s.gameMinutes + 120 }];
  assert.equal(Math.round(inventoryValue(c)), 48);
  assert.equal(Math.round(netWorth(s)), Math.round(nwBefore));
  // Nach 120 Minuten im Lager angekommen
  tickMinutes(s, 120);
  assert.equal(hotdog.stock, 40);
  assert.equal(hotdog.pendingDeliveries.length, 0);
  assert.equal(Math.round(inventoryValue(c)), 48);
});

test("Keine 0-Euro-Lebenshaltungsbuchungen im Journal", () => {
  const s = newGame();
  const ledgerLenBefore = s.ledger.length;
  tickMinutes(s, 24 * 60);
  assert.equal(s.ledger.length, ledgerLenBefore);
  assert.equal(
    s.ledger.some((e) => e.bucket === "living"),
    false,
  );
});

test("Hygiene-Krise löst Event aus und lässt sich über resolveEvent auflösen", () => {
  const s = newGame();
  tryBuyLicense(s);
  tryFoundImbiss(s, "Sauberkeit", FOUNDING_FEE, 1_000);
  const c = s.companies[0]!;
  c.hygiene = 12;
  maybeQueueEvents(s);
  assert.ok(s.pendingEvent);
  assert.equal(s.pendingEvent?.title, "Hygiene-Kontrolle");
  assert.equal(s.pendingEvent?.options.length, 3);
  resolveEvent(s, "deep-clean");
  assert.equal(s.pendingEvent, null);
  assert.equal(c.hygiene, 78);
  assert.equal(c.cash, 580);
});

test("Börse: Vorlauf-Historie und Zeitraum-Statistiken (1T/1W/Max) ab Spielstart", () => {
  const s = newGame();
  const stats1T = stockPeriodStats("VTX", s, 24);
  const stats1W = stockPeriodStats("VTX", s, 168);
  const statsMax = stockPeriodStats("VTX", s, Number.POSITIVE_INFINITY);
  assert.equal(stats1T.currentPrice, 91.5);
  assert.ok(stats1T.series.length >= 24);
  assert.ok(stats1W.series.length >= 168);
  assert.ok(statsMax.series.length >= 180);
  assert.ok(stats1T.dayHigh >= stats1T.dayLow);
});

test("Branchen-Lizenz: Mindestvermögen und gestaffelte Gebühren", () => {
  const s = newGame();
  // Café erfordert 45.000 € Gesamtvermögen (Start: 25.000 €)
  assert.ok(tryBuyIndustryLicense(s, "cafe")?.includes("45.000"));
  // Nach Vermögensaufbau (z.B. 50.000 € Bar)
  s.cash = 50_000;
  assert.equal(tryBuyIndustryLicense(s, "cafe"), null);
  assert.ok(s.licenses.includes("cafe"));
  assert.equal(s.cash, 50_000 - 4_500);
});

test("Unternehmensgründung mit Standort und täglicher Miete", () => {
  const s = newGame();
  s.cash = 60_000;
  tryBuyIndustryLicense(s, "cafe");
  // Gründung in belebter Geschäftsstraße (viertel)
  assert.equal(tryFoundCompany(s, "Café Central", "cafe", "viertel", 14_000, 2_000), null);
  const c = s.companies[0]!;
  assert.equal(c.industry, "cafe");
  assert.equal(c.locationId, "viertel");
  assert.equal(c.rentPerDay, 45); // 1.0 * 45 €
  const cashBefore = c.cash;
  // Ein Tag Simulation zieht 45 € Miete
  tickMinutes(s, 24 * 60);
  assert.equal(c.cash, cashBefore - 45);
});

test("Echtzeit-Absatzprognose (estimateProductHourlySales)", () => {
  const s = newGame();
  tryBuyLicense(s);
  tryFoundImbiss(s, "Forecast Imbiss", FOUNDING_FEE, 1_000);
  const c = s.companies[0]!;
  const hotdog = c.products.find((p) => p.productId === "hotdog")!;
  const estimate = estimateProductHourlySales(c, hotdog, s, "mittel", 3.5);
  assert.ok(estimate.hourlySales > 0);
  assert.ok(estimate.dailySales > 0);
  assert.ok(estimate.unitMargin > 0);
  assert.ok(estimate.marginPct > 50);
});
