import assert from "node:assert/strict";
import { createRequire } from "node:module";

const { chromium } = createRequire(import.meta.url)("playwright");
const origin = process.env.SCZN3_TEST_BASE_URL || "http://127.0.0.1:8158";
const authorityPort = new URL(origin).port;
const targetId = "blocker_baker_targets_gf_balloons";
const balloons = [
  [145 / 741, 207 / 1000], [408 / 741, 154 / 1000], [614 / 741, 280 / 1000], [286 / 741, 427 / 1000],
  [490 / 741, 521 / 1000], [136 / 741, 650 / 1000], [355 / 741, 788 / 1000], [600 / 741, 736 / 1000],
];
const taps = [
  balloons[0], balloons[1],
  [balloons[2][0] + 28 / 741, balloons[2][1]],
  [balloons[3][0] + 47 / 741, balloons[3][1]],
  [balloons[4][0] + 63 / 741, balloons[4][1]],
  [balloons[5][0] + 79 / 741, balloons[5][1]],
  [balloons[6][0] + 94 / 741, balloons[6][1]],
  [balloons[7][0] + 28 / 741, balloons[7][1]],
  [.95, .95],
];

const browser = await chromium.launch({ headless: true });
try {
  const context = await browser.newContext({ viewport: { width: 1180, height: 900 } });
  const page = await context.newPage();
  page.setDefaultTimeout(15_000);
  const url = `${origin}/target-experience.html?missionFamily=targetScoring&target=${targetId}&source=registered&authorityPort=${authorityPort}&v=founder-14-balloons-1`;
  await page.goto(url, { waitUntil: "domcontentloaded" });
  await page.locator("#contractStatus").waitFor({ state: "visible" });
  await page.waitForTimeout(600);
  assert.equal((await page.locator("#contractStatus").innerText()).trim(), "Target loaded. Tap your shot holes.");
  const surface = page.locator("#contractTapSurface");
  const box = await surface.boundingBox();
  assert.ok(box && box.width > 100 && box.height > 100, "Founder 14 target surface unavailable");
  for (const [xNorm, yNorm] of taps) await surface.click({ position: { x: box.width * xNorm, y: box.height * yNorm } });
  assert.equal(await page.locator(".contract-observation-marker").count(), 9);
  await page.getByRole("button", { name: "Show Result", exact: true }).click();
  const elapsedDialog = page.getByRole("dialog", { name: "Enter Time If Available" });
  if (await elapsedDialog.isVisible()) await elapsedDialog.getByRole("button", { name: "Untimed Result", exact: true }).click();
  await page.locator("#contractSecView").waitFor({ state: "visible" });

  const resultPane = page.locator(".contract-lifecycle-result");
  const resultText = await resultPane.innerText();
  assert.match(resultText, /SCZN3 Target Score[\s\S]*64-2X/i);
  assert.match(resultText, /8 of 8 balloons popped/i);
  assert.match(resultText, /8 HIT TAPS[\s\S]*1 OUTSIDE BALLOON AREAS[\s\S]*9 TOTAL TAPS/i);
  assert.match(resultText, /Aggregate ring distribution[\s\S]*X · SCZN3-derived 10[\s\S]*2 hits · 20 points[\s\S]*9[\s\S]*2 hits · 18 points/i);
  assert.match(resultText, /Pink Balloon[\s\S]*Green Balloon[\s\S]*Red Balloon[\s\S]*Blue Balloon[\s\S]*Yellow Balloon[\s\S]*Purple Balloon[\s\S]*Orange Balloon[\s\S]*Teal Balloon/i);
  assert.doesNotMatch(resultText, /shot quota|required sequence|miss penalty|tie-break|winner rule|X.*10 points/i);

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
  assert.match(vaultText, /64-2X/i);
  assert.match(vaultText, /8 HIT TAPS[\s\S]*1 OUTSIDE BALLOON AREAS[\s\S]*9 TOTAL TAPS/i);

  await page.goto(new URL(exactHref, `${origin}/`).href, { waitUntil: "domcontentloaded" });
  await page.locator("#contractSecView").waitFor({ state: "visible" });
  assert.equal((await page.locator("#contractStatus").textContent()).trim(), "Saved Session Opened");
  assert.equal(await page.locator(".contract-observation-marker").count(), 9);
  const reopenedText = await page.locator(".contract-lifecycle-result").innerText();
  assert.match(reopenedText, /SCZN3 Target Score[\s\S]*64-2X/i);
  assert.match(reopenedText, /8 of 8 balloons popped/i);
  assert.match(reopenedText, /Aggregate ring distribution[\s\S]*2 hits · 20 points/i);

  const historyStage = page.locator("details[data-sec-region='history']");
  await historyStage.locator(":scope > summary").click();
  const history = historyStage.locator("[data-usm-section-content='true']");
  await history.waitFor({ state: "visible" });
  const metricButtons = history.locator("[data-usm-metric-trigger]");
  assert.equal(await metricButtons.count(), 3, "HISTORY first surface must retain SCORE, HIT RATE, and POINTS PER TAP");
  assert.equal(await history.locator("[data-usm-metric-panel]:visible").count(), 0, "rich HISTORY drawers must be closed by default");

  const scoreButton = history.locator("[data-usm-metric-trigger='score']");
  const scoreCue = scoreButton.locator(".contract-usm-disclosure-cue");
  const cueContent = cue => cue.evaluate(node => getComputedStyle(node, "::after").content.replaceAll('"', ""));
  assert.equal(await cueContent(scoreCue), "⌄", "closed Score drawer uses the down disclosure chevron");
  await scoreButton.focus();
  await scoreButton.press("Enter");
  assert.equal(await scoreButton.getAttribute("aria-expanded"), "true", "keyboard activation opens the entire Score card");
  assert.equal(await cueContent(scoreCue), "⌃", "open Score drawer immediately uses the up disclosure chevron");
  await scoreButton.press("Enter");
  assert.equal(await scoreButton.getAttribute("aria-expanded"), "false", "second keyboard activation closes the Score drawer");
  assert.equal(await cueContent(scoreCue), "⌄", "closed Score drawer immediately restores the down disclosure chevron");
  await scoreButton.click();
  const scorePanel = history.locator("[data-usm-metric-panel='score']");
  await scorePanel.waitFor({ state: "visible" });
  assert.equal(await scorePanel.locator(":scope > .contract-usm-detail-list > li").count(), 7, "Score opens the compact X/10, 9, 8, 7, 6, 5, and outside breakdown");
  assert.equal(await scorePanel.locator(".contract-usm-all-regions li").count(), 49, "all 48 governed balloon regions plus outside remain preserved one level deeper");
  const objectScoreDetail = scorePanel.locator(".contract-usm-deep-detail").first();
  await objectScoreDetail.locator("summary").click();
  assert.equal(await objectScoreDetail.locator(".contract-usm-object-grid article").count(), 8, "Score preserves expandable per-balloon detail");
  assert.equal(await objectScoreDetail.locator(".contract-usm-object-grid").evaluate(node => getComputedStyle(node).gridTemplateColumns.split(" ").length), 2, "desktop per-balloon detail uses two columns");

  await history.locator("[data-usm-metric-trigger='hit-rate']").click();
  assert.equal(await scorePanel.isHidden(), true, "opening another summary drawer closes the previous drawer");
  assert.equal(await cueContent(scoreCue), "⌄", "exclusive opening restores the previous card's down chevron");
  const hitPanel = history.locator("[data-usm-metric-panel='hit-rate']");
  assert.equal(await cueContent(history.locator("[data-usm-metric-trigger='hit-rate'] .contract-usm-disclosure-cue")), "⌃", "Hit Rate card exposes its open state");
  assert.match(await hitPanel.innerText(), /8 \/ 8/);
  await hitPanel.locator(".contract-usm-deep-detail summary").click();
  assert.equal(await hitPanel.locator(".contract-usm-object-grid article").count(), 8, "Hit Rate preserves per-balloon engagement");

  await page.setViewportSize({ width: 390, height: 844 });
  assert.equal(await hitPanel.locator(".contract-usm-object-grid").evaluate(node => getComputedStyle(node).gridTemplateColumns.split(" ").length), 1, "390px per-balloon detail collapses to one column");
  await history.locator("[data-usm-metric-trigger='points-per-tap']").click();
  assert.equal(await cueContent(history.locator("[data-usm-metric-trigger='points-per-tap'] .contract-usm-disclosure-cue")), "⌃", "Points per Tap card exposes its open state at 390px");
  assert.match(await history.locator("[data-usm-metric-panel='points-per-tap']").innerText(), /EFFICIENCY & DISTRIBUTION[\s\S]*64[\s\S]*9[\s\S]*7\.1/);
  console.log(`PASS Founder 14 TARGET → RESULT → SESSION/HISTORY → SAVE SEC → VAULT → EXACT REOPEN (${saved.session.sessionId})`);
  console.log("PASS shared HISTORY progressive disclosure: summary first → drawer → per-balloon/region detail · desktop + 390px");
  console.log(`FOUNDER_URL ${url}`);
} finally {
  await browser.close();
}
