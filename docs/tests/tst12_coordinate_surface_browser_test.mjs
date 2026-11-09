import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";

const { chromium } = createRequire(import.meta.url)("playwright");
const docs = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const origin = process.env.SCZN3_TST12_ORIGIN || "http://127.0.0.1:8213";
const authorityPort = process.env.SCZN3_TST12_AUTHORITY_PORT || new URL(origin).port;
const chrome = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const variants = [
  { id: "baker_tst12_17_5x23", label: "17.5x23", asset: "assets/TST12_PRINT_17.5X23_V1.svg" },
  { id: "baker_tst12_23x35", label: "23x35", asset: "assets/TST12_PRINT_23X35_V1.svg" },
];

async function load(page, variant, mode) {
  const query = new URLSearchParams({
    missionFamily: "targetScoring",
    target: variant.id,
    source: "registered",
    experienceMode: mode,
    authorityPort,
    v: "sczn3-universal-ppt-20261105-1",
  });
  await page.goto(`${origin}/target-experience.html?${query}`, { waitUntil: "domcontentloaded" });
  await page.locator("#contractScoringCaliber").selectOption({ index: 1 });
  await page.locator("#contractActualDistance").fill("44");
  if (mode === "actual") {
    const capture = page.locator("#contractCapture");
    if (await capture.isVisible()) await page.locator("#contractFile").setInputFiles(path.join(docs, variant.asset));
  }
  await page.locator('[data-observation-coordinate-surface="true"]').waitFor();
}

async function clickStationEdge(page, index) {
  const selector = page.locator(".tst12-digital-target-face text[data-tst12-station-selector]").nth(index);
  await selector.click();
  await clickVisibleStationEdge(page, index);
}

async function clickVisibleStationEdge(page, index) {
  const border = page.locator(`[data-tst12-station="station_${String(index + 1).padStart(2, "0")}_square"] [data-tst12-station-border]`);
  const box = await border.boundingBox();
  assert.ok(box && box.width > 0 && box.height > 0);
  const column = index % 3;
  const x = column === 0 ? box.x + box.width - 2 : column === 2 ? box.x + 2 : box.x + box.width / 2;
  const y = box.y + box.height / 2;
  await page.mouse.click(x, y);
  const marker = page.locator("#contractMarkers .precision-tap-marker").last();
  const markerBox = await marker.boundingBox();
  assert.ok(markerBox, `${index + 1}: marker was not rendered`);
  assert.ok(Math.abs(markerBox.x + markerBox.width / 2 - x) <= 1, `${index + 1}: marker x drifted from the clicked target coordinate`);
  assert.ok(Math.abs(markerBox.y + markerBox.height / 2 - y) <= 1, `${index + 1}: marker y drifted from the clicked target coordinate`);
}

async function exercise(page, variant, mode, zoom = false) {
  await load(page, variant, mode);
  for (let index = 0; index < 12; index += 1) await clickStationEdge(page, index);
  assert.equal(await page.locator(".precision-tap-marker").count(), 12, `${variant.label}: all station taps recorded`);

  const stationTwo = await page.locator('[data-tst12-station="station_02_square"] [data-tst12-station-border]').boundingBox();
  assert.ok(stationTwo);
  await page.mouse.click(stationTwo.x + stationTwo.width / 2, stationTwo.y + stationTwo.height / 2);

  if (zoom) {
    await page.locator(".tst12-digital-target-face text[data-tst12-station-selector]").nth(4).click();
    const viewport = await page.locator("#contractPrecisionTapViewport").boundingBox();
    assert.ok(viewport);
    await page.mouse.move(viewport.x + viewport.width / 2, viewport.y + viewport.height / 2);
    await page.keyboard.down("Control");
    await page.mouse.wheel(0, -600);
    await page.keyboard.up("Control");
    assert.ok(Number(await page.locator("#contractPrecisionTapViewport").getAttribute("data-precision-tap-scale")) > 1, `${variant.label}: precision zoom engaged`);
    await clickVisibleStationEdge(page, 4);
  }
  await page.getByRole("button", { name: "Show TST-12 results" }).click();
  await page.locator("#contractSecView").waitFor({ state: "visible" });
  const resultRoot = page.locator("#contractSecRoot");
  const result = await resultRoot.innerText();
  assert.match(result, /Target Score/i);
  const session = resultRoot.locator('details[data-sec-region="session"]');
  assert.equal(await session.getAttribute("open"), null, "SESSION remains collapsed until the shooter opens it");
  await session.locator(":scope > summary").click();
  const stationResults = session.locator(".tst12-station-performance");
  assert.equal(await stationResults.getAttribute("open"), null, "Station Results remains collapsed until the shooter opens it");
  await stationResults.locator(":scope > summary").click();
  const stationText = await stationResults.innerText();
  assert.match(stationText, /TOTAL STATION RESULTS/);
  const aggregate = Object.fromEntries(await stationResults.locator(".tst12-session-accounting > div").evaluateAll(rows => rows.map(row => [row.querySelector("span")?.textContent?.trim(), row.querySelector("strong")?.textContent?.trim()])));
  assert.equal(aggregate["TOTAL TAPS"], zoom ? "14" : "13");
  assert.equal(aggregate.HITS, zoom ? "13" : "12");
  assert.equal(aggregate.MISSES, "1");
  assert.equal(await stationResults.locator(".tst12-station-card").count(), 12, `${variant.label} ${mode}: all attempted stations render in Station Results`);
  assert.equal(await page.locator("#contractSecRoot .contract-observation-marker").count(), zoom ? 14 : 13, `${variant.label} ${mode}: every recorded observation remains projected in Results`);
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth), 0, `${variant.label}: no page overflow`);
}

const browser = await chromium.launch({ headless: true, ...(existsSync(chrome) ? { executablePath: chrome } : {}) });
try {
  for (const viewport of [{ width: 1180, height: 900 }, { width: 390, height: 844 }]) {
    const context = await browser.newContext({ viewport, deviceScaleFactor: viewport.width === 390 ? 3 : 1, hasTouch: viewport.width === 390, isMobile: viewport.width === 390 });
    for (const variant of variants) {
      for (const mode of ["simulation", "actual"]) {
        const page = await context.newPage();
        await exercise(page, variant, mode, viewport.width === 1180);
        console.log(`PASS ${variant.label} ${mode} ${viewport.width}px live edge taps${viewport.width === 1180 ? " + zoom" : ""}`);
        await page.close();
      }
    }
    await context.close();
  }
} finally {
  await browser.close();
}
