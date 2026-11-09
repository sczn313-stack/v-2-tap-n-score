import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";

const { chromium } = createRequire(import.meta.url)("playwright");
const docs = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const origin = process.env.SCZN3_TST12_ORIGIN || "http://127.0.0.1:8221";
const authorityPort = process.env.SCZN3_TST12_AUTHORITY_PORT || new URL(origin).port;
const variants = [
  {
    id: "baker_tst12_17_5x23",
    // Founder-supplied source art matches this face's 17.5 x 23 aspect ratio.
    actualEvidenceAsset: "assets/BAKER_TST12_SOURCE_ARTWORK.jpg"
  },
  {
    id: "baker_tst12_23x35",
    // No registered 23 x 35 actual-photo evidence is available in this checkout.
    // Never use the 17.5 x 23 photo as a surrogate for an actual-round test.
    actualEvidenceAsset: null
  }
];
const systemChrome = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";

async function selectAndTapCrosshair(page, station) {
  const stationId = `station_${String(station).padStart(2, "0")}_square`;
  await page.locator(`[data-tst12-station-selector="${stationId}"]`).first().click();
  const crosshair = page.locator(`[data-tst12-station="${stationId}"] circle`).first();
  const box = await crosshair.boundingBox();
  assert.ok(box && box.width > 0 && box.height > 0, `station ${station} crosshair is visible`);
  for (let shot = 0; shot < 5; shot += 1) {
    await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
    await page.waitForTimeout(60);
  }
}

async function verifyLifecycle(page, target, mode) {
  const query = new URLSearchParams({
    target,
    missionFamily: "targetScoring",
    experienceMode: mode,
    authorityPort,
    v: "tst12-live-scoring-lifecycle-1"
  });
  if (mode === "simulation") query.set("source", "registered");
  await page.goto(`${origin}/target-experience.html?${query}`, { waitUntil: "domcontentloaded" });
  await page.locator("#contractWorkspace").waitFor({ state: "visible" });
  if (mode === "actual") {
    assert.ok(target.actualEvidenceAsset, `${target.id} needs registered, target-matched actual-photo evidence`);
    // Registered TST-12 routes already admit their authoritative session. Older
    // entry points still expose Start, so only activate it when it is visible.
    const start = page.locator("#contractStart");
    if (await start.isVisible()) await start.click();
    await page.locator("#contractCapture").waitFor({ state: "visible" });
    await page.locator("#contractFile").setInputFiles(path.join(docs, target.actualEvidenceAsset));
  }
  await page.locator("#contractActualDistance").fill("25");
  await page.locator("#contractScoringCaliber").selectOption(".22 LR");

  for (let station = 1; station <= 12; station += 1) await selectAndTapCrosshair(page, station);
  await page.waitForFunction(() => document.querySelectorAll(".contract-observation-marker[data-tst12-shot-outcome='hit']").length === 60);

  await page.locator("#contractShowResult").click();
  await page.locator("#contractSecView").waitFor({ state: "visible" });
  const result = await page.locator("#contractSecRoot").innerText();
  assert.match(result, /TARGET SCORE\s*300/);
  assert.match(result, /60 HITS\s*\|\s*0 MISSES\s*\|\s*60 RECORDED/);

  const save = page.locator("#contractSecRoot [data-sczn3-action='save']");
  assert.equal((await save.innerText()).trim(), "Save SEC");
  const savedResponse = page.waitForResponse(response => response.url().includes("/api/session/sec") && response.request().method() === "POST");
  await save.click();
  assert.equal((await savedResponse).status(), 201);
  const reopened = page.locator("#contractSecRoot a.contract-exact-reopen");
  const reopenHref = await reopened.getAttribute("href");
  assert.ok(reopenHref, "exact-reopen link is present after saving");
  const vaultHref = await page.locator("#contractSecRoot a.sec-vault-destination").getAttribute("href");
  assert.ok(vaultHref, "Vault link is present after saving");
  await page.goto(new URL(vaultHref, origin).href, { waitUntil: "domcontentloaded" });
  await page.getByRole("heading", { name: "BALLISTIC VAULT", exact: true }).waitFor();
  await page.goto(new URL(reopenHref, origin).href, { waitUntil: "domcontentloaded" });
  await page.locator("#contractSecView").waitFor({ state: "visible" });
  assert.match(await page.locator("#contractSecRoot").innerText(), /TARGET SCORE\s*300/);
}

const browser = await chromium.launch({ headless: true, ...(existsSync(systemChrome) ? { executablePath: systemChrome } : {}) });
try {
  const context = await browser.newContext({ viewport: { width: 1180, height: 900 } });
  for (const target of variants) {
    for (const mode of ["simulation", "actual"]) {
      if (mode === "actual" && !target.actualEvidenceAsset) {
        console.log(`BLOCKED ${target.id} actual: registered target-matched actual-photo evidence is unavailable`);
        continue;
      }
      const page = await context.newPage();
      await verifyLifecycle(page, target, mode);
      console.log(`PASS ${target.id} ${mode} controlled crosshairs -> Result -> SEC -> Save -> Vault -> exact reopen`);
      await page.close();
    }
  }
  await context.close();
} finally {
  await browser.close();
}
