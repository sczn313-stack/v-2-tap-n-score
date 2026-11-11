import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { mkdir, readFile } from "node:fs/promises";
import path from "node:path";

const { chromium, webkit } = createRequire(import.meta.url)("playwright");
const origin = process.env.SCZN3_TST12_ORIGIN;
assert.equal(origin, "http://127.0.0.1:8273", "the Founder-authorized isolated origin is required");
const authorityPort = process.env.SCZN3_TST12_AUTHORITY_PORT;
assert.equal(authorityPort, "8273", "the isolated authority must share the authorized test listener");
const evidenceDir = process.env.SCZN3_IDENTITY_HANDOFF_EVIDENCE_DIR || "/private/tmp/sczn3-identity-handoff-browser-evidence";
await mkdir(evidenceDir, { recursive: true });

const variants = {
  tst12_17: {
    id: "baker_tst12_17_5x23",
    contract: "backend/target_execution_contracts/contracts/baker_tst12_17_5x23_target_scoring_v1.json",
    asset: "assets/TST12_PRINT_17.5X23_V1.svg",
    actualAsset: "production/fixtures/BAKER_TST12_17_5X23_ACTUAL_TEST_EVIDENCE.jpg"
  },
  tst12_23: {
    id: "baker_tst12_23x35",
    contract: "backend/target_execution_contracts/contracts/baker_tst12_23x35_target_scoring_v1.json",
    asset: "assets/TST12_PRINT_23X35_V1.svg",
    actualAsset: null
  }
};

const historicalMatrix = {
  targetProfileId: "baker_st_100yd_smart_zero",
  target_profile_id: "baker_st_100yd_smart_zero",
  targetId: "BAKER-ST-100YD-SMART-AUTHORITY",
  targetName: "Baker 100 Yard Smart Target",
  targetFamily: "Baker 100 Yard Smart Target",
  targetVersion: "BAKER_ST_100YD_SMART_AUTHORITY_v1_ORIGINAL",
  missionFamily: "zeroing",
  experienceMode: "simulation",
  setupId: "founder-historical-glock-g19",
  setupName: "Founder historical setup",
  weaponCategory: "Handgun",
  weaponManufacturer: "Glock",
  weaponModelType: "G19",
  weaponModelCaliber: ".22 LR",
  opticType: "Iron Sights",
  opticAdjustmentUnit: "MOA"
};

async function geometry(variant) {
  const contract = JSON.parse(await readFile(variant.contract, "utf8"));
  return contract.components.geometry.definition.regions;
}

function region(regions, station, suffix) {
  return regions.find(item => item.regionId === `station_${String(station).padStart(2, "0")}_${suffix}`);
}

function governedPoint(regions, station, score) {
  const crosshair = region(regions, station, "crosshair");
  if (score === 5) return [crosshair.cx, crosshair.cy];
  if (score === 4) {
    const red = region(regions, station, "red_center");
    return [red.cx + red.radiusX * 0.6, red.cy + red.radiusY * 0.5];
  }
  if (score === 3) {
    // Use the second governed black ring so the authorized .22 LR footprint
    // cannot touch the higher-value red center under the line-touch rule.
    const ring = region(regions, station, "black_ring_2");
    return [ring.cx + (ring.innerRadiusX + ring.outerRadiusX) / 2, ring.cy];
  }
  if (score === 2) {
    const square = region(regions, station, "square");
    return [square.xMin + 0.01, square.yMin + 0.01];
  }
  throw new Error(`unsupported governed score ${score}`);
}

function scoring(result) {
  const source = result?.scoring || {};
  const metrics = result?.sczn3Metrics || {};
  const classifications = Array.isArray(result?.classifications) ? result.classifications : [];
  return {
    points: Number(source.total ?? source.totalPoints),
    hits: Number(source.hitCount ?? source.hits ?? classifications.filter(item => item?.countsAsHit === true).length),
    misses: Number(source.missCount ?? source.misses ?? source.outsideCount ?? classifications.filter(item => item?.countsAsHit !== true).length),
    taps: Number(source.totalTaps ?? source.observationCount ?? source.tapCount),
    ppt: Number(metrics.pointsPerTap ?? source.pointsPerTap)
  };
}

async function newSaturatedContext(browser, browserName) {
  const context = await browser.newContext({ viewport: { width: 1180, height: 900 } });
  await context.addInitScript(matrix => {
    window.__sczn3StorageWarnings = [];
    window.addEventListener("sczn3:browser-storage-unavailable", event => window.__sczn3StorageWarnings.push(event.detail));
    if (localStorage.getItem("SCZN3_IDENTITY_HANDOFF_FIXTURE") === "seeded") return;
    localStorage.setItem("SCZN3_ACTIVE_MATRIX", JSON.stringify(matrix));
    localStorage.setItem("SCZN3_EXISTING_HISTORY_SENTINEL", JSON.stringify({ preserved: true, owner: "Founder" }));
    localStorage.setItem("SCZN3_IDENTITY_HANDOFF_FIXTURE", "seeded");
    let quotaError = null;
    for (const size of [240_000, 50_000, 5_000, 500, 50, 5]) {
      const block = "x".repeat(size);
      for (let index = 0; index < 250; index += 1) {
        try { localStorage.setItem(`SCZN3_QUOTA_${size}_${index}`, block); }
        catch (error) { quotaError = { name: error.name, message: error.message }; break; }
      }
    }
    window.__sczn3QuotaError = quotaError;
  }, historicalMatrix);
  const page = await context.newPage();
  await page.goto(`${origin}/${variants.tst12_17.asset}`, { waitUntil: "domcontentloaded" });
  const seeded = await page.evaluate(() => ({
    matrix: localStorage.getItem("SCZN3_ACTIVE_MATRIX"),
    sentinel: localStorage.getItem("SCZN3_EXISTING_HISTORY_SENTINEL"),
    quota: window.__sczn3QuotaError
  }));
  assert.equal(JSON.parse(seeded.matrix).targetProfileId, historicalMatrix.targetProfileId, `${browserName}: historical matrix seeded`);
  assert.deepEqual(JSON.parse(seeded.sentinel), { preserved: true, owner: "Founder" }, `${browserName}: historical sentinel seeded`);
  assert.equal(seeded.quota?.name, "QuotaExceededError", `${browserName}: Safari-style storage saturation reproduced`);
  return { context, page, seeded };
}

async function selectStation(page, station) {
  const regionId = `station_${String(station).padStart(2, "0")}_square`;
  await page.locator(`rect[data-tst12-station-selector="${regionId}"]`).click({ force: true });
}

async function recordPlan(page, variant, plan) {
  const regions = await geometry(variant);
  const surface = page.locator("#contractTapSurface");
  const box = await surface.boundingBox();
  assert.ok(box?.width > 200 && box?.height > 300, "the governed target surface is available");
  let markerCount = 0;
  for (const entry of plan) {
    await selectStation(page, entry.station);
    for (const score of entry.scores) {
      const [x, y] = governedPoint(regions, entry.station, score);
      await surface.click({ position: { x: box.width * x, y: box.height * y } });
      markerCount += 1;
      await page.locator(".contract-observation-marker").nth(markerCount - 1).waitFor();
    }
  }
  assert.equal(await page.locator(".contract-observation-marker").count(), markerCount);
}

async function completeLifecycle(browser, browserName, variant, mode, plan, expected) {
  const { context, page, seeded } = await newSaturatedContext(browser, browserName);
  let sessionStarts = 0;
  let secRequests = 0;
  let preservedRequest = null;
  page.on("request", request => {
    const pathname = new URL(request.url()).pathname;
    if (request.method() === "POST" && pathname === "/api/session/start") sessionStarts += 1;
    if (request.method() === "POST" && pathname === "/api/session/sec") {
      secRequests += 1;
      preservedRequest = request.postDataJSON();
    }
  });
  const query = new URLSearchParams({
    target: variant.id,
    missionFamily: "targetScoring",
    experienceMode: mode,
    authorityPort,
    v: "authoritative-session-identity-handoff"
  });
  if (mode === "simulation") query.set("source", "registered");
  await page.goto(`${origin}/target-experience.html?${query}`, { waitUntil: "domcontentloaded" });
  if (mode === "actual") {
    await page.locator("#contractCapture").waitFor({ state: "visible" });
    await page.locator("#contractFile").setInputFiles(variant.actualAsset);
  }
  await page.locator("#contractWorkspace").waitFor({ state: "visible" });
  await page.locator("#contractActualDistance").fill("25");
  await page.locator("#contractScoringCaliber").selectOption(".22 LR");
  await recordPlan(page, variant, plan);
  assert.equal(sessionStarts, 1, `${browserName} ${variant.id} ${mode}: one durable session`);
  await page.locator("#contractShowResult").click();
  await page.locator("#contractSecView").waitFor({ state: "visible" });
  assert.match(await page.locator("#contractSecRoot").innerText(), new RegExp(`TOTAL POINTS\\s*${expected.points}`));
  const [saveResponse] = await Promise.all([
    page.waitForResponse(response => new URL(response.url()).pathname === "/api/session/sec" && response.request().method() === "POST"),
    page.getByRole("button", { name: "Save SEC", exact: true }).click()
  ]);
  assert.equal(saveResponse.status(), 201, `${browserName} ${variant.id} ${mode}: SEC saved`);
  assert.equal(secRequests, 1, `${browserName} ${variant.id} ${mode}: exactly one preservation request`);
  assert.equal(preservedRequest?.session?.targetProfileId, variant.id, "session target identity follows Backend admission");
  assert.equal(preservedRequest?.session?.matrixSnapshot?.targetProfileId, variant.id, "matrix target identity follows Backend admission");
  assert.notEqual(preservedRequest?.session?.matrixSnapshot?.targetProfileId, historicalMatrix.targetProfileId, "historical identity cannot contaminate the new session");
  assert.notEqual(preservedRequest?.session?.matrixSnapshot?.targetFamily, historicalMatrix.targetFamily, "historical target-family metadata cannot contaminate the new session");
  const saved = await saveResponse.json();
  const result = saved.session?.authorityPackage || saved.session?.backendAuthorityPackage;
  assert.deepEqual(scoring(result), expected, `${browserName} ${variant.id} ${mode}: authoritative scoring`);
  assert.match(String(saved.reopenCapability || ""), /^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/);
  const vault = page.locator('a[data-sczn3-action="history"]', { hasText: "Ballistic Vault" }).first();
  await vault.click();
  const record = page.locator(`article.vault-record-summary[data-session-id="${saved.session.sessionId}"]`);
  await record.waitFor();
  assert.match(await record.innerText(), new RegExp(`TOTAL POINTS\\s*${expected.points}`));
  await record.locator("a.vault-record-link").click();
  await page.locator("#contractSecView").waitFor({ state: "visible" });
  assert.match(page.url(), new RegExp(`session=${saved.session.sessionId}`));
  assert.match(await page.locator("#contractSecRoot").innerText(), new RegExp(`TOTAL POINTS\\s*${expected.points}`));
  const storageAfter = await page.evaluate(() => ({
    matrix: localStorage.getItem("SCZN3_ACTIVE_MATRIX"),
    sentinel: localStorage.getItem("SCZN3_EXISTING_HISTORY_SENTINEL")
  }));
  assert.equal(storageAfter.matrix, seeded.matrix, `${browserName}: historical active matrix remains unchanged`);
  assert.equal(storageAfter.sentinel, seeded.sentinel, `${browserName}: historical record sentinel remains unchanged`);
  await page.screenshot({ path: path.join(evidenceDir, `${browserName}-${variant.id}-${mode}-${expected.taps}.png`), fullPage: true });
  await context.close();
  return { browserName, target: variant.id, mode, sessionId: saved.session.sessionId, ...expected };
}

const founderPlan = [
  { station: 1, scores: [5, 4, 3] },
  { station: 2, scores: [5, 4, 3] },
  { station: 3, scores: [2, 2] }
];
const fullHitPlan = Array.from({ length: 12 }, (_, index) => ({ station: index + 1, scores: [5, 5, 5, 5, 5] }));
const results = [];
const requestedBrowser = String(process.env.SCZN3_IDENTITY_HANDOFF_BROWSER || "").trim().toLowerCase();
const browserEntries = [["chromium", chromium], ["webkit", webkit]]
  .filter(([browserName]) => !requestedBrowser || browserName === requestedBrowser);
assert.ok(browserEntries.length > 0, "SCZN3_IDENTITY_HANDOFF_BROWSER must be chromium or webkit when provided");

for (const [browserName, browserType] of browserEntries) {
  const browser = await browserType.launch({ headless: true });
  try {
    results.push(await completeLifecycle(browser, browserName, variants.tst12_17, "simulation", founderPlan, {
      points: 28, hits: 8, misses: 0, taps: 8, ppt: 3.5
    }));
    results.push(await completeLifecycle(browser, browserName, variants.tst12_17, "actual", fullHitPlan, {
      points: 300, hits: 60, misses: 0, taps: 60, ppt: 5
    }));
    results.push(await completeLifecycle(browser, browserName, variants.tst12_23, "simulation", fullHitPlan, {
      points: 300, hits: 60, misses: 0, taps: 60, ppt: 5
    }));
    const withheldContext = await browser.newContext();
    const withheld = await withheldContext.newPage();
    const rejected = await withheld.request.post(`${origin}/api/session/prepare`, {
      data: { targetId: variants.tst12_23.id, missionFamily: "targetScoring", experienceMode: "actual" }
    });
    assert.equal(rejected.status(), 409, `${browserName}: 23x35 Actual Round remains unavailable`);
    assert.equal((await rejected.json()).reason, "experience_mode_not_available");
    await withheldContext.close();
  } finally {
    await browser.close();
  }
}

console.log(JSON.stringify({ verdict: "PASS", results, evidenceDir }, null, 2));
