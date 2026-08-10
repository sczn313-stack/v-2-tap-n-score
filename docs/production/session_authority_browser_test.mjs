import assert from "node:assert/strict";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { chromium } = require("playwright");

const baseUrl = process.env.SCZN3_TEST_BASE_URL || "http://127.0.0.1:8101";
const profiles = {
  m4_25m_zero: {
    targetAuthorityId: "M4_TARGET_AUTHORITY_v1_ORIGINAL",
    targetName: "M4/M16 Series Weapons 25M Zero",
    targetProfileVersion: "M4_TARGET_AUTHORITY_v1_ORIGINAL",
    atpId: "m4-25m-zero-atp-v1",
    missionIdentity: { missionFamily: "zeroingCorrection", missionId: "M4_25M_300M_ZERO", resultPackageType: "zeroCorrectionResult" },
    governedDistance: { value: 25, unit: "M", locked: true },
    equipmentRequirements: { weaponCategories: ["Rifle"], requiresAdjustmentSystem: true, allowedAdjustmentUnits: ["MOA", "MRAD"] },
    standardSetup: {
      candidateId: "standard-m4-iron-dch-fsp", weaponCategory: "Rifle", manufacturer: "Colt / FN",
      modelType: "M4/M4A1 Carbine", modelCaliber: "5.56 NATO", opticType: "Iron Sights",
      adjustmentUnit: "MOA", clickValue: null, adjustmentSystem: "M4_IRON_DCH_FSP",
      equipmentAuthorityRecordId: "M4-IRON-DCH-FSP-AUTHORITY-2026-07-28",
      axisAdjustment: { windagePerClick: 0.75, elevationPerClick: 1.5, unit: "MOA" },
      source: "backend_standard_setup", setupAuthority: "backend-target-authority",
      setupAuthorityId: "M4-IRON-DCH-FSP-AUTHORITY-2026-07-28",
      displayFields: [{ label: "Distance", value: "25 meters" }, { label: "Sighting configuration", value: "M4 iron sights" }],
      equipmentFingerprint: "standard-m4-fingerprint"
    }
  },
  baker_st_100yd_smart_zero: {
    targetAuthorityId: "BAKER_ST_100YD_SMART",
    targetName: "Baker 100 Yard Smart Target",
    targetProfileVersion: "BAKER_ST_100YD_SMART_AUTHORITY_v1_ORIGINAL",
    atpId: "baker-100-yard-smart-zero-atp-v1",
    missionIdentity: { missionFamily: "zeroingCorrection", missionId: "BAKER_100YD_ZERO", resultPackageType: "zeroCorrectionResult" },
    governedDistance: { value: 100, unit: "YDS", locked: false },
    equipmentRequirements: { weaponCategories: ["Rifle"], requiresAdjustmentSystem: true, allowedAdjustmentUnits: ["MOA", "MRAD"] },
    standardSetup: {
      candidateId: "standard-baker-100yd-quarter-moa-scope", weaponCategory: "Rifle", manufacturer: "Standard Setup",
      modelType: "Rifle", modelCaliber: "Shooter ammunition", opticType: "Scope", adjustmentUnit: "MOA",
      clickValue: 0.25, source: "backend_standard_setup", setupAuthority: "backend-target-authority",
      setupAuthorityId: "BAKER_ST_100YD_STANDARD_SETUP_v1",
      displayFields: [{ label: "Distance", value: "100 yards" }, { label: "Adjustment", value: "0.25 MOA per click" }],
      equipmentFingerprint: "standard-100yd-fingerprint"
    }
  },
  gssf_ac_1: {
    targetAuthorityId: "gssf_ac_1",
    targetName: "GSSF AC-1",
    targetProfileVersion: "1",
    atpId: "gssf-ac-1-atp-v1",
    missionIdentity: { missionFamily: "gssf", missionId: "GSSF_AC_1_PAPER_PENALTY", resultPackageType: "gssfPaperPenaltyResult" },
    governedDistance: { value: null, unit: null, locked: false },
    equipmentRequirements: { weaponCategories: ["Pistol"], requiresAdjustmentSystem: false, allowedAdjustmentUnits: [] },
    standardSetup: {
      candidateId: "standard-gssf-pistol", weaponCategory: "Pistol", manufacturer: "Standard Setup",
      modelType: "Pistol", modelCaliber: "Shooter ammunition", opticType: "Pistol sights", adjustmentUnit: "",
      clickValue: null, source: "backend_standard_setup", setupAuthority: "backend-target-authority",
      setupAuthorityId: "GSSF_AC_1_STANDARD_SETUP_v1",
      displayFields: [{ label: "Firearm", value: "Pistol" }, { label: "Sighting configuration", value: "Pistol sights" }],
      equipmentFingerprint: "standard-gssf-fingerprint"
    }
  }
};

const browser = await chromium.launch({
  headless: true,
  executablePath: process.env.SCZN3_CHROME_EXECUTABLE || undefined
});
try {
  for (const [targetId, profile] of Object.entries(profiles)) {
    const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
    let preparedCandidate = null;
    await context.route("**/api/session/prepare", async route => {
      const request = route.request().postDataJSON();
      assert.equal(request.targetId, targetId);
      assert.equal(Object.prototype.hasOwnProperty.call(request, "missionFamily"), false);
      assert.equal(Object.prototype.hasOwnProperty.call(request, "equipmentCandidates"), false);
      preparedCandidate = profile.standardSetup;
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          ok: true,
          status: "prepared",
          preparationToken: `test-preparation-${targetId}`,
          expiresAt: "2026-08-05T23:59:59+00:00",
          target: { targetId, ...profile },
          missionIdentity: profile.missionIdentity,
          governedDistance: profile.governedDistance,
          equipmentRequirements: profile.equipmentRequirements,
          standardSetup: preparedCandidate,
          setupMode: "standard",
          compatibilityResults: [{ candidateId: preparedCandidate.candidateId, compatible: true, reasons: ["requirements_satisfied"] }]
        })
      });
    });
    await context.route("**/api/session/start", async route => {
      const request = route.request().postDataJSON();
      assert.equal(request.preparationToken, `test-preparation-${targetId}`);
      assert.deepEqual(request.selectedEquipment, preparedCandidate);
      assert(route.request().headers()["idempotency-key"]);
      await route.fulfill({
        status: 201,
        contentType: "application/json",
        body: JSON.stringify({
          ok: true,
          status: "created",
          authoritativeSessionId: `sczn3-session-browser-${targetId}`,
          createdAt: "2026-08-05T12:00:00+00:00",
          sessionLifecycle: "created",
          target: {
            targetId,
            targetAuthorityId: profile.targetAuthorityId,
            targetName: profile.targetName,
            targetProfileVersion: profile.targetProfileVersion,
            atpId: profile.atpId
          },
          missionIdentity: profile.missionIdentity,
          governedDistance: profile.governedDistance,
          selectedEquipment: preparedCandidate
        })
      });
    });
    const zeroingAuthorityPhases = [];
    if (targetId === "baker_st_100yd_smart_zero") {
      await context.route("**/api/authority/ugeo", async route => {
        const request = route.request().postDataJSON();
        const phase = request.phase || "initial";
        zeroingAuthorityPhases.push(phase);
        const impacts = request.impactCoordinates || [];
        const aim = request.aimCoordinate;
        const poib = impacts.length
          ? {
              xPercent: impacts.reduce((sum, point) => sum + Number(point.xPercent), 0) / impacts.length,
              yPercent: impacts.reduce((sum, point) => sum + Number(point.yPercent), 0) / impacts.length,
            }
          : null;
        await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({
          target_profile_id: targetId,
          targetProfileId: targetId,
          mission_family: "zeroingCorrection",
          missionFamilyId: "zeroingCorrection",
          phase,
          inputs: { aimCoordinate: aim, impactCoordinates: impacts, confirmedAimPoint: aim },
          impacts,
          poib,
          groupCenter: poib,
          score: { value: 88, method: "authority-v1" },
          correction: {
            windage: "4 clicks LEFT", elevation: "2 clicks UP",
            windageDirection: "LEFT", elevationDirection: "UP",
          },
          clicks: {
            windageClicks: 4, elevationClicks: 2,
            windageDirection: "LEFT", elevationDirection: "UP",
            adjustmentUnit: "MOA", clickValue: 0.25, clickValueLabel: "0.25 MOA",
          },
          renderCoordinates: {
            aim, impacts, poib,
            vector: poib && aim ? { start: poib, end: aim, intent: "POIB_TO_AIM" } : null,
          },
          validation: phase === "confirmation"
            ? { status: "recorded", outcome: "CONFIRMATION RECORDED", confirmed: null }
            : { status: "not-requested", outcome: "PENDING" },
          status: { hasAim: true, impactCount: impacts.length, hasPOIB: true, hasCorrection: true },
          evidenceHash: `browser-${phase}-evidence`,
        }) });
      });
    }

    const page = await context.newPage();
    await page.goto(`${baseUrl}/matrix.html?target_profile_id=${encodeURIComponent(targetId)}`, { waitUntil: "networkidle" });
    await page.locator("#standardSetupPanel:not(.is-hidden)").waitFor();
    assert.match(await page.locator("#standardSetupPanel").textContent(), /This target will use the Standard Setup shown below\./);
    assert.equal(await page.locator("#standardSetupPanel button").count(), 2);
    assert.equal(await page.locator("#continueStandardSetup").textContent(), "Continue with Standard Setup");
    assert.equal(await page.locator("#chooseWeaponSetup").textContent(), "Equipment");
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), true);
    await page.locator("#continueStandardSetup").click();
    await page.waitForURL(url => url.pathname.endsWith("/shoot.html") && url.searchParams.get("session") === `sczn3-session-browser-${targetId}`);
    const stored = await page.evaluate(sessionId => {
      const key = `SCZN3_BAKER_SESSION_RECORD_${encodeURIComponent(sessionId)}`;
      return JSON.parse(localStorage.getItem(key));
    }, `sczn3-session-browser-${targetId}`);
    assert.equal(stored.authoritativeSessionId, `sczn3-session-browser-${targetId}`);
    assert.equal(stored.sessionIdAuthority, "backend");
    assert.equal(stored.sessionNumberAuthority, "device-local-temporary");
    assert.equal(stored.sessionLabel, "Session #001");
    assert.equal(stored.mission_family, profile.missionIdentity.missionFamily);
    assert.equal(stored.matrixSnapshot.setupMode, "standard");
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), true);
    if (targetId === "baker_st_100yd_smart_zero") {
      await page.locator("#targetImageInput").setInputFiles("assets/BAKER_ST_100YD_SMART_AUTHORITY_v1_ORIGINAL.png");
      await page.locator("#markSurface").waitFor();
      const targetBox = await page.locator("#markSurface").boundingBox();
      assert(targetBox, "100 Yard target surface must be rendered");
      const tap = async (x, y) => page.mouse.click(targetBox.x + targetBox.width * x, targetBox.y + targetBox.height * y);
      await tap(0.50, 0.50);
      await tap(0.44, 0.45);
      await tap(0.46, 0.47);
      await tap(0.48, 0.46);
      await page.locator("#showResults").click();
      await page.locator('.sczn3-live-correction-card[data-axis="windage"]').waitFor();
      assert.equal(await page.locator("#missionWorkspaceGuidance").isVisible(), true);
      assert.match(await page.locator("#missionWorkspaceGuidance").textContent(), /Apply the correction, then begin confirmation\./);
      assert.match(await page.locator("#saveMarks").textContent(), /Apply the Correction, Then Begin Confirmation/);
      await page.locator("#saveMarks").click();
      await page.waitForFunction(() => document.body.dataset.m4LivePhase === "confirmation");
      assert.equal(await page.locator("#missionWorkspaceGuidance").isVisible(), true);
      assert.match(await page.locator("#missionWorkspaceGuidance").textContent(), /Tap each hole in the confirmation group\./);
      await tap(0.495, 0.50);
      await tap(0.50, 0.495);
      await tap(0.505, 0.50);
      await page.locator("#showResults").click();
      await page.waitForFunction(() => /Confirmation recorded/i.test(document.getElementById("missionWorkspaceGuidance")?.textContent || ""));
      assert.deepEqual(zeroingAuthorityPhases, ["initial", "confirmation"]);
      await page.locator("#saveMarks").click();
      await page.waitForURL(url => url.pathname.endsWith("/records.html") && url.searchParams.get("session") === `sczn3-session-browser-${targetId}`);
      const completed = await page.evaluate(sessionId => {
        const key = `SCZN3_BAKER_SESSION_RECORD_${encodeURIComponent(sessionId)}`;
        return JSON.parse(localStorage.getItem(key));
      }, `sczn3-session-browser-${targetId}`);
      assert.equal(completed.savedToSEC, true);
      assert.equal(completed.confirmationStatus, "Recorded");
      assert.equal(completed.confirmationImpactPoints.length, 3);
      assert.equal(completed.confirmationAuthorityPackage.validation.outcome, "CONFIRMATION RECORDED");
      console.log("PASS 100 Yard initial correction → confirmation → preserved SEC workflow");
    }
    await context.close();
    console.log(`PASS browser session authority ${targetId}`);
  }

  for (const [targetId, profile] of Object.entries(profiles)) {
    const desktopContext = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
    await desktopContext.route("**/api/session/prepare", async route => {
      const candidate = profile.standardSetup;
      await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({
        ok: true, status: "prepared", preparationToken: `desktop-${targetId}`, expiresAt: "2026-08-05T23:59:59+00:00",
        target: { targetId, ...profile }, missionIdentity: profile.missionIdentity,
        governedDistance: profile.governedDistance, equipmentRequirements: profile.equipmentRequirements,
        standardSetup: candidate, setupMode: "standard",
        compatibilityResults: [{ candidateId: candidate.candidateId, compatible: true, reasons: ["requirements_satisfied"] }]
      }) });
    });
    const desktopPage = await desktopContext.newPage();
    await desktopPage.goto(`${baseUrl}/matrix.html?target_profile_id=${encodeURIComponent(targetId)}`, { waitUntil: "networkidle" });
    await desktopPage.locator("#standardSetupPanel:not(.is-hidden)").waitFor();
    assert.equal(await desktopPage.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), true);
    await desktopContext.close();
    console.log(`PASS desktop Standard Setup layout ${targetId}`);
  }

  const setupChoiceContext = await browser.newContext({ viewport: { width: 390, height: 844 } });
  await setupChoiceContext.addInitScript(() => {
    localStorage.setItem("SCZN3_BAKER_ACTIVE_MATRIX", JSON.stringify({
      setupId: "stale-m4-setup", weaponCategory: "Rifle", weaponManufacturer: "Colt",
      weaponModelType: "M4/M4A1 Carbine", weaponModelCaliber: "5.56 NATO",
      opticType: "Iron Sights", opticAdjustmentUnit: "MOA", opticClickValue: "0.5",
      target_profile_id: "m4_25m_zero", targetProfileId: "m4_25m_zero"
    }));
  });
  await setupChoiceContext.route("**/api/session/prepare", async route => {
    const profile = profiles.gssf_ac_1;
    await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({
      ok: true, status: "prepared", preparationToken: "weapon-setup-choice", expiresAt: "2026-08-05T23:59:59+00:00",
      target: { targetId: "gssf_ac_1", ...profile }, missionIdentity: profile.missionIdentity,
      governedDistance: profile.governedDistance, equipmentRequirements: profile.equipmentRequirements, standardSetup: profile.standardSetup,
      setupMode: "standard", compatibilityResults: [{ candidateId: profile.standardSetup.candidateId, compatible: true, reasons: ["requirements_satisfied"] }]
    }) });
  });
  const setupChoicePage = await setupChoiceContext.newPage();
  await setupChoicePage.goto(`${baseUrl}/matrix.html?target_profile_id=gssf_ac_1`, { waitUntil: "networkidle" });
  await setupChoicePage.locator("#standardSetupPanel:not(.is-hidden)").waitFor();
  await setupChoicePage.locator("#chooseWeaponSetup").click();
  assert.equal(await setupChoicePage.locator("#standardSetupPanel").evaluate(node => node.classList.contains("is-hidden")), true);
  assert.equal(await setupChoicePage.locator(".primary-weapon-path").isVisible(), true);
  assert.equal(await setupChoicePage.locator("#weaponCategory").inputValue(), "Pistol");
  assert.notEqual(await setupChoicePage.locator("#weaponModelType").inputValue(), "M4/M4A1 Carbine");
  assert.equal(await setupChoicePage.evaluate(() => sessionStorage.getItem("SCZN3_PENDING_BACKEND_SESSION_START")), null);
  await setupChoiceContext.close();
  console.log("PASS GSSF Weapon Setup initializes backend-compatible pistol requirements");

  const savedSetupContext = await browser.newContext({ viewport: { width: 390, height: 844 } });
  let savedSetupStartRequests = 0;
  await savedSetupContext.addInitScript(() => {
    localStorage.setItem("SCZN3_BAKER_SAVED_SETUPS", JSON.stringify([
      {
        setupId: "pistol-older", setupName: "Older Compatible Pistol", updatedAt: "2026-08-01T12:00:00Z",
        weaponCategory: "Pistol", weaponManufacturer: "Glock", weaponModelType: "G19", weaponModelCaliber: "9mm",
        opticType: "Iron Sights", opticAdjustmentUnit: "MOA", opticClickValue: "0.25"
      },
      {
        setupId: "rifle-newest", setupName: "Newest Incompatible Rifle", updatedAt: "2026-08-05T12:00:00Z",
        weaponCategory: "Rifle", weaponManufacturer: "Colt", weaponModelType: "M4", weaponModelCaliber: "5.56 NATO",
        opticType: "Iron Sights", opticAdjustmentUnit: "MOA", opticClickValue: "0.5"
      },
      {
        setupId: "pistol-recent", setupName: "Most Recent Compatible Pistol", updatedAt: "2026-08-04T12:00:00Z",
        weaponCategory: "Pistol", weaponManufacturer: "Glock", weaponModelType: "G17", weaponModelCaliber: "9mm",
        opticType: "Iron Sights", opticAdjustmentUnit: "MOA", opticClickValue: "0.25"
      }
    ]));
  });
  await savedSetupContext.route("**/api/session/prepare", async route => {
    const request = route.request().postDataJSON();
    assert.equal(request.targetId, "gssf_ac_1");
    assert.equal(request.equipmentCandidates.length, 3);
    await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({
      ok: true, status: "prepared", preparationToken: "saved-compatible-choice", expiresAt: "2026-08-05T23:59:59+00:00",
      target: { targetId: "gssf_ac_1", ...profiles.gssf_ac_1 }, missionIdentity: profiles.gssf_ac_1.missionIdentity,
      governedDistance: profiles.gssf_ac_1.governedDistance, equipmentRequirements: profiles.gssf_ac_1.equipmentRequirements,
      standardSetup: profiles.gssf_ac_1.standardSetup, setupMode: "shooter-selected",
      compatibilityResults: request.equipmentCandidates.map(candidate => ({
        candidateId: candidate.candidateId,
        compatible: candidate.weaponCategory === "Pistol",
        reasons: candidate.weaponCategory === "Pistol" ? ["requirements_satisfied"] : ["weapon_category_incompatible"]
      }))
    }) });
  });
  await savedSetupContext.route("**/api/session/start", async route => {
    savedSetupStartRequests += 1;
    await route.fulfill({ status: 500, contentType: "application/json", body: JSON.stringify({ ok: false, reason: "test_stop" }) });
  });
  const savedSetupPage = await savedSetupContext.newPage();
  await savedSetupPage.goto(`${baseUrl}/matrix.html?target_profile_id=gssf_ac_1`, { waitUntil: "networkidle" });
  await savedSetupPage.waitForFunction(() => /Most Recent Compatible Pistol is compatible and selected/.test(document.getElementById("sessionAuthorityStatus")?.textContent || ""));
  assert.equal(await savedSetupPage.locator("#savedSetupSelect").inputValue(), "pistol-recent");
  assert.equal(await savedSetupPage.locator("#weaponCategory").inputValue(), "Pistol");
  assert.equal(savedSetupStartRequests, 0, "preselection must not create a session before shooter confirmation");
  await savedSetupContext.close();
  console.log("PASS most recently used backend-compatible weapon is preselected without session creation");

  const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
  await context.route("**/api/session/prepare", route => route.abort("failed"));
  const page = await context.newPage();
  await page.goto(`${baseUrl}/matrix.html?target_profile_id=m4_25m_zero`, { waitUntil: "networkidle" });
  await page.evaluate(() => setForm({
    weaponCategory: "Rifle",
    weaponManufacturer: "Colt",
    weaponModelType: "AR Platform",
    weaponModelCaliber: "5.56 NATO",
    opticType: "Iron Sights",
    opticAdjustmentUnit: "MOA",
    opticClickValue: "0.5"
  }));
  await page.locator('#matrixForm button[type="submit"]').click();
  await page.waitForFunction(() => /selections are preserved/i.test(document.getElementById("sessionAuthorityStatus")?.textContent || ""));
  assert.match(await page.locator("#sessionAuthorityStatus").textContent(), /selections are preserved/i);
  assert(page.url().includes("matrix.html"));
  assert.equal(await page.evaluate(() => localStorage.getItem("SCZN3_BAKER_ACTIVE_SESSION")), null);
  await context.close();
  console.log("PASS browser session authority fail-closed retry state");
} finally {
  await browser.close();
}
