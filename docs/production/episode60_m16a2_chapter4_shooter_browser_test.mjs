import assert from "node:assert/strict";
import path from "node:path";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { chromium } = require("playwright");
const baseUrl = process.env.SCZN3_TEST_BASE_URL || "http://127.0.0.1:8094";
const targetPhoto = path.resolve("assets/BAKER_ST_M16A2_STANDARD_FACE_AUTHORITY_v1.jpg");
const founderTargetPhoto = path.resolve("authority-evidence/mfam/chapter4-founder-quantization-2026-09-06/founder-m16a2-chapter4-specimen.jpg");
const enlargedDifferentProduct = path.resolve("authority-evidence/mfam/founder-supplied-baker-product-evidence/FOUNDER_BAKER_ST_M16A2R_PRODUCT_SCREENSHOT_2026-09-02.png");
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
    assert.equal(new URL(page.url()).searchParams.get("tstt_chapter"), "4");
    assert.equal(new URL(page.url()).searchParams.get("photo_source"), "existing");
    await page.locator("#precisionTapPhotoPicker:visible").waitFor({ timeout: 30000 });
    assert.equal(await page.getByText("Take Photo", { exact: true }).isVisible(), true);
    assert.equal(await page.getByText("Choose Existing Photo", { exact: true }).isVisible(), true);

    await page.locator("#targetImageInput").setInputFiles(targetPhoto);
    await page.waitForFunction(() => document.body.dataset.precisionTapRegistration === "complete", null, { timeout: 30000 });
    assert.equal(registrationResponses.at(-1).status, 200);
    assert.equal(registrationResponses.at(-1).body.knowledgeState, "exact");
    assert.equal(registrationResponses.at(-1).body.registrationPackageId, registrationPackageId);
    assert.equal(await page.locator("#saveMarks:visible").count(), 0, "BEGIN CONFIRMATION must not exist before a governed correction");

    await tapPercent(page, 50, 48.7);
    await tapPercent(page, 58.0, 40.8);
    await tapPercent(page, 58.2, 41.0);
    await tapPercent(page, 58.4, 41.2);
    await tapPercent(page, 58.6, 41.4);
    await tapPercent(page, 58.8, 41.6);
    await tapPercent(page, 59.0, 41.8);
    assert.equal(await page.locator("#clearMarks:visible").count(), 1, "CLEAR must be present during Precision Tap");
    await page.locator("#clearMarks:visible").click();
    assert.equal(await page.locator("#targetHitCounter strong").innerText(), "0", "CLEAR must remove every shot observation");
    assert.equal(await page.locator("#showResults:visible").count(), 0, "CLEAR must withdraw SHOW RESULTS until new shots exist");
    await tapPercent(page, 58.0, 40.8);
    await tapPercent(page, 58.2, 41.0);
    await tapPercent(page, 58.4, 41.2);
    await tapPercent(page, 58.6, 41.4);
    await tapPercent(page, 58.8, 41.6);
    await tapPercent(page, 59.0, 41.8);
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
    assert.deepEqual(await page.evaluate(() => ({
      rangeState: document.body.dataset.rangeState,
      controlState: document.body.dataset.precisionTapControlState,
      beginConfirmationVisible: !!document.querySelector("#saveMarks:not([hidden])")
        && getComputedStyle(document.querySelector("#saveMarks")).display !== "none",
      beginConfirmationDisabled: document.querySelector("#saveMarks").disabled,
      beginConfirmationLabel: document.querySelector("#saveMarks").textContent.trim()
    })), {
      rangeState: "save-session",
      controlState: "confirmation_entry",
      beginConfirmationVisible: true,
      beginConfirmationDisabled: false,
      beginConfirmationLabel: "Begin Confirmation"
    }, "a released governed correction must expose one actionable BEGIN CONFIRMATION control");

    await page.locator("#saveMarks:visible", { hasText: "Begin Confirmation" }).click();
    await page.waitForFunction(() => document.body.dataset.m4LivePhase === "confirmation" && document.body.dataset.hasResults === "false");
    assert.equal(
      await page.locator("#missionWorkspaceGuidance").innerText(),
      "Then shoot a new confirmation group. You can use this target or a new one. Take a photo of that target, then tap only the new confirmation bullet holes."
    );
    assert.match(await page.locator("body").getAttribute("data-tstt-chapter-four-narration"), /requested|playing|complete/);
    assert.equal(await page.locator("#markSurface").count(), 0, "the original photograph must leave the workspace before confirmation observations");
    assert.equal(await page.locator("#saveMarks:visible").count(), 0, "BEGIN CONFIRMATION must not remain as a dead control");
    await page.locator("#precisionTapPhotoPicker:visible").waitFor({ timeout: 30000 });
    assert.equal(await page.getByText("Take Photo", { exact: true }).isVisible(), true);
    assert.equal(await page.getByText("Choose Existing Photo", { exact: true }).isVisible(), true);

    await page.locator("#targetImageInput").setInputFiles(targetPhoto);
    await page.waitForFunction(() => document.body.dataset.precisionTapRegistration === "complete", null, { timeout: 30000 });
    assert.equal(registrationResponses.length, 2, "confirmation must submit a second photograph for registration");
    assert.equal(registrationResponses[1].body.knowledgeState, "exact");
    assert.equal(registrationResponses[1].body.registrationPackageId, registrationPackageId);
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

    const governedSession = await page.evaluate(() => window.SCZN3M4.read(window.SCZN3M4.KEYS.activeSession, null));
    assert.equal(governedSession.targetEvidenceImage.assetRole, "shooter-captured-target-photo");
    assert.equal(governedSession.confirmationEvidenceImage.assetRole, "shooter-captured-target-photo", "working confirmation evidence must survive a reload before final governed save");
    assert.equal(governedSession.savedToSEC, false, "working evidence is rehydratable but is not a preserved SEC until the shooter saves");

    await page.locator("#saveMarks:visible", { hasText: "Save Session" }).click();
    await page.waitForURL(url => url.pathname.endsWith("/sec.html"), { timeout: 30000 });
    const secShell = page.locator('[data-sec-shell="universal-v1"][data-sec-adapter-id="m16a2-zeroing"]');
    await secShell.waitFor({ state: "visible", timeout: 30000 });
    assert.match(await page.locator(".sec-mission-bar").innerText(), /Baker M16A2 25 Meter Zeroing Target/i);
    assert.equal(await page.locator("#beforeEvidenceMarkers .impact-marker").count(), 6);
    assert.equal(await page.locator("#confirmationMarkers .impact-marker").count(), 3);
    const preservedSession = await page.evaluate(() => window.SCZN3M4.read(window.SCZN3M4.KEYS.activeSession, null));
    assert.equal(preservedSession.targetEvidenceImage.assetRole, "shooter-captured-target-photo");
    assert.equal(preservedSession.confirmationEvidenceImage.assetRole, "shooter-captured-target-photo");
    assert.equal(preservedSession.confirmationImpactPoints.length, 3);
    await page.locator("#saveSEC").click();
    await page.getByText("SEC PRESERVED", { exact: true }).waitFor({ timeout: 30000 }).catch(error => {
      throw new Error(`M16A2 SEC preservation failed: ${JSON.stringify(preservationResponses)}`, { cause: error });
    });
    const sessionId = await page.evaluate(() => window.SCZN3M4.read(window.SCZN3M4.KEYS.activeSession, null).sessionId);
    assert.equal((await page.locator("#viewHistory").innerText()).trim(), "BALLISTIC VAULT");
    await page.locator("#viewHistory").click();
    await page.waitForURL(url => url.pathname.endsWith("/records.html"), { timeout: 30000 });
    const vaultRecord = page.locator(`[data-session-id="${sessionId}"] .vault-record-link`);
    await vaultRecord.waitFor({ state: "visible", timeout: 30000 });
    await vaultRecord.click();
    await page.waitForURL(url => url.pathname.endsWith("/sec.html") && url.searchParams.get("sessionId") === sessionId, { timeout: 30000 });
    await page.locator('[data-sec-shell="universal-v1"][data-sec-adapter-id="m16a2-zeroing"]').waitFor({ state: "visible", timeout: 30000 });
    assert.equal(await page.evaluate(id => window.SCZN3M4.read(window.SCZN3M4.KEYS.activeSession, null).sessionId === id, sessionId), true);
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), true);
    assert.deepEqual(errors, []);
    await context.close();
    console.log(`PASS Chapter 4 shooter M16A2 correction → confirmation → SEC → Vault at ${viewport.width}px`);
  }

  const founderContext = await browser.newContext({ viewport: { width: 390, height: 844 }, reducedMotion: "reduce" });
  const founderPage = await founderContext.newPage();
  const founderRegistrations = [];
  const founderAuthority = [];
  await founderContext.route("**/api/authority/target-image-registration", async route => {
    const response = await route.fetch();
    founderRegistrations.push({ status: response.status(), body: await response.json() });
    await route.fulfill({ response });
  });
  await founderContext.route("**/api/authority/m4", async route => {
    const request = route.request().postDataJSON();
    const response = await route.fetch();
    founderAuthority.push({ request, status: response.status(), body: await response.json() });
    await route.fulfill({ response });
  });
  await founderPage.goto(`${baseUrl}/matrix.html?target_profile_id=${profileId}&equipment=standard&founder_review=1&tstt_chapter=4&photo_source=existing`, { waitUntil: "networkidle" });
  await founderPage.waitForURL(url => url.pathname.endsWith("/shoot.html"), { timeout: 30000 });
  await founderPage.locator("#targetImageInput").setInputFiles(founderTargetPhoto);
  await founderPage.waitForFunction(() => document.body.dataset.precisionTapRegistration === "complete", null, { timeout: 30000 });
  await tapPercent(founderPage, 49.97, 57.32);
  for (const [x, y] of [[13.24, 80.37], [16.53, 80.51], [18.49, 80.51], [21.68, 80.51], [24.68, 80.51], [27.23, 80.51]]) {
    await tapPercent(founderPage, x, y);
  }
  await founderPage.locator("#showResults:visible").click();
  await founderPage.waitForFunction(() => document.body.dataset.hasResults === "true", null, { timeout: 30000 });
  assert.deepEqual({
    coverage: founderRegistrations[0].body.metrics.targetCoverage,
    matches: founderRegistrations[0].body.metrics.mutualMatches,
    inliers: founderRegistrations[0].body.metrics.inliers,
    rms: founderRegistrations[0].body.metrics.reprojectionRmsPx,
    orientation: founderRegistrations[0].body.orientationEvidence.status
  }, { coverage: .9821, matches: 1070, inliers: 1010, rms: .3064, orientation: "proven" });
  assert.deepEqual({
    windageClicks: founderAuthority[0].body.clicks.windageClicks,
    windageDirection: founderAuthority[0].body.clicks.windageDirection,
    elevationClicks: founderAuthority[0].body.clicks.elevationClicks,
    elevationDirection: founderAuthority[0].body.clicks.elevationDirection,
    mechanicalRecommendation: founderAuthority[0].body.status.hasMechanicalRecommendation
  }, { windageClicks: 18, windageDirection: "RIGHT", elevationClicks: 8, elevationDirection: "UP", mechanicalRecommendation: true });
  assert.equal(founderAuthority[0].body.clicks.quantization.windage.continuousClicks, 18.369746);
  assert.equal(founderAuthority[0].body.clicks.quantization.windage.selectedClicks, 18);
  const founderSessionId = await founderPage.evaluate(() => window.SCZN3M4.read(window.SCZN3M4.KEYS.activeSession, null).sessionId);
  await founderPage.reload({ waitUntil: "networkidle" });
  await founderPage.locator("#saveMarks:visible", { hasText: "Begin Confirmation" }).click();
  await founderPage.locator("#precisionTapPhotoPicker:visible").waitFor({ timeout: 30000 });
  await founderPage.locator("#targetImageInput").setInputFiles(targetPhoto);
  await founderPage.waitForFunction(() => document.body.dataset.precisionTapRegistration === "complete", null, { timeout: 30000 });
  await tapPercent(founderPage, 49.9, 48.6);
  await tapPercent(founderPage, 50.1, 48.7);
  await tapPercent(founderPage, 50.0, 48.8);
  await founderPage.locator("#showResults:visible").click();
  await founderPage.waitForFunction(() => document.body.dataset.hasResults === "true", null, { timeout: 30000 });
  assert.equal(founderAuthority[1].request.phase, "confirmation");
  assert.equal(founderAuthority[1].body.validation.confirmed, true);
  await founderPage.locator("#saveMarks:visible", { hasText: "Save Session" }).click();
  await founderPage.waitForURL(url => url.pathname.endsWith("/sec.html"), { timeout: 30000 });
  await founderPage.locator("#saveSEC").click();
  await founderPage.getByText("SEC PRESERVED", { exact: true }).waitFor({ timeout: 30000 });
  assert.equal((await founderPage.locator("#viewHistory").innerText()).trim(), "BALLISTIC VAULT");
  await founderPage.locator("#viewHistory").click();
  await founderPage.waitForURL(url => url.pathname.endsWith("/records.html"), { timeout: 30000 });
  const founderVaultRecord = founderPage.locator(`[data-session-id="${founderSessionId}"] .vault-record-link`);
  await founderVaultRecord.waitFor({ state: "visible", timeout: 30000 });
  await founderVaultRecord.click();
  await founderPage.waitForURL(url => url.pathname.endsWith("/sec.html") && url.searchParams.get("sessionId") === founderSessionId, { timeout: 30000 });
  assert.equal(await founderPage.locator('[data-sec-shell="universal-v1"][data-sec-adapter-id="m16a2-zeroing"]').isVisible(), true);
  await founderContext.close();
  console.log("PASS exact Founder specimen → 18 RIGHT / 8 UP → BEGIN CONFIRMATION → second photo → ZERO CONFIRMED → SEC → Vault → exact reopen at 390px");

  const refusalContext = await browser.newContext({ viewport: { width: 390, height: 844 }, reducedMotion: "reduce" });
  const refusalPage = await refusalContext.newPage();
  const refusalRegistrations = [];
  const refusalAuthority = [];
  await refusalContext.route("**/api/authority/target-image-registration", async route => {
    const response = await route.fetch();
    refusalRegistrations.push({ status: response.status(), body: await response.json() });
    await route.fulfill({ response });
  });
  await refusalContext.route("**/api/authority/m4", async route => {
    const response = await route.fetch();
    refusalAuthority.push({ status: response.status(), body: await response.json() });
    await route.fulfill({ response });
  });
  await refusalPage.goto(`${baseUrl}/matrix.html?target_profile_id=${profileId}&equipment=standard&founder_review=1&tstt_chapter=4&photo_source=existing`, { waitUntil: "networkidle" });
  await refusalPage.waitForURL(url => url.pathname.endsWith("/shoot.html"), { timeout: 30000 });
  const refusalRegistrationCompleted = refusalPage.waitForResponse(response => response.url().includes("/api/authority/target-image-registration"));
  await refusalPage.locator("#targetImageInput").setInputFiles(enlargedDifferentProduct);
  await refusalRegistrationCompleted;
  assert.equal(refusalRegistrations.at(-1).body.knowledgeState, "estimated");
  assert.equal(refusalRegistrations.at(-1).body.orientationEvidence.reason, "target_orientation_unverified");
  await tapPercent(refusalPage, 50, 48.7);
  await tapPercent(refusalPage, 58.3, 41.1);
  await tapPercent(refusalPage, 58.5, 41.3);
  await tapPercent(refusalPage, 58.7, 41.5);
  await refusalPage.locator("#showResults:visible").click();
  await refusalPage.getByText("WE CAN’T VERIFY THIS TARGET", { exact: true }).waitFor({ timeout: 30000 });
  assert.equal(refusalRegistrations.at(-1).status, 200);
  assert.equal(refusalAuthority.at(-1).status, 200);
  assert.equal(refusalAuthority.at(-1).body.registrationClaimSufficiency.reason, "target_orientation_unverified");
  assert.equal(refusalAuthority.at(-1).body.authorityAuditEnvelope.releaseStatus, "withheld");
  assert.equal(refusalAuthority.at(-1).body.clicks, null);
  assert.equal(await refusalPage.locator("#saveMarks:visible").count(), 0, "failed registration must suppress confirmation machinery");
  assert.equal(await refusalPage.locator(".workspace-result-overlay").count(), 0, "failed registration must suppress correction machinery");
  assert.equal(await refusalPage.getByText("Try Again", { exact: true }).isVisible(), true);
  const exit = refusalPage.getByText("Exit", { exact: true });
  assert.equal(await exit.isVisible(), true);
  assert.match(await exit.getAttribute("href"), /index\.html#targetExperiences$/);
  assert.notEqual(await exit.getAttribute("data-allow-mission-exit"), null, "EXIT must leave the failed admission cleanly without an unsaved-session trap");
  assert.doesNotMatch(await refusalPage.locator("body").innerText(), /authority|reconciliation|registration package/i);
  await refusalPage.getByText("Try Again", { exact: true }).click();
  await refusalPage.locator("#precisionTapPhotoPicker:visible").waitFor({ timeout: 30000 });
  assert.equal(await refusalPage.locator("#markSurface").count(), 0);
  await refusalContext.close();
  console.log("PASS enlarged ST-M16A2R fails closed with simple TRY AGAIN / EXIT recovery");

  const quantizationRefusalContext = await browser.newContext({ viewport: { width: 390, height: 844 }, reducedMotion: "reduce" });
  const quantizationRefusalPage = await quantizationRefusalContext.newPage();
  await quantizationRefusalContext.route("**/api/authority/m4", async route => {
    const response = await route.fetch();
    const body = await response.json();
    body.correctionEstimate = { status: "best_estimate_exact_click_count_withheld", axisAssessments: body.registrationClaimSufficiency?.axisAssessments || {} };
    body.clicks = null;
    body.status.hasMechanicalRecommendation = false;
    body.mechanicalValidation = { status: "unavailable", reason: "mechanical_quantization_uncertainty_exceeds_governed_policy", model: body.mechanicalValidation?.model };
    await route.fulfill({ response, json: body });
  });
  await quantizationRefusalPage.goto(`${baseUrl}/matrix.html?target_profile_id=${profileId}&equipment=standard&founder_review=1&tstt_chapter=4&photo_source=existing`, { waitUntil: "networkidle" });
  await quantizationRefusalPage.waitForURL(url => url.pathname.endsWith("/shoot.html"), { timeout: 30000 });
  await quantizationRefusalPage.locator("#targetImageInput").setInputFiles(targetPhoto);
  await quantizationRefusalPage.waitForFunction(() => document.body.dataset.precisionTapRegistration === "complete", null, { timeout: 30000 });
  await tapPercent(quantizationRefusalPage, 50, 48.7);
  await tapPercent(quantizationRefusalPage, 58.3, 41.1);
  await tapPercent(quantizationRefusalPage, 58.5, 41.3);
  await tapPercent(quantizationRefusalPage, 58.7, 41.5);
  await quantizationRefusalPage.locator("#showResults:visible").click();
  await quantizationRefusalPage.waitForFunction(() => document.body.dataset.rangeState === "verification-unavailable", null, { timeout: 30000 });
  await quantizationRefusalPage.getByText("WE CAN’T VERIFY THIS ADJUSTMENT", { exact: true }).waitFor({ timeout: 30000 });
  assert.equal(await quantizationRefusalPage.locator("#saveMarks:visible").count(), 0);
  assert.equal(await quantizationRefusalPage.getByText("Try Again", { exact: true }).isVisible(), true);
  assert.equal(await quantizationRefusalPage.getByText("Exit", { exact: true }).isVisible(), true);
  assert.doesNotMatch(await quantizationRefusalPage.locator("body").innerText(), /APPLY THE CLICKS/i);
  await quantizationRefusalContext.close();
  console.log("PASS excessive mechanical uncertainty uses truthful TRY AGAIN / EXIT recovery without APPLY CLICKS");

  const cameraContext = await browser.newContext({ viewport: { width: 390, height: 844 }, reducedMotion: "reduce" });
  const cameraPage = await cameraContext.newPage();
  await cameraPage.goto(`${baseUrl}/matrix.html?target_profile_id=${profileId}&equipment=standard&founder_review=1&tstt_chapter=4&photo_source=camera`, { waitUntil: "networkidle" });
  await cameraPage.waitForURL(url => url.pathname.endsWith("/shoot.html"), { timeout: 30000 });
  await cameraPage.locator("#precisionTapPhotoPicker:visible").waitFor({ timeout: 30000 });
  await cameraPage.locator("#targetCameraInput").setInputFiles(targetPhoto);
  await cameraPage.waitForFunction(() => document.body.dataset.precisionTapRegistration === "complete", null, { timeout: 30000 });
  assert.equal(await cameraPage.locator("#setAimMode:visible").count(), 1);
  await cameraContext.close();
  console.log("PASS TAKE PHOTO entry reaches the governed M16A2 Precision Tap road at 390px");

  const rehydratedContext = await browser.newContext({ viewport: { width: 390, height: 844 }, reducedMotion: "reduce" });
  const rehydratedPage = await rehydratedContext.newPage();
  await rehydratedContext.route("**/api/authority/m4", async route => {
    const response = await route.fetch();
    const body = await response.json();
    delete body.status.hasCorrection;
    await route.fulfill({ response, json: body });
  });
  await rehydratedPage.goto(`${baseUrl}/matrix.html?target_profile_id=${profileId}&equipment=standard&founder_review=1&tstt_chapter=4&photo_source=existing`, { waitUntil: "networkidle" });
  await rehydratedPage.waitForURL(url => url.pathname.endsWith("/shoot.html"), { timeout: 30000 });
  await rehydratedPage.locator("#targetImageInput").setInputFiles(targetPhoto);
  await rehydratedPage.waitForFunction(() => document.body.dataset.precisionTapRegistration === "complete", null, { timeout: 30000 });
  await tapPercent(rehydratedPage, 50, 48.7);
  await tapPercent(rehydratedPage, 58.3, 41.1);
  await tapPercent(rehydratedPage, 58.5, 41.3);
  await tapPercent(rehydratedPage, 58.7, 41.5);
  await rehydratedPage.locator("#showResults:visible").click();
  await rehydratedPage.waitForFunction(() => document.body.dataset.hasResults === "true", null, { timeout: 30000 });
  assert.equal(await rehydratedPage.locator('.workspace-result-overlay[aria-label="Mechanical correction"]').count(), 1);
  const workingSessionId = await rehydratedPage.evaluate(() => window.SCZN3M4.read(window.SCZN3M4.KEYS.activeSession, null).sessionId);
  await rehydratedPage.reload({ waitUntil: "networkidle" });
  assert.equal(new URL(rehydratedPage.url()).searchParams.get("session"), workingSessionId);
  await rehydratedPage.waitForFunction(() => document.body.dataset.hasEvidence === "true" && document.body.dataset.hasResults === "true", null, { timeout: 30000 });
  assert.equal(await rehydratedPage.locator("#precisionTapPhotoPicker:visible").count(), 0, "reload must not discard preserved evidence into photo entry");
  assert.equal(await rehydratedPage.locator('.workspace-result-overlay[aria-label="Mechanical correction"]').count(), 1);
  const rehydratedBegin = rehydratedPage.locator("#saveMarks:visible", { hasText: "Begin Confirmation" });
  assert.equal(await rehydratedBegin.count(), 1, "a rehydrated governed click package must not leave the action bar empty");
  assert.equal(await rehydratedBegin.isEnabled(), true);
  await rehydratedContext.close();
  console.log("PASS URL reload rehydrates evidence, governed result, and actionable BEGIN CONFIRMATION at 390px");
} finally {
  await browser.close();
}
