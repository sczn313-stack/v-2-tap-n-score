import assert from "node:assert/strict";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { chromium } = require("playwright");
const baseUrl = process.env.SCZN3_TEST_BASE_URL || "http://127.0.0.1:8151";

const zones = [
  ...Array(5).fill("A"),
  ...Array(3).fill("B"),
  ...Array(4).fill("C"),
  ...Array(7).fill("D")
];
const values = { A: 10, B: 9, C: 8, D: 7 };

function preservedSession({ tampered = false } = {}) {
  return {
    persistenceSchema: "sczn3-canonical-session-v1",
    sessionId: "session-002-vault-result-summary",
    authoritativeSessionId: "session-002-vault-result-summary",
    sessionIdAuthority: "backend",
    sessionNumber: 2,
    sessionLabel: "Session #002",
    sessionNumberAuthority: "device-local-temporary",
    savedToSEC: true,
    preservedAt: "2026-08-14T15:04:38.349-04:00",
    target_profile_id: "BAKER_SL_ST1",
    targetEvidenceImage: {
      dataUrl: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='1125' height='1521'%3E%3Crect width='100%25' height='100%25' fill='%23fff'/%3E%3C/svg%3E",
      widthPx: 1125,
      heightPx: 1521
    },
    matrixSnapshot: {
      target_profile_id: "BAKER_SL_ST1",
      mission_family: "smartEvidenceCapture",
      resultPackageType: "smartEvidenceResult"
    },
    authorityPackage: {
      ok: true,
      status: "supported_analysis_ready",
      missionFamily: "smartEvidenceCapture",
      resultPackageType: "smartEvidenceResult",
      target: { smartTargetId: "BAKER_SL_ST1", variantId: "BAKER_SL_ST1_23X35_STANDARD_WHITE" },
      supportedAnalysis: { impactCount: zones.length },
      impacts: zones.map((zone, index) => ({
        impactId: `impact-${String(index + 1).padStart(2, "0")}`,
        xNorm: .2 + ((index % 5) * .1),
        yNorm: .2 + (Math.floor(index / 5) * .1),
        zone,
        zoneValue: values[zone]
      })),
      productRegionDistribution: {
        status: "complete",
        zoneCounts: { A: 5, B: 3, C: 4, D: 7, outside: 0, indeterminate_boundary: 0 },
        classifiedImpactCount: 19,
        capturedImpactCount: 19,
        reconciliation: { classifiedImpactCount: 19, unresolvedImpactCount: 0, capturedImpactCount: 19, countsMatchCapturedImpactCount: true }
      },
      scoring: {
        status: "complete",
        objective: "highest_score_wins",
        zoneValues: values,
        subtotals: { A: 50, B: 27, C: 32, D: 49 },
        total: tampered ? 999 : 158
      },
      authorityTrace: {
        classificationAuthority: "backend",
        geometryAuthorityId: "UGO_BAKER_SL_ST1_23X35_V1",
        coordinateSystemId: "UGO_IMAGE_PLANE_TOP_LEFT_V1",
        scoringAuthorityId: "BAKER_SL_ST1_SCORING_V1"
      }
    }
  };
}

const browser = await chromium.launch({
  headless: true,
  executablePath: process.env.SCZN3_CHROME_EXECUTABLE || undefined
});

try {
  for (const viewport of [{ width: 1238, height: 887 }, { width: 390, height: 844 }]) {
    const context = await browser.newContext({ viewport, deviceScaleFactor: 2 });
    await context.route("**/api/session/sec*", route => route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ ok: true, sessions: [preservedSession()] })
    }));
    const page = await context.newPage();
    await page.goto(`${baseUrl}/records.html?v=universal-vault-result-summary-${viewport.width}`, { waitUntil: "networkidle" });
    const card = page.locator('[data-session-id="session-002-vault-result-summary"]');
    await card.waitFor();
    const summary = card.locator(".vault-result-summary");
    assert.match((await summary.innerText()).replace(/\s+/g, " "), /158 POINTS HIGHEST SCORE WINS A5 • B3 • C4 • D7 19 bullet holes/);
    const completedMarkers = card.locator(".vault-evidence-pair figure:first-child .history-thumb-impact");
    assert.equal(await completedMarkers.count(), zones.length, "Vault thumbnail must show every preserved bullet hole");
    assert.deepEqual(await completedMarkers.allTextContents(), zones.map((_, index) => String(index + 1)), "Vault thumbnail markers must reconcile to the preserved impact count");
    assert.equal(await card.getByText("OPEN SEC →", { exact: true }).count(), 1);
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), true, `${viewport.width}px Vault must not overflow`);
    const geometry = await card.evaluate(element => {
      const evidence = element.querySelector(".vault-evidence-pair figure:first-child").getBoundingClientRect();
      const result = element.querySelector(".vault-result-summary").getBoundingClientRect();
      return { evidence, result };
    });
    if (viewport.width <= 720) assert.ok(geometry.result.top >= geometry.evidence.bottom, "mobile result must stack beneath evidence");
    else assert.ok(geometry.result.left >= geometry.evidence.right, "desktop result must remain paired beside evidence");
    await context.close();
  }

  const tamperedContext = await browser.newContext({ viewport: { width: 1238, height: 887 } });
  await tamperedContext.route("**/api/session/sec*", route => route.fulfill({
    status: 200,
    contentType: "application/json",
    body: JSON.stringify({ ok: true, sessions: [preservedSession({ tampered: true })] })
  }));
  const tamperedPage = await tamperedContext.newPage();
  await tamperedPage.goto(`${baseUrl}/records.html?v=universal-vault-result-summary-tampered`, { waitUntil: "networkidle" });
  const tamperedSummary = tamperedPage.locator(".vault-result-summary");
  assert.match((await tamperedSummary.innerText()).replace(/\s+/g, " "), /SCORE UNAVAILABLE Open SEC for details 19 bullet holes/);
  assert.equal((await tamperedSummary.innerText()).includes("999"), false, "Vault must suppress an inconsistent backend package");
  await tamperedContext.close();

  console.log("PASS Universal Vault Result Summary Baker presentation and fail-closed behavior");
} finally {
  await browser.close();
}
