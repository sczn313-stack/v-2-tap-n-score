import assert from "node:assert/strict";
import { chromium } from "playwright";
import path from "node:path";

const origin = process.env.SCZN3_REVIEW_ORIGIN || "http://127.0.0.1:8096";
const image = path.resolve("backend/test_fixtures/target_execution_scale.svg");
const products = [
  { target: "fixture_paper_alpha", name: "Paper Alpha", sku: "SYN-A01" },
  { target: "fixture_paper_bravo", name: "Paper Bravo", sku: "SYN-B02" },
];

const browser = await chromium.launch({ headless: true });
try {
  for (const product of products) {
    const page = await browser.newPage({ viewport: { width: 1180, height: 900 } });
    await page.goto(`${origin}/target-experience.html?target=${product.target}&missionFamily=smartEvidenceCapture`, { waitUntil: "domcontentloaded" });
    await page.getByRole("button", { name: "Start", exact: true }).click();
    await page.getByText(product.name, { exact: false }).waitFor();
    await page.locator("#contractFile").setInputFiles(image);
    await page.locator("#contractWorkspace").waitFor({ state: "visible" });
    const surface = page.locator("#contractTapSurface");
    const box = await surface.boundingBox();
    assert.ok(box && box.width > 100 && box.height > 100);
    await page.getByRole("button", { name: "Mark Aim" }).click();
    await surface.click({ position: { x: box.width * .5, y: box.height * .5 } });
    await surface.click({ position: { x: box.width * .35, y: box.height * .4 } });
    await surface.click({ position: { x: box.width * .65, y: box.height * .6 } });
    await page.getByRole("button", { name: "Show Result" }).click();
    await page.getByText("Evidence Recorded", { exact: true }).waitFor();
    const sec = page.locator("#contractSecRoot");
    assert.match(await sec.innerText(), new RegExp(`${product.name} · SKU ${product.sku}`));
    assert.match(await sec.innerText(), /2 shot observations/);
    assert.match(await sec.innerText(), /Scoring:\s+Not applicable/);
    await page.getByRole("button", { name: "Save SEC" }).click();
    await page.getByText("SEC preserved. Exact reopen available.", { exact: true }).waitFor();
    const reopen = page.getByRole("link", { name: "Exact Reopen" });
    const href = await reopen.getAttribute("href");
    assert.ok(href && href.includes("session="));
    await page.goto(new URL(href, `${origin}/`).href, { waitUntil: "domcontentloaded" });
    await page.locator("#contractSecView").waitFor({ state: "visible" });
    assert.equal(await page.locator("#contractStatus").textContent(), "Exact preserved SEC reopened.");
    assert.match(await page.locator("#contractSecRoot").innerText(), new RegExp(`${product.name} · SKU ${product.sku}`));
    assert.equal(await page.locator(".contract-observation-marker").count(), 2);
    assert.equal(await page.locator(".contract-aim-marker").count(), 1);
    await page.close();
  }
  console.log("PASS: two products inherited one family executor, Universal SEC, preservation, and exact reopen without target-ID production wiring");
} finally {
  await browser.close();
}
