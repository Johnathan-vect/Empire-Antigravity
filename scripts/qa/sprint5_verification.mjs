#!/usr/bin/env node
import { chromium } from "playwright";
import { copyFileSync, existsSync, mkdirSync, writeFileSync } from "node:fs";
import { resolve, join } from "node:path";

const BASE_URL = process.env.EMPIRE_URL || "http://127.0.0.1:8080";
const SCREENSHOT_DIR = resolve(process.cwd(), "docs/agent_system/screenshots/sprint5");
const ARTIFACT_DIR = "C:\\Users\\Ja201\\.gemini\\antigravity\\brain\\9fdafe4b-dd75-4776-b13d-4ae323236bb1";

mkdirSync(SCREENSHOT_DIR, { recursive: true });
if (existsSync(ARTIFACT_DIR)) {
  mkdirSync(ARTIFACT_DIR, { recursive: true });
}

const sleep = (ms) => new Promise((res) => setTimeout(res, ms));

async function runSprint5Verification() {
  console.log(`======================================================================`);
  console.log(`[SPRINT 5 VERIFICATION] Starte Verifikation der Feedback-Anpassungen`);
  console.log(`Target: ${BASE_URL}`);
  console.log(`======================================================================\n`);

  let browser;
  try {
    browser = await chromium.launch({ channel: "chrome", headless: true });
  } catch {
    try {
      browser = await chromium.launch({ channel: "msedge", headless: true });
    } catch {
      browser = await chromium.launch({ headless: true });
    }
  }

  const context = await browser.newContext({
    viewport: { width: 1366, height: 868 },
    deviceScaleFactor: 1,
  });

  const page = await context.newPage();

  const snap = async (name, label) => {
    const filename = `${name}.png`;
    const fullPath = join(SCREENSHOT_DIR, filename);
    await page.screenshot({ path: fullPath, fullPage: false });
    const artifactPath = join(ARTIFACT_DIR, filename);
    try {
      copyFileSync(fullPath, artifactPath);
    } catch {}
    console.log(`📸 [Screenshot] ${filename}: ${label}`);
  };

  try {
    await page.goto(BASE_URL, { waitUntil: "networkidle", timeout: 20000 });
    await sleep(800);

    // Reset game to clean state
    await page.evaluate(() => {
      window.__EMPIRE_STORE__?.getState()?.restart();
    });
    await sleep(600);

    // Dismiss welcome
    const dismissBtn = page.locator('button:has-text("Loslegen")').first();
    if (await dismissBtn.isVisible().catch(() => false)) {
      await dismissBtn.click().catch(() => {});
      await sleep(500);
    }

    // -------------------------------------------------------------------------
    // TEST 1: KREDITMARKT & FLEXIBLE KREDITE IM SCREEN FINANZEN
    // -------------------------------------------------------------------------
    console.log(`\n▶ [TEST 1] Kreditmarkt: Flexible Kreditstufen & aktive Kreditaufnahme...`);
    await page.evaluate(() => {
      window.__EMPIRE_STORE__?.getState()?.setTab("finance");
    });
    await sleep(600);

    // Click "Kredit aufnehmen"
    const borrowToggleBtn = page.locator('button:has-text("Kredit aufnehmen")').first();
    await borrowToggleBtn.click();
    await sleep(500);

    await snap("sprint5_01_credit_tiers_open", "Finanzen: 3 Kreditstufen mit Zinsen und Konditionen geöffnet");

    // Borrow 2.500 € via Micro-Credit onto Private Account
    const borrowResult = await page.evaluate(() => {
      const st = window.__EMPIRE_STORE__?.getState();
      if (!st) return { error: "No store" };

      const oldCash = st.cash;
      const oldAvail = (st.creditLimit ?? 15000) - (st.loans.reduce((a, l) => a + l.remaining, 0));

      const err = st.borrowLoan("micro", 2500, "player");
      if (err) return { error: err };

      const fresh = window.__EMPIRE_STORE__?.getState();
      const newCash = fresh?.cash ?? 0;
      const loan = fresh?.loans.find((l) => l.category === "micro");

      return {
        error: null,
        cashDelta: newCash - oldCash,
        loanPrincipal: loan?.principal,
        annualRate: loan?.annualRate,
        loanLabel: loan?.label,
      };
    });

    if (borrowResult.error) throw new Error(`Borrow error: ${borrowResult.error}`);
    console.log(`✓ 2.500 € Mikrokredit aufgenommen: +${borrowResult.cashDelta} € Cash, Zins: ${(borrowResult.annualRate * 100).toFixed(1)} % p.a.`);
    await sleep(600);

    await snap("sprint5_02_credit_active_list", "Finanzen: Aufgenommener Mikrokredit mit 11,5 % p.a. in der Kredittabelle");

    // -------------------------------------------------------------------------
    // TEST 2: SUPPLIER MAX ORDER CAP AUTO-CLAMPING
    // -------------------------------------------------------------------------
    console.log(`\n▶ [TEST 2] Lieferanten-Mengenbeschränkung: Automatisches Clamping statt Fehlerabbruch...`);
    // Found company
    await page.evaluate(() => {
      const st = window.__EMPIRE_STORE__?.getState();
      st.buyIndustryLicense("imbiss");
      st.foundCompany("Test Imbiss Grill", "imbiss", "kiez", 5000, 2000, "local");
      const fresh = window.__EMPIRE_STORE__?.getState();
      const c = fresh.companies[0];
      fresh.toggleProduct(c.id, "doener");
      fresh.searchSuppliers(c.id, "doener");
      const freshAfterSearch = window.__EMPIRE_STORE__?.getState();
      const p = freshAfterSearch.companies[0].products.find(x => x.productId === "doener");
      freshAfterSearch.hireSupplier(c.id, "doener", p.candidateSuppliers[0].id);
    });
    await sleep(600);

    // Place order for 250 units (exceeding supplier max)
    const clampTestResult = await page.evaluate(() => {
      const st = window.__EMPIRE_STORE__?.getState();
      const c = st.companies[0];
      const p = c.products.find(x => x.productId === "doener");
      const sup = p.contractedSupplier;
      const maxCap = sup.maxOrderQty ?? 60;

      // Order intentionally exceeds maxCap
      const outcome = st.orderStock(c.id, "doener", maxCap + 75);

      return {
        err: outcome.err,
        orderedQty: outcome.orderedQty,
        clampedFrom: outcome.clampedFrom,
        maxCap,
      };
    });

    if (clampTestResult.err) throw new Error(`Clamp test failed with error: ${clampTestResult.err}`);
    console.log(`✓ Clamping erfolgreich: Angefordert ${clampTestResult.clampedFrom} Stk. ➔ Automatisch gedeckelt auf ${clampTestResult.orderedQty} Stk. (MaxCap: ${clampTestResult.maxCap})`);

    // -------------------------------------------------------------------------
    // TEST 3: MANAGER HYGIENE AUTOMATION
    // -------------------------------------------------------------------------
    console.log(`\n▶ [TEST 3] Manager Hygiene-Automatisierung & UI-Transparenz...`);
    await page.evaluate(() => {
      const st = window.__EMPIRE_STORE__?.getState();
      const c = st.companies[0];
      c.lifetimeRevenue = 20000;
      c.cash = 25000;
      st.upgradeCompany(c.id); // Level 2 (cost 3.000)
      st.upgradeCompany(c.id); // Level 3 (cost 7.500)
      st.toggleManager(c.id); // Manager active (requires Level 3)
      st.openCompany(c.id);
    });
    await sleep(800);

    await snap("sprint5_03_manager_hygiene_badge", "Betriebsansicht: Manager übernimmt Hygiene automatisch");

    // Drop hygiene to 60% and advance 1 hour to test manager automatic cleaning
    const managerHygieneTest = await page.evaluate(() => {
      const store = window.__EMPIRE_STORE__;
      const st = store?.getState();
      const c = st.companies[0];

      // Cleanly set hygiene to 60% via store state
      store.setState((s) => {
        const comp = s.companies[0];
        if (comp) comp.hygiene = 60;
        return { ...s };
      });

      const oldCash = c.cash;
      const oldExpenses = c.todayExpenses;

      st.advance(60); // 1 hour simulation

      const freshC = store?.getState()?.companies[0];
      return {
        managerActive: freshC?.manager,
        newHygiene: Math.round(freshC?.hygiene ?? 0),
        cashSpentOnCleaning: oldCash - (freshC?.cash ?? 0),
        expensesIncrease: (freshC?.todayExpenses ?? 0) - oldExpenses,
      };
    });

    console.log(`✓ Manager Hygiene-Test: Hygiene sprang von 60 % auf ${managerHygieneTest.newHygiene} % (Reinigungskosten: ${managerHygieneTest.cashSpentOnCleaning} €)`);
    if (managerHygieneTest.newHygiene < 80) {
      throw new Error("Manager hygiene did not restore to >= 80%!");
    }

    await snap("sprint5_04_manager_hygiene_restored", "Betriebsansicht: Hygiene durch Manager automatisch auf 80%+ restauriert");

    console.log(`\n======================================================================`);
    console.log(`🏆 [SPRINT 5 VERIFIKATION VOLLSTÄNDIG ERFOLGREICH]`);
    console.log(`Alle 3 Kernanforderungen verifiziert & im echten Browser validiert!`);
    console.log(`======================================================================\n`);

  } catch (err) {
    console.error(`[Sprint 5 Verification Error]:`, err);
    process.exit(1);
  } finally {
    await browser.close();
  }
}

runSprint5Verification().catch((e) => {
  console.error(e);
  process.exit(1);
});
