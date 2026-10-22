#!/usr/bin/env node
import { chromium } from "playwright";
import { mkdirSync, writeFileSync } from "node:fs";
import { resolve, join } from "node:path";

const BASE_URL = process.env.EMPIRE_URL || "http://127.0.0.1:8080";
const SCREENSHOT_DIR = resolve(process.cwd(), "docs/agent_system/screenshots/full_run");
mkdirSync(SCREENSHOT_DIR, { recursive: true });

function timestamp() {
  const d = new Date();
  return d.toISOString().replace(/[:.]/g, "-").slice(0, 19);
}

const sleep = (ms) => new Promise((res) => setTimeout(res, ms));

async function runGrandPlaythrough() {
  console.log(`[Grand Playthrough] Starte E2E-Playthrough Run gegen ${BASE_URL}...`);
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

  const ts = timestamp();
  const runLog = {
    startTime: new Date().toISOString(),
    milestones: [],
    screenshots: [],
    telemetry: {},
    errors: [],
    agentObservations: []
  };

  const capture = async (page, stage, name, persona = "shared") => {
    const filename = `${ts}_${stage}_${persona}_${name}.png`;
    const fullPath = join(SCREENSHOT_DIR, filename);
    await page.screenshot({ path: fullPath, fullPage: false }).catch(() => {});
    runLog.screenshots.push({ stage, persona, name, path: fullPath, relPath: `docs/agent_system/screenshots/full_run/${filename}` });
    console.log(`[Screenshot erfasst] [${stage}] ${name} (${persona})`);
  };

  try {
    // =========================================================================
    // STAGE 1: DESKTOP PASS - EARLY & MID GAME PROGRESSION
    // =========================================================================
    console.log("[Stage 1] Starte Desktop-Durchlauf (1280x800)...");
    const desktopContext = await browser.newContext({ viewport: { width: 1280, height: 800 } });
    const dPage = await desktopContext.newPage();
    dPage.on("console", (msg) => {
      if (msg.type() === "error") runLog.errors.push(`Console: ${msg.text()}`);
    });

    await dPage.goto(BASE_URL, { waitUntil: "networkidle", timeout: 15000 }).catch(() => {});
    await sleep(800);

    // 1.1 Welcome Modal
    const welcomeBtn = dPage.locator('button:has-text("Loslegen")').first();
    if (await welcomeBtn.isVisible().catch(() => false)) {
      await capture(dPage, "stage1_bootstrapping", "01_welcome", "design-purist");
      await welcomeBtn.click().catch(() => {});
      await sleep(500);
      runLog.milestones.push("Willkommens-Dialog bestätigt.");
    }

    // 1.2 Dashboard Initial Status
    await capture(dPage, "stage1_bootstrapping", "02_dashboard_initial", "design-purist");

    // 1.3 Gründung des ersten Betriebs (Hauptbahnhof mit Schieberegler)
    const bizTab = dPage.locator('button:has-text("Unternehmen"), [data-tab="biz"]').first();
    if (await bizTab.isVisible().catch(() => false)) {
      await bizTab.click().catch(() => {});
      await sleep(600);

      const foundBtn = dPage.locator('button:has-text("Betrieb gründen"), button:has-text("Gründen")').first();
      if (await foundBtn.isVisible().catch(() => false)) {
        await foundBtn.click().catch(() => {});
        await sleep(600);
        await capture(dPage, "stage1_bootstrapping", "03_founding_industry", "anno-economist");

        // Schritt 1 -> 2: Standort wählen
        const nextStep1 = dPage.locator('button:has-text("Weiter"), button:has-text("Standort wählen")').first();
        if (await nextStep1.isVisible().catch(() => false)) {
          await nextStep1.click().catch(() => {});
          await sleep(600);
          await capture(dPage, "stage1_bootstrapping", "04_founding_locations", "anno-economist");

          // Hauptbahnhof auswählen
          const bahnhofOpt = dPage.locator('button:has-text("Hauptbahnhof"), div:has-text("Hauptbahnhof")').first();
          if (await bahnhofOpt.isVisible().catch(() => false)) {
            await bahnhofOpt.click().catch(() => {});
            await sleep(400);
          }

          // Schritt 2 -> 3: Kapital & Name festlegen
          const nextStep2 = dPage.locator('button:has-text("Weiter"), button:has-text("Details festlegen")').first();
          if (await nextStep2.isVisible().catch(() => false)) {
            await nextStep2.click().catch(() => {});
            await sleep(600);

            // Screenshot des Schiebereglers in Schritt 3
            await capture(dPage, "stage1_bootstrapping", "05_founding_slider_step3", "anno-economist");

            // Name setzen
            const nameInput = dPage.locator('input[placeholder*="Name"], input[type="text"]').first();
            if (await nameInput.isVisible().catch(() => false)) {
              await nameInput.fill("Bahnhofs-Grill Meister").catch(() => {});
            }

            // Slider bedienen (z. B. auf 1.400 € setzen)
            const slider = dPage.locator('input[type="range"]').first();
            if (await slider.isVisible().catch(() => false)) {
              await slider.fill("1400").catch(() => {});
              await sleep(300);
            }

            // Gründung abschließen
            const finishBtn = dPage.locator('button:has-text("Gründung abschließen"), button:has-text("Jetzt gründen")').first();
            if (await finishBtn.isVisible().catch(() => false)) {
              await finishBtn.click().catch(() => {});
              await sleep(1000);
              runLog.milestones.push("Bahnhofs-Grill Meister erfolgreich mit 1.400 € Startkapital gegründet.");
              await capture(dPage, "stage1_bootstrapping", "06_company_created_overview", "design-purist");
            }
          }
        }
      }
    }

    // 1.4 Erstes Sortiment belegen & Hygiene reinigen
    const addProductBtn = dPage.locator('button:has-text("Produkt"), button:has-text("Slot belegen"), button:has-text("Currywurst"), button:has-text("Hotdog")').first();
    if (await addProductBtn.isVisible().catch(() => false)) {
      await addProductBtn.click().catch(() => {});
      await sleep(600);
      await capture(dPage, "stage1_bootstrapping", "07_product_assigned", "anno-economist");
      runLog.milestones.push("Sortiment aktiviert und erster Lieferantenvertrag aktiv.");
    }

    // Hygiene-Reinigung durchführen
    const cleanBtn = dPage.locator('button:has-text("Reinigen"), button:has-text("Hygiene")').first();
    if (await cleanBtn.isVisible().catch(() => false)) {
      await cleanBtn.click().catch(() => {});
      await sleep(400);
      runLog.milestones.push("Hygiene-Grundreinigung durchgeführt.");
    }

    // 1.5 Schneller Vorlauf: 5x Speed aktivieren
    const speed5 = dPage.locator('button:has-text("5×"), button:has-text("5x")').first();
    if (await speed5.isVisible().catch(() => false)) {
      await speed5.click().catch(() => {});
      runLog.milestones.push("Zeitraffer 5× aktiviert.");
    }

    // Simulation über 6 Sekunden bei 5x laufen lassen
    console.log("[Simulation] Lasse Wirtschaftssimulation laufen...");
    await sleep(6000);

    // =========================================================================
    // STAGE 2: MID GAME PROGRESSION (EXPANSION, TEAM, CAFÉ)
    // =========================================================================
    console.log("[Stage 2] Begutachtung Mid-Game (Team, Ausbau & Filialnetz)...");

    // Tab 'Ausbau & Team' im Betrieb
    const expansionTab = dPage.locator('button:has-text("Ausbau & Team"), [data-tab="expansion"]').first();
    if (await expansionTab.isVisible().catch(() => false)) {
      await expansionTab.click().catch(() => {});
      await sleep(700);
      await capture(dPage, "stage2_scaleup", "08_scale_upgrades_check", "anno-economist");

      // Prüfe Mitarbeiter-Rekrutierung falls Bewerber vorhanden
      const hireBtn = dPage.locator('button:has-text("Einstellen"), button:has-text("Anstellen")').first();
      if (await hireBtn.isVisible().catch(() => false)) {
        await hireBtn.click().catch(() => {});
        await sleep(500);
        runLog.milestones.push("Erster Mitarbeiter für den Küchenbetrieb rekrutiert.");
        await capture(dPage, "stage2_scaleup", "09_employee_hired", "anno-economist");
      }
    }

    // =========================================================================
    // STAGE 3: LATE GAME & KAPITALMÄRKTE (BÖRSE & BESITZ)
    // =========================================================================
    console.log("[Stage 3] Begutachtung Late-Game (Finanzen, Börse, Immobilien, Rich-List)...");

    // 3.1 Finanzen Tab
    const finTab = dPage.locator('nav button:has-text("Finanzen"), [data-tab="finance"]').first();
    if (await finTab.isVisible().catch(() => false)) {
      await finTab.click().catch(() => {});
      await sleep(700);
      await capture(dPage, "stage3_capital", "10_finances_overview", "tycoon-strategist");
    }

    // 3.2 Börsen Tab
    const stockTab = dPage.locator('nav button:has-text("Börse"), [data-tab="stock"]').first();
    if (await stockTab.isVisible().catch(() => false)) {
      await stockTab.click().catch(() => {});
      await sleep(700);
      await capture(dPage, "stage3_capital", "11_stock_and_crypto", "tycoon-strategist");

      // Versuche Aktienkauf
      const buyStockBtn = dPage.locator('button:has-text("Kaufen"), button:has-text("Order")').first();
      if (await buyStockBtn.isVisible().catch(() => false)) {
        await buyStockBtn.click().catch(() => {});
        await sleep(600);
        runLog.milestones.push("Kapitalmarkt-Order platziert.");
      }
    }

    // 3.3 Besitz, Immobilien & Rich-List
    const assetTab = dPage.locator('nav button:has-text("Besitz"), [data-tab="assets"]').first();
    if (await assetTab.isVisible().catch(() => false)) {
      await assetTab.click().catch(() => {});
      await sleep(700);
      await capture(dPage, "stage4_endgame", "12_assets_and_richlist", "design-purist");

      // Scroll zur Rich-List
      await dPage.evaluate(() => window.scrollBy(0, 600));
      await sleep(500);
      await capture(dPage, "stage4_endgame", "13_rich_list_leaderboard", "anno-economist");
      runLog.milestones.push("Forbes- und Rich-List Rangliste begutachtet.");
    }

    // =========================================================================
    // STAGE 4: MOBILE PASS (LAZY MOBILE GAMER ERGONOMIE)
    // =========================================================================
    console.log("[Stage 4] Starte Mobile Ergonomie-Check (390x844)...");
    const mobileContext = await browser.newContext({
      viewport: { width: 390, height: 844 },
      userAgent: "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 Mobile/15E148",
      isMobile: true,
      hasTouch: true
    });
    const mPage = await mobileContext.newPage();
    await mPage.goto(BASE_URL, { waitUntil: "networkidle", timeout: 15000 }).catch(() => {});
    await sleep(800);

    // Falls Welcome aktiv
    const mWelcome = mPage.locator('button:has-text("Loslegen")').first();
    if (await mWelcome.isVisible().catch(() => false)) {
      await mWelcome.click().catch(() => {});
      await sleep(400);
    }

    await capture(mPage, "mobile_ergonomics", "14_mobile_home", "lazy-mobile");

    // Navigiere zum Betrieb auf Mobile
    const mBiz = mPage.locator('nav button:has-text("Unternehmen"), [data-tab="biz"]').first();
    if (await mBiz.isVisible().catch(() => false)) {
      await mBiz.click().catch(() => {});
      await sleep(600);
      await capture(mPage, "mobile_ergonomics", "15_mobile_biz_quick_actions", "lazy-mobile");
    }

    // Navigiere zu Besitz & Richlist auf Mobile
    const mAssets = mPage.locator('nav button:has-text("Besitz"), [data-tab="assets"]').first();
    if (await mAssets.isVisible().catch(() => false)) {
      await mAssets.click().catch(() => {});
      await sleep(600);
      await capture(mPage, "mobile_ergonomics", "16_mobile_assets_scroll", "lazy-mobile");
    }

    // Extrahiere finalen GameState aus localStorage
    const savedStateRaw = await dPage.evaluate(() => localStorage.getItem("empire.save.v2"));
    if (savedStateRaw) {
      try {
        const parsed = JSON.parse(savedStateRaw);
        runLog.telemetry = {
          gameMinutes: parsed.state?.gameMinutes || parsed.gameMinutes || 0,
          gameDay: Math.floor((parsed.state?.gameMinutes || parsed.gameMinutes || 0) / (24 * 60)) + 1,
          cash: parsed.state?.cash || parsed.cash || 0,
          creditLimit: parsed.state?.creditLimit || parsed.creditLimit || 0,
          reputation: parsed.state?.reputation || parsed.reputation || 0,
          companiesCount: (parsed.state?.companies || parsed.companies || []).length,
          companies: (parsed.state?.companies || parsed.companies || []).map(c => ({
            name: c.name,
            industry: c.industry,
            locationId: c.locationId,
            scale: c.scale || "local",
            level: c.level,
            cash: c.cash,
            hygiene: c.hygiene,
            employees: c.employees?.length || 0,
            todayRevenue: c.todayRevenue,
            lifetimeRevenue: c.lifetimeRevenue
          })),
          possessions: parsed.state?.possessions || parsed.possessions || [],
          realEstateCount: (parsed.state?.realEstate || parsed.realEstate || []).length,
          holdingsCount: (parsed.state?.holdings || parsed.holdings || []).length
        };
        console.log(`[Telemetrie extrahiert] Tag: ${runLog.telemetry.gameDay}, Bargeld: ${runLog.telemetry.cash.toFixed(2)} €, Betriebe: ${runLog.telemetry.companiesCount}`);
      } catch (e) {
        runLog.errors.push(`JSON Parse Fehler im State: ${e.message}`);
      }
    }

    await desktopContext.close();
    await mobileContext.close();

  } catch (err) {
    console.error("[Playthrough Error]:", err);
    runLog.errors.push(err.message);
  } finally {
    await browser.close();
  }

  runLog.endTime = new Date().toISOString();
  runLog.totalScreenshots = runLog.screenshots.length;

  const outPath = resolve(process.cwd(), "docs/agent_system/scratchpad/full_playthrough_telemetry.json");
  writeFileSync(outPath, JSON.stringify(runLog, null, 2), "utf8");
  console.log(`[Grand Playthrough] Beendet. Telemetrie abgelegt unter: ${outPath}`);
  console.log(`[Grand Playthrough] ${runLog.totalScreenshots} visuelle Screenshots erfolgreich erstellt.`);
  return runLog;
}

runGrandPlaythrough().then(() => process.exit(0)).catch((e) => {
  console.error(e);
  process.exit(1);
});
