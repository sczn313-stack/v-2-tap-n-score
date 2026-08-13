import assert from "node:assert/strict";
import path from "node:path";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { chromium } = require("playwright");
const baseUrl = process.env.SCZN3_TEST_BASE_URL || "http://127.0.0.1:8137";
const targetPhoto = path.resolve("assets/M4_M16_SERIES_WEAPONS_25M_ZERO_FOUNDER_PHOTO.jpeg");
const TARGET_ID = "BAKER_SL_ST1";
const resultPackageType = "smartEvidenceResult";
const missionFamily = "smartEvidenceCapture";

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
  for (const viewport of [{ width: 1440, height: 1000 }, { width: 390, height: 844 }]) {
    const context = await browser.newContext({ viewport });
    const pageErrors = [];
    const consoleErrors = [];
    const preparation = sessionPreparation();
    const authoritativeSessionId = `sl-st1-flow-${viewport.width}`;
    const page = await context.newPage();
    let startAttempts = 0;

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
      await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(preparation.body) });
    });
    await context.route("**/api/session/start", async route => {
      startAttempts += 1;
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

    await page.goto(`${baseUrl}/t/baker/sl-st1/?flow=${viewport.width}`, { waitUntil: "networkidle" });
    assert.equal(await page.getByLabel("Open navigation").isVisible(), true, "Load Photo must expose navigation");
    await page.locator("#libraryInput").setInputFiles(targetPhoto);
    await page.locator("#targetWorkspace:not([hidden])").waitFor();

    const fit = await page.evaluate(() => {
      const frame = document.getElementById("imageFrame").getBoundingClientRect();
      const dock = document.getElementById("workflowDock").getBoundingClientRect();
      const controls = ["undoImpact", "clearImpacts", "showResults"].map(id => {
        const rect = document.getElementById(id).getBoundingClientRect();
        return { id, top: rect.top, bottom: rect.bottom };
      });
      return {
        viewportHeight: window.innerHeight,
        fullTargetVisible: frame.top >= 0 && frame.bottom <= window.innerHeight,
        dockVisible: dock.top >= 0 && dock.bottom <= window.innerHeight,
        controlsVisible: controls.every(rect => rect.top >= 0 && rect.bottom <= window.innerHeight),
        horizontalOverflow: document.documentElement.scrollWidth > window.innerWidth
      };
    });
    assert.equal(fit.fullTargetVisible, true, `${viewport.width}px complete target visibility`);
    assert.equal(fit.dockVisible, true, `${viewport.width}px workflow dock visibility`);
    assert.equal(fit.controlsVisible, true, `${viewport.width}px Undo/Clear/Show Results visibility`);
    assert.equal(fit.horizontalOverflow, false, `${viewport.width}px horizontal containment`);

    const tap = page.locator("#tapSurface");
    await tap.click({ position: { x: 120, y: 130 } });
    assert.equal(await page.locator("#undoImpact").isEnabled(), true);
    assert.equal(await page.locator("#clearImpacts").isEnabled(), true);
    assert.equal(await page.locator("#showResults").isEnabled(), true);
    assert.match(await page.locator("#workspaceFeedback").textContent(), /undo or clear a mark, or show results/i);
    await page.locator("#undoImpact").click();
    assert.match(await page.locator("#impactCount").textContent(), /^0 impacts/);

    await tap.click({ position: { x: 120, y: 130 } });
    await tap.click({ position: { x: 150, y: 170 } });
    await page.locator("#clearImpacts").click();
    await page.locator("#confirmationCancel").click();
    assert.match(await page.locator("#impactCount").textContent(), /^2 impacts/);
    await page.locator("#clearImpacts").click();
    await page.locator("#confirmationAccept").click();
    assert.match(await page.locator("#impactCount").textContent(), /^0 impacts/);

    await tap.click({ position: { x: 110, y: 120 } });
    await tap.click({ position: { x: 145, y: 155 } });
    await tap.click({ position: { x: 175, y: 190 } });
    await page.locator("#showResults").click();
    await page.locator("#supportedResults:not([hidden])").waitFor();
    assert.equal(await page.getByLabel("Open navigation").isVisible(), true, "Results must expose navigation");
    assert.match(await page.locator("#resultImpactCount").textContent(), /^3 impacts/);

    await page.locator("#continueToSec").click();
    await page.getByText("Your target is ready. Try Continue to SEC again.").waitFor();
    const recoveredFit = await page.evaluate(() => {
      const frame = document.getElementById("imageFrame").getBoundingClientRect();
      const dock = document.getElementById("workflowDock").getBoundingClientRect();
      const controls = ["undoImpact", "clearImpacts", "showResults"].map(id => document.getElementById(id).getBoundingClientRect());
      return {
        fullTargetVisible: frame.top >= 0 && frame.bottom <= window.innerHeight,
        dockVisible: dock.top >= 0 && dock.bottom <= window.innerHeight,
        controlsVisible: controls.every(rect => rect.top >= 0 && rect.bottom <= window.innerHeight),
        impactCount: document.querySelectorAll(".sl-impact-marker").length,
        resultsVisible: !document.getElementById("supportedResults").hidden
      };
    });
    assert.equal(recoveredFit.fullTargetVisible, true, `${viewport.width}px retry preserves complete target visibility`);
    assert.equal(recoveredFit.dockVisible, true, `${viewport.width}px retry preserves workflow visibility`);
    assert.equal(recoveredFit.controlsVisible, true, `${viewport.width}px retry preserves workflow controls`);
    assert.equal(recoveredFit.impactCount, 3, `${viewport.width}px retry preserves impact evidence`);
    assert.equal(recoveredFit.resultsVisible, true, `${viewport.width}px retry preserves results`);
    await page.locator("#continueToSec").click();
    await page.locator("#bakerSecView:not([hidden])").waitFor();
    assert.equal(await page.getByLabel("Open navigation").isVisible(), true, "SEC must expose navigation");
    await page.locator("[data-baker-save-sec]").click();
    await page.locator("[data-baker-sec-status]").waitFor();
    assert.match(await page.locator("[data-baker-sec-status]").textContent(), /saved to Ballistic Vault/i);
    await page.getByRole("link", { name: "View History" }).click();
    await page.waitForURL(url => url.pathname.endsWith("/records.html"));
    assert.equal(await page.getByLabel("Open menu").isVisible(), true, "Vault must expose navigation");
    await page.locator(`[data-session-id="${authoritativeSessionId}"] .vault-record-link`).click();
    await page.locator(".baker-sl-st1-sec-card").waitFor();
    assert.match(await page.locator(".baker-sl-st1-sec-card").textContent(), /3 Impacts/);
    const evidenceRecord = await page.evaluate(() => SCZN3M4.read(SCZN3M4.KEYS.activeSession, null).targetEvidenceImage);
    assert.equal(evidenceRecord.sha256.length, 64, "original evidence hash must be preserved");
    assert.equal(evidenceRecord.persistedRepresentation, "geometry-preserving-display-derivative");
    assert.ok(evidenceRecord.dataUrl.length < 430000, "persisted target representation must remain quota-safe");
    assert.equal(await page.getByRole("link", { name: /Back to Vault/i }).isVisible(), true, "Reopened SEC must expose a Vault return path");
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), true);
    assert.deepEqual(pageErrors, []);
    assert.deepEqual(consoleErrors, []);

    await context.close();
    console.log(`PASS Baker SL-ST1 Load → impacts → edit → results → SEC → Vault → reopen at ${viewport.width}px`);
  }
} finally {
  await browser.close();
}
