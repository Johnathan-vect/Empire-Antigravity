#!/usr/bin/env node
import { writeFileSync } from "node:fs";
import { resolve } from "node:path";

console.log("[Balance Runner] Starte ökonomische Analyse (Anno-1800-Standard)...");

// Simulation der aktuellen Balancing-Werte
const testIndustries = ["imbiss", "cafe", "shop"];
const baseFees = { imbiss: 120, cafe: 230, shop: 520 };

const findings = [];

for (const ind of testIndustries) {
  const fee = baseFees[ind];
  const currentBuybackPrice = Math.max(90, Math.round((fee * 1.5) / 10) * 10);

  // Vergleich mit typischem Tagesumsatz & Startkapital (25.000 €)
  const typicalDailyRevenue = ind === "imbiss" ? 650 : ind === "cafe" ? 1400 : 2800;
  const penaltyRatioToRevenue = ((currentBuybackPrice / typicalDailyRevenue) * 100).toFixed(1);

  const isFlawed = currentBuybackPrice < typicalDailyRevenue * 0.5;

  findings.push({
    industry: ind,
    currentBuybackPrice: `${currentBuybackPrice} €`,
    typicalDailyRevenue: `${typicalDailyRevenue} €`,
    penaltyRatio: `${penaltyRatioToRevenue} % des Tagesumsatzes`,
    annoEvaluation: isFlawed 
      ? "KRITISCHER BALANCE-FEHLER: Billig-Bailout! Strafe ist viel zu gering (unter 50 % eines einzigen Tagesumsatzes). Spieler lernt keine Konsequenzen."
      : "Ausreichende Hürde."
  });
}

// Anno-Balancing-Vorschlag
const recommendations = {
  ruleName: "Anno-1800-Konsequenz-Prinzip",
  supplierBuybackFormula: "max(typicalDailyRevenue * 1.5, baseFee * 6) + vertrauensVerlustMalus",
  trustPenalty: "Zurückgeholter Lieferant startet mit max. 35 % Zufriedenheit und halber Lieferkapazität für 3 Spieltage.",
  suggestedPrices: {
    imbiss: "mind. 950 € bis 1.200 €",
    cafe: "mind. 2.100 €",
    shop: "mind. 4.500 €"
  }
};

const report = {
  timestamp: new Date().toISOString(),
  persona: "persona-anno-economist",
  status: "FAIL_BALANCE_INSUFFICIENT",
  findings,
  recommendations
};

const outPath = resolve(process.cwd(), "docs/agent_system/scratchpad/balance_audit.json");
writeFileSync(outPath, JSON.stringify(report, null, 2), "utf8");
console.log(`[Balance Runner] Analyse abgeschlossen. Bericht: ${outPath}`);
