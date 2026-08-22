import assert from "node:assert/strict";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { chromium } = require("playwright");
const baseUrl = process.env.SCZN3_TEST_BASE_URL || "http://127.0.0.1:8137";
const browser = await chromium.launch({ headless: true, executablePath: process.env.SCZN3_CHROME_EXECUTABLE || undefined });

try {
  for (const viewport of [{ width: 1440, height: 1000 }, { width: 390, height: 844 }]) {
    const context = await browser.newContext({ viewport });
    const page = await context.newPage();
    const errors = [];
    page.on("pageerror", error => errors.push(error.message));
    await page.goto(`${baseUrl}/sec.html?reviewSession=003&v=episode54-item4d`, { waitUntil: "networkidle" });
    const shell = page.locator('[data-sec-shell="universal-v1"][data-sec-record-id="FOUNDER_REVIEW_M4_003"]');
    await shell.waitFor();
    assert.equal(await shell.getAttribute("data-sec-adapter-id"), "m4-zeroing");
    assert.equal(await shell.getAttribute("data-scoring-presentation-family"), "zeroing-correction");
    assert.equal(await shell.getAttribute("data-target-profile-id"), "m4_25m_zero");
    assert.equal(await shell.getAttribute("data-target-profile-version"), "M4_TARGET_AUTHORITY_v1_ORIGINAL");
    assert.equal(await shell.getAttribute("data-publisher-id"), "baker-targets");
    assert.equal(await shell.getAttribute("data-product-id"), "ST-M16A2/M4");
    assert.match(await page.locator(".sec-target-profile-identity").textContent(), /M4 25m Zero.*25 Meter Zero/);
    assert.match(await page.locator("#summarySightCorrection").textContent(), /6/);
    assert.match(await page.locator("#summarySightCorrection").textContent(), /LEFT/);
    assert.match(await page.locator("#summarySightCorrection").textContent(), /5/);
    assert.match(await page.locator("#summarySightCorrection").textContent(), /UP/);
    assert.match(await page.locator("#summaryValidationOutcome").textContent(), /CONFIRMED/);
    assert.deepEqual(await shell.locator("[data-sec-component]").evaluateAll(nodes => [...new Set(nodes.map(node => node.dataset.secComponent))]), ["evidence", "measurement", "result", "recommendation", "execution", "validation", "preservation"], "M4 consumes the complete shared zeroing component set");
    assert.equal(await page.locator("#beforeEvidenceMarkers .impact-marker").count(), 3);
    assert.equal(await page.locator("#confirmationMarkers .impact-marker").count(), 3);
    const target = shell.locator('[data-sec-region="target"]');
    const session = shell.locator('[data-sec-region="session"]');
    const correction = shell.locator('[data-sec-region="sightCorrection"]');
    assert.equal(await target.getAttribute("open"), "");
    assert.equal(await session.getAttribute("open"), null);
    assert.equal(await correction.getAttribute("open"), null);
    await session.locator(":scope > summary").click();
    await page.waitForFunction(() => document.querySelector('[data-sec-region="session"]')?.open && !document.querySelector('[data-sec-region="target"]')?.open);
    await correction.locator(":scope > summary").click();
    await page.waitForFunction(() => document.querySelector('[data-sec-region="sightCorrection"]')?.open && !document.querySelector('[data-sec-region="session"]')?.open);
    await target.locator(":scope > summary").click();
    await page.waitForFunction(() => document.querySelector('[data-sec-region="target"]')?.open && !document.querySelector('[data-sec-region="sightCorrection"]')?.open);
    const authorityParity = await page.evaluate(() => ({
      evidenceHash: window.SCZN3_FOUNDER_REVIEW_SESSION_003.m4AuthorityPackage.evidenceHash,
      confirmationHash: window.SCZN3_FOUNDER_REVIEW_SESSION_003.confirmationAuthorityPackage.evidenceHash,
      initialCount: window.SCZN3_FOUNDER_REVIEW_SESSION_003.impactPoints.length,
      confirmationCount: window.SCZN3_FOUNDER_REVIEW_SESSION_003.confirmationImpactPoints.length
    }));
    assert.deepEqual(authorityParity, {
      evidenceHash: "debcf21d24b6f74e8214dd47ae9ea36cffa7a95b58a92e249fccf5da526350be",
      confirmationHash: "1a55f8b85ad98b71ee579492ff87c0afba0c565d74c209f4a882ffe01c3dd2d3",
      initialCount: 3,
      confirmationCount: 3
    });
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), true, `${viewport.width}px M4 SEC must not overflow`);
    assert.deepEqual(errors, []);
    await context.close();
    console.log(`PASS Episode 54 Item 4D M4 SEC browser parity at ${viewport.width}px`);
  }
} finally {
  await browser.close();
}
