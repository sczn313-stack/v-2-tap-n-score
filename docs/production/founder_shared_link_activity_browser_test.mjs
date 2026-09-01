import assert from "node:assert/strict";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { chromium } = require(process.env.SCZN3_PLAYWRIGHT_PATH || "playwright");
const origin = process.env.SCZN3_REVIEW_ORIGIN || "http://127.0.0.1:8096";
const runId = Date.now();
const browser = await chromium.launch({ headless: true, executablePath: process.env.SCZN3_CHROME_EXECUTABLE || undefined });

try {
  for (const viewport of [{ width: 1280, height: 900 }, { width: 390, height: 844 }]) {
    const context = await browser.newContext({ viewport });
    const page = await context.newPage();
    const suffix = viewport.width === 390 ? "mobile" : "desktop";
    const campaign = `founder-test-${suffix}-${runId}`;
    await page.goto(`${origin}/index.html?ref=${campaign}`, { waitUntil: "networkidle" });
    await page.evaluate(() => {
      SCZN3Ops.recordTstStarted();
      SCZN3Ops.recordTstStarted();
      SCZN3Ops.recordTstCompleted();
      SCZN3Ops.recordSessionStarted({ sessionId: "anonymous-browser-session" });
      SCZN3Ops.recordShowResults({ ok: true });
      SCZN3Ops.recordSessionSaved({ sessionId: "anonymous-browser-session" });
    });
    await page.waitForTimeout(250);
    await page.goto(`${origin}/ops.html?campaign=${campaign}`, { waitUntil: "networkidle" });
    await page.waitForFunction(() => document.querySelector("#opsSystemStatus")?.textContent === "Live");
    const values = await page.locator(".ops-flow-value").allTextContents();
    assert.deepEqual(values.map(value => value.trim()), ["1", "1", "1", "1", "1", "1", "0"]);
    assert.equal(await page.locator("#opsCampaignFilter").inputValue(), campaign);
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), true);
    await context.close();
  }
  console.log("PASS Founder shared-link activity browser dashboard at desktop and 390px");
} finally {
  await browser.close();
}
