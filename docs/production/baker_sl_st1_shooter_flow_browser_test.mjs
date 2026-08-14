import assert from "node:assert/strict";
import path from "node:path";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { chromium } = require("playwright");
const baseUrl = process.env.SCZN3_TEST_BASE_URL || "http://127.0.0.1:8137";
const targetPhoto = path.resolve("authority-evidence/baker-sl-st1/BAKER_SL_ST1_PRINTER_PRODUCT_IMAGE.webp");
const TARGET_ID = "BAKER_SL_ST1";
const resultPackageType = "smartEvidenceResult";
const missionFamily = "smartEvidenceCapture";

async function assertTransitionVisible(page, viewport, label) {
  for (let sample = 0; sample < 6; sample += 1) {
    const visible = await page.evaluate(() => {
      const viewportTop = visualViewport?.offsetTop || 0;
      const viewportBottom = viewportTop + (visualViewport?.height || innerHeight);
      const headerBottom = document.querySelector(".sl-app-header").getBoundingClientRect().bottom;
      const frame = document.getElementById("imageFrame").getBoundingClientRect();
      const results = document.getElementById("supportedResults").getBoundingClientRect();
      const action = document.getElementById("continueToSec").getBoundingClientRect();
      const targetProbe = document.elementFromPoint(frame.left + (frame.width / 2), frame.bottom - 2);
      return {
        targetUnobscured: frame.top >= Math.max(viewportTop, headerBottom),
        targetBottomVisible: frame.bottom <= viewportBottom,
        targetDoesNotOverlapAction: frame.bottom <= results.top,
        targetProbeUnobscured: document.getElementById("imageFrame").contains(targetProbe),
        resultsVisible: results.top >= viewportTop && results.bottom <= viewportBottom,
        actionVisible: action.top >= viewportTop && action.bottom <= viewportBottom,
        horizontalOverflow: document.documentElement.scrollWidth > innerWidth
      };
    });
    assert.deepEqual(visible, {
      targetUnobscured: true,
      targetBottomVisible: true,
      targetDoesNotOverlapAction: true,
      targetProbeUnobscured: true,
      resultsVisible: true,
      actionVisible: true,
      horizontalOverflow: false
    }, `${viewport.width}x${viewport.height} ${label} sample ${sample + 1}`);
    await page.waitForTimeout(75);
  }
}

function sessionPreparation() {
  const standardSetup = {
    candidateId: "standard-baker-sl-st1",
    weaponCategory: "Pistol",
    manufacturer: "Shooter equipment",
    modelType: "Pistol",
    modelCaliber: "Shooter ammunition",
    opticType: "Shooter sights",
    adjustmentUnit: "",
    clickValue: null,
    source: "backend_standard_setup",
    setupAuthority: "backend-target-authority",
    setupAuthorityId: "BAKER_SL_ST1_STANDARD_SETUP_v1",
    displayFields: [{ label: "Firearm", value: "Pistol" }]
  };
  return {
    standardSetup,
    body: {
      ok: true,
      status: "prepared",
      preparationToken: "prepare-baker-sl-st1",
      expiresAt: "2026-08-13T23:59:59+00:00",
      target: { targetId: TARGET_ID, targetName: "Silhouette Target (USPSA)" },
      targetAdmission: { status: "admitted", targetId: TARGET_ID },
      missionIdentity: { missionFamily, resultPackageType },
      governedDistance: { value: null, unit: null, locked: false },
      equipmentRequirements: { weaponCategories: ["Pistol"], requiresAdjustmentSystem: false, allowedAdjustmentUnits: [] },
      standardSetup,
      setupMode: "standard",
      equipmentAssessments: [{
        candidateId: standardSetup.candidateId,
        officialMission: { status: "eligible", restrictionIds: [] },
        capabilities: { evidence: { status: "available" }, measurement: { status: "available" } },
        restrictions: []
      }]
    }
  };
}

const browser = await chromium.launch({
  headless: true,
  executablePath: process.env.SCZN3_CHROME_EXECUTABLE || undefined
});

try {
  for (const viewport of [
    { width: 1238, height: 887, deviceScaleFactor: 2 },
    { width: 1050, height: 417, deviceScaleFactor: 2 },
    { width: 1050, height: 380, deviceScaleFactor: 2 },
    { width: 1440, height: 1000, deviceScaleFactor: 1 },
    { width: 390, height: 844 },
    { width: 390, height: 720 },
    { width: 390, height: 667 },
    { width: 390, height: 568 }
  ]) {
    const context = await browser.newContext({
      viewport: { width: viewport.width, height: viewport.height },
      deviceScaleFactor: viewport.deviceScaleFactor || 1
    });
    const pageErrors = [];
    const consoleErrors = [];
    const preparation = sessionPreparation();
    const authoritativeSessionId = `sl-st1-flow-${viewport.width}-${viewport.height}`;
    const page = await context.newPage();
    let startAttempts = 0;
    let preservedSession = null;

    page.on("pageerror", error => pageErrors.push(error.message));
    page.on("console", message => {
      if (message.type() === "error" && !message.text().includes("503 (Service Unavailable)")) consoleErrors.push(message.text());
    });

    await context.route("**/api/target/baker-sl-st1/analyze", async route => {
      const request = route.request().postDataJSON();
      assert.equal(request.targetId, TARGET_ID);
      assert.equal(request.impacts.length, 3);
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          ok: true,
          status: "supported_analysis_ready",
          resultPackageType,
          missionFamily,
          target: { smartTargetId: TARGET_ID, variantId: "BAKER_SL_ST1_23X35_STANDARD_WHITE" },
          supportedAnalysis: { impactCount: request.impacts.length },
          impacts: request.impacts.map((impact, index) => ({ impactId: `impact-${index + 1}`, ...impact })),
          scoring: { status: "unavailable" }
        })
      });
    });
    await context.route("**/api/session/prepare", async route => {
      assert.equal(route.request().postDataJSON().targetId, TARGET_ID);
      await new Promise(resolve => setTimeout(resolve, 350));
      await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(preparation.body) });
    });
    await context.route("**/api/session/start", async route => {
      startAttempts += 1;
      await new Promise(resolve => setTimeout(resolve, 500));
      if (startAttempts === 1) {
        await route.fulfill({ status: 503, contentType: "application/json", body: JSON.stringify({ ok: false, error: "intentional-recovery-test" }) });
        return;
      }
      const request = route.request().postDataJSON();
      assert.equal(request.preparationToken, "prepare-baker-sl-st1");
      assert.deepEqual(request.selectedEquipment, preparation.standardSetup);
      await route.fulfill({
        status: 201,
        contentType: "application/json",
        body: JSON.stringify({
          ok: true,
          status: "created",
          authoritativeSessionId,
          createdAt: "2026-08-12T20:00:00+00:00",
          sessionLifecycle: "created",
          sessionMode: "official_mission",
          target: { targetId: TARGET_ID, targetName: "Silhouette Target (USPSA)" },
          missionIdentity: { missionFamily, resultPackageType },
          targetAdmission: { status: "admitted", targetId: TARGET_ID },
          officialMission: { status: "eligible", restrictionIds: [] },
          capabilities: { evidence: { status: "available" }, measurement: { status: "available" } },
          restrictions: [],
          governedDistance: { value: null, unit: null, locked: false },
          selectedEquipment: preparation.standardSetup
        })
      });
    });
    await context.route("**/api/session/sec**", async route => {
      if (route.request().method() === "POST") {
        preservedSession = route.request().postDataJSON().session;
        await route.fulfill({
          status: 201,
          contentType: "application/json",
          body: JSON.stringify({ ok: true, session: preservedSession })
        });
        return;
      }
      const requestedSessionId = new URL(route.request().url()).searchParams.get("session");
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(requestedSessionId
          ? { ok: true, session: preservedSession }
          : { ok: true, sessions: preservedSession ? [preservedSession] : [] })
      });
    });

    await page.goto(`${baseUrl}/t/baker/sl-st1/?flow=${viewport.width}-${viewport.height}`, { waitUntil: "networkidle" });
    assert.equal(await page.getByLabel("Open navigation").isVisible(), true, "Load Photo must expose navigation");
    await page.locator("#libraryInput").setInputFiles(targetPhoto);
    await page.locator("#targetWorkspace:not([hidden])").waitFor();

    const fit = await page.evaluate(() => {
      const viewportTop = visualViewport?.offsetTop || 0;
      const viewportBottom = viewportTop + (visualViewport?.height || innerHeight);
      const headerBottom = document.querySelector(".sl-app-header").getBoundingClientRect().bottom;
      const frame = document.getElementById("imageFrame").getBoundingClientRect();
      const dock = document.getElementById("workflowDock").getBoundingClientRect();
      const targetProbe = document.elementFromPoint(frame.left + (frame.width / 2), frame.bottom - 2);
      const controls = ["undoImpact", "clearImpacts", "showResults"].map(id => {
        const rect = document.getElementById(id).getBoundingClientRect();
        return { id, top: rect.top, bottom: rect.bottom };
      });
      return {
        viewportHeight: visualViewport?.height || innerHeight,
        fullTargetVisible: frame.top >= Math.max(viewportTop, headerBottom) && frame.bottom <= viewportBottom,
        targetDoesNotOverlapAction: frame.bottom <= dock.top,
        targetProbeUnobscured: document.getElementById("imageFrame").contains(targetProbe),
        dockVisible: dock.top >= viewportTop && dock.bottom <= viewportBottom,
        controlsVisible: controls.every(rect => rect.top >= viewportTop && rect.bottom <= viewportBottom),
        horizontalOverflow: document.documentElement.scrollWidth > window.innerWidth
      };
    });
    assert.equal(fit.fullTargetVisible, true, `${viewport.width}px complete target visibility`);
    assert.equal(fit.targetDoesNotOverlapAction, true, `${viewport.width}px target must not overlap the workflow dock`);
    assert.equal(fit.targetProbeUnobscured, true, `${viewport.width}px lower target edge must remain unobscured`);
    assert.equal(fit.dockVisible, true, `${viewport.width}px workflow dock visibility`);
    assert.equal(fit.controlsVisible, true, `${viewport.width}px Undo/Clear/Show Results visibility`);
    assert.equal(fit.horizontalOverflow, false, `${viewport.width}px horizontal containment`);

    const tap = page.locator("#tapSurface");
    const tapBox = await tap.boundingBox();
    const point = (x, y) => ({ x: tapBox.width * x, y: tapBox.height * y });
    await tap.click({ position: point(.3, .3) });
    assert.equal(await page.locator("#undoImpact").isEnabled(), true);
    assert.equal(await page.locator("#clearImpacts").isEnabled(), true);
    assert.equal(await page.locator("#showResults").isEnabled(), true);
    assert.match(await page.locator("#workspaceFeedback").textContent(), /undo or clear a mark, or show results/i);
    await page.locator("#undoImpact").click();
    assert.match(await page.locator("#impactCount").textContent(), /^0 bullet holes/);

    await tap.click({ position: point(.3, .3) });
    await tap.click({ position: point(.45, .45) });
    await page.locator("#clearImpacts").click();
    await page.locator("#confirmationCancel").click();
    assert.match(await page.locator("#impactCount").textContent(), /^2 bullet holes/);
    await page.locator("#clearImpacts").click();
    await page.locator("#confirmationAccept").click();
    assert.match(await page.locator("#impactCount").textContent(), /^0 bullet holes/);

    await tap.click({ position: point(.3, .3) });
    await tap.click({ position: point(.5, .5) });
    await tap.click({ position: point(.7, .7) });
    await page.locator("#showResults").click();
    await page.locator("#supportedResults:not([hidden])").waitFor();
    assert.equal(await page.getByLabel("Open navigation").isVisible(), true, "Results must expose navigation");
    assert.match(await page.locator("#resultImpactCount").textContent(), /^3 bullet holes/);
    const resultsFit = await page.evaluate(() => {
      const viewportTop = visualViewport?.offsetTop || 0;
      const viewportBottom = viewportTop + (visualViewport?.height || innerHeight);
      const headerBottom = document.querySelector(".sl-app-header").getBoundingClientRect().bottom;
      const frame = document.getElementById("imageFrame").getBoundingClientRect();
      const results = document.getElementById("supportedResults").getBoundingClientRect();
      const next = document.getElementById("continueToSec").getBoundingClientRect();
      const targetProbe = document.elementFromPoint(frame.left + (frame.width / 2), frame.bottom - 2);
      return {
        fullTargetVisible: frame.top >= Math.max(viewportTop, headerBottom) && frame.bottom <= viewportBottom,
        targetDoesNotOverlapAction: frame.bottom <= results.top,
        targetProbeUnobscured: document.getElementById("imageFrame").contains(targetProbe),
        resultsVisible: results.top >= viewportTop && results.bottom <= viewportBottom,
        nextActionVisible: next.top >= viewportTop && next.bottom <= viewportBottom
      };
    });
    assert.deepEqual(resultsFit, { fullTargetVisible: true, targetDoesNotOverlapAction: true, targetProbeUnobscured: true, resultsVisible: true, nextActionVisible: true }, `${viewport.width}x${viewport.height} results gate visibility`);

    await page.evaluate(() => {
      const saveEvidence = SCZN3M4.saveTargetEvidenceImage.bind(SCZN3M4);
      const updateSession = SCZN3M4.updateActiveSession.bind(SCZN3M4);
      SCZN3M4.saveTargetEvidenceImage = value => new Promise(resolve => setTimeout(() => resolve(saveEvidence(value)), 350));
      SCZN3M4.updateActiveSession = value => new Promise(resolve => setTimeout(() => resolve(updateSession(value)), 350));
    });

    await page.locator("#continueToSec").click();
    await page.locator("#continueToSec").getByText("Opening your Shooter Experience Card…").waitFor();
    await assertTransitionVisible(page, viewport, "failed transition pending interval");
    await page.locator("#resultFeedback").getByText("Your target is ready. Try Continue to SEC again.").waitFor();
    const recoveredFit = await page.evaluate(() => {
      const viewportTop = visualViewport?.offsetTop || 0;
      const viewportBottom = viewportTop + (visualViewport?.height || innerHeight);
      const headerBottom = document.querySelector(".sl-app-header").getBoundingClientRect().bottom;
      const frame = document.getElementById("imageFrame").getBoundingClientRect();
      const results = document.getElementById("supportedResults").getBoundingClientRect();
      const next = document.getElementById("continueToSec").getBoundingClientRect();
      const targetProbe = document.elementFromPoint(frame.left + (frame.width / 2), frame.bottom - 2);
      return {
        fullTargetVisible: frame.top >= Math.max(viewportTop, headerBottom) && frame.bottom <= viewportBottom,
        targetDoesNotOverlapAction: frame.bottom <= results.top,
        targetProbeUnobscured: document.getElementById("imageFrame").contains(targetProbe),
        resultsVisible: results.top >= viewportTop && results.bottom <= viewportBottom,
        nextActionVisible: next.top >= viewportTop && next.bottom <= viewportBottom,
        impactCount: document.querySelectorAll(".sl-impact-marker").length,
        resultStatePreserved: !document.getElementById("supportedResults").hidden
      };
    });
    assert.equal(recoveredFit.fullTargetVisible, true, `${viewport.width}px retry preserves complete target visibility`);
    assert.equal(recoveredFit.targetDoesNotOverlapAction, true, `${viewport.width}px retry preserves target/action separation`);
    assert.equal(recoveredFit.targetProbeUnobscured, true, `${viewport.width}px retry preserves unobscured target evidence`);
    assert.equal(recoveredFit.resultsVisible, true, `${viewport.width}px retry preserves results visibility`);
    assert.equal(recoveredFit.nextActionVisible, true, `${viewport.width}px retry preserves next-action visibility`);
    assert.equal(recoveredFit.impactCount, 3, `${viewport.width}px retry preserves impact evidence`);
    assert.equal(recoveredFit.resultStatePreserved, true, `${viewport.width}px retry preserves results`);
    await page.locator("#continueToSec").click();
    await page.locator("#continueToSec").getByText("Opening your Shooter Experience Card…").waitFor();
    await assertTransitionVisible(page, viewport, "successful transition pending interval");
    await page.locator("#bakerSecView:not([hidden])").waitFor();
    assert.equal(await page.getByLabel("Open navigation").isVisible(), true, "SEC must expose navigation");
    const liveSecMarkers = await page.locator(".sec-baker-impact-marker").evaluateAll(markers => markers.map(marker => ({
      label: marker.textContent.trim(),
      left: marker.style.left,
      top: marker.style.top
    })));
    assert.deepEqual(liveSecMarkers.map(marker => marker.label), ["1", "2", "3"], "live SEC marker identifiers must confirm the captured impact count");
    const secFit = await page.evaluate(() => {
      const viewportTop = visualViewport?.offsetTop || 0;
      const viewportBottom = viewportTop + (visualViewport?.height || innerHeight);
      const evidence = document.querySelector(".sec-baker-evidence-frame").getBoundingClientRect();
      const action = document.querySelector("[data-baker-save-sec]").getBoundingClientRect();
      const evidenceProbe = document.elementFromPoint(evidence.left + (evidence.width / 2), evidence.bottom - 2);
      return {
        completeEvidenceVisible: evidence.top >= viewportTop && evidence.bottom <= viewportBottom,
        nextActionVisible: action.top >= viewportTop && action.bottom <= viewportBottom,
        evidenceDoesNotOverlapAction: evidence.bottom <= action.top,
        evidenceProbeUnobscured: document.querySelector(".sec-baker-evidence-frame").contains(evidenceProbe),
        horizontalOverflow: document.documentElement.scrollWidth > innerWidth
      };
    });
    assert.deepEqual(secFit, {
      completeEvidenceVisible: true,
      nextActionVisible: true,
      evidenceDoesNotOverlapAction: true,
      evidenceProbeUnobscured: true,
      horizontalOverflow: false
    }, `${viewport.width}x${viewport.height} SEC evidence and preservation-action visibility`);
    await page.locator("[data-baker-save-sec]").click();
    await page.locator("[data-baker-sec-status]").getByText("SEC saved to Ballistic Vault.").waitFor();
    await page.getByRole("link", { name: "View History" }).click();
    await page.waitForURL(url => url.pathname.endsWith("/records.html"));
    assert.equal(await page.getByLabel("Open menu").isVisible(), true, "Vault must expose navigation");
    await page.locator(`[data-session-id="${authoritativeSessionId}"] .vault-record-link`).click();
    await page.locator(".baker-sl-st1-sec-card").waitFor();
    assert.match(await page.locator(".baker-sl-st1-sec-card").textContent(), /3 Bullet Holes/);
    const reopenedSecMarkers = await page.locator(".sec-baker-impact-marker").evaluateAll(markers => markers.map(marker => ({
      label: marker.textContent.trim(),
      left: marker.style.left,
      top: marker.style.top
    })));
    assert.deepEqual(reopenedSecMarkers, liveSecMarkers, "reopened SEC must preserve count identifiers and exact marker coordinates");
    const evidenceRecord = await page.evaluate(() => SCZN3M4.read(SCZN3M4.KEYS.activeSession, null).targetEvidenceImage);
    assert.equal(evidenceRecord.sha256.length, 64, "original evidence hash must be preserved");
    assert.match(evidenceRecord.persistedRepresentation, /^(?:original|geometry-preserving-display-derivative)$/);
    assert.ok(evidenceRecord.dataUrl.length < 430000, "persisted target representation must remain quota-safe");
    assert.equal(await page.getByRole("link", { name: /Back to Vault/i }).isVisible(), true, "Reopened SEC must expose a Vault return path");
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), true);
    assert.deepEqual(pageErrors, []);
    assert.deepEqual(consoleErrors, []);

    await context.close();
    console.log(`PASS Baker SL-ST1 Load → bullet holes → edit → results → SEC → Vault → reopen at ${viewport.width}x${viewport.height}`);
  }
} finally {
  await browser.close();
}
