import assert from "node:assert/strict";
import { chromium } from "playwright";
import path from "node:path";

const origin = process.env.SCZN3_REVIEW_ORIGIN || "http://127.0.0.1:8096";
const image = path.resolve("backend/test_fixtures/target_execution_scale.svg");
const products = [
  { target: "fixture_cue_fixed", name: "Fixed Command Paper", sku: "CUE-A01", cues: 2, missingAt: 1 },
  { target: "fixture_cue_memory", name: "Random Memory Paper", sku: "CUE-B02", cues: 3 },
  { target: "fixture_cue_external", name: "External Command Paper", sku: "CUE-C03", cues: 2, external: true },
];

const browser = await chromium.launch({ headless: true });
try {
  for (const product of products) {
    const page = await browser.newPage({ viewport: { width: 1180, height: 900 } });
    await page.goto(`${origin}/target-experience.html?target=${product.target}&missionFamily=cueDrillOrchestration`, { waitUntil: "domcontentloaded" });
    await page.getByRole("button", { name: "Start", exact: true }).click();
    await page.getByText(product.name, { exact: false }).waitFor();
    await page.locator("#contractFile").setInputFiles(image);
    await page.locator("#contractCuePanel").waitFor({ state: "visible" });
    const surface = page.locator("#contractTapSurface");
    for (let index = 0; index < product.cues; index += 1) {
      if (product.external) {
        await page.locator("#contractExternalCue").selectOption(index === 0 ? "cue-left-external" : "cue-right-external");
        await page.getByRole("button", { name: "Declare Cue" }).click();
      }
      await page.locator("#contractCueControls").waitFor({ state: "visible" });
      if (product.missingAt === index) {
        await page.getByRole("button", { name: "Record No Observation" }).click();
      } else {
        const box = await surface.boundingBox();
        assert.ok(box && box.width > 100 && box.height > 100);
        const x = product.target === "fixture_cue_memory" ? .5 : (index === 0 ? .25 : .75);
        await surface.click({ position: { x: box.width * x, y: box.height * .5 } });
      }
      await page.getByRole("button", { name: "Advance" }).click();
    }
    await page.getByText("Cue / Drill", { exact: true }).waitFor();
    const sec = page.locator("#contractSecRoot");
    assert.match(await sec.innerText(), new RegExp(`${product.name} · SKU ${product.sku}`));
    assert.match(await sec.innerText(), /Complete/);
    assert.match(await sec.innerText(), /Scoring:\s+Not applicable/);
    assert.match(await sec.innerText(), /Physical shot timing:\s+Unavailable/);
    await page.getByRole("button", { name: "Save SEC" }).click();
    await page.waitForTimeout(300);
    assert.equal(await page.locator("#contractStatus").textContent(), "Backend-authoritative Cue/Drill result complete.");
    await page.getByText("SEC preserved. Exact reopen available.", { exact: true }).waitFor({ timeout: 5000 });
    const href = await page.getByRole("link", { name: "Exact Reopen" }).getAttribute("href");
    assert.ok(href && href.includes("session="));
    await page.goto(new URL(href, `${origin}/`).href, { waitUntil: "domcontentloaded" });
    await page.locator("#contractSecView").waitFor({ state: "visible" });
    assert.equal(await page.locator("#contractStatus").textContent(), "Exact preserved SEC reopened.");
    assert.match(await page.locator("#contractSecRoot").innerText(), new RegExp(`${product.name} · SKU ${product.sku}`));
    await page.close();
  }
  console.log("PASS: Cue/Drill three-fixture browser lifecycle, Universal SEC, preservation, and exact reopen");
} finally {
  await browser.close();
}
