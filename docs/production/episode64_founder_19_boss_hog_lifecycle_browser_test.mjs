import assert from "node:assert/strict";
import { createRequire } from "node:module";

const { chromium } = createRequire(import.meta.url)("playwright");
const origin = process.env.SCZN3_TEST_BASE_URL || "http://127.0.0.1:8161";
const authorityPort = new URL(origin).port;
const targetId = "blocker_baker_targets_gf_bosshog";
const taps = [
  [.452,.190], [.455,.790], [.174,.442], [.676,.440],
  [.176,.660], [.700,.663], [.181,.915], [.715,.920], [.930,.120],
];
const expectedLabels = [
  "Head — 8", "Center Body — 8", "Left Upper — 2", "Right Upper — 2",
  "Left Middle — 4", "Right Middle — 4", "Left Lower — 6", "Right Lower — 6",
];

const browser = await chromium.launch({ headless: true });
try {
  const context = await browser.newContext({ viewport: { width: 1180, height: 900 } });
  const page = await context.newPage();
  page.setDefaultTimeout(15_000);
  const url = `${origin}/target-experience.html?missionFamily=targetScoring&target=${targetId}&source=registered&authorityPort=${authorityPort}&v=founder-19-boss-hog-1`;
  await page.goto(url, { waitUntil: "domcontentloaded" });
  await page.locator("#contractStatus").waitFor({ state: "visible" });
  await page.waitForTimeout(750);
  assert.equal((await page.locator("#contractStatus").innerText()).trim(), "Target loaded. Tap your shot holes.");
  const surface = page.locator("#contractTapSurface");
  const box = await surface.boundingBox();
  assert.ok(box && box.width > 100 && box.height > 100, "Founder 19 target surface unavailable");
  for (const [xNorm, yNorm] of taps) await surface.click({ position: { x: box.width * xNorm, y: box.height * yNorm } });
  assert.equal(await page.locator(".contract-observation-marker").count(), 9);
  await page.getByRole("button", { name: "Show Result", exact: true }).click();
  const elapsedDialog = page.getByRole("dialog", { name: "Enter Time If Available" });
  if (await elapsedDialog.isVisible()) await elapsedDialog.getByRole("button", { name: "Untimed Result", exact: true }).click();
  await page.locator("#contractSecView").waitFor({ state: "visible" });

  const resultPane = page.locator(".contract-lifecycle-result");
  const resultText = await resultPane.innerText();
  assert.match(resultText, /Target Score[\s\S]*40/i);
  assert.match(resultText, /8 HIT TAPS[\s\S]*1 OUTSIDE SCORING AREA[\s\S]*9 TOTAL TAPS/);
  assert.doesNotMatch(resultText, /maximum score|winner|required sequence|shot limit|miss penalty|game procedure|vital|wound|kill/i);
  const details = page.locator('#contractSecRoot details[data-numeric-region-detail="true"]');
  await details.locator("summary").click();
  const detailsText = await details.innerText();
  for (const label of expectedLabels) assert.match(detailsText, new RegExp(label));
  assert.match(detailsText, /Outside Scoring Area[\s\S]*Count only[\s\S]*1/);

  const [saveResponse] = await Promise.all([
    page.waitForResponse(response => response.url().includes("/api/session/sec") && response.request().method() === "POST"),
    page.getByRole("button", { name: "Save SEC", exact: true }).click(),
  ]);
  assert.equal(saveResponse.status(), 201, `SAVE SEC failed: ${await saveResponse.text()}`);
  const saved = await saveResponse.json();
  const authority = saved.session.authorityPackage;
  assert.equal(authority.scoring.total, 40);
  assert.equal(authority.ballisticGeometry.classificationMethod, "observation_footprint_touch");
  assert.equal(authority.ballisticGeometry.scoreOnTouch.enabled, true);
  assert.equal(authority.ballisticGeometry.displayMarkerParticipatesInScoring, false);
  await page.getByRole("button", { name: "SEC Preserved", exact: true }).waitFor();
  const exactHref = await page.getByRole("link", { name: "Exact Reopen", exact: true }).getAttribute("href");
  assert.ok(exactHref?.includes("session=") && exactHref.includes("#secReopenCapability="));
  await page.getByLabel("Shooter Action Bar").getByRole("link", { name: "Ballistic Vault", exact: true }).click();
  await page.getByRole("heading", { name: "BALLISTIC VAULT", exact: true }).waitFor();
  const currentRecord = page.locator("article.vault-record-summary").first();
  await currentRecord.waitFor();
  assert.match(await currentRecord.innerText(), /40[\s\S]*8 HIT TAPS[\s\S]*1 OUTSIDE SCORING AREA[\s\S]*9 TOTAL TAPS/);

  await page.goto(new URL(exactHref, `${origin}/`).href, { waitUntil: "domcontentloaded" });
  await page.locator("#contractSecView").waitFor({ state: "visible" });
  assert.equal((await page.locator("#contractStatus").textContent()).trim(), "Saved Session Opened");
  assert.equal(await page.locator(".contract-observation-marker").count(), 9);
  const reopenedText = await page.locator(".contract-lifecycle-result").innerText();
  assert.match(reopenedText, /Target Score[\s\S]*40/i);
  assert.match(reopenedText, /8 HIT TAPS[\s\S]*1 OUTSIDE SCORING AREA[\s\S]*9 TOTAL TAPS/);
  console.log(`PASS Founder 19 TARGET → RESULT → SESSION/HISTORY → SAVE SEC → VAULT → EXACT REOPEN (${saved.session.sessionId})`);
  console.log(`FOUNDER_URL ${url}`);
} finally {
  await browser.close();
}
