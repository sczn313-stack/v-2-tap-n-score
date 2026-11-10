import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { existsSync } from "node:fs";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";

const { chromium } = createRequire(import.meta.url)("playwright");
const docs = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const origin = process.env.SCZN3_TST12_ORIGIN;
assert.ok(origin, "SCZN3_TST12_ORIGIN is required; this write-capable lifecycle gate has no default listener");
const parsedOrigin = new URL(origin);
assert.ok(["127.0.0.1", "localhost", "[::1]"].includes(parsedOrigin.hostname), "the lifecycle gate requires an isolated loopback origin");
assert.ok(!["8221", "8233"].includes(parsedOrigin.port), "protected Founder listeners 8221/8233 are forbidden");
const authorityPort = process.env.SCZN3_TST12_AUTHORITY_PORT || new URL(origin).port;
assert.ok(!["8221", "8233"].includes(String(authorityPort)), "protected Founder authority listeners 8221/8233 are forbidden");
const evidenceDir = path.resolve(process.env.SCZN3_TST12_EVIDENCE_DIR || path.join(docs, "test-evidence", "phase4g-live-scoring"));
const variants = [
  {
    id: "baker_tst12_17_5x23",
    contractPath: "backend/target_execution_contracts/contracts/baker_tst12_17_5x23_target_scoring_v1.json",
    // Founder-supplied source art matches this face's 17.5 x 23 aspect ratio.
    actualEvidenceAsset: "production/fixtures/BAKER_TST12_17_5X23_ACTUAL_TEST_EVIDENCE.jpg"
  },
  {
    id: "baker_tst12_23x35",
    contractPath: "backend/target_execution_contracts/contracts/baker_tst12_23x35_target_scoring_v1.json",
    // No registered 23 x 35 actual-photo evidence is available in this checkout.
    // Never use the 17.5 x 23 photo as a surrogate for an actual-round test.
    actualEvidenceAsset: null
  }
];
const systemChrome = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const sha256 = value => createHash("sha256").update(value).digest("hex");

for (const variant of variants) {
  variant.contract = JSON.parse(await readFile(path.join(docs, variant.contractPath), "utf8"));
  variant.crosshairs = variant.contract.components.geometry.definition.regions
    .filter(region => /^station_\d+_crosshair$/.test(region.regionId))
    .map(region => ({
      station: Number(region.regionId.match(/^station_(\d+)_/)[1]),
      stationRegionId: region.regionId.replace(/_crosshair$/, "_square"),
      scoringRegionId: region.regionId,
      xNorm: region.cx,
      yNorm: region.cy
    }))
    .sort((left, right) => left.station - right.station);
  assert.equal(variant.crosshairs.length, 12, `${variant.id} contract governs twelve crosshair centers`);
}

async function governedPointInBrowser(page, governedPoint) {
  return page.evaluate(({ xNorm, yNorm }) => {
    const surface = document.querySelector('[data-observation-coordinate-surface="true"]');
    if (!surface) throw new Error("governed observation coordinate surface unavailable");
    const rect = surface.getBoundingClientRect();
    const viewBox = surface.viewBox && surface.viewBox.baseVal;
    const preserveAspectRatio = String(surface.getAttribute("preserveAspectRatio") || "xMidYMid meet");
    let left = rect.left;
    let top = rect.top;
    let width = rect.width;
    let height = rect.height;
    if (viewBox && viewBox.width > 0 && viewBox.height > 0 && !/(^|\s)none(\s|$)/.test(preserveAspectRatio)) {
      const scale = /(^|\s)slice(\s|$)/.test(preserveAspectRatio)
        ? Math.max(rect.width / viewBox.width, rect.height / viewBox.height)
        : Math.min(rect.width / viewBox.width, rect.height / viewBox.height);
      width = viewBox.width * scale;
      height = viewBox.height * scale;
      left += /xMax/.test(preserveAspectRatio) ? rect.width - width : /xMid/.test(preserveAspectRatio) ? (rect.width - width) / 2 : 0;
      top += /YMax/.test(preserveAspectRatio) ? rect.height - height : /YMid/.test(preserveAspectRatio) ? (rect.height - height) / 2 : 0;
    }
    return { clientX: left + xNorm * width, clientY: top + yNorm * height, renderedSurface: { left, top, width, height } };
  }, governedPoint);
}

async function selectAndTapCrosshair(page, governedPoint) {
  await page.locator(`[data-tst12-station-selector="${governedPoint.stationRegionId}"]`).last().click({ force: true });
  const projections = [];
  for (let shot = 0; shot < 5; shot += 1) {
    // Observation markers can change the rendered surface's document position.
    // Re-project the same governed coordinate before every browser interaction;
    // a previously calculated client coordinate is not authority.
    const projected = await governedPointInBrowser(page, governedPoint);
    await page.mouse.click(projected.clientX, projected.clientY);
    projections.push(projected);
    await page.waitForTimeout(60);
  }
  return projections;
}

async function persistEvidence(fileName, evidence) {
  await mkdir(evidenceDir, { recursive: true });
  const serialized = `${JSON.stringify(evidence, null, 2)}\n`;
  const destination = path.join(evidenceDir, fileName);
  await writeFile(destination, serialized);
  await writeFile(`${destination}.sha256`, `${sha256(serialized)}  ${path.basename(destination)}\n`);
  return destination;
}

async function verifyLifecycle(page, target, mode, trial) {
  const exchanges = [];
  page.on("response", async response => {
    try {
      const requestUrl = new URL(response.url());
      if (requestUrl.pathname !== "/api/target-execution" || response.request().method() !== "POST") return;
      exchanges.push({
        request: response.request().postDataJSON(),
        response: await response.json(),
        status: response.status()
      });
    } catch (error) {
      exchanges.push({ captureError: String(error) });
    }
  });
  const query = new URLSearchParams({
    target: target.id,
    missionFamily: "targetScoring",
    experienceMode: mode,
    authorityPort,
    v: "tst12-live-scoring-lifecycle-phase4g"
  });
  if (mode === "simulation") query.set("source", "registered");
  await page.goto(`${origin}/target-experience.html?${query}`, { waitUntil: "domcontentloaded" });
  if (mode === "actual") {
    assert.ok(target.actualEvidenceAsset, `${target.id} needs registered, target-matched actual-photo evidence`);
    // Registered TST-12 routes already admit their authoritative session. Older
    // entry points still expose Start, so only activate it when it is visible.
    const start = page.locator("#contractStart");
    if (!(await page.locator("#contractWorkspace").isVisible()) && (await start.isVisible())) {
      await start.evaluate(button => button.click());
    }
  }
  if (mode === "actual") {
    await page.locator("#contractCapture").waitFor({ state: "visible" });
    await page.locator("#contractFile").setInputFiles(path.join(docs, target.actualEvidenceAsset));
  }
  await page.locator("#contractWorkspace").waitFor({ state: "visible" });
  await page.locator("#contractActualDistance").fill("25");
  await page.locator("#contractScoringCaliber").selectOption(".22 LR");

  const stationOrder = trial === "reverse" ? [...target.crosshairs].reverse() : target.crosshairs;
  const projections = [];
  for (const governedPoint of stationOrder) {
    projections.push({ governedPoint, shots: await selectAndTapCrosshair(page, governedPoint) });
  }
  await page.waitForFunction(() => document.querySelectorAll(".contract-observation-marker[data-tst12-shot-outcome='hit']").length === 60);

  await page.locator("#contractShowResult").click();
  await page.locator("#contractSecView").waitFor({ state: "visible" });
  const finalExchange = exchanges.filter(exchange => exchange.response?.ok).at(-1);
  assert.ok(finalExchange, `${target.id} ${mode} ${trial} captured its authoritative execution exchange`);
  const authoritativeResult = finalExchange.response;
  const submittedObservations = finalExchange.request.observations || authoritativeResult.sourceObservations || [];
  const classifications = Array.isArray(authoritativeResult.classifications) ? authoritativeResult.classifications : [];
  const classificationById = new Map(classifications.map(item => [item.observationId, item]));
  const governedByStation = new Map(target.crosshairs.map(item => [item.stationRegionId, item]));
  const reconciliation = submittedObservations.map(observation => {
    const classification = classificationById.get(observation.observationId);
    const governed = governedByStation.get(observation.assignedStationRegionId);
    return {
      observationId: observation.observationId,
      assignedStationRegionId: observation.assignedStationRegionId,
      submittedCoordinate: { xNorm: observation.xNorm, yNorm: observation.yNorm },
      governedCoordinateBasis: governed,
      classification: classification ? {
        regionId: classification.regionId,
        value: classification.value,
        countedValue: classification.countedValue,
        countsAsHit: classification.countsAsHit,
        creditedForScore: classification.creditedForScore,
        countedForScore: classification.countedForScore
      } : null
    };
  });
  const evidence = {
    evidenceType: "sczn3-phase4g-tst12-live-browser-scoring-v1",
    target: {
      id: target.id,
      authorityVersion: target.contract.authorityContractVersion,
      contractId: target.contract.contractId,
      contractVersion: target.contract.contractVersion,
      contractFingerprint: target.contract.contractFingerprint,
      governedCoordinateSystem: target.contract.components.geometry.definition.coordinateSystem
    },
    mode,
    trial,
    stationOrder: stationOrder.map(item => item.station),
    browserProjectionEvidence: projections,
    authoritativeSessionId: authoritativeResult.authoritativeSessionId,
    submittedObservationCount: submittedObservations.length,
    reconciliation,
    stationBestFive: authoritativeResult.scoring?.stationBestFive || [],
    totals: {
      observationCount: authoritativeResult.scoring?.observationCount,
      creditedObservationCount: authoritativeResult.scoring?.creditedObservationCount,
      additionalObservationCount: authoritativeResult.scoring?.additionalObservationCount,
      hits: authoritativeResult.scoring?.actualHitCount,
      misses: authoritativeResult.scoring?.actualMissCount,
      points: authoritativeResult.scoring?.total,
      pointsPerTap: authoritativeResult.sczn3Metrics?.pointsPerTap
    },
    targetExecutionExchanges: exchanges
  };
  const evidencePath = await persistEvidence(`${target.id}-${mode}-${trial}.json`, evidence);

  assert.equal(submittedObservations.length, 60, `${evidencePath}: all submitted observations captured`);
  assert.equal(reconciliation.length, 60, `${evidencePath}: all observations reconciled`);
  for (const item of reconciliation) {
    assert.ok(item.governedCoordinateBasis, `${item.observationId} retains a governed station`);
    assert.ok(Math.abs(item.submittedCoordinate.xNorm - item.governedCoordinateBasis.xNorm) < 0.000001, `${item.observationId} x remains at the governed crosshair`);
    assert.ok(Math.abs(item.submittedCoordinate.yNorm - item.governedCoordinateBasis.yNorm) < 0.000001, `${item.observationId} y remains at the governed crosshair`);
    assert.equal(item.classification?.regionId, item.governedCoordinateBasis.scoringRegionId, `${item.observationId} matches its governed crosshair region`);
    assert.equal(item.classification?.value, 5, `${item.observationId} receives the governed crosshair value`);
    assert.equal(item.classification?.countsAsHit, true, `${item.observationId} remains a hit`);
    assert.equal(item.classification?.creditedForScore, true, `${item.observationId} remains selected for scoring`);
  }
  assert.equal(authoritativeResult.scoring.stationBestFive.length, 12);
  authoritativeResult.scoring.stationBestFive.forEach(station => {
    assert.equal(station.creditedObservations, 5);
    assert.equal(station.additionalObservations, 0);
    assert.equal(station.bestFiveScore, 25);
  });
  assert.equal(authoritativeResult.scoring.total, 300);
  assert.equal(authoritativeResult.scoring.actualHitCount, 60);
  assert.equal(authoritativeResult.scoring.actualMissCount, 0);
  assert.equal(authoritativeResult.scoring.creditedObservationCount, 60);
  assert.equal(authoritativeResult.scoring.additionalObservationCount, 0);
  assert.equal(authoritativeResult.sczn3Metrics.pointsPerTap, 5);

  const result = await page.locator("#contractSecRoot").innerText();
  assert.match(result, /TOTAL POINTS\s*300/);
  assert.match(result, /TOTAL TAPS\s*60/);
  assert.match(result, /POINTS PER TAP\s*5\.00/);
  assert.match(result, /60 HITS\s*\|\s*0 MISSES\s*\|\s*60 RECORDED/);

  const save = page.locator("#contractSecRoot [data-sczn3-action='save']");
  assert.match((await save.innerText()).trim().toUpperCase(), /^SAVE SEC(?:\s|$)/);
  const savedResponse = page.waitForResponse(response => response.url().includes("/api/session/sec") && response.request().method() === "POST");
  await save.click();
  const preservedResponse = await savedResponse;
  assert.equal(preservedResponse.status(), 201);
  const preserved = await preservedResponse.json();
  assert.equal(preserved.session.sessionId, authoritativeResult.authoritativeSessionId);
  evidence.preservedSEC = {
    sessionId: preserved.session.sessionId,
    targetId: preserved.session.matrixSnapshot?.targetProfileId,
    missionFamily: preserved.session.matrixSnapshot?.mission_family || preserved.session.matrixSnapshot?.missionFamilyId,
    artifactSha256: preserved.artifactSha256,
    preservedAt: preserved.preservedAt
  };
  await persistEvidence(`${target.id}-${mode}-${trial}.json`, evidence);
  const reopened = page.locator("#contractSecRoot a.contract-exact-reopen");
  const reopenHref = await reopened.getAttribute("href");
  assert.ok(reopenHref, "exact-reopen link is present after saving");
  const vaultHref = await page.locator("#contractSecRoot a.sec-vault-destination").getAttribute("href");
  assert.ok(vaultHref, "Vault link is present after saving");
  evidence.reopen = { exactHref: reopenHref, vaultHref };
  await persistEvidence(`${target.id}-${mode}-${trial}.json`, evidence);
  await page.goto(new URL(vaultHref, origin).href, { waitUntil: "domcontentloaded" });
  await page.getByRole("heading", { name: "BALLISTIC VAULT", exact: true }).waitFor();
  await page.goto(new URL(reopenHref, origin).href, { waitUntil: "domcontentloaded" });
  try {
    await page.locator("#contractSecView").waitFor({ state: "visible" });
  } catch (error) {
    const diagnostic = await page.evaluate(() => ({ url: location.href, status: document.querySelector("#contractStatus")?.textContent || "", bodyMode: document.body.dataset.tst12Mode || "" }));
    throw new Error(`exact_reopen_not_visible ${JSON.stringify(diagnostic)}`, { cause: error });
  }
  const exactReopenResult = await page.locator("#contractSecRoot").innerText();
  assert.match(exactReopenResult, /TOTAL POINTS\s*300/);
  assert.match(exactReopenResult, /TOTAL TAPS\s*60/);
  assert.match(exactReopenResult, /POINTS PER TAP\s*5\.00/);
  return { evidencePath, sessionId: authoritativeResult.authoritativeSessionId, artifactSha256: preserved.artifactSha256 };
}

const browser = await chromium.launch({ headless: true, ...(existsSync(systemChrome) ? { executablePath: systemChrome } : {}) });
try {
  const context = await browser.newContext({ viewport: { width: 1180, height: 900 } });
  const selectedVariants = process.env.PHASE4G_TARGET ? variants.filter(target => target.id === process.env.PHASE4G_TARGET) : variants;
  const selectedModes = process.env.PHASE4G_MODE ? [process.env.PHASE4G_MODE] : ["simulation", "actual"];
  const selectedTrials = process.env.PHASE4G_TRIAL ? [process.env.PHASE4G_TRIAL] : ["forward", "reverse"];
  for (const target of selectedVariants) {
    for (const mode of selectedModes) {
      if (mode === "actual" && !target.actualEvidenceAsset) {
        console.log(`BLOCKED ${target.id} actual: registered target-matched actual-photo evidence is unavailable`);
        continue;
      }
      for (const trial of selectedTrials) {
        const page = await context.newPage();
        const proof = await verifyLifecycle(page, target, mode, trial);
        console.log(`PASS ${target.id} ${mode} ${trial} governed crosshairs -> Result -> SEC -> Save -> Vault -> exact reopen (${proof.evidencePath})`);
        await page.close();
      }
    }
  }
  await context.close();
} finally {
  await browser.close();
}
