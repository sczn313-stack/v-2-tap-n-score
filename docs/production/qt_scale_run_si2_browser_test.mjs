import assert from "node:assert/strict";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { chromium } = require("playwright");
const origin = process.env.SCZN3_QT_REVIEW_ORIGIN || "http://127.0.0.1:8119";
const target = "qt_printer13_product_1977883164745";
const url = `${origin}/target-experience.html?missionFamily=targetScoring&target=${target}&source=registered&authorityPort=8119&v=qt-scale-run-si2-founder-authority`;

async function clickNormalized(page, box, xNorm, yNorm) {
  await page.mouse.click(box.x + box.width * xNorm, box.y + box.height * yNorm);
}

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1200, height: 980 } });
try {
  await page.goto(url, { waitUntil: "domcontentloaded" });
  await page.locator("#contractStatus").getByText("Target loaded. Tap your shot holes.", { exact: true }).waitFor();
  const image = page.locator("#contractTargetImage");
  const box = await image.boundingBox();
  assert.ok(box, "SI-2 registered target must render");

  const points = [
    [.86, .271167], [.78, .271167], [.68, .20], [.52, .25],
    [.43, .50], [.52, .51],
    [.85, .751333], [.78, .751333], [.68, .68], [.52, .75],
    [.05, .05],
  ];
  for (const [x, y] of points) await clickNormalized(page, box, x, y);

  await page.getByRole("button", { name: "Show Result", exact: true }).click();
  await page.locator("#contractSecView").waitFor({ state: "visible" });
  const result = page.locator('#contractSecRoot [data-sec-component="result"]');
  const resultText = await result.innerText();
  const resultHtml = await result.innerHTML();
  assert.match(resultText, /TARGET SCORE\s+87/i);
  assert.match(resultText, /10 HIT TAPS[\s\S]*1 MISSED[\s\S]*11 TOTAL TAPS/i);
  assert.match(resultText, /90\.9%/);
  assert.match(resultText, /3 OF 3 OBJECTS HIT/i);
  assert.match(resultText, /SCORING ZONE UPPER[\s\S]*SMALL RED SQUARE CENTER[\s\S]*SCORING ZONE LOWER/i);

  await page.getByRole("button", { name: "Save SEC", exact: true }).click();
  const reopen = page.getByRole("link", { name: "Exact Reopen", exact: true });
  await reopen.waitFor({ state: "visible" });
  const reopenHref = await reopen.getAttribute("href");
  assert.ok(reopenHref);
  const sessionId = new URL(reopenHref, `${origin}/`).searchParams.get("session");
  assert.ok(sessionId);

  await page.goto(`${origin}/records.html?selected=${sessionId}&authorityPort=8119&v=qt-scale-run-si2-founder-authority`, { waitUntil: "domcontentloaded" });
  const vault = page.locator('article.vault-record-summary.is-selected .vault-approved-result-panel [data-sec-component="result"]');
  await vault.waitFor({ state: "visible" });
  assert.equal(await vault.innerHTML(), resultHtml, "Vault must preserve exact SI-2 RESULT");

  await page.goto(new URL(reopenHref, `${origin}/`).href, { waitUntil: "domcontentloaded" });
  await page.locator("#contractSecView").waitFor({ state: "visible" });
  const reopenedText = await page.locator('#contractSecRoot [data-sec-component="result"]').innerText();
  assert.match(reopenedText, /TARGET SCORE\s+87/i);
  assert.match(reopenedText, /10 HIT TAPS[\s\S]*1 MISSED[\s\S]*11 TOTAL TAPS/i);
  console.log(`PASS SI-2 Scoring → USM browser lifecycle; session ${sessionId}`);
} finally {
  await browser.close();
}
