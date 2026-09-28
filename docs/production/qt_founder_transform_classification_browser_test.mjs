import assert from "node:assert/strict";
import { readFile, writeFile } from "node:fs/promises";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { chromium } = require("playwright");

const origin = process.env.SCZN3_QT_ORIGIN || "http://127.0.0.1:8119";
const authorityPort = process.env.SCZN3_QT_AUTHORITY_PORT || "8118";
const authority = JSON.parse(await readFile("backend/target_knowledge/qt_episode64_smart_target_authority.json", "utf8"));
const artifactPath = "authority-evidence/platform/qt-episode64-homie-locked-treatment-2026-09-23/QT_FOUNDER_TRANSFORM_CLASSIFICATION_BROWSER_VERIFICATION.json";
const contractRows = authority.chairs.filter(row => row.contractPath);
const sortedByAspect = [...contractRows].sort((a, b) => a.geometry.observedPhysicalStructure.aspectRatio - b.geometry.observedPhysicalStructure.aspectRatio);

const fiveSpot = authority.chairs.find(row => row.chair === 1);
const target530 = authority.chairs.find(row => row.chair === 2);
const aspectRepresentatives = [fiveSpot, target530, sortedByAspect[0], sortedByAspect.at(-1)]
  .filter((row, index, rows) => rows.findIndex(candidate => candidate.qtCatalogId === row.qtCatalogId) === index);

function targetUrl(row) {
  return `${origin}/target-experience.html?missionFamily=${encodeURIComponent(row.missionFamily)}&target=${encodeURIComponent(row.targetProfileId)}&source=registered&authorityPort=${authorityPort}&v=qt-founder-transform-classification-1`;
}

function center(box) {
  return { x: box.x + box.width / 2, y: box.y + box.height / 2 };
}

function near(actual, expected, tolerance, message) {
  assert.ok(Math.abs(actual - expected) <= tolerance, `${message}: expected ${expected}, received ${actual}`);
}

async function assertPaintedUGOPlane(imageLocator, stage) {
  const geometry = await imageLocator.evaluate(image => {
    const container = image.parentElement;
    const layer = container && container.querySelector("#contractMarkers,.contract-evidence-marker-layer,.history-evidence-layer");
    const rect = element => {
      const box = element.getBoundingClientRect();
      return { x: box.x, y: box.y, width: box.width, height: box.height };
    };
    const style = getComputedStyle(image);
    return {
      plane: container && container.dataset.ugoProjectionPlane,
      image: rect(image),
      layer: layer ? rect(layer) : null,
      intrinsic: { width: image.naturalWidth, height: image.naturalHeight },
      style: {
        objectFit: style.objectFit,
        borderLeft: Number.parseFloat(style.borderLeftWidth) || 0,
        borderRight: Number.parseFloat(style.borderRightWidth) || 0,
        borderTop: Number.parseFloat(style.borderTopWidth) || 0,
        borderBottom: Number.parseFloat(style.borderBottomWidth) || 0,
        paddingLeft: Number.parseFloat(style.paddingLeft) || 0,
        paddingRight: Number.parseFloat(style.paddingRight) || 0,
        paddingTop: Number.parseFloat(style.paddingTop) || 0,
        paddingBottom: Number.parseFloat(style.paddingBottom) || 0,
      },
    };
  });
  assert.equal(geometry.plane, "normalized-source-image", `${stage} must use an explicit UGO source-image plane`);
  assert.ok(geometry.layer, `${stage} marker layer must exist`);
  assert.equal(geometry.style.objectFit, "fill", `${stage} source image must fill a same-aspect plane without crop or letterbox`);
  assert.deepEqual(
    [geometry.style.borderLeft, geometry.style.borderRight, geometry.style.borderTop, geometry.style.borderBottom, geometry.style.paddingLeft, geometry.style.paddingRight, geometry.style.paddingTop, geometry.style.paddingBottom],
    [0, 0, 0, 0, 0, 0, 0, 0],
    `${stage} source pixels must have no untracked border or padding`
  );
  near(geometry.image.width / geometry.image.height, geometry.intrinsic.width / geometry.intrinsic.height, 0.00005, `${stage} painted source-image aspect`);
  near(geometry.layer.x, geometry.image.x, 0.25, `${stage} UGO plane left`);
  near(geometry.layer.y, geometry.image.y, 0.25, `${stage} UGO plane top`);
  near(geometry.layer.width, geometry.image.width, 0.25, `${stage} UGO plane width`);
  near(geometry.layer.height, geometry.image.height, 0.25, `${stage} UGO plane height`);
  return geometry.image;
}

async function ready(page, row) {
  await page.goto(targetUrl(row), { waitUntil: "domcontentloaded" });
  await page.locator("#contractStatus").getByText("Target loaded. Tap your shot holes.", { exact: true }).waitFor();
  await page.locator("#contractTargetImage").waitFor({ state: "visible" });
}

async function renderedProjectionCheck(browser, row, viewport) {
  const page = await browser.newPage({ viewport });
  try {
    await ready(page, row);
    const image = page.locator("#contractTargetImage");
    const surface = page.locator("#contractTapSurface");
    const before = await image.boundingBox();
    const surfaceBefore = await surface.boundingBox();
    assert.ok(before && surfaceBefore);
    near(surfaceBefore.x, before.x, 0.25, "tap surface left must equal rendered image left");
    near(surfaceBefore.y, before.y, 0.25, "tap surface top must equal rendered image top");
    near(surfaceBefore.width, before.width, 0.25, "tap surface width must equal rendered image width");
    near(surfaceBefore.height, before.height, 0.25, "tap surface height must equal rendered image height");
    const intrinsic = await image.evaluate(element => ({ width: element.naturalWidth, height: element.naturalHeight }));
    near(before.width / before.height, intrinsic.width / intrinsic.height, 0.003, "rendered source-image aspect ratio");
    const source = { xNorm: 0.5, yNorm: 0.5 };
    const click = { x: before.x + before.width * source.xNorm, y: before.y + before.height * source.yNorm };
    await page.mouse.click(click.x, click.y);
    const after = await image.boundingBox();
    const marker = await page.locator("#contractMarkers .contract-observation-marker").boundingBox();
    assert.ok(after && marker);
    near(after.x, before.x, 0.25, "target must not move horizontally after tap feedback");
    near(after.y, before.y, 0.25, "target must not move vertically after tap feedback");
    near(center(marker).x, click.x, 1.5, "TARGET marker center must remain at original click x");
    near(center(marker).y, click.y, 1.5, "TARGET marker center must remain at original click y");
    await page.getByRole("button", { name: "Show Result", exact: true }).click();
    await page.locator("#contractSecView").waitFor({ state: "visible" });
    const resultImage = await page.locator(".contract-evidence img").first().boundingBox();
    const resultMarker = await page.locator(".contract-evidence .contract-observation-marker").first().boundingBox();
    assert.ok(resultImage && resultMarker);
    near(center(resultMarker).x, resultImage.x + resultImage.width * source.xNorm, 1.5, "RESULT/SEC marker x projection");
    near(center(resultMarker).y, resultImage.y + resultImage.height * source.yNorm, 1.5, "RESULT/SEC marker y projection");
    await page.getByRole("button", { name: "Save SEC", exact: true }).click();
    await page.getByText("SEC preserved. Exact reopen available.", { exact: true }).waitFor();
    const href = await page.getByRole("link", { name: "Exact Reopen", exact: true }).getAttribute("href");
    assert.ok(href);
    await page.goto(new URL(href, `${origin}/`).href, { waitUntil: "domcontentloaded" });
    await page.locator("#contractSecView").waitFor({ state: "visible" });
    assert.match(await page.locator("#contractSecStatus").textContent(), /^(Saved Session Opened|Exact preserved SEC reopened\.)$/);
    const reopenImage = await page.locator(".contract-evidence img").first().boundingBox();
    const reopenMarker = await page.locator(".contract-evidence .contract-observation-marker").first().boundingBox();
    assert.ok(reopenImage && reopenMarker);
    near(center(reopenMarker).x, reopenImage.x + reopenImage.width * source.xNorm, 1.5, "exact reopen marker x projection");
    near(center(reopenMarker).y, reopenImage.y + reopenImage.height * source.yNorm, 1.5, "exact reopen marker y projection");
  } finally {
    await page.close();
  }
}

async function founder530ClassificationCheck(browser) {
  const page = await browser.newPage({ viewport: { width: 390, height: 900 } });
  try {
    await ready(page, target530);
    const centers = [
      { xNorm: 0.259, yNorm: 0.197721 },
      { xNorm: 0.778, yNorm: 0.199062 },
      { xNorm: 0.515, yNorm: 0.462466 },
      { xNorm: 0.239, yNorm: 0.723861 },
      { xNorm: 0.763, yNorm: 0.727212 },
    ];
    for (const source of centers) {
      for (const dx of [-0.012, 0.012]) {
        const box = await page.locator("#contractTargetImage").boundingBox();
        assert.ok(box);
        await page.mouse.click(box.x + box.width * (source.xNorm + dx), box.y + box.height * source.yNorm);
      }
    }
    assert.equal(await page.locator("#contractMarkers .contract-observation-marker").count(), 10);
    await page.getByRole("button", { name: "Show Result", exact: true }).click();
    await page.locator("#contractSecView").waitFor({ state: "visible" });
    const text = await page.locator("#contractSecRoot").innerText();
    assert.match(text, /10 HIT/);
    assert.match(text, /0 MISSED/);
    assert.match(text, /10 TOTAL/);
    assert.match(text, /5 of 5 target objects hit/);
    assert.equal((text.match(/2 · 20\.0%/g) || []).length, 5);
    await page.getByRole("button", { name: "Save SEC", exact: true }).click();
    await page.getByText("SEC preserved. Exact reopen available.", { exact: true }).waitFor();
    const href = await page.getByRole("link", { name: "Exact Reopen", exact: true }).getAttribute("href");
    assert.ok(href);
    const sessionId = new URL(href, `${origin}/`).searchParams.get("session");
    assert.ok(sessionId);
    await page.goto(`${origin}/records.html?selected=${encodeURIComponent(sessionId)}&authorityPort=${authorityPort}`, { waitUntil: "domcontentloaded" });
    const vaultResult = page.locator('article.vault-record-summary.is-selected .vault-approved-result-panel [data-sec-component="result"]');
    await vaultResult.waitFor({ state: "visible" });
    const vaultText = (await vaultResult.innerText()).replace(/\s+/g, " ");
    assert.match(vaultText, /10 HIT TAPS \| 0 MISSED \| 10 TOTAL TAPS/);
    assert.match(vaultText, /5 of 5 target objects hit/i);
    assert.equal((vaultText.match(/2 · 20\.0%/g) || []).length, 5, "Vault must preserve all five 530 bull distributions");
    assert.equal(await page.locator("article.vault-record-summary.is-selected .vault-result-summary").count(), 0);
    await page.goto(new URL(href, `${origin}/`).href, { waitUntil: "domcontentloaded" });
    await page.locator("#contractSecView").waitFor({ state: "visible" });
    assert.match(await page.locator("#contractSecStatus").textContent(), /^(Saved Session Opened|Exact preserved SEC reopened\.)$/);
    assert.equal(await page.locator(".contract-evidence .contract-observation-marker").count(), 10);
    const reopened = await page.locator("#contractSecRoot").innerText();
    assert.match(reopened, /10 HIT/);
    assert.match(reopened, /0 MISSED/);
    assert.match(reopened, /5 of 5 target objects hit/);
  } finally {
    await page.close();
  }
}

async function fiveSpotPhysicalFeatureLifecycleCheck(browser, sourcePixels, label, viewport) {
  const page = await browser.newPage({ viewport });
  try {
    await ready(page, fiveSpot);
    const image = page.locator("#contractTargetImage");
    const intrinsic = await image.evaluate(element => ({ width: element.naturalWidth, height: element.naturalHeight }));
    assert.deepEqual(intrinsic, { width: 500, height: 776 }, "5-Spot source dimensions changed");
    const sources = sourcePixels.map(point => ({ xNorm: point.x / intrinsic.width, yNorm: point.y / intrinsic.height }));
    for (const source of sources) {
      const box = await image.boundingBox();
      assert.ok(box);
      await page.mouse.click(box.x + box.width * source.xNorm, box.y + box.height * source.yNorm);
    }
    const captureBox = await image.boundingBox();
    assert.ok(captureBox);
    const assertStage = async (imageLocator, markerLocator, stage) => {
      const box = await assertPaintedUGOPlane(imageLocator, `${label} ${stage}`);
      const markers = await markerLocator.all();
      assert.ok(box, `${label} ${stage} image must render`);
      assert.equal(markers.length, sources.length, `${label} ${stage} marker count`);
      for (let index = 0; index < markers.length; index += 1) {
        const markerBox = await markers[index].boundingBox();
        assert.ok(markerBox);
        near(center(markerBox).x, box.x + box.width * sources[index].xNorm, 1.5, `${label} ${stage} marker ${index + 1} x`);
        near(center(markerBox).y, box.y + box.height * sources[index].yNorm, 1.5, `${label} ${stage} marker ${index + 1} y`);
      }
    };
    await assertStage(image, page.locator("#contractMarkers .contract-observation-marker"), "TARGET");
    await page.getByRole("button", { name: "Show Result", exact: true }).click();
    await page.locator("#contractSecView").waitFor({ state: "visible" });
    const resultCanonical = await page.evaluate(() => window.SCZN3M4.getLastSession().authorityPackage.observations.map(observation => observation.canonicalTargetCoordinate));
    assert.equal(resultCanonical.length, sources.length, `${label} RESULT canonical UGO count`);
    resultCanonical.forEach((coordinate, index) => {
      assert.equal(coordinate.schemaVersion, "sczn3.ugo.normalized-source-image-point.v1");
      assert.equal(coordinate.coordinateSystem, "normalized_source_image_top_left");
      assert.equal(coordinate.targetProfileId, "qt_printer13_product_1873683447881");
      near(coordinate.xNorm, sources[index].xNorm, 1.1 / captureBox.width, `${label} RESULT canonical UGO ${index + 1} x`);
      near(coordinate.yNorm, sources[index].yNorm, 1.1 / captureBox.height, `${label} RESULT canonical UGO ${index + 1} y`);
    });
    await assertStage(page.locator(".contract-evidence img").first(), page.locator(".contract-evidence .contract-observation-marker"), "RESULT");
    await page.setViewportSize(viewport.width < 600 ? { width: 1280, height: 900 } : { width: 320, height: 900 });
    await assertStage(page.locator(".contract-evidence img").first(), page.locator(".contract-evidence .contract-observation-marker"), "RESULT REFLOW");
    await page.getByRole("button", { name: "Save SEC", exact: true }).click();
    await page.getByText("SEC preserved. Exact reopen available.", { exact: true }).waitFor();
    const preservedCanonical = await page.evaluate(() => window.SCZN3M4.getLastSession().authorityPackage.observations.map(observation => observation.canonicalTargetCoordinate));
    assert.deepEqual(preservedCanonical, resultCanonical, `${label} SEC must preserve the exact canonical UGO objects`);
    await assertStage(page.locator(".contract-evidence img").first(), page.locator(".contract-evidence .contract-observation-marker"), "SEC");
    const reopenHref = await page.getByRole("link", { name: "Exact Reopen", exact: true }).getAttribute("href");
    assert.ok(reopenHref);
    const sessionId = new URL(reopenHref, `${origin}/`).searchParams.get("session");
    assert.ok(sessionId);
    await page.goto(`${origin}/records.html?selected=${encodeURIComponent(sessionId)}&authorityPort=${authorityPort}`, { waitUntil: "domcontentloaded" });
    const selected = page.locator("article.vault-record-summary.is-selected");
    await selected.waitFor({ state: "visible" });
    await assertStage(selected.locator(".sec-evidence-plane img"), selected.locator(".history-evidence-layer .history-thumb-impact"), "VAULT");
    const vaultResult = selected.locator('.vault-approved-result-panel [data-sec-component="result"]');
    await vaultResult.waitFor({ state: "visible" });
    const vaultResultText = (await vaultResult.innerText()).replace(/\s+/g, " ");
    assert.match(vaultResultText, /5 HIT TAPS \| 0 MISSED \| 5 TOTAL TAPS/);
    assert.equal((vaultResultText.match(/1 · 20\.0%/g) || []).length, 5, "Vault must preserve all five 5-Spot parent distributions");
    assert.match(vaultResultText, new RegExp(`Aim-point subsets · ${label.includes("center") ? "5" : "0"} total`, "i"));
    assert.equal(await selected.locator(".vault-result-summary").count(), 0, "QT Vault must not use the transformed generic summary card");
    await page.goto(new URL(reopenHref, `${origin}/`).href, { waitUntil: "domcontentloaded" });
    await page.locator("#contractSecView").waitFor({ state: "visible" });
    await assertStage(page.locator(".contract-evidence img").first(), page.locator(".contract-evidence .contract-observation-marker"), "EXACT REOPEN");
  } finally {
    await page.close();
  }
}

const browser = await chromium.launch({ headless: true });
try {
  for (const row of aspectRepresentatives) {
    await renderedProjectionCheck(browser, row, { width: 320, height: 900 });
    await renderedProjectionCheck(browser, row, { width: 1280, height: 900 });
  }
  for (const viewport of [{ width: 320, height: 900 }, { width: 1280, height: 900 }]) {
    await fiveSpotPhysicalFeatureLifecycleCheck(browser, [
      { x: 118, y: 186 }, { x: 381, y: 187 }, { x: 248, y: 382 }, { x: 115, y: 584 }, { x: 381, y: 584 },
    ], "5-Spot center squares", viewport);
    await fiveSpotPhysicalFeatureLifecycleCheck(browser, [
      { x: 84, y: 186 }, { x: 347, y: 187 }, { x: 214, y: 382 }, { x: 81, y: 584 }, { x: 347, y: 584 },
    ], "5-Spot surrounding black areas", viewport);
  }
  await founder530ClassificationCheck(browser);
  await writeFile(artifactPath, `${JSON.stringify({
    schemaVersion: "sczn3.qt-founder-transform-classification-browser-verification.v1",
    status: "PASS",
    sharedTargetExperienceChairs: contractRows.length,
    inheritedZeroingUnaffected: authority.chairs.length - contractRows.length,
    aspectRepresentatives: aspectRepresentatives.map(row => ({
      chair: row.chair,
      qtCatalogId: row.qtCatalogId,
      name: row.productName,
      aspectRatio: row.geometry.observedPhysicalStructure.aspectRatio,
    })),
    viewports: [{ width: 320, height: 900 }, { width: 1280, height: 900 }],
    renderedProjectionRuns: aspectRepresentatives.length * 2,
    pixelTolerance: 1.5,
    verifiedStages: ["TARGET", "RESULT", "SEC", "VAULT", "exact reopen"],
    fiveSpotArtworkAnchors: {
      sourceDimensions: { width: 500, height: 776 },
      centerSquareTaps: 10,
      surroundingBlackAreaTaps: 10,
      lifecycleStagesPerRun: 5,
      independentPaintedPlaneAssertions: true,
      resultViewportReflow: true,
    },
    founder530: {
      totalTaps: 10,
      validBullHits: 10,
      missed: 0,
      bullsHit: 5,
      bullCount: 5,
      tapsPerBull: [2, 2, 2, 2, 2],
      exactReopenMarkers: 10,
    },
  }, null, 2)}\n`, "utf8");
  console.log(`PASS QT Founder transform/classification: ${aspectRepresentatives.length} aspect representatives × 2 viewports, 530 10/10 hits, SEC/Vault exact reopen`);
} finally {
  await browser.close();
}
