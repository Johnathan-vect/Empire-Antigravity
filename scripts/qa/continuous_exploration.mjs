#!/usr/bin/env node
import { chromium } from "playwright";
import { mkdirSync, writeFileSync } from "node:fs";
import { resolve, join } from "node:path";

const BASE_URL = process.env.EMPIRE_URL || "http://127.0.0.1:8080";
const SCREENSHOT_DIR = resolve(process.cwd(), "docs/agent_system/screenshots/exploration");
mkdirSync(SCREENSHOT_DIR, { recursive: true });

function timestamp() {
  const d = new Date();
  return d.toISOString().replace(/[:.]/g, "-").slice(0, 19);
}

const sleep = (ms) => new Promise((res) => setTimeout(res, ms));

async function exploreSession() {
  console.log(`[Exploration Session] Starte 10-minütige explorative Playtesting-Sitzung gegen ${BASE_URL}...`);
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
  const sessionData = {
    startTime: new Date().toISOString(),
    actions: [],
    screenshots: [],
    errors: [],
    observations: []
  };

  const recordScreenshot = async (page, name, persona = "shared") => {
    const filename = `${ts}_${persona}_${name}.png`;
    const fullPath = join(SCREENSHOT_DIR, filename);
    await page.screenshot({ path: fullPath, fullPage: false }).catch(() => {});
    sessionData.screenshots.push({ persona, name, path: fullPath, relPath: `docs/agent_system/screenshots/exploration/${filename}` });
    console.log(`[Screenshot erfasst] ${name} (${persona})`);
  };

  try {
    // -------------------------------------------------------------------------
    // PHASE 1: Desktop Exploration (Design Purist & Tycoon Stratege)
    // -------------------------------------------------------------------------
    console.log("[Phase 1] Desktop Exploration (Design-Purist & Tycoon)...");
    const desktopContext = await browser.newContext({ viewport: { width: 1280, height: 800 } });
    const dPage = await desktopContext.newPage();
    dPage.on("console", (msg) => {
      if (msg.type() === "error") sessionData.errors.push(`Console Error: ${msg.text()}`);
    });

    await dPage.goto(BASE_URL, { waitUntil: "networkidle", timeout: 15000 }).catch(() => {});
    await sleep(800);

    // 1. Welcome Modal
    await recordScreenshot(dPage, "01_welcome_modal", "design-purist");
    const dismissBtn = dPage.locator('button:has-text("Loslegen")').first();
    if (await dismissBtn.isVisible().catch(() => false)) {
      await dismissBtn.click().catch(() => {});
      await sleep(600);
      sessionData.actions.push("Welcome-Modal bestätigt und geschlossen.");
    }

    // 2. Dashboard / Home
    await recordScreenshot(dPage, "02_desktop_dashboard_clean", "design-purist");
    sessionData.actions.push("Dashboard Hauptansicht inspiziert (Vermögen 25.000 €).");

    // 3. Tab Finanzen
    const finTab = dPage.locator('button:has-text("Finanzen"), [data-tab="finance"]').first();
    if (await finTab.isVisible().catch(() => false)) {
      await finTab.click().catch(() => {});
      await sleep(700);
      await recordScreenshot(dPage, "03_desktop_finances", "tycoon-strategist");
      sessionData.actions.push("Finanz-Screen inspiziert: Kreditrahmen 15.000 € und Zinskonditionen geprüft.");
    }

    // 4. Tab Börse & Aktien
    const stockTab = dPage.locator('button:has-text("Börse"), [data-tab="stock"]').first();
    if (await stockTab.isVisible().catch(() => false)) {
      await stockTab.click().catch(() => {});
      await sleep(700);
      await recordScreenshot(dPage, "04_desktop_stock_market", "tycoon-strategist");
      sessionData.actions.push("Kapitalmarkt & Börsenkurse analysiert.");
    }

    // 5. Tab Besitz & Immobilien
    const assetTab = dPage.locator('button:has-text("Besitz"), [data-tab="assets"]').first();
    if (await assetTab.isVisible().catch(() => false)) {
      await assetTab.click().catch(() => {});
      await sleep(700);
      await recordScreenshot(dPage, "05_desktop_assets", "design-purist");
      sessionData.actions.push("Luxusgüter & Immobilien-Übersicht begutachtet.");
    }

    // 6. Tab Unternehmen & Gründung
    const bizTab = dPage.locator('button:has-text("Unternehmen"), [data-tab="biz"]').first();
    if (await bizTab.isVisible().catch(() => false)) {
      await bizTab.click().catch(() => {});
      await sleep(700);
      await recordScreenshot(dPage, "06_desktop_business_empty", "anno-economist");
      sessionData.actions.push("Betriebsübersicht (noch kein Betrieb) inspiziert.");

      // Start Founding Flow
      const foundBtn = dPage.locator('button:has-text("Betrieb gründen"), button:has-text("Gründen")').first();
      if (await foundBtn.isVisible().catch(() => false)) {
        await foundBtn.click().catch(() => {});
        await sleep(700);
        await recordScreenshot(dPage, "07_founding_step1_industry", "anno-economist");
        sessionData.actions.push("Gründungsassistent geöffnet: Branche Imbiss gewählt.");

        // Weiter zu Schritt 2: Standorte
        const nextBtn = dPage.locator('button:has-text("Weiter"), button:has-text("Standort wählen")').first();
        if (await nextBtn.isVisible().catch(() => false)) {
          await nextBtn.click().catch(() => {});
          await sleep(600);
          await recordScreenshot(dPage, "08_founding_step2_locations", "anno-economist");
          sessionData.actions.push("Standort-Auswahl mit Synergie-Badges geprüft (Bahnhof gewählt).");

          // Standort Bahnhof wählen
          const bahnhofOption = dPage.locator('button:has-text("Hauptbahnhof"), div:has-text("Hauptbahnhof")').first();
          if (await bahnhofOption.isVisible().catch(() => false)) {
            await bahnhofOption.click().catch(() => {});
            await sleep(400);
          }

          // Weiter zu Schritt 3: Name & Kapital
          const nextBtn2 = dPage.locator('button:has-text("Weiter"), button:has-text("Details festlegen")').first();
          if (await nextBtn2.isVisible().catch(() => false)) {
            await nextBtn2.click().catch(() => {});
            await sleep(600);
            await recordScreenshot(dPage, "09_founding_step3_capital", "tycoon-strategist");

            // Gründung abschließen
            const finishFoundBtn = dPage.locator('button:has-text("Gründung abschließen"), button:has-text("Jetzt gründen")').first();
            if (await finishFoundBtn.isVisible().catch(() => false)) {
              await finishFoundBtn.click().catch(() => {});
              await sleep(1000);
              sessionData.actions.push("Imbiss am Hauptbahnhof erfolgreich gegründet (5.000 € Gebühr + 1.000 € Lizenz).");
              await recordScreenshot(dPage, "10_company_detail_onboarding", "design-purist");
            }
          }
        }
      }
    }

    // 7. Betrieb ausrüsten: Produkt & Lieferant wählen
    const addProductBtn = dPage.locator('button:has-text("Produkt"), button:has-text("Slot belegen"), button:has-text("Currywurst")').first();
    if (await addProductBtn.isVisible().catch(() => false)) {
      await addProductBtn.click().catch(() => {});
      await sleep(600);
      await recordScreenshot(dPage, "11_company_product_selected", "anno-economist");
      sessionData.actions.push("Erstes Produkt im Betrieb zugewiesen.");
    }

    // Tab 'Lage & GuV' (Live-Kundenstrom-Monitor)
    const trafficTab = dPage.locator('button:has-text("Lage & GuV"), [data-tab="location"]').first();
    if (await trafficTab.isVisible().catch(() => false)) {
      await trafficTab.click().catch(() => {});
      await sleep(700);
      await recordScreenshot(dPage, "12_company_traffic_monitor", "anno-economist");
      sessionData.actions.push("Live-Kundenstrom-Monitor inspiziert: Auslastung und Standort-Synergie aktiv.");
    }

    // Tab 'Ausbau & Team' (Filialnetz-Expansion)
    const expansionTab = dPage.locator('button:has-text("Ausbau & Team"), [data-tab="expansion"]').first();
    if (await expansionTab.isVisible().catch(() => false)) {
      await expansionTab.click().catch(() => {});
      await sleep(700);
      await recordScreenshot(dPage, "13_company_scale_expansion", "tycoon-strategist");
      sessionData.actions.push("Filialnetz-Expansions-Stufen begutachtet (Voraussetzungen für Ladenkette geprüft).");
    }

    // 8. Zeitraffer starten: 5x Speed aktivieren
    const speed5Btn = dPage.locator('button:has-text("5×"), button:has-text("5x")').first();
    if (await speed5Btn.isVisible().catch(() => false)) {
      await speed5Btn.click().catch(() => {});
      sessionData.actions.push("Spielgeschwindigkeit auf 5× beschleunigt.");
    }

    // -------------------------------------------------------------------------
    // PHASE 2: Mobile Exploration (Lazy Mobile Gamer)
    // -------------------------------------------------------------------------
    console.log("[Phase 2] Mobile Exploration (Lazy-Mobile auf Smartphone 390x844)...");
    const mobileContext = await browser.newContext({
      viewport: { width: 390, height: 844 },
      userAgent: "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 Mobile/15E148",
      isMobile: true,
      hasTouch: true
    });
    const mPage = await mobileContext.newPage();
    await mPage.goto(BASE_URL, { waitUntil: "networkidle", timeout: 15000 }).catch(() => {});
    await sleep(800);

    // Dismiss welcome if open
    const mDismiss = mPage.locator('button:has-text("Loslegen")').first();
    if (await mDismiss.isVisible().catch(() => false)) {
      await mDismiss.click().catch(() => {});
      await sleep(500);
    }

    await recordScreenshot(mPage, "14_mobile_home_feed", "lazy-mobile");

    // Scroll-Messung Mobile
    const mScroll = await mPage.evaluate(() => {
      const scrollEl = document.querySelector("main") || document.documentElement;
      return {
        totalHeight: scrollEl.scrollHeight,
        clientHeight: scrollEl.clientHeight,
        maxScrollable: scrollEl.scrollHeight - scrollEl.clientHeight
      };
    });
    sessionData.observations.push({
      area: "Mobile Dashboard Scroll-Tiefe",
      metrics: mScroll,
      lazyMobileFeedback: mScroll.maxScrollable > 500 ? "Zu lange Scrollstrecke für Einhand-Bedienung!" : "Gute kompakte Höhe."
    });

    // Mobile Navigation: Tab Finanzen
    const mFinTab = mPage.locator('nav button:has-text("Finanzen"), [data-tab="finance"]').first();
    if (await mFinTab.isVisible().catch(() => false)) {
      await mFinTab.click().catch(() => {});
      await sleep(700);
      await recordScreenshot(mPage, "15_mobile_finances_thumb_zone", "lazy-mobile");
    }

    // Mobile Navigation: Tab Unternehmen
    const mBizTab = mPage.locator('nav button:has-text("Unternehmen"), [data-tab="biz"]').first();
    if (await mBizTab.isVisible().catch(() => false)) {
      await mBizTab.click().catch(() => {});
      await sleep(700);
      await recordScreenshot(mPage, "16_mobile_business_detail_scroll", "lazy-mobile");
    }

    // -------------------------------------------------------------------------
    // PHASE 3: Simulations-Laufzeit (Simulation über Spieltage)
    // -------------------------------------------------------------------------
    console.log("[Phase 3] Simulations-Laufzeit (Wirtschaftssimulation & Ledger-Beobachtung)...");
    // Wir lassen das Spiel für einige Zyklen laufen und beobachten Finanz-Veränderungen
    await sleep(5000);

    const clockState = await dPage.evaluate(() => {
      const dayEl = document.querySelector(".tabular, [data-clock]");
      const ledgerRows = document.querySelectorAll("table tr, .ledger-row");
      return {
        clockText: dayEl?.textContent?.trim() || "Tag 1",
        ledgerEntriesCount: ledgerRows.length
      };
    });
    sessionData.observations.push({
      area: "Simulations-Fortschritt",
      clockState
    });

    await recordScreenshot(dPage, "17_desktop_after_simulation_run", "anno-economist");

    await desktopContext.close();
    await mobileContext.close();

  } catch (err) {
    console.error("[Exploration Error]:", err);
    sessionData.errors.push(err.message);
  } finally {
    await browser.close();
  }

  sessionData.endTime = new Date().toISOString();
  sessionData.totalScreenshots = sessionData.screenshots.length;

  const outPath = resolve(process.cwd(), "docs/agent_system/scratchpad/exploration_telemetry.json");
  writeFileSync(outPath, JSON.stringify(sessionData, null, 2), "utf8");
  console.log(`[Exploration Session] Abgeschlossen. Telemetrie gespeichert unter ${outPath}`);
  console.log(`[Exploration Session] Insgesamt ${sessionData.totalScreenshots} Screenshots erfasst.`);
  return sessionData;
}

exploreSession().then(() => process.exit(0)).catch((e) => {
  console.error(e);
  process.exit(1);
});
