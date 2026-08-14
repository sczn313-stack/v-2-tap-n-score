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
        target: document.querySelector('[data-sec-region="target"]').open,
        session: document.querySelector('[data-sec-region="session"]').open,
        correction: document.querySelector('[data-sec-stage="sight-correction"]').open
      }));

      assert.deepEqual(await state(), { target: true, session: false, correction: false }, `${family} normal load is Target-first`);
      await page.locator('[data-sec-region="session"] summary').click();
      await page.waitForFunction(() => !document.querySelector('[data-sec-region="target"]').open);
      assert.deepEqual(await state(), { target: false, session: true, correction: false }, `${family} supports normal accordion interaction`);

      await page.goto(`${baseUrl}/index.html?sec-reopen-away=${family}`, { waitUntil: "domcontentloaded" });
      await page.goBack({ waitUntil: "commit" });
      await page.waitForFunction(() => document.querySelector('[data-sec-region="target"]')?.open === true);
      assert.deepEqual(await state(), { target: true, session: false, correction: false }, `${family} BFCache/pageshow reopen is Target-first`);

      await page.evaluate(() => {
        document.querySelector('[data-sec-region="target"]').open = false;
        document.querySelector('[data-sec-region="session"]').open = true;
      });
      await page.reload({ waitUntil: "networkidle" });
      assert.deepEqual(await state(), { target: true, session: false, correction: false }, `${family} direct/Vault reopen is Target-first`);
    }

    await context.close();
    console.log(`PASS universal SEC reopen normalization at ${viewport.width}px`);
  }
} finally {
  await browser.close();
}
