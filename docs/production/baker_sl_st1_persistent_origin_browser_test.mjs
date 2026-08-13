import assert from "node:assert/strict";
import path from "node:path";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { chromium } = require("playwright");
const baseUrl = process.env.SCZN3_TEST_BASE_URL || "http://127.0.0.1:8137";
const targetPhoto = path.resolve("authority-evidence/baker-sl-st1/BAKER_SL_ST1_PRINTER_PRODUCT_IMAGE.webp");
const TARGET_ID = "BAKER_SL_ST1";
const preservedSessionId = "sl-st1-preserved-history-001";
const preservedMediaId = "sl-st1-preserved-media-001";

const browser = await chromium.launch({
  headless: true,
  executablePath: process.env.SCZN3_CHROME_EXECUTABLE || undefined
});

try {
  const context = await browser.newContext({ viewport: { width: 1238, height: 887 }, deviceScaleFactor: 2 });
  const page = await context.newPage();
  const consoleMessages = [];
  page.on("console", message => consoleMessages.push(message.text()));

  await context.route("**/api/target/baker-sl-st1/analyze", async route => {
    const request = route.request().postDataJSON();
    await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({
      ok: true,
      status: "supported_analysis_ready",
      resultPackageType: "smartEvidenceResult",
      missionFamily: "smartEvidenceCapture",
      target: { smartTargetId: TARGET_ID, variantId: "BAKER_SL_ST1_23X35_STANDARD_WHITE" },
      supportedAnalysis: { impactCount: request.impacts.length },
      impacts: request.impacts.map((impact, index) => ({ impactId: `impact-${index + 1}`, ...impact })),
      scoring: { status: "unavailable" }
    }) });
  });
  await context.route("**/api/session/prepare", route => route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({
    ok: true,
    status: "prepared",
    preparationToken: "persistent-origin-prepare",
    target: { targetId: TARGET_ID, targetName: "Silhouette Target (USPSA)" },
    missionIdentity: { missionFamily: "smartEvidenceCapture", resultPackageType: "smartEvidenceResult" },
    governedDistance: { value: null, unit: null, locked: false },
    standardSetup: { candidateId: "baker-sl-st1-optional-equipment", source: "backend_standard_setup", setupAuthority: "backend-target-authority", displayFields: [] }
  }) }));
  await context.route("**/api/session/start", route => route.fulfill({ status: 201, contentType: "application/json", body: JSON.stringify({
    ok: true,
    status: "created",
    authoritativeSessionId: "sl-st1-persistent-origin-current",
    createdAt: "2026-08-13T15:30:00Z",
    sessionLifecycle: "created",
    sessionMode: "target_evidence",
    target: { targetId: TARGET_ID, targetName: "Silhouette Target (USPSA)" },
    missionIdentity: { missionFamily: "smartEvidenceCapture", resultPackageType: "smartEvidenceResult" },
    governedDistance: { value: null, unit: null, locked: false },
    selectedEquipment: { candidateId: "baker-sl-st1-optional-equipment", source: "backend_standard_setup", setupAuthority: "backend-target-authority", displayFields: [] }
  }) }));

  await page.goto(`${baseUrl}/t/baker/sl-st1/?persistent-origin=1`, { waitUntil: "networkidle" });
  const seeded = await page.evaluate(({ preservedSessionId, preservedMediaId }) => {
    const preservedMedia = {
      mediaId: preservedMediaId,
      dataUrl: `data:image/jpeg;base64,${"P".repeat(24000)}`,
      type: "image/jpeg",
      evidenceType: "uploaded-target-image"
    };
    const preservedSession = {
      persistenceSchema: "sczn3-canonical-session-v1",
      sessionId: preservedSessionId,
      authoritativeSessionId: preservedSessionId,
      sessionIdAuthority: "backend",
      sessionLabel: "Session #001",
      sessionNumber: 1,
      savedToSEC: true,
      preservedAt: "2026-08-12T20:00:00Z",
      timestamp: "2026-08-12T20:00:00Z",
      targetName: "Silhouette Target (USPSA)",
      target_profile_id: "BAKER_SL_ST1",
      matrixSnapshot: { targetId: "BAKER_SL_ST1", target_profile_id: "BAKER_SL_ST1", targetName: "Silhouette Target (USPSA)", resultPackageType: "smartEvidenceResult", missionFamily: "smartEvidenceCapture" },
      targetEvidenceImage: { mediaRef: preservedMediaId, mediaType: "image/jpeg", evidenceType: "uploaded-target-image" },
      authorityPackage: {
        ok: true,
        status: "supported_analysis_ready",
        resultPackageType: "smartEvidenceResult",
        missionFamily: "smartEvidenceCapture",
        target: { smartTargetId: "BAKER_SL_ST1", variantId: "BAKER_SL_ST1_23X35_STANDARD_WHITE" },
        supportedAnalysis: { impactCount: 1 },
        impacts: [{ impactId: "preserved-impact-1", xNorm: .5, yNorm: .5 }]
      }
    };
    localStorage.setItem(`SCZN3_BAKER_MEDIA_${encodeURIComponent(preservedMediaId)}`, JSON.stringify(preservedMedia));
    localStorage.setItem(`SCZN3_BAKER_SESSION_RECORD_${encodeURIComponent(preservedSessionId)}`, JSON.stringify(preservedSession));
    localStorage.setItem("SCZN3_BAKER_SESSION_HISTORY", JSON.stringify([{
      persistenceSchema: "sczn3-session-ref-v1",
      sessionId: preservedSessionId,
      sessionLabel: "Session #001",
      savedToSEC: true,
      timestamp: "2026-08-12T20:00:00Z",
      targetName: "Silhouette Target (USPSA)"
    }]));
    let orphanCount = 0;
    try {
      while (orphanCount < 500) {
        const sessionId = `sl-st1-orphan-${orphanCount}`;
        const mediaId = `sl-st1-orphan-media-${orphanCount}`;
        localStorage.setItem(`SCZN3_BAKER_SESSION_RECORD_${encodeURIComponent(sessionId)}`, JSON.stringify({
          persistenceSchema: "sczn3-canonical-session-v1",
          sessionId,
          savedToSEC: false,
          targetEvidenceImage: { mediaRef: mediaId }
        }));
        localStorage.setItem(`SCZN3_BAKER_MEDIA_${encodeURIComponent(mediaId)}`, JSON.stringify({
          mediaId,
          dataUrl: `data:image/jpeg;base64,${"O".repeat(48000)}`,
          evidenceType: "uploaded-target-image"
        }));
        orphanCount += 1;
      }
    } catch (error) {
      let fragmentCount = 0;
      for (const size of [8000, 2000, 500, 100, 20, 1]) {
        for (let attempt = 0; attempt < 100; attempt += 1) {
          try {
            const mediaId = `sl-st1-orphan-fragment-${size}-${attempt}`;
            localStorage.setItem(`SCZN3_BAKER_MEDIA_${encodeURIComponent(mediaId)}`, JSON.stringify({ mediaId, dataUrl: `data:image/jpeg;base64,${"F".repeat(size)}` }));
            fragmentCount += 1;
          } catch (fragmentError) {
            break;
          }
        }
      }
      return { orphanCount, fragmentCount, exceptionName: error.name, exceptionMessage: error.message };
    }
    return { orphanCount };
  }, { preservedSessionId, preservedMediaId });
  assert.equal(seeded.exceptionName, "QuotaExceededError", "dirty origin must reach its realistic storage limit");

  await page.reload({ waitUntil: "networkidle" });
  await page.locator("#libraryInput").setInputFiles(targetPhoto);
  await page.locator("#targetWorkspace:not([hidden])").waitFor();
  const target = page.locator("#tapSurface");
  const box = await target.boundingBox();
  for (const [x, y] of [[.3, .3], [.5, .5], [.7, .7]]) {
    await target.click({ position: { x: box.width * x, y: box.height * y } });
  }
  await page.locator("#showResults").click();
  await page.locator("#supportedResults:not([hidden])").waitFor();
  await page.locator("#continueToSec").click();
  await page.locator("#bakerSecView:not([hidden])").waitFor({ timeout: 10000 }).catch(() => {});

  assert.equal(await page.locator("#bakerSecView:not([hidden])").count(), 1,
    `dirty-origin continuation failed: ${consoleMessages.filter(message => /continuation failed|QuotaExceeded/i.test(message)).join(" | ")}`);
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
  }, "dirty-origin SEC evidence and preservation-action visibility");
  const reports = await page.evaluate(() => window.__SCZN3_STORAGE_GC_REPORTS__ || []);
  const report = reports.find(candidate => candidate.removedSessionKeys.length > 0 || candidate.removedMediaKeys.length > 0);
  assert.ok(report && report.removedSessionKeys.length > 0, "orphan session records must be reclaimed");
  assert.ok(report.removedMediaKeys.length > 0, "orphan media records must be reclaimed");
  assert.equal(reports.some(candidate => candidate.preservedSessionIds.includes(preservedSessionId)), true, "preserved historical SEC must survive cleanup");

  await page.locator("[data-baker-save-sec]").click();
  await page.getByText("SEC saved to Ballistic Vault.").waitFor();
  await page.getByRole("link", { name: "View History" }).click();
  await page.waitForURL(url => url.pathname.endsWith("/records.html"));
  await page.locator(`[data-session-id="${preservedSessionId}"] .vault-record-link`).click();
  await page.locator(".baker-sl-st1-sec-card").waitFor({ timeout: 10000 }).catch(async error => {
    console.log("HISTORICAL_REOPEN_DIAGNOSTIC", JSON.stringify({ url: page.url(), body: (await page.locator("body").innerText()).slice(0, 1200) }));
    throw error;
  });
  assert.match(await page.locator(".baker-sl-st1-sec-card").textContent(), /1 Impact/);
  assert.equal(await page.evaluate(id => {
    const record = JSON.parse(localStorage.getItem(`SCZN3_BAKER_SESSION_RECORD_${encodeURIComponent(id)}`));
    return record.savedToSEC === true && record.authorityPackage.impacts[0].impactId === "preserved-impact-1";
  }, preservedSessionId), true, "preserved historical SEC must reopen unchanged");

  console.log(`PASS persistent dirty-origin continuation; removed ${report.removedSessionKeys.length} orphan sessions and ${report.removedMediaKeys.length} orphan media records`);
  await context.close();
} finally {
  await browser.close();
}
