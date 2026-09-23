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
    await page.locator('details[data-sec-region="session"] summary').click();
    const text = await page.locator("#contractSecRoot").innerText();
    assert.match(text, /10 HIT/);
    assert.match(text, /0 MISSED/);
    assert.match(text, /10 TOTAL/);
    assert.match(text, /5 of 5 target objects hit/);
    assert.match(text, /EVEN DISTRIBUTION · ALL 5 OBJECTS: 2 TAPS EACH · 100% EVENNESS/);
    assert.equal((text.match(/2 · 20\.0%/g) || []).length, 5);
    await page.getByRole("button", { name: "Save SEC", exact: true }).click();
    await page.getByText("SEC preserved. Exact reopen available.", { exact: true }).waitFor();
    const href = await page.getByRole("link", { name: "Exact Reopen", exact: true }).getAttribute("href");
    await page.goto(new URL(href, `${origin}/`).href, { waitUntil: "domcontentloaded" });
    await page.locator("#contractSecView").waitFor({ state: "visible" });
    assert.match(await page.locator("#contractSecStatus").textContent(), /^(Saved Session Opened|Exact preserved SEC reopened\.)$/);
    assert.equal(await page.locator(".contract-evidence .contract-observation-marker").count(), 10);
    await page.locator('details[data-sec-region="session"] summary').click();
    const reopened = await page.locator("#contractSecRoot").innerText();
    assert.match(reopened, /10 HIT/);
    assert.match(reopened, /0 MISSED/);
    assert.match(reopened, /5 of 5 target objects hit/);
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
