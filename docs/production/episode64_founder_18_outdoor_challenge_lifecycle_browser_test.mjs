import assert from "node:assert/strict";
import { createRequire } from "node:module";

const { chromium } = createRequire(import.meta.url)("playwright");
const origin = process.env.SCZN3_TEST_BASE_URL || "http://127.0.0.1:8161";
const authorityPort = new URL(origin).port;
// Founder #18's walk identity is the Blast Pack occurrence; all three exact-face
// identities are proven by the backend population test.
const targetId = "final_collection_baker_targets_pk_blastpack_001";
const taps = [
  [.856737,.924993], [.469663,.935202], [.838415,.732085], [.700986,.725718], [.488045,.684778],
  [.674090,.629741], [.377892,.789459], [.133024,.908372], [.135569,.699152], [.794837,.485117],
  [.378830,.451985], [.548515,.344569], [.703793,.244066], [.457555,.193669], [.227636,.326989],
  [.052438,.203299], [.039181,.283178], [.044068,.397411], [.922797,.223763], [.946877,.303899],
  [.955357,.430048],
];

const browser = await chromium.launch({ headless: true });
try {
  const context = await browser.newContext({ viewport: { width: 1180, height: 900 } });
  const page = await context.newPage();
  page.setDefaultTimeout(15_000);
  const url = `${origin}/target-experience.html?missionFamily=targetScoring&target=${targetId}&source=registered&authorityPort=${authorityPort}&v=founder-18-outdoor-challenge-1`;
  await page.goto(url, { waitUntil: "domcontentloaded" });
  await page.locator("#contractStatus").waitFor({ state: "visible" });
  await page.waitForTimeout(750);
  assert.equal((await page.locator("#contractStatus").innerText()).trim(), "Target loaded. Tap your shot holes.");
  const surface = page.locator("#contractTapSurface");
  const box = await surface.boundingBox();
  assert.ok(box && box.width > 100 && box.height > 100, "Founder 18 target surface unavailable");
  for (const [xNorm, yNorm] of taps) await surface.click({ position: { x: box.width * xNorm, y: box.height * yNorm } });
  assert.equal(await page.locator(".contract-observation-marker").count(), 21);
  await page.getByRole("button", { name: "Show Result", exact: true }).click();
  const elapsedDialog = page.getByRole("dialog", { name: "Enter Time If Available" });
  if (await elapsedDialog.isVisible()) await elapsedDialog.getByRole("button", { name: "Untimed Result", exact: true }).click();
  await page.locator("#contractSecView").waitFor({ state: "visible" });

  const resultPane = page.locator(".contract-lifecycle-result");
  const resultText = await resultPane.innerText();
  assert.match(resultText, /15 HIT TAPS[\s\S]*6 OUTSIDE RED AIM AREAS[\s\S]*21 TOTAL TAPS/);
  assert.match(resultText, /Tap Accuracy:[\s\S]*71\.4%/i);
  assert.match(resultText, /Aim Areas Hit:[\s\S]*100%[\s\S]*15 of 15 aim areas hit/i);
  assert.doesNotMatch(resultText, /Target Score|points|winner|miss penalty|shot quota|reward rule|\$10,000/i);
  const details = resultPane.locator('[data-counting-details="true"]');
  await details.locator("summary").click();
  const detailsText = await details.innerText();
  for (const label of ["Flying Bird", "Wanted Poster Silhouette", "Brewery Bottle", "Lower Right Rabbit", "Lower Center Snake"]) {
    assert.match(detailsText, new RegExp(`${label}\\s+1`, "i"));
  }
  assert.match(detailsText, /Scene distribution and completion[\s\S]*Tree Canopy — 6 hits[\s\S]*Lower Challenge Scene — 9 hits/i);

  const [saveResponse] = await Promise.all([
    page.waitForResponse(response => response.url().includes("/api/session/sec") && response.request().method() === "POST"),
    page.getByRole("button", { name: "Save SEC", exact: true }).click(),
  ]);
  assert.equal(saveResponse.status(), 201, `SAVE SEC failed: ${await saveResponse.text()}`);
  const saved = await saveResponse.json();
  const authority = saved.session.authorityPackage;
  assert.equal(authority.ballisticGeometry.classificationMethod, "observation_footprint_touch");
  assert.equal(authority.ballisticGeometry.scoreOnTouch.enabled, true);
  assert.equal(authority.ballisticGeometry.displayMarkerParticipatesInScoring, false);
  assert.equal(authority.classifications[13].regionId, "flying_bird");
  assert.equal(authority.classifications[14].regionId, "left_bird");
  assert.ok(authority.classifications.every(item => item.observationFootprint?.schemaVersion === "sczn3.observation-footprint.v1"));
  await page.getByRole("button", { name: "SEC Preserved", exact: true }).waitFor();
  const exactHref = await page.getByRole("link", { name: "Exact Reopen", exact: true }).getAttribute("href");
  assert.ok(exactHref?.includes("session=") && exactHref.includes("#secReopenCapability="));
  await page.getByLabel("Shooter Action Bar").getByRole("link", { name: "Ballistic Vault", exact: true }).click();
  await page.getByRole("heading", { name: "BALLISTIC VAULT", exact: true }).waitFor();
  const currentRecord = page.locator("article.vault-record-summary").first();
  await currentRecord.waitFor();
  assert.match(await currentRecord.innerText(), /15 HIT TAPS[\s\S]*6 OUTSIDE RED AIM AREAS[\s\S]*21 TOTAL TAPS/);

  await page.goto(new URL(exactHref, `${origin}/`).href, { waitUntil: "domcontentloaded" });
  await page.locator("#contractSecView").waitFor({ state: "visible" });
  assert.equal((await page.locator("#contractStatus").textContent()).trim(), "Saved Session Opened");
  assert.equal(await page.locator(".contract-observation-marker").count(), 21);
  const reopenedText = await page.locator(".contract-lifecycle-result").innerText();
  assert.match(reopenedText, /15 HIT TAPS[\s\S]*6 OUTSIDE RED AIM AREAS[\s\S]*21 TOTAL TAPS/);
  assert.match(reopenedText, /Aim Areas Hit:[\s\S]*100%/i);
  assert.doesNotMatch(reopenedText, /Target Score|points|winner|miss penalty|shot quota|reward rule|\$10,000/i);
  console.log(`PASS Founder 18 TARGET → RESULT → SESSION/HISTORY → SAVE SEC → VAULT → EXACT REOPEN (${saved.session.sessionId})`);
  console.log(`FOUNDER_URL ${url}`);
} finally {
  await browser.close();
}
