import assert from "node:assert/strict";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { chromium } = require("playwright");
const baseUrl = process.env.SCZN3_TEST_BASE_URL || "http://127.0.0.1:8101";

const families = [
  "baker-sl-st1",
  "m4",
  "gssf-training",
  "universal-practice-historical"
];

function assertCompactClosedBar(height, label) {
  assert.ok(height >= 33 && height <= 35, `${label} must use the governed 34px closed-state bar; received ${height}px`);
}

const browser = await chromium.launch({
  headless: true,
  executablePath: process.env.SCZN3_CHROME_EXECUTABLE || undefined,
  ignoreDefaultArgs: ["--disable-back-forward-cache"],
  args: ["--enable-features=BackForwardCache"]
});

try {
  for (const viewport of [{ width: 1440, height: 1000 }, { width: 390, height: 844 }]) {
    const context = await browser.newContext({ viewport });
    const page = await context.newPage();
    for (const family of families) {
      const fixtureUrl = `${baseUrl}/production/sec_reopen_lifecycle_fixture.html?family=${family}`;
      await page.goto(fixtureUrl, { waitUntil: "networkidle" });

      const state = () => page.evaluate(() => ({
        openRegion: document.querySelector(".sec-v1-flow").dataset.secOpenRegion,
        target: document.querySelector('[data-sec-region="target"]').open,
        session: document.querySelector('[data-sec-region="session"]').open,
        correction: document.querySelector('[data-sec-stage="sight-correction"]').open,
        targetBodyVisible: getComputedStyle(document.querySelector(".sec-historical-target-body")).display !== "none",
        sessionBodyVisible: getComputedStyle(document.querySelector('[data-sec-region="session"] .sec-stage-body')).display !== "none",
        marker: {
          text: document.querySelector("[data-evidence-marker]").textContent,
          x: document.querySelector("[data-evidence-marker]").dataset.x,
          y: document.querySelector("[data-evidence-marker]").dataset.y
        }
      }));

      assert.deepEqual(await state(), {
        openRegion: "target",
        target: true,
        session: false,
        correction: false,
        targetBodyVisible: true,
        sessionBodyVisible: false,
        marker: { text: "1", x: "0.25", y: "0.75" }
      }, `${family} normal load is Target-first with preserved evidence`);
      const initiallyClosedBars = await page.evaluate(() => ({
        session: document.querySelector('[data-sec-region="session"] > summary').getBoundingClientRect().height,
        sessionContainer: document.querySelector('[data-sec-region="session"]').getBoundingClientRect().height,
        correction: document.querySelector('[data-sec-stage="sight-correction"] > summary').getBoundingClientRect().height,
        correctionContainer: document.querySelector('[data-sec-stage="sight-correction"]').getBoundingClientRect().height
      }));
      assertCompactClosedBar(initiallyClosedBars.session, `${family} Session at ${viewport.width}px`);
      assert.equal(initiallyClosedBars.sessionContainer, initiallyClosedBars.session, `${family} closed Session must reserve no space beyond its bar at ${viewport.width}px`);
      assertCompactClosedBar(initiallyClosedBars.correction, `${family} Sight Correction at ${viewport.width}px`);
      assert.equal(initiallyClosedBars.correctionContainer, initiallyClosedBars.correction, `${family} closed Sight Correction must reserve no space beyond its bar at ${viewport.width}px`);
      await page.locator('[data-sec-region="session"] summary').click();
      await page.waitForFunction(() => !document.querySelector('[data-sec-region="target"]').open);
      assert.deepEqual(await state(), {
        openRegion: "session",
        target: false,
        session: true,
        correction: false,
        targetBodyVisible: false,
        sessionBodyVisible: true,
        marker: { text: "1", x: "0.25", y: "0.75" }
      }, `${family} Session fully collapses Target without changing evidence`);
      const closedTargetHeight = await page.locator('[data-sec-region="target"] > summary').evaluate(element => element.getBoundingClientRect().height);
      assertCompactClosedBar(closedTargetHeight, `${family} Target at ${viewport.width}px`);
      const closedTargetContainerHeight = await page.locator('[data-sec-region="target"]').evaluate(element => element.getBoundingClientRect().height);
      assert.equal(closedTargetContainerHeight, closedTargetHeight, `${family} closed Target must reserve no space beyond its bar at ${viewport.width}px`);

      await page.locator('[data-sec-stage="sight-correction"] summary').click();
      await page.waitForFunction(() => {
        const session = document.querySelector('[data-sec-region="session"]');
        const correction = document.querySelector('[data-sec-stage="sight-correction"]');
        return session?.open === false && correction?.open === true;
      });
      assert.deepEqual((await state()), {
        openRegion: "sightcorrection",
        target: false,
        session: false,
        correction: true,
        targetBodyVisible: false,
        sessionBodyVisible: false,
        marker: { text: "1", x: "0.25", y: "0.75" }
      }, `${family} permits only one open SEC section`);

      await page.locator('[data-sec-region="target"] summary').click();
      await page.waitForFunction(() => {
        const target = document.querySelector('[data-sec-region="target"]');
        const session = document.querySelector('[data-sec-region="session"]');
        const correction = document.querySelector('[data-sec-stage="sight-correction"]');
        return target?.open === true && session?.open === false && correction?.open === false;
      });
      assert.deepEqual((await state()), {
        openRegion: "target",
        target: true,
        session: false,
        correction: false,
        targetBodyVisible: true,
        sessionBodyVisible: false,
        marker: { text: "1", x: "0.25", y: "0.75" }
      }, `${family} restores Target evidence exactly`);

      await page.goto(`${baseUrl}/index.html?sec-reopen-away=${family}`, { waitUntil: "domcontentloaded" });
      await page.goBack({ waitUntil: "commit" });
      await page.waitForFunction(() => document.querySelector('[data-sec-region="target"]')?.open === true);
      assert.equal((await state()).target, true, `${family} BFCache/pageshow reopen opens Target`);
      assert.equal((await state()).session, false, `${family} BFCache/pageshow reopen closes Session`);
      assert.equal((await state()).correction, false, `${family} BFCache/pageshow reopen closes Correction`);
      assert.deepEqual((await state()).marker, { text: "1", x: "0.25", y: "0.75" }, `${family} BFCache preserves evidence`);

      await page.evaluate(() => {
        document.querySelector('[data-sec-region="target"]').open = false;
        document.querySelector('[data-sec-region="session"]').open = true;
      });
      await page.reload({ waitUntil: "networkidle" });
      assert.equal((await state()).target, true, `${family} direct/Vault reopen opens Target`);
      assert.equal((await state()).session, false, `${family} direct/Vault reopen closes Session`);
      assert.equal((await state()).correction, false, `${family} direct/Vault reopen closes Correction`);
      assert.deepEqual((await state()).marker, { text: "1", x: "0.25", y: "0.75" }, `${family} direct/Vault reopen preserves evidence`);
    }

    await context.close();
    console.log(`PASS universal SEC reopen normalization at ${viewport.width}px`);
  }
} finally {
  await browser.close();
}
