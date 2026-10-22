import { writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { defaultCareer, defaultStats } from "../../src/game/save";
import {
  START_CASH,
  CREDIT_LIMIT_START,
  RICH_LIST,
  LOCATIONS,
  INDUSTRIES,
  MINUTES_PER_DAY,
  YEAR_LENGTH_DAYS
} from "../../src/game/catalog";
import {
  tickMinutes,
  netWorth,
  tryBuyIndustryLicense,
  tryFoundCompany,
  tryUpgradeCompanyScale,
  tryExecuteMerger,
  tryBuyRealEstate,
  placeProductOrder,
  generateSupplierCandidates,
  calculateAutoOrderThreshold,
  calculateSupplierBuybackPrice
} from "../../src/game/sim";
import type { GameState, Company } from "../../src/game/types";

function createInitialState(): GameState {
  return {
    version: 2,
    createdAt: Date.now(),
    lastRealTs: Date.now(),
    gameMinutes: 0,
    year: 1,
    yearStartMinutes: 0,
    rngSeed: 12345,
    speed: 5,
    theme: "dark",
    playerName: "Agent Tycoon",
    cash: START_CASH,
    creditLimit: CREDIT_LIMIT_START,
    reputation: 15,
    licenses: ["imbiss"],
    possessions: [],
    realEstate: [],
    collections: [],
    companies: [],
    loans: [],
    holdings: [],
    quotes: { TECH: 120, RETAIL: 45, GREEN: 80, HEALTH: 150 },
    quoteHistory: { TECH: [120], RETAIL: [45], GREEN: [80], HEALTH: [150] },
    cryptoHoldings: [],
    cryptoQuotes: { BTC: 42000, ETH: 2800, SOL: 110 },
    cryptoHistory: { BTC: [42000], ETH: [2800], SOL: [110] },
    stats: defaultStats(),
    market: {
      demand: 1.0,
      competition: 1.0,
      volUntil: 0,
      yearNote: "Solider Wirtschaftszyklus im Auftaktjahr.",
      demandByProduct: { hotdog: 1.1, pommes: 1.1, doener: 1.05 }
    },
    applications: [],
    inbox: [],
    pendingEvent: null,
    pendingYearEnd: false,
    yearNetWorthBase: START_CASH,
    ledger: [],
    netHistory: [{ t: 0, v: START_CASH }],
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

async function runFullYearSimulation() {
  console.log("[Simulation Runner] Starte 360-Tage End-to-End Progression-Audit...");
  const s = createInitialState();
  const milestones: any[] = [];
  const dailySnapshots: any[] = [];

  // =========================================================================
  // STAGE 1: BOOTSTRAPPING (Tage 1 - 20)
  // =========================================================================
  console.log("[Stage 1] Tag 1: Gründung Bahnhofs-Grill (Hauptbahnhof) mit 1.200 € Start-Umlaufvermögen...");
  const foundErr = tryFoundCompany(s, "Bahnhofs-Grill Meister", "imbiss", "bahnhof", 5000, 1200, "local");
  if (foundErr) throw new Error(`Founding failed: ${foundErr}`);

  const comp = s.companies[0];
  milestones.push({
    day: 1,
    event: "Gründung Imbiss am Hauptbahnhof",
    companyCash: comp.cash,
    playerCash: s.cash,
    netWorth: netWorth(s)
  });

  // Sortiment & Lieferanten einrichten
  for (let i = 0; i < comp.products.length && i < 3; i++) {
    const p = comp.products[i];
    p.enabled = true;
    const candidates = generateSupplierCandidates(s, "imbiss", p.productId);
    p.candidateSuppliers = candidates;
    p.contractedSupplier = { ...candidates[0], satisfaction: 85, highMoodHours: 0 };
    p.supplierId = "mittel";
    // Erstbestellung aufgeben (z.B. 100 Einheiten)
    placeProductOrder(s, comp, p, 100);
  }

  // Simulation Tage 1 bis 360
  for (let day = 1; day <= 360; day++) {
    // 1 Spieltag = 1440 Minuten in 6-Stunden-Blöcken simulieren
    for (let step = 0; step < 4; step++) {
      tickMinutes(s, 360);
      
      // Regelmäßige Hygiene-Reinigung, wenn unter 70 %
      for (const c of s.companies) {
        if (c.hygiene < 70 && c.cash >= 40) {
          c.hygiene = Math.min(100, c.hygiene + 25);
          c.cash -= 40;
        }
        // Regelmäßige Nachbestellung, wenn Lager unter 40 Einheiten
        for (const prod of c.products) {
          if (prod.enabled && prod.contractedSupplier && prod.stock < 40 && c.cash >= 150) {
            placeProductOrder(s, c, prod, 80);
          }
        }
      }
    }

    const currentNet = netWorth(s);

    // =======================================================================
    // STAGE 2: MID GAME EXPANSION (Filialkette & Café-Gründung)
    // =======================================================================
    if (day === 25 && s.companies[0].scale === "local" && currentNet >= 40000) {
      const upgradeErr = tryUpgradeCompanyScale(s, s.companies[0].id, "smallChain");
      if (!upgradeErr) {
        milestones.push({
          day,
          event: "Upgrade auf Kleine Ladenkette (smallChain)",
          netWorth: currentNet,
          companyRevenueDaily: s.companies[0].yesterday?.revenue || 0
        });
      }
    }

    if (day === 45 && s.companies.length === 1 && currentNet >= 45000 && s.cash >= 18000) {
      tryBuyIndustryLicense(s, "cafe");
      const cafeErr = tryFoundCompany(s, "City Barista Lounge", "cafe", "viertel", 3000, 0, "local");
      if (!cafeErr) {
        const cafeComp = s.companies[1];
        for (let i = 0; i < cafeComp.products.length && i < 2; i++) {
          const cp = cafeComp.products[i];
          cp.enabled = true;
          const candidates = generateSupplierCandidates(s, "cafe", cp.productId);
          cp.candidateSuppliers = candidates;
          cp.contractedSupplier = { ...candidates[0], satisfaction: 85, highMoodHours: 0 };
          cp.supplierId = "mittel";
          placeProductOrder(s, cafeComp, cp, 80);
        }
        milestones.push({
          day,
          event: "Zweiter Betrieb gegründet: City Barista Lounge (Café)",
          netWorth: currentNet,
          totalCompanies: s.companies.length
        });
      }
    }

    // =======================================================================
    // STAGE 3: LATE GAME DIVERSIFICATION (Immobilien & Große Ladenkette)
    // =======================================================================
    if (day === 90 && currentNet >= 75000 && s.cash >= 35000 && s.realEstate.length === 0) {
      const reErr = tryBuyRealEstate(s, "re_micro");
      if (!reErr) {
        milestones.push({
          day,
          event: "Erste Rendite-Immobilie erworben: Micro-Apartment Berlin",
          netWorth: currentNet,
          dailyRent: 65
        });
      }
    }

    if (day === 120 && s.companies[0].scale === "smallChain" && currentNet >= 135000) {
      const largeErr = tryUpgradeCompanyScale(s, s.companies[0].id, "largeChain");
      if (!largeErr) {
        milestones.push({
          day,
          event: "Upgrade auf Große Ladenkette (largeChain - 2,6x Absatzvolumen)",
          netWorth: currentNet
        });
      }
    }

    // =======================================================================
    // STAGE 4: FUSION & RICH LIST LEADERBOARD CLIMB
    // =======================================================================
    // Rich List Check: Welcher Rang wurde erreicht?
    const rankAchieved = RICH_LIST.slice().reverse().find(r => currentNet >= r.netWorth);

    // Tägliche Snapshot-Erfassung (alle 15 Tage)
    if (day % 15 === 0 || day === 360) {
      dailySnapshots.push({
        day,
        year: s.year,
        netWorth: Math.round(currentNet),
        playerCash: Math.round(s.cash),
        companiesCount: s.companies.length,
        totalCompanyRevenueToday: Math.round(s.companies.reduce((acc, c) => acc + c.todayRevenue, 0)),
        totalCompanyProfitLifetime: Math.round(s.companies.reduce((acc, c) => acc + c.lifetimeProfit, 0)),
        currentRank: rankAchieved ? `#${rankAchieved.rank} (${rankAchieved.name})` : "Noch unplatziert (> 30.000 €)",
        reputation: s.reputation
      });
    }
  }

  const result = {
    simulationDays: 360,
    endNetWorth: Math.round(netWorth(s)),
    endPlayerCash: Math.round(s.cash),
    companies: s.companies.map(c => ({
      name: c.name,
      industry: c.industry,
      scale: c.scale,
      level: c.level,
      cash: Math.round(c.cash),
      lifetimeRevenue: Math.round(c.lifetimeRevenue),
      lifetimeProfit: Math.round(c.lifetimeProfit),
      hygiene: c.hygiene
    })),
    realEstateCount: s.realEstate.length,
    milestones,
    curve: dailySnapshots
  };

  const outPath = resolve(process.cwd(), "docs/agent_system/scratchpad/full_year_simulation_report.json");
  writeFileSync(outPath, JSON.stringify(result, null, 2), "utf8");
  console.log(`[Simulation Runner] Simulation über 360 Tage abgeschlossen!`);
  console.log(`End-NetWorth: ${result.endNetWorth.toLocaleString("de-DE")} € | Betriebe: ${result.companies.length}`);
  console.log(`Bericht abgelegt unter: ${outPath}`);
  return result;
}

runFullYearSimulation().then(() => process.exit(0)).catch((err) => {
  console.error(err);
  process.exit(1);
});
