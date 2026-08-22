import assert from "node:assert/strict";
import { chromium } from "playwright";
import path from "node:path";

const origin = process.env.SCZN3_REVIEW_ORIGIN || "http://127.0.0.1:8096";
const image = path.resolve("backend/test_fixtures/target_execution_scale.svg");
const products = [
  { target: "fixture_decision_positive", name: "Friendly-Named Observation Scenario", sku: "DEC-A01", response: "observation", expected: /1 matched/ },
  { target: "fixture_decision_no_response", name: "Danger-Named No-Response Scenario", sku: "DEC-B02", response: "none", expected: /1 matched/ },
  { target: "fixture_decision_data_only", name: "Data-Only Independent Scenario", sku: "DEC-C03", response: "observation", expected: /1 matched/ },
];

const browser = await chromium.launch({ headless: true });
try {
  for (const product of products) {
    const page = await browser.newPage({ viewport: { width: 1180, height: 900 } });
    await page.goto(`${origin}/target-experience.html?target=${product.target}&missionFamily=decisionScenarioEvaluation`, { waitUntil: "domcontentloaded" });
    await page.getByRole("button", { name: "Start", exact: true }).click();
    await page.getByText(product.name, { exact: false }).waitFor();
    await page.locator("#contractFile").setInputFiles(image);
    await page.getByText("Publisher-Designated Response Match — Not Legal or Tactical Judgment", { exact: true }).waitFor();
    if (product.response === "observation") {
      const surface = page.locator("#contractTapSurface"), box = await surface.boundingBox(); assert.ok(box);
      await surface.click({ position: { x: box.width * .5, y: box.height * .5 } });
    } else await page.getByRole("button", { name: "Record No Observation" }).click();
    await page.getByRole("button", { name: "Advance" }).click();
    const sec = page.locator("#contractSecRoot");
    await sec.getByText("Publisher-Designated Response", { exact: true }).waitFor();
    const text = await sec.innerText();
    assert.match(text, new RegExp(`${product.name} · SKU ${product.sku}`)); assert.match(text, product.expected); assert.match(text, /Not Legal or Tactical Judgment/); assert.match(text, /Legal judgment:\s+Not established/); assert.match(text, /Use of force:\s+Not established/); assert.match(text, /Scoring:\s+Not applicable/);
    if (product.response === "none") assert.match(text, /Explicit no-observation · physical shot absence not proven/);
    await page.getByRole("button", { name: "Save SEC" }).click(); await page.getByText("SEC preserved. Exact reopen available.", { exact: true }).waitFor();
    const href = await page.getByRole("link", { name: "Exact Reopen" }).getAttribute("href"); assert.ok(href);
    await page.goto(new URL(href, `${origin}/`).href, { waitUntil: "domcontentloaded" }); await page.locator("#contractSecView").waitFor({ state: "visible" });
    const reopened = await page.locator("#contractSecRoot").innerText(); assert.match(reopened, product.expected); assert.match(reopened, /Not Legal or Tactical Judgment/);
    await page.close();
  }
  console.log("PASS: Decision Scenario three-fixture response matching, preservation, and exact reopen");
} finally { await browser.close(); }
