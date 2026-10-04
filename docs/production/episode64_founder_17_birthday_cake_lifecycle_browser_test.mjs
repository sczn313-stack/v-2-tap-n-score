import assert from "node:assert/strict";
import { createRequire } from "node:module";

const { chromium } = createRequire(import.meta.url)("playwright");
const origin = process.env.SCZN3_TEST_BASE_URL || "http://127.0.0.1:8160";
const authorityPort = new URL(origin).port;
const targetId = "blocker_baker_targets_gf_birthday_cake";
const taps = [
  [.460, .560], // 100
  [.770, .380], // 75
  [.270, .650], // 50
  [.450, .720], // 30
  [.676, .710], // 25
  [.450, .160], // red balloon 20
  [.430, .800], // black base 20
  [.660, .120], // unnumbered yellow balloon
  [.790, .150], // unnumbered blue balloon
  [.920, .850], // background
  [.090, .120], [.160, .120], [.230, .120], [.300, .120],
  [.860, .250], [.910, .300], [.940, .400], [.940, .500],
  [.080, .820], [.150, .870], [.230, .900], [.820, .900], [.900, .920],
];
const expectedLabels = [
  "Cake Body — 100",
  "Party Hat — 75",
  "Left Character Area — 50",
  "Lower Face / Frosting — 30",
  "Right Strawberry — 25",
  "Red Balloon — 20",
  "Black Cake Base — 20",
];

const browser = await chromium.launch({ headless: true });
try {
  const context = await browser.newContext({ viewport: { width: 1180, height: 900 } });
  const page = await context.newPage();
  page.setDefaultTimeout(15_000);
  const url = `${origin}/target-experience.html?missionFamily=targetScoring&target=${targetId}&source=registered&authorityPort=${authorityPort}&v=founder-17-birthday-cake-1`;
  await page.goto(url, { waitUntil: "domcontentloaded" });
  await page.locator("#contractStatus").waitFor({ state: "visible" });
  await page.waitForTimeout(750);
  assert.equal((await page.locator("#contractStatus").innerText()).trim(), "Target loaded. Tap your shot holes.");
  const universalVault = page.locator(".platform-quick-nav").getByRole("link", { name: "Ballistic Vault", exact: true });
  assert.match(await universalVault.getAttribute("href"), /records\.html\?authorityPort=8160$/);
  await universalVault.click();
  const leaveDialog = page.getByRole("dialog", { name: "Leave Current Session?" });
  await leaveDialog.waitFor({ state: "visible" });
  await leaveDialog.getByRole("button", { name: "Stay Here", exact: true }).click();
  const surface = page.locator("#contractTapSurface");
  const box = await surface.boundingBox();
  assert.ok(box && box.width > 100 && box.height > 100, "Founder 17 target surface unavailable");
  for (const [xNorm, yNorm] of taps) await surface.click({ position: { x: box.width * xNorm, y: box.height * yNorm } });
  assert.equal(await page.locator(".contract-observation-marker").count(), 23);
  await page.getByRole("button", { name: "Show Result", exact: true }).click();
  const elapsedDialog = page.getByRole("dialog", { name: "Enter Time If Available" });
  if (await elapsedDialog.isVisible()) await elapsedDialog.getByRole("button", { name: "Untimed Result", exact: true }).click();
  await page.locator("#contractSecView").waitFor({ state: "visible" });

  const resultPane = page.locator(".contract-lifecycle-result");
  const resultText = await resultPane.innerText();
  assert.match(resultText, /Target Score[\s\S]*320/i);
  assert.match(resultText, /7 HIT TAPS[\s\S]*16 OUTSIDE SCORING AREA[\s\S]*23 TOTAL TAPS/);
  assert.doesNotMatch(resultText, /maximum score|winner|required sequence|shot limit|miss penalty|age rule|birthday game/i);
  const details = page.locator('#contractSecRoot details[data-numeric-region-detail="true"]');
  await details.locator("summary").click();
  const detailsText = await details.innerText();
  for (const label of expectedLabels) assert.match(detailsText, new RegExp(label));
  assert.match(detailsText, /Outside Scoring Area[\s\S]*Count only[\s\S]*16/);
  assert.doesNotMatch(detailsText, /Outside Scoring Area[\s\S]{0,120}0 points/);

  const [saveResponse] = await Promise.all([
    page.waitForResponse(response => response.url().includes("/api/session/sec") && response.request().method() === "POST"),
    page.getByRole("button", { name: "Save SEC", exact: true }).click(),
  ]);
  assert.equal(saveResponse.status(), 201, `SAVE SEC failed: ${await saveResponse.text()}`);
  const saved = await saveResponse.json();
  await page.getByRole("button", { name: "SEC Preserved", exact: true }).waitFor();
  const exactHref = await page.getByRole("link", { name: "Exact Reopen", exact: true }).getAttribute("href");
  assert.ok(exactHref?.includes("session=") && exactHref.includes("#secReopenCapability="));
  await universalVault.click();
  await page.getByRole("heading", { name: "BALLISTIC VAULT", exact: true }).waitFor();
  assert.equal(new URL(page.url()).searchParams.get("authorityPort"), authorityPort);
  const currentRecord = page.locator("article.vault-record-summary").first();
  await currentRecord.waitFor();
  assert.match(await currentRecord.innerText(), /320[\s\S]*7 HIT TAPS[\s\S]*16 OUTSIDE SCORING AREA[\s\S]*23 TOTAL TAPS/);
  const vaultExactReopen = await currentRecord.locator("a.vault-record-link").getAttribute("href");
  assert.ok(vaultExactReopen?.includes("authorityPort=8160") && vaultExactReopen.includes("#secReopenCapability="));
  await currentRecord.locator("a.vault-record-link").click();
  await page.locator("#contractSecView").waitFor({ state: "visible" });
  assert.equal((await page.locator("#contractStatus").textContent()).trim(), "Saved Session Opened");
  assert.equal(await page.locator(".contract-observation-marker").count(), 23);
  const reopenedText = await page.locator(".contract-lifecycle-result").innerText();
  assert.match(reopenedText, /Target Score[\s\S]*320/i);
  assert.match(reopenedText, /7 HIT TAPS[\s\S]*16 OUTSIDE SCORING AREA[\s\S]*23 TOTAL TAPS/);
  assert.doesNotMatch(reopenedText, /maximum score|winner|required sequence|shot limit|miss penalty|age rule|birthday game/i);
  const historyStage = page.locator("details[data-sec-region='history']");
  await historyStage.locator(":scope > summary").click();
  const history = historyStage.locator("[data-usm-section-content='true']");
  await history.waitFor({ state: "visible" });
  assert.equal(await history.locator("[data-usm-metric-trigger]").count(), 3);
  const pointsPerTap = history.locator("[data-usm-metric-trigger='points-per-tap']");
  assert.match(await pointsPerTap.innerText(), /POINTS PER TAP[\s\S]*13\.9/i);
  console.log(`PASS Founder 17 TARGET → RESULT → SESSION/HISTORY → SAVE SEC → VAULT → EXACT REOPEN (${saved.session.sessionId})`);
  console.log(`FOUNDER_URL ${url}`);
} finally {
  await browser.close();
}
