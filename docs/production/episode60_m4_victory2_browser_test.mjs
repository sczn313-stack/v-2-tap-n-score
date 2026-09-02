import assert from "node:assert/strict";
import path from "node:path";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { chromium } = require("playwright");
const baseUrl = process.env.SCZN3_TEST_BASE_URL || "http://127.0.0.1:8137";
const liveReviewAuthority = process.env.SCZN3_TEST_LIVE_REVIEW_AUTHORITY === "1";
const targetPhoto = path.resolve("docs/assets/M4_M16_SERIES_WEAPONS_25M_ZERO_FOUNDER_PHOTO.jpeg");
const registrationPackageId = "m4-m16-25m-zero-photo-registration-v1";
const targetProfileVersion = "M4_TARGET_AUTHORITY_v1_ORIGINAL";
const canonicalCoordinateSystemId = "M4_M16_25M_ZERO_AUTHORITY_v1";
const bullYPercent = 43.181818;
const equipmentAuthorityRecordId = "M4-M16-25M-ZERO-FSP-AUTHORITY-2026-09-01";

const standardSetup = {
  candidateId: "standard-m4-iron-dch-fsp",
  weaponCategory: "Rifle",
  manufacturer: "Colt / FN",
  modelType: "M4/M4A1 Carbine",
  modelCaliber: "5.56 NATO",
  opticType: "Iron Sights",
  adjustmentUnit: "MOA",
  clickValue: null,
  source: "backend_standard_setup",
  setupAuthority: "backend-target-authority",
  setupAuthorityId: equipmentAuthorityRecordId,
  adjustmentSystem: "M4_IRON_DCH_FSP",
  equipmentAuthorityRecordId,
  axisAdjustment: { windagePerClick: 0.75, elevationPerClick: 1.75, unit: "MOA" },
  displayFields: [
    { label: "Distance", value: "25 meters" },
    { label: "Firearm", value: "M4/M4A1 Carbine" },
    { label: "Sighting configuration", value: "M4/M4A1 Carbine — Detachable Carrying Handle and Front Sight Post" },
    { label: "Windage", value: "0.75 MOA per click" },
    { label: "Elevation", value: "1.75 MOA per click" }
  ],
  equipmentFingerprint: "47d00fd96a844f26073332c5610b92d368976976ff67eb090f17aa5ae50fc2ff"
};

function registrationAuthority() {
  return {
    registrationPackageId,
    registrationPackageVersion: "1",
    canonicalCoordinateSystemId,
    status: "available"
  };
}

function preparedPackage() {
  return {
    ok: true,
    status: "prepared",
    preparationToken: "episode60-m4-victory2-preparation",
    expiresAt: "2026-09-01T23:59:59+00:00",
    target: {
      targetId: "m4_25m_zero",
      targetAuthorityId: targetProfileVersion,
      targetName: "M4/M16 Series Weapons 25M Zero",
      targetProfileVersion,
      atpId: "m4-25m-zero-atp-v1"
    },
    targetAdmission: { status: "admitted", targetId: "m4_25m_zero" },
    missionIdentity: { missionFamily: "zeroingCorrection", missionId: "M4_25M_300M_ZERO", resultPackageType: "zeroCorrectionResult" },
    governedDistance: { value: 25, unit: "M", locked: true },
    registrationAuthority: registrationAuthority(),
    equipmentRequirements: { weaponCategories: ["Rifle"], modelFamilies: ["AR Platform", "M4", "M16"], requiresAdjustmentSystem: true, allowedAdjustmentUnits: ["MOA", "MRAD"] },
    standardSetup,
    setupMode: "standard",
    equipmentAssessments: [{
      candidateId: standardSetup.candidateId,
      equipmentFingerprint: standardSetup.equipmentFingerprint,
      officialMission: { status: "eligible", missionId: "M4_25M_300M_ZERO", restrictionIds: [] },
      capabilities: {
        evidence: { status: "available" },
        measurement: { status: "available" },
        correction: { status: "available", scope: "official_mission", provenance: "registered_equipment_authority", physicalControlDirectionsAvailable: true },
        officialScore: { status: "not_applicable" }
      },
      restrictions: []
    }],
    restrictions: []
  };
}

function startedPackage(sessionId) {
  const prepared = preparedPackage();
  return {
    ok: true,
    status: "created",
    authoritativeSessionId: sessionId,
    createdAt: "2026-09-01T15:00:00+00:00",
    sessionLifecycle: "created",
    sessionMode: "official_mission",
    target: prepared.target,
    targetAdmission: prepared.targetAdmission,
    missionIdentity: prepared.missionIdentity,
    officialMission: { status: "eligible", missionId: "M4_25M_300M_ZERO", restrictionIds: [] },
    capabilities: prepared.equipmentAssessments[0].capabilities,
    restrictions: [],
    governedDistance: prepared.governedDistance,
    registrationAuthority: prepared.registrationAuthority,
    selectedEquipment: standardSetup,
    setupMode: "standard"
  };
}

async function tapPercent(page, xPercent, yPercent) {
  const surface = page.locator("#markSurface");
  const box = await surface.boundingBox();
  assert(box, "Precision Tap surface must be visible");
  await page.mouse.click(box.x + box.width * xPercent / 100, box.y + box.height * yPercent / 100);
}

async function submitFounderResult(page) {
  await page.locator("#showResults:visible").click();
  const contextButton = page.locator("#confirmCorrectionContext:visible");
  await contextButton.waitFor();
  await contextButton.click();
  await page.waitForFunction(() => document.body.dataset.hasResults === "true").catch(async error => {
    const diagnostic = await page.evaluate(() => ({
      hasResults: document.body.dataset.hasResults,
      status: document.getElementById("saveSessionStatus")?.textContent || "",
      results: document.getElementById("resultsGrid")?.textContent || "",
      runtimeErrors: window.__SCZN3_WORKSPACE_RUNTIME_ERRORS__,
      activeSession: window.SCZN3M4?.read(window.SCZN3M4.KEYS.activeSession, null)
    }));
    throw new Error(`M4 result did not become authoritative: ${JSON.stringify(diagnostic)}`, { cause: error });
  });
}

async function parity(page, sessionId) {
  return page.evaluate(id => {
    const session = window.SCZN3M4.loadSession(id);
    return {
      sessionId: session.sessionId,
      initialEvidenceHash: session.m4AuthorityPackage.evidenceHash,
      confirmationEvidenceHash: session.confirmationAuthorityPackage.evidenceHash,
      targetPhotoSha256: session.targetEvidenceImage.sourceImageSha256,
      initialRegistrationEvidenceId: session.m4AuthorityPackage.targetImageRegistrationEvidence.registrationEvidenceId,
      confirmationRegistrationEvidenceId: session.confirmationAuthorityPackage.targetImageRegistrationEvidence.registrationEvidenceId,
      initialRegistrationPackageId: session.m4AuthorityPackage.targetImageRegistrationEvidence.registrationPackageId,
      confirmationRegistrationPackageId: session.confirmationAuthorityPackage.targetImageRegistrationEvidence.registrationPackageId,
      initialImpactCoordinates: session.m4AuthorityPackage.inputs.impactCoordinates,
      confirmationImpactCoordinates: session.confirmationAuthorityPackage.inputs.impactCoordinates,
      initialRenderCoordinates: session.m4AuthorityPackage.renderCoordinates,
      confirmationRenderCoordinates: session.confirmationAuthorityPackage.renderCoordinates,
      equipmentAuthorityRecordId: session.m4AuthorityPackage.mechanicalSightAuthority.recordId,
      savedToSEC: session.savedToSEC,
      preservedAt: session.preservedAt
    };
  }, sessionId);
}

const browser = await chromium.launch({ headless: true, executablePath: process.env.SCZN3_CHROME_EXECUTABLE || undefined });

try {
  for (const viewport of [{ width: 1440, height: 1000 }, { width: 390, height: 844 }]) {
    const context = await browser.newContext({ viewport });
    let sessionId = `episode60-m4-victory2-${viewport.width}`;
    const errors = [];
    const registrationRequests = [];
    const registrationResponses = [];
    const authorityRequests = [];
    const authorityResponses = [];
    let preservedSession = null;

    if (!liveReviewAuthority) {
      await context.route("**/api/session/prepare", async route => {
        assert.equal(route.request().postDataJSON().targetId, "m4_25m_zero");
        await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(preparedPackage()) });
      });
      await context.route("**/api/session/start", async route => {
        const request = route.request().postDataJSON();
        assert.equal(request.preparationToken, "episode60-m4-victory2-preparation");
        assert.equal(request.selectedEquipment.equipmentAuthorityRecordId, equipmentAuthorityRecordId);
        await route.fulfill({ status: 201, contentType: "application/json", body: JSON.stringify(startedPackage(sessionId)) });
      });
    }
    await context.route("**/api/authority/target-image-registration", async route => {
      registrationRequests.push(route.request().postDataJSON());
      const response = await route.fetch();
      registrationResponses.push(await response.json());
      await route.fulfill({ response });
    });
    await context.route("**/api/authority/m4", async route => {
      authorityRequests.push(route.request().postDataJSON());
      const response = await route.fetch();
      authorityResponses.push({ status: response.status(), body: await response.json() });
      await route.fulfill({ response });
    });
    await context.route("**/api/session/sec*", async route => {
      if (liveReviewAuthority) {
        if (route.request().method() === "POST") preservedSession = route.request().postDataJSON().session;
        const response = await route.fetch();
        await route.fulfill({ response });
        return;
      }
      if (route.request().method() === "POST") {
        preservedSession = route.request().postDataJSON().session;
        await route.fulfill({
          status: 201,
          contentType: "application/json",
          body: JSON.stringify({ ok: true, status: "preserved", session: preservedSession, artifactSha256: "episode60-victory2-browser-artifact", preservedAt: preservedSession.preservedAt, reopenCapability: `capability-${sessionId}` })
        });
        return;
      }
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ ok: true, status: "preserved", session: preservedSession, artifactSha256: "episode60-victory2-browser-artifact", preservedAt: preservedSession?.preservedAt })
      });
    });

    const page = await context.newPage();
    page.on("pageerror", error => errors.push(error.message));
    await page.goto(`${baseUrl}/matrix.html?target_profile_id=m4_25m_zero&founder_review=1`, { waitUntil: "networkidle" });
    await page.locator("#continueStandardSetup:visible").click();
    await page.waitForURL(url => url.pathname.endsWith("/shoot.html"));
    assert.equal(new URL(page.url()).searchParams.get("founder_review"), "1");
    if (liveReviewAuthority) {
      sessionId = await page.evaluate(() => window.SCZN3M4.read(window.SCZN3M4.KEYS.activeSession, null)?.sessionId || "");
      assert(sessionId, "live Founder review authority must issue a backend session id");
    }

    await page.locator("#targetImageInput").setInputFiles(targetPhoto);
    await page.waitForFunction(() => document.body.dataset.precisionTapRegistration === "complete" && document.body.dataset.precisionTapPhotoSource === "shooter", null, { timeout: 15000 }).catch(async error => {
      const diagnostic = await page.evaluate(() => ({
        url: location.href,
        registration: document.body.dataset.precisionTapRegistration,
        source: document.body.dataset.precisionTapPhotoSource,
        state: document.body.dataset.rangeState,
        saveStatus: document.getElementById("saveSessionStatus")?.textContent || "",
        evidence: window.SCZN3M4.read(window.SCZN3M4.KEYS.activeSession, null)?.targetEvidenceImage || null,
        runtimeErrors: window.__SCZN3_WORKSPACE_RUNTIME_ERRORS__
      }));
      throw new Error(`M4 ADD PHOTO did not become registered: ${JSON.stringify({ diagnostic, registrationResponses })}`, { cause: error });
    });
    assert.equal(registrationRequests.length, 1, "ADD PHOTO performs one governed registration request");
    assert.equal(registrationRequests[0].registrationPackageId, registrationPackageId);
    assert.equal(registrationRequests[0].targetProfileVersion, targetProfileVersion);

    await tapPercent(page, 50, bullYPercent);
    await tapPercent(page, 59.7, 34.5);
    await tapPercent(page, 60, 34.5);
    await tapPercent(page, 60.3, 34.5);
    await submitFounderResult(page).catch(error => {
      throw new Error(`${error.message}; authority=${JSON.stringify(authorityResponses)}`, { cause: error });
    });
    assert.equal(authorityRequests.length, 1);
    assert.equal(authorityRequests[0].phase, "initial");
    assert.equal(authorityRequests[0].precisionTapEvidence.registrationPackageId, registrationPackageId);
    await page.locator("#saveMarks:visible", { hasText: "Begin Confirmation" }).click();
    await page.waitForFunction(() => document.body.dataset.m4LivePhase === "confirmation" && document.body.dataset.hasResults === "false");

    await tapPercent(page, 49.9, bullYPercent - .1);
    await tapPercent(page, 50.1, bullYPercent);
    await tapPercent(page, 50, bullYPercent + .1);
    await submitFounderResult(page);
    assert.equal(authorityRequests.length, 2);
    assert.equal(authorityRequests[1].phase, "confirmation");
    await page.locator("#saveMarks:visible", { hasText: "Save Session" }).click();
    await page.waitForURL(url => url.pathname.endsWith("/sec.html"));

    const secShell = page.locator('[data-sec-shell="universal-v1"][data-sec-adapter-id="m4-zeroing"]');
    await secShell.waitFor();
    await page.waitForFunction(() => document.querySelectorAll("#beforeEvidenceMarkers .impact-marker").length === 3
      && document.querySelectorAll("#confirmationMarkers .impact-marker").length === 3).catch(async error => {
      const diagnostic = await page.evaluate(() => ({
        missing: document.getElementById("missingState")?.textContent || "",
        before: document.getElementById("beforeEvidenceMarkers")?.innerHTML,
        after: document.getElementById("confirmationMarkers")?.innerHTML,
        active: window.SCZN3M4?.read(window.SCZN3M4.KEYS.activeSession, null)
      }));
      throw new Error(`SEC evidence did not render: ${JSON.stringify({ errors, diagnostic })}`, { cause: error });
    });
    const secDiagnostic = await page.evaluate(() => ({
      before: document.getElementById("beforeEvidenceMarkers")?.innerHTML,
      after: document.getElementById("confirmationMarkers")?.innerHTML,
      session: window.SCZN3M4?.getActiveSession?.()
    }));
    assert.equal(await page.locator("#beforeEvidenceMarkers .impact-marker").count(), 3, JSON.stringify(secDiagnostic));
    assert.equal(await page.locator("#confirmationMarkers .impact-marker").count(), 3);
    const actionDiagnostic = await page.evaluate(() => ({
      url: location.href,
      actionRegions: [...document.querySelectorAll(".sec-preservation-actions")].map(node => node.outerHTML),
      card: document.querySelector('[data-sec-shell="universal-v1"]')?.outerHTML.slice(-3000)
    }));
    assert.equal(await page.locator("#saveSEC").count(), 1, JSON.stringify(actionDiagnostic));
    await page.locator("#saveSEC").click().catch(async error => {
      const diagnostic = await page.evaluate(() => {
        const button = document.getElementById("saveSEC");
        return {
          exists: !!button,
          disabled: button?.disabled,
          hidden: button?.hidden,
          display: button ? getComputedStyle(button).display : "",
          visibility: button ? getComputedStyle(button).visibility : "",
          text: button?.textContent || "",
          confirmation: window.SCZN3M4?.read(window.SCZN3M4.KEYS.activeSession, null)?.confirmationAuthorityPackage || null
        };
      });
      throw new Error(`Save SEC was not actionable: ${JSON.stringify(diagnostic)}`, { cause: error });
    });
    await page.getByText("SEC PRESERVED", { exact: true }).waitFor();
    const beforeReopen = await parity(page, sessionId);
    assert.equal(beforeReopen.initialRegistrationPackageId, registrationPackageId);
    assert.equal(beforeReopen.confirmationRegistrationPackageId, registrationPackageId);
    assert.equal(beforeReopen.equipmentAuthorityRecordId, equipmentAuthorityRecordId);
    assert(beforeReopen.preservedAt);

    await page.locator("#viewHistory").click();
    await page.waitForURL(url => url.pathname.endsWith("/records.html"));
    const vaultRecord = page.locator(`[data-session-id="${sessionId}"] .vault-record-link`);
    await vaultRecord.waitFor();
    const vaultVectorParity = await page.evaluate(id => {
      const session = window.SCZN3M4.loadSession(id);
      const record = document.querySelector(`[data-session-id="${id}"]`);
      const figures = record ? record.querySelectorAll("figure") : [];
      const snapshot = (figure, pkg) => {
        const vector = figure && figure.querySelector('[data-governed-correction-vector="renderCoordinates.vector"]');
        const line = vector && vector.querySelector("line");
        const governed = pkg?.renderCoordinates?.vector;
        return {
          exists: Boolean(vector),
          evidenceHash: vector?.getAttribute("data-authority-evidence-hash") || null,
          coordinates: line ? {
            start: { xPercent: Number(line.getAttribute("x1")), yPercent: Number(line.getAttribute("y1")) },
            end: { xPercent: Number(line.getAttribute("x2")), yPercent: Number(line.getAttribute("y2")) }
          } : null,
          governed: governed ? {
            start: { xPercent: governed.start.xPercent, yPercent: governed.start.yPercent },
            end: { xPercent: governed.end.xPercent, yPercent: governed.end.yPercent }
          } : null
        };
      };
      return {
        before: snapshot(figures[0], session.m4AuthorityPackage),
        after: snapshot(figures[1], session.confirmationAuthorityPackage)
      };
    }, sessionId);
    assert.equal(vaultVectorParity.before.exists, true, "Vault BEFORE renders the preserved governed correction vector");
    assert.equal(vaultVectorParity.before.evidenceHash, beforeReopen.initialEvidenceHash, "Vault BEFORE vector retains its authority evidence hash");
    assert.deepEqual(vaultVectorParity.before.coordinates, vaultVectorParity.before.governed, "Vault BEFORE uses renderCoordinates.vector without recalculation");
    assert.equal(vaultVectorParity.after.exists, Boolean(vaultVectorParity.after.governed), "Vault AFTER renders a vector only when confirmation authority produced one");
    if (vaultVectorParity.after.governed) {
      assert.equal(vaultVectorParity.after.evidenceHash, beforeReopen.confirmationEvidenceHash, "Vault AFTER vector retains confirmation authority evidence hash");
      assert.deepEqual(vaultVectorParity.after.coordinates, vaultVectorParity.after.governed, "Vault AFTER uses the governed confirmation vector without recalculation");
    }
    assert(preservedSession, "Vault possession proof preserves the exact M4 SEC through the backend boundary");
    await vaultRecord.click();
    await page.waitForURL(url => url.pathname.endsWith("/sec.html") && url.searchParams.get("sessionId") === sessionId);
    await secShell.waitFor();
    const afterReopen = await parity(page, sessionId);
    assert.deepEqual(afterReopen, beforeReopen, "Vault exact reopen preserves M4 authority, registration, observations, and evidence exactly");
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), true, `${viewport.width}px protected road must not overflow`);
    assert.deepEqual(errors, []);

    await context.close();
    console.log(`PASS Episode 60 M4 Victory #2 complete protected road at ${viewport.width}px`);
  }
} finally {
  await browser.close();
}
