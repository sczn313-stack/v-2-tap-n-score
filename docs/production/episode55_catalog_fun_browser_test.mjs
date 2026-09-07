import assert from "node:assert/strict";
import { createRequire } from "node:module";

const { chromium } = createRequire(import.meta.url)("playwright");
const base = process.env.SCZN3_TEST_BASE_URL || "http://127.0.0.1:8096";
const browser = await chromium.launch({ headless: true, executablePath: process.env.SCZN3_CHROME_EXECUTABLE || undefined });

async function clickCanonical(page, points, width, height) {
  const surface = page.locator("#tapSurface");
  const box = await surface.boundingBox();
  assert(box && box.width > 0 && box.height > 0, "target surface is visible");
  for (const [x, y] of points) {
    const before = Number(await page.locator("#eventCount").textContent());
    await surface.click({ position: { x: x / (width - 1) * box.width, y: y / (height - 1) * box.height } });
    await page.waitForFunction(expected => Number(document.getElementById("eventCount")?.textContent) === expected, before + 1);
  }
}

async function preserveAndReopen(page, expectedText) {
  await page.getByRole("button", { name: "Show Results" }).click();
  await page.locator("[data-sec-shell='universal-v1']").waitFor();
  assert.match(await page.locator("[data-sec-shell='universal-v1']").innerText(), expectedText);
  await page.getByRole("button", { name: "Save SEC" }).click();
  await page.getByText("SEC saved to Ballistic Vault.").waitFor();
  const recordId = await page.locator("[data-sec-shell='universal-v1']").getAttribute("data-sec-record-id");
  await page.getByRole("link", { name: "Ballistic Vault" }).click();
  await page.waitForTimeout(750);
  const openLinks = page.locator(`a[href*="${encodeURIComponent(recordId)}"]`).filter({ hasText: /OPEN SEC/i });
  if (!await openLinks.count()) {
    console.log("Vault diagnostic:", (await page.locator("body").innerText()).slice(-1200));
    await page.goto(`${base}/records.html?session=${encodeURIComponent(recordId)}&view=sec&v=episode55-catalog-fun`);
  } else {
    await openLinks.last().click();
  }
  await page.locator("[data-sec-shell='universal-v1']").waitFor();
  assert.match(await page.locator("[data-sec-shell='universal-v1']").innerText(), expectedText);
}

try {
  for (const viewport of [{ width: 1440, height: 900 }, { width: 390, height: 844 }]) {
    const context = await browser.newContext({ viewport });

    const dartboard = await context.newPage();
    await dartboard.goto(`${base}/t/baker/fun/?target=gf-db&founderReview=1&v=episode55-catalog-fun`, { waitUntil: "domcontentloaded" });
    await dartboard.locator("#targetWorkspace:not([hidden])").waitFor();
    await clickCanonical(dartboard, Array.from({ length: 20 }, () => [572.5, 638.5]), 1141, 1500);
    await preserveAndReopen(dartboard, /Tie Game/i);

    const bowling = await context.newPage();
    await bowling.goto(`${base}/t/baker/fun/?target=gf-bp&founderReview=1&v=episode55-catalog-fun`, { waitUntil: "domcontentloaded" });
    await bowling.locator("#targetWorkspace:not([hidden])").waitFor();
    await clickCanonical(bowling, [[135,590],[430,590],[730,585],[1015,595],[255,765],[580,770],[895,765],[390,985],[745,990],[570,1165]], 1141, 1500);
    await preserveAndReopen(bowling, /All Pins Hit/i);

    const dot = await context.newPage();
    await dot.goto(`${base}/t/baker/fun/?target=dot-torture&founderReview=1&v=episode55-catalog-fun`, { waitUntil: "domcontentloaded" });
    await dot.locator("#targetWorkspace:not([hidden])").waitFor();
    const dotCenters = {1:[500,190],2:[310,395],3:[500,395],4:[690,395],5:[310,605],6:[500,605],7:[690,605],8:[310,810],9:[500,810],10:[690,810]};
    const dotSequence = [1,1,1,1,1,2,2,2,2,2,3,4,3,4,3,4,3,4,5,5,5,5,5,6,6,7,7,6,6,7,7,6,6,7,7,6,6,7,7,8,8,8,8,8,9,10,9,10,9,10];
    await clickCanonical(dot, dotSequence.map(number => dotCenters[number]), 1000, 1000);
    await preserveAndReopen(dot, /50 \/ 50/);

    const billiard = await context.newPage();
    await billiard.goto(`${base}/t/baker/fun/?target=gf-bb&founderReview=1&v=episode55-catalog-fun`, { waitUntil: "domcontentloaded" });
    await billiard.locator("#targetWorkspace:not([hidden])").waitFor();
    const billiardCenters = {1:[560,1220],2:[360,485],3:[660,1030],4:[660,665],5:[760,485],6:[360,845],7:[165,485],8:[560,845],9:[860,665],10:[560,485],11:[460,1030],12:[960,485],13:[265,665],14:[760,845],15:[460,665]};
    await clickCanonical(billiard, Array.from({length:15}, (_, index) => billiardCenters[index + 1]), 1141, 1500);
    await preserveAndReopen(billiard, /Sequence Complete/i);

    const battleship = await context.newPage();
    await battleship.goto(`${base}/t/baker/fun/?target=gf-battleship&founderReview=1&v=episode55-catalog-fun`, { waitUntil: "domcontentloaded" });
    await battleship.locator("#targetWorkspace:not([hidden])").waitFor();
    const battleCells = ["r1c8", "r2c8", "r3c8", "r4c8", "r5c8", "r6c8", "r2c3", "r2c4", "r3c2", "r4c2", "r5c2", "r6c2", "r8c7", "r8c8", "r8c9", "r9c1", "r9c2", "r9c3", "r9c4"];
    for (let index = 0; index < battleCells.length; index += 1) {
      const match = /^r(\d+)c(\d+)$/.exec(battleCells[index]);
      const point = [96 + (Number(match[2]) - 0.5) * 24, 305 + (Number(match[1]) - 0.5) * 24];
      await clickCanonical(battleship, [point], 432, 568);
      if (index < battleCells.length - 1) {
        const before = Number(await battleship.locator("#eventCount").textContent());
        await battleship.getByRole("button", { name: "Record Miss" }).click();
        await battleship.waitForFunction(expected => Number(document.getElementById("eventCount")?.textContent) === expected, before + 1);
      }
    }
    await preserveAndReopen(battleship, /Fleet Winner/i);

    const catalog = await context.newPage();
    await catalog.goto(`${base}/index.html?v=episode55-catalog-fun`, { waitUntil: "domcontentloaded" });
    assert.equal(await catalog.locator('[data-experience-id="st-001-universal-bullseye"]').count(), 0, "ST-001 is removed from the current batch");
    assert.equal(await catalog.locator('[data-experience-id="baker-battleship"][data-status="available"]').count(), 1, "Baker Battleship replaces ST-001");

    for (const page of [dartboard, bowling, dot, billiard, battleship, catalog]) {
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
      assert.ok(overflow <= 1, `no horizontal overflow at ${viewport.width}px`);
    }
    await context.close();
    console.log(`PASS Episode 55 catalog Fun lifecycle at ${viewport.width}px`);
  }
} finally {
  await browser.close();
}
