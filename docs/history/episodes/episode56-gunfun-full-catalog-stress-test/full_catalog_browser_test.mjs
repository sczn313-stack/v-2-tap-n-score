import assert from "node:assert/strict";
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { chromium } from "playwright";


const origin = process.env.SCZN3_REVIEW_ORIGIN || "http://127.0.0.1:8096";
const authorityOrigin = process.env.SCZN3_AUTHORITY_ORIGIN || "http://127.0.0.1:8098";
const audit = JSON.parse(await readFile("authority-evidence/gunfun/episode56/full-catalog-stress-test/FULL_CATALOG_AUTHORITY_AUDIT.json", "utf8"));
const registered = audit.records.filter(record => record.registration.status === "registered");
const catalogResponse = await fetch(`${authorityOrigin}/api/target-execution/catalog`);
assert.equal(catalogResponse.status, 200);
const catalog = (await catalogResponse.json()).targets;
assert.equal(registered.length, 237);
assert.equal(catalog.length, 237);
const catalogBySku = new Map(catalog.map(item => [String(item.product.sku), item]));

const browser = await chromium.launch({ headless: true });
const outcomes = [];
try {
  for (const record of registered) {
    const sku = record.product.sku;
    const entry = catalogBySku.get(sku);
    const page = await browser.newPage({ viewport: { width: 1180, height: 900 } });
    const startedAt = performance.now();
    try {
      assert.ok(entry, `catalog entry missing for ${sku}`);
      await page.goto(`${origin}/${record.registration.governedRoute}`, { waitUntil: "domcontentloaded" });
      await page.getByRole("button", { name: "Start", exact: true }).click();
      await page.getByText(record.product.profileName, { exact: false }).waitFor();
      const admittedAt = performance.now();
      await page.locator("#contractFile").setInputFiles(path.resolve(entry.registration.assetPath));
      await page.locator("#contractWorkspace").waitFor({ state: "visible" });
      const evidenceLoadedAt = performance.now();
      const surface = page.locator("#contractTapSurface");
      const box = await surface.boundingBox();
      assert.ok(box && box.width > 100 && box.height > 100);
      await page.getByRole("button", { name: "Mark Aim" }).click();
      await surface.click({ position: { x: box.width * .5, y: box.height * .5 } });
      await surface.click({ position: { x: box.width * .35, y: box.height * .4 } });
      await surface.click({ position: { x: box.width * .65, y: box.height * .6 } });
      await page.getByRole("button", { name: "Show Result" }).click();
      await page.getByText("Evidence Recorded", { exact: true }).waitFor();
      const backendResultAt = performance.now();
      const secText = await page.locator("#contractSecRoot").innerText();
      assert.ok(secText.includes(`${record.product.profileName} · SKU ${sku}`));
      assert.match(secText, /2 shot observations/);
      assert.match(secText, /Scoring:\s+Not applicable/);
      const universalSecAt = performance.now();
      await page.getByRole("button", { name: "Save SEC" }).click();
      await page.getByText("SEC preserved. Exact reopen available.", { exact: true }).waitFor();
      const preservedAt = performance.now();
      const href = await page.getByRole("link", { name: "Exact Reopen" }).getAttribute("href");
      assert.ok(href && href.includes("session="));
      const sessionId = new URL(href, `${origin}/`).searchParams.get("session");
      const preservedResponse = await fetch(`${authorityOrigin}/api/session/sec?session=${encodeURIComponent(sessionId)}`);
      assert.equal(preservedResponse.status, 200);
      const preserved = await preservedResponse.json();
      const result = preserved.session.authorityPackage;
      assert.equal(result.authoritySource, "backend-authoritative");
      assert.equal(result.target.product.sku, sku);
      assert.equal(result.target.product.name, record.product.profileName);
      assert.equal(result.reconciliation.acceptedObservationCount, 2);
      assert.equal(result.reconciliation.countsMatch, true);
      assert.equal(result.scoring.status, "not_applicable");
      assert.equal(result.shooterDeclaredAimPoint.declaredBy, "shooter");
      assert.equal(result.capabilityStates.measurement.status, "unavailable");
      assert.ok(String(preserved.session.targetEvidenceImage.dataUrl).startsWith("data:image/"));
      await page.goto(new URL(href, `${origin}/`).href, { waitUntil: "domcontentloaded" });
      await page.locator("#contractSecView").waitFor({ state: "visible" });
      assert.equal(await page.locator("#contractStatus").textContent(), "Exact preserved SEC reopened.");
      assert.ok((await page.locator("#contractSecRoot").innerText()).includes(`${record.product.profileName} · SKU ${sku}`));
      assert.equal(await page.locator(".contract-observation-marker").count(), 2);
      assert.equal(await page.locator(".contract-aim-marker").count(), 1);
      const reopenedAt = performance.now();
      outcomes.push({
        catalogId: record.catalogId,
        sku,
        targetProfileId: entry.targetProfileId,
        status: "PASS",
        targetIdProductionCodeEdit: "NO",
        timeMs: {
          sessionAdmission: Math.round(admittedAt - startedAt),
          evidenceLoad: Math.round(evidenceLoadedAt - startedAt),
          backendAuthoritativeResult: Math.round(backendResultAt - startedAt),
          universalSec: Math.round(universalSecAt - startedAt),
          preservation: Math.round(preservedAt - startedAt),
          exactReopen: Math.round(reopenedAt - startedAt),
        },
      });
    } catch (error) {
      outcomes.push({ catalogId: record.catalogId, sku, status: "FAIL", reason: error.message, targetIdProductionCodeEdit: "NO" });
    } finally {
      await page.close();
    }
  }
} finally {
  await browser.close();
}

const failures = outcomes.filter(outcome => outcome.status !== "PASS");
await writeFile("history/episodes/episode56-gunfun-full-catalog-stress-test/FULL_CATALOG_BROWSER_RESULTS.json", `${JSON.stringify({ status: failures.length ? "FAIL" : "PASS", tested: outcomes.length, passed: outcomes.length - failures.length, failed: failures.length, outcomes }, null, 2)}\n`);
assert.deepEqual(failures, []);
console.log("GunFun full-catalog browser lifecycle: PASS");
console.log("- 237/237 generic routes reached exact reopen with publisher identity and unavailable states preserved");
