import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { chromium } from "playwright";

const origin = process.env.SCZN3_REVIEW_ORIGIN || "http://127.0.0.1:8096";
const authorityOrigin = process.env.SCZN3_AUTHORITY_ORIGIN || "http://127.0.0.1:8098";
const viewport = { width: Number(process.env.SCZN3_VIEWPORT_WIDTH || 1180), height: Number(process.env.SCZN3_VIEWPORT_HEIGHT || 900) };
const cohort = JSON.parse(await readFile("authority-evidence/platform/target-data-one-road-scale-proof-2026-09-08/TARGET_DATA_ONE_ROAD_COHORT.json", "utf8"));
const catalogResponse = await fetch(`${authorityOrigin}/api/target-execution/catalog`);
assert.equal(catalogResponse.status, 200);
const catalog = (await catalogResponse.json()).targets;
const byTarget = new Map(catalog.map(item => [item.targetProfileId, item]));
const sharedRoadSource = await readFile("target-experience.html", "utf8");
const sharedRuntimeSource = await readFile("target_execution_runtime.js", "utf8");

for (const target of cohort.targets) {
  assert.ok(!sharedRoadSource.includes(target.targetProfileId), `target-specific HTML wiring detected for ${target.targetProfileId}`);
  assert.ok(!sharedRuntimeSource.includes(target.targetProfileId), `target-specific runtime wiring detected for ${target.targetProfileId}`);
}

const browser = await chromium.launch({ headless: true });
const outcomes = [];
try {
  for (const target of cohort.targets) {
    const page = await browser.newPage({ viewport });
    const url = `${origin}/target-experience.html?missionFamily=targetScoring&target=${encodeURIComponent(target.targetProfileId)}`;
    const contract = byTarget.get(target.targetProfileId);
    assert.ok(contract, `execution contract missing for ${target.sku}`);
    assert.equal(contract.missionFamily, "targetScoring");
    await page.goto(url, { waitUntil: "domcontentloaded" });
    await page.getByRole("button", { name: "Start", exact: true }).click();
    await page.getByText(target.productName, { exact: false }).waitFor();
    assert.equal(await page.locator("#contractStatus").textContent(), "Session admitted. Load target evidence.");
    await page.locator("#contractFile").setInputFiles(path.resolve(target.imagePath));
    await page.locator("#contractWorkspace").waitFor({ state: "visible" });
    const surface = page.locator("#contractTapSurface");
    const box = await surface.boundingBox();
    assert.ok(box && box.width > 100 && box.height > 100);
    if (await page.getByRole("button", { name: "Mark Aim" }).isVisible()) {
      await page.getByRole("button", { name: "Mark Aim" }).click();
      await surface.click({ position: { x: box.width * .5, y: box.height * .5 } });
    }
    await surface.click({ position: { x: box.width * .42, y: box.height * .44 } });
    await surface.click({ position: { x: box.width * .57, y: box.height * .51 } });
    await surface.click({ position: { x: box.width * .48, y: box.height * .58 } });
    await page.getByRole("button", { name: "Show Result" }).click();
    await page.locator("#contractSecView").waitFor({ state: "visible" });
    assert.equal(await page.locator("#contractStatus").textContent(), "Backend-authoritative result ready.");
    const secText = await page.locator("#contractSecRoot").innerText();
    assert.ok(secText.includes(`${target.productName} · SKU ${target.sku}`));
    await page.getByRole("button", { name: "Save SEC" }).click();
    await page.getByText("SEC preserved. Exact reopen available.", { exact: true }).waitFor();
    const href = await page.getByRole("link", { name: "Exact Reopen" }).getAttribute("href");
    assert.ok(href && href.includes("session="));
    const sessionId = new URL(href, `${origin}/`).searchParams.get("session");
    const preservedResponse = await fetch(`${authorityOrigin}/api/session/sec?session=${encodeURIComponent(sessionId)}`);
    assert.equal(preservedResponse.status, 200);
    const preserved = await preservedResponse.json();
    const result = preserved.session.authorityPackage;
    assert.equal(result.target.product.sku, target.sku);
    assert.equal(result.missionFamily, "targetScoring");
    assert.equal(result.classifications.length, 3);
    assert.ok(["complete", "not_applicable"].includes(result.scoring.status));
    assert.equal(result.reconciliation.countsMatch, true);
    await page.goto(new URL(href, `${origin}/`).href, { waitUntil: "domcontentloaded" });
    await page.locator("#contractSecView").waitFor({ state: "visible" });
    assert.equal(await page.locator("#contractStatus").textContent(), "Exact preserved SEC reopened.");
    assert.equal(await page.locator(".contract-observation-marker").count(), 3);
    const reopenedResponse = await fetch(`${authorityOrigin}/api/session/sec?session=${encodeURIComponent(sessionId)}`);
    assert.equal(reopenedResponse.status, 200);
    const reopened = await reopenedResponse.json();
    assert.deepEqual(reopened.session.authorityPackage.aimStructure, result.aimStructure);
    assert.equal(await page.locator(".contract-aim-marker").count(), result.aimStructure.mode === "fixed" || result.aimStructure.mode === "shooter_declared" ? 1 : 0);
    await Promise.all([page.waitForURL(/\/records\.html$/), page.getByRole("link", { name: "Ballistic Vault" }).click()]);
    await page.getByRole("heading", { name: "BALLISTIC VAULT", exact: true }).waitFor();
    const vaultResponse = await fetch(`${authorityOrigin}/api/session/sec`);
    assert.equal(vaultResponse.status, 200);
    const vault = await vaultResponse.json();
    assert.ok(vault.sessions.some(item => item.sessionId === sessionId));
    outcomes.push({
      ordinal: target.ordinal, publisher: target.publisher, sku: target.sku, productName: target.productName,
      targetProfileId: target.targetProfileId, roadUrl: url, contractAdmission: "admitted",
      missionFamily: result.missionFamily, scoringModel: result.scoring.model, scoringStatus: result.scoring.status,
      secPreserved: true, exactReopen: true, ballisticVault: true, requestedScaleProof: "PASS",
      artifactSha256: preserved.artifactSha256,
    });
    await page.close();
  }
} finally {
  await browser.close();
}

assert.equal(outcomes.length, 9);
assert.equal(outcomes.filter(item => item.contractAdmission === "admitted").length, 9);
assert.equal(outcomes.filter(item => item.requestedScaleProof === "PASS").length, 9);
assert.equal(new Set(outcomes.map(item => item.missionFamily)).size, 1);
console.log(`TARGET_DATA_ONE_ROAD_RESULTS=${JSON.stringify(outcomes)}`);
console.log(`PASS: 9/9 targets completed scoring-data result, SEC preservation, exact reopen, and Ballistic Vault through one unchanged shooter road at ${viewport.width}px`);
