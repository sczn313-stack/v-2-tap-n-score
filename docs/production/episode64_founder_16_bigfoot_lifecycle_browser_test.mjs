import assert from "node:assert/strict";
import { createRequire } from "node:module";

const { chromium } = createRequire(import.meta.url)("playwright");
const origin = process.env.SCZN3_TEST_BASE_URL || "http://127.0.0.1:8159";
const authorityPort = new URL(origin).port;
const targetId = "blocker_baker_targets_gg_bigfoot";
const taps = [
  [.4562533820346321, .16973592551033473], [.5456067370129870, .17315105349020573],
  [.4970829951298701, .11980173787244680], [.39167343073593074, .33823486702566510],
  [.6339877570346321, .32842039377277780], [.6634114583333334, .62163903733266290],
  [.37822138798701296, .64513331701339510], [.23960024350649352, .71873543490726280],
  [.12362182088744590, .71394396533098430], [.12880478896103897, .45436851284964010],
  [.10453869047619047, .22642962257730820], [.24660951028138527, .14934163017291297],
  [.8313717532467533, .11093269552924133], [.9007034632034632, .23738890332627275],
  [.9579951298701299, .42274481364620180], [.8915973349567100, .76026364840260570],
  [.7735305059523809, .82124072632568840], [.3783059388528138, .80391425781764240],
  [.6319331709956710, .77027749824188850], [.2754075351731602, .27221549091761265],
  [.7324134199134200, .25827199287550280],
];

const browser = await chromium.launch({ headless: true });
try {
  const context = await browser.newContext({ viewport: { width: 1180, height: 900 } });
  const page = await context.newPage();
  page.setDefaultTimeout(15_000);
  const url = `${origin}/target-experience.html?missionFamily=targetScoring&target=${targetId}&source=registered&authorityPort=${authorityPort}&v=founder-16-bigfoot-2`;
  await page.goto(url, { waitUntil: "domcontentloaded" });
  await page.locator("#contractStatus").getByText("Target loaded. Tap your shot holes.", { exact: true }).waitFor();
  const surface = page.locator("#contractTapSurface");
  const box = await surface.boundingBox();
  assert.ok(box && box.width > 100 && box.height > 100, "Founder 16 target surface unavailable");
  for (const [xNorm, yNorm] of taps) await surface.click({ position: { x: box.width * xNorm, y: box.height * yNorm } });
  assert.equal(await page.locator(".contract-observation-marker").count(), 21);
  await page.getByRole("button", { name: "Show Result", exact: true }).click();
  const elapsedDialog = page.getByRole("dialog", { name: "Enter Time If Available" });
  if (await elapsedDialog.isVisible()) await elapsedDialog.getByRole("button", { name: "Untimed Result", exact: true }).click();
  await page.locator("#contractSecView").waitFor({ state: "visible" });

  const resultPane = page.locator(".contract-lifecycle-result");
  const resultText = await resultPane.innerText();
  assert.match(resultText, /11 HIT TAPS[\s\S]*10 OUTSIDE BIGFOOT AREAS[\s\S]*21 TOTAL TAPS/);
  assert.match(resultText, /Tap Accuracy:[\s\S]*52\.4%/i);
  assert.doesNotMatch(resultText, /Target Score|points|winner|maximum score|required sequence|kill|vital|wound|tactical/i);
  const details = resultPane.locator('[data-counting-details="true"]');
  await details.locator(":scope > summary").click();
  const detailsText = await details.innerText();
  for (const label of [
    "Left Eye — Red Area", "Right Eye — Red Area", "Head / Face", "Upper Torso / Chest",
    "Left Arm", "Right Arm", "Left Leg", "Right Leg",
  ]) assert.match(detailsText, new RegExp(label));
  assert.doesNotMatch(detailsText.split("All target regions")[0], /White Center|Abdomen/);
  const activeRows = details.locator(":scope > div > table tbody tr, :scope > div > .contract-counting-columns tbody tr");
  assert.equal(await activeRows.count(), 8, "only the eight active governed regions appear first");
  const allRegions = resultPane.locator('[data-all-target-regions="true"]');
  assert.equal(await allRegions.locator("tbody").isHidden(), true, "complete zero-inclusive detail remains collapsed by default");
  await allRegions.locator(":scope > summary").click();
  assert.equal(await allRegions.locator("tbody tr").count(), 11, "all 11 governed regions remain preserved in deep disclosure");
  assert.match(await allRegions.innerText(), /Left Eye — White Center[\s\S]*0[\s\S]*Right Eye — White Center[\s\S]*0[\s\S]*Abdomen[\s\S]*0/);

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
  assert.match(await currentRecord.innerText(), /11 HIT TAPS[\s\S]*10 OUTSIDE BIGFOOT AREAS[\s\S]*21 TOTAL TAPS/);

  await page.goto(new URL(exactHref, `${origin}/`).href, { waitUntil: "domcontentloaded" });
  await page.locator("#contractSecView").waitFor({ state: "visible" });
  assert.equal((await page.locator("#contractStatus").textContent()).trim(), "Saved Session Opened");
  assert.equal(await page.locator(".contract-observation-marker").count(), 21);
  const reopenedText = await page.locator(".contract-lifecycle-result").innerText();
  assert.match(reopenedText, /11 HIT TAPS[\s\S]*10 OUTSIDE BIGFOOT AREAS[\s\S]*21 TOTAL TAPS/);
  assert.doesNotMatch(reopenedText, /Target Score|points|winner|maximum score|required sequence|kill|vital|wound|tactical/i);
  console.log(`PASS Founder 16 TARGET → RESULT → SESSION/HISTORY → SAVE SEC → VAULT → EXACT REOPEN (${saved.session.sessionId})`);
} finally {
  await browser.close();
}
