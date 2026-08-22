import assert from "node:assert/strict";
import { chromium } from "playwright";
import path from "node:path";

const origin = process.env.SCZN3_REVIEW_ORIGIN || "http://127.0.0.1:8096";
const targetImage = path.resolve("authority-evidence/gunfun/episode56/publisher-representations/E56-T08_SKU-22740.jpg");
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1180, height: 900 } });

try {
  await page.goto(`${origin}/t/gunfun/vital-dude/`, { waitUntil: "domcontentloaded" });
  await page.getByRole("button", { name: "Start", exact: true }).click();
  await page.locator("#libraryInput").setInputFiles(targetImage);
  await page.locator("#targetWorkspace").waitFor({ state: "visible" });

  await page.getByRole("button", { name: "Mark Aim" }).click();
  const surface = page.locator("#tapSurface");
  const box = await surface.boundingBox();
  assert.ok(box && box.width > 100 && box.height > 100);
  await surface.click({ position: { x: box.width * .5, y: box.height * .42 } });
  await surface.click({ position: { x: box.width * .42, y: box.height * .52 } });
  await surface.click({ position: { x: box.width * .58, y: box.height * .57 } });
  await page.getByRole("button", { name: "Show Evidence Result" }).click();

  await page.getByText("Evidence Recorded", { exact: true }).waitFor();
  assert.match(await page.locator("#vitalDudeSecRoot").innerText(), /2\s+shot observations/);
  await page.getByText("Shooter-declared aim point preserved", { exact: true }).waitFor();
  await page.getByText("2 of 2 observations reconciled", { exact: true }).waitFor();
  const secText = await page.locator("#vitalDudeSecRoot").innerText();
  assert.match(secText, /Scoring\s+Not applicable/);
  assert.match(secText, /Canonical regions\s+Unavailable/);
  assert.doesNotMatch(secText, /total score|points down|pass|fail|penalty|group size|sight correction/i);

  await page.getByRole("button", { name: "Save SEC" }).click();
  await page.getByText("SEC saved to Ballistic Vault.", { exact: true }).waitFor();
  await page.getByRole("link", { name: "View History" }).click();
  await page.waitForURL(/records\.html/);
  await page.getByText("EVIDENCE RECORDED", { exact: true }).waitFor();
  const recordLink = page.locator('a[href*="view=sec"]').first();
  await recordLink.click();
  await page.waitForURL(/view=sec/);
  await page.getByText("Shooter-declared aim point preserved", { exact: true }).waitFor();
  assert.equal(await page.locator(".vital-dude-aim-marker").count() > 0, true);
  assert.equal(await page.locator(".sec-target-impact-marker").count(), 2);

  console.log("PASS Vital Dude Founder flow: start, load, declared aim, two observations, backend result, SEC save, Vault, exact reopen");
} finally {
  await browser.close();
}
