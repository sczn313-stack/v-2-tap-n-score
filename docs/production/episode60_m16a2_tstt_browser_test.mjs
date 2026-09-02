import assert from "node:assert/strict";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { chromium } = require("playwright");
const baseUrl = process.env.SCZN3_TEST_BASE_URL || "http://127.0.0.1:8093";
const browser = await chromium.launch({ headless: true, executablePath: process.env.SCZN3_CHROME_EXECUTABLE || undefined });

try {
  for (const viewport of [{ width: 390, height: 844 }, { width: 1440, height: 1000 }]) {
    const context = await browser.newContext({ viewport, reducedMotion: "reduce" });
    const page = await context.newPage();
    const errors = [];
    page.on("pageerror", error => errors.push(error.message));
    await page.addInitScript(() => {
      window.speechSynthesis = { cancel() {}, speak() {}, pause() {}, resume() {}, speaking: false };
      window.SpeechSynthesisUtterance = class { constructor(text) { this.text = text; } };
    });
    await page.goto(`${baseUrl}/m16a2-tstt.html`, { waitUntil: "networkidle" });

    await page.getByRole("button", { name: "START TRAINING", exact: true }).click();
    await page.getByRole("button", { name: /DIFFERENT SIGHT OR OPTIC/ }).click();
    await assert.rejects(page.getByRole("button", { name: /NEXT: PREPARE/ }).waitFor({ timeout: 250 }), "unsupported equipment cannot advance");
    assert.match(await page.locator("#branchHold").innerText(), /BRANCH NOT AUTHORIZED/);

    await page.getByRole("button", { name: /STANDARD M16A2 IRON SIGHTS/ }).click();
    await page.getByRole("button", { name: /NEXT: PREPARE THE REAR DRUM/ }).click();
    assert.equal(await page.locator("#chapterNumber").innerText(), "CHAPTER 2 OF 5");
    assert.match(await page.locator("#visualStage").innerText(), /CLOCKWISE • ONE CLICK PAST 300/);

    await page.locator('[data-control="pause"]').click();
    assert.equal(await page.locator("[data-pause-label]").innerText(), "RESUME");
    assert.equal(await page.locator("#tsttApp").getAttribute("data-status"), "paused");
    await page.locator('[data-control="pause"]').click();
    assert.equal(await page.locator("[data-pause-label]").innerText(), "PAUSE");

    await page.getByRole("button", { name: /I REHEARSED THE SETUP/ }).click();
    await page.getByRole("button", { name: /I FOUND THE AIM POINT/ }).click();
    assert.equal(await page.locator("#chapterNumber").innerText(), "CHAPTER 4 OF 5");
    assert.match(await page.locator("#visualStage").innerText(), /FRONT SIGHT POST/);
    assert.match(await page.locator("#visualStage").innerText(), /REAR WINDAGE KNOB/);

    await page.locator('[data-control="chapters"]').click();
    assert.equal(await page.locator("#chapterList button:not([disabled])").count(), 5);
    await page.getByRole("button", { name: /Ready for the first group/ }).click();
    assert.match(await page.locator("#lessonTitle").innerText(), /READY TO FIRE YOUR FIRST GROUP/i);
    assert.match(await page.locator("#visualStage").innerText(), /READY TO FIRE\s+YOUR FIRST GROUP/);
    assert.equal(await page.locator("text=ADD PHOTO").count(), 0);

    await page.locator('[data-control="replay"]').click();
    assert.equal(await page.locator("#chapterNumber").innerText(), "CHAPTER 5 OF 5");
    await page.locator('[data-control="restart"]').click();
    assert.equal(await page.locator("#chapterNumber").innerText(), "CHAPTER 1 OF 5");
    assert.equal(await page.getByRole("button", { name: "START TRAINING", exact: true }).count(), 1);

    const horizontalOverflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);
    assert.equal(horizontalOverflow, false, `no horizontal overflow at ${viewport.width}px`);
    assert.deepEqual(errors, [], `no page errors at ${viewport.width}px`);
    await context.close();
  }
} finally {
  await browser.close();
}

console.log("PASS Episode 60 Baker M16A2 pre-fire TSTT browser flow at 390px and 1440px");
