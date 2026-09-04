import assert from "node:assert/strict";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { chromium } = require("playwright");
const baseUrl = process.env.SCZN3_TEST_BASE_URL || "http://127.0.0.1:8093";
const browser = await chromium.launch({ headless: true, executablePath: process.env.SCZN3_CHROME_EXECUTABLE || undefined });

try {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, reducedMotion: "reduce" });
  const page = await context.newPage();
  const errors = [];
  page.on("pageerror", error => errors.push(error.message));
  await page.addInitScript(() => {
    window.__spoken = [];
    const voices = [
      { name: "Zarvox", lang: "en-US", localService: true },
      { name: "Daniel", lang: "en-GB", localService: true },
      { name: "Ava", lang: "en-US", localService: true },
      { name: "Reed (English (US))", lang: "en-US", localService: true },
      { name: "Alex", lang: "en-US", localService: true },
      { name: "Samantha", lang: "en-US", localService: true },
      { name: "Flo (English (US))", lang: "en-US", localService: true },
      { name: "Generic US", lang: "en-US", localService: true }
    ];
    Object.defineProperty(window, "speechSynthesis", { configurable: true, value: {
      getVoices() { return voices; },
      addEventListener() {},
      cancel() {},
      speak(utterance) { window.__spoken.push({ text: utterance.text, voice: utterance.voice?.name, rate: utterance.rate, pitch: utterance.pitch, volume: utterance.volume }); }
    } });
    Object.defineProperty(window, "SpeechSynthesisUtterance", { configurable: true, value: class { constructor(text) { this.text = text; } } });
  });

  await page.goto(`${baseUrl}/tstt-voice-audition.html`, { waitUntil: "networkidle" });
  assert.equal(await page.locator(".voice-sample").count(), 5);
  assert.deepEqual(await page.locator(".voice-name b").allTextContents(), ["Samantha", "Reed (English (US))", "Flo (English (US))", "Alex", "Ava"]);
  assert.match(await page.locator("#voiceStatus").innerText(), /5 DEVICE VOICES READY · SAMANTHA BASELINE INCLUDED/);

  const buttons = page.locator(".voice-sample button");
  for (let index = 0; index < 5; index += 1) await buttons.nth(index).click();
  const spoken = await page.evaluate(() => window.__spoken);
  const sentence = "Your group is two squares high and three squares left. We’ll use the sights to move the group to the center of the target.";
  assert.deepEqual(spoken.map(sample => sample.text), Array(5).fill(sentence));
  assert.deepEqual(spoken.map(sample => sample.voice), ["Samantha", "Reed (English (US))", "Flo (English (US))", "Alex", "Ava"]);
  assert.ok(spoken.every(sample => sample.rate === 0.70 && sample.pitch === 1 && sample.volume === 1));
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth), false);
  assert.deepEqual(errors, []);
  await context.close();
} finally {
  await browser.close();
}

console.log("PASS Episode 60 TSTT Founder voice audition at 390px");
