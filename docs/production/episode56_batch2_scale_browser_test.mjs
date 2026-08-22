import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { chromium } from "playwright";

const origin = process.env.SCZN3_REVIEW_ORIGIN || "http://127.0.0.1:8096";
const authorityOrigin = process.env.SCZN3_AUTHORITY_ORIGIN || "http://127.0.0.1:8098";
const cohort = JSON.parse(await readFile("history/episodes/episode56-gunfun-scale-experiment/BATCH_2_COHORT.json", "utf8"));
const catalogResponse = await fetch(`${authorityOrigin}/api/target-execution/catalog`);
assert.equal(catalogResponse.status, 200);
const catalog = (await catalogResponse.json()).targets;
assert.equal(cohort.targets.length, 12);
assert.equal(catalog.length, 12);

const bySku = new Map(catalog.map(item => [String(item.product.sku), item]));
const productionSurfaces = [
  "backend/session_authority.py",
  "backend/execution_authority.py",
  "backend/execution_capability_registry.py",
  "backend/preserved_sec_store.py",
  "backend/server.py",
  "backend/target_registry.py",
  "backend/mission_registry.py",
  "target_execution_runtime.js",
  "sec_dispatch.js",
  "m4_runtime.js",
  "target_experiences.js",
  "platform_contracts.js",
  "sec_adapter_model.js",
  "records.html",
  "production/build-site.mjs",
  "production/build-netlify.mjs",
];
const surfaceText = (await Promise.all(productionSurfaces.map(file => readFile(file, "utf8")))).join("\n").toLowerCase();
for (const target of cohort.targets) {
  const registered = bySku.get(String(target.sku));
  assert.ok(registered, `catalog registration unavailable for SKU ${target.sku}`);
  assert.equal(registered.product.name, target.productName);
  assert.equal(registered.missionFamily, "smartEvidenceCapture");
  assert.equal(registered.resultPackageType, "smartEvidenceResult");
  assert.ok(!surfaceText.includes(String(registered.targetProfileId).toLowerCase()), `target-ID production wiring detected: ${registered.targetProfileId}`);
}

const browser = await chromium.launch({ headless: true });
const outcomes = [];
try {
  for (const target of cohort.targets) {
    const registered = bySku.get(String(target.sku));
    const page = await browser.newPage({ viewport: { width: 1180, height: 900 } });
    const startedAt = performance.now();
    await page.goto(`${origin}/target-experience.html?target=${encodeURIComponent(registered.targetProfileId)}&missionFamily=smartEvidenceCapture`, { waitUntil: "domcontentloaded" });
    await page.getByRole("button", { name: "Start", exact: true }).click();
    await page.getByText(target.productName, { exact: false }).waitFor();
    const admittedAt = performance.now();
    await page.locator("#contractFile").setInputFiles(path.resolve(registered.registration.assetPath));
    await page.locator("#contractWorkspace").waitFor({ state: "visible" });
    const evidenceLoadedAt = performance.now();
    const surface = page.locator("#contractTapSurface");
    const box = await surface.boundingBox();
    assert.ok(box && box.width > 100 && box.height > 100);
    await page.getByRole("button", { name: "Mark Aim" }).click();
    await surface.click({ position: { x: box.width * .5, y: box.height * .5 } });
    await surface.click({ position: { x: box.width * .35, y: box.height * .4 } });
    await surface.click({ position: { x: box.width * .65, y: box.height * .6 } });
    await page.getByRole("button", { name: "Show Result" }).click();
    await page.getByText("Evidence Recorded", { exact: true }).waitFor();
    const backendResultAt = performance.now();
    const secText = await page.locator("#contractSecRoot").innerText();
    assert.ok(secText.includes(`${target.productName} · SKU ${target.sku}`));
    assert.match(secText, /2 shot observations/);
    assert.match(secText, /Scoring:\s+Not applicable/);
    const universalSecAt = performance.now();
    await page.getByRole("button", { name: "Save SEC" }).click();
    await page.getByText("SEC preserved. Exact reopen available.", { exact: true }).waitFor();
    const preservedAt = performance.now();
    const reopen = page.getByRole("link", { name: "Exact Reopen" });
    const href = await reopen.getAttribute("href");
    assert.ok(href && href.includes("session="));
    const sessionId = new URL(href, `${origin}/`).searchParams.get("session");
    assert.ok(sessionId);
    const preservedResponse = await fetch(`${authorityOrigin}/api/session/sec?session=${encodeURIComponent(sessionId)}`);
    assert.equal(preservedResponse.status, 200);
    const preserved = await preservedResponse.json();
    const result = preserved.session.authorityPackage;
    assert.equal(result.authoritySource, "backend-authoritative");
    assert.equal(result.target.product.sku, String(target.sku));
    assert.equal(result.target.product.name, target.productName);
    assert.equal(result.reconciliation.capturedObservationCount, 2);
    assert.equal(result.reconciliation.acceptedObservationCount, 2);
    assert.equal(result.reconciliation.countsMatch, true);
    assert.equal(result.scoring.status, "not_applicable");
    assert.equal(result.shopperDeclaredAimPoint, undefined);
    assert.equal(result.shooterDeclaredAimPoint.declaredBy, "shooter");
    assert.equal(result.shooterDeclaredAimPoint.authorityScope, "session_evidence_only");
    assert.equal(result.capabilityStates.evidence.status, "available");
    assert.equal(result.capabilityStates.measurement.status, "unavailable");
    assert.equal(result.capabilityStates.correction.status, "unavailable");
    assert.ok(String(preserved.session.targetEvidenceImage.dataUrl).startsWith("data:image/"));
    await page.goto(new URL(href, `${origin}/`).href, { waitUntil: "domcontentloaded" });
    await page.locator("#contractSecView").waitFor({ state: "visible" });
    assert.equal(await page.locator("#contractStatus").textContent(), "Exact preserved SEC reopened.");
    assert.ok((await page.locator("#contractSecRoot").innerText()).includes(`${target.productName} · SKU ${target.sku}`));
    assert.equal(await page.locator(".contract-observation-marker").count(), 2);
    assert.equal(await page.locator(".contract-aim-marker").count(), 1);
    const reopenedAt = performance.now();
    outcomes.push({
      experimentId: target.experimentId,
      productName: target.productName,
      sku: String(target.sku),
      targetProfileId: registered.targetProfileId,
      inheritedCapabilityFamily: registered.missionFamily,
      resultPackageType: registered.resultPackageType,
      targetIdProductionCodeEdit: "NO",
      targetSpecificProductionModulesOrRoutesCreated: 0,
      timeMs: {
        sessionAdmission: Math.round(admittedAt - startedAt),
        evidenceLoad: Math.round(evidenceLoadedAt - startedAt),
        backendAuthoritativeResult: Math.round(backendResultAt - startedAt),
        universalSec: Math.round(universalSecAt - startedAt),
        preservation: Math.round(preservedAt - startedAt),
        exactReopen: Math.round(reopenedAt - startedAt),
      },
      preservedArtifactSha256: preserved.artifactSha256,
      resultIdentity: result.resultIdentity,
      status: "registered_without_new_application_code",
    });
    await page.close();
  }
} finally {
  await browser.close();
}

console.log("Episode 56 Batch 2 governed lifecycle: PASS");
console.log("- 12/12 publisher products reached backend-authoritative smart evidence, Universal SEC, preservation, and exact reopen");
console.log("- 12/12 required zero target-ID production routing and zero target-specific production modules/routes");
console.log(`BATCH2_METRICS_JSON=${JSON.stringify(outcomes)}`);

