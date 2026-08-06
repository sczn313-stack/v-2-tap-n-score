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
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, reducedMotion: "no-preference" });
  await context.route("**/api/session/prepare", async route => {
    const request = route.request().postDataJSON();
    const targetId = request.targetId;
    const category = targetId === "gssf_ac_1" ? "Pistol" : "Rifle";
    const candidate = {
      candidateId: `standard-${targetId}`, weaponCategory: category, manufacturer: "Standard Setup",
      modelType: category, modelCaliber: "Shooter ammunition", opticType: category === "Pistol" ? "Pistol sights" : "Scope",
      adjustmentUnit: category === "Pistol" ? "" : "MOA", clickValue: category === "Pistol" ? null : 0.25,
      source: "backend_standard_setup", setupAuthority: "backend-target-authority", setupAuthorityId: `authority-${targetId}`,
      displayFields: [{ label: "Firearm", value: category }]
    };
    await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({
      ok: true, status: "prepared", preparationToken: `prepare-${targetId}`, expiresAt: "2026-08-05T23:59:59+00:00",
      target: { targetId }, missionIdentity: {}, governedDistance: {},
      equipmentRequirements: { weaponCategories: [category] }, standardSetup: candidate, setupMode: "standard",
      compatibilityResults: [{ candidateId: candidate.candidateId, compatible: true, reasons: ["requirements_satisfied"] }]
    }) });
  });

  const page = await context.newPage();
  await page.goto(`${baseUrl}/index.html`, { waitUntil: "networkidle" });
  assert.match(await page.locator("#catalogTitle").textContent(), /TAP\s*your target below/);
  assert.equal(await page.locator('.ecosystem-target-card[data-status="available"]').count(), 3);
  assert.equal(await page.locator('.ecosystem-target-card[data-status="coming-soon"]').evaluateAll(cards => cards.every(card => card.tagName === "ARTICLE" && getComputedStyle(card).cursor !== "pointer")), true);
  assert.equal(await page.locator('.ecosystem-target-card[data-status="available"]').evaluateAll(cards => cards.every(card => card.tagName === "A" && /Launch/.test(card.textContent))), true);
  assert.equal(await page.locator('.ecosystem-target-card[data-status="available"].is-discovery-cued').count(), 3);
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), true);

  await page.locator('[data-experience-id="gssf-practice-target"]').click();
  await page.waitForURL(url => url.pathname.endsWith("/matrix.html") && url.searchParams.get("target_profile_id") === "gssf_ac_1");
  await page.locator("#standardSetupPanel:not(.is-hidden)").waitFor();
  const pending = await page.evaluate(() => JSON.parse(sessionStorage.getItem("SCZN3_PENDING_TARGET_PROFILE")));
  assert.deepEqual(pending, { targetId: "gssf_ac_1" });
  assert.equal(await page.evaluate(() => localStorage.getItem("SCZN3_BAKER_ACTIVE_SESSION")), null);

  await page.goBack({ waitUntil: "networkidle" });
  assert.equal(await page.locator('[data-experience-id="gssf-practice-target"]').count(), 1);
  assert.equal(await page.evaluate(() => localStorage.getItem("SCZN3_BAKER_ACTIVE_SESSION")), null);
  assert.deepEqual(await page.evaluate(() => JSON.parse(sessionStorage.getItem("SCZN3_PENDING_TARGET_PROFILE"))), { targetId: "gssf_ac_1" });
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), true);
  await context.close();
  console.log("PASS Home target discovery, pending identity, inactive Coming Soon, and Browser Back contract");

  const reducedContext = await browser.newContext({ viewport: { width: 390, height: 844 }, reducedMotion: "reduce" });
  const reducedPage = await reducedContext.newPage();
  await reducedPage.goto(`${baseUrl}/index.html`, { waitUntil: "networkidle" });
  const reducedAnimation = await reducedPage.locator('.ecosystem-target-card[data-status="available"]').first().evaluate(card => getComputedStyle(card).animationName);
  assert.equal(reducedAnimation, "none");
  await reducedContext.close();
  console.log("PASS reduced-motion discovery cue contract");

  const visitContext = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const visitPage = await visitContext.newPage();
  for (let visit = 1; visit <= 4; visit += 1) {
    await visitPage.goto(`${baseUrl}/index.html?catalog_test_view=${visit}`, { waitUntil: "domcontentloaded" });
    const cueCount = await visitPage.locator('.ecosystem-target-card[data-status="available"].is-discovery-cued').count();
    assert.equal(cueCount, visit <= 3 ? 3 : 0, `catalog view ${visit} discovery cue state`);
  }
  assert.equal(await visitPage.evaluate(() => localStorage.getItem("SCZN3_TARGET_CATALOG_VIEW_COUNT_V1")), "4");
  await visitContext.close();
  console.log("PASS discovery cue appears on the first three Target Catalog views only");
} finally {
  await browser.close();
}
