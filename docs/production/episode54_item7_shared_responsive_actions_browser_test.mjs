import assert from "node:assert/strict";
import { createRequire } from "node:module";
import path from "node:path";

const require = createRequire(import.meta.url);
const { chromium } = require("playwright");
const root = process.cwd();
const browser = await chromium.launch({ headless: true, executablePath: process.env.SCZN3_CHROME_EXECUTABLE || undefined });

try {
  for (const viewport of [
    { width: 1440, height: 900, label: "desktop" },
    { width: 390, height: 844, label: "390px" },
    { width: 1050, height: 417, label: "short-height" }
  ]) {
    const page = await browser.newPage({ viewport });
    await page.setContent(`<!doctype html><html><head></head><body><main id="root"></main></body></html>`);
    await page.addStyleTag({ path: path.join(root, "platform_actions.css") });
    await page.addScriptTag({ content: `
      window.__processing = { begun: 0, succeeded: 0, failed: 0 };
      window.SCZN3Processing = {
        begin() { window.__processing.begun += 1; return "operation-" + window.__processing.begun; },
        succeed() { window.__processing.succeeded += 1; },
        fail() { window.__processing.failed += 1; }
      };
    ` });
    await page.addScriptTag({ path: path.join(root, "platform_actions.js") });
    await page.evaluate(() => {
      const root = document.getElementById("root");
      root.innerHTML = `
        <div class="sec-preservation-actions" data-sczn3-action-region="platform-v1">
          <button data-sczn3-action="save">SAVE SEC</button>
          <button data-sczn3-action="share">SHARE</button>
          <button data-sczn3-action="export">EXPORT</button>
          <button data-sczn3-action="note">ADD NOTE</button>
          <a data-sczn3-action="history" href="#history">BALLISTIC VAULT</a>
        </div>
        <div data-sczn3-note-editor hidden class="is-hidden"><textarea></textarea></div>`;
      window.__saveCalls = 0;
      window.__shouldFail = false;
      SCZN3Actions.bind(root, {
        save: {
          run: async () => {
            window.__saveCalls += 1;
            await new Promise(resolve => setTimeout(resolve, 60));
            if (window.__shouldFail) throw new Error("expected_failure");
            return true;
          }
        }
      });
    });

    const region = page.locator("[data-sczn3-action-region]");
    assert.equal(await region.getAttribute("data-sczn3-action-owner"), "SCZN3Actions");
    const geometry = await page.evaluate(() => ({
      overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
      regionWidth: document.querySelector("[data-sczn3-action-region]").getBoundingClientRect().width,
      viewportWidth: document.documentElement.clientWidth
    }));
    assert.ok(geometry.overflow <= 1, `${viewport.label}: no page-level horizontal overflow`);
    assert.ok(geometry.regionWidth <= geometry.viewportWidth, `${viewport.label}: action region remains contained`);

    await page.evaluate(() => {
      const save = document.querySelector('[data-sczn3-action="save"]');
      save.click();
      save.click();
    });
    await page.waitForFunction(() => window.__processing.succeeded === 1);
    assert.equal(await page.evaluate(() => window.__saveCalls), 1, `${viewport.label}: duplicate save is suppressed`);

    await page.locator('[data-sczn3-action="note"]').click();
    assert.equal(await page.locator("[data-sczn3-note-editor]").isVisible(), true, `${viewport.label}: shared note action reveals the editor`);

    await page.evaluate(() => { window.__shouldFail = true; });
    await page.locator('[data-sczn3-action="save"]').click();
    await page.waitForFunction(() => window.__processing.failed === 1);
    await page.evaluate(() => { window.__shouldFail = false; });
    await page.locator('[data-sczn3-action="save"]').click();
    await page.waitForFunction(() => window.__processing.succeeded === 2);
    assert.equal(await page.evaluate(() => window.__saveCalls), 3, `${viewport.label}: failure releases the action for truthful retry`);

    await page.close();
    console.log(`PASS Episode 54 Item 7 shared actions at ${viewport.label}`);
  }
} finally {
  await browser.close();
}
