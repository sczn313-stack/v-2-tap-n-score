import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { chromium } from "playwright";

const origin = process.env.SCZN3_REVIEW_ORIGIN || "http://127.0.0.1:8096";
const authorityOrigin = process.env.SCZN3_AUTHORITY_ORIGIN || "http://127.0.0.1:8098";
const cohort = JSON.parse(await readFile("authority-evidence/platform/target-data-one-road-scale-proof-2026-09-08/TARGET_DATA_ONE_ROAD_COHORT.json", "utf8"));
const catalogResponse = await fetch(`${authorityOrigin}/api/target-execution/catalog`);
assert.equal(catalogResponse.status, 200);
const catalog = (await catalogResponse.json()).targets;
const byTarget = new Map(catalog.map(item => [item.targetProfileId, item]));
const sharedRoadSource = await readFile("target-experience.html", "utf8");
const sharedRuntimeSource = await readFile("target_execution_runtime.js", "utf8");

for (const target of cohort.targets) {
  assert.ok(!sharedRoadSource.includes(target.targetProfileId), `target-specific HTML wiring detected for ${target.targetProfileId}`);
  assert.ok(!sharedRuntimeSource.includes(target.targetProfileId), `target-specific runtime wiring detected for ${target.targetProfileId}`);
}

const browser = await chromium.launch({ headless: true });
const outcomes = [];
try {
  for (const target of cohort.targets) {
    const page = await browser.newPage({ viewport: { width: 1180, height: 900 } });
    const url = `${origin}/target-experience.html?target=${encodeURIComponent(target.targetProfileId)}`;
    await page.goto(url, { waitUntil: "domcontentloaded" });
    await page.getByRole("button", { name: "Start", exact: true }).click();
    const contract = byTarget.get(target.targetProfileId);
    if (!contract) {
      await page.waitForTimeout(400);
      const status = await page.locator("#contractStatus").textContent();
      if (/^Unavailable: /.test(status || "")) {
        outcomes.push({
          ordinal: target.ordinal,
          publisher: target.publisher,
          sku: target.sku,
          productName: target.productName,
          targetProfileId: target.targetProfileId,
          roadUrl: url,
          contractAdmission: "unavailable",
          stoppedAt: "START",
          exactReason: String(status).replace(/^Unavailable: /, ""),
          requestedScaleProof: "FAIL",
        });
        await page.close();
        continue;
      }
      assert.equal(status, "Session admitted. Load target evidence.");
      assert.ok(target.imagePath, `local publisher evidence required for admitted custom target ${target.sku}`);
      await page.locator("#contractFile").setInputFiles(path.resolve(target.imagePath));
      await page.locator("#contractWorkspace").waitFor({ state: "visible" });
      const customSurface = page.locator("#contractTapSurface");
      const customBox = await customSurface.boundingBox();
      assert.ok(customBox && customBox.width > 100 && customBox.height > 100);
      await page.getByRole("button", { name: "Mark Aim" }).click();
      await customSurface.click({ position: { x: customBox.width * .5, y: customBox.height * .5 } });
      await customSurface.click({ position: { x: customBox.width * .42, y: customBox.height * .44 } });
      await customSurface.click({ position: { x: customBox.width * .57, y: customBox.height * .51 } });
      await customSurface.click({ position: { x: customBox.width * .48, y: customBox.height * .58 } });
      await page.getByRole("button", { name: "Show Result" }).click();
      await page.waitForTimeout(400);
      const resultStatus = await page.locator("#contractStatus").textContent();
      assert.match(resultStatus || "", /^Result unavailable: /);
      outcomes.push({
        ordinal: target.ordinal,
        publisher: target.publisher,
        sku: target.sku,
        productName: target.productName,
        targetProfileId: target.targetProfileId,
        roadUrl: url,
        contractAdmission: "session_admitted_without_shared_execution_contract",
        stoppedAt: "SHOW_RESULTS",
        exactReason: String(resultStatus).replace(/^Result unavailable: /, ""),
        requestedScaleProof: "FAIL",
      });
      await page.close();
      continue;
    }

    assert.equal(contract.missionFamily, "smartEvidenceCapture");
    assert.ok(target.imagePath, `local publisher evidence required for admitted target ${target.sku}`);
    await page.getByText(target.productName, { exact: false }).waitFor();
    await page.locator("#contractFile").setInputFiles(path.resolve(target.imagePath));
    await page.locator("#contractWorkspace").waitFor({ state: "visible" });
    const surface = page.locator("#contractTapSurface");
    const box = await surface.boundingBox();
    assert.ok(box && box.width > 100 && box.height > 100);
    await page.getByRole("button", { name: "Mark Aim" }).click();
    await surface.click({ position: { x: box.width * .5, y: box.height * .5 } });
    await surface.click({ position: { x: box.width * .42, y: box.height * .44 } });
    await surface.click({ position: { x: box.width * .57, y: box.height * .51 } });
    await surface.click({ position: { x: box.width * .48, y: box.height * .58 } });
    await page.getByRole("button", { name: "Show Result" }).click();
    await page.getByText("Evidence Recorded", { exact: true }).waitFor();
    const secText = await page.locator("#contractSecRoot").innerText();
    assert.match(secText, new RegExp(`${target.productName} · SKU ${target.sku}`));
    assert.match(secText, /3 shot observations/);
    assert.match(secText, /Scoring:\s+Not applicable/);
    await page.getByRole("button", { name: "Save SEC" }).click();
    await page.getByText("SEC preserved. Exact reopen available.", { exact: true }).waitFor();
    const href = await page.getByRole("link", { name: "Exact Reopen" }).getAttribute("href");
    assert.ok(href && href.includes("session="));
    const sessionId = new URL(href, `${origin}/`).searchParams.get("session");
    const preservedResponse = await fetch(`${authorityOrigin}/api/session/sec?session=${encodeURIComponent(sessionId)}`);
    assert.equal(preservedResponse.status, 200);
    const preserved = await preservedResponse.json();
    assert.equal(preserved.session.authorityPackage.target.product.sku, target.sku);
    assert.equal(preserved.session.authorityPackage.scoring.status, "not_applicable");
    await page.goto(new URL(href, `${origin}/`).href, { waitUntil: "domcontentloaded" });
    await page.locator("#contractSecView").waitFor({ state: "visible" });
    assert.equal(await page.locator("#contractStatus").textContent(), "Exact preserved SEC reopened.");
    assert.equal(await page.locator(".contract-observation-marker").count(), 3);
    assert.equal(await page.locator(".contract-aim-marker").count(), 1);
    await Promise.all([
      page.waitForURL(/\/records\.html$/),
      page.getByRole("link", { name: "Ballistic Vault" }).click(),
    ]);
    await page.getByRole("heading", { name: "BALLISTIC VAULT", exact: true }).waitFor();
    const vaultResponse = await fetch(`${authorityOrigin}/api/session/sec`);
    assert.equal(vaultResponse.status, 200);
    const vault = await vaultResponse.json();
    assert.ok(vault.sessions.some(item => item.sessionId === sessionId));
    outcomes.push({
      ordinal: target.ordinal,
      publisher: target.publisher,
      sku: target.sku,
      productName: target.productName,
      targetProfileId: target.targetProfileId,
      roadUrl: url,
      contractAdmission: "admitted",
      missionFamily: contract.missionFamily,
      renderedResult: "Evidence Recorded",
      scoringStatus: "not_applicable",
      secPreserved: true,
      exactReopen: true,
      ballisticVault: true,
      requestedScaleProof: "FAIL_AT_SCORE",
      exactReason: "shared contract expresses evidence capture only; target scoring behavior is not connected",
      artifactSha256: preserved.artifactSha256,
    });
    await page.close();
  }
} finally {
  await browser.close();
}

assert.equal(outcomes.length, 9);
assert.equal(outcomes.filter(item => item.contractAdmission === "admitted").length, 5);
assert.equal(outcomes.filter(item => item.contractAdmission === "admitted").length, 5);
assert.equal(outcomes.filter(item => item.contractAdmission !== "admitted").length, 4);
assert.equal(outcomes.filter(item => item.requestedScaleProof === "PASS").length, 0);
console.log(`TARGET_DATA_ONE_ROAD_RESULTS=${JSON.stringify(outcomes)}`);
console.log("PASS: cohort experiment completed honestly; 5/9 reached evidence SEC/reopen, 4/9 stopped at contract admission, 0/9 completed the requested scored road");
