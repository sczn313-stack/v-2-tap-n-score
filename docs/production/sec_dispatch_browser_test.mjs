import assert from "node:assert/strict";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { chromium } = require("playwright");
const baseUrl = process.env.SCZN3_TEST_BASE_URL || "http://127.0.0.1:8101";

function authorityPackage(target, mission, resultType, extra = {}) {
  return {
    ok: true,
    status: "calculated",
    target_profile_id: target,
    mission_family: mission,
    resultPackageType: resultType,
    resultSource: "backend",
    ...extra
  };
}

const gssfBreakdown = [
  { zone: "downZero", count: 0, penaltySecondsPerHit: 0, subtotalPenaltySeconds: 0, shotIds: [] },
  { zone: "plusOne", count: 1, penaltySecondsPerHit: 1, subtotalPenaltySeconds: 1, shotIds: [1] },
  { zone: "plusThree", count: 2, penaltySecondsPerHit: 3, subtotalPenaltySeconds: 6, shotIds: [2, 3] },
  { zone: "miss", count: 0, penaltySecondsPerHit: 10, subtotalPenaltySeconds: 0, shotIds: [] }
];

function record(sessionId, number, target, mission, resultType, pkgExtra = {}, recordExtra = {}) {
  const pkg = authorityPackage(target, mission, resultType, pkgExtra);
  return {
    persistenceSchema: "sczn3-canonical-session-v1",
    sessionId,
    authoritativeSessionId: sessionId,
    sessionIdAuthority: "backend",
    sessionNumber: number,
    sessionLabel: `Session #${String(number).padStart(3, "0")}`,
    sessionNumberAuthority: "device-local-temporary",
    savedToSEC: true,
    timestamp: "2026-08-12T18:30:00-04:00",
    savedAt: "2026-08-12T18:30:00-04:00",
    matrixSnapshot: { target_profile_id: target, mission_family: mission, resultPackageType: resultType },
    authorityPackage: pkg,
    ...recordExtra
  };
}

const poisoned302 = record("session-302", 302, "gssf_ac_1", "gssf", "gssfPaperPenaltyResult", {
  totalPaperPenaltySeconds: 7,
  rawTimeSeconds: 7,
  finalTimeSeconds: 14,
  finalTimeStatus: "calculated",
  scoringBreakdown: gssfBreakdown,
  hitClassifications: [
    { shot: 1, zone: "plusOne", xPx: 560, yPx: 680 },
    { shot: 2, zone: "plusThree", xPx: 600, yPx: 710 },
    { shot: 3, zone: "plusThree", xPx: 620, yPx: 730 }
  ],
  renderCoordinates: { hits: [
    { shotId: 1, xPercent: 40, yPercent: 42 },
    { shotId: 2, xPercent: 45, yPercent: 47 },
    { shotId: 3, xPercent: 50, yPercent: 52 }
  ] },
  inputs: { observationCount: 3 }
}, {
  targetEvidenceImage: { evidenceType: "uploaded-target-image", dataUrl: "data:image/png;base64,Z3NzZi1ldmlkZW5jZQ==", widthPx: 1125, heightPx: 1373 },
  officialMatchTimeSeconds: 7,
  gssfOfficialMatchTimeSeconds: 7,
  officialFinalScoreSeconds: 14,
  officialFinalScoreStatus: "calculated",
  workflowStage: "preservation",
  preservationStatus: "saved",
  correctionStatus: "backend-authority-calculated",
  correctionData: { status: "backend-authority-calculated", clicks: { elevation: 9, windage: 4 } },
  clicks: { elevation: 9, windage: 4 },
  m4AuthorityPackage: { status: { hasCorrection: true } },
  confirmationAuthorityPackage: { status: { hasCorrection: true } },
  confirmationImpactPoints: [{ x: 1, y: 1 }],
  confirmationEvidenceImage: { dataUrl: "data:image/png;base64,c3RhbGU=" }
});

const records = [
  poisoned302,
  record("session-baker-sl", 303, "BAKER_SL_ST1", "smartEvidenceCapture", "smartEvidenceResult", {
    status: "supported_analysis_ready",
    target: { smartTargetId: "BAKER_SL_ST1", variantId: "BAKER_SL_ST1_23X35_STANDARD_WHITE" },
    supportedAnalysis: { impactCount: 2 },
    impacts: [{ impactId: "impact-001", xNorm: .42, yNorm: .35 }, { impactId: "impact-002", xNorm: .55, yNorm: .52 }]
  }, {
    targetEvidenceImage: { dataUrl: "data:image/png;base64,c2wtc3Qx", widthPx: 1141, heightPx: 1500 },
    workflowStage: "preservation",
    confirmationAuthorityPackage: { status: { hasCorrection: true } },
    correctionData: { status: "backend-authority-calculated", clicks: { elevation: 4 } }
  }),
  record("session-m4", 301, "m4_25m_zero", "zeroingCorrection", "zeroCorrectionResult", { status: { hasCorrection: true } }, {
    workflowStage: "preservation", confirmationAuthorityPackage: { status: { hasCorrection: true } }, confirmationImpactPoints: [{ x: 1, y: 1 }]
  }),
  record("session-100", 300, "baker_st_100yd_smart_zero", "zeroingCorrection", "zeroCorrectionResult", { status: { hasCorrection: true } }, {
    workflowStage: "preservation", confirmationAuthorityPackage: { status: { hasCorrection: true } }, confirmationImpactPoints: [{ x: 1, y: 1 }]
  }),
  record("session-training", 299, "dot_torture_ez2c_style_17", "marksmanshipTraining", "marksmanshipTrainingResult", {
    mission_group: "dotTortureFamily", mission_name: "dotTorture", sec_template: "trainingSEC"
  }, { correctionData: { status: "backend-authority-calculated" }, confirmationAuthorityPackage: {} }),
  record("session-practice", 298, "st_001_universal_bullseye", "universalPractice", "universalPracticeAnalysisResult", {
    authorityClassification: "practice_analysis"
  }, { confirmationAuthorityPackage: {} })
];

const browser = await chromium.launch({
  headless: true,
  executablePath: process.env.SCZN3_CHROME_EXECUTABLE || undefined
});
try {
  for (const viewport of [{ width: 1440, height: 1000 }, { width: 390, height: 844 }]) {
    const context = await browser.newContext({ viewport });
    await context.route("**/api/session/sec*", route => route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ ok: true, sessions: [] })
    }));
    await context.addInitScript(savedRecords => {
      localStorage.clear();
      savedRecords.forEach(saved => {
        localStorage.setItem(`SCZN3_BAKER_SESSION_RECORD_${encodeURIComponent(saved.sessionId)}`, JSON.stringify(saved));
      });
      localStorage.setItem("SCZN3_BAKER_SESSION_HISTORY", JSON.stringify(savedRecords.map(saved => ({
        persistenceSchema: "sczn3-session-ref-v1",
        sessionId: saved.sessionId
      }))));
      localStorage.setItem("SCZN3_BAKER_ACTIVE_SESSION", JSON.stringify({
        persistenceSchema: "sczn3-session-ref-v1",
        sessionId: "session-302"
      }));
    }, records);
    const page = await context.newPage();
    const pageErrors = [];
    page.on("pageerror", error => pageErrors.push(error.message));
    await page.goto(`${baseUrl}/records.html?release=universal-sec-dispatch`, { waitUntil: "networkidle" });
    const storageProbe = await page.evaluate(() => ({
      history: JSON.parse(localStorage.getItem("SCZN3_BAKER_SESSION_HISTORY") || "[]"),
      record302: JSON.parse(localStorage.getItem("SCZN3_BAKER_SESSION_RECORD_session-302") || "null"),
      appHistory: window.SCZN3M4 ? window.SCZN3M4.getSessionHistory() : null,
      bodyText: document.body.textContent
    }));
    assert.equal(storageProbe.history.length, records.length, "browser fixture must preserve every session history reference");
    assert.equal(storageProbe.record302 && storageProbe.record302.sessionId, "session-302", "browser fixture must preserve Session #302");
    const preservationProbe = await page.evaluate(() => {
      const baker = window.SCZN3M4.getSessionHistory().find(session => session.sessionId === "session-baker-sl");
      const saved = window.SCZN3M4.preserveActiveSEC("", baker);
      const generic = JSON.parse(JSON.stringify(baker));
      generic.sessionId = "session-unregistered-evidence";
      generic.authoritativeSessionId = generic.sessionId;
      generic.matrixSnapshot.target_profile_id = "unknown_target";
      generic.authorityPackage.target_profile_id = "unknown_target";
      generic.authorityPackage.target.smartTargetId = "unknown_target";
      return {
        saved: Boolean(saved && saved.savedToSEC && saved.sessionId === "session-baker-sl"),
        rejectedGeneric: window.SCZN3M4.preserveActiveSEC("", generic) === null
      };
    });
    assert.deepEqual(preservationProbe, { saved: true, rejectedGeneric: true }, "only a dispatch-validated Baker evidence result may be preserved");
    const renderedRecordCount = await page.locator("[data-session-id]").count();
    assert.equal(renderedRecordCount, records.length, `Vault must render every fixture record; app history: ${storageProbe.appHistory && storageProbe.appHistory.length}; page errors: ${pageErrors.join(" | ")}; body: ${storageProbe.bodyText}`);
    const href = async id => page.locator(`[data-session-id="${id}"] .vault-record-link`).getAttribute("href");
    assert.match(await href("session-302"), /^records\.html\?session=session-302&view=sec$/, "Session #302 must select the GSSF historical SEC");
    assert.match(await href("session-baker-sl"), /^records\.html\?session=session-baker-sl&view=sec$/, "Baker SL-ST1 must select its historical SEC");
    assert.match(await href("session-m4"), /^sec\.html\?sessionId=session-m4/, "M4 must select the preserved zeroing SEC");
    assert.match(await href("session-100"), /^records\.html\?session=session-100&view=sec$/, "100 Yard must select its records adapter");
    assert.match(await href("session-training"), /^records\.html\?session=session-training&view=sec$/, "training must select its records adapter");
    assert.match(await href("session-practice"), /^records\.html\?session=session-practice&view=sec$/, "Universal Practice must select its records adapter");
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), true, `${viewport.width}px Vault must not overflow`);

    await page.locator('[data-session-id="session-baker-sl"] .vault-record-link').click();
    await page.waitForURL(url => url.pathname.endsWith("/records.html") && url.searchParams.get("session") === "session-baker-sl");
    await page.locator(".baker-sl-st1-sec-card").waitFor();
    assert.match(await page.locator(".baker-sl-st1-sec-card").textContent(), /2 Bullet Holes/);
    assert.equal(await page.locator('[data-sec-stage="sight-correction"]').count(), 0, "Baker SL-ST1 must not inherit Sight Correction");
    assert.equal((await page.locator(".baker-sl-st1-sec-card").textContent()).includes("Confirmation not recorded"), false, "Baker SL-ST1 must not report missing confirmation");
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), true, `${viewport.width}px Baker SL-ST1 SEC must not overflow`);

    await page.goto(`${baseUrl}/records.html?release=universal-sec-dispatch`, { waitUntil: "networkidle" });

    await page.locator('[data-session-id="session-302"] .vault-record-link').click();
    await page.waitForURL(url => url.pathname.endsWith("/records.html") && url.searchParams.get("session") === "session-302");
    await page.locator(".gssf-m4-reference-sec-card").waitFor();
    assert.match(await page.locator(".gssf-m4-reference-sec-card").textContent(), /14\.00 sec/);
    const gssfMarkers = await page.locator(".gssf-m4-reference-sec-card .history-gssf-impact").evaluateAll(markers => markers.map(marker => ({
      label: marker.textContent.trim(),
      left: marker.style.left,
      top: marker.style.top
    })));
    assert.deepEqual(gssfMarkers, [
      { label: "1", left: "40%", top: "42%" },
      { label: "2", left: "45%", top: "47%" },
      { label: "3", left: "50%", top: "52%" }
    ], "GSSF historical SEC count identifiers match visible impacts without moving markers");
    assert.equal(await page.locator('[data-sec-stage="sight-correction"]').count(), 0, "Session #302 must not inherit Sight Correction");
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), true, `${viewport.width}px GSSF SEC must not overflow`);

    await page.goto(`${baseUrl}/sec.html?sessionId=session-302&release=universal-sec-dispatch`, { waitUntil: "networkidle" });
    await page.waitForURL(url => url.pathname.endsWith("/records.html") && url.searchParams.get("session") === "session-302");
    await page.locator(".gssf-m4-reference-sec-card").waitFor();
    assert.equal(await page.locator('[data-sec-stage="sight-correction"]').count(), 0, "direct wrong-page entry must recover to GSSF");
    assert.equal((await page.locator(".gssf-m4-reference-sec-card").textContent()).includes("Score --"), false, "Session #302 must not render the generic zeroing score");
    assert.deepEqual(await page.evaluate(() => window.__errors || []), []);
    await context.close();
    console.log(`PASS universal SEC dispatch browser regression at ${viewport.width}px`);
  }
} finally {
  await browser.close();
}
