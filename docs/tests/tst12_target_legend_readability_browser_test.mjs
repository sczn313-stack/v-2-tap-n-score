import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { createRequire } from "node:module";

const { chromium } = createRequire(import.meta.url)("playwright");
const origin = process.env.SCZN3_TST12_ORIGIN || "http://127.0.0.1:8244";
const chrome = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const variants = [
  { id: "baker_tst12_17_5x23", label: "17.5x23" },
  { id: "baker_tst12_23x35", label: "23x35" },
];
const eyeLabels = ["BOTH", "RE", "LE"];
const handLabels = ["RHS", "LHO", "RHO", "LHS"];

async function verify(page, variant, mode, viewportWidth) {
  const query = new URLSearchParams({
    missionFamily: "targetScoring",
    target: variant.id,
    source: "registered",
    experienceMode: mode,
    authorityPort: new URL(origin).port,
    v: "tst12-legends-20261104-1",
  });
  await page.goto(`${origin}/target-experience.html?${query}`, { waitUntil: "domcontentloaded" });
  const svg = page.locator('.tst12-digital-target-face svg');
  await svg.waitFor();
  const svgBox = await svg.boundingBox();
  assert.ok(svgBox, `${variant.label}: target face rendered`);
  const eyes = svg.locator('g[aria-label="Eye instruction by station column"] text');
  const hands = svg.locator('g[aria-label="Hand instruction by station row"] text');
  const footer = svg.locator('g[aria-label="Target abbreviation legend"] text');
  if (mode === "actual") await page.locator('.tst12-digital-target-face.is-actual-overlay').waitFor({ state: "visible" });
  await eyes.first().waitFor({ state: "visible" });
  await hands.first().waitFor({ state: "visible" });
  assert.deepEqual(await eyes.allTextContents(), eyeLabels, `${variant.label}: eye instructions remain correct`);
  assert.deepEqual(await hands.allTextContents(), handLabels, `${variant.label}: hand instructions remain correct`);
  assert.deepEqual(await footer.allTextContents(), [
    "BOTH = Both Eyes   |   RE = Right Eye   |   LE = Left Eye",
    "RHS = Right-Hand Supported   |   LHO = Left-Hand Only",
    "RHO = Right-Hand Only   |   LHS = Left-Hand Supported",
  ], `${variant.label}: original full-definition footer remains unchanged`);
  assert.deepEqual(await footer.evaluateAll(nodes => nodes.map(node => node.getAttribute("font-size"))), variant.label === "17.5x23"
    ? ["0.125", "0.105", "0.105"]
    : ["0.2", "0.17", "0.17"], `${variant.label}: original footer sizing remains unchanged`);
  assert.equal(await svg.locator('[data-tst12-station-border]').count(), 12, `${variant.label}: all station geometry remains rendered`);

  const minimumGlyphThickness = viewportWidth <= 390 ? 3 : 5;
  for (let index = 0; index < eyeLabels.length; index += 1) {
    const labelBox = await eyes.nth(index).boundingBox();
    const stationBox = await svg.locator('[data-tst12-station-border]').nth(index).boundingBox();
    assert.ok(labelBox && stationBox, `${variant.label}: ${eyeLabels[index]} rendered`);
    assert.ok(labelBox.height >= minimumGlyphThickness, `${variant.label}: ${eyeLabels[index]} has readable rendered size`);
    assert.ok(labelBox.x >= svgBox.x - 0.5 && labelBox.x + labelBox.width <= svgBox.x + svgBox.width + 0.5, `${variant.label}: ${eyeLabels[index]} is not clipped`);
    assert.ok(labelBox.y + labelBox.height <= stationBox.y + 0.5, `${variant.label}: ${eyeLabels[index]} does not cover scoring geometry (${labelBox.y + labelBox.height} <= ${stationBox.y})`);
    assert.ok(Math.abs(labelBox.x + labelBox.width / 2 - (stationBox.x + stationBox.width / 2)) <= 2, `${variant.label}: ${eyeLabels[index]} remains aligned to its station column`);
  }
  for (let index = 0; index < handLabels.length; index += 1) {
    const labelBox = await hands.nth(index).boundingBox();
    const stationBox = await svg.locator('[data-tst12-station-border]').nth(index * 3).boundingBox();
    assert.ok(labelBox && stationBox, `${variant.label}: ${handLabels[index]} rendered`);
    assert.ok(labelBox.width >= minimumGlyphThickness, `${variant.label}: ${handLabels[index]} has readable rendered size`);
    assert.ok(labelBox.y >= svgBox.y - 0.5 && labelBox.y + labelBox.height <= svgBox.y + svgBox.height + 0.5, `${variant.label}: ${handLabels[index]} is not clipped`);
    assert.ok(labelBox.x + labelBox.width <= stationBox.x + 0.5, `${variant.label}: ${handLabels[index]} does not cover scoring geometry (${labelBox.x + labelBox.width} <= ${stationBox.x})`);
    assert.ok(Math.abs(labelBox.y + labelBox.height / 2 - (stationBox.y + stationBox.height / 2)) <= 2, `${variant.label}: ${handLabels[index]} remains aligned to its station row`);
  }
  assert.ok(await page.getByText("1", { exact: true }).first().isVisible(), `${variant.label}: station numbers remain visible`);
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth), 0, `${variant.label}: ${viewportWidth}px page has no horizontal clipping`);
}

const browser = await chromium.launch({ headless: true, ...(existsSync(chrome) ? { executablePath: chrome } : {}) });
try {
  for (const viewport of [{ width: 1180, height: 900 }, { width: 390, height: 844 }, { width: 320, height: 760 }]) {
    const context = await browser.newContext({
      viewport,
      deviceScaleFactor: viewport.width <= 390 ? 3 : 1,
      hasTouch: viewport.width <= 390,
      isMobile: viewport.width <= 390,
    });
    for (const variant of variants) {
      for (const mode of ["simulation", "actual"]) {
        const page = await context.newPage();
        await verify(page, variant, mode, viewport.width);
        console.log(`PASS ${variant.label} ${mode} ${viewport.width}px target legends`);
        await page.close();
      }
    }
    await context.close();
  }
} finally {
  await browser.close();
}
