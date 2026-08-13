import assert from "node:assert/strict";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { chromium } = require("playwright");
const baseUrl = process.env.SCZN3_TEST_BASE_URL || "http://127.0.0.1:8101";

const browser = await chromium.launch({ headless: true, executablePath: process.env.SCZN3_CHROME_EXECUTABLE || undefined });
try {
  for (const viewport of [{ width: 1440, height: 1000 }, { width: 390, height: 844 }]) {
    const context = await browser.newContext({ viewport });
    const page = await context.newPage();
    const errors = [];
    page.on("pageerror", error => errors.push(error.message));
    await page.goto(`${baseUrl}/sec.html?reviewSession=003&v=impact-count-identifiers`, { waitUntil: "networkidle" });
    await page.locator("#secCard:not(.is-hidden)").waitFor();
    const markers = async selector => page.locator(selector).evaluateAll(nodes => nodes.map(node => ({
      label: node.textContent.trim(),
      left: node.style.left,
      top: node.style.top
    })));
    const before = await markers("#beforeEvidenceMarkers .impact-marker");
    const after = await markers("#confirmationMarkers .impact-marker");
    assert.deepEqual(before.map(marker => marker.label), ["1", "2", "3"], `${viewport.width}px initial marker count matches captured impacts`);
    assert.deepEqual(after.map(marker => marker.label), ["1", "2", "3"], `${viewport.width}px confirmation marker count matches captured impacts`);
    assert.deepEqual(before.map(({ left, top }) => ({ left, top })), [
      { left: "57.2%", top: "58.1%" }, { left: "58.1%", top: "57.4%" }, { left: "57.6%", top: "58.6%" }
    ], "initial marker coordinates remain unchanged");
    assert.deepEqual(after.map(({ left, top }) => ({ left, top })), [
      { left: "49.7%", top: "48.5%" }, { left: "50.2%", top: "48.8%" }, { left: "50.1%", top: "48.6%" }
    ], "confirmation marker coordinates remain unchanged");
    assert.deepEqual(errors, []);
    await context.close();
    console.log(`PASS M4 SEC impact-count parity at ${viewport.width}px`);
  }
} finally {
  await browser.close();
}
