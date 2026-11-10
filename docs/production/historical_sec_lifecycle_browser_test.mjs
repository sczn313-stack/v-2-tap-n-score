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
const capabilityFor = sessionId => {
  const artifact = artifacts.find(item => item.sessionId === sessionId);
  const payload = Buffer.from(JSON.stringify({
    artifactSha256: artifact.artifactSha256,
    purpose: "sczn3-preserved-sec-reopen",
    sessionId,
    version: 1
  })).toString("base64url");
  return `${payload}.testsignature`;
};

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
    await context.addInitScript(({ authorizedSessions }) => {
      // The Vault starts from a browser-held authoritative candidate. It must
      // prove possession before the backend grants exact-reopen authority.
      authorizedSessions.forEach(session => {
        localStorage.setItem(`SCZN3_SESSION_RECORD_${encodeURIComponent(session.sessionId)}`, JSON.stringify(session));
      });
      localStorage.setItem("SCZN3_SESSION_HISTORY", JSON.stringify(authorizedSessions.map(session => ({
        persistenceSchema: "sczn3-session-ref-v1",
        sessionId: session.sessionId,
        sessionLabel: session.sessionLabel,
        sessionNumberAuthority: "backend",
        timestamp: session.timestamp,
        savedAt: session.savedAt,
        savedToSEC: true,
        confirmationStatus: "Confirmed"
      }))));
    }, { authorizedSessions: sessions });
    const authorizedReads = [];
    const proofRequests = [];
    let unauthorizedEnumerationAttempts = 0;
    let crossSessionCapabilityAttempts = 0;
    await context.route(/\/api\/session\/sec(?:\/prove)?(?:\?.*)?$/, route => {
      const url = new URL(route.request().url());
      if (url.pathname.endsWith("/prove")) {
        const body = route.request().postDataJSON();
        const index = sessions.findIndex(session => session.sessionId === body?.session?.sessionId);
        proofRequests.push(body?.session?.sessionId || "");
        return route.fulfill({
          status: index >= 0 ? 200 : 404,
          contentType: "application/json",
          body: JSON.stringify(index >= 0
            ? { ok: true, status: "preserved", proofOnly: true, session: sessions[index], ...artifacts[index], reopenCapability: capabilityFor(sessions[index].sessionId) }
            : { ok: false, reason: "preserved_sec_not_found" })
        });
      }
      const requestedId = url.searchParams.get("session");
      if (requestedId) {
        const index = sessions.findIndex(session => session.sessionId === requestedId);
        const receivedCapability = route.request().headers()["x-sczn3-sec-reopen-capability"] || "";
        if (index >= 0 && receivedCapability !== capabilityFor(requestedId)) {
          crossSessionCapabilityAttempts += 1;
          return route.fulfill({ status: 403, contentType: "application/json", body: JSON.stringify({ ok: false, reason: "preserved_sec_reopen_capability_invalid" }) });
        }
        authorizedReads.push({ sessionId: requestedId, artifactSha256: index >= 0 ? artifacts[index].artifactSha256 : "" });
        return route.fulfill({
          status: index >= 0 ? 200 : 404,
          contentType: "application/json",
          body: JSON.stringify(index >= 0
            ? { ok: true, status: "preserved", session: sessions[index], ...artifacts[index] }
            : { ok: false, error: "not_found" })
        });
      }
      unauthorizedEnumerationAttempts += 1;
      return route.fulfill({
        status: 403,
        contentType: "application/json",
        body: JSON.stringify({ ok: false, reason: "preserved_sec_enumeration_not_authorized" })
      });
    });
    const page = await context.newPage();
    const pageErrors = [];
    page.on("pageerror", error => pageErrors.push(error.message));

    await page.goto(`${baseUrl}/records.html?v=historical-lifecycle-regression`, { waitUntil: "networkidle" });
    const currentVaultLink = page.locator('[data-session-id="historical-baker-current"] .vault-record-link');
    if ((await currentVaultLink.count()) !== 1) {
      const diagnostic = await page.evaluate(() => ({
        secState: document.body.dataset.secState,
        renderedText: document.querySelector("#historyList")?.innerText || "",
        history: window.SCZN3M4?.getSessionHistory?.() || [],
        keys: Object.keys(localStorage).filter(key => key.startsWith("SCZN3_"))
      }));
      throw new Error(`historical_vault_candidate_not_rendered ${JSON.stringify({ ...diagnostic, proofRequests, authorizedReads, pageErrors })}`);
    }
    await currentVaultLink.click();
    await page.waitForURL(url => url.searchParams.get("session") === "historical-baker-current");
    await assertOneOpenAccordion(page, "Vault reopen");

    await page.goto(`${baseUrl}/records.html?session=historical-baker-current&view=sec&v=historical-direct`, { waitUntil: "networkidle" });
    await assertOneOpenAccordion(page, "Direct SEC link");

    // Reopen the separately possessed prior record from the Vault. Do not
    // manufacture a cross-record timeline by granting an enumeration API.
    await page.goto(`${baseUrl}/records.html?v=historical-prior-vault`, { waitUntil: "networkidle" });
    await page.locator('[data-session-id="historical-baker-prior"] .vault-record-link').click();
    await page.waitForURL(url => url.searchParams.get("session") === "historical-baker-prior");
    assert.equal(await page.locator('[data-sec-shell="universal-v1"]').getAttribute("data-sec-record-id"), "historical-baker-prior", "Session 2 point opens the exact preserved SEC");
    await assertOneOpenAccordion(page, "Session 2 Vault link");

    assert.ok(proofRequests.includes("historical-baker-current"), "Vault candidate proves possession before exact reopen");
    assert.ok(authorizedReads.some(read => read.sessionId === "historical-baker-current" && read.artifactSha256 === artifacts[1].artifactSha256), "current session reopens with its immutable artifact identity");
    assert.ok(authorizedReads.some(read => read.sessionId === "historical-baker-prior" && read.artifactSha256 === artifacts[0].artifactSha256), "Vault navigation reopens the exact prior artifact");
    assert.equal(unauthorizedEnumerationAttempts, 0, "Vault never requests unrestricted backend SEC enumeration");
    assert.equal(crossSessionCapabilityAttempts, 0, "no cross-session capability is accepted or attempted");

    assert.deepEqual(pageErrors, [], `${viewport.width}px historical route must have no page errors`);
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), true, `${viewport.width}px historical route must not overflow`);
    await context.close();
    console.log(`PASS historical SEC lifecycle routes at ${viewport.width}px`);
  }
} finally {
  await browser.close();
}
