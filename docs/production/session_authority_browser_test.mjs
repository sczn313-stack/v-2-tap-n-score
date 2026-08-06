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
          equipmentRequirements: {},
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

    const page = await context.newPage();
    await page.goto(`${baseUrl}/matrix.html?target_profile_id=${encodeURIComponent(targetId)}`, { waitUntil: "networkidle" });
    await page.locator("#standardSetupPanel:not(.is-hidden)").waitFor();
    assert.match(await page.locator("#standardSetupPanel").textContent(), /This target will use the Standard Setup shown below\./);
    assert.equal(await page.locator("#standardSetupPanel button").count(), 2);
    assert.equal(await page.locator("#continueStandardSetup").textContent(), "Continue with Standard Setup");
    assert.equal(await page.locator("#chooseWeaponSetup").textContent(), "Weapon Setup");
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
    await context.close();
    console.log(`PASS browser session authority ${targetId}`);
  }

  const setupChoiceContext = await browser.newContext({ viewport: { width: 390, height: 844 } });
  await setupChoiceContext.route("**/api/session/prepare", async route => {
    const profile = profiles.m4_25m_zero;
    await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({
      ok: true, status: "prepared", preparationToken: "weapon-setup-choice", expiresAt: "2026-08-05T23:59:59+00:00",
      target: { targetId: "m4_25m_zero", ...profile }, missionIdentity: profile.missionIdentity,
      governedDistance: profile.governedDistance, equipmentRequirements: {}, standardSetup: profile.standardSetup,
      setupMode: "standard", compatibilityResults: [{ candidateId: profile.standardSetup.candidateId, compatible: true, reasons: ["requirements_satisfied"] }]
    }) });
  });
  const setupChoicePage = await setupChoiceContext.newPage();
  await setupChoicePage.goto(`${baseUrl}/matrix.html?target_profile_id=m4_25m_zero`, { waitUntil: "networkidle" });
  await setupChoicePage.locator("#standardSetupPanel:not(.is-hidden)").waitFor();
  await setupChoicePage.locator("#chooseWeaponSetup").click();
  assert.equal(await setupChoicePage.locator("#standardSetupPanel").evaluate(node => node.classList.contains("is-hidden")), true);
  assert.equal(await setupChoicePage.locator(".primary-weapon-path").isVisible(), true);
  assert.equal(await setupChoicePage.evaluate(() => sessionStorage.getItem("SCZN3_PENDING_BACKEND_SESSION_START")), null);
  await setupChoiceContext.close();
  console.log("PASS Standard Setup Weapon Setup alternative");

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
