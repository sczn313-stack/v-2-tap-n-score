import assert from "node:assert/strict";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { chromium } = require("playwright");
const baseUrl = process.env.SCZN3_TEST_BASE_URL || "http://127.0.0.1:8151";
const browser = await chromium.launch({ headless: true, executablePath: process.env.SCZN3_CHROME_EXECUTABLE || undefined });

try {
  for (const viewport of [{ width: 1238, height: 887 }, { width: 390, height: 844 }]) {
    const context = await browser.newContext({ viewport, reducedMotion: "no-preference" });
    const page = await context.newPage();
    await page.goto(`${baseUrl}/production/universal_processing_indicator_fixture.html?v=${viewport.width}`, { waitUntil: "networkidle" });

    const operationId = await page.evaluate(() => fixture.beginSuccess(30));
    const success = page.locator("#success");
    assert.equal(await success.isDisabled(), true, "active operation prevents duplicate activation");
    assert.equal(await success.getAttribute("aria-busy"), "true");
    assert.match(await success.innerText(), /Calculating your score/);
    await page.waitForFunction(() => document.querySelector("#success")?.innerText.includes("Still working. Your evidence is safe."));

    const geometry = await page.evaluate(() => {
      const evidence = document.querySelector(".evidence > div").getBoundingClientRect();
      const actions = document.querySelector(".actions").getBoundingClientRect();
      return {
        evidenceBottom: evidence.bottom,
        actionTop: actions.top,
        actionBottom: actions.bottom,
        viewportBottom: window.innerHeight,
        overflow: document.documentElement.scrollWidth > window.innerWidth
      };
    });
    assert.ok(geometry.evidenceBottom <= geometry.actionTop, "processing action region does not obscure evidence");
    assert.ok(geometry.actionBottom <= geometry.viewportBottom, "processing action remains visible");
    assert.equal(geometry.overflow, false, "processing UI has no horizontal overflow");

    await page.evaluate(id => SCZN3Processing.succeed(id), operationId);
    assert.equal(await success.isDisabled(), false);
    assert.equal(await success.innerText(), "Show Results");
    await success.click();
    assert.equal(await page.evaluate(() => fixture.handlerCount()), 1, "restoring processing copy preserves the original listener");

    const failedOperationId = await page.evaluate(() => fixture.beginFailure());
    assert.match(await page.locator("#failure").innerText(), /Preserving your Shooter Experience Card/);
    await page.evaluate(id => SCZN3Processing.fail(id), failedOperationId);
    assert.equal(await page.locator("#failure").innerText(), "Save SEC");

    const bfcacheOperationId = await page.evaluate(() => fixture.beginSuccess());
    assert.equal(await page.evaluate(() => SCZN3Processing.activeCount()), 1);
    await page.evaluate(() => window.dispatchEvent(new PageTransitionEvent("pageshow", { persisted: true })));
    assert.equal(await page.evaluate(() => SCZN3Processing.activeCount()), 0, "BFCache restoration cannot leave a stuck processing state");
    assert.equal(await success.innerText(), "Show Results");
    assert.equal(await page.evaluate(id => SCZN3Processing.succeed(id), bfcacheOperationId), false, "stale completion cannot mutate restored UI");

    await context.close();
  }

  const reducedContext = await browser.newContext({ viewport: { width: 390, height: 844 }, reducedMotion: "reduce" });
  const reducedPage = await reducedContext.newPage();
  await reducedPage.goto(`${baseUrl}/production/universal_processing_indicator_fixture.html?reduced=1`, { waitUntil: "networkidle" });
  await reducedPage.evaluate(() => fixture.beginSuccess());
  const animation = await reducedPage.locator(".sczn3-processing-indicator__motion i").first().evaluate(node => getComputedStyle(node).animationName);
  assert.equal(animation, "none", "reduced motion receives a static activity treatment");
  await reducedContext.close();

  console.log("PASS Universal Processing Indicator lifecycle, accessibility, viewport, failure, BFCache, and reduced-motion behavior");
} finally {
  await browser.close();
}
