import assert from "node:assert/strict";
import path from "node:path";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { chromium } = require("playwright");
const baseUrl = process.env.SCZN3_TEST_BASE_URL || "http://127.0.0.1:8094";
const targetPhoto = path.resolve("assets/BAKER_ST_M16A2_STANDARD_FACE_AUTHORITY_v1.jpg");
const profileId = "baker_m16a2_25m_zero";
const registrationPackageId = "baker-m16a2-25m-photo-registration-v1";
const adjustmentProfileId = "M16A2-IRON-FSP-REAR-DRUM-ADJUSTMENT-PROFILE-2011";

async function tapPercent(page, xPercent, yPercent) {
  const box = await page.locator("#markSurface").boundingBox();
  assert(box, "Precision Tap surface must be visible");
  await page.mouse.click(box.x + box.width * xPercent / 100, box.y + box.height * yPercent / 100);
}

const browser = await chromium.launch({ headless: true, executablePath: process.env.SCZN3_CHROME_EXECUTABLE || undefined });

try {
  for (const viewport of [{ width: 1440, height: 1000 }, { width: 390, height: 844 }]) {
    const context = await browser.newContext({ viewport, reducedMotion: "reduce" });
    const page = await context.newPage();
    const errors = [];
    const registrationResponses = [];
    const authorityResponses = [];
    const preservationResponses = [];
    page.on("pageerror", error => errors.push(error.message));
    await context.route("**/api/authority/target-image-registration", async route => {
      const response = await route.fetch();
      registrationResponses.push({ status: response.status(), body: await response.json() });
      await route.fulfill({ response });
    });
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

    await page.goto(`${baseUrl}/matrix.html?target_profile_id=${profileId}&equipment=standard&founder_review=1&tstt_chapter=4&photo_source=existing`, { waitUntil: "networkidle" });
    await page.waitForURL(url => url.pathname.endsWith("/shoot.html"), { timeout: 30000 });
    assert.equal(new URL(page.url()).searchParams.get("founder_review"), "1");
    assert.equal(new URL(page.url()).searchParams.get("photo_source"), "existing");

    await page.locator("#targetImageInput").setInputFiles(targetPhoto);
    await page.waitForFunction(() => document.body.dataset.precisionTapRegistration === "complete", null, { timeout: 30000 });
    assert.equal(registrationResponses.at(-1).status, 200);
    assert.equal(registrationResponses.at(-1).body.knowledgeState, "exact");
    assert.equal(registrationResponses.at(-1).body.registrationPackageId, registrationPackageId);

    await tapPercent(page, 50, 48.7);
    await tapPercent(page, 58.3, 41.1);
    await tapPercent(page, 58.5, 41.3);
    await tapPercent(page, 58.7, 41.5);
    await page.locator("#showResults:visible").click();
    await page.waitForFunction(() => document.body.dataset.hasResults === "true", null, { timeout: 30000 });
    assert.equal(authorityResponses[0].status, 200);
    assert.equal(authorityResponses[0].request.targetProfileId, profileId);
    assert.equal(authorityResponses[0].request.phase, "initial");
    assert.equal(authorityResponses[0].body.mechanicalSightAuthority.adjustmentProfileId, adjustmentProfileId);
    assert.deepEqual({
      windageClicks: authorityResponses[0].body.clicks.windageClicks,
      windageDirection: authorityResponses[0].body.clicks.windageDirection,
      windageTurnDirection: authorityResponses[0].body.clicks.windageTurnDirection,
      elevationClicks: authorityResponses[0].body.clicks.elevationClicks,
      elevationDirection: authorityResponses[0].body.clicks.elevationDirection,
      elevationTurnDirection: authorityResponses[0].body.clicks.elevationTurnDirection
    }, {
      windageClicks: 5,
      windageDirection: "LEFT",
      windageTurnDirection: "COUNTERCLOCKWISE",
      elevationClicks: 2,
      elevationDirection: "DOWN",
      elevationTurnDirection: "COUNTERCLOCKWISE"
    });
    assert.equal(
      await page.locator("#missionWorkspaceGuidance").innerText(),
      "Apply the clicks. Then shoot a new confirmation group. You can use this target or a new one. Take a photo of that target, then tap only the new confirmation bullet holes."
    );

    await page.locator("#saveMarks:visible", { hasText: "Begin Confirmation" }).click();
    await page.waitForFunction(() => document.body.dataset.m4LivePhase === "confirmation" && document.body.dataset.hasResults === "false");
    assert.equal(await page.locator("#missionWorkspaceGuidance").innerText(), "On the confirmation target photo, tap only the new confirmation bullet holes.");
    await tapPercent(page, 49.9, 48.6);
    await tapPercent(page, 50.1, 48.7);
    await tapPercent(page, 50.0, 48.8);
    assert.equal(await page.locator("#missionWorkspaceGuidance").innerText(), "Tap Show Results for these new confirmation shots.");
    await page.locator("#showResults:visible").click();
    await page.waitForFunction(() => document.body.dataset.hasResults === "true", null, { timeout: 30000 });
    assert.equal(authorityResponses[1].status, 200);
    assert.equal(authorityResponses[1].request.targetProfileId, profileId);
    assert.equal(authorityResponses[1].request.phase, "confirmation");
    assert.equal(authorityResponses[1].body.validation.confirmed, true);

    await page.locator("#saveMarks:visible", { hasText: "Save Session" }).click();
    await page.waitForURL(url => url.pathname.endsWith("/sec.html"), { timeout: 30000 });
    const secShell = page.locator('[data-sec-shell="universal-v1"][data-sec-adapter-id="m16a2-zeroing"]');
    await secShell.waitFor({ state: "visible", timeout: 30000 });
    assert.match(await page.locator(".sec-mission-bar").innerText(), /Baker M16A2 25 Meter Zeroing Target/i);
    assert.equal(await page.locator("#beforeEvidenceMarkers .impact-marker").count(), 3);
    assert.equal(await page.locator("#confirmationMarkers .impact-marker").count(), 3);
    await page.locator("#saveSEC").click();
    await page.getByText("SEC PRESERVED", { exact: true }).waitFor({ timeout: 30000 }).catch(error => {
      throw new Error(`M16A2 SEC preservation failed: ${JSON.stringify(preservationResponses)}`, { cause: error });
    });
    const sessionId = await page.evaluate(() => window.SCZN3M4.read(window.SCZN3M4.KEYS.activeSession, null).sessionId);
    await page.locator("#viewHistory").click();
    await page.waitForURL(url => url.pathname.endsWith("/records.html"), { timeout: 30000 });
    await page.locator(`[data-session-id="${sessionId}"] .vault-record-link`).waitFor({ state: "visible", timeout: 30000 });
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), true);
    assert.deepEqual(errors, []);
    await context.close();
    console.log(`PASS Chapter 4 shooter M16A2 correction → confirmation → SEC → Vault at ${viewport.width}px`);
  }
} finally {
  await browser.close();
}
