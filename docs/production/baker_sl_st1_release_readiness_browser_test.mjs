import assert from "node:assert/strict";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { chromium } = require("playwright");
const baseUrl = process.env.SCZN3_TEST_BASE_URL || "http://127.0.0.1:8101";

const browser = await chromium.launch({
  headless: true,
  executablePath: process.env.SCZN3_CHROME_EXECUTABLE || undefined
});

try {
  for (const viewport of [{ width: 1440, height: 1000 }, { width: 390, height: 844 }]) {
    const context = await browser.newContext({ viewport });
    const page = await context.newPage();
    const errors = [];
    page.on("pageerror", error => errors.push(error.message));

    await page.goto(`${baseUrl}/index.html?release-readiness=${viewport.width}`, { waitUntil: "networkidle" });
    const card = page.locator('[data-experience-id="uspsa-practice-target"]');
    assert.equal(await card.getAttribute("data-status"), "available");
    assert.match(await card.getAttribute("aria-label"), /Tap to begin Baker SL-ST1 — USPSA/);
    assert.doesNotMatch(await card.textContent(), /Coming Soon/i);
    await card.click();
    await page.waitForURL(url => url.pathname.endsWith("/t/baker/sl-st1/"));

    const identity = page.locator(".sl-header-target-identity");
    assert.equal((await identity.textContent()).replace(/\s+/g, " ").trim(), "Baker SL-ST1 • USPSA");
    assert.equal(await identity.isVisible(), true);
    assert.equal(await page.getByLabel("Open navigation").isVisible(), true);
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), true);
    assert.deepEqual(await page.evaluate(() => JSON.parse(sessionStorage.getItem("SCZN3_PENDING_TARGET_PROFILE"))), { targetId: "BAKER_SL_ST1" });
    assert.deepEqual(errors, []);

    await context.close();
    console.log(`PASS Baker SL-ST1 release readiness at ${viewport.width}px`);
  }
} finally {
  await browser.close();
}
