import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";

const { chromium } = createRequire(import.meta.url)("playwright");
const docs = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const origin = process.env.SCZN3_TST12_ORIGIN || "http://127.0.0.1:8192";
const authorityPort = process.env.SCZN3_TST12_AUTHORITY_PORT || new URL(origin).port;
const evidenceDir = path.resolve(process.env.SCZN3_TST12_EVIDENCE_DIR || path.join(docs, "authority-evidence/baker-tst12/ugo-authority-admission-2026-10-21"));
const variants = [
  { id: "baker_tst12_17_5x23", name: "TST-12-17.5", asset: "assets/TST12_PRINT_17.5X23_V1.svg", actualAsset: "production/fixtures/BAKER_TST12_17_5X23_ACTUAL_TEST_EVIDENCE.jpg", route: "t/baker/tst12-17-5x23/index.html", stationGrid: { x: 0.05, y: 0.05434782608695652, columnStep: 0.3142857142857143, rowStep: 0.22826086956521738 } },
  { id: "baker_tst12_23x35", name: "TST-12-35", asset: "assets/TST12_PRINT_23X35_V1.svg", actualAsset: null, route: "t/baker/tst12-23x35/index.html", stationGrid: { x: 0.05434782608695652, y: 0.04285714285714286, columnStep: 0.30434782608695654, rowStep: 0.22142857142857142 } }
];

async function stationCenters(targetId) {
  const contract = JSON.parse(await readFile(path.join(docs, `backend/target_execution_contracts/contracts/${targetId}_target_scoring_v1.json`), "utf8"));
  return contract.components.geometry.definition.regions
    .filter(region => /_crosshair$/.test(region.regionId))
    .map(region => [Number(region.cx), Number(region.cy)]);
}

async function faceStationRects(variant) {
  const svg = await readFile(path.join(docs, variant.asset), "utf8");
  const viewBox = svg.match(/viewBox="0 0 ([\d.]+) ([\d.]+)"/);
  const station = svg.match(/<g id="station"[\s\S]*?<rect width="([\d.]+)" height="([\d.]+)"/);
  const stationGroup = svg.match(/<g aria-label="Stations">([\s\S]*?)<\/g>/);
  assert.ok(viewBox && station && stationGroup, `${variant.name} face geometry is readable`);
  const [, viewWidth, viewHeight] = viewBox;
  const [, stationWidth, stationHeight] = station;
  return [...stationGroup[1].matchAll(/<use href="#station" x="([\d.]+)" y="([\d.]+)"/g)].map((match, index) => ({
    station: index + 1,
    left: Number(match[1]) / Number(viewWidth),
    top: Number(match[2]) / Number(viewHeight),
    width: Number(stationWidth) / Number(viewWidth),
    height: Number(stationHeight) / Number(viewHeight)
  }));
}

async function assertActiveBorderMatchesFace(page, variant, station) {
  const expected = (await faceStationRects(variant)).find(rect => rect.station === station);
  const active = await page.evaluate(() => {
    const nodes = Array.from(document.querySelectorAll("[data-tst12-station-border]"));
    const activeBorder = document.querySelector("[data-tst12-station-border].is-active");
    return {
      count: nodes.length,
      activeCount: nodes.filter(node => node.classList.contains("is-active")).length,
      legacyOverlays: document.querySelectorAll(".tst12-station-highlight, #tst12CourseOverlay").length,
      active: activeBorder && { station: activeBorder.closest("[data-tst12-station]")?.dataset.tst12Station, tag: activeBorder.tagName }
    };
  });
  assert.equal(active.count, 12, `${variant.name} exposes the twelve existing SVG station borders`);
  assert.equal(active.activeCount, 1, `${variant.name} colors one active station border only`);
  assert.equal(active.legacyOverlays, 0, `${variant.name} has no cyan station overlay`);
  assert.equal(active.active?.tag, "rect", `${variant.name} active indicator is the existing SVG square border`);
  assert.equal(active.active?.station, `station_${String(station).padStart(2, "0")}_square`, `${variant.name} active station border matches round progress`);
  assert.ok(expected.width > 0 && expected.height > 0, `${variant.name} station ${station} uses approved face geometry`);
}

async function assertInactiveBorders(page, variant) {
  const state = await page.evaluate(() => ({
    count: document.querySelectorAll("[data-tst12-station-border]").length,
    active: document.querySelectorAll("[data-tst12-station-border].is-active").length
  }));
  assert.equal(state.count, 12, `${variant.name} exposes the twelve existing SVG station borders`);
  assert.equal(state.active, 0, `${variant.name} starts with every station border black`);
}

async function exercise(page, variant, mode) {
  page.setDefaultTimeout(60000);
  let sessionStartRequests = 0;
  const countSessionStarts = request => {
    if (request.method() === "POST" && new URL(request.url()).pathname === "/api/session/start") sessionStartRequests += 1;
  };
  page.on("request", countSessionStarts);
  const query = new URLSearchParams({ target: variant.id, missionFamily: "targetScoring", experienceMode: mode, authorityPort, v: "tst12-universal-shooter-1" });
  if (mode === "simulation") query.set("source", "registered");
  await Promise.all([
    page.waitForResponse(response => new URL(response.url()).pathname === "/api/session/prepare" && response.request().method() === "POST"),
    page.goto(`${origin}/target-experience.html?${query}`, { waitUntil: "domcontentloaded" })
  ]);

  assert.equal(await page.locator("body").getAttribute("data-tst12-mode"), mode);
  assert.equal(await page.locator("#tst12Instructions li").count(), 7, "seven Founder-approved target instructions are available to READ and HEAR");
  assert.equal(await page.getByRole("link", { name: "ACTUAL ROUND", exact: true }).count(), mode === "actual" ? 1 : 0, "public Simulator navigation does not expose unaccepted Actual Round");
  assert.equal(await page.locator("#tst12HearInstructions").isVisible(), true);
  await page.locator("#tst12HearInstructions").click();
  await page.locator("#tst12NarrationToggle").waitFor({ state: "visible" });
  assert.equal(await page.locator("#tst12NarrationToggle").textContent(), "Pause");
  await page.locator("#tst12NarrationToggle").click();
  assert.equal(await page.locator("#tst12NarrationToggle").textContent(), "Resume");
  await page.locator("#tst12NarrationToggle").click();
  await page.locator("#tst12NarrationStop").click();
  assert.equal(await page.locator("#tst12HearInstructions").isVisible(), true);

  if (mode === "actual") {
    await page.locator("#contractCapture").waitFor({ state: "visible" });
    assert.equal((await page.locator('label[for="contractFile"]').textContent()).trim(), "TAKE PHOTO / CHOOSE EXISTING PHOTO");
    await page.locator("#contractFile").setInputFiles(path.join(docs, variant.actualAsset));
  }
  await page.locator("#contractWorkspace").waitFor({ state: "visible" });
  await page.waitForFunction(() => document.querySelector("#contractTargetImage")?.complete && document.querySelector("#contractTargetImage")?.naturalWidth > 0);
  assert.equal(sessionStartRequests, 0, `${variant.name} ${mode} opening and loading target evidence creates no durable session`);
  const surface = page.locator("#contractTapSurface");
  const box = await surface.boundingBox();
  assert.ok(box && box.width > 200 && box.height > 300, `${variant.name} target surface unavailable`);
  await surface.click({ position: { x: box.width / 2, y: box.height / 2 } });
  assert.equal(sessionStartRequests, 0, `${variant.name} ${mode} invalid pre-setup tap creates no durable session`);
  await page.locator("#contractActualDistance").fill("25");
  await page.locator("#contractScoringCaliber").selectOption(".22 LR");
  assert.equal(sessionStartRequests, 0, `${variant.name} ${mode} setup fields create no durable session`);
  await surface.click({ position: { x: box.width / 2, y: box.height / 2 } });
  assert.equal(sessionStartRequests, 0, `${variant.name} ${mode} valid coordinates without a station create no durable session`);
  if (mode === "simulation") {
    assert.equal(await page.locator('label:has(#contractActualDistance)').isVisible(), true);
    assert.match(await page.locator("#contractTargetImage").getAttribute("src"), new RegExp(variant.asset.replace(".", "\\.")));
    assert.equal(await page.locator(".tst12-station-highlight").count(), 0, "the cyan station overlay is absent");
  }

  if (mode === "simulation") {
    await page.locator("#contractPrecisionTapViewport").screenshot({ path: path.join(evidenceDir, `${variant.id}_live_face.png`) });
  }
  if (mode === "simulation") await assertInactiveBorders(page, variant);
  assert.equal(await page.locator("#contractScoringModePanel .tst12-round-controls").count(), 1);
  const centers = await stationCenters(variant.id);
  await page.locator("#tst12ReadToggle").click();
  assert.equal(await page.locator("#tst12ReadInstructions").isVisible(), true, "READ opens the instruction panel before shooting");
  for (let station = 0; station < centers.length; station += 1) {
      const stationRegionId = `station_${String(station + 1).padStart(2, "0")}_square`;
      await page.locator(`text[data-tst12-station-selector="${stationRegionId}"]`).click({ force: true });
      if (station === 0) assert.equal(sessionStartRequests, 0, `${variant.name} ${mode} station selection creates no durable session`);
      if (mode === "simulation") await assertActiveBorderMatchesFace(page, variant, station + 1);
      const [x, y] = centers[station];
      for (let shot = 0; shot < 5; shot += 1) {
        if (station === 0 && shot === 0) {
          const [startResponse] = await Promise.all([
            page.waitForResponse(response => new URL(response.url()).pathname === "/api/session/start" && response.request().method() === "POST"),
            surface.click({ position: { x: box.width * x, y: box.height * y } })
          ]);
          assert.equal(startResponse.status(), 201, `${variant.name} ${mode} first valid observation creates the durable session`);
        } else {
          await surface.click({ position: { x: box.width * x, y: box.height * y } });
        }
        if (station === 0 && shot === 0) {
          assert.equal(sessionStartRequests, 1, `${variant.name} ${mode} first valid observation creates exactly one durable session`);
          assert.equal(await page.locator("#tst12ReadInstructions").isVisible(), false, "the first valid tap closes the open READ panel");
          assert.equal(await page.locator("#tst12ReadToggle").getAttribute("aria-expanded"), "false", "READ reports the closed state after the first valid tap");
          if (mode === "simulation" && variant.id === "baker_tst12_17_5x23") {
            await page.screenshot({ path: path.join(evidenceDir, "phase1_read_autoclosed_desktop.png"), fullPage: true });
          }
          await page.locator("#tst12ReadToggle").click();
          assert.equal(await page.locator("#tst12ReadInstructions").isVisible(), true, "the shooter can reopen READ after recording begins");
        }
      }
  }
  assert.equal(await page.locator(".contract-observation-marker").count(), 60);
  assert.equal(sessionStartRequests, 1, `${variant.name} ${mode} subsequent observations reuse the first durable session`);
  assert.equal((await page.locator("#contractShowResult").textContent()).trim(), "SHOW RESULTS");
  assert.equal(await page.locator(".contract-observation-marker[data-shot-index='60']").count(), 1);
  await page.locator("#contractShowResult").click();
  await page.locator("#contractSecView").waitFor({ state: "visible" });
  const secText = await page.locator("#contractSecRoot").textContent();
  assert.match(secText, /TOTAL POINTS/);
  assert.match(secText, /Crosshair/);
  assert.match(secText, /Ring 1/);
  assert.match(secText, /Red circle/);
  assert.match(secText, /Crosshairs/);
  assert.doesNotMatch(await page.locator('details[data-sec-region="session"]').innerText(), /Standard Setup/, "the current Actual Round Session does not inherit setup text from prior History cards");
  assert.equal(await page.locator("[data-tst12-scoring-distribution='true']").count(), 0, `${variant.name} removes the duplicate flat scoring distribution`);
  await page.locator("details[data-sec-region='session'] > summary").click();
  assert.equal(await page.locator(".tst12-session-details").getAttribute("open"), null, "Session Details starts collapsed");
  assert.equal(await page.locator(".tst12-station-performance").getAttribute("open"), null, "Station Results starts collapsed");
  await page.locator(".tst12-session-details > summary").click();
  assert.match(await page.locator(".tst12-session-details").innerText(), /Session Details/);
  assert.doesNotMatch(await page.locator(".tst12-session-details").innerText(), /Standard Setup/);
  await page.locator(".tst12-station-performance > summary").click();
  assert.equal(await page.locator(".tst12-session-details").getAttribute("open"), null, "opening Station Results collapses Session Details");
  assert.equal(await page.locator(".tst12-station-performance").getAttribute("open"), "", "Station Results expands independently");
  assert.equal(await page.locator(".tst12-station-performance .tst12-station-card").count(), 12, "all stations remain present in results");
  await page.locator("details[data-sec-region='target'] > summary").click();
  await page.locator("#contractSecRoot").screenshot({ path: path.join(evidenceDir, `${variant.id}_${mode}_result_summary.png`) });
  assert.equal(await page.locator("#contractSecRoot .contract-shooter-experience").count(), 0);
  if (mode === "simulation") {
    assert.match(secText, /SessionSimulator/, "the result identifies the encounter as simulated");
    assert.equal(await page.locator(".tst12-station-performance").count(), 1);
    assert.equal(await page.locator("[data-sczn3-simulator-reentry]").count(), 1, "Simulator Result exposes universal fresh-run control");
    const beforeImage = page.locator("#contractSecRoot .contract-lifecycle-before img[data-tst12-clean-before='true']");
    assert.equal(await beforeImage.count(), 1);
    assert.match(await beforeImage.getAttribute("src"), new RegExp(variant.asset.replace(".", "\\.") + "$"));
    await page.locator("#contractSecRoot .contract-lifecycle-before").screenshot({ path: path.join(evidenceDir, `${variant.id}_result_before.png`) });
    assert.equal(await page.locator("#contractSecRoot .contract-lifecycle-before .contract-evidence-marker-layer").count(), 1, "the saved target retains its observation projection layer");
    assert.equal(await page.locator("#contractSecRoot .contract-lifecycle-before .contract-observation-marker").count(), 60, "all Simulator impacts remain visible on the Result target");
    assert.equal(await page.locator('#contractSecRoot [data-sczn3-action="save"], #contractSecRoot #saveSEC').count(), 1, "Simulator encounters can be preserved through existing SEC authority");
    await page.locator("[data-sczn3-simulator-reentry]").click();
    const leaveDialog = page.locator(".navigation-leave-dialog");
    await leaveDialog.waitFor({ state: "visible" });
    assert.match(await leaveDialog.innerText(), /Leave Current Session\?/, "unsaved Simulator re-entry retains the departure warning");
    await leaveDialog.getByRole("button", { name: "Stay Here", exact: true }).click();
    assert.match(page.url(), /experienceMode=simulation/, "dismissing the warning preserves the current encounter");
  }

  const [saveResponse] = await Promise.all([
    page.waitForResponse(response => response.url().includes("/api/session/sec") && response.request().method() === "POST"),
    page.getByRole("button", { name: "Save SEC", exact: true }).click()
  ]);
  assert.equal(saveResponse.status(), 201);
  const saved = await saveResponse.json();
  const authoritativeScore = Number(saved.session?.authorityPackage?.scoring?.total);
  assert.ok(Number.isFinite(authoritativeScore), "saved SEC retains the authoritative score");
  assert.match(String(saved.reopenCapability || ""), /^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/, "save returns the signed exact-reopen capability");
  const vaultLink = page.locator("#contractSecRoot").getByRole("link", { name: "Ballistic Vault", exact: true });
  await vaultLink.waitFor();
  assert.match(String(await vaultLink.getAttribute("href") || ""), /#secReopenCapability=/, "Vault link carries the exact session capability in its non-request fragment");
  await vaultLink.click();
  await page.getByRole("heading", { name: "BALLISTIC VAULT", exact: true }).waitFor();
  assert.match(page.url(), /#secReopenCapability=/, "Vault navigation preserves the signed capability fragment");
  assert.ok(await page.evaluate(sessionId => window.SCZN3SECReopenAuthority?.fragmentCapability(sessionId), saved.session.sessionId), "Vault activates the signed capability for the exact saved session");
  const record = page.locator(`article.vault-record-summary[data-session-id="${saved.session.sessionId}"]`);
  await record.waitFor();
  assert.match(await record.innerText(), new RegExp(`TOTAL POINTS\\s*${authoritativeScore}`), "Vault displays the same authoritative score");
  await record.locator("a.vault-record-link").click();
  await page.locator("#contractSecView").waitFor({ state: "visible" });
  assert.match(page.url(), new RegExp(`session=${saved.session.sessionId}`), "exact reopen returns to the same preserved session identity");
  const reopened = await page.locator("#contractSecRoot").innerText();
  assert.match(reopened, new RegExp(`TOTAL POINTS\\s*${authoritativeScore}`), "exact reopen displays the same authoritative score");
  if (mode === "simulation") {
    await page.locator("[data-sczn3-simulator-reentry]").click();
    await page.locator("#contractWorkspace").waitFor({ state: "visible" });
    assert.doesNotMatch(page.url(), /[?&]session=/, "fresh Simulator routing removes the preserved session identity");
    assert.equal(await page.locator(".contract-observation-marker").count(), 0, "fresh Simulator starts with zero taps");
    assert.equal(await page.locator("#contractMarkers").getAttribute("data-active-station-region"), null, "fresh Simulator starts with no selected station");
  }
  assert.equal(sessionStartRequests, 1, `${variant.name} ${mode} result, SEC, Vault, and exact reopen do not create a replacement session`);
  page.off("request", countSessionStarts);
  return saved.session.sessionId;
}

async function assertAbandonedVisitCreatesNoSession(context, variant, mode) {
  const page = await context.newPage();
  let starts = 0;
  page.on("request", request => {
    if (request.method() === "POST" && new URL(request.url()).pathname === "/api/session/start") starts += 1;
  });
  const query = new URLSearchParams({ target: variant.id, missionFamily: "targetScoring", experienceMode: mode, authorityPort, v: "deferred-session-zero-tap-1" });
  if (mode === "simulation") query.set("source", "registered");
  await page.goto(`${origin}/target-experience.html?${query}`, { waitUntil: "domcontentloaded" });
  await page.locator("#contractStatus").waitFor({ state: "attached" });
  await page.locator("#tst12ReadToggle").click();
  await page.locator("#tst12HearInstructions").click();
  await page.locator("#tst12NarrationStop").click();
  await Promise.all([
    page.waitForResponse(response => new URL(response.url()).pathname === "/api/session/prepare" && response.request().method() === "POST"),
    page.reload({ waitUntil: "domcontentloaded" })
  ]);
  assert.equal(starts, 0, `${variant.name} ${mode} READ, HEAR, refresh, and abandoned zero-tap visit create no durable session`);
  await page.close();
}

const systemChrome = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const browser = await chromium.launch({ headless: true, ...(existsSync(systemChrome) ? { executablePath: systemChrome } : {}) });
try {
  const desktop = await browser.newContext({ viewport: { width: 1180, height: 900 } });
  const desktopPage = await desktop.newPage();
  for (const variant of variants) {
    for (const mode of ["simulation", "actual"]) {
      if (variant.id === "baker_tst12_23x35" && mode === "actual") continue;
      await assertAbandonedVisitCreatesNoSession(desktop, variant, mode);
      const sessionId = await exercise(desktopPage, variant, mode);
      console.log(sessionId
        ? `PASS ${variant.name} ${mode} RESULT -> SEC -> Vault -> exact reopen (${sessionId})`
        : `PASS ${variant.name} ${mode} backend RESULT visible; simulator storage correctly withheld`);
    }
  }
  await desktop.close();

  const printContext = await browser.newContext({ viewport: { width: 1180, height: 900 } });
  for (const variant of variants) {
    const printPage = await printContext.newPage();
    await printPage.setContent(`<img alt="${variant.name} print face" src="${origin}/${variant.asset}" style="display:block;width:720px;height:auto">`);
    const printFace = printPage.getByRole("img", { name: `${variant.name} print face` });
    await printFace.waitFor();
    await printFace.screenshot({ path: path.join(evidenceDir, `${variant.id}_print_face.png`) });
    await printPage.close();
  }
  await printContext.close();

  const mobile = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true });
  for (const variant of variants) {
    for (const mode of ["simulation", "actual"]) {
      if (variant.id === "baker_tst12_23x35" && mode === "actual") continue;
      const page = await mobile.newPage();
      const query = new URLSearchParams({ target: variant.id, missionFamily: "targetScoring", experienceMode: mode, authorityPort, v: "tst12-shooter-magic-1" });
      if (mode === "simulation") query.set("source", "registered");
      await page.goto(`${origin}/target-experience.html?${query}`, { waitUntil: "domcontentloaded" });
      if (mode === "actual") {
        await page.locator("#contractCapture").waitFor({ state: "visible" });
        await page.locator("#contractFile").setInputFiles(path.join(docs, variant.actualAsset));
      }
      await page.locator("#contractWorkspace").waitFor({ state: "visible" });
      await page.locator("#contractActualDistance").fill("25");
      await page.locator("#contractScoringCaliber").selectOption(".22 LR");
      const surface = page.locator("#contractTapSurface");
      const box = await surface.boundingBox();
      const centers = await stationCenters(variant.id);
      await page.locator("#tst12ReadToggle").click();
      assert.equal(await page.locator("#tst12ReadInstructions").isVisible(), true, "mobile READ opens before shooting");
      for (let station = 0; station < 2; station += 1) {
        const stationRegionId = `station_${String(station + 1).padStart(2, "0")}_square`;
        await page.locator(`text[data-tst12-station-selector="${stationRegionId}"]`).click({ force: true });
        const [x, y] = centers[station];
        const shots = station === 0 ? 5 : 2;
        for (let index = 0; index < shots; index += 1) {
          await surface.click({ position: { x: box.width * x, y: box.height * y } });
          if (station === 0 && index === 0) {
            await page.locator("#tst12ReadInstructions").waitFor({ state: "hidden" });
            assert.equal(await page.locator("#tst12ReadInstructions").isVisible(), false, "the first valid mobile tap closes READ");
            if (mode === "simulation" && variant.id === "baker_tst12_17_5x23") {
              await page.screenshot({ path: path.join(evidenceDir, "phase1_read_autoclosed_mobile_390.png"), fullPage: true });
            }
            await page.locator("#tst12ReadToggle").click();
            assert.equal(await page.locator("#tst12ReadInstructions").isVisible(), true, "mobile READ reopens after shooting begins");
          }
        }
      }
      assert.equal(await page.locator("#tst12ReadInstructions").isVisible(), true, "later valid taps do not prevent the shooter from keeping READ open");
      if (mode === "simulation") await assertActiveBorderMatchesFace(page, variant, 2);
      assert.equal(await page.locator("#contractScoringModePanel .tst12-round-controls").count(), 1);
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
      assert.equal(overflow, 0, `${variant.name} ${mode} mobile horizontal overflow`);
      await page.screenshot({ path: path.join(evidenceDir, `${variant.id}_${mode}_iphone_shooter_magic.png`), fullPage: true });
      await page.close();
      console.log(`PASS ${variant.name} ${mode} iPhone 390x844 visual interactions and no horizontal overflow`);
    }
  }
  await mobile.close();
} finally {
  await browser.close();
}
