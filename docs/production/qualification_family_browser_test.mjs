import assert from "node:assert/strict";
import { chromium } from "playwright";
import path from "node:path";

const origin = process.env.SCZN3_REVIEW_ORIGIN || "http://127.0.0.1:8096";
const image = path.resolve("backend/test_fixtures/target_execution_scale.svg");
const products = [
  { target: "fixture_qualification_pistol", name: "Pistol Practice Course", sku: "QUAL-A01", stages: 2, point: .5, outcome: "PASS" },
  { target: "fixture_qualification_rifle", name: "Rifle Practice Course", sku: "QUAL-B02", stages: 2, point: .2, outcome: "FAIL" },
  { target: "fixture_qualification_data_only", name: "Data-Only Practice Course", sku: "QUAL-C03", stages: 1, point: .5, outcome: "PASS" },
];

const browser = await chromium.launch({ headless: true });
try {
  for (const product of products) {
    const page = await browser.newPage({ viewport: { width: 1180, height: 900 } });
    await page.goto(`${origin}/target-experience.html?target=${product.target}&missionFamily=qualificationCourseEvaluation`, { waitUntil: "domcontentloaded" });
    await page.getByRole("button", { name: "Start", exact: true }).click();
    await page.getByText(product.name, { exact: false }).waitFor();
    await page.locator("#contractFile").setInputFiles(image);
    await page.getByText("Practice Simulation — Not Official Qualification", { exact: true }).waitFor();
    const surface = page.locator("#contractTapSurface");
    for (let index = 0; index < product.stages; index += 1) {
      await page.locator("#contractCueControls").waitFor({ state: "visible" });
      const box = await surface.boundingBox();
      assert.ok(box && box.width > 100 && box.height > 100);
      await surface.click({ position: { x: box.width * product.point, y: box.height * product.point } });
      await page.getByRole("button", { name: "Advance" }).click();
    }
    const sec = page.locator("#contractSecRoot");
    await sec.getByText("Practice Qualification", { exact: true }).waitFor();
    const secText = await sec.innerText();
    assert.match(secText, new RegExp(`${product.name} · SKU ${product.sku}`));
    assert.match(secText, new RegExp(product.outcome));
    assert.match(secText, /not an official qualification/i);
    assert.match(secText, /SCZN3 credential:\s+Not issued/);
    assert.match(secText, /Physical shot timing:\s+Unavailable/);
    await page.getByRole("button", { name: "Save SEC" }).click();
    await page.waitForTimeout(250);
    assert.equal(await page.locator("#contractStatus").textContent(), "Backend-authoritative practice/simulation qualification result complete.");
    await page.getByText("SEC preserved. Exact reopen available.", { exact: true }).waitFor({ timeout: 5000 });
    const href = await page.getByRole("link", { name: "Exact Reopen" }).getAttribute("href");
    assert.ok(href && href.includes("session="));
    await page.goto(new URL(href, `${origin}/`).href, { waitUntil: "domcontentloaded" });
    await page.locator("#contractSecView").waitFor({ state: "visible" });
    assert.equal(await page.locator("#contractStatus").textContent(), "Exact preserved SEC reopened.");
    const reopened = await page.locator("#contractSecRoot").innerText();
    assert.match(reopened, new RegExp(`${product.name} · SKU ${product.sku}`));
    assert.match(reopened, new RegExp(product.outcome));
    assert.match(reopened, /Practice Simulation — Not Official Qualification/);
    await page.close();
  }
  console.log("PASS: Qualification three-fixture practice lifecycle, official boundary, Universal SEC, preservation, and exact reopen");
} finally {
  await browser.close();
}
