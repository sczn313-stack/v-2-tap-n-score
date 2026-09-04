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
      window.__spokenUtterances = [];
      const voices = [
        { name: "Albert", lang: "en-US", localService: true, default: true },
        { name: "Daniel", lang: "en-GB", localService: true, default: false },
        { name: "Samantha", lang: "en-US", voiceURI: "com.apple.voice.compact.en-US.Samantha", localService: true, default: false },
        { name: "Reed (English (US))", lang: "en-US", voiceURI: "com.apple.eloquence.en-US.Reed", localService: true, default: false }
      ];
      Object.defineProperty(window, "speechSynthesis", { configurable: true, value: { cancel() {}, speak(utterance) { window.__spokenUtterances.push(utterance); }, pause() {}, resume() {}, getVoices() { return voices; }, speaking: false } });
      Object.defineProperty(window, "SpeechSynthesisUtterance", { configurable: true, value: class { constructor(text) { this.text = text; } } });
      localStorage.setItem("SCZN3_ACTIVE_EQUIPMENT_PROFILE_ID", "founder-m16a2");
      localStorage.setItem("SCZN3_SAVED_EQUIPMENT_PROFILES", JSON.stringify([{
        setupId: "founder-m16a2",
        setupName: "M16A2 • STANDARD IRON SIGHTS",
        weaponModelType: "M16A2",
        opticType: "Iron Sights",
        equipmentConfigurationId: "M16A2-STANDARD-IRON-FSP-REAR-DRUM",
        adjustmentProfileId: "M16A2-IRON-FSP-REAR-DRUM-ADJUSTMENT-PROFILE-2011"
      }]));
    });
    await page.goto(`${baseUrl}/m16a2-tstt.html`, { waitUntil: "networkidle" });

    assert.equal(await page.locator("#runtimeVoiceStatus").innerText(), "Samantha · en-US · com.apple.voice.compact.en-US.Samantha");
    await page.locator("#runtimeVoiceCheck").click();
    const voiceCheck = await page.evaluate(() => window.__spokenUtterances.at(-1));
    assert.equal(voiceCheck.text, "Your shot pattern is two squares high and three squares left.");
    assert.equal(voiceCheck.voice.name, "Samantha");
    assert.equal(voiceCheck.voice.voiceURI, "com.apple.voice.compact.en-US.Samantha");
    assert.equal(voiceCheck.rate, 0.70);
    assert.equal(await page.locator("#targetIdentity").innerText(), "25 METERS ZEROING TARGET\nM16A2");
    assert.equal(await page.locator("#lessonProgress > span").count(), 5);
    assert.match(await page.locator("#taskCard").innerText(), /TRAINING SETUP[\s\S]*M16A2 · Standard Iron Sights[\s\S]*This training teaches this setup\. If yours is different, some instructions may not apply/);
    assert.equal(await page.getByText("CURRENT EQUIPMENT", { exact: true }).count(), 0);
    assert.equal(await page.locator("#lessonSummary").isHidden(), true);
    assert.equal(await page.locator("#lessonTitle").innerText(), "KNOW YOUR TARGET.");
    assert.equal(await page.locator("#lessonSummary").innerText(), "Before making any sight adjustments, understand what this target is telling you.");
    assert.match(await page.locator("#visualStage").innerText(), /AIM POINT[\s\S]*Always make the center crosshairs your aim point[\s\S]*READ THE GRID[\s\S]*Each small square measures[\s\S]*READ THE CLICKS[\s\S]*columns represents one front-sight up-or-down click[\s\S]*rows represents three rear-windage clicks[\s\S]*FIRE THE SHOT PATTERN[\s\S]*THE CENTER OF YOUR SHOT PATTERN[\s\S]*LET TAP-N-SCORE READ IT/);
    assert.match(await page.locator("#visualStage").innerText(), /1 square = 1 front-sight click[\s\S]*1 square = 3 rear-windage clicks/);
    await page.getByRole("button", { name: "START TRAINING", exact: true }).click();
    const chapterOneSpeech = await page.evaluate(() => {
      const utterance = window.__spokenUtterances.at(-1);
      return { text: utterance.text, rate: utterance.rate, pitch: utterance.pitch, volume: utterance.volume, voice: utterance.voice?.name, lang: utterance.lang };
    });
    assert.deepEqual({ rate: chapterOneSpeech.rate, pitch: chapterOneSpeech.pitch, volume: chapterOneSpeech.volume, voice: chapterOneSpeech.voice, lang: chapterOneSpeech.lang }, { rate: 0.70, pitch: 1, volume: 1, voice: "Samantha", lang: "en-US" });
    assert.equal(chapterOneSpeech.text, "Before making any sight adjustments, understand what this target is telling you. Always make the center crosshairs your aim point when zeroing your weapon. Each small square measures how far your shots are landing from the center crosshairs. On this target, each square in the columns represents one front-sight up-or-down click. Each square in the rows represents three rear-windage clicks, right or left. Fire three to five shots before making an adjustment. The center of your shot pattern gives a better picture of where your shots are landing. Once you have a shot pattern, Tap-n-Score can measure where it is in relation to the center crosshairs and tell you what adjustment to make. Next, we'll learn the sights.");
    const spokenCountBeforePause = await page.evaluate(() => window.__spokenUtterances.length);
    await page.evaluate(() => window.__spokenUtterances.at(-1).onend());
    await page.waitForTimeout(550);
    assert.equal(await page.evaluate(() => window.__spokenUtterances.length), spokenCountBeforePause, "Chapter 1 remains one continuous known-good utterance");
    assert.equal(await page.getByRole("button", { name: "THIS MATCHES MY GEAR", exact: true }).count(), 0);
    await page.locator("#shootingSetup").click();
    assert.equal(await page.locator("#sessionDistance").inputValue(), "25");
    assert.equal(await page.locator("#sessionDistanceUnit").inputValue(), "METERS");
    assert.equal(await page.locator("#sessionAdjustmentUnit").inputValue(), "MOA");
    assert.equal(await page.locator("#sessionAdjustmentIncrement").inputValue(), "Elevation 1.25 · Windage 0.5");
    await page.getByRole("button", { name: /NEXT, WE'LL LEARN THE SIGHTS\./ }).click();
    assert.equal(await page.locator("#chapterNumber").innerText(), "CHAPTER 2 OF 5");
    assert.match(await page.locator("#visualStage").innerText(), /CLOCKWISE • ONE CLICK PAST 300/);
    const chapterTwoSpeech = await page.evaluate(() => window.__spokenUtterances.at(-1).text);
    assert.equal(chapterTwoSpeech, "Find the rear elevation drum.");

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
    window.__coldSpoken = [];
    const voices = [{ name: "Reed (English (US))", lang: "en-US", voiceURI: "com.apple.eloquence.en-US.Reed", localService: true }];
    Object.defineProperty(window, "speechSynthesis", { configurable: true, value: { cancel() {}, speak(utterance) { window.__coldSpoken.push(utterance); }, pause() {}, resume() {}, getVoices() { return voices; }, addEventListener() {}, speaking: false } });
    Object.defineProperty(window, "SpeechSynthesisUtterance", { configurable: true, value: class { constructor(text) { this.text = text; } } });
  });
  await coldPage.goto(`${baseUrl}/m16a2-tstt.html`, { waitUntil: "networkidle" });
  assert.equal(await coldPage.locator("#runtimeVoiceStatus").innerText(), "CHECKING FOR SAMANTHA…");
  await coldPage.waitForTimeout(1100);
  assert.equal(await coldPage.locator("#runtimeVoiceStatus").innerText(), "SAMANTHA UNAVAILABLE");
  assert.equal(await coldPage.locator("#runtimeVoiceCheck").isDisabled(), true);
  assert.equal(await coldPage.getByText("CURRENT EQUIPMENT", { exact: true }).count(), 0);
  assert.match(await coldPage.locator("#taskCard").innerText(), /TRAINING SETUP[\s\S]*M16A2 · Standard Iron Sights[\s\S]*This training teaches this setup\. If yours is different, some instructions may not apply/);
  assert.equal(await coldPage.locator("#visualStage figcaption").count(), 0);
  assert.equal(await coldPage.locator("#visualStage .is-full-target").count(), 1);
  assert.equal(await coldPage.locator("#visualStage .target-marker, #visualStage .sample-group").count(), 0);
  const startBox = await coldPage.getByRole("button", { name: "START TRAINING", exact: true }).boundingBox();
  assert.ok(startBox && startBox.y >= 0 && startBox.y + startBox.height <= 844, "START TRAINING is visible in the initial 390x844 viewport");
  assert.equal(await coldPage.locator('.player-controls [data-control="pause"]:visible').count(), 0);

  await coldPage.getByRole("button", { name: "START TRAINING", exact: true }).click();
  assert.equal(await coldPage.evaluate(() => window.__coldSpoken.length), 0, "production never substitutes Reed when Samantha is unavailable");
  assert.equal(await coldPage.getByRole("button", { name: "START TRAINING", exact: true }).count(), 0);
  assert.equal(await coldPage.locator('.player-controls [data-control="pause"]:visible').count(), 1);
  assert.equal(await coldPage.locator("#chapterList button:not([disabled])").count(), 5);
  await coldPage.getByRole("button", { name: /NEXT, WE'LL LEARN THE SIGHTS\./ }).click();
  await coldPage.locator('[data-control="pause"]').click();
  await coldPage.locator("#shootingSetup").click();
  await coldPage.getByRole("link", { name: "EQUIPMENT LIBRARY", exact: true }).click();
  await coldPage.waitForURL(/matrix\.html\?view=library.*return_chapter=2/);
  assert.match(await coldPage.locator("#originReturnBar").innerText(), /RETURN TO TRAINING[\s\S]*RETURN TO CHAPTER 2/);
  await coldPage.getByRole("button", { name: "🟨 New Equipment", exact: true }).click();
  const manufacturers = await coldPage.locator("#weaponManufacturer option").allTextContents();
  assert.equal(manufacturers.at(-1), "Other");
  assert.ok(manufacturers.indexOf("Aero Precision") < manufacturers.indexOf("BCM"));
  assert.ok(manufacturers.indexOf("Military M-Series Rifles") < manufacturers.indexOf("Remington"));
  await coldPage.locator("#weaponManufacturer").selectOption("Military M-Series Rifles");
  await coldPage.locator("#weaponModelType").selectOption("M16A2");
  await coldPage.locator("#weaponModelCaliber").selectOption("5.56 NATO");
  assert.equal(await coldPage.locator("#equipmentConfigurationId").inputValue(), "M16A2-STANDARD-IRON-FSP-REAR-DRUM");
  assert.equal(await coldPage.locator("#adjustmentProfileId").inputValue(), "M16A2-IRON-FSP-REAR-DRUM-ADJUSTMENT-PROFILE-2011");
  await coldPage.getByRole("button", { name: "Save to My Equipment", exact: true }).click();
  await coldPage.waitForURL(/m16a2-tstt\.html$/);
  assert.equal(await coldPage.locator("#chapterNumber").innerText(), "CHAPTER 2 OF 5");
  assert.equal(await coldPage.locator("#tsttApp").getAttribute("data-status"), "paused");

  await coldPage.locator("#shootingSetup").click();
  await coldPage.getByRole("link", { name: "EQUIPMENT LIBRARY", exact: true }).click();
  await coldPage.waitForURL(/matrix\.html/);
  await coldPage.getByRole("button", { name: "Selected", exact: true }).click();
  await coldPage.waitForURL(/m16a2-tstt\.html$/);
  assert.equal(await coldPage.locator("#chapterNumber").innerText(), "CHAPTER 2 OF 5");
  assert.equal(await coldPage.locator("#tsttApp").getAttribute("data-status"), "paused");
  assert.deepEqual(coldErrors, [], "cold-start Equipment Library round trip has no page errors");
  await coldContext.close();

  const generalContext = await browser.newContext({ viewport: { width: 390, height: 844 }, reducedMotion: "reduce" });
  const generalPage = await generalContext.newPage();
  await generalPage.addInitScript(() => {
    localStorage.setItem("SCZN3_ACTIVE_EQUIPMENT_PROFILE_ID", "cz-optic");
    localStorage.setItem("SCZN3_SAVED_EQUIPMENT_PROFILES", JSON.stringify([{
      setupId: "cz-optic", weaponCategory: "Rifle", weaponManufacturer: "CZ", weaponModelType: "Bolt Action",
      weaponModelCaliber: "CZ 600 .223 Rem", opticType: "Scope", opticBrand: "Vortex", opticModel: "Other"
    }]));
  });
  await generalPage.goto(`${baseUrl}/m16a2-tstt.html`, { waitUntil: "networkidle" });
  assert.equal(await generalPage.getByText("CURRENT EQUIPMENT", { exact: true }).count(), 0);
  assert.match(await generalPage.locator("#taskCard").innerText(), /TRAINING SETUP[\s\S]*M16A2 · Standard Iron Sights[\s\S]*some instructions may not apply/i);
  await generalPage.locator("#shootingSetup").click();
  assert.match(await generalPage.locator("#shootingSetupNote").innerText(), /Different equipment requires its own governed adjustment authority/);
  await generalPage.getByRole("button", { name: "START TRAINING", exact: true }).click();
  assert.equal(await generalPage.locator("#chapterList button:not([disabled])").count(), 5);
  assert.equal(await generalPage.getByRole("button", { name: /NEXT, WE'LL LEARN THE SIGHTS\./ }).count(), 1);
  assert.equal(await generalPage.getByRole("button", { name: "THIS MATCHES MY GEAR", exact: true }).count(), 0);
  await generalPage.locator('[data-control="chapters"]').click();
  await generalPage.getByRole("button", { name: /Ready for the first group/ }).click();
  assert.match(await generalPage.locator("#visualStage").innerText(), /PREFIRE TRAINING COMPLETE[\s\S]*Training setup: M16A2 with standard iron sights/);
  assert.doesNotMatch(await generalPage.locator("#visualStage").innerText(), /PREFIRE CHECK COMPLETE/);
  await generalContext.close();
} finally {
  await browser.close();
}

console.log("PASS Episode 60 Baker M16A2 pre-fire TSTT browser flow at 390px and 1440px");
