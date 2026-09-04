import assert from "node:assert/strict";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { chromium } = require("playwright");
const baseUrl = process.env.SCZN3_TEST_BASE_URL || "http://127.0.0.1:8094";
const browser = await chromium.launch({ headless: true, executablePath: process.env.SCZN3_CHROME_EXECUTABLE || undefined });

try {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, reducedMotion: "reduce" });
  const page = await context.newPage();
  const errors = [];
  page.on("pageerror", error => errors.push(error.message));
  await page.addInitScript(() => {
    window.__spoken = [];
    const voices = [
      { name: "Samantha", lang: "en-US", voiceURI: "z-device-first-samantha", localService: true },
      { name: "Samantha", lang: "en-US", voiceURI: "a-uri-sorted-samantha", localService: true },
      { name: "Reed (English (US))", lang: "en-US", voiceURI: "reed", localService: true }
    ];
    Object.defineProperty(window, "speechSynthesis", { configurable: true, value: {
      getVoices() { return voices; },
      addEventListener() {},
      cancel() {},
      speak(utterance) { window.__spoken.push({ text: utterance.text, voiceURI: utterance.voice?.voiceURI, rate: utterance.rate, pitch: utterance.pitch, volume: utterance.volume }); }
    } });
    Object.defineProperty(window, "SpeechSynthesisUtterance", { configurable: true, value: class { constructor(text) { this.text = text; } } });
  });

  await page.goto(`${baseUrl}/tstt-samantha-ab.html`, { waitUntil: "networkidle" });
  assert.equal(await page.locator("#originalVoiceIdentity").innerText(), "Samantha · en-US · z-device-first-samantha");
  assert.equal(await page.locator("#productionVoiceIdentity").innerText(), "Samantha · en-US · a-uri-sorted-samantha");
  await page.locator("#playOriginal").click();
  await page.locator("#playProduction").click();

  const spoken = await page.evaluate(() => window.__spoken);
  const sentence = "Your group is two squares high and three squares left. We’ll use the sights to move the group to the center of the target.";
  assert.deepEqual(spoken.map(sample => sample.text), [sentence, sentence]);
  assert.deepEqual(spoken.map(sample => sample.voiceURI), ["z-device-first-samantha", "a-uri-sorted-samantha"]);
  assert.ok(spoken.every(sample => sample.rate === 0.70 && sample.pitch === 1 && sample.volume === 1));
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth), false);
  assert.deepEqual(errors, []);
  await context.close();
} finally {
  await browser.close();
}

console.log("PASS Episode 60 TSTT Samantha A/B at 390px");
