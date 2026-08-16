import assert from "node:assert/strict";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { chromium } = require("playwright");
const baseUrl = process.env.SCZN3_TEST_BASE_URL || "http://127.0.0.1:8137";

function scoredPackage(count, total) {
  const impacts = Array.from({ length: count }, (_, index) => ({
    impactId: `impact-${index + 1}`,
    xNorm: 0.42 + (index * 0.01),
    yNorm: 0.35 + (index * 0.01),
    zone: "A",
    zoneValue: 10,
    sourceEvidencePoint: { x: 420 + index, y: 350 + index }
  }));
  return {
    ok: true,
    status: "supported_analysis_ready",
    resultPackageType: "smartEvidenceResult",
    missionFamily: "smartEvidenceCapture",
    target: { smartTargetId: "BAKER_SL_ST1", variantId: "BAKER_SL_ST1_23X35_STANDARD_WHITE" },
    supportedAnalysis: { impactCount: count },
    impacts,
    productRegionDistribution: {
      status: "complete",
      zoneCounts: { A: count, B: 0, C: 0, D: 0, outside: 0, indeterminate_boundary: 0 },
      classifiedImpactCount: count,
      capturedImpactCount: count,
      reconciliation: {
        classifiedImpactCount: count,
        unresolvedImpactCount: 0,
        capturedImpactCount: count,
        countsMatchCapturedImpactCount: true
      }
    },
    scoring: {
      status: "complete",
      objective: "highest_score_wins",
      zoneValues: { A: 10, B: 9, C: 8, D: 7 },
      subtotals: { A: total, B: 0, C: 0, D: 0 },
      total
    },
    authorityTrace: {
      classificationAuthority: "backend",
      geometryAuthorityId: "UGO_BAKER_SL_ST1_23X35_V1",
      coordinateSystemId: "UGO_IMAGE_PLANE_TOP_LEFT_V1",
      scoringAuthorityId: "BAKER_SL_ST1_SCORING_V1"
    }
  };
}

function preservedSession(sessionId, sessionNumber, preservedAt, count) {
  return {
    persistenceSchema: "sczn3-canonical-session-v1",
    sessionId,
    authoritativeSessionId: sessionId,
    sessionIdAuthority: "backend",
    sessionNumber,
    sessionLabel: `Session #${String(sessionNumber).padStart(3, "0")}`,
    savedToSEC: true,
    timestamp: preservedAt,
    savedAt: preservedAt,
    preservedAt,
    matrixSnapshot: {
      target_profile_id: "BAKER_SL_ST1",
      mission_family: "smartEvidenceCapture",
      resultPackageType: "smartEvidenceResult"
    },
    targetEvidenceImage: {
      dataUrl: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVQIHWP4z8DwHwAFgAI/ScL7WQAAAABJRU5ErkJggg==",
      widthPx: 1141,
      heightPx: 1500
    },
    authorityPackage: scoredPackage(count, count * 10)
  };
}

const sessions = [
  preservedSession("historical-baker-prior", 41, "2026-08-13T18:30:00.000Z", 4),
  preservedSession("historical-baker-current", 42, "2026-08-14T18:30:00.000Z", 6)
];
const artifacts = sessions.map((session, index) => ({
  sessionId: session.sessionId,
  artifactSha256: `${String(index + 1).repeat(64)}`,
  preservedAt: session.preservedAt
}));

async function assertOneOpenAccordion(page, label) {
  const shell = page.locator('[data-sec-shell="universal-v1"][data-sec-record-id]');
  await shell.waitFor();
  const flow = shell.locator(".sec-v1-flow");
  const target = flow.locator('details[data-sec-region="target"]');
  const session = flow.locator('details[data-sec-region="session"]');
  assert.equal(await flow.getAttribute("data-sec-open-region"), "target", `${label}: historical reopen starts Target-first`);
  assert.equal(await target.getAttribute("open"), "", `${label}: Target starts open`);
  assert.equal(await session.getAttribute("open"), null, `${label}: Session starts closed`);

  await session.locator(":scope > summary").click();
  await page.waitForFunction(() => {
    const root = document.querySelector('[data-sec-shell="universal-v1"][data-sec-record-id] .sec-v1-flow');
    return root?.dataset.secOpenRegion === "session";
  });
  assert.equal(await target.getAttribute("open"), null, `${label}: opening Session closes Target`);
  assert.equal(await session.getAttribute("open"), "", `${label}: Session opens`);

  await target.locator(":scope > summary").click();
  await page.waitForFunction(() => {
    const root = document.querySelector('[data-sec-shell="universal-v1"][data-sec-record-id] .sec-v1-flow');
    return root?.dataset.secOpenRegion === "target";
  });
  assert.equal(await target.getAttribute("open"), "", `${label}: Target reopens`);
  assert.equal(await session.getAttribute("open"), null, `${label}: reopening Target closes Session`);
}

const browser = await chromium.launch({
  headless: true,
  executablePath: process.env.SCZN3_CHROME_EXECUTABLE || undefined
});

try {
  for (const viewport of [{ width: 1440, height: 1000 }, { width: 390, height: 844 }]) {
    const context = await browser.newContext({ viewport });
    await context.route("**/api/session/sec*", route => {
      const url = new URL(route.request().url());
      const requestedId = url.searchParams.get("session");
      if (requestedId) {
        const index = sessions.findIndex(session => session.sessionId === requestedId);
        return route.fulfill({
          status: index >= 0 ? 200 : 404,
          contentType: "application/json",
          body: JSON.stringify(index >= 0
            ? { ok: true, session: sessions[index], ...artifacts[index] }
            : { ok: false, error: "not_found" })
        });
      }
      return route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ ok: true, sessions, artifacts })
      });
    });
    const page = await context.newPage();
    const pageErrors = [];
    page.on("pageerror", error => pageErrors.push(error.message));

    await page.goto(`${baseUrl}/records.html?v=historical-lifecycle-regression`, { waitUntil: "networkidle" });
    await page.locator('[data-session-id="historical-baker-current"] .vault-record-link').click();
    await page.waitForURL(url => url.searchParams.get("session") === "historical-baker-current");
    await assertOneOpenAccordion(page, "Vault reopen");

    await page.goto(`${baseUrl}/records.html?session=historical-baker-current&view=sec&v=historical-direct`, { waitUntil: "networkidle" });
    await assertOneOpenAccordion(page, "Direct SEC link");

    await page.locator('[data-sec-shell="universal-v1"] [data-sec-region="session"] > summary').click();
    const priorTimelinePoint = page.locator('.sec-session-timeline-point[data-session-id="historical-baker-prior"]');
    assert.equal(await priorTimelinePoint.count(), 1, `Session 2 must render the prior preserved SEC: ${await page.locator('[data-sec-region="session"]').innerHTML()}`);
    await priorTimelinePoint.click();
    await page.waitForURL(url => url.searchParams.get("session") === "historical-baker-prior");
    assert.equal(await page.locator('[data-sec-shell="universal-v1"]').getAttribute("data-sec-record-id"), "historical-baker-prior", "Session 2 point opens the exact preserved SEC");
    await assertOneOpenAccordion(page, "Session 2 timeline link");

    assert.deepEqual(pageErrors, [], `${viewport.width}px historical route must have no page errors`);
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), true, `${viewport.width}px historical route must not overflow`);
    await context.close();
    console.log(`PASS historical SEC lifecycle routes at ${viewport.width}px`);
  }
} finally {
  await browser.close();
}
