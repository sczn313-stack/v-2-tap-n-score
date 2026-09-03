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
      Object.defineProperty(window, "speechSynthesis", { configurable: true, value: { cancel() {}, speak() {}, pause() {}, resume() {}, speaking: false } });
      Object.defineProperty(window, "SpeechSynthesisUtterance", { configurable: true, value: class { constructor(text) { this.text = text; } } });
      localStorage.setItem("SCZN3_ACTIVE_EQUIPMENT_PROFILE_ID", "founder-m16a2");
      localStorage.setItem("SCZN3_SAVED_EQUIPMENT_PROFILES", JSON.stringify([{
        setupId: "founder-m16a2",
        setupName: "M16A2 • STANDARD IRON SIGHTS",
        weaponModelType: "M16A2",
        opticType: "Iron Sights",
        equipmentConfigurationId: "M16A2-STANDARD-IRON-FSP-REAR-DRUM"
      }]));
    });
    await page.goto(`${baseUrl}/m16a2-tstt.html`, { waitUntil: "networkidle" });

    assert.equal(await page.locator("#targetIdentity").innerText(), "25 METERS ZEROING TARGET\nM16A2");
    assert.equal(await page.locator("#lessonProgress > span").count(), 5);
    assert.match(await page.locator("#taskCard").innerText(), /YOUR ZEROING SETUP[\s\S]*M16A2 RIFLE[\s\S]*STANDARD IRON SIGHTS[\s\S]*THIS SETUP WORKS TOGETHER/);
    await page.getByRole("button", { name: "START TRAINING", exact: true }).click();
    await page.getByRole("button", { name: /NEXT: PREPARE THE REAR DRUM/ }).click();
    assert.equal(await page.locator("#chapterNumber").innerText(), "CHAPTER 2 OF 5");
    assert.match(await page.locator("#visualStage").innerText(), /CLOCKWISE • ONE CLICK PAST 300/);

    await page.locator('[data-control="pause"]').click();
    assert.equal(await page.locator("[data-pause-label]").innerText(), "RESUME");
    assert.equal(await page.locator("#tsttApp").getAttribute("data-status"), "paused");
    await page.locator('[data-control="pause"]').click();
    assert.equal(await page.locator("[data-pause-label]").innerText(), "PAUSE");
    await page.locator('[data-control="stop"]').click();
    assert.equal(await page.locator("#tsttApp").getAttribute("data-status"), "stopped");
    assert.equal(await page.locator("[data-pause-label]").innerText(), "RESUME");
    await page.locator('[data-control="pause"]').click();
    assert.equal(await page.locator("#tsttApp").getAttribute("data-status"), "active");

    await page.getByRole("button", { name: /I REHEARSED THE SETUP/ }).click();
    await page.getByRole("button", { name: /I FOUND THE AIM POINT/ }).click();
    assert.equal(await page.locator("#chapterNumber").innerText(), "CHAPTER 4 OF 5");
    assert.match(await page.locator("#visualStage").innerText(), /FRONT SIGHT POST/);
    assert.match(await page.locator("#visualStage").innerText(), /REAR WINDAGE KNOB/);

    await page.locator('[data-control="chapters"]').click();
    assert.equal(await page.locator("#chapterList button:not([disabled])").count(), 5);
    assert.equal(await page.locator("#chapterList .you-are-here").innerText(), "YOU ARE HERE");
    assert.match(await page.locator(".proficiency-status").innerText(), /PROFICIENCY[\s\S]*☆☆☆/);
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

  const coldContext = await browser.newContext({ viewport: { width: 390, height: 844 }, reducedMotion: "reduce" });
  const coldPage = await coldContext.newPage();
  const coldErrors = [];
  coldPage.on("pageerror", error => coldErrors.push(error.message));
  await coldPage.addInitScript(() => {
    Object.defineProperty(window, "speechSynthesis", { configurable: true, value: { cancel() {}, speak() {}, pause() {}, resume() {}, speaking: false } });
    Object.defineProperty(window, "SpeechSynthesisUtterance", { configurable: true, value: class { constructor(text) { this.text = text; } } });
  });
  await coldPage.goto(`${baseUrl}/m16a2-tstt.html`, { waitUntil: "networkidle" });
  assert.equal(await coldPage.locator("#equipmentStateLabel").innerText(), "STARTING SETUP · NOT CONFIRMED");
  assert.equal(await coldPage.locator("#equipmentLabel").innerText(), "M16A2 Rifle · 5.56 NATO · Iron Sights");
  assert.match(await coldPage.locator("#taskCard").innerText(), /STARTING EXAMPLE — NOT CONFIRMED AS YOUR EQUIPMENT/);
  assert.equal(await coldPage.locator("#visualStage figcaption").count(), 0);
  assert.equal(await coldPage.locator("#visualStage .is-full-target").count(), 1);

  await coldPage.getByRole("button", { name: "START TRAINING", exact: true }).click();
  await coldPage.getByRole("button", { name: /NEXT: PREPARE THE REAR DRUM/ }).click();
  assert.equal(await coldPage.locator("#chapterNumber").innerText(), "CHAPTER 2 OF 5");

  await coldPage.getByRole("link", { name: "Open Equipment Library" }).click();
  await coldPage.waitForURL(/matrix\.html\?view=library.*return_chapter=2/);
  assert.match(await coldPage.locator("#originReturnBar").innerText(), /RETURN TO TRAINING[\s\S]*RETURN TO CHAPTER 2/);
  await coldPage.getByRole("button", { name: "🟨 New Equipment", exact: true }).click();
  await coldPage.locator("#weaponManufacturer").selectOption("Colt");
  await coldPage.locator("#weaponModelType").selectOption("Other");
  await coldPage.locator("#customWeaponModelType").fill("M16A2");
  await coldPage.locator("#weaponModelCaliber").selectOption("Other");
  await coldPage.locator("#customWeaponModelCaliber").fill("5.56 NATO");
  await coldPage.getByRole("button", { name: "Save to My Equipment", exact: true }).click();
  await coldPage.waitForURL(/m16a2-tstt\.html$/);
  assert.equal(await coldPage.locator("#chapterNumber").innerText(), "CHAPTER 2 OF 5");
  assert.equal(await coldPage.locator("#equipmentStateLabel").innerText(), "CURRENT EQUIPMENT");
  assert.equal(await coldPage.locator("#equipmentLabel").innerText(), "Colt M16A2 · 5.56 NATO · Iron Sights");

  await coldPage.getByRole("link", { name: "Open Equipment Library" }).click();
  await coldPage.waitForURL(/matrix\.html/);
  await coldPage.getByRole("button", { name: "Selected", exact: true }).click();
  await coldPage.waitForURL(/m16a2-tstt\.html$/);
  assert.equal(await coldPage.locator("#chapterNumber").innerText(), "CHAPTER 2 OF 5");
  assert.equal(await coldPage.locator("#equipmentLabel").innerText(), "Colt M16A2 · 5.56 NATO · Iron Sights");
  assert.deepEqual(coldErrors, [], "cold-start Equipment Library round trip has no page errors");
  await coldContext.close();
} finally {
  await browser.close();
}

console.log("PASS Episode 60 Baker M16A2 pre-fire TSTT browser flow at 390px and 1440px");
