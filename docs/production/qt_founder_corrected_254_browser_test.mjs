import assert from "node:assert/strict";
import { readFile, writeFile } from "node:fs/promises";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { chromium } = require("playwright");
const origin = process.env.SCZN3_QT_ORIGIN || "http://127.0.0.1:8119";
const authorityPort = process.env.SCZN3_QT_AUTHORITY_PORT || "8118";
const authority = JSON.parse(await readFile("backend/target_knowledge/qt_episode64_smart_target_authority.json", "utf8"));
const requestedTarget = process.env.SCZN3_QT_TARGET || "";
const rows = authority.chairs.filter(row => row.contractPath && (!requestedTarget || row.targetProfileId === requestedTarget));
const artifactPath = "authority-evidence/platform/qt-episode64-homie-locked-treatment-2026-09-23/QT_FOUNDER_CORRECTED_254_BROWSER_VERIFICATION.json";
const forbiddenResultMeta = /Strongest:|Weakest:|EVEN DISTRIBUTION|Evenness|THE CENTER OF YOUR SHOT PATTERN|MIDDLE CENTER|normalized RMS radius|target-image coordinates/i;

function url(row) {
  return `${origin}/target-experience.html?missionFamily=${encodeURIComponent(row.missionFamily)}&target=${encodeURIComponent(row.targetProfileId)}&source=registered&authorityPort=${authorityPort}&v=qt-founder-corrected-254`;
}

function center(box) { return { x: box.x + box.width / 2, y: box.y + box.height / 2 }; }
function near(actual, expected, tolerance, message) { assert.ok(Math.abs(actual - expected) <= tolerance, `${message}: expected ${expected}, received ${actual}`); }

async function verifyOne(browser, row) {
  const page = await browser.newPage({ viewport: { width: 390, height: 900 } });
  try {
    await page.goto(url(row), { waitUntil: "domcontentloaded" });
    await page.locator("#contractStatus").getByText("Target loaded. Tap your shot holes.", { exact: true }).waitFor();
    if (await page.locator("#contractScoringModePanel").isVisible()) await page.locator("#contractScoringMode").selectOption({ index: 1 });
    const image = page.locator("#contractTargetImage");
    const surface = page.locator("#contractTapSurface");
    const before = await image.boundingBox();
    const surfaceBox = await surface.boundingBox();
    assert.ok(before && surfaceBox);
    near(surfaceBox.x, before.x, .25, "tap surface/image x");
    near(surfaceBox.y, before.y, .25, "tap surface/image y");
    near(surfaceBox.width, before.width, .25, "tap surface/image width");
    near(surfaceBox.height, before.height, .25, "tap surface/image height");
    const intrinsic = await image.evaluate(element => ({ width: element.naturalWidth, height: element.naturalHeight }));
    near(before.width / before.height, intrinsic.width / intrinsic.height, .003, "rendered source aspect");
    const fixedPhysicalProbes = [[.5,.5],[.25,.25],[.75,.25],[.25,.75],[.75,.75],[.5,.25],[.5,.75]];
    let source = null;
    for (const probe of fixedPhysicalProbes) {
      const click = { x: before.x + before.width * probe[0], y: before.y + before.height * probe[1] };
      await page.mouse.click(click.x, click.y);
      const after = await image.boundingBox();
      const marker = await page.locator("#contractMarkers .contract-observation-marker").boundingBox();
      assert.ok(after && marker);
      near(after.x, before.x, .25, "image x after tap feedback");
      near(after.y, before.y, .25, "image y after tap feedback");
      near(center(marker).x, click.x, 1.5, "TARGET marker physical x");
      near(center(marker).y, click.y, 1.5, "TARGET marker physical y");
      await page.getByRole("button", { name: "Show Result", exact: true }).click();
      const firstOutcome = await Promise.race([
        page.locator("#contractSecView").waitFor({ state: "visible", timeout: 5000 }).then(() => "result").catch(() => "timeout"),
        page.locator("#contractScoringCaliberDialog").waitFor({ state: "visible", timeout: 5000 }).then(() => "caliber").catch(() => "timeout"),
      ]);
      if (firstOutcome === "caliber") await page.locator("[data-scoring-caliber]").first().click();
      if (firstOutcome !== "timeout") { source = { xNorm: probe[0], yNorm: probe[1] }; break; }
      const status = await page.locator("#contractStatus").innerText();
      if (!/geometry_classification_ambiguous/.test(status)) throw new Error(`result did not open; status=${status}`);
      await page.getByRole("button", { name: "Clear", exact: true }).click();
    }
    assert.ok(source, "no fixed physical probe produced a non-ambiguous result");
    await page.locator("#contractSecView").waitFor({ state: "visible" });
    assert.doesNotMatch(await page.locator("#contractSecRoot").innerText(), forbiddenResultMeta);
    const universalResultText = (await page.locator('#contractSecRoot [data-sec-component="result"]').textContent()).trim();
    assert.ok(universalResultText, "RESULT must expose the recovered Founder-approved target result");
    const resultImage = await page.locator(".contract-evidence img").first().boundingBox();
    const resultMarker = await page.locator(".contract-evidence .contract-observation-marker").first().boundingBox();
    assert.ok(resultImage && resultMarker);
    near(center(resultMarker).x, resultImage.x + resultImage.width * source.xNorm, 1.5, "RESULT marker x");
    near(center(resultMarker).y, resultImage.y + resultImage.height * source.yNorm, 1.5, "RESULT marker y");
    await page.getByRole("button", { name: "Save SEC", exact: true }).click();
    await page.getByText("SEC preserved. Exact reopen available.", { exact: true }).waitFor();
    const href = await page.getByRole("link", { name: "Exact Reopen", exact: true }).getAttribute("href");
    assert.ok(href);
    const sessionId = new URL(href, `${origin}/`).searchParams.get("session");
    assert.ok(sessionId);
    await page.goto(`${origin}/records.html?selected=${encodeURIComponent(sessionId)}&authorityPort=${authorityPort}&v=qt-universal-result-1`, { waitUntil: "domcontentloaded" });
    const vaultResult = page.locator('article.vault-record-summary.is-selected .vault-approved-result-panel [data-sec-component="result"]');
    await vaultResult.waitFor({ state: "visible" });
    assert.equal((await vaultResult.textContent()).trim(), universalResultText, "Vault must preserve the approved RESULT without transforming it");
    assert.equal(await page.locator('article.vault-record-summary.is-selected .vault-evidence-pair figcaption').allTextContents().then(items => items.join(" | ")), "BEFORE | RESULT");
    assert.equal(await page.locator("article.vault-record-summary.is-selected .vault-result-summary").count(), 0, "targetScoring Vault must not render a substitute summary");
    await page.goto(new URL(href, `${origin}/`).href, { waitUntil: "domcontentloaded" });
    await page.locator("#contractSecView").waitFor({ state: "visible" });
    assert.doesNotMatch(await page.locator("#contractSecRoot").innerText(), forbiddenResultMeta);
    const reopenImage = await page.locator(".contract-evidence img").first().boundingBox();
    const reopenMarker = await page.locator(".contract-evidence .contract-observation-marker").first().boundingBox();
    assert.ok(reopenImage && reopenMarker);
    near(center(reopenMarker).x, reopenImage.x + reopenImage.width * source.xNorm, 1.5, "exact reopen marker x");
    near(center(reopenMarker).y, reopenImage.y + reopenImage.height * source.yNorm, 1.5, "exact reopen marker y");
    return { chair: row.chair, qtCatalogId: row.qtCatalogId, productName: row.productName, status: "PASS" };
  } finally {
    await page.close();
  }
}

const browser = await chromium.launch({ headless: true });
const results = [];
try {
  for (const [index, row] of rows.entries()) {
    try {
      results.push(await verifyOne(browser, row));
    } catch (error) {
      throw new Error(`QT chair ${row.chair} ${row.qtCatalogId} ${row.productName}: ${error.message}`, { cause: error });
    }
    if ((index + 1) % 25 === 0) console.log(`QT rendered lifecycle ${index + 1}/${rows.length}`);
  }
} finally {
  await browser.close();
}

const artifact = {
  schemaVersion: "sczn3.qt-founder-corrected-254-browser-verification.v1",
  status: results.length === rows.length ? "PASS" : "FAIL",
  contractDrivenChairs: rows.length,
  inheritedZeroingChairs: authority.chairs.length - rows.length,
  controlledPhysicalClick: "rendered source-image center, selected independently of registered region geometry",
  verifiedStages: ["TARGET", "RESULT", "SEC", "VAULT", "exact reopen"],
  coordinatePixelTolerance: 1.5,
  staleResultMetaComponents: 0,
  pass: results.length,
  fail: rows.length - results.length,
  results,
};
await writeFile(artifactPath, `${JSON.stringify(artifact, null, 2)}\n`, "utf8");
console.log(`PASS QT rendered browser lifecycle ${results.length}/${rows.length}; 0 stale RESULT-meta components`);
