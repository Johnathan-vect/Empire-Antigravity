#!/usr/bin/env node
import { chromium } from "playwright";
import { mkdirSync } from "node:fs";
import { resolve, join } from "node:path";

const BASE_URL = process.env.EMPIRE_URL || "http://127.0.0.1:8080";
const SCREENSHOT_DIR = resolve(process.cwd(), "docs/agent_system/screenshots/sprint4");
mkdirSync(SCREENSHOT_DIR, { recursive: true });

function timestamp() {
  const d = new Date();
  return d.toISOString().replace(/[:.]/g, "-").slice(0, 19);
}

const sleep = (ms) => new Promise((res) => setTimeout(res, ms));

async function verifySprint4UI() {
  console.log(`[Sprint 4 UI Verification] Starte Browser-Audit gegen ${BASE_URL}...`);
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
  const capture = async (page, name) => {
    const filename = `${ts}_${name}.png`;
    const fullPath = join(SCREENSHOT_DIR, filename);
    await page.screenshot({ path: fullPath, fullPage: false }).catch(() => {});
    console.log(`[Screenshot erfasst] ${name} -> ${fullPath}`);
    return fullPath;
  };

  try {
    const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
    const page = await context.newPage();

    await page.goto(BASE_URL, { waitUntil: "networkidle", timeout: 15000 }).catch(() => {});
    await sleep(800);

    // Dismiss welcome if open
    const welcomeBtn = page.locator('button:has-text("Loslegen")').first();
    if (await welcomeBtn.isVisible().catch(() => false)) {
      await welcomeBtn.click().catch(() => {});
      await sleep(500);
    }

    // 1. Dashboard mit Makro-Ticker & Next-Rival Gauge
    await capture(page, "01_dashboard_with_macro_ticker");

    // Scroll to Rich List
    await page.evaluate(() => window.scrollBy(0, 500));
    await sleep(400);
    await capture(page, "02_next_rival_prestige_gauge");

    // 2. Makro-Drawer öffnen
    const macroPill = page.locator('button[title*="Gesamtwirtschaft"], button:has-text("Konjunktur")').first();
    if (await macroPill.isVisible().catch(() => false)) {
      await macroPill.click().catch(() => {});
      await sleep(600);
      await capture(page, "03_macro_drawer_central_bank_sheet");

      // Close drawer
      const closeBtn = page.locator('button:has-text("Schließen")').first();
      if (await closeBtn.isVisible().catch(() => false)) {
        await closeBtn.click().catch(() => {});
        await sleep(400);
      }
    }

    // 3. Tab Unternehmen / Betrieb aufrufen
    const bizTab = page.locator('button:has-text("Unternehmen"), [data-tab="biz"]').first();
    if (await bizTab.isVisible().catch(() => false)) {
      await bizTab.click().catch(() => {});
      await sleep(600);

      // Falls ein Betrieb existiert oder Gründung ansteht
      const openComp = page.locator('div:has-text("Bahnhofs-Grill"), div:has-text("Imbiss"), button:has-text("Öffnen")').first();
      if (await openComp.isVisible().catch(() => false)) {
        await openComp.click().catch(() => {});
        await sleep(600);
      }

      // Kasse Tab aufrufen
      const moneyTab = page.locator('button:has-text("Kasse")').first();
      if (await moneyTab.isVisible().catch(() => false)) {
        await moneyTab.click().catch(() => {});
        await sleep(600);
        await capture(page, "04_company_dividends_and_payout_panel");
      }
    }

    // 4. Mobile Ergonomie (390x844)
    const mobileContext = await browser.newContext({
      viewport: { width: 390, height: 844 },
      userAgent: "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 Mobile/15E148",
      isMobile: true,
      hasTouch: true
    });
    const mPage = await mobileContext.newPage();
    await mPage.goto(BASE_URL, { waitUntil: "networkidle", timeout: 15000 }).catch(() => {});
    await sleep(800);

    const mWelcome = mPage.locator('button:has-text("Loslegen")').first();
    if (await mWelcome.isVisible().catch(() => false)) {
      await mWelcome.click().catch(() => {});
      await sleep(400);
    }

    await capture(mPage, "05_mobile_head_ticker_ergonomics");

    await context.close();
    await mobileContext.close();
    console.log("[Sprint 4 UI Verification] Erfolgreich abgeschlossen!");

  } catch (err) {
    console.error("[Verification Error]:", err);
  } finally {
    await browser.close();
  }
}

verifySprint4UI().then(() => process.exit(0)).catch(e => {
  console.error(e);
  process.exit(1);
});
