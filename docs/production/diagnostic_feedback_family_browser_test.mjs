import assert from "node:assert/strict";
import { chromium } from "playwright";
import path from "node:path";

const origin = process.env.SCZN3_REVIEW_ORIGIN || "http://127.0.0.1:8096";
const image = path.resolve("backend/test_fixtures/target_execution_scale.svg");
const products = [
  { target: "fixture_diagnostic_right_tutor", name: "Conventional Right-Handed Tutor", sku: "DIAG-A01", hand: "right", points: [[.2,.2],[.8,.2]], expected: /1 matched|Publisher Upper Left/ },
  { target: "fixture_diagnostic_humorous", name: "Humorous Neutral Label Target", sku: "DIAG-B02", hand: "not_applicable", points: [[.5,.5]], expected: /ambiguous/ },
  { target: "fixture_diagnostic_left_data_only", name: "Data-Only Left-Handed Tutor", sku: "DIAG-C03", hand: "left", points: [[.8,.8]], expected: /Publisher Lower Right/ },
];

const browser = await chromium.launch({ headless: true });
try {
  for (const product of products) {
    const page = await browser.newPage({ viewport: { width: 1180, height: 900 } });
    await page.goto(`${origin}/target-experience.html?target=${product.target}&missionFamily=diagnosticFeedbackEvaluation`, { waitUntil: "domcontentloaded" });
    await page.getByRole("button", { name: "Start", exact: true }).click();
    await page.getByText(product.name, { exact: false }).waitFor();
    await page.locator("#contractFile").setInputFiles(image);
    await page.getByText("Publisher Label Match — Not an SCZN3 Diagnosis", { exact: true }).waitFor();
    await page.locator("#contractDiagnosticHandedness").selectOption(product.hand);
    const surface = page.locator("#contractTapSurface"), box = await surface.boundingBox();
    assert.ok(box);
    for (const [x,y] of product.points) await surface.click({ position: { x: box.width*x, y: box.height*y } });
    await page.getByRole("button", { name: "Show Result" }).click();
    const sec = page.locator("#contractSecRoot");
    await sec.getByText("Publisher Label Match", { exact: true }).waitFor();
    const text = await sec.innerText();
    assert.match(text, new RegExp(`${product.name} · SKU ${product.sku}`)); assert.match(text, product.expected); assert.match(text, /Not an SCZN3 Diagnosis/); assert.match(text, /Scoring:\s+Not applicable/); assert.match(text, /Correction:\s+Not provided/);
    await page.getByRole("button", { name: "Save SEC" }).click(); await page.getByText("SEC preserved. Exact reopen available.", { exact: true }).waitFor();
    const href = await page.getByRole("link", { name: "Exact Reopen" }).getAttribute("href"); assert.ok(href);
    await page.goto(new URL(href, `${origin}/`).href, { waitUntil: "domcontentloaded" }); await page.locator("#contractSecView").waitFor({ state: "visible" });
    const reopened = await page.locator("#contractSecRoot").innerText(); assert.match(reopened, product.expected); assert.match(reopened, /Not an SCZN3 Diagnosis/);
    await page.close();
  }
  console.log("PASS: Diagnostic Feedback three-fixture label matching, preservation, and exact reopen");
} finally { await browser.close(); }
