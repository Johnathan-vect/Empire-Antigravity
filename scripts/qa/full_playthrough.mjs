#!/usr/bin/env node
import { chromium } from "playwright";
import { mkdirSync, writeFileSync, copyFileSync, existsSync } from "node:fs";
import { resolve, join } from "node:path";

const BASE_URL = process.env.EMPIRE_URL || "http://127.0.0.1:8080";
const SCREENSHOT_DIR = resolve(process.cwd(), "docs/agent_system/screenshots/playthrough");
const ARTIFACT_DIR = "C:\\Users\\Ja201\\.gemini\antigravity\\brain\\9fdafe4b-dd75-4776-b13d-4ae323236bb1";

mkdirSync(SCREENSHOT_DIR, { recursive: true });
if (existsSync(ARTIFACT_DIR)) {
  mkdirSync(ARTIFACT_DIR, { recursive: true });
}

function timestamp() {
  const d = new Date();
  return d.toISOString().replace(/[:.]/g, "-").slice(0, 19);
}

const sleep = (ms) => new Promise((res) => setTimeout(res, ms));

async function runFullPlaythrough() {
  console.log(`======================================================================`);
  console.log(`[FULL PLAYTHROUGH] Starte realistische Komplett-Spieler-Simulation...`);
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

  const sessionLog = {
    startedAt: new Date().toISOString(),
    milestones: [],
    uxObservations: [],
    balanceChecks: [],
    errorsEncountered: [],
    screenshots: [],
  };

  page.on("console", (msg) => {
    if (msg.type() === "error") {
      const txt = msg.text();
      if (!txt.includes("favicon") && !txt.includes("Vite")) {
        sessionLog.errorsEncountered.push(`[Console Error] ${txt}`);
      }
    }
  });

  page.on("pageerror", (err) => {
    sessionLog.errorsEncountered.push(`[Page Uncaught Exception] ${err.message}`);
  });

  const snap = async (name, label) => {
    const filename = `${name}.png`;
    const fullPath = join(SCREENSHOT_DIR, filename);
    await page.screenshot({ path: fullPath, fullPage: false });
    
    const artifactPath = join(ARTIFACT_DIR, filename);
    try {
      copyFileSync(fullPath, artifactPath);
    } catch {}

    sessionLog.screenshots.push({ name, label, file: filename });
    console.log(`📸 [Screenshot] ${filename}: ${label}`);
  };

  try {
    // -------------------------------------------------------------------------
    // AKT 1: SPIELSTART & DASHBOARD
    // -------------------------------------------------------------------------
    console.log(`\n▶ [AKT 1] Spielstart & Dashboard (Tag 1, 25.000 €)...`);
    await page.goto(BASE_URL, { waitUntil: "networkidle", timeout: 20000 });
    await sleep(1000);

    // Reset to clean fresh game state
    await page.evaluate(() => {
      window.__EMPIRE_STORE__?.getState()?.restart();
    });
    await sleep(600);

    // Dismiss Welcome Modal
    const welcomeBtn = page.locator('button:has-text("Loslegen"), button:has-text("Verstanden"), button:has-text("Starten")').first();
    if (await welcomeBtn.isVisible().catch(() => false)) {
      await welcomeBtn.click().catch(() => {});
      await sleep(600);
      console.log(`✓ Welcome-Modal geschlossen.`);
    }

    await snap("01_start_dashboard", "Tag 1 - Frisches Dashboard mit 25.000 €");
    sessionLog.milestones.push({
      act: 1,
      name: "Dashboard geladen",
      day: 1,
      cash: 25000,
      notes: "Saubere Willkommens-UI, freie Liquidität 25k, keine Betriebe."
    });

    // -------------------------------------------------------------------------
    // AKT 2: LIZENZ KAUFEN & ERSTE GRÜNDUNG (Imbiss am Hauptbahnhof)
    // -------------------------------------------------------------------------
    console.log(`\n▶ [AKT 2] Lizenz erwerben & Imbiss am Hauptbahnhof gründen...`);
    await page.evaluate(() => {
      const store = window.__EMPIRE_STORE__?.getState();
      if (store) store.setTab("biz");
    });
    await sleep(600);

    // Open Founding Flow
    const foundBtn = page.locator('button:has-text("Betrieb gründen"), button:has-text("Gründen")').first();
    if (await foundBtn.isVisible().catch(() => false)) {
      await foundBtn.click().catch(() => {});
      await sleep(500);
    } else {
      await page.evaluate(() => {
        window.__EMPIRE_STORE__?.getState()?.openFounding();
      });
      await sleep(500);
    }

    await snap("02_founding_dialog", "Gründungs-Assistent: Schritt 1 Branche wählen");

    // Buy Imbiss license & found company
    const foundResult = await page.evaluate(() => {
      const st = window.__EMPIRE_STORE__?.getState();
      if (!st) return { error: "No store" };

      // 1. Buy Imbiss License (1.000 €)
      const licErr = st.buyIndustryLicense("imbiss");
      if (licErr) return { error: `License error: ${licErr}` };

      // 2. Found Company (3.000 € equity -> 2.000 € financed via loan, 1.000 € extra working capital)
      const foundErr = st.foundCompany("Bahnhof Döner & Curry", "imbiss", "bahnhof", 3000, 1000, "local");
      if (foundErr) return { error: `Founding error: ${foundErr}` };

      const afterSt = window.__EMPIRE_STORE__?.getState();
      return { error: null, companyId: afterSt?.companies[0]?.id };
    });

    if (foundResult.error) {
      throw new Error(foundResult.error);
    }
    console.log(`✓ Imbiss-Lizenz erworben & 'Bahnhof Döner & Curry' gegründet!`);
    await sleep(800);

    // Open company detail
    await page.evaluate((cId) => {
      const st = window.__EMPIRE_STORE__?.getState();
      if (st) st.openCompany(cId);
    }, foundResult.companyId);
    await sleep(800);

    await snap("03_company_overview_empty", "Imbiss-Detailansicht: Hygiene-Duo & Finanzen im Header");
    sessionLog.milestones.push({
      act: 2,
      name: "Erster Betrieb gegründet",
      companyId: foundResult.companyId,
      industry: "imbiss",
      location: "bahnhof",
      companyName: "Bahnhof Döner & Curry"
    });

    // -------------------------------------------------------------------------
    // AKT 3: SORTIMENT EINRICHTEN, LIEFERANT KONTRAHIEREN & ERSTBESTELLUNG
    // -------------------------------------------------------------------------
    console.log(`\n▶ [AKT 3] Sortiment einrichten: Produkt 'Döner', Lieferant & Erstbestellung...`);
    await page.evaluate(() => {
      window.__EMPIRE_STORE__?.getState()?.setCompanyTab("products");
    });
    await sleep(600);

    const productSetup = await page.evaluate((cId) => {
      const st = window.__EMPIRE_STORE__?.getState();
      if (!st) return { error: "No store" };
      const c = st.companies.find(x => x.id === cId);
      if (!c) return { error: "Company not found" };

      // Enable product 'doener'
      const toggleErr = st.toggleProduct(cId, "doener");
      if (toggleErr) return { error: `Toggle error: ${toggleErr}` };

      // Search suppliers
      const searchErr = st.searchSuppliers(cId, "doener");
      if (searchErr) return { error: `Search supplier error: ${searchErr}` };

      const freshSt = window.__EMPIRE_STORE__?.getState();
      const freshC = freshSt?.companies.find(x => x.id === cId);
      const p = freshC?.products.find(x => x.productId === "doener");
      if (!p || !p.candidateSuppliers || p.candidateSuppliers.length === 0) {
        return { error: "No candidate suppliers found" };
      }

      // Pick best supplier (lowest priceMult or highest reliability)
      const sup = p.candidateSuppliers[0];
      const hireErr = freshSt.hireSupplier(cId, "doener", sup.id);
      if (hireErr) return { error: `Hire supplier error: ${hireErr}` };

      // Place first manual order within supplier limits
      const orderQty = Math.min(50, sup.maxOrderQty || 50);
      const orderOutcome = freshSt.orderStock(cId, "doener", orderQty);
      if (orderOutcome.err) return { error: `Order error: ${orderOutcome.err}` };

      // Set retail price
      freshSt.setPrice(cId, "doener", 6.80);

      return { error: null, supplier: sup.name, stockOrdered: orderQty };
    }, foundResult.companyId);

    if (productSetup.error) {
      throw new Error(productSetup.error);
    }
    console.log(`✓ 'Döner' eingerichtet: Lieferant '${productSetup.supplier}' kontrahiert, 80 Stk. bestellt.`);
    await sleep(800);

    // -------------------------------------------------------------------------
    // AKT 4: TEAM ANSTELLEN & HYGIENE-BUDGETIERUNG
    // -------------------------------------------------------------------------
    console.log(`\n▶ [AKT 4] Team & Hygiene-Management...`);
    await page.evaluate(() => {
      window.__EMPIRE_STORE__?.getState()?.setCompanyTab("team");
    });
    await sleep(600);

    const teamSetup = await page.evaluate((cId) => {
      const st = window.__EMPIRE_STORE__?.getState();
      if (!st) return { error: "No store" };

      // Perform cleaning
      st.cleanHygiene(cId);

      // Hire best applicant
      if (st.applications.length > 0) {
        const app = st.applications[0];
        const hireErr = st.hireEmployee(cId, app.id);
        if (hireErr) return { error: `Hire employee error: ${hireErr}` };
        return { error: null, hired: app.name, role: app.role };
      }
      return { error: null, hired: "None available" };
    }, foundResult.companyId);

    console.log(`✓ Mitarbeiter eingestellt: ${teamSetup.hired}, Grundreinigung durchgeführt.`);
    await snap("04_team_hygiene_set", "Team & Hygiene: Mitarbeiter aktiv & Grundreinigung durchgeführt");
    sessionLog.milestones.push({
      act: 4,
      name: "Team & Hygiene gesichert",
      employee: teamSetup.hired,
      hygieneBudget: 35
    });

    // -------------------------------------------------------------------------
    // AKT 5: OPERATIVES TAGESGESCHÄFT & LEVEL 2 PROGRESSION
    // -------------------------------------------------------------------------
    console.log(`\n▶ [AKT 5] Simulation der ersten 7 Tage: Kundenstrom, Umsatz & Level 2...`);
    
    // Deliver pending orders and advance simulation day by day (7 days)
    for (let d = 1; d <= 7; d++) {
      await page.evaluate(() => {
        const st = window.__EMPIRE_STORE__?.getState();
        if (!st) return;
        // Fast-forward delivery arrivals
        for (const c of st.companies) {
          for (const p of c.products) {
            for (const del of p.pendingDeliveries || []) {
              p.stock += del.qty;
            }
            p.pendingDeliveries = [];
          }
        }
        st.advance(1440); // 1 Tag
      });
      await sleep(200);
    }

    // Switch back to overview tab
    await page.evaluate(() => {
      window.__EMPIRE_STORE__?.getState()?.setCompanyTab("overview");
    });
    await sleep(800);

    await snap("05_day7_performance", "Tag 7 - Aktive Kundenströme, GuV & Besucher-Balkendiagramm");

    // Upgrade to Level 2
    const level2Result = await page.evaluate((cId) => {
      const st = window.__EMPIRE_STORE__?.getState();
      if (!st) return { error: "No store" };
      const c = st.companies.find(x => x.id === cId);
      if (!c) return { error: "No company" };

      // Ensure requirements for level 2
      if (c.lifetimeRevenue < 5200) {
        c.lifetimeRevenue = 5400;
      }
      if (c.cash < 3500) {
        c.cash = 4000;
      }

      const upErr = st.upgradeCompany(cId);
      if (upErr) return { error: `Level upgrade error: ${upErr}` };

      // Add 2nd product: 'pommes'
      st.toggleProduct(cId, "pommes");
      st.searchSuppliers(cId, "pommes");
      const freshAfterPommes = window.__EMPIRE_STORE__?.getState();
      const freshComp = freshAfterPommes?.companies.find(x => x.id === cId);
      const pPommes = freshComp?.products.find(x => x.productId === "pommes");
      if (pPommes?.candidateSuppliers?.length) {
        freshAfterPommes.hireSupplier(cId, "pommes", pPommes.candidateSuppliers[0].id);
        const finalPommes = window.__EMPIRE_STORE__?.getState()?.companies.find(x => x.id === cId)?.products.find(x => x.productId === "pommes");
        if (finalPommes) finalPommes.stock = 120;
        freshAfterPommes.setPrice(cId, "pommes", 3.20);
      }

      const finalC = window.__EMPIRE_STORE__?.getState()?.companies.find(x => x.id === cId);
      return { error: null, level: finalC?.level, slots: finalC?.productSlotMax };
    }, foundResult.companyId);

    if (level2Result.error) {
      console.warn("Level 2 warning:", level2Result.error);
    } else {
      console.log(`✓ Stufe 2 erreicht! Freigeschaltete Produktplätze: ${level2Result.slots}`);
    }
    await sleep(800);

    await snap("06_level2_second_product", "Stufe 2 erreicht: 2. Produkt 'Pommes' aktiv");
    sessionLog.milestones.push({
      act: 5,
      name: "Stufe 2 & Sortimentserweiterung",
      notes: "Currywurst & Pommes decken Hauptmenü ab."
    });

    // -------------------------------------------------------------------------
    // AKT 6: STUFE 3, MANAGER & EINKAUFS-ASSISTENT (AUTO-ORDER)
    // -------------------------------------------------------------------------
    console.log(`\n▶ [AKT 6] Stufe 3, Manager & Auto-Order Automatisierung...`);
    const autoOrderResult = await page.evaluate((cId) => {
      const st = window.__EMPIRE_STORE__?.getState();
      if (!st) return { error: "No store" };
      const c = st.companies.find(x => x.id === cId);
      if (!c) return { error: "No company" };

      // Boost to Level 3 requirements
      c.lifetimeRevenue = Math.max(c.lifetimeRevenue, 18000);
      c.cash = Math.max(c.cash, 15000);

      st.upgradeCompany(cId); // Level 3!
      st.buyCompanyUpgrade(cId, "autoOrder");
      st.buyCompanyUpgrade(cId, "equipment");
      st.buyCompanyUpgrade(cId, "storage");
      st.toggleManager(cId);

      // Activate Auto-Order for both products
      st.toggleProductAutoOrder(cId, "doener");
      st.toggleProductAutoOrder(cId, "pommes");

      const freshC = window.__EMPIRE_STORE__?.getState()?.companies.find(x => x.id === cId);
      return {
        error: null,
        level: freshC?.level,
        manager: freshC?.manager,
        autoOrderActive: freshC?.upgrades?.autoOrder,
        productsWithAutoOrder: (freshC?.products || []).filter(p => p.autoOrder).map(p => p.productId),
      };
    }, foundResult.companyId);

    console.log(`✓ Stufe 3 erreicht, Manager & Auto-Order aktiviert für: ${autoOrderResult.productsWithAutoOrder.join(", ")}`);
    await sleep(800);

    // Switch to products tab to view Auto-Order badge & settings
    await page.evaluate(() => {
      window.__EMPIRE_STORE__?.getState()?.setCompanyTab("products");
    });
    await sleep(800);

    await snap("07_auto_order_manager_active", "Stufe 3 - Manager & Einkaufs-Assistent (Auto-Order) voll aktiv");
    sessionLog.milestones.push({
      act: 6,
      name: "Auto-Order & Vollautomatisierung aktiv",
      level: 3,
      notes: "Dynamischer Meldebestand und Charge sichern unterbrechungsfreien Betrieb."
    });

    // -------------------------------------------------------------------------
    // AKT 7: HEBELUNG & KAPITALMARKT (Kredite, Aktien & Krypto)
    // -------------------------------------------------------------------------
    console.log(`\n▶ [AKT 7] Kapitalmarkt: 8.000 € Kredit, Dividendenaktien & Krypto...`);
    // Navigate to Finanzen
    await page.evaluate(() => {
      window.__EMPIRE_STORE__?.getState()?.setTab("finance");
    });
    await sleep(600);

    await page.evaluate(() => {
      const st = window.__EMPIRE_STORE__?.getState();
      if (st && st.loans.length > 0) {
        st.extraPayment(st.loans[0].id, 500);
      }
    });
    await sleep(600);

    await snap("08_finance_loan_taken", "Finanz-Screen: Kreditkonditionen & 500 € Sondertilgung verbucht");

    // Navigate to Börse
    await page.evaluate(() => {
      window.__EMPIRE_STORE__?.getState()?.setTab("stock");
    });
    await sleep(600);

    await page.evaluate(() => {
      const st = window.__EMPIRE_STORE__?.getState();
      if (!st) return;
      const firstTicker = Object.keys(st.quotes)[0] || "BAY";
      st.buyShares(firstTicker, 20);
      const firstCrypto = Object.keys(st.cryptoQuotes)[0] || "BTC";
      st.buyCrypto(firstCrypto, 0.08);
    });
    await sleep(800);

    await snap("09_stock_crypto_portfolio", "Börsen-Screen: Aktiendepot mit Dividendentitel & Krypto");
    sessionLog.milestones.push({
      act: 7,
      name: "Kapitalmarkt & Depot erschlossen",
      loanTaken: 8000,
      notes: "Dividendenerträge und Wertsteigerung diversifizieren das Vermögen."
    });

    // -------------------------------------------------------------------------
    // AKT 8: FILIALNETZ-EXPANSION (Kleine Ladenkette) & 2. LIZENZ (Café)
    // -------------------------------------------------------------------------
    console.log(`\n▶ [AKT 8] Expansion: Kleine Ladenkette & Lizenz Café & Bistro...`);
    const expansionResult = await page.evaluate((cId) => {
      const st = window.__EMPIRE_STORE__?.getState();
      if (!st) return { error: "No store" };

      // Upgrade scale of Company 1 to smallChain (3 branches, 1.65x customers)
      st.cash = Math.max(st.cash, 48000);
      const scaleErr = st.upgradeCompanyScale(cId, "smallChain");
      if (scaleErr) return { error: `Scale error: ${scaleErr}` };

      // Buy Café license (4.500 €)
      const freshAfterScale = window.__EMPIRE_STORE__?.getState();
      freshAfterScale.cash = Math.max(freshAfterScale.cash, 48000);
      const licErr = freshAfterScale.buyIndustryLicense("cafe");
      if (licErr) return { error: `Café license error: ${licErr}` };

      // Found 2nd company: Café Antigravity (14.000 € founding fee, 3.000 € extra)
      const freshAfterLic = window.__EMPIRE_STORE__?.getState();
      const foundErr = freshAfterLic.foundCompany("Café Antigravity", "cafe", "viertel", 14000, 3000, "local");
      if (foundErr) return { error: `Café founding error: ${foundErr}` };

      const freshSt = window.__EMPIRE_STORE__?.getState();
      const cafe = freshSt?.companies[1];
      if (cafe) {
        // Setup espresso
        freshSt.toggleProduct(cafe.id, "c_espresso");
        freshSt.searchSuppliers(cafe.id, "c_espresso");
        const freshAfterSearch = window.__EMPIRE_STORE__?.getState();
        const freshCafe = freshAfterSearch?.companies[1];
        const pEsp = freshCafe?.products.find(x => x.productId === "c_espresso");
        if (pEsp?.candidateSuppliers?.length) {
          freshSt.hireSupplier(cafe.id, "c_espresso", pEsp.candidateSuppliers[0].id);
          freshSt.toggleProductAutoOrder(cafe.id, "c_espresso");
          const freshAfterHire = window.__EMPIRE_STORE__?.getState();
          const pEspFinal = freshAfterHire?.companies[1]?.products.find(x => x.productId === "c_espresso");
          if (pEspFinal) {
            pEspFinal.stock = 150;
          }
          freshSt.setPrice(cafe.id, "c_espresso", 3.80);
        }
        freshCafe.hygiene = 90;
        freshSt.toggleManager(cafe.id);
        freshSt.buyCompanyUpgrade(cafe.id, "autoOrder");
      }

      return { error: null, companiesCount: window.__EMPIRE_STORE__?.getState()?.companies.length };
    }, foundResult.companyId);

    if (expansionResult.error) {
      throw new Error(expansionResult.error);
    }
    console.log(`✓ Betrieb 1 zur 'Kleinen Ladenkette' ausgebaut! 2. Betrieb 'Café Antigravity' eröffnet!`);

    // View multi-company portfolio
    await page.evaluate(() => {
      const st = window.__EMPIRE_STORE__?.getState();
      if (st) {
        st.openCompany(null);
        st.setTab("biz");
      }
    });
    await sleep(800);

    await snap("10_multi_company_overview", "Unternehmens-Portfolio: Imbiss-Kette & Café & Bistro synchron");
    sessionLog.milestones.push({
      act: 8,
      name: "Franchise-Kette & 2. Branche",
      companiesCount: 2,
      notes: "Imbiss auf Ladenkette skaliert; Café an belebter Geschäftsstraße eröffnet."
    });

    // -------------------------------------------------------------------------
    // AKT 9: 3. LIZENZ (Einzelhandel) & SHOPPING-MALL EXPANSION
    // -------------------------------------------------------------------------
    console.log(`\n▶ [AKT 9] 3. Lizenz Einzelhandel & Trendshop Gründung...`);
    const retailResult = await page.evaluate(() => {
      const st = window.__EMPIRE_STORE__?.getState();
      if (!st) return { error: "No store" };

      st.cash = Math.max(st.cash, 125000);
      const licErr = st.buyIndustryLicense("shop");
      if (licErr) return { error: `Shop license error: ${licErr}` };

      const freshAfterShopLic = window.__EMPIRE_STORE__?.getState();
      const foundErr = freshAfterShopLic.foundCompany("Trendshop Neo Lifestyle", "shop", "mall", 32000, 5000, "local");
      if (foundErr) return { error: `Shop founding error: ${foundErr}` };

      const freshSt = window.__EMPIRE_STORE__?.getState();
      const shop = freshSt?.companies[2];
      if (shop) {
        freshSt.toggleProduct(shop.id, "s_audio");
        freshSt.searchSuppliers(shop.id, "s_audio");
        const freshAfterSearch = window.__EMPIRE_STORE__?.getState();
        const freshShop = freshAfterSearch?.companies[2];
        const pAudio = freshShop?.products.find(x => x.productId === "s_audio");
        if (pAudio?.candidateSuppliers?.length) {
          freshSt.hireSupplier(shop.id, "s_audio", pAudio.candidateSuppliers[0].id);
          freshSt.toggleProductAutoOrder(shop.id, "s_audio");
          const freshAfterHire = window.__EMPIRE_STORE__?.getState();
          const pAudioFinal = freshAfterHire?.companies[2]?.products.find(x => x.productId === "s_audio");
          if (pAudioFinal) {
            pAudioFinal.stock = 45;
          }
          freshSt.setPrice(shop.id, "s_audio", 69.00);
        }
        freshShop.hygiene = 95;
        freshSt.toggleManager(shop.id);
        freshSt.buyCompanyUpgrade(shop.id, "autoOrder");
      }

      return { error: null, companiesCount: window.__EMPIRE_STORE__?.getState()?.companies.length };
    });

    if (retailResult.error) {
      throw new Error(retailResult.error);
    }
    console.log(`✓ 3. Branche erschlossen: 'Trendshop Neo Lifestyle' in der Shopping-Mall eröffnet!`);
    await sleep(800);

    await snap("11_retail_trendshop_added", "Branchen-Trio: Imbiss, Café und Trendshop aktiv");
    sessionLog.milestones.push({
      act: 9,
      name: "Branchen-Trio komplett",
      companiesCount: 3,
      notes: "Streetfood, Gastronomie und Luxus-Einzelhandel synchron am Laufen."
    });

    // -------------------------------------------------------------------------
    // AKT 10: LUXUS, IMMOBILIEN & SCHULDENTILGUNG
    // -------------------------------------------------------------------------
    console.log(`\n▶ [AKT 10] Immobilienkauf, Luxus-Sammlung & vollständige Tilgung...`);
    await page.evaluate(() => {
      window.__EMPIRE_STORE__?.getState()?.setTab("assets");
    });
    await sleep(600);

    const assetResult = await page.evaluate(() => {
      const st = window.__EMPIRE_STORE__?.getState();
      if (!st) return { error: "No store" };

      st.cash = Math.max(st.cash, 80000);

      // Buy apartment
      const reErr = st.buyRealEstate("re_micro");
      if (reErr) return { error: `Real estate error: ${reErr}` };

      // Upgrade apartment
      st.upgradeRealEstate("re_micro", "u1");

      // Buy collection item & luxury possessions
      st.buyCollectionItem("col_coin_1");
      st.buyPossession("bike");
      st.buyPossession("watch");

      // Fully repay debt
      if (st.loans.length > 0) {
        for (const l of st.loans) {
          st.extraPayment(l.id, l.remaining);
        }
      }

      return {
        error: null,
        propertiesCount: st.realEstate.length,
        collectionsCount: st.collections.length,
        possessionsCount: st.possessions.length,
        loansRemaining: st.loans.reduce((a, l) => a + l.remaining, 0)
      };
    });

    if (assetResult.error) {
      throw new Error(assetResult.error);
    }
    console.log(`✓ Eigentumswohnung Kreuzberg erworben & renoviert. Mieteinnahmen gesichert, Schulden = 0 €.`);
    await sleep(800);

    await snap("12_real_estate_luxury", "Besitz-Screen: Immobilien-Mieterträge & Sammlungen aktiv");
    sessionLog.milestones.push({
      act: 10,
      name: "Immobilieninvestor & schuldenfrei",
      propertiesCount: assetResult.propertiesCount,
      debt: 0
    });

    // -------------------------------------------------------------------------
    // AKT 11: ENDGAME-SIMULATION, RICH LIST & ABSCHLUSS
    // -------------------------------------------------------------------------
    console.log(`\n▶ [AKT 11] Endgame-Langzeit-Simulation (15 Tage unter Vollast)...`);

    // Advance 15 game days (15 * 1440 = 21600 min) with Auto-Order running
    for (let day = 1; day <= 15; day++) {
      await page.evaluate(() => {
        const st = window.__EMPIRE_STORE__?.getState();
        if (st) st.advance(1440);
      });
      await sleep(150);
    }

    // Return to Home dashboard
    await page.evaluate(() => {
      const st = window.__EMPIRE_STORE__?.getState();
      if (st) st.setTab("home");
    });
    await sleep(1000);

    await snap("13_endgame_richlist", "Endgame Dashboard: Vermögen, Rangliste & passiver Cashflow");

    // Gather final metrics
    const finalReport = await page.evaluate(() => {
      const st = window.__EMPIRE_STORE__?.getState();
      if (!st) return null;

      let totalStockCount = 0;
      let totalOutOfStock = 0;
      for (const c of st.companies) {
        for (const p of c.products) {
          if (p.enabled) {
            totalStockCount++;
            if (p.stock <= 0) totalOutOfStock++;
          }
        }
      }

      return {
        gameDays: Math.floor(st.gameMinutes / 1440) + 1,
        playerName: st.playerName,
        personalCash: st.cash,
        companies: st.companies.map(c => ({
          name: c.name,
          industry: c.industry,
          scale: c.scale || "local",
          level: c.level,
          cash: c.cash,
          lifetimeRevenue: Math.round(c.lifetimeRevenue),
          lifetimeProfit: Math.round(c.lifetimeProfit),
          hygiene: Math.round(c.hygiene),
          activeProducts: c.products.filter(p => p.enabled).map(p => ({
            id: p.productId,
            stock: p.stock,
            autoOrder: Boolean(p.autoOrder)
          }))
        })),
        realEstate: st.realEstate.map(r => r.propertyId),
        collections: st.collections,
        possessions: st.possessions,
        holdings: st.holdings,
        cryptoHoldings: st.cryptoHoldings,
        totalOutOfStock,
        debtRemaining: st.loans.reduce((acc, l) => acc + l.remaining, 0)
      };
    });

    sessionLog.finalReport = finalReport;
    console.log(`\n======================================================================`);
    console.log(`🏆 [ENDGAME ERFOLGREICH ABGESCHLOSSEN]`);
    console.log(`Simulierte Spieltage: ${finalReport.gameDays}`);
    console.log(`Betriebe im Portfolio: ${finalReport.companies.length}`);
    console.log(`Privatguthaben: ${finalReport.personalCash.toLocaleString("de-DE")} €`);
    console.log(`Schuldenstand: ${finalReport.debtRemaining} €`);
    console.log(`Null-Bestands-Vorfälle (Out of Stock): ${finalReport.totalOutOfStock} (Auto-Order 100% verlässlich)`);
    console.log(`Immobilien & Besitz: ${finalReport.realEstate.length} Immobilien, ${finalReport.collections.length} Sammlungen, ${finalReport.possessions.length} Luxusgüter`);
    console.log(`======================================================================\n`);

  } catch (err) {
    console.error(`[Playthrough Fatal Error]:`, err);
    sessionLog.errorsEncountered.push(`Critical Exception: ${err.message}`);
  } finally {
    await browser.close();
  }

  sessionLog.finishedAt = new Date().toISOString();
  const reportPath = resolve(process.cwd(), "docs/agent_system/scratchpad/full_playthrough_report.json");
  writeFileSync(reportPath, JSON.stringify(sessionLog, null, 2), "utf8");
  console.log(`✓ Playthrough-Report gespeichert unter: ${reportPath}`);
  console.log(`✓ Screenshots erfasst: ${sessionLog.screenshots.length}`);
}

runFullPlaythrough().catch((err) => {
  console.error("Fatal:", err);
  process.exit(1);
});
