import assert from "node:assert/strict";
import { createRequire } from "node:module";

const { chromium } = createRequire(import.meta.url)("playwright");
const origin = process.env.SCZN3_TEST_BASE_URL || "http://127.0.0.1:8163";
const authorityPort = new URL(origin).port;
const targetId = "blocker_baker_targets_gf_bullshot";
const taps = [
  [.525, .250], [.365, .570], [.610, .570], [.490, .900], [.280, .820],
  [.700, .820], [.255, .490], [.715, .490], [.190, .900], [.820, .820],
  [.950, .120],
];

const browser = await chromium.launch({ headless: true });
try {
  const context = await browser.newContext({ viewport: { width: 1180, height: 900 } });
  const page = await context.newPage();
  page.setDefaultTimeout(15_000);
  const url = `${origin}/target-experience.html?missionFamily=targetScoring&target=${targetId}&source=registered&authorityPort=${authorityPort}&v=founder-21-bull-shot-browser-proof`;
  await page.goto(url, { waitUntil: "domcontentloaded" });
  await page.locator("#contractStatus").getByText("Target loaded. Tap your shot holes.", { exact: true }).waitFor();
  const surface = page.locator("#contractTapSurface");
  const box = await surface.boundingBox();
  assert.ok(box && box.width > 100 && box.height > 100, "Founder 21 target surface unavailable");
  for (const [xNorm, yNorm] of taps) {
    await surface.click({ position: { x: box.width * xNorm, y: box.height * yNorm } });
  }
  assert.equal(await page.locator(".contract-observation-marker").count(), 11);
  await page.getByRole("button", { name: "Show Result", exact: true }).click();
  const elapsedDialog = page.getByRole("dialog", { name: "Enter Time If Available" });
  if (await elapsedDialog.isVisible()) {
    await elapsedDialog.getByRole("button", { name: "Untimed Result", exact: true }).click();
  }
  await page.locator("#contractSecView").waitFor({ state: "visible" });

  const resultPane = page.locator(".contract-lifecycle-result");
  const resultText = await resultPane.innerText();
  assert.match(resultText, /TARGET SCORE[\s\S]*60/i);
  assert.match(resultText, /10 HIT TAPS[\s\S]*1 OUTSIDE SCORING AREA[\s\S]*11 TOTAL TAPS/);
  assert.match(resultText, /90\.9%/);

  const [saveResponse] = await Promise.all([
    page.waitForResponse(response => response.url().includes("/api/session/sec") && response.request().method() === "POST"),
    page.getByRole("button", { name: "Save SEC", exact: true }).click(),
  ]);
  assert.equal(saveResponse.status(), 201, `SAVE SEC failed: ${await saveResponse.text()}`);
  const saved = await saveResponse.json();
  assert.equal(saved.session.authorityPackage.scoring.total, 60);
  assert.equal(saved.session.authorityPackage.scoring.observationCount, 11);
  const exactHref = await page.getByRole("link", { name: "Exact Reopen", exact: true }).getAttribute("href");
  assert.ok(exactHref?.includes("session=") && exactHref.includes("#secReopenCapability="));

  await page.getByLabel("Shooter Action Bar").getByRole("link", { name: "Ballistic Vault", exact: true }).click();
  await page.getByRole("heading", { name: "BALLISTIC VAULT", exact: true }).waitFor();
  const currentRecord = page.locator("article.vault-record-summary").first();
  await currentRecord.waitFor();
  assert.match(await currentRecord.innerText(), /TARGET SCORE[\s\S]*60[\s\S]*10 HIT TAPS[\s\S]*1 OUTSIDE SCORING AREA[\s\S]*11 TOTAL TAPS/i);

  await page.goto(new URL(exactHref, `${origin}/`).href, { waitUntil: "domcontentloaded" });
  await page.locator("#contractSecView").waitFor({ state: "visible" });
  assert.equal((await page.locator("#contractStatus").textContent()).trim(), "Saved Session Opened");
  assert.equal(await page.locator(".contract-observation-marker").count(), 11);
  const reopenedText = await page.locator(".contract-lifecycle-result").innerText();
  assert.match(reopenedText, /TARGET SCORE[\s\S]*60/i);
  assert.match(reopenedText, /10 HIT TAPS[\s\S]*1 OUTSIDE SCORING AREA[\s\S]*11 TOTAL TAPS/);
  console.log(`PASS Founder 21 TARGET → RESULT → SESSION/HISTORY → SAVE SEC → VAULT → EXACT REOPEN (${saved.session.sessionId})`);
} finally {
  await browser.close();
}
