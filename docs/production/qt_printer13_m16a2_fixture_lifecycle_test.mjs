import assert from "node:assert/strict";
import { writeFile } from "node:fs/promises";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { chromium } = require("playwright");
const origin = process.env.SCZN3_QT_REVIEW_ORIGIN || "http://127.0.0.1:8128";
const selectorPath = "/authority-evidence/platform/qt-printer13-corrected-implementation-2026-09-27/QT_PRINTER13_FOUNDER_REPRESENTATIVE_5_SELECTOR.html#target-4";
const artifactPath = "authority-evidence/platform/qt-printer13-corrected-implementation-2026-09-27/QT_PRINTER13_M16A2_FIXTURE_LIFECYCLE_VERIFICATION.json";
const profileId = "qualification_m16a2_25m_zero";

async function tapPercent(page, xPercent, yPercent) {
  const box = await page.locator("#markSurface").boundingBox();
  assert.ok(box, "Precision Tap surface must be visible");
  await page.mouse.click(box.x + box.width * xPercent / 100, box.y + box.height * yPercent / 100);
}

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, reducedMotion: "reduce" });
const page = await context.newPage();
const authorityResponses = [];
const preservationResponses = [];
try {
  await context.route("**/api/authority/m4", async route => {
    const request = route.request().postDataJSON();
    const response = await route.fetch();
    authorityResponses.push({ request, status: response.status(), body: await response.json() });
    await route.fulfill({ response });
  });
  await context.route("**/api/session/sec*", async route => {
    const response = await route.fetch();
    preservationResponses.push({ status: response.status(), body: await response.json() });
    await route.fulfill({ response });
  });

  await page.goto(`${origin}${selectorPath}`, { waitUntil: "domcontentloaded" });
  const launch = new URL(await page.locator("#launch").getAttribute("href"), page.url()).href;
  assert.equal(new URL(launch).searchParams.get("founder_fixture"), "qt_registered");
  await page.goto(launch, { waitUntil: "domcontentloaded" });
  await page.waitForURL(url => url.pathname.endsWith("/shoot.html"), { timeout: 30000 });
  assert.equal(new URL(page.url()).searchParams.get("founder_fixture"), "qt_registered");
  await page.locator('#targetEvidencePreview img[src="assets/QUALIFICATION_M16A2_PUBLISHER_FACE_AUTHORITY_v1.jpg"]').waitFor({ state: "visible", timeout: 30000 });
  assert.equal(await page.locator("#precisionTapPhotoPicker").isVisible(), false, "initial review fixture must not ask Founder for a photo");

  await tapPercent(page, 50, 48.7);
  for (const [x, y] of [[58.0, 40.8], [58.2, 41.0], [58.4, 41.2], [58.6, 41.4], [58.8, 41.6], [59.0, 41.8]]) await tapPercent(page, x, y);
  await page.locator("#showResults:visible").click();
  await page.waitForFunction(() => document.body.dataset.hasResults === "true", null, { timeout: 30000 });
  assert.equal(authorityResponses[0].status, 200);
  assert.equal(authorityResponses[0].request.targetProfileId, profileId);
  assert.equal(authorityResponses[0].request.phase, "initial");

  await page.locator('#saveMarks:visible').filter({ hasText: "Begin Confirmation" }).click();
  await page.waitForFunction(() => document.body.dataset.m4LivePhase === "confirmation" && document.body.dataset.hasResults === "false");
  await page.locator('#targetEvidencePreview img[src="assets/QUALIFICATION_M16A2_PUBLISHER_FACE_AUTHORITY_v1.jpg"]').waitFor({ state: "visible", timeout: 30000 });
  assert.equal(await page.locator("#precisionTapPhotoPicker").isVisible(), false, "confirmation review fixture must not ask Founder for a second photo");

  for (const [x, y] of [[49.9, 48.6], [50.1, 48.7], [50.0, 48.8]]) await tapPercent(page, x, y);
  await page.locator("#showResults:visible").click();
  await page.waitForFunction(() => document.body.dataset.hasResults === "true", null, { timeout: 30000 });
  assert.equal(authorityResponses[1].status, 200);
  assert.equal(authorityResponses[1].request.targetProfileId, profileId);
  assert.equal(authorityResponses[1].request.phase, "confirmation");

  await page.locator('#saveMarks:visible').filter({ hasText: "Save Session" }).click();
  await page.waitForURL(url => url.pathname.endsWith("/sec.html"), { timeout: 30000 });
  const secShell = page.locator('[data-sec-shell="universal-v1"]');
  await secShell.waitFor({ state: "visible", timeout: 30000 }).catch(async error => {
    throw new Error(`M16A2 review-fixture SEC did not render: ${(await page.locator("body").innerText()).slice(0, 2000)}`, { cause: error });
  });
  assert.equal(await secShell.getAttribute("data-sec-adapter-id"), "qualification-m16a2-zeroing");
  assert.equal(await page.locator("#beforeEvidenceMarkers .impact-marker").count(), 6);
  assert.equal(await page.locator("#confirmationMarkers .impact-marker").count(), 3);
  await page.locator("#saveSEC").click();
  await page.getByText("SEC PRESERVED", { exact: true }).waitFor({ timeout: 30000 }).catch(error => {
    throw new Error(`M16A2 review-fixture SEC preservation failed: ${JSON.stringify(preservationResponses)}`, { cause: error });
  });
  const sessionId = await page.evaluate(() => window.SCZN3M4.read(window.SCZN3M4.KEYS.activeSession, null).sessionId);
  await page.locator("#viewHistory").click();
  await page.waitForURL(url => url.pathname.endsWith("/records.html"), { timeout: 30000 });
  const vaultRecord = page.locator(`[data-session-id="${sessionId}"] .vault-record-link`);
  await vaultRecord.waitFor({ state: "visible", timeout: 30000 });
  await vaultRecord.click();
  await page.waitForURL(url => url.pathname.endsWith("/sec.html") && url.searchParams.get("sessionId") === sessionId, { timeout: 30000 });
  await page.locator('[data-sec-shell="universal-v1"][data-sec-adapter-id="qualification-m16a2-zeroing"]').waitFor({ state: "visible", timeout: 30000 });

  const artifact = {
    schemaVersion: "sczn3.qt-printer13.m16a2-founder-fixture-lifecycle.v1",
    status: "PASS",
    targetProfileId: profileId,
    selectorUrl: `${origin}${selectorPath}`,
    fixtureAsset: "assets/QUALIFICATION_M16A2_PUBLISHER_FACE_AUTHORITY_v1.jpg",
    fixtureSha256: "c3028042b6ba600ef983a2fd1cbb035d4f05c4687f8ec54c359ea86369896290",
    externalPhotoRequired: false,
    stages: ["TARGET", "RESULT", "SEC", "VAULT", "exact reopen"],
    initialObservationCount: 6,
    confirmationObservationCount: 3,
    sessionId,
    founderAcceptance: "PENDING"
  };
  await writeFile(artifactPath, `${JSON.stringify(artifact, null, 2)}\n`, "utf8");
  console.log("PASS QT M16A2 self-contained Founder fixture lifecycle");
} finally {
  await context.close();
  await browser.close();
}
