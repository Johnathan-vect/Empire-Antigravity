#!/usr/bin/env node
import { chromium } from "playwright";
import { mkdirSync, writeFileSync } from "node:fs";
import { resolve, join } from "node:path";

const BASE_URL = process.env.EMPIRE_URL || "http://127.0.0.1:8080";
const SCREENSHOT_DIR = resolve(process.cwd(), "docs/agent_system/screenshots");
mkdirSync(SCREENSHOT_DIR, { recursive: true });

function timestamp() {
  const d = new Date();
  return d.toISOString().replace(/[:.]/g, "-").slice(0, 19);
}

async function runPlaytest() {
  console.log(`[Playtest Harness] Starte automatisierte Persona-Sitzung gegen ${BASE_URL}...`);
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
  const results = {
    timestamp: ts,
    url: BASE_URL,
    screenshots: [],
    metrics: {}
  };

  try {
    // -------------------------------------------------------------------------
    // 1. PERSONA: "Der bequeme Smartphone-Gamer" (lazy-mobile)
    // -------------------------------------------------------------------------
    console.log(`[Playtest] Simuliere 'persona-lazy-mobile' (Viewport: 390x844)...`);
    const mobileContext = await browser.newContext({
      viewport: { width: 390, height: 844 },
      userAgent: "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 Mobile/15E148",
      isMobile: true,
      hasTouch: true
    });
    const mobilePage = await mobileContext.newPage();
    await mobilePage.goto(BASE_URL, { waitUntil: "networkidle", timeout: 15000 }).catch(() => {});
    await mobilePage.waitForTimeout(1000);

    const mobileHomePath = join(SCREENSHOT_DIR, `${ts}_mobile_lazy_dashboard.png`);
    await mobilePage.screenshot({ path: mobileHomePath, fullPage: false });
    results.screenshots.push({ persona: "lazy-mobile", screen: "dashboard", path: mobileHomePath });

    // Messung Scrollhöhe & Viewport-Verhältnis
    const scrollHeight = await mobilePage.evaluate(() => document.documentElement.scrollHeight);
    const viewportHeight = 844;
    const scrollFactor = (scrollHeight / viewportHeight).toFixed(2);
    results.metrics.mobile = {
      scrollHeightPx: scrollHeight,
      scrollFactor: `${scrollFactor}x Viewport`,
      lazyVerdict: scrollHeight > 1300 ? "Zu viel Scrollen für mobile Daumenbedienung!" : "Akzeptable Scroll-Tiefe."
    };

    // Navigiere zu Betrieben / Unternehmen (falls Link vorhanden)
    const companyBtn = mobilePage.locator('button:has-text("Betrieb"), a:has-text("Betrieb"), [data-tab="company"], button:has-text("Imbiss")').first();
    if (await companyBtn.isVisible().catch(() => false)) {
      await companyBtn.click().catch(() => {});
      await mobilePage.waitForTimeout(600);
      const mobileCompPath = join(SCREENSHOT_DIR, `${ts}_mobile_lazy_company.png`);
      await mobilePage.screenshot({ path: mobileCompPath, fullPage: false });
      results.screenshots.push({ persona: "lazy-mobile", screen: "company", path: mobileCompPath });
    }
    await mobileContext.close();

    // -------------------------------------------------------------------------
    // 2. PERSONA: "Der UI/UX- & Design-Purist" (design-purist)
    // -------------------------------------------------------------------------
    console.log(`[Playtest] Simuliere 'persona-design-purist' (Desktop Viewport: 1280x800)...`);
    const desktopContext = await browser.newContext({
      viewport: { width: 1280, height: 800 }
    });
    const desktopPage = await desktopContext.newPage();
    await desktopPage.goto(BASE_URL, { waitUntil: "networkidle", timeout: 15000 }).catch(() => {});
    await desktopPage.waitForTimeout(1000);

    const desktopHomePath = join(SCREENSHOT_DIR, `${ts}_desktop_purist_dashboard.png`);
    await desktopPage.screenshot({ path: desktopHomePath, fullPage: false });
    results.screenshots.push({ persona: "design-purist", screen: "dashboard", path: desktopHomePath });

    // UI-Audit: Prüfe Überschriften, Farbtöne und Buttons
    const uiMetrics = await desktopPage.evaluate(() => {
      const headings = Array.from(document.querySelectorAll("h1, h2, h3")).map(h => h.textContent?.trim());
      const buttons = Array.from(document.querySelectorAll("button")).map(b => b.textContent?.trim()).filter(Boolean);
      return {
        headingCount: headings.length,
        headings: headings.slice(0, 6),
        buttonCount: buttons.length,
        hasVisibleHeader: Boolean(document.querySelector("header"))
      };
    });
    results.metrics.desktop = uiMetrics;

    await desktopContext.close();

  } catch (err) {
    console.error(`[Playtest Harness Fehler]:`, err);
    results.error = err.message;
  } finally {
    await browser.close();
  }

  // Schreibe aggregierten Bericht nach scratchpad
  const reportPath = resolve(process.cwd(), "docs/agent_system/scratchpad/latest_playtest.json");
  writeFileSync(reportPath, JSON.stringify(results, null, 2), "utf8");
  console.log(`[Playtest Harness] Fertig. Bericht gespeichert unter: ${reportPath}`);
  console.log(`[Playtest Harness] Erzeugte Screenshots: ${results.screenshots.length}`);
  return results;
}

runPlaytest().then(() => process.exit(0)).catch((e) => {
  console.error(e);
  process.exit(1);
});
