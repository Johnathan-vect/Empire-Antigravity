import { MINUTES_PER_DAY } from "./catalog";
import { nid, rngNext } from "./clock";
import { tryBuybackSupplier } from "./sim";
import type { Company, GameEvent, GameState } from "./types";

export function maybeQueueEvents(s: GameState): void {
  if (s.pendingEvent || s.insolvent) return;
  for (const company of s.companies) {
    if (company.status !== "active") continue;
    if (strikeUltimatum(s, company)) return;
    if (hygieneCrisis(s, company)) return;
    if (fluWave(s, company)) return;
    if (quitWarning(s, company)) return;
  }
  if (s.companies.some((c) => c.status === "active")) {
    commodityCrisis(s);
    supplierBlip(s);
    luckyReview(s);
  }
  cashRunway(s);
}

function strikeUltimatum(s: GameState, company: Company): boolean {
  if (!company.employees || company.employees.length === 0) return false;
  if (company.strikeActiveUntil && company.strikeActiveUntil > s.gameMinutes) return false;
  const avgSat =
    company.employees.reduce((acc, e) => acc + (e.satisfaction ?? 80), 0) /
    company.employees.length;
  if (avgSat >= 30) return false;
  const [n, seed] = rngNext(s.rngSeed);
  s.rngSeed = seed;
  if (n > 0.45) return false;

  queueCritical(s, {
    id: nid("ev"),
    kind: "critical",
    title: "Streik-Ultimatum: Belegschaft droht mit Stillstand",
    body: `Die Mitarbeiter bei ${company.name} sind tief unzufrieden (Durchschnittsmoral ${Math.round(avgSat)} %). Die Belegschaft fordert eine Schlichtung oder legt die Arbeit für 48 Stunden komplett nieder!`,
    companyId: company.id,
    createdAt: s.gameMinutes,
    deadlineMinutes: s.gameMinutes + 72 * 60,
    options: [
      {
        id: "settle-strike-bonus",
        label: "Schlichtungsprämie zahlen · 350 €",
        hint: "Einmalzahlung aus der Firmenkasse. Zufriedenheit springt auf 65 %, Streik ist abgewendet.",
      },
      {
        id: "settle-strike-raise",
        label: "Tariflohn anheben (+5 €/Tag)",
        hint: "Dauerhafte Lohnerhöhung aller Mitarbeiter. Zufriedenheit springt auf 75 %, Streik abgewendet.",
      },
      {
        id: "refuse-strike",
        label: "Hart bleiben (48h Streik riskieren)",
        hint: "Konsequenz: 48 Stunden vollständiger Betriebsstillstand (0 € Umsatz, volle Fixkosten laufen weiter).",
      },
    ],
  });
  return true;
}

function fluWave(s: GameState, company: Company): boolean {
  if (!company.employees || company.employees.length === 0) return false;
  const hasSick = company.employees.some((e) => e.sickUntil && e.sickUntil > s.gameMinutes);
  if (hasSick) return false;
  const [n, seed] = rngNext(s.rngSeed);
  s.rngSeed = seed;
  if (n > 0.035) return false; // Seltene Welle

  const sickEmployees = company.employees.slice(0, Math.min(2, company.employees.length));
  for (const emp of sickEmployees) {
    emp.sickUntil = s.gameMinutes + 3 * MINUTES_PER_DAY;
  }
  const sickNames = sickEmployees.map((e) => e.name).join(", ");

  queueCritical(s, {
    id: nid("ev"),
    kind: "warning",
    title: "Saisonale Grippewelle im Betrieb",
    body: `Eine Grippewelle hat ${company.name} erfasst: ${sickNames} fallen für 3 Tage krankheitsbedingt aus. Die Service-Kapazität ist spürbar gedrosselt.`,
    companyId: company.id,
    createdAt: s.gameMinutes,
    options: [
      {
        id: "hire-relief-staff",
        label: "Notdienst-Springer anheuern · 250 €",
        hint: "Professionelle Springer fangen die Ausfälle sofort auf. Personalausfall wird aufgehoben.",
      },
      {
        id: "endure-flu",
        label: "Aussitzen (3 Tage halbe Kraft)",
        hint: "Keine Zusatzkosten, aber gedrosselter Kundendurchsatz während der Krankheitszeit.",
      },
    ],
  });
  return true;
}

function commodityCrisis(s: GameState): boolean {
  const [n, seed] = rngNext(s.rngSeed);
  s.rngSeed = seed;
  if (n > 0.015) return false; // Sehr selten

  if (s.market.macro) {
    s.market.macro.commodities.meat = Math.round((s.market.macro.commodities.meat * 1.3) * 100) / 100;
    s.market.macro.commodities.grain = Math.round((s.market.macro.commodities.grain * 1.25) * 100) / 100;
    s.market.macro.trendLabel = "Rohstoffknappheit: Einkaufspreise für Fleisch & Agrar um +30 % gestiegen";
  }

  queueCritical(s, {
    id: nid("ev"),
    kind: "warning",
    title: "Rohstoff-Krise an den Großmärkten",
    body: "Globale Ernteausfälle und Transportverzögerungen treiben die Beschaffungskosten für Fleisch und Agrarprodukte spürbar in die Höhe (+25–30 %).",
    createdAt: s.gameMinutes,
    options: [
      {
        id: "accept-commodity-shock",
        label: "Zur Kenntnis genommen",
        hint: "Erhöhte Wareneinstandskosten beachten und ggf. Verkaufspreise anpassen.",
      },
    ],
  });
  return true;
}

function hygieneCrisis(s: GameState, company: Company): boolean {
  if (company.hygiene >= 26) return false;
  const [n, seed] = rngNext(s.rngSeed);
  s.rngSeed = seed;
  if (n > 0.4 && company.hygiene > 16) return false;
  queueCritical(s, {
    id: nid("ev"),
    kind: "critical",
    title: "Hygiene-Kontrolle",
    body: `${company.name}: Die Werte sind auf ${Math.round(company.hygiene)}. Eine Kontrolle steht im Raum. Ohne Gegensteuern drohen Umsatzverlust und kranke Mitarbeiter.`,
    companyId: company.id,
    createdAt: s.gameMinutes,
    options: [
      {
        id: "deep-clean",
        label: "Sofortreinigung · 420 €",
        hint: "Kasse des Betriebs, Hygiene auf 78, kein Bußgeld.",
      },
      {
        id: "pay-fine",
        label: "Auflage zahlen · 180 €",
        hint: "Günstiger, Hygiene nur auf 48. Personal bleibt unzufrieden.",
      },
      {
        id: "ignore",
        label: "Ignorieren",
        hint: "Risiko: Bußgeld 700 €, Hygiene fällt, jemand wird krank.",
      },
    ],
  });
  return true;
}

function quitWarning(s: GameState, company: Company): boolean {
  const unhappy = company.employees.find((e) => e.satisfaction < 32);
  if (!unhappy) return false;
  const [n, seed] = rngNext(s.rngSeed);
  s.rngSeed = seed;
  if (n > 0.35) return false;
  queueCritical(s, {
    id: nid("ev"),
    kind: "critical",
    title: `${unhappy.name} will gehen`,
    body: `${unhappy.name} bei ${company.name} ist unzufrieden (${Math.round(unhappy.satisfaction)} %). Ursächlich sind mangelnde Hygiene oder verspätete Lohnzahlung. Eine Kündigung würde Produktivität kosten.`,
    companyId: company.id,
    createdAt: s.gameMinutes,
    options: [
      {
        id: "raise",
        label: `Tageslohn +6 € auf ${Math.round(unhappy.wage + 6)} €`,
        hint: "Zufriedenheit steigt deutlich (+28 %). Höhere tägliche Personalkosten.",
      },
      {
        id: "talk",
        label: "Gespräch, kein Geld",
        hint: "Kleine Atempause (+8 %). Ohne bessere Hygiene droht bald die Kündigung.",
      },
      {
        id: "let-go",
        label: "Gehen lassen",
        hint: "Stelle wird frei. Keine Abfindung.",
      },
    ],
  });
  return true;
}

function supplierBlip(s: GameState): void {
  const [n, seed] = rngNext(s.rngSeed);
  s.rngSeed = seed;
  if (n > 0.045) return;
  const company = s.companies.find(
    (c) =>
      c.status === "active" &&
      c.products.some((p) => p.enabled && (p.pendingDeliveries?.length ?? 0) > 0),
  );
  if (!company) return;
  for (const p of company.products) {
    if (p.pendingDeliveries && p.pendingDeliveries.length > 0) {
      for (const d of p.pendingDeliveries) {
        d.arrivesAt += 180;
        d.delayed = true;
      }
    }
  }
  const ev: GameEvent = {
    id: nid("ev"),
    kind: "warning",
    title: "Lieferverzögerung",
    body: `${company.name}: Eine Charge verzögert sich im Zulauf. Kein Totalausfall — prüfe die Lagerstände.`,
    companyId: company.id,
    createdAt: s.gameMinutes,
    options: [
      {
        id: "express-courier",
        label: "Express-Kurier schicken · 90 €",
        hint: "Hebt die Verzögerung sofort auf — Lieferung trifft pünktlich ein.",
      },
      {
        id: "open-products",
        label: "Im Betrieb prüfen",
        hint: "Wechselt direkt zu den Produkt-Slots des Betriebs.",
      },
      {
        id: "ack",
        label: "Verzögerung hinnehmen",
        hint: "Ware trifft ca. 3 Stunden später ein.",
      },
    ],
  };
  s.inbox.unshift(ev);
  if (s.inbox.length > 12) s.inbox.length = 12;
  if (!s.pendingEvent) {
    s.pendingEvent = ev;
  }
}

function luckyReview(s: GameState): void {
  const [n, seed] = rngNext(s.rngSeed);
  s.rngSeed = seed;
  if (n > 0.03) return;
  const company = s.companies.find((c) => c.status === "active" && c.hygiene > 70);
  if (!company) return;
  s.inbox.unshift({
    id: nid("ev"),
    kind: "info",
    title: "Gute Kritik",
    body: `${company.name} wird empfohlen. Kurzfristig mehr Andrang — Qualität und Hygiene haben das ausgelöst.`,
    companyId: company.id,
    createdAt: s.gameMinutes,
    options: [],
  });
  s.market.prevDemand = s.market.demand;
  s.market.demand = Math.min(1.35, s.market.demand + 0.03);
  if (!s.market.prevDemandByProduct) s.market.prevDemandByProduct = {};
  const activeProds = company.products.filter((p) => p.enabled);
  for (const p of activeProds) {
    const cur = s.market.demandByProduct[p.productId] ?? 1;
    s.market.prevDemandByProduct[p.productId] = cur;
    s.market.demandByProduct[p.productId] = Math.min(1.45, Math.round((cur + 0.05) * 100) / 100);
  }
  s.market.pulseNote = `Positive Bewertungen bei ${company.name} steigern die Nachfrage nach dem Sortiment spürbar (+5 %).`;
}

function cashRunway(s: GameState): void {
  const hasPersonalDebt = s.loans.some((l) => l.owner === "player" && l.remaining > 0.5);
  if (s.cash > 400 || !hasPersonalDebt) return;
  const already = s.inbox.some((e) => e.title === "Kasse wird knapp");
  if (already) return;
  s.inbox.unshift({
    id: nid("ev"),
    kind: "warning",
    title: "Kasse wird knapp",
    body: "Dein persönliches Guthaben ist fast aufgebraucht, während offene Privatschulden bestehen. Ziehe Gewinn aus Betrieben oder verkaufe Aktien vor der Jahreskante.",
    createdAt: s.gameMinutes,
    options: [],
  });
}

function queueCritical(s: GameState, event: GameEvent): void {
  s.pendingEvent = event;
}

export function resolveEvent(s: GameState, optionId: string): string | null {
  const ev = s.pendingEvent;
  if (!ev) return null;
  const company = s.companies.find((c) => c.id === ev.companyId);

  if (optionId === "buyback-supplier") {
    if (!company || !ev.productId) {
      s.pendingEvent = null;
      return "Betrieb oder Produkt nicht gefunden.";
    }
    const err = tryBuybackSupplier(s, company.id, ev.productId);
    if (err) {
      return err;
    }
    s.inbox = s.inbox.filter((x) => x.id !== ev.id);
    s.pendingEvent = null;
    return null;
  }

  if (optionId === "open-supplier" || optionId === "open-products") {
    if (company) {
      s.ui.tab = "biz";
      s.ui.companyId = company.id;
      s.ui.companyTab = "products";
      s.ui.showFounding = false;
      s.ui.showMarketAnalysis = false;
    }
    s.pendingEvent = null;
    return null;
  }

  if (ev.title === "Lieferverzögerung" && company && optionId === "express-courier") {
    if (company.cash < 90) {
      return "Unternehmenskasse reicht nicht für den Express-Kurier (90 € benötigt).";
    }
    company.cash -= 90;
    company.todayExpenses += 90;
    for (const p of company.products) {
      if (p.pendingDeliveries && p.pendingDeliveries.length > 0) {
        for (const d of p.pendingDeliveries) {
          d.arrivesAt = Math.max(s.gameMinutes + 15, d.arrivesAt - 180);
          d.delayed = false;
        }
      }
    }
    s.inbox = s.inbox.filter((x) => x.id !== ev.id);
    s.pendingEvent = null;
    return null;
  }

  if (ev.title.includes("Streik-Ultimatum") && company) {
    if (optionId === "settle-strike-bonus") {
      if (company.cash < 350) {
        return "Firmenkasse reicht nicht für die Schlichtungsprämie (350 € benötigt).";
      }
      company.cash -= 350;
      company.todayExpenses += 350;
      for (const emp of company.employees) {
        emp.satisfaction = Math.max(65, (emp.satisfaction ?? 50) + 35);
      }
      company.strikeActiveUntil = undefined;
    } else if (optionId === "settle-strike-raise") {
      for (const emp of company.employees) {
        emp.wage = Math.round(emp.wage + 5);
        emp.satisfaction = Math.max(75, (emp.satisfaction ?? 50) + 45);
      }
      company.strikeActiveUntil = undefined;
    } else if (optionId === "refuse-strike") {
      // 48h vollständiger Betriebsausfall!
      company.strikeActiveUntil = s.gameMinutes + 48 * 60;
    }
    s.inbox = s.inbox.filter((x) => x.id !== ev.id);
    s.pendingEvent = null;
    return null;
  }

  if (ev.title.includes("Grippewelle") && company) {
    if (optionId === "hire-relief-staff") {
      if (company.cash < 250) {
        return "Firmenkasse reicht nicht für Notdienst-Springer (250 € benötigt).";
      }
      company.cash -= 250;
      company.todayExpenses += 250;
      for (const emp of company.employees) {
        emp.sickUntil = null;
      }
    }
    s.inbox = s.inbox.filter((x) => x.id !== ev.id);
    s.pendingEvent = null;
    return null;
  }

  if (ev.title.includes("Rohstoff-Krise")) {
    s.inbox = s.inbox.filter((x) => x.id !== ev.id);
    s.pendingEvent = null;
    return null;
  }

  if (ev.title === "Hygiene-Kontrolle" && company) {
    if (optionId === "deep-clean") {
      company.cash -= 420;
      company.hygiene = 78;
      company.todayExpenses += 420;
      for (const emp of company.employees) {
        emp.satisfaction = Math.min(100, Math.round(emp.satisfaction + 8));
      }
    } else if (optionId === "pay-fine") {
      company.cash -= 180;
      company.hygiene = Math.max(company.hygiene, 48);
      company.todayExpenses += 180;
      for (const emp of company.employees) {
        emp.satisfaction = Math.max(0, Math.round(emp.satisfaction - 5));
      }
    } else {
      company.cash -= 700;
      company.hygiene = Math.max(0, company.hygiene - 12);
      company.todayExpenses += 700;
      for (const emp of company.employees) {
        emp.satisfaction = Math.max(0, Math.round(emp.satisfaction - 12));
      }
      const victim = company.employees[0];
      if (victim) victim.sickUntil = s.gameMinutes + MINUTES_PER_DAY * 2;
      if (!s.market.prevDemandByProduct) s.market.prevDemandByProduct = {};
      for (const p of company.products.filter((x) => x.enabled)) {
        const cur = s.market.demandByProduct[p.productId] ?? 1;
        s.market.prevDemandByProduct[p.productId] = cur;
        s.market.demandByProduct[p.productId] = Math.max(0.68, Math.round((cur - 0.05) * 100) / 100);
      }
      s.market.pulseNote = `Hygiene-Vorfall bei ${company.name} drückt vorübergehend die Nachfrage der betroffenen Produkte (−5 %).`;
    }
  }
  if (ev.title.includes("will gehen") && company) {
    const person = company.employees.find((e) => ev.body.includes(e.name));
    if (person) {
      if (optionId === "raise") {
        person.wage = Math.round(person.wage + 6);
        person.satisfaction = Math.min(96, person.satisfaction + 28);
      } else if (optionId === "talk") {
        person.satisfaction = Math.min(96, person.satisfaction + 8);
      } else {
        company.employees = company.employees.filter((e) => e.id !== person.id);
        company.employeeCount = company.employees.length;
      }
    }
  }
  const alreadyInInbox = s.inbox.some((x) => x.id === ev.id);
  if (!alreadyInInbox) {
    s.inbox.unshift({ ...ev, kind: "info", options: [] });
    if (s.inbox.length > 12) s.inbox.length = 12;
  }
  s.pendingEvent = null;
  return null;
}
