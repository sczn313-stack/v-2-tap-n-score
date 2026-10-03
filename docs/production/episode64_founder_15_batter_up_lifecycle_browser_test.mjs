import assert from "node:assert/strict";
import { createRequire } from "node:module";

const { chromium } = createRequire(import.meta.url)("playwright");
const origin = process.env.SCZN3_TEST_BASE_URL || "http://127.0.0.1:8158";
const authorityPort = new URL(origin).port;
const targetId = "blocker_baker_targets_gf_batterup";
const taps = [
  [98 / 1141, 153 / 1523], [570 / 1141, 302 / 1523], [166 / 1141, 610 / 1523],
  [570 / 1141, 549 / 1523], [570 / 1141, 1270 / 1523], [356 / 1141, 507 / 1523],
  [570 / 1141, 430 / 1523], [100 / 1141, 1150 / 1523], [888 / 1141, 1033 / 1523],
  [950 / 1141, 1033 / 1523], [570 / 1141, 1030 / 1523], [.50, .02],
];

const browser = await chromium.launch({ headless: true });
try {
  const context = await browser.newContext({ viewport: { width: 1180, height: 900 } });
  const page = await context.newPage();
  page.setDefaultTimeout(15_000);
  const url = `${origin}/target-experience.html?missionFamily=targetScoring&target=${targetId}&source=registered&authorityPort=${authorityPort}&v=founder-15-batter-up-1`;
  await page.goto(url, { waitUntil: "domcontentloaded" });
  await page.locator("#contractStatus").waitFor({ state: "visible" });
  await page.waitForTimeout(600);
  assert.equal((await page.locator("#contractStatus").innerText()).trim(), "Target loaded. Tap your shot holes.");
  const surface = page.locator("#contractTapSurface");
  const box = await surface.boundingBox();
  assert.ok(box && box.width > 100 && box.height > 100, "Founder 15 target surface unavailable");
  for (const [xNorm, yNorm] of taps) await surface.click({ position: { x: box.width * xNorm, y: box.height * yNorm } });
  assert.equal(await page.locator(".contract-observation-marker").count(), 12);
  await page.getByRole("button", { name: "Show Result", exact: true }).click();
  const elapsedDialog = page.getByRole("dialog", { name: "Enter Time If Available" });
  if (await elapsedDialog.isVisible()) await elapsedDialog.getByRole("button", { name: "Untimed Result", exact: true }).click();
  await page.locator("#contractSecView").waitFor({ state: "visible" });

  const resultPane = page.locator(".contract-lifecycle-result");
  let resultText = await resultPane.innerText();
  assert.match(resultText, /11 HIT TAPS[\s\S]*1 OUTSIDE BASEBALL AREAS[\s\S]*12 TOTAL TAPS/i);
  await resultPane.locator("details[data-counting-details='true'] > summary").click();
  resultText = await resultPane.innerText();
  assert.match(resultText, /OUTCOME AREAS HIT/i);
  assert.match(resultText, /Baseball Outcome Distribution[\s\S]*Home Run[\s\S]*Triple[\s\S]*Double[\s\S]*Single[\s\S]*Base on Balls[\s\S]*Safe Base Center[\s\S]*Strike[\s\S]*Foul Ball[\s\S]*Out/i);
  assert.match(resultText, /Home Run — Left[\s\S]*Triple — Center[\s\S]*Pitcher — Out/i);
  assert.doesNotMatch(resultText.split("All target regions")[0], /Home Run — Right|Triple — Left|engaged/i);
  const activeRows = resultPane.locator("details[data-counting-details='true'] > div > table tbody tr, details[data-counting-details='true'] > div > .contract-counting-columns tbody tr");
  assert.equal(await activeRows.count(), 11, "primary breakdown shows only the 11 active outcome areas");
  const allRegions = resultPane.locator("details[data-all-target-regions='true']");
  assert.equal(await allRegions.locator("tbody").isHidden(), true, "all-region table stays collapsed by default");
  await allRegions.locator(":scope > summary").click();
  assert.equal(await allRegions.locator("tbody tr").count(), 24, "all 24 region records remain available beneath the activity-first view");
  assert.match(await allRegions.innerText(), /Home Run — Right[\s\S]*0/i);
  assert.doesNotMatch(resultText, /Target Score|innings|baserunner advancement|runs scored|batting order|winner/i);

  const [saveResponse] = await Promise.all([
    page.waitForResponse(response => response.url().includes("/api/session/sec") && response.request().method() === "POST"),
    page.getByRole("button", { name: "Save SEC", exact: true }).click(),
  ]);
  assert.equal(saveResponse.status(), 201, `SAVE SEC failed: ${await saveResponse.text()}`);
  const saved = await saveResponse.json();
  await page.getByRole("button", { name: "SEC Preserved", exact: true }).waitFor();
  const exactHref = await page.getByRole("link", { name: "Exact Reopen", exact: true }).getAttribute("href");
  assert.ok(exactHref?.includes("session=") && exactHref.includes("#secReopenCapability="));
  await page.getByLabel("Shooter Action Bar").getByRole("link", { name: "Ballistic Vault", exact: true }).click();
  await page.getByRole("heading", { name: "BALLISTIC VAULT", exact: true }).waitFor();
  const currentRecord = page.locator("article.vault-record-summary").first();
  await currentRecord.waitFor();
  const vaultText = await currentRecord.innerText();
  assert.match(vaultText, /11 HIT TAPS[\s\S]*1 OUTSIDE BASEBALL AREAS[\s\S]*12 TOTAL TAPS/i);

  await page.goto(new URL(exactHref, `${origin}/`).href, { waitUntil: "domcontentloaded" });
  await page.locator("#contractSecView").waitFor({ state: "visible" });
  assert.equal((await page.locator("#contractStatus").textContent()).trim(), "Saved Session Opened");
  assert.equal(await page.locator(".contract-observation-marker").count(), 12);
  const reopenedText = await page.locator(".contract-lifecycle-result").innerText();
  assert.match(reopenedText, /11 HIT TAPS[\s\S]*1 OUTSIDE BASEBALL AREAS[\s\S]*12 TOTAL TAPS/i);
  await page.locator(".contract-lifecycle-result details[data-counting-details='true'] > summary").click();
  const reopenedDetailText = await page.locator(".contract-lifecycle-result").innerText();
  assert.match(reopenedDetailText, /Baseball Outcome Distribution[\s\S]*Home Run[\s\S]*Out/i);
  assert.doesNotMatch(reopenedText, /Target Score|innings|baserunner advancement|runs scored|batting order|winner/i);

  await page.setViewportSize({ width: 390, height: 844 });
  assert.equal(await page.locator(".contract-observation-marker").count(), 12);
  assert.ok((await resultPane.boundingBox())?.width <= 390, "390px result must remain within the viewport");
  console.log(`PASS Founder 15 TARGET → RESULT → SESSION/HISTORY → SAVE SEC → VAULT → EXACT REOPEN (${saved.session.sessionId})`);
  console.log("PASS publisher baseball outcome distribution + complete observation accounting · desktop + 390px");
  console.log(`FOUNDER_URL ${url}`);
} finally {
  await browser.close();
}
