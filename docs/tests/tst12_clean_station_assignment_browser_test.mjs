import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { createRequire } from "node:module";

const { chromium } = createRequire(import.meta.url)("playwright");
const origin = process.env.SCZN3_TST12_ORIGIN || "http://127.0.0.1:8213";
const chrome = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const stationCenters = [
  [3.25, 3.625], [8.75, 3.625], [14.25, 3.625],
  [3.25, 8.875], [8.75, 8.875], [14.25, 8.875],
  [3.25, 14.125], [8.75, 14.125], [14.25, 14.125],
  [3.25, 19.375], [8.75, 19.375], [14.25, 19.375],
];

const browser = await chromium.launch({ headless: true, ...(existsSync(chrome) ? { executablePath: chrome } : {}) });
try {
  const context = await browser.newContext({ viewport: { width: 1180, height: 900 } });
  const page = await context.newPage();
  const query = new URLSearchParams({
    missionFamily: "targetScoring",
    target: "sczn3_tst12_clean_v1",
    experienceMode: "simulation",
    source: "registered",
    authorityPort: new URL(origin).port,
    v: "tst12-clean-station-assignment-browser-1",
  });
  await page.goto(`${origin}/target-experience.html?${query}`, { waitUntil: "domcontentloaded" });
  await page.getByRole("button", { name: "Select Station 1.", exact: true }).filter({ visible: true }).last().waitFor();
  await page.locator("#contractActualDistance").fill("25");
  await page.locator("#contractScoringCaliber").selectOption({ label: ".22 LR · 0.223 in" });

  for (let index = 0; index < 12; index += 1) {
    const station = index + 1;
    const stationId = `station_${String(station).padStart(2, "0")}_square`;
    const selector = page.getByRole("button", { name: `Select Station ${station}.`, exact: true }).filter({ visible: true }).last();
    assert.ok(await selector.boundingBox(), `Station ${station} selector is visible`);
    await selector.click();

    assert.equal(await page.locator(`[data-tst12-station="${stationId}"] [data-tst12-station-border].is-active`).count(), 1, `Station ${station} is active after its physical number-box click`);
    assert.equal(await page.locator("#contractMarkers .contract-observation-marker").count(), index, `Station ${station} selection records zero shots and preserves prior markers`);

    const imageBox = await page.locator("#contractTargetImage").boundingBox();
    assert.ok(imageBox);
    const [xInches, yInches] = stationCenters[index];
    await page.mouse.click(imageBox.x + xInches / 17.5 * imageBox.width, imageBox.y + yInches / 23 * imageBox.height);

    assert.equal(await page.locator("#contractMarkers .contract-observation-marker").count(), station, `Station ${station} crosshair adds exactly one visible marker`);
    assert.equal(await page.locator("#contractMarkers .contract-observation-marker").last().getAttribute("data-assigned-station-region"), stationId, `Station ${station} owns its recorded observation`);
  }

  console.log("PASS Clean TST-12 17.5x23 real number-box station assignment");
  await context.close();
} finally {
  await browser.close();
}
