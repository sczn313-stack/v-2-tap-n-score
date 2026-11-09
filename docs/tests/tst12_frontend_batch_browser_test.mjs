import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";

const { chromium } = createRequire(import.meta.url)("playwright");
const docs = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const origin = process.env.SCZN3_TST12_ORIGIN || "http://127.0.0.1:8213";
const chrome = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const targetId = "sczn3_tst12_clean_v1";
const targetAsset = path.join(docs, "assets/TST12_PRINT_17.5X23_V1.svg");

async function openTarget(page, viewportLabel) {
  const query = new URLSearchParams({
    missionFamily: "targetScoring",
    target: targetId,
    experienceMode: "actual",
    authorityPort: new URL(origin).port,
    v: `tst12-frontend-batch-${viewportLabel}-1`,
  });
  await page.goto(`${origin}/target-experience.html?${query}`, { waitUntil: "domcontentloaded" });
  await page.locator("#contractCapture").waitFor({ state: "visible" });
  await page.locator("#contractFile").setInputFiles(targetAsset);
  await page.locator("#contractWorkspace").waitFor({ state: "visible" });
  await page.locator("#contractActualDistance").fill("25");
  await page.locator("#contractScoringCaliber").selectOption({ label: ".22 LR · 0.223 in" });
  assert.equal((await page.locator("#tst12RoundProgress strong").innerText()).trim(), "TAP YOUR FIRST STATION");
  const station = page.getByRole("button", { name: "Select Station 1.", exact: true }).filter({ visible: true }).last();
  await station.click();
  await page.waitForFunction(() => document.querySelector("#tst12RoundProgress strong")?.textContent === "TAP WHERE YOUR SHOTS HIT");
  assert.equal((await page.locator("#tst12RoundProgress strong").innerText()).trim(), "TAP WHERE YOUR SHOTS HIT");
  assert.equal(await page.locator("#contractMarkers .contract-observation-marker").count(), 0, "station selection records zero observations");
}

async function placeFive(page) {
  const image = page.locator("#contractTargetImage");
  const box = await image.boundingBox();
  assert.ok(box && box.width > 0 && box.height > 0);
  const points = [
    [0.1857142857, 0.1576086957],
    [0.2157142857, 0.1576086957],
    [0.2457142857, 0.1576086957],
    [0.0700000000, 0.2350000000],
    [0.3400000000, 0.2000000000],
  ];
  for (let index = 0; index < points.length; index += 1) {
    const [x, y] = points[index];
    await page.mouse.click(box.x + box.width * x, box.y + box.height * y);
    assert.equal(await page.locator("#contractMarkers .contract-observation-marker").count(), index + 1, `observation ${index + 1} records exactly once`);
  }
  assert.equal(await page.locator("#contractMarkers .contract-observation-marker").count(), 5);
  const markerPresentation = await page.locator("#contractMarkers .contract-observation-marker").first().evaluate(marker => {
    const center = getComputedStyle(marker);
    const count = getComputedStyle(marker, "::after");
    return { centerBackground: center.backgroundColor, badgeLeft: count.left, badgeContent: count.content };
  });
  assert.match(markerPresentation.centerBackground, /rgba\([^)]*,\s*0\.08\)/, "marker center remains see-through");
  assert.notEqual(markerPresentation.badgeLeft, "0px", "count identifier is outside the center");
  assert.equal(markerPresentation.badgeContent, '"1"');
}

async function verifyResult(page, mobile = false) {
  await page.locator("#contractShowResult").click();
  await page.locator("#contractSecView").waitFor({ state: "visible", timeout: 45000 });
  const text = await page.locator("#contractSecRoot").innerText();
  assert.match(text, /STATION RESULTS/i);
  assert.doesNotMatch(text, /SCORING DISTRIBUTION/i);
  assert.match(text, /VALUE & REGION/i);
  assert.match(text, /TOTAL TAPS/i);
  assert.doesNotMatch(text, /What this target does in SCZN3/i);
  assert.equal(await page.locator("#contractSecRoot .contract-observation-marker").count(), 5);
  await page.locator('.tst12-station-performance > summary').click();
  const overflow = await page.locator("#contractSecRoot").evaluate(root => root.scrollWidth - root.clientWidth);
  assert.ok(overflow <= 1, `${mobile ? "390px" : "desktop"} SEC has no horizontal overflow`);
  await page.locator('details[data-sec-region="session"] > summary').click();
  assert.match(await page.locator('.tst12-session-details').innerText(), /CALIBER\s+\.22/i);
}

const browser = await chromium.launch({ headless: true, ...(existsSync(chrome) ? { executablePath: chrome } : {}) });
try {
  const desktop = await browser.newContext({ viewport: { width: 1180, height: 900 } });
  const page = await desktop.newPage();
  await openTarget(page, "desktop");
  await placeFive(page);
  await verifyResult(page);
  const saveButton = page.locator('[data-sczn3-action="save"]');
  const [saveResponse] = await Promise.all([
    page.waitForResponse(response => response.url().includes("/api/session/sec") && response.request().method() === "POST"),
    saveButton.click(),
  ]);
  const saved = await saveResponse.json();
  const savedSessionId = saved.session.sessionId;
  await page.waitForFunction(() => document.querySelector("#contractStatus")?.textContent === "Saved to the Vault.");
  const savedMarkers = await page.locator("#contractSecRoot .contract-observation-marker").count();
  assert.equal(savedMarkers, 5);
  await page.locator('[data-sczn3-action="history"]:not(.contract-exact-reopen)').click();
  const record = page.locator(`article.vault-record-summary--tst12[data-session-id="${savedSessionId}"]`);
  await record.waitFor({ state: "visible" });
  assert.equal(await record.locator(".vault-evidence-pair > figure:first-child > .vault-target-panel:first-of-type .history-thumb-impact").count(), 5);
  const reopenLink = record.locator("a.vault-record-link");
  const reopenHref = await reopenLink.getAttribute("href");
  assert.match(reopenHref, new RegExp(`target=${targetId}`), "Vault exact reopen retains authoritative target identity");
  assert.match(reopenHref, /missionFamily=targetScoring/i, "Vault exact reopen retains the governed mission family");
  assert.match(reopenHref, /experienceMode=actual/i, "Vault exact reopen retains Actual Round mode");
  await reopenLink.click();
  await page.locator("#contractSecView").waitFor({ state: "visible" });
  assert.equal(await page.locator("#contractSecRoot .contract-observation-marker").count(), 5, "exact reopen retains all observations");
  await desktop.close();

  const mobile = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  const mobilePage = await mobile.newPage();
  await openTarget(mobilePage, "390");
  await placeFive(mobilePage);
  await verifyResult(mobilePage, true);
  await mobile.close();

  const universal = await browser.newContext({ viewport: { width: 980, height: 760 } });
  const universalPage = await universal.newPage();
  await universalPage.goto(`${origin}/target-experience.html?target=fixture_paper_alpha&missionFamily=smartEvidenceCapture&authorityPort=${new URL(origin).port}&v=universal-marker-proof-1`, { waitUntil: "domcontentloaded" });
  await universalPage.locator("#contractStart").click();
  await universalPage.locator("#contractFile").setInputFiles(path.join(docs, "backend/test_fixtures/target_execution_scale.svg"));
  await universalPage.locator("#contractWorkspace").waitFor({ state: "visible" });
  const universalSurface = universalPage.locator("#contractTapSurface");
  const universalBox = await universalSurface.boundingBox();
  assert.ok(universalBox);
  await universalPage.mouse.click(universalBox.x + universalBox.width * .35, universalBox.y + universalBox.height * .4);
  const universalMarker = await universalPage.locator("#contractMarkers .precision-tap-marker").first().evaluate(marker => ({
    center: getComputedStyle(marker).backgroundColor,
    badgeLeft: getComputedStyle(marker, "::after").left,
  }));
  assert.match(universalMarker.center, /rgba\([^)]*,\s*0\.08\)/, "another supported target inherits the transparent center");
  assert.notEqual(universalMarker.badgeLeft, "0px", "another supported target inherits the outside count identifier");
  await universal.close();
  console.log("PASS TST-12 frontend batch desktop + 390px RESULT -> SEC -> Vault -> exact reopen");
} finally {
  await browser.close();
}
