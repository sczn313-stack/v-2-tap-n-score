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
      target: { targetId }, targetAdmission: { status: "admitted", targetId }, missionIdentity: {}, governedDistance: {},
      equipmentRequirements: { weaponCategories: [category] }, standardSetup: candidate, setupMode: "standard",
      equipmentAssessments: [{
        candidateId: candidate.candidateId,
        officialMission: { status: "eligible", restrictionIds: [] },
        capabilities: { evidence: { status: "available" }, measurement: { status: "available" } },
        restrictions: []
      }]
    }) });
  });

  const page = await context.newPage();
  await page.goto(`${baseUrl}/index.html`, { waitUntil: "networkidle" });
  await page.getByRole("button", { name: "Open navigation menu" }).click();
  const drawer = page.locator("#packageMenuDrawer");
  await drawer.waitFor({ state: "visible" });
  const drawerEntries = await drawer.locator("a").evaluateAll(links => links.map(link => ({
    label: link.textContent.trim(),
    href: link.getAttribute("href")
  })));
  assert.deepEqual(drawerEntries.map(entry => entry.label), [
    "Home",
    "Equipment",
    "Smart Targets",
    "History"
  ], "homepage drawer uses the locked universal application navigation");
  const smartTargetsDestination = new URL(drawerEntries.find(entry => entry.label === "Smart Targets")?.href);
  assert.equal(smartTargetsDestination.pathname.endsWith("/index.html"), true, "Smart Targets routes to the homepage");
  assert.equal(smartTargetsDestination.hash, "#targetExperiences", "Smart Targets routes directly to the Available Now and Coming Soon catalog");
  await page.getByRole("button", { name: "Open navigation menu" }).click();
  await drawer.waitFor({ state: "hidden" });
  assert.match(await page.locator("#catalogTitle").textContent(), /TAP\s*your target below/);
  assert.equal(await page.locator('.ecosystem-target-card[data-status="available"]').count(), 4);
  assert.equal(await page.locator('.ecosystem-target-card[data-status="coming-soon"]').evaluateAll(cards => cards.every(card => card.tagName === "ARTICLE" && getComputedStyle(card).cursor !== "pointer")), true);
  assert.equal(await page.locator('.ecosystem-target-card[data-status="available"]').evaluateAll(cards => cards.every(card => card.tagName === "A" && /Tap to Begin/.test(card.textContent))), true);
  assert.equal(await page.locator('.ecosystem-target-card[data-status="available"].is-discovery-cued').count(), 4);
  const catalogOrder = await page.locator(".ecosystem-target-card").evaluateAll(cards => cards.map(card => ({
    id: card.dataset.experienceId,
    status: card.dataset.status
  })));
  assert.ok(
    catalogOrder.findIndex(card => card.id === "uspsa-practice-target") < catalogOrder.findIndex(card => card.id === "dot-torture"),
    "available Baker SL-ST1 must appear before Coming Soon Dot Torture"
  );
  const firstComingSoon = catalogOrder.findIndex(card => card.status === "coming-soon");
  assert.equal(catalogOrder.slice(0, firstComingSoon).every(card => card.status === "available"), true, "available targets stay grouped before Coming Soon targets");
  const bakerSLST1 = page.locator('[data-experience-id="uspsa-practice-target"]');
  assert.equal(await bakerSLST1.getAttribute("data-status"), "available");
  assert.match(await bakerSLST1.textContent(), /Baker SL-ST1 — USPSA/);
  assert.match(await bakerSLST1.textContent(), /Available now/);
  assert.match(await bakerSLST1.textContent(), /Tap to Begin/);
  assert.match(await bakerSLST1.textContent(), /Tap your bullet holes, see your A\/B\/C\/D score, and save your Shooter Experience Card\./);
  assert.doesNotMatch(await bakerSLST1.textContent(), /Coming Soon/i);
  assert.equal(await bakerSLST1.getAttribute("href"), "t/baker/sl-st1/");
  assert.equal(await bakerSLST1.getAttribute("data-target-id"), "BAKER_SL_ST1");
  const bakerThumbnail = bakerSLST1.locator(".ecosystem-target-thumbnail img");
  assert.match(await bakerThumbnail.getAttribute("src"), /authority-evidence\/baker-sl-st1\/BAKER_SL_ST1_PRINTER_PRODUCT_IMAGE\.webp$/);
  const bakerThumbnailGeometry = await bakerThumbnail.evaluate(image => ({
    complete: image.complete,
    naturalWidth: image.naturalWidth,
    naturalHeight: image.naturalHeight,
    objectFit: getComputedStyle(image).objectFit,
    renderedWidth: image.getBoundingClientRect().width,
    renderedHeight: image.getBoundingClientRect().height
  }));
  assert.equal(bakerThumbnailGeometry.complete, true, "USPSA catalog artwork loads");
  assert.ok(bakerThumbnailGeometry.naturalWidth > 0 && bakerThumbnailGeometry.naturalHeight > 0, "USPSA catalog artwork has real image dimensions");
  assert.equal(bakerThumbnailGeometry.objectFit, "contain", "USPSA catalog artwork fills without distortion or geometry loss");
  assert.ok(bakerThumbnailGeometry.renderedWidth > 0 && bakerThumbnailGeometry.renderedHeight > 0, "USPSA catalog artwork occupies its thumbnail");
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
  console.log("PASS universal homepage navigation, Catalog discovery, pending identity, inactive Coming Soon, and Browser Back contracts");

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
    assert.equal(cueCount, visit <= 3 ? 4 : 0, `catalog view ${visit} discovery cue state`);
  }
  assert.equal(await visitPage.evaluate(() => localStorage.getItem("SCZN3_TARGET_CATALOG_VIEW_COUNT_V1")), "4");
  await visitContext.close();
  console.log("PASS discovery cue appears on the first three Target Catalog views only");
} finally {
  await browser.close();
}
