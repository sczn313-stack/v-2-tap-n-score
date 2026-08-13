import assert from "node:assert/strict";
import path from "node:path";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { chromium } = require("playwright");
const baseUrl = process.env.SCZN3_TEST_BASE_URL || "http://127.0.0.1:8101";
const targetPhoto = path.resolve("authority-evidence/baker-sl-st1/BAKER_SL_ST1_PRINTER_PRODUCT_IMAGE.webp");

const browser = await chromium.launch({ headless: true, executablePath: process.env.SCZN3_CHROME_EXECUTABLE || undefined });
try {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const page = await context.newPage();
  const errors = [];
  page.on("pageerror", error => errors.push(error.message));
  await page.goto(`${baseUrl}/index.html?v=sl-st1-tap-to-begin`, { waitUntil: "networkidle" });
  const card = page.locator('[data-experience-id="uspsa-practice-target"]');
  assert.equal(await card.getAttribute("data-status"), "available");
  assert.equal(await card.getAttribute("href"), "t/baker/sl-st1/");
  assert.match(await card.textContent(), /Tap to Begin/);
  assert.doesNotMatch(await card.textContent(), /Coming Soon/i);
  await card.click();
  await page.waitForURL(value => value.pathname.endsWith("/t/baker/sl-st1/"));
  assert.equal(await page.locator("#libraryInput").count(), 1, "Tap to Begin opens the completed SL-ST1 shooter experience");
  await page.locator("#libraryInput").setInputFiles(targetPhoto);
  await page.locator("#targetWorkspace:not([hidden])").waitFor();
  assert.equal(await page.locator("#showResults").isVisible(), true, "the production shooter workflow is ready after entry");
  assert.deepEqual(errors, []);
  console.log("PASS USPSA Tap to Begin catalog entry opens the completed SL-ST1 workflow");
  await context.close();
} finally {
  await browser.close();
}
