import assert from "node:assert/strict";
import { createRequire } from "node:module";

const { chromium } = createRequire(import.meta.url)("playwright");
const origin = process.env.SCZN3_TEST_BASE_URL || "http://127.0.0.1:8161";
const authorityPort = new URL(origin).port;
const targetId = "blocker_baker_targets_z_bb";
const taps = [
  [.5065, .2760], [.4750, .2760],
  [.6070, .2460], [.6400, .2460],
  [.5650, .1550], [.6050, .3500], [.4500, .2300],
  [.4700, .7450], [.4850, .5500],
  [.1700, .5500], [.7900, .5200], [.5500, .9200],
  [.9400, .1000],
];

const browser = await chromium.launch({ headless: true });
try {
  const context = await browser.newContext({ viewport: { width: 1180, height: 900 } });
  const page = await context.newPage();
  page.setDefaultTimeout(15_000);
  const url = `${origin}/target-experience.html?missionFamily=targetScoring&target=${targetId}&source=registered&authorityPort=${authorityPort}&v=founder-20-brainy-brian-1`;
  await page.goto(url, { waitUntil: "domcontentloaded" });
  await page.locator("#contractStatus").getByText("Target loaded. Tap your shot holes.", { exact: true }).waitFor();
  const surface = page.locator("#contractTapSurface");
  const box = await surface.boundingBox();
  assert.ok(box && box.width > 100 && box.height > 100, "Founder 20 target surface unavailable");
  for (const [xNorm, yNorm] of taps) {
    await surface.click({ position: { x: box.width * xNorm, y: box.height * yNorm } });
  }
  assert.equal(await page.locator(".contract-observation-marker").count(), 13);
  await page.getByRole("button", { name: "Show Result", exact: true }).click();
  const elapsedDialog = page.getByRole("dialog", { name: "Enter Time If Available" });
  if (await elapsedDialog.isVisible()) {
    await elapsedDialog.getByRole("button", { name: "Untimed Result", exact: true }).click();
  }
  await page.locator("#contractSecView").waitFor({ state: "visible" });

  const resultPane = page.locator(".contract-lifecycle-result");
  const resultText = await resultPane.innerText();
  assert.match(resultText, /12 HIT TAPS[\s\S]*1 OUTSIDE BRAINY BRIAN AREAS[\s\S]*13 TOTAL TAPS/);
  assert.match(resultText, /Tap Accuracy:[\s\S]*92\.3%/i);
  assert.doesNotMatch(resultText, /Target Score|points|winner|maximum score|required sequence|kill|vital|wound|threat|tactical|X = 10/i);

  const details = resultPane.locator('[data-counting-details="true"]');
  await details.locator(":scope > summary").click();
  const detailsText = await details.innerText();
  for (const label of [
    "Left Eye — White Center", "Left Eye", "Right Eye — White Center", "Right Eye",
    "Exposed Brain", "Mouth / Teeth", "Exposed Abdomen / Intestines",
    "Head / Face", "Upper Torso", "Left Arm / Hand", "Right Arm / Hand", "Lower Body",
  ]) {
    assert.match(detailsText, new RegExp(label.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
  }
  const activeRows = details.locator(":scope > div > table tbody tr, :scope > div > .contract-counting-columns tbody tr");
  assert.equal(await activeRows.count(), 12, "all twelve active governed features appear in the positive-information drawer");
  const allRegions = resultPane.locator('[data-all-target-regions="true"]');
  assert.equal(await allRegions.count(), 0, "redundant zero-inclusive drawer is omitted when every governed region is active");

  const [saveResponse] = await Promise.all([
    page.waitForResponse(response => response.url().includes("/api/session/sec") && response.request().method() === "POST"),
    page.getByRole("button", { name: "Save SEC", exact: true }).click(),
  ]);
  assert.equal(saveResponse.status(), 201, `SAVE SEC failed: ${await saveResponse.text()}`);
  const saved = await saveResponse.json();
  assert.equal(saved.session.authorityPackage.scoring.objectResults.length, 12, "all governed regions remain preserved in authority");
  await page.getByRole("button", { name: "SEC Preserved", exact: true }).waitFor();
  const exactHref = await page.getByRole("link", { name: "Exact Reopen", exact: true }).getAttribute("href");
  assert.ok(exactHref?.includes("session=") && exactHref.includes("#secReopenCapability="));

  await page.getByLabel("Shooter Action Bar").getByRole("link", { name: "Ballistic Vault", exact: true }).click();
  await page.getByRole("heading", { name: "BALLISTIC VAULT", exact: true }).waitFor();
  const currentRecord = page.locator("article.vault-record-summary").first();
  await currentRecord.waitFor();
  assert.match(await currentRecord.innerText(), /12 HIT TAPS[\s\S]*1 OUTSIDE BRAINY BRIAN AREAS[\s\S]*13 TOTAL TAPS/);

  await page.goto(new URL(exactHref, `${origin}/`).href, { waitUntil: "domcontentloaded" });
  await page.locator("#contractSecView").waitFor({ state: "visible" });
  assert.equal((await page.locator("#contractStatus").textContent()).trim(), "Saved Session Opened");
  assert.equal(await page.locator(".contract-observation-marker").count(), 13);
  const reopenedText = await page.locator(".contract-lifecycle-result").innerText();
  assert.match(reopenedText, /12 HIT TAPS[\s\S]*1 OUTSIDE BRAINY BRIAN AREAS[\s\S]*13 TOTAL TAPS/);
  assert.doesNotMatch(reopenedText, /Target Score|points|winner|maximum score|required sequence|kill|vital|wound|threat|tactical|X = 10/i);
  console.log(`PASS Founder 20 TARGET → RESULT → SESSION/HISTORY → SAVE SEC → VAULT → EXACT REOPEN (${saved.session.sessionId})`);
} finally {
  await browser.close();
}
